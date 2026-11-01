/* ============================================================================
   Atlx Media Engine V2 — SUPERFICIE DE PROCEDIMIENTOS NORMALIZADA
   Solución destino : atlx_media_engine
   Esquema          : medios_operacion
   Base             : Atlx_Media_Engine
   Origen           : 15 procedimientos del legacy (media-engine/docs/MEDIA_ENGINE_V3_SQL)
                      reexpresados sobre las 14 tablas materializadas y con
                      nombres fijados en el diccionario de Biblioteca.
                      Superficie vigente: 18 procedimientos.
   Los nombres de estos procedimientos están cargados en el diccionario con
   uso = sp y clasificación = sql. NO se renombran sin actualizar Biblioteca.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   1. registrar_solicitud_media — alta idempotente de la solicitud
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_solicitud_media
    @cliente_integracion_id UNIQUEIDENTIFIER,
    @media_clase            NVARCHAR(40),
    @solicitud_origen_id    NVARCHAR(200),
    @perfil_procesamiento   NVARCHAR(80),
    @media_id               UNIQUEIDENTIFIER = NULL,
    @solicitud_media_id     UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @existente UNIQUEIDENTIFIER;

    /* Idempotencia del cliente: la misma solicitud de origen no se duplica. */
    SELECT @existente = solicitud_media_id
    FROM medios_operacion.solicitudes_medios
    WHERE cliente_integracion_id = @cliente_integracion_id
      AND solicitud_origen_id    = @solicitud_origen_id;

    IF @existente IS NULL
    BEGIN
        SET @solicitud_media_id = ISNULL(@solicitud_media_id, NEWID());

        INSERT INTO medios_operacion.solicitudes_medios
            (solicitud_media_id, media_id, media_clase, cliente_integracion_id,
             solicitud_origen_id, perfil_procesamiento, estado_solicitud_media)
        VALUES
            (@solicitud_media_id, @media_id, @media_clase, @cliente_integracion_id,
             @solicitud_origen_id, @perfil_procesamiento, 'recibida');
    END
    ELSE
        SET @solicitud_media_id = @existente;

    SELECT * FROM medios_operacion.solicitudes_medios
    WHERE solicitud_media_id = @solicitud_media_id;
END
GO

