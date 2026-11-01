/*
ATLX MEDIA ENGINE V3 - 13 AUDIO MEDIA TYPE
Run against ATLX_MediaEngine
No GO

Objetivo:
- Admitir 'audio' como tipo de media del motor, para que Colaborattor pueda
  registrar la grabación de campo como material fuente (original + referencia).

Razón (defecto medido, no supuesto):
- ck_me_request_media_type sólo admitía (image, video): todo media request de
  audio era rechazado por el esquema.
- processingWorker.processJob lanzaba 'Tipo de media no soportado: audio'
  porque sólo despachaba processImage / processVideo.
- ck_me_variant_type y ck_me_variant_catalog_type tenían la misma restricción,
  así que una variante de audio tampoco habría podido registrarse.

Precedente: 11_EDITORIAL_COLABORATTOR_SOURCE_APPS.sql aplicó este mismo patrón
para abrir source_app a 'colaborattor'.

No se introduce transcodificación de audio: la variante 'audio_full' apunta al
original archivado. El motor conserva y sirve; no edita audio.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ─── 1. media_request.media_type admite audio ───────────────────────────────

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_me_request_media_type')
    ALTER TABLE me.media_request DROP CONSTRAINT ck_me_request_media_type;

ALTER TABLE me.media_request WITH CHECK
    ADD CONSTRAINT ck_me_request_media_type CHECK (media_type IN (N'image', N'video', N'audio'));

-- ─── 2. media_variant.media_type admite audio ───────────────────────────────

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_me_variant_type')
    ALTER TABLE me.media_variant DROP CONSTRAINT ck_me_variant_type;

ALTER TABLE me.media_variant WITH CHECK
    ADD CONSTRAINT ck_me_variant_type CHECK (media_type IN (N'image', N'video', N'audio'));

-- ─── 3. media_variant.variant_code admite los códigos de audio ──────────────

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_me_variant_code')
    ALTER TABLE me.media_variant DROP CONSTRAINT ck_me_variant_code;

ALTER TABLE me.media_variant WITH CHECK
    ADD CONSTRAINT ck_me_variant_code CHECK (variant_code IN (
        N'thumb', N'grid', N'feed', N'full', N'story', N'short', N'cover', N'avatar',
        N'video_preview', N'watermarked', N'feed_video', N'original_safe',
        N'audio_full', N'audio_preview'
    ));

-- ─── 4. catálogo de variantes admite tipo audio ─────────────────────────────

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'ck_me_variant_catalog_type')
    ALTER TABLE me.media_variant_catalog DROP CONSTRAINT ck_me_variant_catalog_type;

ALTER TABLE me.media_variant_catalog WITH CHECK
    ADD CONSTRAINT ck_me_variant_catalog_type CHECK (media_type IN (N'image', N'video', N'both', N'audio'));

-- ─── 5. Catálogo: variantes de audio ────────────────────────────────────────
-- audio_full     → el audio fuente completo (reproducción desde la card). ES LA
--                  ÚNICA variante que el worker produce hoy: apunta al original
--                  archivado, sin copiar bytes.
-- audio_preview  → declarada por contrato para preview/adelanto. No se produce
--                  en esta fase: no hay transcodificación de audio en el motor.

MERGE me.media_variant_catalog AS target
USING (VALUES
    (N'audio_full',    N'Audio completo',  N'audio', 1, 10, 1),
    (N'audio_preview', N'Audio preview',   N'audio', 1, 11, 1)
) AS source (variant_code, display_name, media_type, is_public, sort_order, is_active)
ON target.variant_code = source.variant_code
WHEN NOT MATCHED THEN
    INSERT (variant_code, display_name, media_type, is_public, sort_order, is_active)
    VALUES (source.variant_code, source.display_name, source.media_type,
            source.is_public, source.sort_order, source.is_active)
WHEN MATCHED THEN
    UPDATE SET display_name = source.display_name,
               media_type = source.media_type,
               is_public  = source.is_public,
               sort_order = source.sort_order,
               is_active  = source.is_active;
