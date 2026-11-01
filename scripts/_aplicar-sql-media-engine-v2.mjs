/**
 * Aplica un archivo .sql por lotes separados por GO contra Atlx_Media_Engine (Contabo).
 * Uso: node scripts/_aplicar-sql-media-engine-v2.mjs <ruta.sql> [<ruta2.sql> ...]
 */
import fs from 'node:fs';
import sql from 'mssql';

const base = {
  server: '185.187.235.253',
  port: 1433,
  user: 'sa',
  password: 'Olokum681228$',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 15000 },
  connectionTimeout: 20000,
  requestTimeout: 120000,
};

const rutas = process.argv.slice(2);
if (!rutas.length) {
  console.error('Uso: node scripts/_aplicar-sql-media-engine-v2.mjs <ruta.sql> [...]');
  process.exit(1);
}

const pool = await new sql.ConnectionPool({ ...base, database: 'Atlx_Media_Engine' }).connect();

for (const ruta of rutas) {
  const texto = fs.readFileSync(ruta, 'utf8');
  const sinComentarios = b => b
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--[^\n]*/g, '')
    .trim();

  const lotes = texto
    .split(/^\s*GO\s*$/gim)
    .map(b => b.trim())
    .filter(b => b.length > 0 && sinComentarios(b).length > 0);

  console.log(`\n== ${ruta} — ${lotes.length} lote(s)`);
  let i = 0;
  for (const lote of lotes) {
    i++;
    const primera = lote.replace(/--[^\n]*/g, '').trim().split('\n').find(l => l.trim()) || '';
    try {
      await pool.request().batch(lote);
      console.log(`  [ok] ${i}/${lotes.length}  ${primera.trim().slice(0, 90)}`);
    } catch (e) {
      console.error(`  [FALLA] ${i}/${lotes.length}  ${primera.trim().slice(0, 90)}`);
      console.error(`         ${e.message}`);
      await pool.close();
      process.exit(2);
    }
  }
}

await pool.close();
console.log('\nAplicación completada.');