/* ---------------------------------------------------------------------------
   2. registrar_activo_media — alta del activo y de su archivo original
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_activo_media
    @media_clase             NVARCHAR(40),
    @politica_conservacion   NVARCHAR(40),
    @cliente_integracion_id  UNIQUEIDENTIFIER,
    @contenido_tipo          NVARCHAR(120),
    @media_id                UNIQUEIDENTIFIER = NULL OUTPUT,
    @archivo_nombre          NVARCHAR(260) = NULL,
    @archivo_url             NVARCHAR(600) = NULL,
    @formato                 NVARCHAR(60)  = NULL,
    @peso                    BIGINT        = NULL,
    @ancho                   INT           = NULL,
    @alto                    INT           = NULL,
    @duracion                INT           = NULL,
    @orientacion             NVARCHAR(20)  = NULL,
    @checksum                NVARCHAR(200) = NULL,
    @metadatos               NVARCHAR(MAX) = NULL,
    @origen_media_id         NVARCHAR(200) = NULL,
    @estado_media            NVARCHAR(40)  = 'recibido'
AS
BEGIN
    SET NOCOUNT ON;

    SET @media_id = ISNULL(@media_id, NEWID());

    IF EXISTS (SELECT 1 FROM medios_operacion.medios_control WHERE media_id = @media_id)
    BEGIN
        UPDATE medios_operacion.medios_control
        SET media_clase            = @media_clase,
            estado_media           = @estado_media,
            politica_conservacion  = @politica_conservacion,
            cliente_integracion_id = @cliente_integracion_id,
            origen_media_id        = @origen_media_id,
            archivo_nombre         = @archivo_nombre,
            archivo_url            = @archivo_url,
            contenido_tipo         = @contenido_tipo,
            formato                = @formato,
            peso                   = @peso,
            ancho                  = @ancho,
            alto                   = @alto,
            duracion               = @duracion,
            orientacion            = @orientacion,
            checksum               = @checksum,
            metadatos              = @metadatos,
            actualizado_en         = SYSUTCDATETIME()
        WHERE media_id = @media_id;
    END
    ELSE
    BEGIN
        INSERT INTO medios_operacion.medios_control
            (media_id, media_clase, estado_media, politica_conservacion, cliente_integracion_id,
             origen_media_id, archivo_nombre, archivo_url, contenido_tipo, formato, peso,
             ancho, alto, duracion, orientacion, checksum, metadatos)
        VALUES
            (@media_id, @media_clase, @estado_media, @politica_conservacion, @cliente_integracion_id,
             @origen_media_id, @archivo_nombre, @archivo_url, @contenido_tipo, @formato, @peso,
             @ancho, @alto, @duracion, @orientacion, @checksum, @metadatos);
    END

    SELECT * FROM medios_operacion.medios_control WHERE media_id = @media_id;
END
GO

/* ---------------------------------------------------------------------------
   3. resolver_activo_por_origen — no duplicar el activo de un cliente.
   Idempotencia por medios_control.origen_media_id, que es el único término de
   «activo en el sistema de origen» ratificado en la frontera con el Motor.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.resolver_activo_por_origen
    @cliente_integracion_id UNIQUEIDENTIFIER,
    @origen_media_id        NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.*
    FROM medios_operacion.medios_control AS m
    WHERE m.cliente_integracion_id = @cliente_integracion_id
      AND m.origen_media_id        = @origen_media_id;
END
GO

/* ---------------------------------------------------------------------------
   4. consultar_activo_media — activo + original + variantes
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.consultar_activo_media
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM medios_operacion.medios_control WHERE media_id = @media_id;

    SELECT * FROM medios_operacion.medios_variantes
    WHERE media_id = @media_id AND visible = 1
    ORDER BY es_predeterminado DESC, creado_en ASC;

    SELECT * FROM medios_operacion.medios_origenes WHERE media_id = @media_id;
END
GO

/* ---------------------------------------------------------------------------
   5. consultar_solicitud_media — solicitud + sus ejecuciones
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.consultar_solicitud_media
    @solicitud_media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM medios_operacion.solicitudes_medios
    WHERE solicitud_media_id = @solicitud_media_id;

    SELECT * FROM medios_operacion.ejecuciones_media
    WHERE solicitud_media_id = @solicitud_media_id
    ORDER BY creado_en ASC;
END
GO

/* ---------------------------------------------------------------------------
   6. listar_activos_media — enumeración filtrable por cliente
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.listar_activos_media
    @cliente_integracion_id UNIQUEIDENTIFIER = NULL,
    @media_clase            NVARCHAR(40)     = NULL,
    @estado_media           NVARCHAR(40)     = NULL,
    @origen_clase           NVARCHAR(40)     = NULL,
    @desde                  DATETIME2        = NULL,
    @hasta                  DATETIME2        = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.media_id, m.media_clase, m.estado_media, m.politica_conservacion,
           m.archivo_url, m.contenido_tipo, m.peso, m.duracion, m.creado_en
    FROM medios_operacion.medios_control AS m
    WHERE (@cliente_integracion_id IS NULL OR m.cliente_integracion_id = @cliente_integracion_id)
      AND (@media_clase  IS NULL OR m.media_clase  = @media_clase)
      AND (@estado_media IS NULL OR m.estado_media = @estado_media)
      AND (@desde IS NULL OR m.creado_en >= @desde)
      AND (@hasta IS NULL OR m.creado_en <  @hasta)
      AND (@origen_clase IS NULL OR EXISTS (
            SELECT 1 FROM medios_operacion.medios_origenes AS o
            WHERE o.media_id = m.media_id AND o.origen_clase = @origen_clase))
    ORDER BY m.creado_en DESC;
END
GO

/* ---------------------------------------------------------------------------
   7. cancelar_solicitud_media — cierre por orden del cliente
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.cancelar_solicitud_media
    @solicitud_media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE medios_operacion.solicitudes_medios
    SET estado_solicitud_media = 'cancelada',
        actualizado_en         = SYSUTCDATETIME()
    WHERE solicitud_media_id = @solicitud_media_id
      AND estado_solicitud_media NOT IN ('completada','fallida','cancelada');

    UPDATE medios_operacion.ejecuciones_media
    SET estado_ejecucion = 'cancelada',
        terminado_en     = SYSUTCDATETIME(),
        actualizado_en   = SYSUTCDATETIME()
    WHERE solicitud_media_id = @solicitud_media_id
      AND estado_ejecucion IN ('pendiente','en_curso');

    SELECT * FROM medios_operacion.solicitudes_medios
    WHERE solicitud_media_id = @solicitud_media_id;
END
GO

/* ---------------------------------------------------------------------------
   8. encolar_ejecucion_media — abre el intento de procesamiento
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.encolar_ejecucion_media
    @solicitud_media_id UNIQUEIDENTIFIER,
    @ejecucion_modo     NVARCHAR(40),
    @prioridad          INT = 0,
    @intentos_maximos   INT = 3,
    @ejecucion_id       UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @ejecucion_id = ISNULL(@ejecucion_id, NEWID());

    IF NOT EXISTS (SELECT 1 FROM medios_operacion.solicitudes_medios
                   WHERE solicitud_media_id = @solicitud_media_id)
    BEGIN
        RAISERROR('La solicitud no existe en el motor.', 16, 1);
        RETURN;
    END

    INSERT INTO medios_operacion.ejecuciones_media
        (ejecucion_id, solicitud_media_id, media_id, ejecucion_modo, estado_ejecucion,
         prioridad, intentos, intentos_maximos)
    SELECT @ejecucion_id, s.solicitud_media_id, s.media_id, @ejecucion_modo, 'pendiente',
           @prioridad, 0, @intentos_maximos
    FROM medios_operacion.solicitudes_medios AS s
    WHERE s.solicitud_media_id = @solicitud_media_id;

    UPDATE medios_operacion.solicitudes_medios
    SET estado_solicitud_media = 'aceptada',
        actualizado_en         = SYSUTCDATETIME()
    WHERE solicitud_media_id = @solicitud_media_id
      AND estado_solicitud_media = 'recibida';

    SELECT * FROM medios_operacion.ejecuciones_media WHERE ejecucion_id = @ejecucion_id;
END
GO

/* ---------------------------------------------------------------------------
   9. reclamar_ejecucion_media — toma el siguiente trabajo en cola
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.reclamar_ejecucion_media
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @bloqueo_id          UNIQUEIDENTIFIER = NEWID();
    DECLARE @ejecucion_id        UNIQUEIDENTIFIER;
    DECLARE @solicitud_media_id  UNIQUEIDENTIFIER;
    DECLARE @intentos            INT;
    DECLARE @intentos_maximos    INT;

    BEGIN TRANSACTION;

    SELECT TOP (1)
        @ejecucion_id       = e.ejecucion_id,
        @solicitud_media_id = e.solicitud_media_id,
        @intentos           = e.intentos,
        @intentos_maximos   = e.intentos_maximos
    FROM medios_operacion.ejecuciones_media AS e WITH (UPDLOCK, READPAST, ROWLOCK)
    WHERE e.estado_ejecucion = 'pendiente'
      AND e.intentos < e.intentos_maximos
    ORDER BY e.prioridad DESC, e.creado_en ASC;

    IF @ejecucion_id IS NULL
    BEGIN
        COMMIT TRANSACTION;
        RETURN;  -- cola vacía
    END

    INSERT INTO medios_operacion.bloqueos_control
        (bloqueo_id, inicia_en, objeto_clase, objeto_referencia, estado_registro)
    VALUES
        (@bloqueo_id, SYSUTCDATETIME(), 'ejecucion_media',
         CONVERT(NVARCHAR(64), @ejecucion_id), 'activo');

    UPDATE medios_operacion.ejecuciones_media
    SET estado_ejecucion = 'en_curso',
        intentos         = @intentos + 1,
        bloqueo_id       = @bloqueo_id,
        actualizado_en   = SYSUTCDATETIME()
    WHERE ejecucion_id = @ejecucion_id;

    UPDATE medios_operacion.solicitudes_medios
    SET estado_solicitud_media = 'procesando',
        actualizado_en         = SYSUTCDATETIME()
    WHERE solicitud_media_id = @solicitud_media_id
      AND estado_solicitud_media IN ('recibida','aceptada');

    COMMIT TRANSACTION;

    SELECT * FROM medios_operacion.ejecuciones_media WHERE ejecucion_id = @ejecucion_id;
END
GO

/* ---------------------------------------------------------------------------
   10. cerrar_ejecucion_media — resultado, liberación de bloqueo y transición
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.cerrar_ejecucion_media
    @ejecucion_id     UNIQUEIDENTIFIER,
    @estado_ejecucion NVARCHAR(40),   -- terminada | fallida | cancelada
    @error_codigo     NVARCHAR(80)  = NULL,
    @error_mensaje    NVARCHAR(400) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @solicitud_media_id UNIQUEIDENTIFIER;
    DECLARE @media_id           UNIQUEIDENTIFIER;
    DECLARE @bloqueo_id         UNIQUEIDENTIFIER;
    DECLARE @intentos           INT;
    DECLARE @intentos_maximos   INT;

    SELECT @solicitud_media_id = solicitud_media_id,
           @media_id           = media_id,
           @bloqueo_id         = bloqueo_id,
           @intentos           = intentos,
           @intentos_maximos   = intentos_maximos
    FROM medios_operacion.ejecuciones_media
    WHERE ejecucion_id = @ejecucion_id;

    IF @solicitud_media_id IS NULL
    BEGIN
        RAISERROR('La ejecución no existe en el motor.', 16, 1);
        RETURN;
    END

    UPDATE medios_operacion.ejecuciones_media
    SET estado_ejecucion = @estado_ejecucion,
        error_codigo     = @error_codigo,
        error_mensaje    = @error_mensaje,
        terminado_en     = SYSUTCDATETIME(),
        actualizado_en   = SYSUTCDATETIME()
    WHERE ejecucion_id = @ejecucion_id;

    IF @bloqueo_id IS NOT NULL
    BEGIN
        UPDATE medios_operacion.bloqueos_control
        SET estado_registro = 'cerrado',
            expira_en       = SYSUTCDATETIME()
        WHERE bloqueo_id = @bloqueo_id;
    END

    /* Transición de la solicitud: terminada cierra; fallida reintenta o cierra. */
    IF @estado_ejecucion = 'terminada'
        UPDATE medios_operacion.solicitudes_medios
        SET estado_solicitud_media = 'completada',
            error_codigo = NULL, error_mensaje = NULL,
            actualizado_en = SYSUTCDATETIME()
        WHERE solicitud_media_id = @solicitud_media_id;

    IF @estado_ejecucion = 'fallida'
        UPDATE medios_operacion.solicitudes_medios
        SET estado_solicitud_media = CASE WHEN @intentos >= @intentos_maximos
                                          THEN 'fallida' ELSE 'aceptada' END,
            error_codigo  = @error_codigo,
            error_mensaje = @error_mensaje,
            actualizado_en = SYSUTCDATETIME()
        WHERE solicitud_media_id = @solicitud_media_id;

    IF @estado_ejecucion = 'cancelada'
        UPDATE medios_operacion.solicitudes_medios
        SET estado_solicitud_media = 'cancelada',
            actualizado_en = SYSUTCDATETIME()
        WHERE solicitud_media_id = @solicitud_media_id
          AND estado_solicitud_media NOT IN ('completada','fallida');

    /* El activo queda disponible cuando su procesamiento terminó. */
    IF @estado_ejecucion = 'terminada' AND @media_id IS NOT NULL
        UPDATE medios_operacion.medios_control
        SET estado_media = 'disponible', actualizado_en = SYSUTCDATETIME()
        WHERE media_id = @media_id AND estado_media = 'recibido';

    SELECT * FROM medios_operacion.ejecuciones_media WHERE ejecucion_id = @ejecucion_id;
