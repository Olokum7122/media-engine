# DEPRECADO — modelo v2 del Media Engine. NO INSTALAR.

Este directorio contiene el **modelo viejo** del motor (`esquema medios_operacion`,
15 tablas) tal como se escribió el 5-oct-2026. **No forma parte del contrato
vigente** y ningún archivo de `media-engine/src` lo lee.

## Por qué está aquí y no en la basura

- El modelo **v3 es el único contrato**: `docs/MEDIA_ENGINE_V3_SQL/` (00–22).
- El v2 sí se llegó a instalar una vez, en la base `Atlx_Media_Engine` (con guion
  bajo), que **no es** la base del motor (`ATLX_Mediaengine`). Esa base sigue
  existiendo con 15 tablas y dos catálogos poblados
  (`clientes_integracion` 10 filas, `estados_solicitud_media` 14 filas).
- Los archivos no estaban versionados en git, así que borrarlos habría eliminado
  la única copia del modelo y de la estructura de esos catálogos.

## Regla

1. No ejecutar nada de este directorio sobre `ATLX_Mediaengine`.
2. No reintroducir `medios_operacion` ni tablas con ese prefijo.
3. Si se decide retirar la base `Atlx_Media_Engine`, hacerlo como acto explícito
   y reversible (`BACKUP` → verificar → `DROP`), no como efecto de una limpieza
   de código.
