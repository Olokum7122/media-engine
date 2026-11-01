import sql from 'mssql';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l.trim()))
  .map(l=>{const i=l.indexOf('=');const k=l.slice(0,i).trim();let v=l.slice(i+1).trim();if(/^["']/.test(v)&&v.length>1)v=v.slice(1,-1);return [k,v];}));
const pool = await new sql.ConnectionPool({server:env.ME_SQL_HOST,port:Number(env.ME_SQL_PORT||1433),
  user:env.ME_SQL_USER,password:env.ME_SQL_PASSWORD,database:env.ME_SQL_DATABASE,
  options:{encrypt:false,trustServerCertificate:true},requestTimeout:60000}).connect();
const tx = new sql.Transaction(pool);
await tx.begin();
try {
  for (const [etiqueta, params] of [['video', {media_type:'video'}], ['audio', {media_type:'audio'}], ['sin filtro', {}]]) {
    const rq = new sql.Request(tx).input('worker_id', sql.NVarChar(120), 'verificacion-25');
    if (params.media_type) rq.input('media_type', sql.NVarChar(20), params.media_type);
    const r = await rq.execute('me.sp_media_job_pick_next');
    console.log(etiqueta, '→ filas:', r.recordset.length);
  }
  const cols = await new sql.Request(tx).query(`SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(N'me.processing_job')
    AND name IN (N'next_attempt_at',N'locked_by',N'locked_at',N'started_at',N'finished_at',N'max_attempts',N'dead_letter_at',N'error_code')`);
  console.log('columnas usadas por pick_next:', cols.recordset.map(r=>r.name).join(', '));
} finally {
  await tx.rollback();
  console.log('rollback: ningún job fue tomado');
}
await pool.close();
