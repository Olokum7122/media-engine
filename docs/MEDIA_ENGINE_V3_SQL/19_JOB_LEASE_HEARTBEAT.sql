/*
ATLX MEDIA ENGINE V3 - 19 JOB LEASE HEARTBEAT (latido de lease + reaper con rastro)
Run against Atlx_Mediaengine
Idempotent / No GO (requiere separadores de batch)

ORDEN DE APLICACIÓN: 16 → 18 → 19.
  `me.sp_media_job_reap_stale` se define en el 16 (v1), se reescribe en el 18 (v2,
  con dead_letter y limpieza de next_attempt_at) y se vuelve a reescribir aquí
  (v3). Aplicar el 16 después del 19 revierte a v1 y reintroduce la regresión.

PROPÓSITO
  Cerrar el último hueco del mecanismo de lease/recovery:

  1. NO EXISTÍA LATIDO. `sp_media_job_mark_running` escribía `locked_at` una sola
     vez, al reservar el job, y nada lo refrescaba después. El reaper declara
     huérfano todo job `running` cuyo lock supera `staleJobMinutes` (10 min por
     defecto), así que un transcode LEGÍTIMO más largo que ese horizonte se
     devolvía a `pending` mientras su ffmpeg seguía vivo: el mismo media acababa
     procesado dos veces y, como `attempts` ya se había incrementado, el job
     podía terminar en `dead_letter` sin haber fallado nunca.
     Con el techo de ffmpeg en 300 s por variante y dos variantes por video, un
     original largo supera los 10 minutos con holgura, así que el riesgo es real.

     `me.sp_media_job_heartbeat` renueva `locked_at` mientras el worker trabaja.
     Con el latido en 60 s, un lock más viejo que 10 min ya no significa
     "transcode lento": significa "worker muerto".

  2. EL REAPER NO DEJABA RASTRO. Devolver un job a la cola era invisible: no
     escribía en `me.media_event_log`. Un reencolado falso (o repetido) no se
     podía diagnosticar mirando la base. Ahora cada job reclamado queda como
     `MEDIA_JOB_REAPED` con sus intentos y el resultado.

  El latido devuelve `renewed = 0` cuando el job ya no le pertenece al worker
  (el reaper lo reclamó, o alguien lo cerró). El worker lo interpreta como
  pérdida de propiedad y ABORTA antes de persistir variantes: sin eso, sus
  resultados chocarían con los del nuevo dueño.
*/

/* ── 1. Latido del lease ──────────────────────────────────────────────────── */

CREATE OR ALTER PROCEDURE me.sp_media_job_heartbeat
    @job_id BIGINT,
    @worker_id NVARCHAR(120) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @renewed INT = 0;

    /* Sólo renueva si el job sigue `running` Y sigue siendo de este worker.
       Si el reaper ya lo devolvió a `pending` (o lo cerró), `locked_by` es NULL
       y la condición falla: la respuesta es renewed = 0. */
    UPDATE me.processing_job
    SET locked_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    WHERE job_id = @job_id
      AND status = N'running'
      AND (@worker_id IS NULL OR locked_by = @worker_id);

    SET @renewed = @@ROWCOUNT;

    SELECT @renewed AS renewed,
           @job_id AS job_id,
           (SELECT status FROM me.processing_job WHERE job_id = @job_id) AS status,
           (SELECT locked_by FROM me.processing_job WHERE job_id = @job_id) AS locked_by;
END;
GO

/* ── 2. Reaper v3: igual que el 18, pero registrando cada reclamo ─────────── */

