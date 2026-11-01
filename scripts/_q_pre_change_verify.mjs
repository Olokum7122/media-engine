// Verificación previa a cambios: ¿la base paralela está vacía? ¿algún objeto
// del motor lee las columnas muertas? ¿qué CHECK restringen media_original?
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

await q('contenido de la base paralela', `
  SELECT
    (SELECT COUNT(*) FROM Atlx_Media_Engine.sys.tables) tablas,
    (SELECT COUNT(*) FROM Atlx_Media_Engine.sys.views) vistas,
    (SELECT COUNT(*) FROM Atlx_Media_Engine.sys.procedures) sps,
    (SELECT COUNT(*) FROM Atlx_Media_Engine.sys.schemas WHERE principal_id IS NOT NULL AND name NOT IN (N'sys',N'INFORMATION_SCHEMA',N'dbo',N'guest')) esquemas_usuario`);

/* Referencias a las cuatro columnas muertas en TODO el servidor de la base activa:
   SPs, vistas, funciones, triggers y defaults. */
await q('objetos que mencionan channel/post_id/sponsor_id/user_id de job', `
  SELECT o.type_desc, s.name + N'.' + o.name objeto
  FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id
  WHERE o.type IN ('P','V','FN','IF','TF','TR')
    AND (
      OBJECT_DEFINITION(o.object_id) LIKE '%j.channel%'
      OR OBJECT_DEFINITION(o.object_id) LIKE '%j.post_id%'
      OR OBJECT_DEFINITION(o.object_id) LIKE '%j.sponsor_id%'
      OR OBJECT_DEFINITION(o.object_id) LIKE '%j.user_id%'
      OR OBJECT_DEFINITION(o.object_id) LIKE '%processing_job.channel%'
      OR OBJECT_DEFINITION(o.object_id) LIKE '%processing_job.post_id%'
    )`);

await q('SPs con SELECT * sobre processing_job', `
  SELECT s.name + N'.' + p.name objeto
  FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id
  WHERE s.name='me' AND OBJECT_DEFINITION(p.object_id) LIKE '%processing_job%'
    AND OBJECT_DEFINITION(p.object_id) LIKE '%SELECT *%'`);

await q('CHECK de media_original', `
  SELECT OBJECT_NAME(parent_object_id) tabla, name, OBJECT_DEFINITION(object_id) definicion
  FROM sys.check_constraints WHERE OBJECT_NAME(parent_object_id) IN
    (N'media_original', N'media_request') ORDER BY tabla, name`);

await q('columnas muertas: poblacion real', `
  SELECT COUNT(*) total,
         SUM(CASE WHEN channel IS NOT NULL THEN 1 ELSE 0 END) channel_nn,
         SUM(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) post_nn,
         SUM(CASE WHEN sponsor_id IS NOT NULL THEN 1 ELSE 0 END) sponsor_nn,
         SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) user_nn
  FROM me.processing_job`);

await q('todo el catalogo de tipo de media en requests existentes', `
  SELECT media_type, status, COUNT(*) n FROM me.media_request
  GROUP BY media_type, status ORDER BY n DESC`);

await pool.close();
