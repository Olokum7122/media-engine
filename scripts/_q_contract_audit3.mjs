// Auditoría de sólo lectura (parte 3): estado de la guarda, columnas muertas y drift.
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

const pool = await new sql.ConnectionPool({
  server: env.ME_SQL_HOST, port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER, password: env.ME_SQL_PASSWORD,
  database: env.ME_SQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 30000,
}).connect();

const q = async (label, query) => {
  try {
    const r = await pool.request().query(query);
    console.log(`\n### ${label}`);
    console.log(JSON.stringify(r.recordset, null, 0));
  } catch (e) { console.log(`\n### ${label} ERR: ${e.message}`); }
};

// Config relevante (patrón ME_*)
await q('vars guard/queue en .env', `SELECT 1 AS x`);
await q('columnas channel/post en processing_job pobladas?', `
  SELECT COUNT(*) total,
         SUM(CASE WHEN channel IS NULL THEN 1 ELSE 0 END) channel_null,
         SUM(CASE WHEN post_id IS NULL THEN 1 ELSE 0 END) post_null,
         SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) user_null
  FROM me.processing_job`);

await q('SPs que mencionan channel de job', `
  SELECT p.name
  FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id
  WHERE s.name='me'
    AND OBJECT_DEFINITION(p.object_id) LIKE '%j.channel%'`);

await q('SPs que mencionan v_media_actor_inflight', `
  SELECT p.name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id
  WHERE s.name='me' AND OBJECT_DEFINITION(p.object_id) LIKE '%v_media_actor_inflight%'`);

await q('requests recibidos colgados ahora', `
  SELECT media_id, media_type, status, source_actor_id, created_at,
         DATEDIFF(MINUTE, created_at, SYSUTCDATETIME()) mins
  FROM me.media_request
  WHERE status IN (N'received', N'uploading', N'uploaded', N'queued', N'processing')
  ORDER BY created_at DESC`);

await q('eventos retry 7d', `
  SELECT event_code, COUNT(*) n FROM me.media_event_log
  WHERE created_at >= DATEADD(DAY,-7,SYSUTCDATETIME())
  GROUP BY event_code ORDER BY n DESC`);

await q('jobs por estado global', `SELECT status, COUNT(*) n FROM me.processing_job GROUP BY status ORDER BY n DESC`);

await q('variantes audio generadas?', `SELECT media_type, variant_code, COUNT(*) n FROM me.media_variant WHERE variant_code LIKE N'audio%' OR media_type=N'audio' GROUP BY media_type, variant_code`);

await q('requests audio', `SELECT COUNT(*) n FROM me.media_request WHERE media_type=N'audio'`);

await pool.close();
console.log('\n### ME_* DEL ENTORNO');
for (const [k, v] of Object.entries(env)) if (/^ME_/.test(k) && !/PASSWORD|USER|HOST/.test(k)) console.log(`${k}=${v}`);
