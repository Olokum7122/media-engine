/*
ATLX MEDIA ENGINE V3 - 18 QUEUE RESILIENCE (reintentos, dead-letter, métricas)
Run against ATLX_Mediaengine
Idempotent / No GO

PROPÓSITO
  Cerrar los dos huecos que hacían que un fallo transitorio se viera como una
  pérdida definitiva:

  1. `sp_media_mark_failed` cerraba job y request en `failed` para siempre. Un
     transcode que muere por timeout, un deadlock o un corte de disco quedaba
     indistinguible de un códec no soportado: el usuario debía volver a subir el
     archivo y el trabajo se perdía aunque la causa fuera temporal.

  2. No existía ningún aplazamiento: todo job nuevo estaba disponible de
     inmediato, de modo que un reintento se ejecutaba en el mismo ciclo que el
     fallo. Eso no es backoff, es martilleo.

  Aquí se añade:
    · `next_attempt_at` — instante a partir del cual el job es elegible.
    · estado `dead_letter` — trabajo agotado o con error permanente, fuera de la
      cola pero conservado para inspección (no se pierde, no se reintenta solo).
    · `sp_media_job_retry_or_fail` — decide reintentar con backoff exponencial o
      cerrar; el request vuelve a `queued` mientras haya esperanza.
    · `sp_media_queue_stats` — profundidad de cola, trabajos en vuelo por worker,
      antigüedad del pendiente más viejo y la dead-letter. Sin esto la saturación
      es invisible hasta que algo falla.
    · `sp_media_job_pick_next` reescrito para respetar `next_attempt_at`.
    · `sp_media_job_reap_stale` limpiando `next_attempt_at` al reencolar.

  NO cambia el contrato de variantes, ni el pipeline, ni los estados de
  `media_request` (usa `queued`, que ya existe en ck_me_request_status).
*/

/* ── 1. Columna de aplazamiento ───────────────────────────────────────────── */

IF COL_LENGTH('me.processing_job', 'next_attempt_at') IS NULL
    ALTER TABLE me.processing_job ADD next_attempt_at DATETIME2(3) NULL;

/* Índice de la cola: el pick filtra por estado y aplazamiento y ordena por
   prioridad y antigüedad. Sin él el pick hace scan sobre 116k filas. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_me_job_queue' AND object_id = OBJECT_ID('me.processing_job'))
    CREATE INDEX ix_me_job_queue
        ON me.processing_job (status, next_attempt_at, priority, created_at)
        INCLUDE (media_id, attempts, max_attempts, job_type);

/* ── 2. Estado dead_letter ────────────────────────────────────────────────── */

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_me_job_status')
    ALTER TABLE me.processing_job DROP CONSTRAINT ck_me_job_status;

ALTER TABLE me.processing_job WITH CHECK
    ADD CONSTRAINT ck_me_job_status CHECK (status IN (
        N'pending', N'running', N'done', N'failed', N'canceled', N'dead_letter'
    ));

/* ── 3. Pick next: respeta el aplazamiento del reintento ──────────────────── */

GO
CREATE OR ALTER PROCEDURE me.sp_media_job_pick_next
    @worker_id NVARCHAR(120),
    @job_type NVARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @picked TABLE (job_id BIGINT);

    ;WITH next_job AS (
        SELECT TOP 1 job_id
        FROM me.processing_job WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE status = N'pending'
          AND attempts < max_attempts
          AND (next_attempt_at IS NULL OR next_attempt_at <= SYSUTCDATETIME())
          AND (@job_type IS NULL OR job_type = @job_type)
        ORDER BY priority ASC, created_at ASC
    )
    UPDATE j
    SET status = N'running',
        attempts = attempts + 1,
        locked_by = @worker_id,
        locked_at = SYSUTCDATETIME(),
        started_at = COALESCE(started_at, SYSUTCDATETIME()),
        next_attempt_at = NULL,
        updated_at = SYSUTCDATETIME()
    OUTPUT inserted.job_id INTO @picked(job_id)
    FROM me.processing_job j
    INNER JOIN next_job n ON n.job_id = j.job_id;

    UPDATE r
    SET status = N'processing', updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    INNER JOIN me.processing_job j ON j.media_id = r.media_id
    INNER JOIN @picked p ON p.job_id = j.job_id
    WHERE r.status NOT IN (N'ready', N'failed', N'rejected', N'canceled', N'expired');

    SELECT
        j.job_id, j.media_id, j.job_type, j.status, j.priority, j.attempts, j.max_attempts,
        r.media_type, r.target_context, r.processing_profile_code, r.processing_profile_version, r.watermark_profile_code,
        ro.origin_type, ro.engine_watermark_policy, ro.allow_engine_watermark,
        o.original_url, o.original_storage_path, o.mime_type, o.extension, o.size_bytes, o.width, o.height, o.duration_ms, o.sha256_hash
    FROM me.processing_job j
    INNER JOIN @picked p ON p.job_id = j.job_id
    INNER JOIN me.media_request r ON r.media_id = j.media_id
    LEFT JOIN me.media_rights_origin ro ON ro.media_id = j.media_id
    LEFT JOIN me.media_original o ON o.media_id = j.media_id
    ORDER BY o.created_at DESC;
