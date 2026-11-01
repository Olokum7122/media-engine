/* ============================================================================
   Atlx Media Engine V2 — SEED DE CATÁLOGOS DE ESTADO
   Solución : atlx_media_engine · Esquema: medios_operacion
   Base     : Atlx_Media_Engine
   Valores declarados en SPEC_MEDIA_ENGINE_V2.md §7. Idempotente (MERGE).
   ============================================================================ */

/* --- estados_media: ciclo de disponibilidad del activo ------------------- */
MERGE medios_operacion.estados_media AS d
USING (VALUES
    ('recibido',   N'recibido',   N'ingreso',        0),
    ('disponible', N'disponible', N'disponibilidad', 0),
    ('retirado',   N'retirado',   N'cierre',         1),
    ('expirado',   N'expirado',   N'vencimiento',    1)
) AS s (codigo, nombre, etapa_flujo, es_terminal)
ON d.codigo = s.codigo
WHEN MATCHED THEN UPDATE SET d.nombre = s.nombre, d.etapa_flujo = s.etapa_flujo,
                             d.es_terminal = s.es_terminal
WHEN NOT MATCHED THEN INSERT (codigo, nombre, etapa_flujo, es_terminal)
     VALUES (s.codigo, s.nombre, s.etapa_flujo, s.es_terminal);
GO

/* --- estados_solicitud_media: ciclo de la solicitud en su cola ----------- */
MERGE medios_operacion.estados_solicitud_media AS d
USING (VALUES
    ('recibida',   N'recibida',   N'ingreso',  0),
    ('aceptada',   N'aceptada',   N'admision', 0),
    ('procesando', N'procesando', N'proceso',  0),
    ('completada', N'completada', N'cierre',   1),
    ('fallida',    N'fallida',    N'cierre',   1),
    ('cancelada',  N'cancelada',  N'cierre',   1)
) AS s (codigo, nombre, etapa_flujo, es_terminal)
ON d.codigo = s.codigo
WHEN MATCHED THEN UPDATE SET d.nombre = s.nombre, d.etapa_flujo = s.etapa_flujo,
                             d.es_terminal = s.es_terminal
WHEN NOT MATCHED THEN INSERT (codigo, nombre, etapa_flujo, es_terminal)
     VALUES (s.codigo, s.nombre, s.etapa_flujo, s.es_terminal);
GO
