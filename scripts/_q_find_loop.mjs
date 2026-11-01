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
await q('los dos medios del bucle', `SELECT media_id, source_app, source_actor_id, channel, media_type, status,
  created_at, ready_at, updated_at, payload_version, error_code
  FROM me.media_request WHERE media_id IN ('980B694F-822A-40C4-853D-43F5405036B6','DD16D886-29C6-4FD9-961D-BEA500ED619E');`);
await q('ventana de sus jobs', `SELECT media_id, MIN(created_at) primero, MAX(created_at) ultimo, MIN(finished_at) fin_min, MAX(finished_at) fin_max
  FROM me.processing_job WHERE media_id IN ('980B694F-822A-40C4-853D-43F5405036B6','DD16D886-29C6-4FD9-961D-BEA500ED619E') GROUP BY media_id;`);
await q('jobs done por dia (todo)', `SELECT CONVERT(date, created_at) d, COUNT(*) n FROM me.processing_job GROUP BY CONVERT(date, created_at) ORDER BY d DESC;`);
await q('eventos de esos medios', `SELECT media_id, event_code, COUNT(*) n, MIN(created_at) primero, MAX(created_at) ultimo
  FROM me.media_event_log WHERE media_id IN ('980B694F-822A-40C4-853D-43F5405036B6','DD16D886-29C6-4FD9-961D-BEA500ED619E')
  GROUP BY media_id, event_code ORDER BY n DESC;`);
await q('variantes de esos medios', `SELECT media_id, variant_code, is_public, created_at FROM me.media_variant
  WHERE media_id IN ('980B694F-822A-40C4-853D-43F5405036B6','DD16D886-29C6-4FD9-961D-BEA500ED619E') ORDER BY media_id, variant_code;`);
await pool.close();
