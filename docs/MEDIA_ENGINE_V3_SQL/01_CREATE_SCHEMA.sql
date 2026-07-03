/*
ATLX MEDIA ENGINE V3 - 01 CREATE SCHEMA
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'me')
BEGIN
    EXEC(N'CREATE SCHEMA me');
END;

SELECT name AS schema_name
FROM sys.schemas
WHERE name = N'me';
