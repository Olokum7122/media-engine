// Auditoría de sólo lectura: capacidad de audio, drift de contrato y paralelos.
// No escribe: sólo SELECT sobre catálogo del sistema y tablas del motor.
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
    console.log(JSON.stringify(r.recordset));
  } catch (e) { console.log(`\n### ${label} ERR: ${e.message}`); }
};

await q('bases con nombre parecido', `
  SELECT name, state_desc, recovery_model_desc, create_date
  FROM sys.databases WHERE name LIKE '%Media%' ORDER BY name`);

await q('check constraints de tipo', `
  SELECT OBJECT_NAME(parent_object_id) tabla, name, OBJECT_DEFINITION(object_id) definicion
  FROM sys.check_constraints
  WHERE name IN (N'ck_me_request_media_type', N'ck_me_variant_type',
                 N'ck_me_variant_code', N'ck_me_variant_catalog_type',
                 N'ck_me_job_status')
  ORDER BY name`);

await q('catalogo variantes audio', `
  SELECT variant_code, display_name, media_type, is_public, sort_order, is_active
  FROM me.media_variant_catalog WHERE media_type = N'audio' ORDER BY sort_order`);

await q('requests y variantes audio', `
  SELECT (SELECT COUNT(*) FROM me.media_request WHERE media_type=N'audio') req_audio,
         (SELECT COUNT(*) FROM me.media_variant WHERE media_type=N'audio') var_audio,
         (SELECT COUNT(*) FROM me.media_variant WHERE variant_code LIKE N'audio%') var_audio_code`);

await q('columnas processing_job', `
  SELECT c.name, t.name tipo, c.is_nullable
  FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE c.object_id = OBJECT_ID(N'me.processing_job') ORDER BY c.column_id`);

await q('indices processing_job', `
  SELECT i.name, i.is_primary_key, i.is_unique,
         STUFF((SELECT ',' + c.name FROM sys.index_columns ic
                JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
                WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0
                ORDER BY ic.key_ordinal FOR XML PATH('')),1,1,'') cols
  FROM sys.indexes i
  WHERE i.object_id=OBJECT_ID(N'me.processing_job') AND i.type>0 ORDER BY i.name`);

await q('SPs en me', `
  SELECT p.name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id
  WHERE s.name='me' ORDER BY p.name`);

await q('vistas en me', `
  SELECT v.name FROM sys.views v JOIN sys.schemas s ON s.schema_id=v.schema_id
  WHERE s.name='me' ORDER BY v.name`);

await q('definicion de sp_media_actor_busy', `
  SELECT OBJECT_DEFINITION(OBJECT_ID(N'me.sp_media_actor_busy')) d`);

await q('cola ahora', `
  SELECT status, COUNT(*) n FROM me.processing_job GROUP BY status`);

await q('requests en vuelo', `
  SELECT media_id, media_type, status, source_app, source_actor_id, created_at,
         DATEDIFF(MINUTE, created_at, SYSUTCDATETIME()) mins
  FROM me.media_request
  WHERE status IN (N'received',N'uploading',N'uploaded',N'queued',N'processing')
  ORDER BY created_at DESC`);

await q('indices de media_request', `
  SELECT i.name, STUFF((SELECT ',' + c.name FROM sys.index_columns ic
         JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
         WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0
         ORDER BY ic.key_ordinal FOR XML PATH('')),1,1,'') cols
  FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'me.media_request') AND i.type>0`);

await pool.close();
