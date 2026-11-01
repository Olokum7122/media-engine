import sql from 'mssql';
const cfg={server:'185.187.235.253',port:1433,user:'sa',password:process.env.ME_SQL_PASSWORD,database:'Atlx_Mediaengine',options:{encrypt:false,trustServerCertificate:true}};
const pool=await sql.connect(cfg);
const q=async(l,s)=>{try{const r=await pool.request().query(s);console.log('### '+l);console.log(JSON.stringify(r.recordset,null,1));}catch(e){console.log('### '+l+' ERR '+e.message);}};
await q('media_original duplicado 1F47C9DF', `
SELECT media_original_id, mime_type, size_bytes, width, height,
       CONVERT(varchar(19), created_at, 120) AS created_at, original_storage_path
FROM me.media_original WHERE media_id='1F47C9DF-FF1D-4866-BDC5-D6E318A642A3'`);
await q('conteo distintos', `
SELECT COUNT(DISTINCT mr.media_id) AS distintos, COUNT(*) AS filas
FROM me.media_request mr
WHERE mr.status = N'failed'
  AND NOT EXISTS (SELECT 1 FROM me.processing_job j WHERE j.media_id = mr.media_id)`);
await pool.close();
