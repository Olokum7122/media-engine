/*
ATLX MEDIA ENGINE V3 - 16 ACTOR GUARD (anti-saturación de cola)
Run against ATLX_MediaEngine
Idempotent / No GO

PROPÓSITO
  El motor procesa la cola con UN solo worker secuencial (config.worker.maxBatch
  por ciclo). Si un mismo actor encola varias publicaciones seguidas —cosa que hoy
  nada impide—, cada video paga 3-4 transcodes completos y los que llegan después
  esperan sin techo. Estos dos procedimientos son la medida de contención:

    me.sp_media_actor_busy       — ¿este actor ya tiene multimedia en vuelo?
    me.sp_media_job_reap_stale   — devuelve a la cola (o falla) el trabajo huérfano

  El primero lo consume la guarda 409 de POST /api/media/v1/requests.
  El segundo lo llama processingWorker al inicio de cada ciclo.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_actor_busy
    @source_actor_id NVARCHAR(120),
    @source_app NVARCHAR(30) = NULL,
    @stale_received_minutes INT = 10,
    @exclude_client_reference_id NVARCHAR(160) = NULL,
    @exclude_client_reference_prefix NVARCHAR(120) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @source_actor_id IS NULL OR LTRIM(RTRIM(@source_actor_id)) = N''''
        THROW 51020, N''ACTOR_REQUIRED'', 1;

    IF @stale_received_minutes IS NULL OR @stale_received_minutes < 1
        SET @stale_received_minutes = 10;

    DECLARE @horizon DATETIME2(3) = DATEADD(MINUTE, -@stale_received_minutes, SYSUTCDATETIME());

    DECLARE @media_id UNIQUEIDENTIFIER = NULL,
            @media_type NVARCHAR(20) = NULL,
            @status NVARCHAR(30) = NULL,
            @target_context NVARCHAR(40) = NULL,
            @created_at DATETIME2(3) = NULL,
            @active_count INT = 0;

    /* Una publicación con varios archivos encola una petición por archivo. El
       prefijo del grupo (publishGroupId_) excluye TODAS las peticiones de mi
       propia publicación en curso: la guarda frena publicaciones simultáneas,
       no la galería interna de una misma publicación. */
    SELECT TOP 1
        @media_id = r.media_id,
        @media_type = r.media_type,
        @status = r.status,
        @target_context = r.target_context,
        @created_at = r.created_at
    FROM me.media_request r
    WHERE r.source_actor_id = @source_actor_id
      AND (@source_app IS NULL OR r.source_app = @source_app)
      AND (@exclude_client_reference_id IS NULL
           OR r.client_reference_id IS NULL
           OR r.client_reference_id <> @exclude_client_reference_id)
      AND (@exclude_client_reference_prefix IS NULL
           OR r.client_reference_id IS NULL
           OR r.client_reference_id NOT LIKE @exclude_client_reference_prefix + N''%'')
      AND (
            r.status IN (N''queued'', N''processing'')
         OR (r.status IN (N''received'', N''uploading'', N''uploaded'') AND r.created_at >= @horizon)
      )
    ORDER BY
        CASE WHEN r.status IN (N''processing'', N''queued'') THEN 0 ELSE 1 END,
        r.created_at ASC;

    SELECT @active_count = COUNT(*)
    FROM me.media_request r
    WHERE r.source_actor_id = @source_actor_id
      AND (@source_app IS NULL OR r.source_app = @source_app)
      AND (@exclude_client_reference_id IS NULL
           OR r.client_reference_id IS NULL
           OR r.client_reference_id <> @exclude_client_reference_id)
      AND (@exclude_client_reference_prefix IS NULL
           OR r.client_reference_id IS NULL
           OR r.client_reference_id NOT LIKE @exclude_client_reference_prefix + N''%'')
      AND (
            r.status IN (N''queued'', N''processing'')
         OR (r.status IN (N''received'', N''uploading'', N''uploaded'') AND r.created_at >= @horizon)
      );

    SELECT
        CAST(CASE WHEN @active_count > 0 THEN 1 ELSE 0 END AS BIT) AS busy,
        @active_count AS active_count,
        @media_id AS media_id,
        @media_type AS media_type,
        @status AS status,
        @target_context AS target_context,
        @created_at AS created_at,
        CASE WHEN @created_at IS NULL THEN 0
             ELSE DATEDIFF(SECOND, @created_at, SYSUTCDATETIME())
        END AS elapsed_seconds;
