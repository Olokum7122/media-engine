/*
ATLX MEDIA ENGINE V3 - 11 EDITORIAL/COLABORATTOR SOURCE APPS
Run against ATLX_MediaEngine
No GO

Objetivo:
- Permitir que ATLX Editorial y ATLX Colaborattor consuman Media Engine como
  source_app propio en contrato v1.
- Mantener compatibilidad con consumidores existentes.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'ck_me_request_source_app'
      AND parent_object_id = OBJECT_ID(N'me.media_request')
)
BEGIN
    ALTER TABLE me.media_request DROP CONSTRAINT ck_me_request_source_app;
END;

ALTER TABLE me.media_request WITH CHECK ADD CONSTRAINT ck_me_request_source_app
CHECK (
    source_app IN (
        N'android',
        N'ios',
        N'explorer',
        N'web',
        N'admin',
        N'worker',
        N'antojados',
        N'editorial',
        N'colaborattor'
    )
);

ALTER TABLE me.media_request CHECK CONSTRAINT ck_me_request_source_app;

SELECT N'11_EDITORIAL_COLABORATTOR_SOURCE_APPS_OK' AS install_step;
