/*
ATLX MEDIA ENGINE V3 - 00 CREATE DATABASE
Idempotent / No GO
*/

SET NOCOUNT ON;

IF DB_ID(N'ATLX_MediaEngine') IS NULL
BEGIN
    CREATE DATABASE ATLX_MediaEngine;
END;

ALTER DATABASE ATLX_MediaEngine SET RECOVERY SIMPLE;

SELECT
    name AS database_name,
    create_date,
    compatibility_level,
    recovery_model_desc
FROM sys.databases
WHERE name = N'ATLX_MediaEngine';
