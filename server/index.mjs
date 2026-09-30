import http from "node:http";
import { execute, queryAll, queryOne } from "./db.mjs";
import { getMediaRoots, isAuthorizedScanFolder, scanLibrary } from "./scanner.mjs";
import { streamMedia } from "./media.mjs";

const PORT = Number(process.env.CINECASA_PORT || 8420);
const HOST = process.env.CINECASA_HOST || "0.0.0.0";

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Range",
  });
  if (status === 204) return response.end();
  response.end(JSON.stringify(payload));
}

function body(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    request.on("data", chunk => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Corpo da requisição excede 1 MB"));
        request.destroy();
        return;
      }
      raw += chunk;
    });
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

    const seriesEpisodesMatch = pathname.match(/^\/api\/series\/(\\d+)\/episodes$/);
    if (seriesEpisodesMatch && request.method === "GET") {
      const titleId = Number(seriesEpisodesMatch[1]);
      if (!Number.isInteger(titleId) || titleId <= 0) {
        return json(response, 400, { error: "titleId deve ser um inteiro positivo" });
      }
      if (!queryOne("SELECT id FROM titles WHERE id=? AND type='series'", [titleId])) {
        return json(response, 404, { error: "Série não encontrada" });
      }
      return json(response, 200, queryAll(
        `SELECT s.season_number,m.episode_number,m.id AS media_file_id
         FROM media_files m
         JOIN seasons s ON s.id=m.season_id
         WHERE m.title_id=? AND m.kind='episode' AND m.available=1
         ORDER BY s.season_number,m.episode_number,m.id`,
        [titleId],
      ));
    }

    if (pathname === "/api/my-list" && request.method === "GET") {
      const profileId = Number(url.searchParams.get("profileId") || 0);
      if (!Number.isInteger(profileId) || profileId <= 0) {
        return json(response, 400, { error: "profileId deve ser um inteiro positivo" });
      }
      return json(response, 200, queryAll(`
        SELECT t.id,t.type,t.title,t.original_title,t.year,t.overview,t.poster_path,t.backdrop_path,
               COUNT(m.id) AS file_count,
               (SELECT mf.id FROM media_files mf WHERE mf.title_id=t.id AND mf.available=1
                ORDER BY mf.season_id IS NOT NULL, mf.season_id, mf.episode_number, mf.id LIMIT 1) AS media_file_id
        FROM my_list ml
        JOIN titles t ON t.id=ml.title_id
        LEFT JOIN media_files m ON m.title_id=t.id AND m.available=1
        WHERE ml.profile_id=?
        GROUP BY t.id
        ORDER BY ml.created_at DESC
      `, [profileId]));
    }

    if (pathname === "/api/my-list" && request.method === "POST") {
      const payload = await body(request);
      const profileId = Number(payload.profileId);
      const titleId = Number(payload.titleId);
      if (!Number.isInteger(profileId) || profileId <= 0 || !Number.isInteger(titleId) || titleId <= 0) {
        return json(response, 400, { error: "profileId e titleId devem ser inteiros positivos" });
      }
      if (!queryOne("SELECT id FROM profiles WHERE id=?", [profileId])) {
        return json(response, 404, { error: "Perfil não encontrado" });
      }
      if (!queryOne("SELECT id FROM titles WHERE id=?", [titleId])) {
        return json(response, 404, { error: "Título não encontrado" });
      }
      execute("INSERT OR IGNORE INTO my_list(profile_id,title_id) VALUES (?,?)", [profileId, titleId]);
      return json(response, 200, { ok: true });
    }

    if (pathname === "/api/my-list" && request.method === "DELETE") {
      const profileId = Number(url.searchParams.get("profileId") || 0);
      const titleId = Number(url.searchParams.get("titleId") || 0);
      if (!Number.isInteger(profileId) || profileId <= 0 || !Number.isInteger(titleId) || titleId <= 0) {
        return json(response, 400, { error: "profileId e titleId devem ser inteiros positivos" });
      }
      execute("DELETE FROM my_list WHERE profile_id=? AND title_id=?", [profileId, titleId]);
      return json(response, 200, { ok: true });
    }

    if (pathname === "/api/scan" && request.method === "POST") {
      const payload = await body(request);
      const folders = Array.isArray(payload.folders)
        ? payload.folders.map((folder) => String(folder).trim()).filter(Boolean)
        : [];
      if (!folders.length) return json(response, 400, { error: "Informe ao menos uma pasta" });

      const roots = getMediaRoots();
      for (const folder of folders) {
        if (!isAuthorizedScanFolder(folder, roots)) {
          return json(response, 403, {
            error: "A pasta de varredura precisa estar dentro de uma raiz de mídia autorizada",
            authorizedRoots: roots,
          });
        }
      }

      const adminToken = process.env.CINECASA_ADMIN_TOKEN;
      if (adminToken && request.headers.authorization !== `Bearer ${adminToken}`) {
        return json(response, 401, { error: "Autorização de administrador necessária" });
      }

      const result = await scanLibrary(folders);
      return json(response, 200, result);
    }

    const mediaMatch = pathname.match(/^\/api\/media\/(\d+)$/);
    if (mediaMatch && (request.method === "GET" || request.method === "HEAD")) {
      return streamMedia(request, response, Number(mediaMatch[1]));
    }

    if (pathname === "/api/progress" && request.method === "GET") {
      const profileId = Number(url.searchParams.get("profileId") || 1);
      const mediaFileId = Number(url.searchParams.get("mediaFileId") || 0);
      if (!Number.isInteger(profileId) || profileId <= 0) {
        return json(response, 400, { error: "profileId deve ser um inteiro positivo" });
      }
      if (!Number.isInteger(mediaFileId) || mediaFileId <= 0) {
        return json(response, 400, { error: "mediaFileId deve ser um inteiro positivo" });
      }
      return json(response, 200, queryOne(
        "SELECT position_seconds,duration_seconds,completed,updated_at FROM progress WHERE profile_id=? AND media_file_id=?",
        [profileId, mediaFileId],
      ) || { position_seconds: 0, duration_seconds: null, completed: 0, updated_at: null });
    }

    if (pathname === "/api/progress" && request.method === "POST") {
      const payload = await body(request);
      const profileId = Number(payload.profileId);
      const mediaFileId = Number(payload.mediaFileId);
      const positionSeconds = Number(payload.positionSeconds ?? 0);
      const durationSeconds = payload.durationSeconds == null ? null : Number(payload.durationSeconds);

      if (!Number.isInteger(profileId) || profileId <= 0 || !Number.isInteger(mediaFileId) || mediaFileId <= 0) {
        return json(response, 400, { error: "profileId e mediaFileId devem ser inteiros positivos" });
      }
      if (!queryOne("SELECT id FROM profiles WHERE id=?", [profileId])) {
        return json(response, 404, { error: "Perfil não encontrado" });
      }
      if (!queryOne("SELECT id FROM media_files WHERE id=?", [mediaFileId])) {
        return json(response, 404, { error: "Arquivo de mídia não encontrado" });
      }
      if (!Number.isFinite(positionSeconds) || positionSeconds < 0 || (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds < 0))) {
        return json(response, 400, { error: "Valores de progresso inválidos" });
      }
      execute(
        `INSERT INTO progress(profile_id,media_file_id,position_seconds,duration_seconds,completed)
         VALUES (?,?,?,?,?)
         ON CONFLICT(profile_id,media_file_id) DO UPDATE SET position_seconds=excluded.position_seconds,
         duration_seconds=excluded.duration_seconds,completed=excluded.completed,updated_at=CURRENT_TIMESTAMP`,
        [profileId, mediaFileId, positionSeconds, durationSeconds, payload.completed ? 1 : 0],
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
  console.log(`CineCasa Server ouvindo em http://${HOST}:${PORT}`);
  console.log(`Bibliotecas autorizadas: ${getMediaRoots().join("; ")}`);
});
