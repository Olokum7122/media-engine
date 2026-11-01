// ¿El motor admite hoy un audio de punta a punta a nivel de modelo?
// Inserta petición + original + variante de audio y revierte.
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
const say = (l, v) => console.log(`${l}: ${JSON.stringify(v)}`);

try {
  await new sql.Request(tx).query(`
    INSERT INTO me.media_request (media_id, source_app, source_actor_type, source_actor_id,
      target_context, media_type, status, client_reference_id)
    VALUES ('AAAAAAAA-0000-0000-0000-000000000001', N'colaborattor', N'user', N'TEST-AUDIO-E2E',
      N'post', N'audio', N'uploaded', N'ref-audio-e2e');`);
  say('petición audio', 'insertada');

  await new sql.Request(tx).query(`
    INSERT INTO me.media_original (media_id, original_url, original_storage_path, mime_type,
      extension, size_bytes, duration_ms, sha256_hash)
    VALUES ('AAAAAAAA-0000-0000-0000-000000000001', N'/media/x.m4a', N'/opt/media/x.m4a',
      N'audio/mp4', N'm4a', 734003, 61000, REPLICATE('a', 64));`);
  say('original .m4a con duration_ms', 'insertado');

  await new sql.Request(tx).query(`
    INSERT INTO me.media_variant (media_id, variant_code, media_type, url, storage_path,
      mime_type, width, height, size_bytes, is_public)
    VALUES ('AAAAAAAA-0000-0000-0000-000000000001', N'audio_full', N'audio',
      N'/media/x.m4a', N'/opt/media/x.m4a', N'audio/mp4', NULL, NULL, 734003, 1);`);
  say('variante audio_full', 'insertada');

  const r = await new sql.Request(tx).query(`
    SELECT variant_code, media_type FROM me.media_variant
    WHERE media_id = 'AAAAAAAA-0000-0000-0000-000000000001'`);
  say('variantes leídas', r.recordset);
} catch (e) {
  console.log('RECHAZADO POR EL MODELO:', e.message);
} finally {
  await tx.rollback();
}

const clean = await new sql.Request(pool).query(`
  SELECT COUNT(*) n FROM me.media_request WHERE media_id = 'AAAAAAAA-0000-0000-0000-000000000001'`);
say('tras rollback', clean.recordset);

await pool.close();
