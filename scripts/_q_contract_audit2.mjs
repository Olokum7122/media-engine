// Auditoría de sólo lectura (parte 2): bases gemelas, vistas, SPs y la guarda de actor.
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

const base = {
  server: env.ME_SQL_HOST,
  port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER,
  password: env.ME_SQL_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 30000,
};

async function auditDb(dbName) {
  const pool = await new sql.ConnectionPool({ ...base, database: dbName }).connect();
  const q = async (label, query) => {
    try {
      const r = await pool.request().query(query);
      console.log(`\n### [${dbName}] ${label}`);
      console.log(JSON.stringify(r.recordset, null, 0));
    } catch (e) {
      console.log(`\n### [${dbName}] ${label} ERR: ${e.message}`);
    }
  };
  console.log(`\n${'='.repeat(70)}\nBASE: ${dbName}\n${'='.repeat(70)}`);
  await q('creada', `SELECT name, create_date, state_desc, recovery_model_desc FROM sys.databases WHERE database_id = DB_ID()`);
  await q('tablas', `SELECT s.name sch, t.name tbl FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name='me' ORDER BY t.name`);
  await q('vistas', `SELECT v.name FROM sys.views v JOIN sys.schemas s ON s.schema_id=v.schema_id WHERE s.name='me' ORDER BY v.name`);
  await q('SPs', `SELECT p.name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id WHERE s.name='me' ORDER BY p.name`);
  await q('volumen', `SELECT (SELECT COUNT(*) FROM me.media_request) reqs, (SELECT COUNT(*) FROM me.media_original) originals, (SELECT COUNT(*) FROM me.processing_job) jobs, (SELECT COUNT(*) FROM me.media_variant) variants`);
  await pool.close();
}

await auditDb('Atlx_Mediaengine');
await auditDb('Atlx_Media_Engine');

// Detalle de la guarda en la base activa
const pool = await new sql.ConnectionPool({ ...base, database: env.ME_SQL_DATABASE }).connect();
const q = async (label, query) => {
  try {
    const r = await pool.request().query(query);
    console.log(`\n### ${label}`);
    console.log(JSON.stringify(r.recordset, null, 0));
  } catch (e) {
    console.log(`\n### ${label} ERR: ${e.message}`);
  }
};
await q('def v_media_actor_inflight', `SELECT OBJECT_DEFINITION(OBJECT_ID('me.v_media_actor_inflight')) def`);
await q('def sp_media_actor_busy', `SELECT OBJECT_DEFINITION(OBJECT_ID('me.sp_media_actor_busy')) def`);
await q('actores 48h', `SELECT source_actor_id, source_app, COUNT(*) n FROM me.media_request WHERE created_at >= DATEADD(DAY,-2,SYSUTCDATETIME()) GROUP BY source_actor_id, source_app ORDER BY n DESC`);
await q('inflight ahora', `SELECT * FROM me.v_media_actor_inflight`);
await pool.close();