END;
');

EXEC(N'
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
            @job_failed INT = 0,
            @request_failed INT = 0,
            @expired INT = 0;

    /* 1. Jobs en running cuyo lock superó el horizonte: el worker murió o el
          transcode quedó colgado. Si le quedan intentos vuelve a pending; si no,
          se cierra como failed con PROCESSING_TIMEOUT. */
    ;WITH orphan AS (
        SELECT job_id, attempts, max_attempts
        FROM me.processing_job WITH (UPDLOCK, ROWLOCK)
        WHERE status = N''running''
          AND COALESCE(locked_at, started_at, updated_at) < @horizon
    )
    UPDATE j
    SET status = CASE WHEN o.attempts >= o.max_attempts THEN N''failed'' ELSE N''pending'' END,
        locked_by = NULL,
        locked_at = NULL,
        error_code = CASE WHEN o.attempts >= o.max_attempts THEN N''PROCESSING_TIMEOUT'' ELSE NULL END,
        error_message = CASE WHEN o.attempts >= o.max_attempts
                             THEN N''Job reclamado por el reaper: superó el tiempo máximo de ejecución''
                             ELSE NULL END,
        finished_at = CASE WHEN o.attempts >= o.max_attempts THEN SYSUTCDATETIME() ELSE NULL END,
        updated_at = SYSUTCDATETIME()
    FROM me.processing_job j
    INNER JOIN orphan o ON o.job_id = j.job_id;

    SET @requeued = @@ROWCOUNT;

    /* 2. media_request detenido en processing sin job pendiente ni running:
          el trabajo se perdió. Se cierra con el error del último job fallido. */
    UPDATE r
    SET status = N''failed'',
        error_code = ISNULL((
            SELECT TOP 1 j.error_code FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status = N''failed''
            ORDER BY j.updated_at DESC), N''JOB_LOST''),
        error_message = ISNULL((
            SELECT TOP 1 j.error_message FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status = N''failed''
            ORDER BY j.updated_at DESC), N''Sin job activo para el media en procesamiento''),
        failed_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    WHERE r.status = N''processing''
      AND NOT EXISTS (
            SELECT 1 FROM me.processing_job j
            WHERE j.media_id = r.media_id AND j.status IN (N''pending'', N''running'')
      );

    SET @request_failed = @@ROWCOUNT;

    /* 3. Requests que nunca recibieron bytes: el cliente creó la petición y murió.
          Sin esta expiración, un `received` huérfano bloquearía al actor para
          siempre con la guarda de concurrencia. */
    UPDATE me.media_request
    SET status = N''expired'',
        error_code = N''UPLOAD_ABANDONED'',
        error_message = N''La petición no recibió el archivo original dentro de la ventana permitida'',
        expired_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    WHERE status IN (N''received'', N''uploading'')
      AND created_at < @abandon;

    SET @expired = @@ROWCOUNT;

    SELECT @requeued AS jobs_requeued,
           @request_failed AS requests_failed,
           @expired AS requests_expired,
           @stale_minutes AS stale_minutes,
           @abandon_minutes AS abandon_minutes;
END;
');

EXEC(N'
/* Vista de conveniencia para diagnóstico: qué actores tienen trabajo en vuelo. */
CREATE OR ALTER VIEW me.v_media_actor_inflight
AS
    SELECT
        r.source_app,
        r.source_actor_id,
        COUNT(*) AS inflight_count,
        MIN(r.created_at) AS oldest_created_at,
        MAX(CASE WHEN r.status = N''processing'' THEN 1 ELSE 0 END) AS has_processing,
        MAX(r.media_type) AS media_type
    FROM me.media_request r
    WHERE r.status IN (N''received'', N''uploading'', N''uploaded'', N''queued'', N''processing'')
    GROUP BY r.source_app, r.source_actor_id;
');

SELECT N'16_MEDIA_ACTOR_GUARD_OK' AS install_step;
