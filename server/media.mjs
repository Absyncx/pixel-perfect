import fs from "node:fs";
import path from "node:path";
import { queryOne } from "./db.mjs";

function getMediaRoots() {
  return (process.env.CINECASA_MEDIA_ROOTS || process.env.CINECASA_MEDIA_ROOT || process.cwd())
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try { return fs.realpathSync(path.resolve(value)); } catch { return path.resolve(value); }
    });
}

function isAllowedPath(target, roots) {
  return roots.some((root) => target === root || target.startsWith(root + path.sep));
}

export function streamMedia(request, response, mediaId) {
  const media = queryOne("SELECT path,size,mime_type,available FROM media_files WHERE id=?", [mediaId]);
  if (!media || !media.available) return send(response, 404, { error: "Arquivo indisponível" });

  let target;
  try {
    target = fs.realpathSync(path.resolve(media.path));
  } catch {
    return send(response, 404, { error: "Arquivo não encontrado" });
  }

  if (!isAllowedPath(target, getMediaRoots())) {
    return send(response, 403, { error: "Arquivo fora das pastas autorizadas" });
  }

  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return send(response, 404, { error: "Arquivo não encontrado" });
  }

  const size = stat.size;
  const range = request.headers.range;

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
  response.setHeader("Access-Control-Expose-Headers", "Accept-Ranges, Content-Length, Content-Range, Content-Type");
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", media.mime_type || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "HEAD") {
    response.writeHead(200, { "Content-Length": size });
    response.end();
    return;
  }

  if (!range) {
    response.writeHead(200, { "Content-Length": size });
    fs.createReadStream(target).pipe(response);
    return;
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return rangeError(response, size);
  const start = match[1] === "" ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    return rangeError(response, size);
  }

  response.writeHead(206, {
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${size}`,
  });
  fs.createReadStream(target, { start, end }).pipe(response);
}

function rangeError(response, size) {
  response.writeHead(416, {
    "Content-Range": `bytes */${size}`,
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ error: "Range fora dos limites" }));
}

function send(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(payload));
}
