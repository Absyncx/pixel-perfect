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
               COUNT(m.id) AS file_count,
               (SELECT mf.id FROM media_files mf WHERE mf.title_id=t.id AND mf.available=1 ORDER BY mf.season_id IS NOT NULL, mf.season_id, mf.episode_number, mf.id LIMIT 1) AS media_file_id
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

    if (pathname === "/api/progress" && request.method === "GET") {
      const profileId = Number(url.searchParams.get("profileId") || 1);
      const mediaFileId = Number(url.searchParams.get("mediaFileId") || 0);
      if (!mediaFileId) return json(response, 400, { error: "mediaFileId é obrigatório" });
      return json(response, 200, queryOne(
        "SELECT position_seconds,duration_seconds,completed,updated_at FROM progress WHERE profile_id=? AND media_file_id=?",
        [profileId, mediaFileId],
      ) || { position_seconds: 0, duration_seconds: null, completed: 0, updated_at: null });
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
