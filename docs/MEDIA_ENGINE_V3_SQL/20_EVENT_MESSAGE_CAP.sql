/*
ATLX MEDIA ENGINE V3 - 20 EVENT MESSAGE CAP (recorte del evento de fallo)
Run against Atlx_Mediaengine
Idempotent / No GO (requiere separadores de batch)

ORDEN: aplicar después del 19.

DEFECTO QUE CORRIGE
  `me.media_event_log.event_message` es NVARCHAR(1000), pero los procedimientos
  que registran un fallo le pasaban el mensaje de error completo, declarado como
  NVARCHAR(2000). Resultado, medido en producción sobre job_id=126424:

    Error al marcar failed en DB: String or binary data would be truncated
    in table 'Atlx_Mediaengine.me.media_event_log', column 'event_message'

  El daño no es el error visible, es la asimetría que deja detrás:

    - Los `UPDATE` de `processing_job` y `media_request` SÍ entraban, porque sus
      columnas `error_message` son NVARCHAR(2000). El job quedaba `failed` y el
      request `failed` — correcto.
    - El `INSERT` del evento reventaba. Y sin evento no queda la causa del fallo:
      el job 126424 aparece hoy como `failed` con `UNSUPPORTED_MEDIA` pero sin
      ninguna fila `MEDIA_FAILED` que explique qué pasó.

  Es decir: el sistema cerraba el trabajo y perdía la evidencia en el mismo
  movimiento. Eso obliga a diagnosticar a ciegas justo en el caso que más lo
  necesita, un fallo permanente.

  El mensaje de ffprobe incluye su versión y el stderr completo: pasa de 1000
  caracteres con facilidad, así que el fallo se disparaba siempre que el error
  era interesante.

CORRECCIÓN
  El recorte se aplica SÓLO al `INSERT` del evento, a 900 caracteres para dejar
  margen bajo el límite de 1000. Los `UPDATE` conservan el mensaje íntegro de
  2000: el diagnóstico detallado vive en `processing_job.error_message` y
  `media_request.error_message`, y el evento se queda con el resumen legible.

  Se corrigen los dos procedimientos que registran fallo, porque los dos tenían
  el mismo defecto:
    - me.sp_media_mark_failed     (fallo directo, sin reintento)
    - me.sp_media_job_retry_or_fail (fallo terminal y dead_letter)
*/

/* ── 1. me.sp_media_mark_failed ──────────────────────────────────────────── */

CREATE OR ALTER PROCEDURE me.sp_media_mark_failed
    @media_id UNIQUEIDENTIFIER,
    @job_id BIGINT = NULL,
    @error_code NVARCHAR(80),
    @error_message NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE me.media_request
    SET status = N'failed', error_code = @error_code, error_message = @error_message,
        failed_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status NOT IN (N'ready', N'canceled', N'rejected', N'expired');

    IF @job_id IS NOT NULL
    BEGIN
        UPDATE me.processing_job
        SET status = N'failed', error_code = @error_code, error_message = @error_message,
            finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
        WHERE job_id = @job_id;
    END;

    /* event_message es NVARCHAR(1000): el mensaje íntegro ya quedó en las
       columnas error_message, aquí sólo cabe el recorte. */
    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id, N'MEDIA_FAILED', LEFT(ISNULL(@error_message, N''), 900));

    SELECT media_id, status, error_code, error_message
    FROM me.media_request
    WHERE media_id = @media_id;
END;
GO

/* ── 2. me.sp_media_job_retry_or_fail ────────────────────────────────────── */

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

    /* El mensaje completo vive en error_message (NVARCHAR(2000)); el evento
       sólo admite 1000 y antes abortaba el INSERT, dejando el fallo sin causa. */
    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id,
            CASE WHEN @outcome = N'dead_letter' THEN N'MEDIA_DEAD_LETTER' ELSE N'MEDIA_FAILED' END,
            LEFT(ISNULL(@error_message, N''), 900));

    SELECT @media_id AS media_id, @outcome AS job_status,
           CAST(NULL AS DATETIME2(3)) AS next_attempt_at,
           0 AS delay_seconds, @attempts AS attempts, @max_attempts AS max_attempts;
END;
GO

SELECT N'20_EVENT_MESSAGE_CAP_OK' AS install_step;
GO
