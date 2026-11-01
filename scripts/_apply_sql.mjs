// Aplica una migración del motor separando lotes por GO y verifica el resultado.
import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) { console.error('uso: node scripts/_apply_sql.mjs <archivo>'); process.exit(1); }

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

const raw = fs.readFileSync(file, 'utf8');
const batches = raw.split(/^\s*GO\s*$/gim).map((b) => b.trim()).filter(Boolean);

const pool = await new sql.ConnectionPool({
  server: env.ME_SQL_HOST, port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER, password: env.ME_SQL_PASSWORD,
  database: env.ME_SQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 60000,
}).connect();

let n = 0;
for (const batch of batches) {
  n += 1;
  try {
    const r = await pool.request().query(batch);
    const rows = (r.recordsets || []).flat();
    console.log(`lote ${n}/${batches.length} OK${rows.length ? ' → ' + JSON.stringify(rows[rows.length - 1]) : ''}`);
  } catch (e) {
    console.error(`lote ${n}/${batches.length} FALLO: ${e.message}`);
    await pool.close();
    process.exit(1);
  }
}

await pool.close();
console.log('migración aplicada');
