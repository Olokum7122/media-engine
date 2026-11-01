/*
ATLX MEDIA ENGINE V3 - 24 QUEUE INTEGRITY: DEDUPE + RETENCIÓN
Run against ATLX_MediaEngine

POR QUÉ EXISTE
--------------
Medido en la base instalada el 2026-11-01:

  me.processing_job tenía 116.109 filas, 116.108 en `done`. De ellas, 111.567
  pertenecían a SÓLO DOS media de prueba de `colaborattor`
  (59.133 y 52.434 jobs `full_pipeline`, del 10 al 24 de octubre).

Eso no es volumen de usuarios: es un bucle de encolado. `sp_media_original_register`
—el único punto que inserta jobs— hacía:

    INSERT INTO me.processing_job (media_id, job_type, status, priority)
    VALUES (@media_id, N'full_pipeline', N'pending', ...)

sin comprobar nada. Cada reintento del cliente sobre el mismo media encolaba
otro pipeline completo. Con un cliente que reintenta al recibir un error de red,
el bucle es inmediato, y el costo no es sólo de espacio: el job duplicado
reprocesa variantes ya publicadas y compite por los mismos carriles.

QUÉ HACE
--------
1. Índice único FILTRADO sobre jobs activos (pending/running) por media. Hace
   estructuralmente imposible tener dos pipelines en vuelo para el mismo media.
   Los jobs terminados no entran en el filtro, así que el histórico no estorba.
2. Reedita `sp_media_original_register` con dedupe en dos niveles:
     · si el media ya está `ready`, NO encola y devuelve el estado actual;
     · si ya hay un job activo, NO inserta otro y devuelve el job existente;
     · si el mismo `sha256_hash` ya está registrado para ese media, NO duplica
       la fila de `me.media_original`.
3. Reedita `sp_media_job_pick_next` para que no reserve jobs de medios ya
   terminales (ready/failed/canceled/rejected/expired). Es una guarda de
   integridad: un job huérfano sobre un media listo no debe reabrir el pipeline.
4. Añade `sp_media_job_purge_terminated` para drenar jobs terminados por
   antigüedad. Sin esto la tabla crece sin techo aunque el dedupe funcione.

NO cambia tablas ni columnas, no borra datos por sí misma (la purga es una SP que
se invoca con un número de días explícito) y no toca el procesamiento.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

/* ─────────────────────────────────────────────────────────────────────────────
   1. Un solo pipeline activo por media — garantía de esquema.
   ──────────────────────────────────────────────────────────────────────────── */
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'ux_me_job_active_media' AND object_id = OBJECT_ID(N'me.processing_job')
)
BEGIN
    /* Si quedara algún duplicado activo de una instalación previa, el índice no
       puede crearse: se degradan a failed los sobrantes antes de crearlo. */
    ;WITH dup AS (
        SELECT job_id,
               ROW_NUMBER() OVER (PARTITION BY media_id ORDER BY priority ASC, created_at ASC, job_id ASC) AS rn
        FROM me.processing_job
        WHERE status IN (N'pending', N'running')
    )
    UPDATE j
    SET status = N'failed',
        error_code = N'DUPLICATE_ACTIVE_JOB',
        error_message = N'Job duplicado activo retirado al crear ux_me_job_active_media',
        finished_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
    FROM me.processing_job j
    INNER JOIN dup d ON d.job_id = j.job_id
    WHERE d.rn > 1;

    CREATE UNIQUE INDEX ux_me_job_active_media
        ON me.processing_job (media_id)
        WHERE status IN (N'pending', N'running');
END;

/* ─────────────────────────────────────────────────────────────────────────────
   2. Registro de original con dedupe de job y de original.
   ──────────────────────────────────────────────────────────────────────────── */
EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_original_register
    @media_id UNIQUEIDENTIFIER,
    @original_file_name NVARCHAR(260) = NULL,
    @original_url NVARCHAR(1200) = NULL,
    @original_storage_path NVARCHAR(1200) = NULL,
    @mime_type NVARCHAR(120),
    @extension NVARCHAR(20) = NULL,
    @size_bytes BIGINT = NULL,
    @width INT = NULL,
    @height INT = NULL,
    @duration_ms INT = NULL,
    @orientation NVARCHAR(30) = NULL,
    @sha256_hash CHAR(64) = NULL,
    @exif_json NVARCHAR(MAX) = NULL,
    @metadata_json NVARCHAR(MAX) = NULL,
    @priority INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    DECLARE @status NVARCHAR(30);
    SELECT @status = status FROM me.media_request WHERE media_id = @media_id;

    /* ── Caso A: el media ya terminó. Un reintento del cliente NO debe reabrir
          el pipeline ni volver a procesar variantes ya publicadas. ── */
    IF @status IN (N''ready'', N''rejected'', N''canceled'', N''expired'')
    BEGIN
        INSERT INTO me.media_event_log (media_id, event_code, event_message)
        VALUES (@media_id, N''ORIGINAL_REREGISTER_IGNORED'',
                N''Reintento de registro sobre media terminal: no se encola trabajo nuevo'');

        SELECT @media_id AS media_id, @status AS status, CAST(NULL AS BIGINT) AS job_id;
        RETURN;
    END;

    -- ⚠️ No se requiere derechos registrados para subir original.
    IF NOT EXISTS (SELECT 1 FROM me.media_rights_origin WHERE media_id = @media_id)
    BEGIN
        INSERT INTO me.media_event_log (media_id, event_code, event_message)
        VALUES (@media_id, N''RIGHTS_NOT_REGISTERED'', N''No se registraron derechos/origen. El contenido se procesa igualmente. El autor es responsable.'');
    END;

    /* ── Original: no duplicar si ese mismo binario ya está registrado. ── */
    IF NOT EXISTS (
        SELECT 1 FROM me.media_original
        WHERE media_id = @media_id
          AND (
                (@sha256_hash IS NOT NULL AND sha256_hash = @sha256_hash)
             OR (@sha256_hash IS NULL AND original_storage_path IS NOT NULL
                 AND original_storage_path = @original_storage_path)
          )
    )
    BEGIN
        INSERT INTO me.media_original (
            media_id, original_file_name, original_url, original_storage_path, mime_type,
            extension, size_bytes, width, height, duration_ms, orientation, sha256_hash,
            exif_json, metadata_json
        )
        VALUES (
            @media_id, @original_file_name, @original_url, @original_storage_path, @mime_type,
            @extension, @size_bytes, @width, @height, @duration_ms, @orientation, @sha256_hash,
            @exif_json, @metadata_json
        );
    END;

    UPDATE me.media_request
    SET status = N''queued'', uploaded_at = COALESCE(uploaded_at, SYSUTCDATETIME()), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status NOT IN (N''ready'', N''canceled'', N''rejected'', N''expired'');

    /* ── Caso B: ya hay un pipeline activo. Reutilizarlo, no encolar otro. ── */
    DECLARE @job_id BIGINT;
    SELECT @job_id = job_id
    FROM me.processing_job
    WHERE media_id = @media_id AND status IN (N''pending'', N''running'');

    IF @job_id IS NULL
    BEGIN
        INSERT INTO me.processing_job (media_id, job_type, status, priority)
        VALUES (@media_id, N''full_pipeline'', N''pending'', COALESCE(@priority, 100));

        SET @job_id = SCOPE_IDENTITY();

        INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
        VALUES (@media_id, @job_id, N''ORIGINAL_REGISTERED'', N''Original media registered and processing job queued'');
    END
    ELSE
    BEGIN
        INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
        VALUES (@media_id, @job_id, N''ORIGINAL_REGISTERED_REUSED_JOB'',
                N''Ya existía un pipeline activo para este media: se reutiliza en lugar de encolar otro'');
    END;

    SELECT @media_id AS media_id, status, @job_id AS job_id
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

