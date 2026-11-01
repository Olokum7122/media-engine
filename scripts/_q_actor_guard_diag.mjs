/**
 * _q_actor_guard_diag.mjs — DIAGNÓSTICO DE SOLO LECTURA.
 *
 * Mide qué peticiones de media quedaron en vuelo y con qué status, para
 * distinguir un procesamiento real de un intake huérfano que la guarda de
 * concurrencia (`me.sp_media_actor_busy`) sigue contando como ocupado.
 *
 * No escribe, no actualiza, no ejecuta SP de mutación.
 */
import 'dotenv/config';
import sql from 'mssql';

const cfg = {
  server: process.env.ME_SQL_HOST,
  port: Number(process.env.ME_SQL_PORT || 1433),
  user: process.env.ME_SQL_USER,
  password: process.env.ME_SQL_PASSWORD,
  database: process.env.ME_SQL_DATABASE,
  options: {
    encrypt: String(process.env.ME_SQL_ENCRYPT || 'false') === 'true',
    trustServerCertificate: String(process.env.ME_SQL_TRUST_SERVER_CERT || 'true') === 'true',
  },
};

const pool = await sql.connect(cfg);
const q = async (label, text) => {
  try {
    const r = await pool.request().query(text);
    console.log(`\n### ${label}`);
    console.log(JSON.stringify(r.recordset, null, 1));
  } catch (e) {
    console.log(`\n### ${label} ERR ${e.message}`);
  }
};

await q('1. Intakes en vuelo por actor (estados que la guarda cuenta)', `
SELECT r.source_app, r.source_actor_id, r.status, r.media_type, r.target_context,
       COUNT(*) AS n,
       CONVERT(varchar(19), MIN(r.created_at), 120) AS oldest,
       CONVERT(varchar(19), MAX(r.created_at), 120) AS newest,
       DATEDIFF(MINUTE, MIN(r.created_at), SYSUTCDATETIME()) AS age_min
FROM me.media_request r
WHERE r.status IN (N'received', N'uploading', N'uploaded', N'queued', N'processing')
GROUP BY r.source_app, r.source_actor_id, r.status, r.media_type, r.target_context
ORDER BY oldest ASC`);

await q('2. Detalle de intakes no terminales de las últimas 24 h', `
SELECT r.media_id, r.source_app, r.source_actor_id, r.status, r.media_type, r.target_context,
       r.client_reference_id, r.publish_group_id,
       CONVERT(varchar(19), r.created_at, 120) AS created_at,
       DATEDIFF(MINUTE, r.created_at, SYSUTCDATETIME()) AS age_min,
       (SELECT COUNT(*) FROM me.media_original o WHERE o.media_id = r.media_id) AS tiene_original,
       (SELECT COUNT(*) FROM me.processing_job j WHERE j.media_id = r.media_id) AS n_jobs,
       (SELECT STRING_AGG(j.status, ',') FROM me.processing_job j WHERE j.media_id = r.media_id) AS jobs_status
FROM me.media_request r
WHERE r.status IN (N'received', N'uploading', N'uploaded', N'queued', N'processing')
  AND r.created_at >= DATEADD(HOUR, -24, SYSUTCDATETIME())
ORDER BY r.created_at ASC`);

await q('3. Distribución de status de las últimas 24 h', `
SELECT r.status, r.media_type, COUNT(*) AS n,
       CONVERT(varchar(19), MIN(r.created_at), 120) AS oldest,
       CONVERT(varchar(19), MAX(r.created_at), 120) AS newest
FROM me.media_request r
WHERE r.created_at >= DATEADD(HOUR, -24, SYSUTCDATETIME())
GROUP BY r.status, r.media_type
ORDER BY n DESC`);

await q('4. Jobs en pending/running y su antigüedad', `
SELECT j.job_id, j.media_id, j.status, j.attempts, j.max_attempts,
       CONVERT(varchar(19), j.created_at, 120) AS created_at,
       CONVERT(varchar(19), j.locked_at, 120) AS locked_at,
       DATEDIFF(MINUTE, COALESCE(j.locked_at, j.started_at, j.updated_at), SYSUTCDATETIME()) AS age_min,
       j.error_code
FROM me.processing_job j
WHERE j.status IN (N'pending', N'running')
ORDER BY j.created_at ASC`);

await q('5. ¿El reaper está corriendo? (jobs reclamados y peticiones expiradas)', `
SELECT TOP 20 r.media_id, r.status, r.error_code, r.media_type,
       CONVERT(varchar(19), r.created_at, 120) AS created_at,
       CONVERT(varchar(19), r.updated_at, 120) AS updated_at
FROM me.media_request r
WHERE r.error_code IN (N'UPLOAD_ABANDONED', N'JOB_LOST', N'PROCESSING_TIMEOUT')
ORDER BY r.updated_at DESC`);

await pool.close();
