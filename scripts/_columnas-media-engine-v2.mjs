/**
 * Inspección de solo lectura: columnas reales de medios_operacion (Contabo).
 * Imprime tabla → columnas en orden, con tipo y nulabilidad. NO MUTA NADA.
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

const r = await pool.request().query(`
  SELECT t.name AS tabla, c.name AS col, ty.name AS tipo, c.max_length AS largo,
         c.precision AS prec, c.scale AS esc, c.is_nullable AS nulo, c.column_id AS ord,
         CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END AS pk
  FROM sys.tables t
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.columns c ON c.object_id = t.object_id
  JOIN sys.types ty ON ty.user_type_id = c.user_type_id
  LEFT JOIN (
    SELECT ic.object_id, ic.column_id FROM sys.index_columns ic
    JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE i.is_primary_key = 1
  ) pk ON pk.object_id = t.object_id AND pk.column_id = c.column_id
  WHERE s.name = 'medios_operacion'
  ORDER BY t.name, c.column_id
`);

let tabla = null;
for (const row of r.recordset) {
  if (row.tabla !== tabla) {
    tabla = row.tabla;
    console.log(`\n### ${tabla}`);
  }
  const tipo = row.tipo === 'nvarchar' || row.tipo === 'varchar'
    ? `${row.tipo}(${row.largo === -1 ? 'max' : row.largo})`
    : row.tipo;
  console.log(`  ${String(row.ord).padStart(2)} ${row.col.padEnd(26)} ${tipo.padEnd(18)} ${row.nulo ? 'NULL' : 'NOT NULL'}${row.pk ? '  PK' : ''}`);
}

// Claves foráneas reales
const fk = await pool.request().query(`
  SELECT tp.name AS tabla, cp.name AS col, tr.name AS ref_tabla, cr.name AS ref_col
  FROM sys.foreign_keys f
  JOIN sys.foreign_key_columns fc ON fc.constraint_object_id = f.object_id
  JOIN sys.tables tp ON tp.object_id = f.parent_object_id
  JOIN sys.columns cp ON cp.object_id = tp.object_id AND cp.column_id = fc.parent_column_id
  JOIN sys.tables tr ON tr.object_id = f.referenced_object_id
  JOIN sys.columns cr ON cr.object_id = tr.object_id AND cr.column_id = fc.referenced_column_id
  WHERE SCHEMA_NAME(tp.schema_id) = 'medios_operacion'
  ORDER BY tp.name, cp.name
`);
console.log('\n### CLAVES FORÁNEAS');
for (const row of fk.recordset) console.log(`  ${row.tabla}.${row.col} → ${row.ref_tabla}.${row.ref_col}`);

await pool.close();
