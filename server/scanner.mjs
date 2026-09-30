import fs from "node:fs/promises";
import path from "node:path";
import { execute, queryOne } from "./db.mjs";

const VIDEO_EXTENSIONS = new Set([".mkv", ".mp4", ".m4v", ".avi", ".mov", ".webm", ".ts"]);
const SUBTITLE_EXTENSIONS = new Set([".srt", ".vtt"]);

function normalizeName(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[._]+/g, " ")
    .replace(/\b(2160p|1080p|720p|4k|bluray|web[- ]?dl|webrip|x264|x265|h264|h265)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(base).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) return null;

  const episode = base.match(/\bS(\d{1,2})E(\d{1,3})\b/i);
  if (episode) {
    const season = Number(episode[1]);
    const ep = Number(episode[2]);
    const before = base.slice(0, episode.index);
    return { type: "episode", title: normalizeName(before), season, episode: ep, ext };
  }

  const year = base.match(/\b((?:19|20)\d{2})\b/);
  return {
    type: "movie",
    title: normalizeName(year ? base.slice(0, year.index) : base),
    year: year ? Number(year[1]) : null,
    ext,
  };
}

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

export async function scanLibrary(folders) {
  const run = execute("INSERT INTO scan_runs (status) VALUES (?)", ["running"]);
  const runId = Number(run.lastInsertRowid);
  let seen = 0, added = 0, updated = 0, review = 0;
  const scannedPaths = new Set();

  try {
    for (const folder of folders) {
      const root = path.resolve(folder);
      let files = [];
      try { files = await walk(root); } catch { continue; }

      for (const filePath of files) {
        const parsed = parseFile(filePath);
        if (!parsed) continue;
        seen++;
        scannedPaths.add(filePath);
        const stat = await fs.stat(filePath);
        const existing = queryOne("SELECT id, size, mtime_ms FROM media_files WHERE path = ?", [filePath]);

        if (existing) {
          if (existing.size !== stat.size || existing.mtime_ms !== stat.mtimeMs) {
            execute("UPDATE media_files SET size=?, mtime_ms=?, available=1, updated_at=CURRENT_TIMESTAMP WHERE id=?",
              [stat.size, stat.mtimeMs, existing.id]);
            updated++;
          } else {
            execute("UPDATE media_files SET available=1 WHERE id=?", [existing.id]);
          }
          continue;
        }

        if (!parsed.title) {
          execute("INSERT OR IGNORE INTO scan_review (path, reason) VALUES (?, ?)",
            [filePath, "Nome não pôde ser identificado com segurança"]);
          review++;
          continue;
        }

        let titleId;
        if (parsed.type === "movie") {
          let title = queryOne(
            "SELECT id FROM titles WHERE type='movie' AND lower(title)=lower(?) AND (year=? OR (year IS NULL AND ? IS NULL))",
            [parsed.title, parsed.year, parsed.year],
          );
          if (!title) {
            const result = execute(
              "INSERT INTO titles (type,title,year) VALUES ('movie',?,?)",
              [parsed.title, parsed.year],
            );
            titleId = Number(result.lastInsertRowid);
          } else {
            titleId = title.id;
          }
        } else {
          let title = queryOne("SELECT id FROM titles WHERE type='series' AND lower(title)=lower(?)", [parsed.title]);
          if (!title) {
            const result = execute("INSERT INTO titles (type,title) VALUES ('series',?)", [parsed.title]);
            title = { id: Number(result.lastInsertRowid) };
          }
          titleId = title.id;
          let season = queryOne("SELECT id FROM seasons WHERE title_id=? AND season_number=?", [titleId, parsed.season]);
          if (!season) {
            const result = execute("INSERT INTO seasons (title_id,season_number,name) VALUES (?,?,?)",
              [titleId, parsed.season, `Temporada ${parsed.season}`]);
            season = { id: Number(result.lastInsertRowid) };
          }
          execute(
            "INSERT INTO media_files (title_id,season_id,episode_number,path,kind,size,mtime_ms,mime_type) VALUES (?,?,?,?,?,?,?,?)",
            [titleId, season.id, parsed.episode, filePath, parsed.type, stat.size, stat.mtimeMs, mimeFor(parsed.ext)],
          );
          added++;
          continue;
        }

        execute(
          "INSERT INTO media_files (title_id,path,kind,size,mtime_ms,mime_type) VALUES (?,?,?,?,?,?)",
          [titleId, filePath, parsed.type, stat.size, stat.mtimeMs, mimeFor(parsed.ext)],
        );
        added++;
      }
    }

    for (const folder of folders) {
      const root = path.resolve(folder);
      const existing = await walk(root).catch(() => []);
      for (const candidate of existing) {
        if (!scannedPaths.has(candidate)) {
          execute("UPDATE media_files SET available=0 WHERE path=?", [candidate]);
        }
      }
    }
    execute(
      "UPDATE scan_runs SET finished_at=CURRENT_TIMESTAMP,status='completed',files_seen=?,files_added=?,files_updated=?,review_count=? WHERE id=?",
      [seen, added, updated, review, runId],
    );
    return { runId, seen, added, updated, review };
  } catch (error) {
    execute("UPDATE scan_runs SET finished_at=CURRENT_TIMESTAMP,status='failed',error=? WHERE id=?",
      [String(error), runId]);
    throw error;
  }
}

function mimeFor(ext) {
  return ({ ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".mkv": "video/x-matroska", ".avi": "video/x-msvideo", ".ts": "video/mp2t" })[ext] || "application/octet-stream";
}
