-- ============================================================
-- Atlx Media Engine V2 — DDL físico SQL Server
-- Solución canónica: atlx_media_engine · Esquema: medios_operacion
-- Base destino: Atlx_Media_Engine (Contabo, 185.187.235.253)
--
-- Este archivo es la TRADUCCIÓN FÍSICA al motor SQL Server del DDL que compone
-- la Biblioteca SQL en specs/DDL_MEDIA_ENGINE_V2.md (14 tablas · 139 campos).
-- No cambia nombres, ni orden de campos, ni claves, ni referencias.
--
-- Traducción de tipos base del canon -> SQL Server:
--   uuid        -> uniqueidentifier   (regla del canon: toda identidad es uniqueidentifier)
--   timestamptz -> datetime2(7)  NOT NULL DEFAULT (sysutcdatetime())
--   boolean     -> bit
--   integer     -> int
--   bigint      -> bigint
--   numeric     -> decimal(4,2)       (opacidad 0..1)
--   text        -> nvarchar(N)        sin longitud en el canon; N tomado del DDL de
--                                      media de v3 (V3_DDL/05-media-engine) y del rol del campo
--
-- Los índices no vienen del canon (Biblioteca no gobierna índices): son de soporte
-- de clave foránea y de consulta del motor, y van marcados como tales.
-- ============================================================

IF SCHEMA_ID(N'medios_operacion') IS NULL
  EXEC(N'CREATE SCHEMA medios_operacion AUTHORIZATION dbo');
GO

