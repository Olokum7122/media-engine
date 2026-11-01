// Mide el contrato REAL de payload antes de publicar la migración 23:
// columnas de v_media_ready_payload, columnas que devuelve sp_media_get_ready_payload,
// códigos de variante admitidos por el CHECK y presentes en datos.
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

const q = async (label, text) => {
  const r = await pool.request().query(text);
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(r.recordset, null, 1));
};

await q('columnas vista', `
  SELECT c.column_id, c.name, t.name AS tipo
  FROM sys.columns c JOIN sys.types t ON t.user_type_id = c.user_type_id
  WHERE c.object_id = OBJECT_ID(N'me.v_media_ready_payload')
  ORDER BY c.column_id;`);

await q('columnas SP get_ready_payload', `
  SELECT p.parameter_id, p.name, t.name AS tipo
  FROM sys.parameters p JOIN sys.types t ON t.user_type_id = p.user_type_id
  WHERE p.object_id = OBJECT_ID(N'me.sp_media_get_ready_payload')
  ORDER BY p.parameter_id;`);

await q('definición SP (md5 + longitud)', `
  SELECT OBJECT_NAME(m.object_id) AS obj, LEN(m.definition) AS largo,
         CONVERT(varchar(32), HASHBYTES('MD5', m.definition), 2) AS md5
  FROM sys.sql_modules m
  WHERE m.object_id IN (OBJECT_ID(N'me.sp_media_get_ready_payload'),
                        OBJECT_ID(N'me.sp_media_get_by_id'));`);

await q('CHECK ck_me_variant_code', `
  SELECT cc.name, cc.definition
  FROM sys.check_constraints cc
  WHERE cc.parent_object_id = OBJECT_ID(N'me.media_variant');`);

await q('catálogo de variantes', `
  SELECT variant_code, media_type, display_name
  FROM me.media_variant_catalog ORDER BY variant_code;`);

await q('variantes realmente usadas en datos', `
  SELECT variant_code, media_type, COUNT(*) AS n
  FROM me.media_variant GROUP BY variant_code, media_type ORDER BY n DESC;`);

await q('columnas transversales presentes', `
  SELECT
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'me.media_request')
       AND name IN (N'channel', N'post_id', N'sponsor_id', N'user_id')) AS en_request,
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'me.media_rights_origin')
       AND name IN (N'channel', N'post_id', N'sponsor_id', N'user_id')) AS en_rights;`);

await q('medios por status y tipo', `
  SELECT media_type, status, COUNT(*) AS n
  FROM me.media_request GROUP BY media_type, status ORDER BY media_type, status;`);

await pool.close();
