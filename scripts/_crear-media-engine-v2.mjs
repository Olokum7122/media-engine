/**
 * Runner del DDL de Atlx Media Engine V2 contra Contabo.
 *
 * - Crea la base `Atlx_Media_Engine` si no existe (NUNCA toca `Atlx_Mediaengine`).
 * - Aplica media-engine/sql/atlx_media_engine_v2.sql lote por lote (separador GO).
 * - Verifica: tablas, campos, claves foráneas e índices.
 * - Lee (solo lectura) los catálogos legacy para reportar qué falta sembrar.
 */
import sql from 'mssql';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

const TARGET_DB = 'Atlx_Media_Engine';
const LEGACY_DB = 'Atlx_Mediaengine';
const SQL_FILE = join(__dir, '..', 'sql', 'atlx_media_engine_v2.sql');

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

// ─── 1. Crear la base si no existe ────────────────────────────
const master = await new sql.ConnectionPool({ ...base, database: 'master' }).connect();

const existe = await master.request()
  .input('n', sql.NVarChar(128), TARGET_DB)
  .query(`SELECT name FROM sys.databases WHERE name = @n`);

if (existe.recordset.length === 0) {
  console.log(`Creando base [${TARGET_DB}]...`);
  await master.request().batch(`CREATE DATABASE [${TARGET_DB}]`);
  console.log('  base creada.');
} else {
  console.log(`La base [${TARGET_DB}] ya existe — se aplicará el DDL de forma idempotente.`);
}

// Guardia: la base legacy no se toca
const legacy = await master.request()
  .input('n', sql.NVarChar(128), LEGACY_DB)
  .query(`SELECT COUNT(*) AS c FROM sys.databases WHERE name = @n`);
console.log(`Guardia: [${LEGACY_DB}] ${legacy.recordset[0].c === 1 ? 'PRESENTE y fuera de alcance' : 'no existe'}.`);
await master.close();

// ─── 2. Aplicar el DDL lote por lote ──────────────────────────
const pool = await new sql.ConnectionPool({ ...base, database: TARGET_DB }).connect();

const raw = readFileSync(SQL_FILE, 'utf8');
const batches = raw
  .split(/^\s*GO\s*$/gim)
  .map((b) => b.trim())
  .filter((b) => b.length > 0 && !/^\s*--/.test(b.replace(/--.*$/gm, '').trim()));

console.log(`\nAplicando ${batches.length} lote(s) de DDL...`);
let n = 0;
for (const b of batches) {
  n++;
  try {
    await pool.request().batch(b);
  } catch (e) {
    console.error(`  LOTE ${n} FALLÓ: ${e.message}`);
    console.error(b.slice(0, 300));
    await pool.close();
    process.exit(1);
  }
}
console.log(`  ${n} lote(s) aplicado(s) sin error.`);

// ─── 3. Verificación ──────────────────────────────────────────
const tabs = await pool.request().query(`
  SELECT t.name AS tbl,
         (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id) AS cols,
         (SELECT COUNT(*) FROM sys.foreign_keys f WHERE f.parent_object_id = t.object_id) AS fks
  FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE s.name = 'medios_operacion'
  ORDER BY t.name
`);
console.log(`\nTABLAS CREADAS (${tabs.recordset.length}):`);
let totCols = 0, totFks = 0;
for (const r of tabs.recordset) {
  totCols += r.cols; totFks += r.fks;
  console.log(`  medios_operacion.${r.tbl.padEnd(24)} ${String(r.cols).padStart(3)} campos · ${r.fks} FK`);
}
console.log(`  TOTAL: ${tabs.recordset.length} tablas · ${totCols} campos · ${totFks} claves foráneas`);

const idx = await pool.request().query(`
  SELECT COUNT(*) AS c FROM sys.indexes i
  JOIN sys.tables t ON t.object_id = i.object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE s.name = 'medios_operacion' AND i.type > 0 AND i.is_primary_key = 0
`);
console.log(`  índices no-clave: ${idx.recordset[0].c}`);

// ─── 4. Catálogos: qué falta sembrar ──────────────────────────
for (const tabla of ['estados_media', 'estados_solicitud_media', 'clientes_integracion']) {
  const c = await pool.request().query(`SELECT COUNT(*) AS c FROM medios_operacion.${tabla}`);
  console.log(`\ncatálogo medios_operacion.${tabla}: ${c.recordset[0].c} fila(s)`);
}

await pool.close();

// ─── 5. Lectura del legacy (solo lectura, para reportar el seed) ──
const leg = await new sql.ConnectionPool({ ...base, database: LEGACY_DB }).connect();
console.log('\n--- LEGACY me.media_status_catalog (fuente del catálogo de estados) ---');
try {
  const r = await leg.request().query(`SELECT * FROM me.media_status_catalog`);
  for (const row of r.recordset) console.log('  ', JSON.stringify(row));
} catch (e) { console.log('  no legible:', e.message); }

console.log('\n--- LEGACY me.media_variant_catalog ---');
try {
  const r = await leg.request().query(`SELECT * FROM me.media_variant_catalog`);
  for (const row of r.recordset) console.log('  ', JSON.stringify(row));
} catch (e) { console.log('  no legible:', e.message); }
await leg.close();
