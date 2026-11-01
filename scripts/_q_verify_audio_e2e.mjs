// Verifica audio en el payload y la purga de retención. TODO dentro de
// transacciones con ROLLBACK: no deja datos ni borra nada de forma permanente.
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

// ── A. Audio end-to-end: request → original → variante → payload
const tx = new sql.Transaction(pool);
await tx.begin();
try {
  const r1 = await new sql.Request(tx).query(`
    DECLARE @id UNIQUEIDENTIFIER = NEWID();
    SELECT @id AS media_id;`);
  const mediaId = r1.recordset[0].media_id;

  await new sql.Request(tx)
    .input('id', sql.UniqueIdentifier, mediaId)
    .query(`INSERT INTO me.media_request (media_id, source_app, source_actor_type, source_actor_id, target_context,
      media_type, channel, post_id, user_id, status, payload_version, ready_at)
    VALUES (@id, N'colaborattor', N'user', N'audio-e2e', N'post',
      N'audio', N'editorial', N'post-audio-001', N'user-001', N'ready', 1, SYSUTCDATETIME());`);
  console.log('request insertada');

  await new sql.Request(tx)
    .input('id', sql.UniqueIdentifier, mediaId)
    .query(`INSERT INTO me.media_original (media_id, original_file_name, original_url, original_storage_path,
      mime_type, extension, size_bytes, duration_ms)
    VALUES (@id, N'entrevista.m4a', N'https://x/entrevista.m4a', N'/2026/11/entrevista.m4a',
      N'audio/mp4', N'm4a', 123456, 95000);`);
  console.log('original insertado');

  await new sql.Request(tx)
    .input('id', sql.UniqueIdentifier, mediaId)
    .query(`INSERT INTO me.media_rights_origin (media_id, origin_type, origin_platform, ownership_type,
      rights_status, license_type, allow_download, allow_share)
    VALUES (@id, N'uploaded_by_owner', N'antojados', N'creator_owned', N'declared', N'user_generated', 0, 1);`);
  console.log('derechos insertados');

  await new sql.Request(tx)
    .input('id', sql.UniqueIdentifier, mediaId)
    .query(`INSERT INTO me.media_variant (media_id, variant_code, media_type, url, storage_path, mime_type,
      duration_ms, size_bytes, is_public)
    VALUES (@id, N'audio_full', N'audio', N'https://x/entrevista.m4a', N'/2026/11/entrevista.m4a',
      N'audio/mp4', 95000, 123456, 1);`);
  console.log('variante audio_full insertada');

  const payload = await new sql.Request(tx)
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .execute('me.sp_media_get_ready_payload');
  const row = payload.recordset[0];
  console.log('=== payload AUDIO (tx) ===');
  console.log(JSON.stringify({
    media_id: row.media_id, media_type: row.media_type, status: row.status,
    audio_url: row.audio_url, audio_preview_url: row.audio_preview_url,
    duration_ms: row.duration_ms, channel: row.channel, post_id: row.post_id,
    user_id: row.user_id, full_url: row.full_url,
  }, null, 1));
} finally {
  await tx.rollback();
  console.log('rollback: audio de prueba eliminado');
}

// ── B. Purga de retención: cuánto borra un lote (rollback)
const tx2 = new sql.Transaction(pool);
await tx2.begin();
try {
  const antes = await new sql.Request(tx2).query(`SELECT COUNT(*) n FROM me.processing_job;`);
  const purge = await new sql.Request(tx2)
    .input('older_than_days', sql.Int, 7)
    .input('batch_size', sql.Int, 5000)
    .execute('me.sp_media_job_purge_terminated');
  const despues = await new sql.Request(tx2).query(`SELECT COUNT(*) n FROM me.processing_job;`);
  console.log('\n=== purga de retención (tx) ===');
  console.log(JSON.stringify({
    antes: antes.recordset[0].n, despues: despues.recordset[0].n,
    borrados_en_este_lote: purge.recordset[0].deleted, dias: purge.recordset[0].older_than_days,
  }, null, 1));
} finally {
  await tx2.rollback();
  console.log('rollback: la purga NO quedó aplicada');
}

await pool.close();