END;
GO

/* ── 4. Reintento con backoff o cierre ─────────────────────────────────────
   @retryable lo decide el worker a partir del mensaje de error:
     1 → el fallo puede pasar solo (timeout, deadlock, corte de red/disco)
     0 → el fallo es del archivo o del contrato (códec no soportado, corrupto,
         CHECK constraint, original ausente): reintentar sólo quema CPU.

   Con reintento disponible:
     status = pending, next_attempt_at = now + base * 2^(attempts-1) (tope max)
     media_request = queued  → el cliente que aún espera recibe `processing`,
                               nunca un `failed` prematuro.
   Sin reintento:
     permanente → failed ; agotado → dead_letter
     media_request = failed (terminal, el usuario debe decidir)
   ─────────────────────────────────────────────────────────────────────────── */

GO
CREATE OR ALTER PROCEDURE me.sp_media_job_retry_or_fail
    @media_id UNIQUEIDENTIFIER,
    @job_id BIGINT,
    @error_code NVARCHAR(80),
    @error_message NVARCHAR(2000) = NULL,
    @retryable BIT = 1,
    @base_delay_seconds INT = 30,
    @max_delay_seconds INT = 900
AS
BEGIN
    SET NOCOUNT ON;

    IF @base_delay_seconds IS NULL OR @base_delay_seconds < 1 SET @base_delay_seconds = 30;
    IF @max_delay_seconds IS NULL OR @max_delay_seconds < @base_delay_seconds SET @max_delay_seconds = 900;

    DECLARE @attempts INT, @max_attempts INT, @delay INT, @outcome NVARCHAR(20);

    SELECT @attempts = attempts, @max_attempts = max_attempts
    FROM me.processing_job WITH (UPDLOCK, ROWLOCK)
    WHERE job_id = @job_id;

    /* Job inexistente: se cierra el request con el error recibido. */
    IF @attempts IS NULL
    BEGIN
        EXEC me.sp_media_mark_failed
             @media_id = @media_id, @job_id = NULL,
             @error_code = @error_code, @error_message = @error_message;

        SELECT @media_id AS media_id, N'failed' AS job_status, CAST(NULL AS DATETIME2(3)) AS next_attempt_at,
               0 AS delay_seconds, 0 AS attempts, 0 AS max_attempts;
        RETURN;
    END

    IF @retryable = 1 AND @attempts < @max_attempts
    BEGIN
        SET @delay = @base_delay_seconds * POWER(2, @attempts - 1);
        IF @delay > @max_delay_seconds SET @delay = @max_delay_seconds;

        UPDATE me.processing_job
        SET status = N'pending',
            next_attempt_at = DATEADD(SECOND, @delay, SYSUTCDATETIME()),
            locked_by = NULL,
            locked_at = NULL,
            finished_at = NULL,
            error_code = @error_code,
            error_message = @error_message,
            updated_at = SYSUTCDATETIME()
        WHERE job_id = @job_id;

        UPDATE me.media_request
        SET status = N'queued', updated_at = SYSUTCDATETIME()
        WHERE media_id = @media_id
          AND status NOT IN (N'ready', N'failed', N'rejected', N'canceled', N'expired');

        INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
        VALUES (@media_id, @job_id, N'MEDIA_RETRY_SCHEDULED',
                CONCAT(N'Reintento ', @attempts + 1, N' de ', @max_attempts,
                       N' en ', @delay, N's tras ', @error_code, N': ',
                       LEFT(ISNULL(@error_message, N''), 200)));

        SELECT @media_id AS media_id, N'pending' AS job_status,
               DATEADD(SECOND, @delay, SYSUTCDATETIME()) AS next_attempt_at,
               @delay AS delay_seconds, @attempts AS attempts, @max_attempts AS max_attempts;
        RETURN;
    END

    SET @outcome = CASE WHEN @retryable = 0 THEN N'failed' ELSE N'dead_letter' END;

    UPDATE me.processing_job
    SET status = @outcome,
        next_attempt_at = NULL,
        error_code = @error_code,
        error_message = @error_message,
        finished_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    WHERE job_id = @job_id;

    UPDATE me.media_request
    SET status = N'failed',
        error_code = @error_code,
        error_message = @error_message,
        failed_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id
      AND status NOT IN (N'ready', N'canceled', N'rejected', N'expired');

    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id,
            CASE WHEN @outcome = N'dead_letter' THEN N'MEDIA_DEAD_LETTER' ELSE N'MEDIA_FAILED' END,
            @error_message);

    SELECT @media_id AS media_id, @outcome AS job_status,
           CAST(NULL AS DATETIME2(3)) AS next_attempt_at,
           0 AS delay_seconds, @attempts AS attempts, @max_attempts AS max_attempts;
