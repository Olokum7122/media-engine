/**
 * Sonda de solo lectura contra Contabo (SQL Server).
 * Lista bases de datos y mide si el nombre destino del motor V2 choca con el legacy.
 * NO crea ni modifica nada.
 */
import sql from 'mssql';

const connConfig = {
  server: '185.187.235.253',
  port: 1433,
  database: 'master',
  user: 'sa',
  password: 'Olokum681228$',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 15000 },
  connectionTimeout: 20000,
  requestTimeout: 20000,
};

const pool = await new sql.ConnectionPool(connConfig).connect();
console.log('Conectado a', connConfig.server);

const v = await pool.request().query(`SELECT @@VERSION AS v`);
console.log('VERSION:', v.recordset[0].v.split('\n')[0]);

const dbs = await pool.request().query(`
  SELECT d.name, d.create_date, d.collation_name,
         (SELECT COUNT(*) FROM sys.master_files f WHERE f.database_id = d.database_id) AS files
  FROM sys.databases d
  ORDER BY d.name
`);
console.log('\nBASES DE DATOS (' + dbs.recordset.length + '):');
for (const r of dbs.recordset) {
  console.log(`  - ${r.name}  [${r.collation_name}]  creada ${r.create_date.toISOString()}`);
}

const target = await pool.request().query(`
  SELECT name FROM sys.databases
  WHERE name LIKE '%media%' OR name LIKE '%Media%'
`);
console.log('\nBASES QUE CONTIENEN "media":');
for (const r of target.recordset) console.log('  - ' + r.name);

await pool.close();
