/*
ATLX MEDIA ENGINE V3 - 22 CAPACIDAD Y GUARDA HONESTA
Run against ATLX_Mediaengine
NO modifica el modelo de datos del contrato: retira residuos y corrige una
guarda que estaba cerrando el motor a todos los usuarios a la vez.

DEFECTOS QUE CORRIGE (medidos 2026-11-01 sobre 116 109 jobs y 48 h de tráfico)

  1. `sp_media_actor_busy` contaba como trabajo en curso:
       · cualquier request en `queued`/`processing` SIN comprobar que exista un
         job vivo → un job huérfano bloqueaba al actor de forma indefinida.
       · `received`/`uploading` dentro de una ventana de 10 min → un intento de
         subida que murió en red (0 bytes, 0 originales, 0 jobs) cerraba la
         puerta 10 minutos.
     Y lo agrupaba por `source_actor_id`, campo que en Android llega como la
     cadena literal `unknown` en 46 de 47 actores distintos. Resultado: el
     residuo de UN usuario bloqueaba a TODOS, y el mensaje nombraba el
     media_type del intake ajeno. Esa es la causa del 409 en ráfaga.

     Corrección: sólo bloquea trabajo con job vivo (`pending`/`running`), la
     subida en vuelo se mide con su propia ventana y motivo, y un actor sin
     identidad real (marcador compartido) NO se contiene: no hay a quién
     contener, y fingir que sí es lo que rompió el motor. El resultado trae
     `identity_missing` para que el llamador lo sepa.

  2. `sp_media_job_pick_next` no permitía elegir por tipo de media, así que un
     audio —que se resuelve con un `ffprobe`, sin transcodificar— esperaba
     detrás de cada transcodificación de vídeo en una cola FIFO. Se añaden
     `@media_type` y `@exclude_media_type` para que el worker sostenga un carril
     rápido de audio sin inventar una segunda cola ni duplicar el worker.

  3. Paralelos que no prestaban servicio:
       · `ix_me_job_next(status, priority, created_at)` duplicaba la función de
         `ix_me_job_queue(status, next_attempt_at, priority, created_at)`, que
         además cubre el aplazamiento del reintento. Se retira el original.
       · `me.processing_job.channel / post_id / sponsor_id / user_id`: 116 109
         filas, 100 % NULL, ningún objeto del motor las lee, y su DDL vivía en
         el repositorio de Antojados. Se retiran. La metadata transversal vive
         en `me.media_request`, que es donde el contrato la declara.

NO cambia:
  · estados de `media_request`, códigos de variante, ni el pipeline.
  · `ck_me_job_status` (ya admite `dead_letter` desde la 18).
  · el tipo `audio`: se conserva tal cual lo declara la 13.
*/

USE ATLX_Mediaengine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ─── 1. Columnas muertas de processing_job ─────────────────────────────────
-- Antes de retirarlas se comprobó: 0 referencias en SPs/vistas/funciones/
-- triggers, 0 valores no nulos en 116 109 filas y ningún índice que las use.

IF COL_LENGTH('me.processing_job', 'channel') IS NOT NULL
    ALTER TABLE me.processing_job DROP COLUMN channel;

IF COL_LENGTH('me.processing_job', 'post_id') IS NOT NULL
    ALTER TABLE me.processing_job DROP COLUMN post_id;

IF COL_LENGTH('me.processing_job', 'sponsor_id') IS NOT NULL
    ALTER TABLE me.processing_job DROP COLUMN sponsor_id;

IF COL_LENGTH('me.processing_job', 'user_id') IS NOT NULL
    ALTER TABLE me.processing_job DROP COLUMN user_id;

-- ─── 2. Índice de cola duplicado ───────────────────────────────────────────
-- `ix_me_job_queue` es superconjunto: filtra por estado, ordena por prioridad y
-- antigüedad y además respeta `next_attempt_at`. El original sólo servía para
-- sostener la misma consulta y duplicaba el costo de escritura de cada job.

IF EXISTS (SELECT 1 FROM sys.indexes
           WHERE object_id = OBJECT_ID(N'me.processing_job') AND name = N'ix_me_job_next')
    DROP INDEX ix_me_job_next ON me.processing_job;

GO

-- ─── 3. Guarda de actor: sólo trabajo real, sólo identidad real ────────────

