import sql from 'mssql';
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
  .split('\n').filter((l) => /^[A-Z_]+=/.test(l.trim()))
  .map((l) => { const i = l.indexOf('='); const k = l.slice(0, i).trim(); let v = l.slice(i + 1).trim();
    if (/^["']/.test(v) && v.length > 1) v = v.slice(1, -1); return [k, v]; }));
const pool = await new sql.ConnectionPool({ server: env.ME_SQL_HOST, port: Number(env.ME_SQL_PORT || 1433),
  user: env.ME_SQL_USER, password: env.ME_SQL_PASSWORD, database: env.ME_SQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true } }).connect();
const r = await pool.request().query(`SELECT name, definition FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID(N'me.media_rights_origin');`);
console.log(JSON.stringify(r.recordset, null, 1));
await pool.close();
