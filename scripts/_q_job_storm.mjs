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
await q('jobs done por dia', `SELECT CONVERT(date, created_at) d, COUNT(*) n, COUNT(DISTINCT media_id) medios
  FROM me.processing_job WHERE status=N'done' GROUP BY CONVERT(date, created_at) ORDER BY d DESC;`);
await q('top media con mas jobs', `SELECT TOP 8 media_id, COUNT(*) jobs, COUNT(DISTINCT job_type) tipos
  FROM me.processing_job GROUP BY media_id ORDER BY jobs DESC;`);
await q('jobs por tipo', `SELECT job_type, status, COUNT(*) n FROM me.processing_job GROUP BY job_type, status ORDER BY n DESC;`);
await pool.close();
