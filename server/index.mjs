import http from "node:http";
import path from "node:path";
import { execute, queryAll, queryOne } from "./db.mjs";
import { scanLibrary } from "./scanner.mjs";
import { streamMedia } from "./media.mjs";

const PORT = Number(process.env.CINECASA_PORT || 8420);
const HOST = process.env.CINECASA_HOST || "0.0.0.0";

function json(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  response.end(JSON.stringify(payload));
}

function body(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", chunk => raw += chunk);
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON inválido")); }
    });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const { pathname } = url;

    if (request.method === "OPTIONS") return json(response, 204, {});

    if (pathname === "/api/health") {
      return json(response, 200, { ok: true, service: "CineCasa Server", version: "0.1.0" });
    }

    if (pathname === "/api/catalog") {
      const rows = queryAll(`
        SELECT t.id,t.type,t.title,t.original_title,t.year,t.overview,t.poster_path,t.backdrop_path,
               COUNT(m.id) AS file_count
        FROM titles t LEFT JOIN media_files m ON m.title_id=t.id AND m.available=1
        GROUP BY t.id ORDER BY t.updated_at DESC,t.title COLLATE NOCASE
      `);
      return json(response, 200, rows);
    }

    if (pathname === "/api/profiles") {
      return json(response, 200, queryAll("SELECT id,name,avatar FROM profiles ORDER BY id"));
    }

    if (pathname === "/api/settings" && request.method === "GET") {
      return json(response, 200, queryAll("SELECT key,value FROM settings ORDER BY key"));
    }

    if (pathname === "/api/scan" && request.method === "POST") {
      const payload = await body(request);
      const folders = Array.isArray(payload.folders) ? payload.folders.map(String) : [];
      if (!folders.length) return json(response, 400, { error: "Informe ao menos uma pasta" });
      const result = await scanLibrary(folders);
      return json(response, 200, result);
    }

    const mediaMatch = pathname.match(/^\/api\/media\/(\d+)$/);
    if (mediaMatch && request.method === "GET") {
      return streamMedia(request, response, Number(mediaMatch[1]));
    }

    if (pathname === "/api/progress" && request.method === "POST") {
      const payload = await body(request);
      if (!payload.profileId || !payload.mediaFileId) return json(response, 400, { error: "profileId e mediaFileId são obrigatórios" });
      execute(
        `INSERT INTO progress(profile_id,media_file_id,position_seconds,duration_seconds,completed)
         VALUES (?,?,?,?,?)
         ON CONFLICT(profile_id,media_file_id) DO UPDATE SET position_seconds=excluded.position_seconds,
         duration_seconds=excluded.duration_seconds,completed=excluded.completed,updated_at=CURRENT_TIMESTAMP`,
        [payload.profileId, payload.mediaFileId, Number(payload.positionSeconds || 0), payload.durationSeconds == null ? null : Number(payload.durationSeconds), payload.completed ? 1 : 0],
      );
      return json(response, 204, {});
    }

    return json(response, 404, { error: "Rota não encontrada" });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: "Erro interno do servidor" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CineCasa Server ouvindo em http://localhost:${PORT}`);
  console.log(`Biblioteca autorizada: ${path.resolve(process.env.CINECASA_MEDIA_ROOT || process.cwd())}`);
});