END;
GO

/* ── 5. Reaper: al reencolar, limpiar el aplazamiento ─────────────────────── */

GO
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

    /* 1. Jobs en running cuyo lock superó el horizonte: el worker murió o el
          transcode quedó colgado. Si le quedan intentos vuelve a pending; si no,
          se cierra como dead_letter (agotado, no permanente). */
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
    FROM me.processing_job j
    INNER JOIN orphan o ON o.job_id = j.job_id;

    SET @requeued = @@ROWCOUNT;

    /* 2. media_request detenido en processing sin job pendiente ni running:
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

/* ── 6. Métricas de cola ──────────────────────────────────────────────────── */

GO
CREATE OR ALTER PROCEDURE me.sp_media_queue_stats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SUM(CASE WHEN status = N'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= SYSUTCDATETIME()) THEN 1 ELSE 0 END) AS pending_ready,
        SUM(CASE WHEN status = N'pending' AND next_attempt_at > SYSUTCDATETIME() THEN 1 ELSE 0 END) AS pending_delayed,
        SUM(CASE WHEN status = N'running' THEN 1 ELSE 0 END) AS running,
        SUM(CASE WHEN status = N'dead_letter' THEN 1 ELSE 0 END) AS dead_letter,
        SUM(CASE WHEN status = N'failed' THEN 1 ELSE 0 END) AS failed_total,
        SUM(CASE WHEN status = N'done' THEN 1 ELSE 0 END) AS done_total,
        DATEDIFF_BIG(SECOND,
            MIN(CASE WHEN status = N'pending' THEN created_at END),
            SYSUTCDATETIME()) AS oldest_pending_seconds,
        MIN(CASE WHEN status = N'pending' AND next_attempt_at > SYSUTCDATETIME() THEN next_attempt_at END) AS next_retry_at
    FROM me.processing_job;

    SELECT locked_by, COUNT(*) AS in_flight, MIN(locked_at) AS oldest_lock
    FROM me.processing_job
    WHERE status = N'running'
    GROUP BY locked_by;

    SELECT TOP 20 job_id, media_id, attempts, max_attempts, error_code,
           LEFT(error_message, 200) AS error_message, finished_at
    FROM me.processing_job
    WHERE status = N'dead_letter'
    ORDER BY finished_at DESC;

    SELECT COUNT(*) AS retries_last_hour
    FROM me.media_event_log
    WHERE event_code = N'MEDIA_RETRY_SCHEDULED'
      AND created_at >= DATEADD(HOUR, -1, SYSUTCDATETIME());
END;
GO