CREATE OR ALTER PROCEDURE me.sp_media_actor_busy
    @source_actor_id NVARCHAR(120),
    @source_app NVARCHAR(30) = NULL,
    @stale_received_minutes INT = 10,
    @exclude_client_reference_id NVARCHAR(160) = NULL,
    @exclude_client_reference_prefix NVARCHAR(120) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    /*
      Un actor sin identidad real no se puede contener: todos los usuarios que
      comparten el marcador (`unknown`, `anon`, vacío) colisionarían entre sí.
      En ese caso se devuelve libre y `identity_missing = 1`, que es un defecto
      del llamador —debe enviar el id de sesión— y no del usuario que publica.
    */
    DECLARE @placeholder BIT = 0;

    IF @source_actor_id IS NULL
       OR LTRIM(RTRIM(@source_actor_id)) = N''
       OR LOWER(@source_actor_id) IN (N'unknown', N'anon', N'anonymous', N'null', N'undefined', N'undefined_user')
        SET @placeholder = 1;

    IF @placeholder = 1
    BEGIN
        SELECT CAST(0 AS BIT)              AS busy,
               CAST(0 AS BIGINT)           AS active_count,
               CAST(NULL AS UNIQUEIDENTIFIER) AS media_id,
               CAST(NULL AS NVARCHAR(20))  AS media_type,
               CAST(NULL AS NVARCHAR(20))  AS status,
               CAST(NULL AS NVARCHAR(40))  AS target_context,
               CAST(0 AS INT)              AS elapsed_seconds,
               CAST(1 AS BIT)              AS identity_missing,
               CAST(NULL AS NVARCHAR(40))  AS busy_reason;
        RETURN;
    END;

    ;WITH candidate AS (
        SELECT r.media_id, r.media_type, r.status, r.target_context, r.created_at,
               CASE
                   WHEN r.status IN (N'queued', N'processing') THEN N'processing'
                   WHEN r.status IN (N'received', N'uploading') THEN N'upload_in_flight'
                   ELSE N'awaiting_processing'
               END AS busy_reason
        FROM me.media_request r
        WHERE r.source_actor_id = @source_actor_id
          AND (@source_app IS NULL OR r.source_app = @source_app)
          AND (@exclude_client_reference_id IS NULL
               OR r.client_reference_id IS NULL
               OR r.client_reference_id <> @exclude_client_reference_id)
          AND (@exclude_client_reference_prefix IS NULL
               OR r.client_reference_id IS NULL
               OR r.client_reference_id NOT LIKE @exclude_client_reference_prefix + N'%')
          AND (
                /* Trabajo real: hay un job esperando o corriendo para ese media.
                   Un `processing` sin job es un residuo, no trabajo: no bloquea. */
                (r.status IN (N'queued', N'processing')
                 AND EXISTS (SELECT 1 FROM me.processing_job j
                             WHERE j.media_id = r.media_id
                               AND j.status IN (N'pending', N'running')))
                /* Subida en vuelo: ventana propia y motivo propio. */
             OR (r.status IN (N'received', N'uploading')
                 AND r.created_at >= DATEADD(MINUTE, -@stale_received_minutes, SYSUTCDATETIME()))
                /* Subida terminada y aún sin procesar: ventana propia. */
             OR (r.status = N'uploaded'
                 AND r.created_at >= DATEADD(MINUTE, -@stale_received_minutes, SYSUTCDATETIME()))
          )
    )
    SELECT TOP 1
           CAST(1 AS BIT)                                   AS busy,
           COUNT_BIG(*) OVER ()                             AS active_count,
           media_id,
           media_type,
           status,
           target_context,
           DATEDIFF(SECOND, created_at, SYSUTCDATETIME())   AS elapsed_seconds,
           CAST(0 AS BIT)                                   AS identity_missing,
           busy_reason
    FROM candidate
    ORDER BY created_at DESC;

    /* Ningún candidato: el actor está libre. */
    IF @@ROWCOUNT = 0
        SELECT CAST(0 AS BIT)              AS busy,
               CAST(0 AS BIGINT)           AS active_count,
               CAST(NULL AS UNIQUEIDENTIFIER) AS media_id,
               CAST(NULL AS NVARCHAR(20))  AS media_type,
               CAST(NULL AS NVARCHAR(20))  AS status,
               CAST(NULL AS NVARCHAR(40))  AS target_context,
               CAST(0 AS INT)              AS elapsed_seconds,
               CAST(0 AS BIT)              AS identity_missing,
               CAST(NULL AS NVARCHAR(40))  AS busy_reason;
END;

GO

-- ─── 4. Cola: elegir por tipo de media (carril rápido de audio) ────────────
-- El audio no se transcodifica: se mide con ffprobe y se publica `audio_full`.
-- Sin este filtro, mil audios esperan detrás de cada lote de vídeo en FIFO.

CREATE OR ALTER PROCEDURE me.sp_media_job_pick_next
    @worker_id NVARCHAR(120),
    @job_type NVARCHAR(40) = NULL,
    @media_type NVARCHAR(20) = NULL,
    @exclude_media_type NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @picked TABLE (job_id BIGINT);

    ;WITH next_job AS (
        SELECT TOP 1 j.job_id
        FROM me.processing_job j WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE j.status = N'pending'
          AND j.attempts < j.max_attempts
          AND (j.next_attempt_at IS NULL OR j.next_attempt_at <= SYSUTCDATETIME())
          AND (@job_type IS NULL OR j.job_type = @job_type)
          AND (@media_type IS NULL OR EXISTS (
                  SELECT 1 FROM me.media_request rm
                  WHERE rm.media_id = j.media_id AND rm.media_type = @media_type))
          AND (@exclude_media_type IS NULL OR NOT EXISTS (
                  SELECT 1 FROM me.media_request rm
                  WHERE rm.media_id = j.media_id AND rm.media_type = @exclude_media_type))
        ORDER BY j.priority ASC, j.created_at ASC
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
        o.original_url, o.original_storage_path, o.mime_type, o.extension, o.size_bytes,
        o.width, o.height, o.duration_ms, o.sha256_hash
    FROM me.processing_job j
    INNER JOIN @picked p ON p.job_id = j.job_id
    INNER JOIN me.media_request r ON r.media_id = j.media_id
    LEFT JOIN me.media_rights_origin ro ON ro.media_id = j.media_id
    LEFT JOIN me.media_original o ON o.media_id = j.media_id
    ORDER BY o.created_at DESC;
END;

GO

SELECT N'22_CAPACITY_OK' AS install_step;
