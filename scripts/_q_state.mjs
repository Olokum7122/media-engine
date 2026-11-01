import sql from 'mssql';
const cfg={server:'185.187.235.253',port:1433,user:'sa',password:process.env.ME_SQL_PASSWORD,database:'Atlx_Mediaengine',options:{encrypt:false,trustServerCertificate:true}};
const pool=await sql.connect(cfg);
const q=async(l,s)=>{try{const r=await pool.request().query(s);console.log('### '+l);console.log(JSON.stringify(r.recordset,null,0));}catch(e){console.log('### '+l+' ERR '+e.message);}};
await q('request corrupto', `SELECT status, error_code, LEFT(ISNULL(error_message,''),90) msg FROM me.media_request WHERE media_id='5EC451CE-EAFC-4E36-8612-2BE325781155'`);
await q('job corrupto', `SELECT job_id, status, attempts, max_attempts, next_attempt_at, error_code FROM me.processing_job WHERE media_id='5EC451CE-EAFC-4E36-8612-2BE325781155'`);
await q('eventos', `SELECT event_code, LEFT(ISNULL(event_message,''),80) m FROM me.media_event_log WHERE media_id='5EC451CE-EAFC-4E36-8612-2BE325781155' ORDER BY event_log_id`);
await q('stats', `EXEC me.sp_media_queue_stats`);
await pool.close();
