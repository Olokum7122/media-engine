-- ============================================================
-- Atlx Media Engine V2 — INCREMENTO 2026-10-06
-- Solución canónica: atlx_media_engine · Esquema: medios_operacion
-- Base destino: Atlx_Media_Engine (Contabo)
--
-- Traducción física de lo que cambió en la Biblioteca SQL después del DDL ya
-- desplegado (atlx_media_engine_v2.sql, 14 tablas · 139 campos):
--
--   1. ALTA de tabla  medios_fichas        (ficha del activo de audio — catálogo musical)
--   2. ALTA de columnas en medios_derivaciones:
--        fragmento_inicio  int NULL   (minuto de inicio del fragmento dentro del activo padre)
--        fragmento_fin     int NULL   (minuto de fin del fragmento)
--
-- No recrea nada existente: es idempotente y no toca las 14 tablas desplegadas.
-- Traducción de tipos: uuid -> uniqueidentifier · text -> nvarchar(N) ·
--   integer -> int · timestamptz -> datetime2(7) DEFAULT (sysutcdatetime())
-- Longitudes por rol (mismo criterio que el DDL base): clase nvarchar(40),
--   título/interprète/género nvarchar(200).
-- ============================================================

USE Atlx_Media_Engine;
GO

-- ─────────────────────────────────────────────────────────────
-- 1. medios_operacion.medios_fichas  [detalle] · 8 columnas
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID(N'medios_operacion.medios_fichas', N'U') IS NULL
CREATE TABLE medios_operacion.medios_fichas (
  media_ficha_id   uniqueidentifier NOT NULL,
  media_id         uniqueidentifier NOT NULL,
  audio_clase      nvarchar(40)     NOT NULL,
  ficha_titulo     nvarchar(200)    NULL,
  ficha_interprete nvarchar(200)    NULL,
  ficha_genero     nvarchar(200)    NULL,
  ficha_tempo      int              NULL,
  creado_en        datetime2(7)     NOT NULL CONSTRAINT df_medios_fichas_creado_en DEFAULT (sysutcdatetime()),
  CONSTRAINT pk_medios_fichas PRIMARY KEY (media_ficha_id),
  CONSTRAINT fk_medios_fichas_media_id FOREIGN KEY (media_id) REFERENCES medios_operacion.medios_control (media_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_medios_fichas_media' AND object_id = OBJECT_ID(N'medios_operacion.medios_fichas'))
  CREATE NONCLUSTERED INDEX ix_medios_fichas_media ON medios_operacion.medios_fichas (media_id);
GO

-- ─────────────────────────────────────────────────────────────
-- 2. medios_operacion.medios_derivaciones · rango del fragmento
-- ─────────────────────────────────────────────────────────────
IF COL_LENGTH(N'medios_operacion.medios_derivaciones', N'fragmento_inicio') IS NULL
  ALTER TABLE medios_operacion.medios_derivaciones ADD fragmento_inicio int NULL;
GO

IF COL_LENGTH(N'medios_operacion.medios_derivaciones', N'fragmento_fin') IS NULL
  ALTER TABLE medios_operacion.medios_derivaciones ADD fragmento_fin int NULL;
GO

-- ============================================================
-- Total: 1 tabla nueva · 2 columnas nuevas · 1 índice.
-- No incluye la ejecución en Contabo (acto aparte, no ejecutado desde aquí).
-- ============================================================
