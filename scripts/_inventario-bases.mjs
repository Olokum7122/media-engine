/**
 * Inventario de SOLO LECTURA de las bases del ecosistema de media/streaming en Contabo.
 * Objetivo: confirmar qué contiene el legacy antes de crear el motor V2.
 */
import sql from 'mssql';

const base = {
  server: '185.187.235.253',
  port: 1433,
  user: 'sa',
  password: 'Olokum681228$',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 15000 },
  connectionTimeout: 20000,
  requestTimeout: 30000,
};

const TARGETS = ['Atlx_Mediaengine', 'ATLX_StreamingLive', 'streaming_live'];

for (const db of TARGETS) {
  console.log('\n============================================================');
  console.log('BASE:', db);
  console.log('============================================================');
  let pool;
  try {
    pool = await new sql.ConnectionPool({ ...base, database: db }).connect();
  } catch (e) {
    console.log('  NO ACCESIBLE:', e.message);
    continue;
  }

  const tabs = await pool.request().query(`
    SELECT s.name AS sch, t.name AS tbl,
           (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id) AS cols
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
    ORDER BY s.name, t.name
  `);
  console.log(`TABLAS (${tabs.recordset.length}):`);
  for (const r of tabs.recordset) console.log(`  ${r.sch}.${r.tbl}  (${r.cols} col)`);

  const sps = await pool.request().query(`
    SELECT s.name AS sch, p.name AS sp FROM sys.procedures p
    JOIN sys.schemas s ON s.schema_id = p.schema_id ORDER BY s.name, p.name
  `);
  console.log(`SPs (${sps.recordset.length}):`);
  for (const r of sps.recordset) console.log(`  ${r.sch}.${r.sp}`);

  const vw = await pool.request().query(`
    SELECT s.name AS sch, v.name AS v FROM sys.views v
    JOIN sys.schemas s ON s.schema_id = v.schema_id ORDER BY s.name, v.name
  `);
  console.log(`VISTAS (${vw.recordset.length}):`);
  for (const r of vw.recordset) console.log(`  ${r.sch}.${r.v}`);

  await pool.close();
}