CREATE OR ALTER PROCEDURE me.sp_media_job_reap_stale
    @stale_minutes INT = 10,
    @abandon_minutes INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    IF @stale_minutes IS NULL OR @stale_minutes < 1 SET @stale_minutes = 10;
    IF @abandon_minutes IS NULL OR @abandon_minutes < 1 SET @abandon_minutes = 30;

    DECLARE @horizon DATETIME2(3) = DATEADD(MINUTE, -@stale_minutes, SYSUTCDATETIME());
    DECLARE @abandon DATETIME2(3) = DATEADD(MINUTE, -@abandon_minutes, SYSUTCDATETIME());

    DECLARE @requeued INT = 0,
            @request_failed INT = 0,
            @expired INT = 0;

    DECLARE @reaped TABLE (job_id BIGINT, media_id UNIQUEIDENTIFIER, attempts INT, max_attempts INT);

    /* 1. Jobs en `running` cuyo lock superó el horizonte y que dejaron de latir.
          Con el latido del worker, esto ya no captura transcodes lentos: captura
          workers muertos. Se recolectan para dejar evento por cada uno. */
    ;WITH orphan AS (
        SELECT job_id, attempts, max_attempts
        FROM me.processing_job WITH (UPDLOCK, ROWLOCK)
        WHERE status = N'running'
          AND COALESCE(locked_at, started_at, updated_at) < @horizon
    )
    UPDATE j
    SET status = CASE WHEN o.attempts >= o.max_attempts THEN N'dead_letter' ELSE N'pending' END,
        locked_by = NULL,
        locked_at = NULL,
        next_attempt_at = NULL,
        error_code = CASE WHEN o.attempts >= o.max_attempts THEN N'PROCESSING_TIMEOUT' ELSE NULL END,
        error_message = CASE WHEN o.attempts >= o.max_attempts
                             THEN N'Job reclamado por el reaper: superó el tiempo máximo de ejecución'
                             ELSE NULL END,
        finished_at = CASE WHEN o.attempts >= o.max_attempts THEN SYSUTCDATETIME() ELSE NULL END,
        updated_at = SYSUTCDATETIME()
    OUTPUT inserted.job_id, inserted.media_id, o.attempts, o.max_attempts
    INTO @reaped (job_id, media_id, attempts, max_attempts)
    FROM me.processing_job j
    INNER JOIN orphan o ON o.job_id = j.job_id;

    SET @requeued = @@ROWCOUNT;

    /* Rastro del reclamo. `event_message` es NVARCHAR(1000): el CONCAT se recorta
       a 900 para no abortar el INSERT y, con él, la transacción del reaper. */
    IF EXISTS (SELECT 1 FROM @reaped)
        INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
        SELECT
            r.media_id,
            r.job_id,
            N'MEDIA_JOB_REAPED',
            LEFT(CONCAT(
                N'Reaper reclamó el job transcurridos ', @stale_minutes,
                N' min sin latido (intento ', r.attempts, N' de ', r.max_attempts, N')',
                CASE WHEN r.attempts >= r.max_attempts
                     THEN N' → dead_letter' ELSE N' → devuelto a la cola' END
            ), 900)
        FROM @reaped r;

    /* 2. media_request detenido en `processing` sin job pendiente ni running:
          el trabajo se perdió. */
    UPDATE r
    SET status = N'failed',
        error_code = ISNULL((
            SELECT TOP 1 j.error_code FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status IN (N'failed', N'dead_letter')
            ORDER BY j.updated_at DESC), N'JOB_LOST'),
        error_message = ISNULL((
            SELECT TOP 1 j.error_message FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status IN (N'failed', N'dead_letter')
            ORDER BY j.updated_at DESC), N'Sin job activo para el media en procesamiento'),
        failed_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    WHERE r.status = N'processing'
      AND NOT EXISTS (
            SELECT 1 FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status IN (N'pending', N'running')
      );

    SET @request_failed = @@ROWCOUNT;

    /* 3. Requests que nunca recibieron bytes. */
    UPDATE me.media_request
    SET status = N'expired',
        error_code = N'UPLOAD_ABANDONED',
        error_message = N'La petición no recibió el archivo original dentro de la ventana permitida',
        expired_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    WHERE status IN (N'received', N'uploading')
      AND created_at < @abandon;

    SET @expired = @@ROWCOUNT;

    SELECT @requeued AS jobs_requeued,
           @request_failed AS requests_failed,
           @expired AS requests_expired,
           @stale_minutes AS stale_minutes,
           @abandon_minutes AS abandon_minutes;
END;
GO

SELECT N'19_JOB_LEASE_HEARTBEAT_OK' AS install_step;
GO
