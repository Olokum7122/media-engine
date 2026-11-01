/**
 * Inspección compacta de solo lectura: nombres de columna reales de medios_operacion.
 * Uso: node scripts/_esquema-compacto.mjs [tabla ...]
 * Imprime una línea por tabla: "tabla: col, col, ...". NO MUTA NADA.
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

const filtro = process.argv.slice(2);
const pool = await new sql.ConnectionPool({ ...base, database: 'Atlx_Media_Engine' }).connect();

const req = pool.request();
const r = await req.query(`
  SELECT t.name AS tabla, c.name AS col, c.column_id AS ord
  FROM sys.tables t
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.columns c ON c.object_id = t.object_id
  WHERE s.name = 'medios_operacion'
  ORDER BY t.name, c.column_id
`);

const porTabla = new Map();
for (const row of r.recordset) {
  if (filtro.length && !filtro.includes(row.tabla)) continue;
  if (!porTabla.has(row.tabla)) porTabla.set(row.tabla, []);
  porTabla.get(row.tabla).push(row.col);
}
for (const [tabla, cols] of porTabla) {
  console.log(`${tabla}: ${cols.join(', ')}`);
}
await pool.close();
