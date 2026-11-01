// Verificación post-migración 23/24: contrato de payload y dedupe de encolado.
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

await q('nº columnas vista (esperado 36)', `SELECT COUNT(*) AS columnas FROM sys.columns WHERE object_id=OBJECT_ID(N'me.v_media_ready_payload');`);

await q('columnas nuevas presentes', `SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(N'me.v_media_ready_payload')
  AND name IN (N'avatar_url',N'story_url',N'audio_url',N'audio_preview_url',N'channel',N'post_id',N'sponsor_id',N'user_id') ORDER BY name;`);

await q('ladder intacto', `SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(N'me.v_media_ready_payload')
  AND name IN (N'video_720_url',N'video_1080_url',N'video_url',N'video_preview_url') ORDER BY name;`);

// Payload real de un media con avatar + story
await q('payload media con avatar/story (DD16D886)', `EXEC me.sp_media_get_ready_payload @media_id='DD16D886-29C6-4FD9-961D-BEA500ED619E';`);

// Payload real de un video ready con ladder
const vids = await pool.request().query(`SELECT TOP 1 media_id FROM me.media_request WHERE media_type=N'video' AND status=N'ready' ORDER BY ready_at DESC;`);
if (vids.recordset[0]) {
  const id = vids.recordset[0].media_id;
  const r = await pool.request().input('media_id', sql.UniqueIdentifier, id).execute('me.sp_media_get_ready_payload');
  const row = r.recordset[0];
  console.log(`\n=== payload video ${id} ===`);
  console.log(JSON.stringify({ media_type: row.media_type, status: row.status, video_url: row.video_url && String(row.video_url).slice(-40),
    video_720_url: row.video_720_url && String(row.video_720_url).slice(-40), video_1080_url: row.video_1080_url,
    thumb_url: !!row.thumb_url, duration_ms: row.duration_ms, channel: row.channel, post_id: row.post_id,
    audio_url: row.audio_url }, null, 1));
}

// Dedupe: registrar otra vez un media READY no debe encolar
const tx = new sql.Transaction(pool);
await tx.begin();
try {
  const before = await new sql.Request(tx).query(`SELECT COUNT(*) n FROM me.processing_job WHERE media_id='DD16D886-29C6-4FD9-961D-BEA500ED619E';`);
  const res = await new sql.Request(tx)
    .input('media_id', sql.UniqueIdentifier, 'DD16D886-29C6-4FD9-961D-BEA500ED619E')
    .input('mime_type', sql.NVarChar(120), 'image/jpeg')
    .input('sha256_hash', sql.Char(64), 'a'.repeat(64))
    .execute('me.sp_media_original_register');
  const after = await new sql.Request(tx).query(`SELECT COUNT(*) n FROM me.processing_job WHERE media_id='DD16D886-29C6-4FD9-961D-BEA500ED619E';`);
  console.log('\n=== dedupe sobre media READY ===');
  console.log(JSON.stringify({ jobs_antes: before.recordset[0].n, jobs_despues: after.recordset[0].n,
    respuesta: res.recordset[0] }, null, 1));
} finally {
  await tx.rollback();
  console.log('transacción revertida (sin cambios en la base)');
}

// Retención: dry run del conteo elegible, sin ejecutar borrado
await q('elegibles para retención 7 días', `SELECT COUNT(*) AS jobs_elegibles FROM me.processing_job
  WHERE status IN (N'done',N'failed',N'canceled',N'dead_letter')
    AND COALESCE(finished_at, updated_at, created_at) < DATEADD(DAY,-7,SYSUTCDATETIME());`);

await pool.close();
