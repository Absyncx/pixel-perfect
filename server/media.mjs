import fs from "node:fs";
import path from "node:path";
import { queryOne } from "./db.mjs";

export function streamMedia(request, response, mediaId) {
  const media = queryOne("SELECT path,size,mime_type,available FROM media_files WHERE id=?", [mediaId]);
  if (!media || !media.available) return send(response, 404, { error: "Arquivo indisponível" });

  const root = path.resolve(process.env.CINECASA_MEDIA_ROOT || process.cwd());
  const target = path.resolve(media.path);
  if (!target.startsWith(root + path.sep) && target !== root) {
    return send(response, 403, { error: "Arquivo fora das pastas autorizadas" });
  }
  if (!fs.existsSync(target)) return send(response, 404, { error: "Arquivo não encontrado" });

  const size = fs.statSync(target).size;
  const range = request.headers.range;
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", media.mime_type || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");

  if (!range) {
    response.writeHead(200, { "Content-Length": size });
    fs.createReadStream(target).pipe(response);
    return;
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) return send(response, 416, { error: "Range inválido" });
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start > end || start >= size) return send(response, 416, { error: "Range fora dos limites" });

  response.writeHead(206, {
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${size}`,
  });
  fs.createReadStream(target, { start, end }).pipe(response);
}

function send(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
