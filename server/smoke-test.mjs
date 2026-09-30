import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const base = fs.mkdtempSync(path.join(os.tmpdir(), "cinecasa-smoke-"));
const mediaRoot = path.join(base, "media");
const dataRoot = path.join(base, "data");
fs.mkdirSync(mediaRoot);
fs.mkdirSync(dataRoot);
const mediaFile = path.join(mediaRoot, "Interestelar (2014).mp4");
const episodeOne = path.join(mediaRoot, "Breaking.Bad.S01E01.1080p.mp4");
const episodeTwo = path.join(mediaRoot, "Breaking.Bad.S01E02.1080p.mp4");
fs.writeFileSync(mediaFile, Buffer.from("CINECASA-SMOKE-TEST"));
fs.writeFileSync(episodeOne, Buffer.from("EPISODE-ONE"));
fs.writeFileSync(episodeTwo, Buffer.from("EPISODE-TWO"));

const port = 18420 + Math.floor(Math.random() * 500);
const child = spawn(process.execPath, ["server/index.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    CINECASA_PORT: String(port),
    CINECASA_HOST: "127.0.0.1",
    CINECASA_MEDIA_ROOTS: mediaRoot,
    CINECASA_DATA_DIR: dataRoot,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk.toString(); });
child.stderr.on("data", (chunk) => { logs += chunk.toString(); });

const baseUrl = "http://127.0.0.1:" + port;

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(baseUrl + "/api/health");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Servidor não iniciou. Logs: " + logs);
}

async function expect(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await waitForHealth();

  const blocked = await fetch(baseUrl + "/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folders: [base] }),
  });
  await expect(blocked.status === 403, "Scan fora da raiz autorizada deveria retornar 403");

  const scan = await fetch(baseUrl + "/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folders: [mediaRoot] }),
  });
  await expect(scan.ok, "Scan autorizado falhou: " + await scan.text());
  const scanResult = await scan.json();
  await expect(scanResult.added === 3, "Scan deveria adicionar exatamente 3 arquivos");

  const catalog = await fetch(baseUrl + "/api/catalog");
  const titles = await catalog.json();
  await expect(titles.length === 2, "Catálogo deveria conter o filme e a série");
  const movie = titles.find((title) => title.type === "movie");
  const series = titles.find((title) => title.type === "series");
  await expect(movie?.title === "Interestelar", "Catálogo não reconheceu o filme");
  await expect(series?.title === "Breaking Bad", "Catálogo não reconheceu a série");

  const episodes = await fetch(baseUrl + "/api/series/" + series.id + "/episodes");
  const episodeList = await episodes.json();
  await expect(episodes.ok && episodeList.length === 2 && episodeList[0].episode_number === 1 && episodeList[1].episode_number === 2, "Endpoint de episódios inválido");

  const mediaId = movie.media_file_id;
  await expect(Number.isInteger(mediaId), "Catálogo não retornou media_file_id");

  const head = await fetch(baseUrl + "/api/media/" + mediaId, { method: "HEAD" });
  await expect(head.ok && Number(head.headers.get("content-length")) === fs.statSync(mediaFile).size, "HEAD do vídeo inválido");

  const range = await fetch(baseUrl + "/api/media/" + mediaId, {
    headers: { Range: "bytes=0-4" },
  });
  await expect(range.status === 206, "Streaming Range deveria retornar 206");
  await expect((await range.text()) === "CINEC", "Conteúdo do Range incorreto");

  const invalidProgress = await fetch(baseUrl + "/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId: 999, mediaFileId: mediaId, positionSeconds: 1 }),
  });
  await expect(invalidProgress.status === 404, "Perfil inexistente deveria retornar 404");

  const progress = await fetch(baseUrl + "/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId: 1, mediaFileId: mediaId, positionSeconds: 42, durationSeconds: 120 }),
  });
  await expect(progress.status === 204, "Salvar progresso falhou");

  const saved = await fetch(baseUrl + "/api/progress?profileId=1&mediaFileId=" + mediaId);
  const savedData = await saved.json();
  await expect(savedData.position_seconds === 42, "Progresso não foi persistido");

  fs.unlinkSync(mediaFile);
  fs.unlinkSync(episodeOne);
  fs.unlinkSync(episodeTwo);
  const rescan = await fetch(baseUrl + "/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folders: [mediaRoot] }),
  });
  const rescanResult = await rescan.json();
  await expect(rescan.ok && rescanResult.missing === 3, "Revarredura deveria marcar os arquivos como ausentes");

  console.log("CineCasa smoke test: OK");
} finally {
  child.kill();
  fs.rmSync(base, { recursive: true, force: true });
}
