/**
 * Inspección de solo lectura del estado real de Atlx_Media_Engine (Contabo).
 *
 * - Tablas del esquema medios_operacion con conteo de filas.
 * - Procedimientos existentes en el esquema.
 * - Catálogos: filas reales de estados_media, estados_solicitud_media, clientes_integracion.
 * - Legacy (solo lectura): me.media_status_catalog como fuente del seed.
 *
 * NO MUTA NADA.
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
  requestTimeout: 60000,
};

const pool = await new sql.ConnectionPool({ ...base, database: 'Atlx_Media_Engine' }).connect();

const tabs = await pool.request().query(`
  SELECT t.name AS tbl,
         (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id) AS cols,
         (SELECT COUNT(*) FROM sys.foreign_keys f WHERE f.parent_object_id = t.object_id) AS fks
  FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE s.name = 'medios_operacion'
  ORDER BY t.name
`);
console.log(`TABLAS en medios_operacion: ${tabs.recordset.length}`);
for (const r of tabs.recordset) {
  const c = await pool.request().query(`SELECT COUNT(*) AS c FROM medios_operacion.${r.tbl}`);
  console.log(`  ${r.tbl.padEnd(24)} ${String(r.cols).padStart(3)} campos · ${r.fks} FK · ${c.recordset[0].c} fila(s)`);
}

const sps = await pool.request().query(`
  SELECT p.name, p.create_date
  FROM sys.procedures p JOIN sys.schemas s ON s.schema_id = p.schema_id
  WHERE s.name = 'medios_operacion' ORDER BY p.name
`);
console.log(`\nPROCEDIMIENTOS en medios_operacion: ${sps.recordset.length}`);
for (const r of sps.recordset) console.log(`  ${r.name}`);

for (const t of ['estados_media', 'estados_solicitud_media', 'clientes_integracion', 'marcas_agua']) {
  try {
    const r = await pool.request().query(`SELECT * FROM medios_operacion.${t}`);
    console.log(`\nCATALOGO medios_operacion.${t}: ${r.recordset.length} fila(s)`);
    for (const row of r.recordset) console.log('  ', JSON.stringify(row));
  } catch (e) { console.log(`\nCATALOGO ${t}: no legible — ${e.message}`); }
}

await pool.close();

try {
  const leg = await new sql.ConnectionPool({ ...base, database: 'Atlx_Mediaengine' }).connect();
  const r = await leg.request().query(`SELECT * FROM me.media_status_catalog ORDER BY 1`);
  console.log(`\nLEGACY me.media_status_catalog: ${r.recordset.length} fila(s)`);
  for (const row of r.recordset) console.log('  ', JSON.stringify(row));
  const v = await leg.request().query(`SELECT COUNT(*) AS c FROM me.media_variant_catalog`);
  console.log(`LEGACY me.media_variant_catalog: ${v.recordset[0].c} fila(s)`);
  await leg.close();
} catch (e) { console.log(`\nLEGACY no legible: ${e.message}`); }
