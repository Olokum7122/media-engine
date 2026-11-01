/*
  ATLX MEDIA ENGINE — ÍNDICE POR CÓDIGO DE EVENTO
  Run against Atlx_Mediaengine
  Idempotente.

  MOTIVO MEDIDO
    me.media_event_log tiene 1.028.911 filas y sólo dos índices:
      pk_me_event_log   CLUSTERED (media_event_log_id)
      ix_me_event_media NONCLUSTERED (media_id, created_at)

    Cualquier consulta por event_code —el contador de recuperaciones del reaper
    (MEDIA_JOB_REAPED), el recuento de MEDIA_FAILED por ventana, o el resumen
    operativo por tipo de evento— obliga a un scan clúster completo, porque
    ninguno de los dos índices ordena por event_code.

    Medido antes de crear este índice:
      SELECT COUNT(*) FROM me.media_event_log
      WHERE event_code = N'MEDIA_JOB_REAPED'
        AND created_at >= DATEADD(HOUR,-24,SYSUTCDATETIME())
      → 116 ms, scan clúster, 0 filas devueltas.

    Ese coste no crece con el resultado sino con la tabla: a 1 M de filas ya son
    116 ms por sondeo, y el panel consulta cada pocos segundos. Colgar ese scan
    del polling es lo que hacía inviable exponer la métrica del reaper.

  FORMA DEL ÍNDICE
    (event_code, created_at DESC) — igualdad por código + rango por ventana
    temporal, que es exactamente la forma de las consultas objetivo. No lleva
    columnas incluidas a propósito: el contador sólo necesita COUNT(*), y
    incluir media_id duplicaría el tamaño del índice (el ix_me_event_media ya
    cubre la consulta por media).

  NOTA OPERATIVA
    La instancia es SQL Server Express 16.0.4245.2, así que CREATE INDEX se
    ejecuta con bloqueo (sin ONLINE=ON). La tabla es de eventos append-only y
    el motor escribe en ella desde el worker; la creación es rápida porque el
    índice es estrecho (NVARCHAR(80) + DATETIME2).
*/

SET NOCOUNT ON;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'me.media_event_log')
      AND name = N'ix_me_event_code_created'
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_me_event_code_created
        ON me.media_event_log (event_code, created_at DESC);
END;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'me.media_event_log')
      AND name = N'ix_me_event_code_created'
)
BEGIN
    SELECT N'ix_me_event_code_created_OK' AS install_step;
END
ELSE
BEGIN
    THROW 51000, N'No se pudo crear ix_me_event_code_created', 1;
END;