/* ─────────────────────────────────────────────────────────────────────────────
   3. La cola no reserva jobs de medios ya terminales.
   ──────────────────────────────────────────────────────────────────────────── */
EXEC(N'
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
        WHERE j.status = N''pending''
          AND j.attempts < j.max_attempts
          AND (j.next_attempt_at IS NULL OR j.next_attempt_at <= SYSUTCDATETIME())
          AND (@job_type IS NULL OR j.job_type = @job_type)
          /* Un job huérfano sobre un media terminal no debe reabrir el pipeline. */
          AND EXISTS (
                  SELECT 1 FROM me.media_request rt
                  WHERE rt.media_id = j.media_id
                    AND rt.status NOT IN (N''ready'', N''failed'', N''rejected'', N''canceled'', N''expired''))
          AND (@media_type IS NULL OR EXISTS (
                  SELECT 1 FROM me.media_request rm
                  WHERE rm.media_id = j.media_id AND rm.media_type = @media_type))
          AND (@exclude_media_type IS NULL OR NOT EXISTS (
                  SELECT 1 FROM me.media_request rm
                  WHERE rm.media_id = j.media_id AND rm.media_type = @exclude_media_type))
        ORDER BY j.priority ASC, j.created_at ASC
    )
    UPDATE j
    SET status = N''running'',
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
    SET status = N''processing'', updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    INNER JOIN me.processing_job j ON j.media_id = r.media_id
    INNER JOIN @picked p ON p.job_id = j.job_id
    WHERE r.status NOT IN (N''ready'', N''failed'', N''rejected'', N''canceled'', N''expired'');

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
');

/* ─────────────────────────────────────────────────────────────────────────────
   4. Retención: drenar jobs terminados por antigüedad.
      NO se invoca sola. El worker la llama con `ME_WORKER_JOB_RETENTION_DAYS`.
   ──────────────────────────────────────────────────────────────────────────── */
EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_job_purge_terminated
    @older_than_days INT = 7,
    @batch_size INT = 5000
AS
BEGIN
    SET NOCOUNT ON;

    IF @older_than_days IS NULL OR @older_than_days < 1 SET @older_than_days = 7;
    IF @batch_size IS NULL OR @batch_size < 100 SET @batch_size = 100;

    DECLARE @horizon DATETIME2(3) = DATEADD(DAY, -@older_than_days, SYSUTCDATETIME());
    DECLARE @deleted INT = 0;

    ;WITH victim AS (
        SELECT TOP (@batch_size) job_id
        FROM me.processing_job
        WHERE status IN (N''done'', N''failed'', N''canceled'', N''dead_letter'')
          AND COALESCE(finished_at, updated_at, created_at) < @horizon
        ORDER BY COALESCE(finished_at, updated_at, created_at) ASC
    )
    DELETE j
    FROM me.processing_job j
    INNER JOIN victim v ON v.job_id = j.job_id;

    SET @deleted = @@ROWCOUNT;

    IF @deleted > 0
    BEGIN
        INSERT INTO me.media_event_log (media_id, event_code, event_message)
        SELECT TOP 1 media_id, N''JOB_RETENTION_PURGE'',
               CONCAT(N''Retención: '', @deleted, N'' jobs terminados con más de '', @older_than_days, N'' días'')
        FROM me.media_request ORDER BY updated_at DESC;
    END;

    SELECT @deleted AS deleted, @older_than_days AS older_than_days;
END;
');

/* ─────────────────────────────────────────────────────────────────────────────
   Verificación.
   ──────────────────────────────────────────────────────────────────────────── */
SELECT
    (SELECT COUNT(*) FROM sys.indexes
     WHERE name = N'ux_me_job_active_media' AND object_id = OBJECT_ID(N'me.processing_job')) AS indice_activo,
    (SELECT COUNT(*) FROM me.processing_job WHERE status IN (N'pending', N'running')) AS jobs_activos,
    (SELECT COUNT(*) FROM me.processing_job) AS jobs_total,
    N'24_QUEUE_INTEGRITY_OK' AS install_step;
