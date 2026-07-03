/*
ATLX MEDIA ENGINE V3 - 10 VALIDATE INSTALL
Run against ATLX_MediaEngine
No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;

SELECT DB_NAME() AS current_database;

SELECT s.name AS schema_name
FROM sys.schemas s
WHERE s.name = N'me';

SELECT
    t.name AS table_name
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'me'
ORDER BY t.name;

SELECT
    v.name AS view_name
FROM sys.views v
INNER JOIN sys.schemas s ON s.schema_id = v.schema_id
WHERE s.name = N'me'
ORDER BY v.name;

SELECT
    p.name AS procedure_name
FROM sys.procedures p
INNER JOIN sys.schemas s ON s.schema_id = p.schema_id
WHERE s.name = N'me'
ORDER BY p.name;

SELECT 'media_status_catalog' AS catalog_name, COUNT(*) AS row_count FROM me.media_status_catalog
UNION ALL
SELECT 'media_variant_catalog', COUNT(*) FROM me.media_variant_catalog
UNION ALL
SELECT 'media_error_catalog', COUNT(*) FROM me.media_error_catalog
UNION ALL
SELECT 'processing_profile', COUNT(*) FROM me.processing_profile
UNION ALL
SELECT 'watermark_profile', COUNT(*) FROM me.watermark_profile;

SELECT N'10_VALIDATE_INSTALL_OK' AS install_step;