-- ─────────────────────────────────────────────────────────────
-- 1. clientes_integracion  [catalogo] · 7 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.clientes_integracion', N'U') IS NULL
CREATE TABLE medios_operacion.clientes_integracion (
  cliente_integracion_id uniqueidentifier NOT NULL,
  nombre                 nvarchar(120)    NOT NULL,
  ecosistema             nvarchar(40)     NOT NULL,
  sub_ecosistema         nvarchar(40)     NULL,
  estado_registro        nvarchar(20)     NOT NULL,
  creado_en              datetime2(7)     NOT NULL CONSTRAINT df_clientes_integracion_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en         datetime2(7)     NOT NULL CONSTRAINT df_clientes_integracion_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_clientes_integracion PRIMARY KEY (cliente_integracion_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 2. estados_media  [catalogo] · 4 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.estados_media', N'U') IS NULL
CREATE TABLE medios_operacion.estados_media (
  codigo       nvarchar(40) NOT NULL,
  nombre       nvarchar(120) NOT NULL,
  etapa_flujo  nvarchar(40) NULL,
  es_terminal  bit NOT NULL,
  CONSTRAINT pk_estados_media PRIMARY KEY (codigo)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 3. estados_solicitud_media  [catalogo] · 4 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.estados_solicitud_media', N'U') IS NULL
CREATE TABLE medios_operacion.estados_solicitud_media (
  codigo       nvarchar(40) NOT NULL,
  nombre       nvarchar(120) NOT NULL,
  etapa_flujo  nvarchar(40) NULL,
  es_terminal  bit NOT NULL,
  CONSTRAINT pk_estados_solicitud_media PRIMARY KEY (codigo)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 4. bloqueos_control  [principal] · 7 campos
--    alcance polimórfico: objeto_clase declara la entidad bloqueada
--    y objeto_referencia su localizador
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.bloqueos_control', N'U') IS NULL
CREATE TABLE medios_operacion.bloqueos_control (
  bloqueo_id        uniqueidentifier NOT NULL,
  inicia_en         datetime2(7)     NOT NULL,
  expira_en         datetime2(7)     NULL,
  creado_en         datetime2(7)     NOT NULL CONSTRAINT df_bloqueos_control_creado_en DEFAULT (sysutcdatetime()),
  objeto_clase      nvarchar(60)     NOT NULL,
  objeto_referencia nvarchar(128)    NOT NULL,
  estado_registro   nvarchar(20)     NOT NULL,
  CONSTRAINT pk_bloqueos_control PRIMARY KEY (bloqueo_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 5. medios_control  [principal] · 19 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_control', N'U') IS NULL
CREATE TABLE medios_operacion.medios_control (
  media_id               uniqueidentifier NOT NULL,
  media_clase            nvarchar(20)     NOT NULL,
  estado_media           nvarchar(40)     NOT NULL,
  politica_conservacion  nvarchar(40)     NOT NULL,
  cliente_integracion_id uniqueidentifier NOT NULL,
  origen_media_id        nvarchar(128)    NULL,
  archivo_nombre         nvarchar(255)    NULL,
  archivo_url            nvarchar(1200)   NULL,
  contenido_tipo         nvarchar(120)    NOT NULL,
  formato                nvarchar(20)     NULL,
  peso                   bigint           NULL,
  ancho                  int              NULL,
  alto                   int              NULL,
  duracion               int              NULL,
  orientacion            nvarchar(20)     NULL,
  checksum               nvarchar(64)     NULL,
  metadatos              nvarchar(max)    NULL,
  creado_en              datetime2(7)     NOT NULL CONSTRAINT df_medios_control_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en         datetime2(7)     NOT NULL CONSTRAINT df_medios_control_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_control PRIMARY KEY (media_id),
  CONSTRAINT fk_medios_control_estado_media FOREIGN KEY (estado_media) REFERENCES medios_operacion.estados_media (codigo),
  CONSTRAINT fk_medios_control_cliente_integracion_id FOREIGN KEY (cliente_integracion_id) REFERENCES medios_operacion.clientes_integracion (cliente_integracion_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 6. marcas_agua  [catalogo] · 9 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.marcas_agua', N'U') IS NULL
CREATE TABLE medios_operacion.marcas_agua (
  marca_agua_id       uniqueidentifier NOT NULL,
  nombre              nvarchar(120)    NOT NULL,
  marca_agua_logo_id  uniqueidentifier NULL,
  posicion            nvarchar(30)     NULL,
  opacidad            decimal(4,2)     NULL,
  visible             bit              NOT NULL,
  estado_registro     nvarchar(20)     NOT NULL,
  creado_en           datetime2(7)     NOT NULL CONSTRAINT df_marcas_agua_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en      datetime2(7)     NOT NULL CONSTRAINT df_marcas_agua_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_marcas_agua PRIMARY KEY (marca_agua_id),
  CONSTRAINT fk_marcas_agua_marca_agua_logo_id FOREIGN KEY (marca_agua_logo_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 7. medios_variantes  [detalle] · 15 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_variantes', N'U') IS NULL
CREATE TABLE medios_operacion.medios_variantes (
  media_variante_id    uniqueidentifier NOT NULL,
  media_id             uniqueidentifier NOT NULL,
  variante_clase       nvarchar(30)     NOT NULL,
  archivo_url          nvarchar(1200)   NOT NULL,
  contenido_tipo       nvarchar(120)    NOT NULL,
  ancho                int              NULL,
  alto                 int              NULL,
  duracion             int              NULL,
  peso                 bigint           NULL,
  proporcion           nvarchar(20)     NULL,
  perfil_procesamiento nvarchar(60)     NULL,
  es_predeterminado    bit              NOT NULL,
  visible              bit              NOT NULL,
  creado_en            datetime2(7)     NOT NULL CONSTRAINT df_medios_variantes_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en       datetime2(7)     NOT NULL CONSTRAINT df_medios_variantes_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_variantes PRIMARY KEY (media_variante_id),
  CONSTRAINT fk_medios_variantes_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 8. medios_derechos  [detalle] · 20 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_derechos', N'U') IS NULL
CREATE TABLE medios_operacion.medios_derechos (
  media_id                    uniqueidentifier NOT NULL,
  titularidad_clase           nvarchar(40)     NOT NULL,
  licencia_clase              nvarchar(40)     NULL,
  licencia_alcance            nvarchar(40)     NULL,
  derechos_declaracion        nvarchar(400)    NOT NULL,
  estado_derechos             nvarchar(40)     NOT NULL,
  obra_laboral                bit              NULL,
  autor_nombre                nvarchar(120)    NULL,
  autor_alias                 nvarchar(120)    NULL,
  contenido_demo              bit              NULL,
  demo_aviso                  nvarchar(400)    NULL,
  marca_agua_detectada        bit              NULL,
  marca_agua_politica         nvarchar(40)     NULL,
  permitido_mostrar           bit              NULL,
  permitido_descargar         bit              NULL,
  permitido_compartir         bit              NULL,
  permitido_remezclar         bit              NULL,
  permitido_marca_motor       bit              NULL,
  creado_en                   datetime2(7)     NOT NULL CONSTRAINT df_medios_derechos_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en              datetime2(7)     NOT NULL CONSTRAINT df_medios_derechos_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_derechos PRIMARY KEY (media_id),
  CONSTRAINT fk_medios_derechos_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 9. medios_derivaciones  [intermedia] · 4 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_derivaciones', N'U') IS NULL
CREATE TABLE medios_operacion.medios_derivaciones (
  media_derivacion_id uniqueidentifier NOT NULL,
  media_id            uniqueidentifier NOT NULL,
  media_padre_id      uniqueidentifier NOT NULL,
  creado_en           datetime2(7)     NOT NULL CONSTRAINT df_medios_derivaciones_creado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_derivaciones PRIMARY KEY (media_derivacion_id),
  CONSTRAINT fk_medios_derivaciones_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id),
  CONSTRAINT fk_medios_derivaciones_media_padre_id FOREIGN KEY (media_padre_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 10. medios_origenes  [detalle] · 8 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_origenes', N'U') IS NULL
CREATE TABLE medios_operacion.medios_origenes (
  media_origen_id      uniqueidentifier NOT NULL,
  media_id             uniqueidentifier NOT NULL,
  origen_clase         nvarchar(40)     NOT NULL,
  origen_plataforma    nvarchar(60)     NULL,
  origen_contenido_id  nvarchar(128)    NULL,
  origen_url           nvarchar(1200)   NULL,
  creado_en            datetime2(7)     NOT NULL CONSTRAINT df_medios_origenes_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en       datetime2(7)     NOT NULL CONSTRAINT df_medios_origenes_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_origenes PRIMARY KEY (media_origen_id),
  CONSTRAINT fk_medios_origenes_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 11. medios_superposiciones  [detalle] · 9 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_superposiciones', N'U') IS NULL
CREATE TABLE medios_operacion.medios_superposiciones (
  media_superposicion_id uniqueidentifier NOT NULL,
  media_id               uniqueidentifier NOT NULL,
  media_variante_id      uniqueidentifier NULL,
  marca_agua_id          uniqueidentifier NULL,
  texto                  nvarchar(255)    NULL,
  posicion               nvarchar(30)     NULL,
  opacidad               decimal(4,2)     NULL,
  visible                bit              NOT NULL,
  creado_en              datetime2(7)     NOT NULL CONSTRAINT df_medios_superposiciones_creado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_superposiciones PRIMARY KEY (media_superposicion_id),
  CONSTRAINT fk_medios_superposiciones_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id),
  CONSTRAINT fk_medios_superposiciones_media_variante_id FOREIGN KEY (media_variante_id) REFERENCES medios_operacion.medios_variantes (media_variante_id),
  CONSTRAINT fk_medios_superposiciones_marca_agua_id FOREIGN KEY (marca_agua_id) REFERENCES medios_operacion.marcas_agua (marca_agua_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 12. solicitudes_medios  [cola] · 11 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.solicitudes_medios', N'U') IS NULL
CREATE TABLE medios_operacion.solicitudes_medios (
  solicitud_media_id       uniqueidentifier NOT NULL,
  media_id                 uniqueidentifier NULL,
  media_clase              nvarchar(20)     NOT NULL,
  cliente_integracion_id   uniqueidentifier NOT NULL,
  solicitud_origen_id      nvarchar(128)    NULL,
  perfil_procesamiento     nvarchar(60)     NOT NULL,
  estado_solicitud_media   nvarchar(40)     NOT NULL,
  error_codigo             nvarchar(40)     NULL,
  error_mensaje            nvarchar(max)    NULL,
  creado_en                datetime2(7)     NOT NULL CONSTRAINT df_solicitudes_medios_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en           datetime2(7)     NOT NULL CONSTRAINT df_solicitudes_medios_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_solicitudes_medios PRIMARY KEY (solicitud_media_id),
  CONSTRAINT fk_solicitudes_medios_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id),
  CONSTRAINT fk_solicitudes_medios_cliente_integracion_id FOREIGN KEY (cliente_integracion_id) REFERENCES medios_operacion.clientes_integracion (cliente_integracion_id),
  CONSTRAINT fk_solicitudes_medios_estado_solicitud_media FOREIGN KEY (estado_solicitud_media) REFERENCES medios_operacion.estados_solicitud_media (codigo)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 13. ejecuciones_media  [historica] · 14 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.ejecuciones_media', N'U') IS NULL
CREATE TABLE medios_operacion.ejecuciones_media (
  ejecucion_id         uniqueidentifier NOT NULL,
  solicitud_media_id   uniqueidentifier NOT NULL,
  media_id             uniqueidentifier NULL,
  ejecucion_modo       nvarchar(20)     NOT NULL,
  estado_ejecucion     nvarchar(40)     NOT NULL,
  prioridad            int              NOT NULL,
  intentos             int              NOT NULL,
  intentos_maximos     int              NOT NULL,
  bloqueo_id           uniqueidentifier NULL,
  error_codigo         nvarchar(40)     NULL,
  error_mensaje        nvarchar(max)    NULL,
  terminado_en         datetime2(7)     NULL,
  creado_en            datetime2(7)     NOT NULL CONSTRAINT df_ejecuciones_media_creado_en DEFAULT (sysutcdatetime()),
  actualizado_en       datetime2(7)     NOT NULL CONSTRAINT df_ejecuciones_media_actualizado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_ejecuciones_media PRIMARY KEY (ejecucion_id),
  CONSTRAINT fk_ejecuciones_media_solicitud_media_id FOREIGN KEY (solicitud_media_id) REFERENCES medios_operacion.solicitudes_medios (solicitud_media_id),
  CONSTRAINT fk_ejecuciones_media_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id),
  CONSTRAINT fk_ejecuciones_media_bloqueo_id FOREIGN KEY (bloqueo_id) REFERENCES medios_operacion.bloqueos_control (bloqueo_id)
);
GO

-- ─────────────────────────────────────────────────────────────
-- 14. medios_eventos  [historica] · 8 campos
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_eventos', N'U') IS NULL
CREATE TABLE medios_operacion.medios_eventos (
  evento_id       uniqueidentifier NOT NULL,
  media_id        uniqueidentifier NULL,
  ejecucion_id    uniqueidentifier NULL,
  evento_tipo     nvarchar(40)     NOT NULL,
  evento_familia  nvarchar(40)     NULL,
  contenido       nvarchar(max)    NULL,
  emitido_en      datetime2(7)     NOT NULL,
  creado_en       datetime2(7)     NOT NULL CONSTRAINT df_medios_eventos_creado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_eventos PRIMARY KEY (evento_id),
  CONSTRAINT fk_medios_eventos_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id),
  CONSTRAINT fk_medios_eventos_ejecucion_id FOREIGN KEY (ejecucion_id) REFERENCES medios_operacion.ejecuciones_media (ejecucion_id)
);
GO

-- ============================================================
-- ÍNDICES DE SOPORTE DEL MOTOR (no provienen del canon;
-- Biblioteca gobierna estructura, no índices)
-- ============================================================

-- Claves foráneas sin índice propio
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_control_cliente' AND object_id = OBJECT_ID(N'medios_operacion.medios_control'))
  CREATE NONCLUSTERED INDEX ix_medios_control_cliente ON medios_operacion.medios_control (cliente_integracion_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_control_origen' AND object_id = OBJECT_ID(N'medios_operacion.medios_control'))
  CREATE NONCLUSTERED INDEX ix_medios_control_origen ON medios_operacion.medios_control (cliente_integracion_id, origen_media_id) WHERE origen_media_id IS NOT NULL;
-- Invariante del prototipo §4 y contrato de `registrar_variante_media` (§5): una sola
-- representación por clase en cada activo (legacy ux_me_variant_media_code). El DDL
-- anterior traía un índice no único, que no la imponía.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_variantes_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_variantes'))
  DROP INDEX ix_medios_variantes_media ON medios_operacion.medios_variantes;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_medios_variantes_media_clase' AND object_id = OBJECT_ID(N'medios_operacion.medios_variantes'))
  CREATE UNIQUE NONCLUSTERED INDEX ux_medios_variantes_media_clase ON medios_operacion.medios_variantes (media_id, variante_clase);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_derivaciones_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_derivaciones'))
  CREATE NONCLUSTERED INDEX ix_medios_derivaciones_media ON medios_operacion.medios_derivaciones (media_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_derivaciones_padre' AND object_id = OBJECT_ID(N'medios_operacion.medios_derivaciones'))
  CREATE NONCLUSTERED INDEX ix_medios_derivaciones_padre ON medios_operacion.medios_derivaciones (media_padre_id);
-- Invariante del prototipo §4 (legacy ux_me_rights_origin_media): una sola fila de
-- procedencia por activo. El DDL anterior traía un índice no único, que no la imponía.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_origenes_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_origenes'))
  DROP INDEX ix_medios_origenes_media ON medios_operacion.medios_origenes;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_medios_origenes_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_origenes'))
  CREATE UNIQUE NONCLUSTERED INDEX ux_medios_origenes_media ON medios_operacion.medios_origenes (media_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_superposiciones_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_superposiciones'))
  CREATE NONCLUSTERED INDEX ix_medios_superposiciones_media ON medios_operacion.medios_superposiciones (media_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_superposiciones_variante' AND object_id = OBJECT_ID(N'medios_operacion.medios_superposiciones'))
  CREATE NONCLUSTERED INDEX ix_medios_superposiciones_variante ON medios_operacion.medios_superposiciones (media_variante_id) WHERE media_variante_id IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_marcas_agua_logo' AND object_id = OBJECT_ID(N'medios_operacion.marcas_agua'))
  CREATE NONCLUSTERED INDEX ix_marcas_agua_logo ON medios_operacion.marcas_agua (marca_agua_logo_id) WHERE marca_agua_logo_id IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_eventos_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_eventos'))
  CREATE NONCLUSTERED INDEX ix_medios_eventos_media ON medios_operacion.medios_eventos (media_id, emitido_en DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_eventos_ejecucion' AND object_id = OBJECT_ID(N'medios_operacion.medios_eventos'))
  CREATE NONCLUSTERED INDEX ix_medios_eventos_ejecucion ON medios_operacion.medios_eventos (ejecucion_id) WHERE ejecucion_id IS NOT NULL;

-- Índices de trabajo del motor: cola de solicitudes y ejecuciones
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_solicitudes_estado_cola' AND object_id = OBJECT_ID(N'medios_operacion.solicitudes_medios'))
  CREATE NONCLUSTERED INDEX ix_solicitudes_estado_cola ON medios_operacion.solicitudes_medios (estado_solicitud_media, creado_en);
-- Invariante del prototipo §4 y de la dedupe de `registrar_solicitud_media` (legacy
-- ux_me_request_client_ref): una sola solicitud por cliente y origen.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_solicitudes_cliente_origen' AND object_id = OBJECT_ID(N'medios_operacion.solicitudes_medios'))
  DROP INDEX ix_solicitudes_cliente_origen ON medios_operacion.solicitudes_medios;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_solicitudes_cliente_origen' AND object_id = OBJECT_ID(N'medios_operacion.solicitudes_medios'))
  CREATE UNIQUE NONCLUSTERED INDEX ux_solicitudes_cliente_origen ON medios_operacion.solicitudes_medios (cliente_integracion_id, solicitud_origen_id) WHERE solicitud_origen_id IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_ejecuciones_cola' AND object_id = OBJECT_ID(N'medios_operacion.ejecuciones_media'))
  CREATE NONCLUSTERED INDEX ix_ejecuciones_cola ON medios_operacion.ejecuciones_media (estado_ejecucion, prioridad);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_ejecuciones_solicitud' AND object_id = OBJECT_ID(N'medios_operacion.ejecuciones_media'))
  CREATE NONCLUSTERED INDEX ix_ejecuciones_solicitud ON medios_operacion.ejecuciones_media (solicitud_media_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_bloqueos_vigencia' AND object_id = OBJECT_ID(N'medios_operacion.bloqueos_control'))
  CREATE NONCLUSTERED INDEX ix_bloqueos_vigencia ON medios_operacion.bloqueos_control (estado_registro, expira_en);
GO
