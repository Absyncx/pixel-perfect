import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = process.env.CINECASA_DATA_DIR || path.resolve("data");
const DB_PATH = path.join(DATA_DIR, "cinecasa.sqlite");
const SCHEMA_PATH = path.resolve("server", "schema.sql");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
db.exec("INSERT OR IGNORE INTO profiles (id,name,avatar) VALUES (1,'Breno',NULL)");
db.exec("INSERT OR IGNORE INTO profiles (id,name,avatar) VALUES (2,'Esposa',NULL)");

export function queryAll(sql, params = []) {
  return db.prepare(sql).all(...params);
}

export function queryOne(sql, params = []) {
  return db.prepare(sql).get(...params);
}

export function execute(sql, params = []) {
  return db.prepare(sql).run(...params);
}

export function closeDb() {
  db.close();
}
