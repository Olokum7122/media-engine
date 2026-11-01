import sql from 'mssql';
import fs from 'fs';

const cfg = { server:'185.187.235.253', port:1433, user:'sa', password:process.env.ME_SQL_PASSWORD, database:'Atlx_Mediaengine', options:{encrypt:false,trustServerCertificate:true} };
const ESPERADAS = 7;

const pool = await sql.connect(cfg);

// Estado previo completo: lo que se va a caducar, con su causa medida en disco.
const antes = (await pool.request().query(`
  SELECT mr.media_id, mr.media_type, mr.status, mr.error_code,
         LEFT(ISNULL(mr.error_message,''),140) AS error_message,
         o.original_storage_path, o.size_bytes, o.mime_type,
         CONVERT(varchar(19), mr.created_at, 120) AS created_at,
         (SELECT COUNT(*) FROM me.media_variant v WHERE v.media_id = mr.media_id) AS variantes,
         (SELECT COUNT(*) FROM me.processing_job j WHERE j.media_id = mr.media_id) AS jobs
  FROM me.media_request mr
  OUTER APPLY (SELECT TOP 1 * FROM me.media_original o
               WHERE o.media_id = mr.media_id ORDER BY o.media_original_id DESC) o
  WHERE mr.status = N'failed'
    AND NOT EXISTS (SELECT 1 FROM me.processing_job j WHERE j.media_id = mr.media_id)
  ORDER BY mr.created_at`)).recordset;

console.log('### estado previo');
console.log(JSON.stringify(antes, null, 1));

if (antes.length !== ESPERADAS) {
  console.log(`ABORTADO: se esperaban ${ESPERADAS} peticiones y hay ${antes.length}`);
  await pool.close();
  process.exit(1);
}

// Respaldo recuperable antes de mutar.
const destino = process.env.ARCHIVO_SALIDA;
if (destino) {
  fs.writeFileSync(destino, JSON.stringify({ generado: new Date().toISOString(), motivo: 'caducidad de peticiones fallidas sin job', filas: antes }, null, 2));
  console.log('respaldo escrito:', destino);
}

const tx = new sql.Transaction(pool);
await tx.begin();
try {
  const req = new sql.Request(tx);
  // Mismo patrón que la expiración canónica del reaper (16_MEDIA_ACTOR_GUARD.sql):
  // status, error_code, error_message, expired_at y updated_at. La causa se
  // distingue por evidencia: ruta fuera de /opt (original que nunca llegó a este
  // servidor) frente a original presente pero truncado.
  const upd = await req.query(`
    UPDATE r
    SET status = N'expired',
        error_code = CASE WHEN o.original_storage_path IS NULL OR o.original_storage_path NOT LIKE N'/opt/%'
                          THEN N'ORIGINAL_MISSING' ELSE N'UPLOAD_TRUNCATED' END,
        error_message = CASE WHEN o.original_storage_path IS NULL OR o.original_storage_path NOT LIKE N'/opt/%'
                          THEN N'Original no disponible en el servidor: el archivo no llegó a almacenarse aquí. Sin job de procesamiento; petición caducada.'
                          ELSE N'Original truncado: la petición nunca recibió datos válidos (' + CAST(ISNULL(o.size_bytes,0) AS NVARCHAR(20)) + N' B) y no tiene job de procesamiento; petición caducada.' END,
        expired_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    OUTER APPLY (SELECT TOP 1 * FROM me.media_original o
                 WHERE o.media_id = r.media_id ORDER BY o.media_original_id DESC) o
    WHERE r.status = N'failed'
      AND NOT EXISTS (SELECT 1 FROM me.processing_job j WHERE j.media_id = r.media_id)`);

  const filas = upd.rowsAffected[0];
  console.log('### filas afectadas:', filas);
  if (filas !== ESPERADAS) {
    await tx.rollback();
    console.log(`REVERTIDO: se esperaban ${ESPERADAS} filas, se afectaron ${filas}`);
    await pool.close();
    process.exit(1);
  }
  await tx.commit();
  console.log('COMMIT');
} catch (e) {
  await tx.rollback().catch(() => {});
  console.log('ROLLBACK por error:', e.message);
  await pool.close();
  process.exit(1);
}

const despues = (await pool.request().query(`
  SELECT mr.media_id, mr.status, mr.error_code,
         LEFT(ISNULL(mr.error_message,''),90) AS msg,
         CONVERT(varchar(19), mr.expired_at, 120) AS expired_at
  FROM me.media_request mr
  WHERE mr.status = N'expired'
    AND NOT EXISTS (SELECT 1 FROM me.processing_job j WHERE j.media_id = mr.media_id)
  ORDER BY mr.expired_at DESC`)).recordset;
console.log('### estado posterior');
console.log(JSON.stringify(despues, null, 1));

const resto = (await pool.request().query(`
  SELECT COUNT(*) AS failed_sin_job FROM me.media_request mr
  WHERE mr.status = N'failed'
    AND NOT EXISTS (SELECT 1 FROM me.processing_job j WHERE j.media_id = mr.media_id)`)).recordset[0];
console.log('### failed sin job restantes:', JSON.stringify(resto));

await pool.close();
