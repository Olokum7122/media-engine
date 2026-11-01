import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
  .split('\n').filter((l) => /^[A-Z_]+=/.test(l.trim()))
  .map((l) => { const i = l.indexOf('='); const k = l.slice(0, i).trim(); let v = l.slice(i + 1).trim();
    if (/^["']/.test(v) && v.length > 1) v = v.slice(1, -1); return [k, v]; }));
const pool = await new sql.ConnectionPool({ server: env.ME_SQL_HOST, port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER, password: env.ME_SQL_PASSWORD, database: env.ME_SQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true }, requestTimeout: 60000 }).connect();
const q = async (l, t) => { const r = await pool.request().query(t); console.log(`\n=== ${l} ===\n` + JSON.stringify(r.recordset, null, 1)); };
await q('columnas processing_job', `SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(N'me.processing_job') ORDER BY column_id;`);
await q('indices processing_job', `SELECT i.name, i.is_unique, STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols
  FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0
  JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=ic.column_id
  WHERE i.object_id=OBJECT_ID(N'me.processing_job') AND i.type>0 GROUP BY i.name, i.is_unique;`);
await q('indices media_variant', `SELECT i.name, i.is_unique, STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols
  FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0
  JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=ic.column_id
  WHERE i.object_id=OBJECT_ID(N'me.media_variant') AND i.type>0 GROUP BY i.name, i.is_unique;`);
await q('cola por status', `SELECT status, COUNT(*) n, MIN(next_attempt_at) mas_viejo FROM me.processing_job GROUP BY status;`);
await q('parametros pick_next', `SELECT p.name, t.name AS tipo FROM sys.parameters p JOIN sys.types t ON t.user_type_id=p.user_type_id
  WHERE p.object_id=OBJECT_ID(N'me.sp_media_job_pick_next') ORDER BY p.parameter_id;`);
await pool.close();
