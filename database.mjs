import { DatabaseSync } from 'node:sqlite';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function openCatalog(directory) {
  const db = new DatabaseSync(path.join(directory, 'catalog.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Ebook','Aplikasi','File')),
      description TEXT NOT NULL DEFAULT '', version TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL CHECK(size > 0), sha256 TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS files_category_created ON files(category, createdAt DESC);
    PRAGMA user_version=1;`);
  const insert = db.prepare('INSERT INTO files (id,name,title,category,description,version,size,sha256,createdAt) VALUES (?,?,?,?,?,?,?,?,?)');
  const get = db.prepare('SELECT * FROM files WHERE id=?');
  const add = file => insert.run(file.id,file.name,file.title,file.category,file.description,file.version,file.size,file.sha256,file.createdAt);
  try {
    // Legacy JSON is retained as a recovery copy; primary keys make restart migration idempotent.
    db.exec('BEGIN IMMEDIATE');
    for (const name of await fs.readdir(directory)) {
      if (!/^[a-f0-9-]{36}\.json$/.test(name)) continue;
      const file = JSON.parse(await fs.readFile(path.join(directory,name),'utf8'));
      if (file.id !== name.slice(0,-5) || !/^[a-f0-9-]{36}$/.test(file.id)) throw new Error('Invalid legacy file ID');
      if (get.get(file.id)) continue;
      const stat = await fs.stat(path.join(directory,file.id+'.bin'));
      if (stat.size !== file.size) throw new Error('Legacy file size mismatch');
      const category = file.category==='Modul'?'Ebook':file.category==='Praktik'?'File':file.category;
      add({...file,category,description:file.description||'',version:file.version||''});
    }
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); db.close(); throw error; }
  return {
    list: () => db.prepare('SELECT * FROM files ORDER BY createdAt DESC').all(),
    get: id => get.get(id),
    add,
    healthy: () => db.prepare('SELECT 1 AS ok').get().ok===1,
    close: () => db.close()
  };
}
