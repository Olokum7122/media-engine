/*
ATLX MEDIA ENGINE V3 - 14 MEDIA LIBRARY LIST
Run against ATLX_MediaEngine
No GO

Objetivo:
- Exponer el material de un actor del motor como LISTADO, que es la pieza que
  faltaba para que exista una biblioteca de media en la UI.

Por qué existe esta migración:
- El motor sabía crear (sp_media_request_create), resolver por id
  (sp_media_get_by_id) y entregar payload (sp_media_get_ready_payload), pero no
  tenía NINGÚN acto de enumeración. Sin enumeración, el cliente sólo puede subir
  desde el equipo: no puede reutilizar lo que ya vive en el Engine.
- La biblioteca no decide pertenencia ni derechos: enumera lo que el actor ya
  subió (source_actor_id), opcionalmente acotado por tipo y estado.

Devuelve:
- Identidad y estado del request.
- Metadata del original (nombre, mime, tamaño, duración, dimensiones).
- ready_payload_json, para que el consumidor resuelva las variantes con su
  contrato vigente (Editorial ya tiene mediaMapper.mapReadyPayload).
- thumb_url: primera variante pública por prioridad de grilla/lista.

No expone media de otros actores: source_actor_id es obligatorio.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_list_by_actor
    @source_actor_id NVARCHAR(120),
    @source_app NVARCHAR(30) = NULL,
    @media_type NVARCHAR(20) = NULL,
    @status NVARCHAR(30) = NULL,
    @search NVARCHAR(160) = NULL,
    @limit INT = 60,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @source_actor_id IS NULL OR LTRIM(RTRIM(@source_actor_id)) = N''''
        THROW 51020, N''SOURCE_ACTOR_REQUIRED'', 1;

    IF @limit IS NULL OR @limit < 1 SET @limit = 60;
    IF @limit > 200 SET @limit = 200;
    IF @offset IS NULL OR @offset < 0 SET @offset = 0;

    ;WITH base AS (
        SELECT
            r.media_id,
            r.source_app,
            r.source_actor_type,
            r.source_actor_id,
            r.media_type,
            r.status,
            r.target_context,
            r.client_reference_id,
            r.external_context_id,
            r.post_id,
            r.ready_payload_json,
            r.error_code,
            r.created_at,
            r.ready_at,
            o.original_file_name,
            o.original_url,
            o.mime_type,
            o.size_bytes,
            o.duration_ms,
            o.width,
            o.height
        FROM me.media_request r
        LEFT JOIN me.media_original o ON o.media_id = r.media_id
        WHERE r.source_actor_id = @source_actor_id
          AND (@source_app IS NULL OR r.source_app = @source_app)
          AND (@media_type  IS NULL OR r.media_type  = @media_type)
          AND (@status      IS NULL OR r.status      = @status)
          AND (
                @search IS NULL
                OR o.original_file_name LIKE N''%'' + @search + N''%''
                OR r.client_reference_id LIKE N''%'' + @search + N''%''
          )
    )
    SELECT
        b.media_id,
        b.source_app,
        b.source_actor_type,
        b.source_actor_id,
        b.media_type,
        b.status,
        b.target_context,
        b.client_reference_id,
        b.external_context_id,
        b.post_id,
        b.ready_payload_json,
        b.error_code,
        b.created_at,
        b.ready_at,
        b.original_file_name,
        b.original_url,
        b.mime_type,
        b.size_bytes,
        b.duration_ms,
        b.width,
        b.height,
        v.variant_code AS thumb_variant,
        v.url          AS thumb_url,
        (SELECT COUNT(1) FROM me.media_variant mv WHERE mv.media_id = b.media_id AND mv.is_public = 1) AS variants_public
    FROM base b
    OUTER APPLY (
        SELECT TOP 1 mv.variant_code, mv.url
        FROM me.media_variant mv
        WHERE mv.media_id = b.media_id AND mv.is_public = 1
        ORDER BY CASE mv.variant_code
                     WHEN N''thumb''          THEN 1
                     WHEN N''grid''           THEN 2
                     WHEN N''feed''           THEN 3
                     WHEN N''audio_preview''  THEN 4
                     WHEN N''audio_full''     THEN 5
                     WHEN N''cover''          THEN 6
                     WHEN N''full''           THEN 7
                     ELSE 9
                 END
    ) v
    ORDER BY b.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
');
