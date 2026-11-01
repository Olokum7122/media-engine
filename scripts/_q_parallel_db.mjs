// ¿Qué hay realmente en Atlx_Media_Engine? ¿Y cómo usa sp_media_get_by_id las
// columnas de processing_job?
import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
    .split('\n').filter((l) => /^[A-Z_]+=/.test(l.trim()))
    .map((l) => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      if (/^["']/.test(val) && val.length > 1) val = val.slice(1, -1);
      return [key, val];
    })
);

const mk = (db) => new sql.ConnectionPool({
  server: env.ME_SQL_HOST, port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER, password: env.ME_SQL_PASSWORD, database: db,
  options: { encrypt: false, trustServerCertificate: true }, requestTimeout: 30000,
}).connect();

const poolA = await mk(env.ME_SQL_DATABASE);
const q = async (label, query, p = poolA) => {
  try { const r = await p.request().query(query); console.log(`\n### ${label}`); console.log(JSON.stringify(r.recordset)); }
  catch (e) { console.log(`\n### ${label} ERR: ${e.message}`); }
};

await q('tablas de la base paralela', `
  SELECT s.name esquema, t.name tabla,
         (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id=t.object_id AND p.index_id IN (0,1)) filas
  FROM Atlx_Media_Engine.sys.tables t
  JOIN Atlx_Media_Engine.sys.schemas s ON s.schema_id=t.schema_id
  ORDER BY s.name, t.name`);

await q('definicion de sp_media_get_by_id (job)', `
  SELECT OBJECT_DEFINITION(OBJECT_ID(N'me.sp_media_get_by_id')) d`);

await poolA.close();
