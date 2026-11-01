// Prueba de guarda y cola por tipo dentro de una transacción revertida.
// Usa un objeto Transaction para que todas las sentencias viajen por la MISMA
// sesión: si no, la transacción queda abierta en una conexión y el rollback no
// alcanza a las demás.
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
  requestTimeout: 60000,
}).connect();

const tx = new sql.Transaction(pool);
await tx.begin();

const run = async (label, query) => {
  const r = await new sql.Request(tx).query(query);
  console.log(`\n### ${label}`);
  console.log(JSON.stringify(r.recordset || []));
  return r;
};

try {
  await run('fixtures', `
    INSERT INTO me.media_request (media_id, source_app, source_actor_type, source_actor_id,
      target_context, media_type, status, client_reference_id)
    VALUES
      ('11111111-1111-1111-1111-111111111111', N'android', N'user', N'TEST-HUERFANO', N'post', N'video', N'processing', N'ref-huerfano'),
      ('22222222-2222-2222-2222-222222222222', N'android', N'user', N'TEST-AUDIO',    N'post', N'audio', N'queued',      N'ref-audio'),
      ('33333333-3333-3333-3333-333333333333', N'android', N'user', N'TEST-VIDEO',    N'post', N'video', N'queued',      N'ref-video'),
      ('44444444-4444-4444-4444-444444444444', N'android', N'user', N'unknown',       N'post', N'video', N'received',    N'ref-unknown');

    INSERT INTO me.processing_job (media_id, job_type, status, priority) VALUES
      ('22222222-2222-2222-2222-222222222222', N'full_pipeline', N'pending', 100),
      ('33333333-3333-3333-3333-333333333333', N'full_pipeline', N'pending', 100);

    SELECT N'fixtures_OK' estado`);

  await run('A · processing SIN job (residuo) → debe ser libre', `
    EXEC me.sp_media_actor_busy @source_actor_id = N'TEST-HUERFANO'`);

  await run('B · audio con job pending → debe bloquear', `
    EXEC me.sp_media_actor_busy @source_actor_id = N'TEST-AUDIO'`);

  await run('C · actor "unknown" con trabajo → libre + identity_missing=1', `
    EXEC me.sp_media_actor_busy @source_actor_id = N'unknown'`);

  await run('D · carril audio: pick @media_type=audio', `
    EXEC me.sp_media_job_pick_next @worker_id = N'TEST-W', @media_type = N'audio'`);

  await run('E · carril general: pick @exclude_media_type=audio', `
    EXEC me.sp_media_job_pick_next @worker_id = N'TEST-W', @exclude_media_type = N'audio'`);

  await run('F · cola ya vacía para audio', `
    EXEC me.sp_media_job_pick_next @worker_id = N'TEST-W', @media_type = N'audio'`);
} finally {
  await tx.rollback();
}

const clean = await new sql.Request(pool).query(`
  SELECT (SELECT COUNT(*) FROM me.media_request WHERE source_actor_id LIKE N'TEST-%') requests_test,
         (SELECT COUNT(*) FROM me.processing_job WHERE media_id IN
            ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
             '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444')) jobs_test`);
console.log('\n### limpieza tras rollback');
console.log(JSON.stringify(clean.recordset));

await pool.close();
