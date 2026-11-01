/**
 * Inspección compacta de solo lectura: claves, obligatoriedad, defaults y tipos
 * de medios_operacion. NO MUTA NADA.
 * Uso: node scripts/_tipos-compacto.mjs [tabla ...]
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

function tipo(r) {
  if (r.tipo === 'nvarchar' || r.tipo === 'varchar') return `${r.tipo}(${r.largo === -1 ? 'max' : r.largo / 2})`;
  if (r.tipo === 'decimal' || r.tipo === 'numeric') return `${r.tipo}(${r.prec},${r.esc})`;
  return r.tipo;
}

const r = await pool.request().query(`
  SELECT t.name AS tabla, c.name AS col, ty.name AS tipo, c.max_length AS largo,
         c.precision AS prec, c.scale AS esc, c.is_nullable AS nulo, c.is_identity AS ident,
         dc.definition AS def,
         CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END AS pk
  FROM sys.tables t
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.columns c ON c.object_id = t.object_id
  JOIN sys.types ty ON ty.user_type_id = c.user_type_id
  LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = t.object_id AND dc.parent_column_id = c.column_id
  LEFT JOIN (
    SELECT ic.object_id, ic.column_id FROM sys.index_columns ic
    JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE i.is_primary_key = 1
  ) pk ON pk.object_id = t.object_id AND pk.column_id = c.column_id
  WHERE s.name = 'medios_operacion'
  ORDER BY t.name, c.column_id
`);

const porTabla = new Map();
for (const row of r.recordset) {
  if (filtro.length && !filtro.includes(row.tabla)) continue;
  if (!porTabla.has(row.tabla)) porTabla.set(row.tabla, []);
  porTabla.get(row.tabla).push(row);
}

for (const [tabla, cols] of porTabla) {
  const pk = cols.filter(c => c.pk).map(c => `${c.col}:${tipo(c)}${c.ident ? ':IDENTITY' : ''}`);
  const oblig = cols.filter(c => !c.nulo).map(c => c.col);
  const defs = cols.filter(c => c.def).map(c => c.col);
  console.log(`${tabla}`);
  console.log(`  PK: ${pk.join(', ') || '(ninguna)'}`);
  console.log(`  OBLIGATORIAS: ${oblig.join(', ')}`);
  console.log(`  CON DEFAULT: ${defs.join(', ') || '(ninguna)'}`);
  const raros = cols
    .filter(c => !['uniqueidentifier', 'nvarchar', 'datetime2'].includes(c.tipo) || c.ident)
    .map(c => `${c.col}=${tipo(c)}`);
  console.log(`  TIPOS: ${raros.join(', ') || '(todos uuid/texto/fecha)'}`);
}

await pool.close();