END
GO

/* ---------------------------------------------------------------------------
   11. registrar_variante_media — representación técnica del activo
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_variante_media
    @media_id             UNIQUEIDENTIFIER,
    @variante_clase       NVARCHAR(60),
    @archivo_url          NVARCHAR(600),
    @contenido_tipo       NVARCHAR(120),
    @media_variante_id    UNIQUEIDENTIFIER = NULL OUTPUT,
    @ancho                INT      = NULL,
    @alto                 INT      = NULL,
    @duracion             INT      = NULL,
    @peso                 BIGINT   = NULL,
    @proporcion           NVARCHAR(20) = NULL,
    @perfil_procesamiento NVARCHAR(80) = NULL,
    @es_predeterminado    BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @es_predeterminado = 1
        UPDATE medios_operacion.medios_variantes
        SET es_predeterminado = 0, actualizado_en = SYSUTCDATETIME()
        WHERE media_id = @media_id;

    -- Clave declarada del contrato (prototipo §5): una representación por clase en cada
    -- activo, invariante que impone ux_medios_variantes_media_clase.
    DECLARE @existente UNIQUEIDENTIFIER =
        (SELECT media_variante_id FROM medios_operacion.medios_variantes
          WHERE media_id = @media_id AND variante_clase = @variante_clase);

    IF @existente IS NOT NULL
    BEGIN
        SET @media_variante_id = @existente;

        UPDATE medios_operacion.medios_variantes
        SET variante_clase       = @variante_clase,
            archivo_url          = @archivo_url,
            contenido_tipo       = @contenido_tipo,
            ancho                = @ancho,
            alto                 = @alto,
            duracion             = @duracion,
            peso                 = @peso,
            proporcion           = @proporcion,
            perfil_procesamiento = @perfil_procesamiento,
            es_predeterminado    = @es_predeterminado,
            actualizado_en       = SYSUTCDATETIME()
        WHERE media_variante_id = @media_variante_id;
    END
    ELSE
    BEGIN
        SET @media_variante_id = ISNULL(@media_variante_id, NEWID());

        INSERT INTO medios_operacion.medios_variantes
            (media_variante_id, media_id, variante_clase, archivo_url, contenido_tipo,
             ancho, alto, duracion, peso, proporcion, perfil_procesamiento,
             es_predeterminado, visible)
        VALUES
            (@media_variante_id, @media_id, @variante_clase, @archivo_url, @contenido_tipo,
             @ancho, @alto, @duracion, @peso, @proporcion, @perfil_procesamiento,
             @es_predeterminado, 1);
    END

    SELECT * FROM medios_operacion.medios_variantes
    WHERE media_variante_id = @media_variante_id;
END
GO

/* ---------------------------------------------------------------------------
   12. registrar_superposicion_media — marca de agua o rótulo sobre el activo
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_superposicion_media
    @media_id                UNIQUEIDENTIFIER,
    @media_variante_id       UNIQUEIDENTIFIER = NULL,
    @marca_agua_id           UNIQUEIDENTIFIER = NULL,
    @texto                   NVARCHAR(200) = NULL,
    @posicion                NVARCHAR(40)  = NULL,
    @opacidad                DECIMAL(4,2)  = NULL,
    @visible                 BIT = 1,
    @media_superposicion_id  UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @media_superposicion_id = ISNULL(@media_superposicion_id, NEWID());

    IF EXISTS (SELECT 1 FROM medios_operacion.medios_superposiciones
               WHERE media_superposicion_id = @media_superposicion_id)
        UPDATE medios_operacion.medios_superposiciones
        SET media_variante_id = @media_variante_id,
            marca_agua_id     = @marca_agua_id,
            texto             = @texto,
            posicion          = @posicion,
            opacidad          = @opacidad,
            visible           = @visible
        WHERE media_superposicion_id = @media_superposicion_id;
    ELSE
        INSERT INTO medios_operacion.medios_superposiciones
            (media_superposicion_id, media_id, media_variante_id, marca_agua_id,
             texto, posicion, opacidad, visible)
        VALUES
            (@media_superposicion_id, @media_id, @media_variante_id, @marca_agua_id,
             @texto, @posicion, @opacidad, @visible);

    SELECT * FROM medios_operacion.medios_superposiciones
    WHERE media_superposicion_id = @media_superposicion_id;
END
GO

/* ---------------------------------------------------------------------------
   13. registrar_derivacion_media — un activo nace de otro activo
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_derivacion_media
    @media_id            UNIQUEIDENTIFIER,
    @media_padre_id      UNIQUEIDENTIFIER,
    @media_derivacion_id UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @media_derivacion_id = ISNULL(@media_derivacion_id, NEWID());

    IF NOT EXISTS (SELECT 1 FROM medios_operacion.medios_derivaciones
                   WHERE media_id = @media_id AND media_padre_id = @media_padre_id)
        INSERT INTO medios_operacion.medios_derivaciones
            (media_derivacion_id, media_id, media_padre_id)
        VALUES
            (@media_derivacion_id, @media_id, @media_padre_id);

    SELECT * FROM medios_operacion.medios_derivaciones
    WHERE media_id = @media_id AND media_padre_id = @media_padre_id;
END
GO

/* ---------------------------------------------------------------------------
   14. registrar_derechos_media — derechos declarados del activo
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_derechos_media
    @media_id              UNIQUEIDENTIFIER,
    @titularidad_clase     NVARCHAR(60),
    @derechos_declaracion  NVARCHAR(60),
    @estado_derechos       NVARCHAR(40),
    @licencia_clase        NVARCHAR(60) = NULL,
    @licencia_alcance      NVARCHAR(60) = NULL,
    @obra_laboral          BIT = 0,
    @autor_nombre          NVARCHAR(200) = NULL,
    @autor_alias           NVARCHAR(200) = NULL,
    @contenido_demo        BIT = 0,
    @demo_aviso            NVARCHAR(400) = NULL,
    @marca_agua_detectada  BIT = 0,
    @marca_agua_politica   NVARCHAR(60) = NULL,
    @permitido_mostrar     BIT = 1,
    @permitido_descargar   BIT = 0,
    @permitido_compartir   BIT = 0,
    @permitido_remezclar   BIT = 0,
    @permitido_marca_motor BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM medios_operacion.medios_derechos WHERE media_id = @media_id)
        UPDATE medios_operacion.medios_derechos
        SET titularidad_clase     = @titularidad_clase,
            derechos_declaracion  = @derechos_declaracion,
            estado_derechos       = @estado_derechos,
            licencia_clase        = @licencia_clase,
            licencia_alcance      = @licencia_alcance,
            obra_laboral          = @obra_laboral,
            autor_nombre          = @autor_nombre,
            autor_alias           = @autor_alias,
            contenido_demo        = @contenido_demo,
            demo_aviso            = @demo_aviso,
            marca_agua_detectada  = @marca_agua_detectada,
            marca_agua_politica   = @marca_agua_politica,
            permitido_mostrar     = @permitido_mostrar,
            permitido_descargar   = @permitido_descargar,
            permitido_compartir   = @permitido_compartir,
            permitido_remezclar   = @permitido_remezclar,
            permitido_marca_motor = @permitido_marca_motor,
            actualizado_en        = SYSUTCDATETIME()
        WHERE media_id = @media_id;
    ELSE
        INSERT INTO medios_operacion.medios_derechos
            (media_id, titularidad_clase, derechos_declaracion, estado_derechos,
             licencia_clase, licencia_alcance, obra_laboral, autor_nombre, autor_alias,
             contenido_demo, demo_aviso, marca_agua_detectada, marca_agua_politica,
             permitido_mostrar, permitido_descargar, permitido_compartir,
             permitido_remezclar, permitido_marca_motor)
        VALUES
            (@media_id, @titularidad_clase, @derechos_declaracion, @estado_derechos,
             @licencia_clase, @licencia_alcance, @obra_laboral, @autor_nombre, @autor_alias,
             @contenido_demo, @demo_aviso, @marca_agua_detectada, @marca_agua_politica,
             @permitido_mostrar, @permitido_descargar, @permitido_compartir,
             @permitido_remezclar, @permitido_marca_motor);

    SELECT * FROM medios_operacion.medios_derechos WHERE media_id = @media_id;
END
GO

/* ---------------------------------------------------------------------------
   15. consultar_derechos_media
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.consultar_derechos_media
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM medios_operacion.medios_derechos WHERE media_id = @media_id;
END
GO

/* ---------------------------------------------------------------------------
   16. evaluar_derechos_media — ¿está permitida esta acción sobre el activo?
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.evaluar_derechos_media
    @media_id UNIQUEIDENTIFIER,
    @accion   NVARCHAR(40)   -- mostrar | descargar | compartir | remezclar | marca_motor
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        @media_id AS media_id,
        @accion   AS accion,
        CASE @accion
            WHEN 'mostrar'     THEN ISNULL(d.permitido_mostrar, 0)
            WHEN 'descargar'   THEN ISNULL(d.permitido_descargar, 0)
            WHEN 'compartir'   THEN ISNULL(d.permitido_compartir, 0)
            WHEN 'remezclar'   THEN ISNULL(d.permitido_remezclar, 0)
            WHEN 'marca_motor' THEN ISNULL(d.permitido_marca_motor, 0)
            ELSE 0
        END AS permitido
    FROM medios_operacion.medios_derechos AS d
    WHERE d.media_id = @media_id;
END
GO

/* ---------------------------------------------------------------------------
   17. emitir_evento_media — bitácora del activo y de la ejecución
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.emitir_evento_media
    @evento_tipo    NVARCHAR(60),
    @media_id       UNIQUEIDENTIFIER = NULL,
    @ejecucion_id   UNIQUEIDENTIFIER = NULL,
    @evento_familia NVARCHAR(40)     = NULL,
    @contenido      NVARCHAR(MAX)    = NULL,
    @evento_id      UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @evento_id = ISNULL(@evento_id, NEWID());

    INSERT INTO medios_operacion.medios_eventos
        (evento_id, media_id, ejecucion_id, evento_tipo, evento_familia, contenido, emitido_en)
    VALUES
        (@evento_id, @media_id, @ejecucion_id, @evento_tipo, @evento_familia, @contenido,
         SYSUTCDATETIME());

    SELECT * FROM medios_operacion.medios_eventos WHERE evento_id = @evento_id;
END
GO

/* ---------------------------------------------------------------------------
   18. registrar_origen_media — procedencia del activo
   Cierra el hueco medido en MATRIZ_CONCILIACION_NORMALIZACION_MEDIA_ENGINE_V2.md
   §28.7: `medios_origenes` estaba materializada y ningún procedimiento escribía
   en ella. Idempotente por (`media_id`), invariante que impone
   ux_medios_origenes_media (legacy ux_me_rights_origin_media): UNA sola fila de
   procedencia por activo. Es la misma partición que en derechos — el legacy
   guardaba procedencia y derechos en la misma tabla y en el mismo SP.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE medios_operacion.registrar_origen_media
    @media_id            UNIQUEIDENTIFIER,
    @origen_clase        NVARCHAR(40),
    @origen_plataforma   NVARCHAR(60)   = NULL,
    @origen_contenido_id NVARCHAR(128)  = NULL,
    @origen_url          NVARCHAR(1200) = NULL,
    @media_origen_id     UNIQUEIDENTIFIER = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM medios_operacion.medios_control WHERE media_id = @media_id)
    BEGIN
        RAISERROR('El activo no existe: la procedencia se declara sobre un activo del motor.', 16, 1);
        RETURN;
    END

    SELECT @media_origen_id = media_origen_id
    FROM medios_operacion.medios_origenes
    WHERE media_id = @media_id;

    IF @media_origen_id IS NOT NULL
        UPDATE medios_operacion.medios_origenes
        SET origen_clase        = @origen_clase,
            origen_plataforma   = @origen_plataforma,
            origen_contenido_id = @origen_contenido_id,
            origen_url          = @origen_url,
            actualizado_en      = SYSUTCDATETIME()
        WHERE media_id = @media_id;
    ELSE
    BEGIN
        SET @media_origen_id = ISNULL(@media_origen_id, NEWID());

        INSERT INTO medios_operacion.medios_origenes
            (media_origen_id, media_id, origen_clase, origen_plataforma,
             origen_contenido_id, origen_url)
        VALUES
            (@media_origen_id, @media_id, @origen_clase, @origen_plataforma,
             @origen_contenido_id, @origen_url);
    END

    SELECT * FROM medios_operacion.medios_origenes WHERE media_id = @media_id;
END
GO
