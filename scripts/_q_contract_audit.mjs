// Auditoría de sólo lectura: compara el modelo instalado en la BD contra el
// contrato V3 declarado en docs/MEDIA_ENGINE_V3_SQL/03_TABLES.sql y 02_CATALOGS.sql.
// No escribe nada. Uso: node scripts/_q_contract_audit.mjs
import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l.trim()))
    .map((l) => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      if (/^["']/.test(val) && val.length > 1) val = val.slice(1, -1);
      return [key, val];
    })
);

const cfg = {
  server: env.ME_SQL_HOST,
  port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER,
  password: env.ME_SQL_PASSWORD,
  database: env.ME_SQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 30000,
};

const pool = await sql.connect(cfg);
const q = async (label, query) => {
  try {
    const r = await pool.request().query(query);
    console.log(`\n### ${label}`);
    console.log(JSON.stringify(r.recordset, null, 0));
  } catch (e) {
    console.log(`\n### ${label} ERR: ${e.message}`);
  }
};

await q('bases', `SELECT name FROM sys.databases WHERE name LIKE '%edia%' OR name LIKE '%atlx%' ORDER BY name`);

await q('schemas', `SELECT name FROM sys.schemas WHERE name IN ('me','medios_operacion','dbo') ORDER BY name`);

await q('tablas me', `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='me' ORDER BY TABLE_NAME`);

await q('tablas medios_operacion', `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='medios_operacion' ORDER BY TABLE_NAME`);

await q('columnas processing_job', `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='me' AND TABLE_NAME='processing_job' ORDER BY ORDINAL_POSITION`);

await q('columnas media_request', `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='me' AND TABLE_NAME='media_request' ORDER BY ORDINAL_POSITION`);

await q('checks processing_job', `SELECT c.name, m.definition FROM sys.check_constraints c JOIN sys.tables t ON t.object_id=c.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id CROSS APPLY (SELECT c.definition AS definition) m WHERE s.name='me' AND t.name='processing_job'`);

await q('checks media_request', `SELECT c.name, LEFT(c.definition, 400) def FROM sys.check_constraints c JOIN sys.tables t ON t.object_id=c.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name='me' AND t.name='media_request'`);

await q('SPs en me', `SELECT name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id WHERE s.name='me' ORDER BY name`);

await q('vistas en me', `SELECT name FROM sys.views v JOIN sys.schemas s ON s.schema_id=v.schema_id WHERE s.name='me' ORDER BY name`);

await q('indices processing_job', `SELECT i.name, i.type_desc, STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY c.column_id) cols FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id JOIN sys.tables t ON t.object_id=i.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name='me' AND t.name='processing_job' GROUP BY i.name, i.type_desc`);

await q('catalogo estados', `SELECT * FROM me.media_status_catalog ORDER BY status_code`);

await q('catalogo errores (conteo)', `SELECT COUNT(*) AS n FROM me.media_error_catalog`);

await q('estado actual requests 7d', `SELECT status, media_type, COUNT(*) n FROM me.media_request WHERE created_at >= DATEADD(DAY,-7,SYSUTCDATETIME()) GROUP BY status, media_type ORDER BY n DESC`);

await q('jobs 48h', `SELECT status, COUNT(*) n FROM me.processing_job WHERE created_at >= DATEADD(DAY,-2,SYSUTCDATETIME()) GROUP BY status`);

await pool.close();
