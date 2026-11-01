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
  const id = (await new sql.Request(tx).query('SELECT NEWID() AS id')).recordset[0].id;
  await new sql.Request(tx).input('id', sql.UniqueIdentifier, id)
    .query(`INSERT INTO me.media_request (media_id, source_app, source_actor_type, source_actor_id,
      target_context, media_type, channel, post_id, status) VALUES (@id, N'antojados', N'user', N'actor-x',
      N'post', N'video', N'feed', N'post-dedupe-001', N'uploading');`);

  const reg = async () => new sql.Request(tx)
    .input('media_id', sql.UniqueIdentifier, id)
    .input('mime_type', sql.NVarChar(120), 'video/mp4')
    .input('sha256_hash', sql.Char(64), 'b'.repeat(64))
    .execute('me.sp_media_original_register');

  const r1 = await reg();
  const r2 = await reg();   // el reintento del cliente
  const r3 = await reg();
  const jobs = await new sql.Request(tx).input('id', sql.UniqueIdentifier, id)
    .query(`SELECT COUNT(*) n, MIN(job_id) primero, MAX(job_id) ultimo FROM me.processing_job WHERE media_id = @id;`);
  const orig = await new sql.Request(tx).input('id', sql.UniqueIdentifier, id)
    .query(`SELECT COUNT(*) n FROM me.media_original WHERE media_id = @id;`);

  console.log(JSON.stringify({
    registro_1: r1.recordset[0], registro_2: r2.recordset[0], registro_3: r3.recordset[0],
    jobs_creados: jobs.recordset[0].n, mismo_job_id: jobs.recordset[0].primero === jobs.recordset[0].ultimo,
    originales_registrados: orig.recordset[0].n,
  }, null, 1));
} finally {
  await tx.rollback();
  console.log('rollback: media de prueba eliminada');
}
await pool.close();
