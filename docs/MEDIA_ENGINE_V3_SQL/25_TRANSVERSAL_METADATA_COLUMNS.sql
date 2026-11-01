/*
ATLX MEDIA ENGINE V3 - 25 TRANSVERSAL METADATA COLUMNS
Run against ATLX_MediaEngine

POR QUÉ EXISTE
--------------
La migración 12 publica `sp_media_register` y la vista con `channel`, `post_id`,
`sponsor_id` y `user_id`, y declara esos parámetros como NVARCHAR(40)/(80)…
pero NUNCA crea las columnas. Medido el 2026-11-01: las columnas existen en
`me.media_request` y `me.media_rights_origin`, sí, pero con

    channel    NVARCHAR(30)
    post_id    NVARCHAR(64)

que son exactamente los tamaños de `Antojados/scripts/00_ddl_engine_add_columns.sql`
—un DDL que vive en el repositorio del CLIENTE y altera el esquema `me.*` del
motor—. Es decir: el esquema del motor lo definió el cliente, y lo definió más
estrecho de lo que el motor declara en sus propios parámetros.

Consecuencias reales de esa divergencia:

  1. `12` no es autosuficiente: sobre una base limpia del motor, la vista falla
     porque `r.channel` no existe. Sólo funciona si antes corrió el script del
     cliente.
  2. Un identificador de post de más de 64 caracteres hace fallar el INSERT del
     registro de media con "String or binary data would be truncated", y el
     cliente lo ve como error de publicación sin causa aparente.

QUÉ HACE
--------
Crea las columnas si faltan y las ensancha a los tamaños que el motor ya declara
en sus parámetros: NVARCHAR(40) para `channel` y NVARCHAR(80) para los tres
identificadores. Ensanchar no pierde datos ni rompe índices: ninguna de estas
columnas está indexada (la única que las referencia es `sp_media_list_by_actor`,
que no depende de la longitud).

NO redefine la vista ni el procedimiento: eso lo hace la 23.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @tables TABLE (tbl SYSNAME);
INSERT INTO @tables (tbl) VALUES (N'me.media_request'), (N'me.media_rights_origin');

DECLARE @tbl SYSNAME, @sql NVARCHAR(MAX);

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT tbl FROM @tables;
OPEN cur;
FETCH NEXT FROM cur INTO @tbl;

WHILE @@FETCH_STATUS = 0
BEGIN
    /* ── channel NVARCHAR(40) ── */
    IF COL_LENGTH(@tbl, N'channel') IS NULL
        EXEC(N'ALTER TABLE ' + @tbl + N' ADD channel NVARCHAR(40) NULL;');

    /* ── post_id / sponsor_id / user_id NVARCHAR(80) ── */
    IF COL_LENGTH(@tbl, N'post_id') IS NULL
        EXEC(N'ALTER TABLE ' + @tbl + N' ADD post_id NVARCHAR(80) NULL;');

    IF COL_LENGTH(@tbl, N'sponsor_id') IS NULL
        EXEC(N'ALTER TABLE ' + @tbl + N' ADD sponsor_id NVARCHAR(80) NULL;');

    IF COL_LENGTH(@tbl, N'user_id') IS NULL
        EXEC(N'ALTER TABLE ' + @tbl + N' ADD user_id NVARCHAR(80) NULL;');

    /* ── Ensanche al tamaño declarado por el motor, sólo si está por debajo. ── */
    IF COL_LENGTH(@tbl, N'channel') < 80
        EXEC(N'ALTER TABLE ' + @tbl + N' ALTER COLUMN channel NVARCHAR(40) NULL;');

    IF COL_LENGTH(@tbl, N'post_id') < 160
        EXEC(N'ALTER TABLE ' + @tbl + N' ALTER COLUMN post_id NVARCHAR(80) NULL;');

    IF COL_LENGTH(@tbl, N'sponsor_id') < 160
        EXEC(N'ALTER TABLE ' + @tbl + N' ALTER COLUMN sponsor_id NVARCHAR(80) NULL;');

    IF COL_LENGTH(@tbl, N'user_id') < 160
        EXEC(N'ALTER TABLE ' + @tbl + N' ALTER COLUMN user_id NVARCHAR(80) NULL;');

    FETCH NEXT FROM cur INTO @tbl;
END;

CLOSE cur;
DEALLOCATE cur;

/* ALTER COLUMN sobre columnas que la vista referencia deja sus metadatos
   obsoletos (SQL Server no la recompila sola porque no es SCHEMABINDING). */
IF OBJECT_ID(N'me.v_media_ready_payload', N'V') IS NOT NULL
    EXEC sp_refreshview N'me.v_media_ready_payload';

/* Verificación: los cuatro campos, en las dos tablas, con el tamaño efectivo. */
SELECT OBJECT_NAME(c.object_id) AS tabla, c.name AS columna, c.max_length / 2 AS caracteres
FROM sys.columns c
WHERE c.object_id IN (OBJECT_ID(N'me.media_request'), OBJECT_ID(N'me.media_rights_origin'))
  AND c.name IN (N'channel', N'post_id', N'sponsor_id', N'user_id')
ORDER BY tabla, columna;

SELECT N'25_TRANSVERSAL_METADATA_OK' AS install_step;
