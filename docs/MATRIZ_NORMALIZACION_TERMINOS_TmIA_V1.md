# MATRIZ DE NORMALIZACIÓN DE TÉRMINOS — TmIA

**V4 · sin Team Coder.** Una tabla de términos: una fila por término, cinco columnas. Nada más.

> **Por qué existe una V4.** La V3 había cambiado el eje, pero seguía arrastrando el aparato de la cantera dentro del documento: un bloque de 31 términos del **Team Coder** (`specialist_id`, `coder_run_id`, `developer_id`, `dev_cycle_id`, `impact_report`, `tool_call_id`, `capability_mode`, `workspace_id`, `runtime_sources`, `bootstrap_id`, `ledger_id`, `ecosystem_id`…) y varias filas del canon que los llevaban pegados como alias. Eso no es una matriz de TmIA. La V4 los saca —filas y alias— y deja la matriz sobre los tres actores del modelo.
>
> Historial: `TmIA/.historial/MATRIZ_NORMALIZACION_TERMINOS_TmIA_V2_medida_sobre_cantera.md` · `TmIA/.historial/MATRIZ_V3_bloque_poda_cantera_extraido.md` (el bloque retirado, con su veredicto).
> Columnas del canon medidas: `TmIA/.historial/canon_tmia_columnas_39_tablas.txt`.

---

## 0. Qué cambió respecto de la V3

| Defecto de la V3 | Medición | Corrección en la V4 |
|---|---|---|
| El Team Coder seguía listado en la matriz | Bloque 7 con **31 filas** de nombres de la cantera | **Bloque 7 eliminado**. El veredicto se conserva fuera del documento vivo, en `.historial/` |
| El aparato viajaba como alias de filas del canon | `ejecucion_id ← coder_run_id, run_id` · `configuracion_id ← capability_mode` · `sesion_clase ← workspace_id` · `fuente ← runtime_sources` · `actor_clase ← agent_id` | los 5 alias del aparato retirados. Los alias que sólo renombran el mismo hecho se conservan |
| Bloque 1 mal armado: metía la evidencia del **candidato de conocimiento** en el acto de supervisión | `evidencia_id` / `evidencia_tipo` / `referencia_evidencia` están ligados en `conocimiento_gobierno.evidencias_candidato` (6 ligaduras confirmadas), no en supervisión | los tres salen del Bloque 1 y pasan al Bloque 3 · **Bloque 1: 11 → 8** |
| El Guardián de TmIA no estaba confrontado con su capítulo | `SPEC §8:189-229` declara 13 acontecimientos de activación y la cadena GUARDIÁN → CORRECCIÓN → CODIFICADOR | §5: cada acontecimiento, medido contra el canon |

Reparto nuevo de los 138 términos: **8 + 9 + 32 + 39 + 31 + 19 = 138**.

---

## 1. La diferencia entre las dos soluciones

Una sola, y está literal en el SPEC:

> «El rol ejecutor que existía bajo Guardian en GrdCoderIA se transforma conceptualmente en Codificador dentro de TmIA.» — `SPEC §7:185`

| Pieza | GrdCoderIA (cantera) | TmIA |
|---|---|---|
| Arquitecto | Arquitecto | **idéntico** |
| Ejecutor | Guardián — y **ejecuta** | **Codificador** — mismo rol, **sólo cambia el nombre** |
| Equipo de ejecución | **Team Coder**: especialistas invitados, delegación, carrera del Coder | **no existe** |
| Supervisión | la ejerce el propio Guardián que ejecuta | **Guardián nuevo**: supervisa al Codificador, no ejecuta, no reparte trabajo |

El Guardián nuevo «no es un segundo Codificador»: permanece inactivo y «puede activarse ante acontecimientos relevantes del trabajo»; al detectar una desviación emite **CORRECCIÓN** hacia el Codificador (`SPEC §8:191-229`).

**Las tres conclusiones que gobiernan esta matriz:**

1. Arquitecto: no cambia nada.
2. El ejecutor: cambia de nombre. Sus términos son los mismos.
3. Team Coder: desaparece. Ningún término suyo entra, ni como fila ni como alias.

---

## 2. Inventario de workspaces

Medido en el código del Host: `CompileWorkspace = 'ARCHITECT' | 'GUARDIAN' | 'CODER_TEAM'`, y el rol principal resuelto por workspace es `ARCHITECT_STRATEGIC | GUARDIAN_ADVISORY | CODER_EXECUTOR`.

**Los tres workspaces no desaparecen.** Lo que cambia es cómo se configura el agente dentro de ellos.

| Workspace | Rol que el código le da hoy | Qué configura hoy | Qué queda en TmIA |
|---|---|---|---|
| `ARCHITECT` | `ARCHITECT_STRATEGIC` | sesión de repositorio, fundación inicial, trazo de contexto, prompt propio | **idéntico**: es el Arquitecto de TmIA |
| `GUARDIAN` | `GUARDIAN_ADVISORY` | es un **despachador**: `CONVERSING`, `TASK_FORMATION`, `SPECIALIST_INVITATION`, `AWAITING_HUMAN_EXECUTION_DECISION`, `SUPERVISING`, `VALIDATING`; participantes HUMANO + GUARDIÁN + especialistas invitados | **se conserva el workspace; se reconfigura el agente.** Caen `SPECIALIST_INVITATION`, `AWAITING_HUMAN_EXECUTION_DECISION` y la formación de tarea con especialistas. Queda la supervisión: `SUPERVISING` · `VALIDATING` |
| `CODER_TEAM` | `CODER` (etiqueta de actor) | delegación, aprobación de delegación, carrera del Coder, acuerdos, plantilla de especialistas | **se conserva el workspace; el ejecutor ya es uno.** `packages/coders` declara `agent_type: 'CODER'`. Lo que desaparece es el enjambre: especialistas, delegación y carrera |

**Declaración que responde «¿dónde vive Coder Team?»:** no vive en el canon. Vive en el Host —`packages/hosts-vscode/src/domains/coder/coder-delegation.ts`— y en el compilador de contexto, donde incluso el camino del Coder resuelve un runtime de especialista (`resolveSpecialistRuntime('SPECIALIST@CODER')`, `workspace-context-compiler.ts:114`). **Cero términos del canon de TmIA nombran al Team Coder.** Por eso la matriz no puede proyectarlo: no hay nada que proyectar.

---

## 3. La forma: cinco columnas

**TÉRMINO** (los alias del mismo hecho van en la misma celda) · **USOS** · **CLASIFICACIÓN** · **DICCIONARIO** · **FALTA NORMALIZAR**.

Reglas de lectura:

- **R1.** Un hecho, una fila. Nada se duplica entre bloques: los seis bloques del capítulo 4 **particionan** los 138 términos del canon (8 + 9 + 32 + 39 + 31 + 19 = 138).
- **R2.** USOS dice dónde puede aparecer el término. `campo` está medido por la ligadura (todo el canon). `clave`, `cadena` y `llamada` sólo aparecen donde están medidos; el resto de usos posibles (`sp`, `vista`, `indice`, `funcion`) queda para la Fase 1b.
- **R3.** CLASIFICACIÓN. `sql` = materializado (los 138 lo están, por ligadura). `libreria` = el término —o su alias— aparece como miembro de estructura (`TERM:` / `TERM?`) en un archivo que el `ESTUDIO_DOMINIOS_TmIA_COMPACT_V1.md` adscribe a una cadena con techo **candidato a librería**. `codigo` = aparece igual fuera de esas cadenas. **Medido en la Fase 1b sobre `packages/**` de la cantera**, excluyendo `dist`, `node_modules`, `test`, `.d.ts` y cuerpos de comentario; se midió el término y sus alias declarados. Límite declarado: los archivos que el estudio no cita se cuentan como «fuera de las cadenas» ⇒ `codigo`.
- **R4.** DICCIONARIO. `SÍ · lig N` = está en el diccionario con N ligaduras. **N aquí es el número de tablas del canon que declaran el término** (recuento rehecho sobre las 39 tablas, verificado término a término contra el diccionario vivo).
- **R5.** FALTA NORMALIZAR declara el término que falta en el diccionario. Vacío (`—`) significa que ya está.
- **R6.** La matriz mide el canon de la Biblioteca SQL. Contratos, Conocimiento y Memoria de agente tienen su propia autoridad y no entran aquí.

---

## 4. La matriz

### Bloque 1 · GUARDIÁN — el acto de supervisión (8)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `supervision_id` | campo | sql | SÍ · lig 2 | — |
| `supervision_clase` | campo | sql | SÍ · lig 1 | — |
| `hallazgo_id` | campo · clave | sql | SÍ · lig 2 | — |
| `hallazgo_clase` | campo | sql | SÍ · lig 1 | — |
| `correccion_id` | campo | sql | SÍ · lig 1 | — |
| `actor_destino` | campo | sql | SÍ · lig 2 | — |
| `estado_revision` | campo | sql | SÍ · lig 4 | — |
| `cerrado_en` | campo | sql | SÍ · lig 2 | — |

### Bloque 2 · CODIFICADOR — el acto de ejecución y entrega (9)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `ejecucion_id` | campo · clave | sql | SÍ · lig 2 | — |
| `ejecucion_modo` | campo | sql | SÍ · lig 1 | — |
| `estado_ejecucion` | campo | sql | SÍ · lig 1 | — |
| `inicia_en` | campo | sql | SÍ · lig 1 | — |
| `entrega_id` ← `deliverable_id`, `handoff_id` | campo · clave · propiedad | sql · codigo | SÍ · lig 1 | — |
| `entrega_clase` | campo | sql | SÍ · lig 1 | — |
| `estado_entrega_actor` | campo | sql | SÍ · lig 1 | — |
| `actor_origen` | campo | sql | SÍ · lig 1 | — |
| `recibido_en` | campo | sql | SÍ · lig 1 | — |

### Bloque 3 · ARQUITECTO — definición, contrato e ingeniería (32)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `contrato_id` ← `task_id` (contrato) | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 2 | — |
| `contrato_detalle_id` | campo | sql | SÍ · lig 2 | — |
| `contrato_clase` | campo | sql | SÍ · lig 1 | — |
| `contrato_tipo` | campo | sql | SÍ · lig 1 | — |
| `ingenieria_id` ← `knowledge_id` | campo · propiedad | sql · codigo | SÍ · lig 3 | — |
| `ingenieria_detalle_id` | campo | sql | SÍ · lig 3 | — |
| `ingenieria_clase` | campo | sql | SÍ · lig 1 | — |
| `ingenieria_tipo` | campo | sql | SÍ · lig 1 | — |
| `codigo_ingenieria_id` | campo | sql | SÍ · lig 1 | — |
| `codigo_ingenieria_clase` | campo | sql | SÍ · lig 1 | — |
| `libreria_ingenieria_id` | campo | sql | SÍ · lig 1 | — |
| `libreria_referencia` | campo | sql | SÍ · lig 1 | — |
| `regla_id` | campo · clave · llamada | sql | SÍ · lig 6 | — |
| `regla_clase` | campo | sql | SÍ · lig 4 | — |
| `obligatoriedad` | campo | sql | SÍ · lig 2 | — |
| `condicion` | campo | sql | SÍ · lig 2 | — |
| `disparador_regla_id` | campo | sql | SÍ · lig 2 | — |
| `disparador_clase` | campo | sql | SÍ · lig 2 | — |
| `filtro_regla_id` | campo | sql | SÍ · lig 1 | — |
| `filtro_clase` | campo | sql | SÍ · lig 1 | — |
| `entrada` | campo | sql | SÍ · lig 1 | — |
| `salida` | campo | sql | SÍ · lig 1 | — |
| `restriccion` | campo | sql | SÍ · lig 1 | — |
| `dependencia` | campo | sql | SÍ · lig 1 | — |
| `compatibilidad` | campo | sql | SÍ · lig 1 | — |
| `lenguaje` | campo | sql | SÍ · lig 1 | — |
| `ruta` | campo | sql | SÍ · lig 1 | — |
| `candidato_id` | campo · clave | sql | SÍ · lig 2 | — |
| `candidato_clase` | campo | sql | SÍ · lig 1 | — |
| `evidencia_id` | campo | sql | SÍ · lig 1 | — |
| `evidencia_tipo` | campo | sql | SÍ · lig 1 | — |
| `referencia_evidencia` | campo | sql | SÍ · lig 1 | — |

### Bloque 4 · SESIÓN, GOBIERNO Y MEMORIA — el flujo y su contexto (39)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `sesion_id` ← `session_id` | campo · clave · cadena · llamada · propiedad | sql · libreria · codigo | SÍ · lig 15 | — |
| `sesion_clase` | campo | sql | SÍ · lig 1 | — |
| `sesion_tipo` | campo | sql | SÍ · lig 1 | — |
| `objetivo_id` | campo | sql | SÍ · lig 4 | — |
| `objetivo` | campo · propiedad | sql · libreria · codigo | SÍ · lig 2 | — |
| `tarea_id` ← `task_id` | campo · clave · cadena · propiedad | sql · libreria · codigo | SÍ · lig 10 | — |
| `evento_id` | campo | sql | SÍ · lig 1 | — |
| `evento_tipo` | campo | sql | SÍ · lig 1 | — |
| `configuracion_id` | campo | sql | SÍ · lig 1 | — |
| `configuracion_clase` | campo | sql | SÍ · lig 1 | — |
| `filtro_id` | campo | sql | SÍ · lig 4 | — |
| `filtro_detalle_id` | campo | sql | SÍ · lig 1 | — |
| `activacion_id` | campo | sql | SÍ · lig 3 | — |
| `activacion_detalle_id` | campo | sql | SÍ · lig 1 | — |
| `perfil_resolucion_id` ← `foundation_profile_id` | campo · propiedad | sql · codigo | SÍ · lig 4 | — |
| `perfil_resolucion_clase` | campo | sql | SÍ · lig 1 | — |
| `gobierno_id` | campo | sql | SÍ · lig 2 | — |
| `gobierno_checkpoint_id` ← `context_snapshot_id` | campo · propiedad | sql · codigo | SÍ · lig 2 | — |
| `gobierno_cache_id` | campo | sql | SÍ · lig 1 | — |
| `memoria_disparador_id` | campo | sql | SÍ · lig 1 | — |
| `memoria_vinculo_id` ← `memory_entry_id` | campo · propiedad | sql · codigo | SÍ · lig 1 | — |
| `historico_checkpoint_id` ← `context_snapshot_id` | campo · propiedad | sql · codigo | SÍ · lig 2 | — |
| `historico_persistido_id` | campo | sql | SÍ · lig 1 | — |
| `historico_temporal_id` | campo | sql | SÍ · lig 1 | — |
| `turno_id` | campo · clave · llamada | sql | SÍ · lig 1 | — |
| `fuente` | campo | sql | SÍ · lig 1 | — |
| `resultados` | campo | sql | SÍ · lig 1 | — |
| `decisiones` ← `decision_id`, `pending_decision` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `pendientes` | campo | sql | SÍ · lig 1 | — |
| `referencias` | campo | sql | SÍ · lig 1 | — |
| `cambios` | campo | sql | SÍ · lig 1 | — |
| `resumen` | campo · propiedad | sql · codigo | SÍ · lig 2 | — |
| `cobertura` | campo | sql | SÍ · lig 1 | — |
| `peso` | campo | sql | SÍ · lig 1 | — |
| `expira_en` | campo | sql | SÍ · lig 1 | — |
| `orden_direccion` | campo | sql | SÍ · lig 1 | — |
| `limite` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `presupuesto` | campo | sql | SÍ · lig 2 | — |
| `checksum_fuente` | campo | sql | SÍ · lig 1 | — |

### Bloque 5 · LA BIBLIOTECA — la forma física del canon (31)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `tabla_id` | campo | sql | SÍ · lig 2 | — |
| `campo_id` | campo | sql | SÍ · lig 1 | — |
| `termino_id` | campo | sql | SÍ · lig 2 | — |
| `termino` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `significado` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `tipo_dato` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `longitud_base` | campo | sql | SÍ · lig 1 | — |
| `precision_base` | campo | sql | SÍ · lig 1 | — |
| `escala_base` | campo | sql | SÍ · lig 1 | — |
| `valor_predeterminado` | campo | sql | SÍ · lig 1 | — |
| `es_referencia` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `es_clave_primaria` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `es_obligatorio` | campo | sql | SÍ · lig 1 | — |
| `usos` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `clasificacion` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `arquetipo` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `esquema` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `base_datos` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `nombre_tabla` | campo · clave · cadena · propiedad | sql · libreria · codigo | SÍ · lig 2 | — |
| `nombre_columna` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `orden` | campo · propiedad | sql · libreria · codigo | SÍ · lig 1 | — |
| `materializacion_id` | campo | sql | SÍ · lig 2 | — |
| `materializacion_referencia` | campo | sql | SÍ · lig 1 | — |
| `longitud_declarada` | campo | sql | SÍ · lig 1 | — |
| `precision_declarada` | campo | sql | SÍ · lig 1 | — |
| `escala_declarada` | campo | sql | SÍ · lig 1 | — |
| `predeterminado_declarado` | campo | sql | SÍ · lig 1 | — |
| `esta_verificada` | campo | sql | SÍ · lig 2 | — |
| `observacion` | campo | sql | SÍ · lig 1 | — |
| `motivo` | campo · propiedad | sql · libreria · codigo | SÍ · lig 3 | — |
| `solucion` ← `solution_id` | campo · propiedad | sql · libreria · codigo | SÍ · lig 2 | — |

### Bloque 6 · TRANSVERSAL — identidad, estado, tiempo, forma y traza (19)

| TÉRMINO | USOS | CLASIFICACIÓN | DICCIONARIO | FALTA NORMALIZAR |
|---|---|---|---|---|
| `actor_clase` ← `actor_id` | campo · clave · cadena · propiedad | sql · codigo | SÍ · lig 15 | — |
| `estado_registro` | campo | sql | SÍ · lig 25 | — |
| `creado_en` ← `created_at` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 38 | — |
| `actualizado_en` ← `updated_at` | campo · clave · propiedad | sql · libreria · codigo | SÍ · lig 15 | — |
| `prioridad` | campo | sql | SÍ · lig 15 | — |
| `descripcion` | campo · propiedad | sql · libreria · codigo | SÍ · lig 12 | — |
| `checksum` | campo · clave | sql | SÍ · lig 9 | — |
| `version` ← `foundation_version_id` | campo · propiedad | sql · codigo | SÍ · lig 7 | — |
| `codigo` | campo · clave · llamada | sql | SÍ · lig 7 | — |
| `referencia_fuente` | campo | sql | SÍ · lig 5 | — |
| `nombre` | campo | sql | SÍ · lig 5 | — |
| `resultado` ← `validation_id` (resultado) | campo · propiedad | sql · codigo | SÍ · lig 4 | — |
| `objeto_referencia` | campo | sql | SÍ · lig 4 | — |
| `objeto_clase` ← `scope_type` | campo · propiedad | sql · libreria · codigo | SÍ · lig 4 | — |
| `contenido` | campo | sql | SÍ · lig 4 | — |
| `valor` | campo | sql | SÍ · lig 2 | — |
| `repositorio` ← `repository_id` | campo · propiedad | sql · libreria · codigo | SÍ · lig 2 | — |
| `confianza` | campo | sql | SÍ · lig 1 | — |
| `revisado_en` | campo | sql | SÍ · lig 1 | — |

---

## 5. El Guardián de TmIA contra el canon

Lo que el §8 le exige al Guardián, medido término a término contra las cuatro tablas que lo sostienen: `supervisiones_control` (8 campos), `hallazgos_control` (10), `correcciones_control` (8), `eventos_control` (9) — todas confirmadas al 100%.

**Los 13 acontecimientos de activación (`SPEC §8:201-215`) y dónde aterrizan:**

| Acontecimiento del §8 | Dónde vive en el canon |
|---|---|
| inicio de una tarea | `eventos_control.evento_tipo` + `tareas_control.estado_registro` |
| presentación de un plan | `evento_tipo`; el plan no tiene término propio — viaja como `contenido` de la entrega |
| solicitud de ejecución | `evento_tipo` |
| cambios sensibles | `evento_tipo` + `objeto_clase` + `objeto_referencia` |
| posibles violaciones de acuerdos | `hallazgos_control.hallazgo_clase` + `regla_id` (con `regla_clase`) |
| creación de implementaciones paralelas | `hallazgo_clase` |
| migraciones | `objeto_clase` + `objeto_referencia` |
| cambios estructurales | `objeto_clase` + `objeto_referencia` |
| cambios de identidad | `objeto_clase` + `objeto_referencia` |
| cambios SQL o de integración | `objeto_clase` + `objeto_referencia` |
| cierre de una unidad de trabajo | `estado_registro` + `cerrado_en` |
| reporte final | `historicos_temporal`: `resumen`, `resultados`, `cambios`, `pendientes`, `decisiones`, `referencias` |
| solicitud expresa de auditoría | `supervision_clase` (hito o evento) + `entrega_clase = 'supervisión'` |

**La cadena de salida (`SPEC §8:217-225` — GUARDIÁN → CORRECCIÓN → CODIFICADOR):**

| Acto | Tabla | Términos |
|---|---|---|
| Supervisión | `supervisiones_control` | `supervision_id` · `supervision_clase` · `estado_revision` · `resultado` |
| Hallazgo | `hallazgos_control` | `hallazgo_id` · `hallazgo_clase` · `regla_id` · `regla_clase` · `descripcion` · `prioridad` |
| Corrección | `correcciones_control` | `correccion_id` · `hallazgo_id` · `actor_destino` · `descripcion` · `estado_revision` · `cerrado_en` |
| Entrega de supervisión | `entregas_control` | `entrega_id` · `entrega_clase` · `actor_origen` · `actor_destino` · `recibido_en` |

**Resultado de la confrontación: el Guardián de TmIA no necesita un término nuevo.** Los 8 términos que le son propios están en el Bloque 1, y los que comparte —`evento_*`, `objeto_*`, `resultado`, `descripcion`, `prioridad`, `regla_id`, `regla_clase`, `tarea_id`, `ejecucion_id`— viven en su bloque por dueño principal. La proyección del §8 **no da altas**: da una corrección —la evidencia del candidato de conocimiento no es evidencia de supervisión— y deja un hueco declarado: `hallazgos_control` no tiene dónde guardar la referencia de la evidencia que sostiene el hallazgo (H3).

---

## 6. Hallazgos

| # | Hallazgo | Medición |
|---|---|---|
| H1 | **El canon de TmIA ya está completo para sus cuatro actores.** No hace falta inventar vocabulario: 39 tablas, 369 campos, 138 términos | 138 con ligadura = 138 términos distintos de las 39 tablas |
| H2 | **El Guardián de TmIA no requiere altas.** Los 13 acontecimientos del §8 aterrizan en términos existentes | §5 · 0 términos nuevos |
| H3 | **`hallazgos_control` no puede registrar su evidencia.** Tiene `descripcion`, `regla_id` y `regla_clase`, pero ningún campo de evidencia | frente a `evidencias_candidato`, que sí la tiene — para el candidato de conocimiento, no para el hallazgo |
| H4 | **El Bloque 1 estaba mal armado: la evidencia del candidato estaba metida en el acto de supervisión** | `evidencia_id`, `evidencia_tipo` y `referencia_evidencia` están ligados en `conocimiento_gobierno.evidencias_candidato` (6/6 confirmadas) |
| H5 | **El Team Coder queda fuera del documento vivo**: ni filas ni alias | 31 filas al historial + 5 alias del aparato retirados (`coder_run_id`, `run_id`, `capability_mode`, `workspace_id`, `runtime_sources`, `agent_id`) |
| H6 | **Los 410 términos sin ligadura no son legacy**: son el canon de otras soluciones del catálogo | `instancia_id` y `contenido_texto` verificados: 0 ligaduras, significado de otro dominio |
| H7 | **La V2 tenía cifras desactualizadas** en el bloque de la Biblioteca | `nombre_tabla` 1→2, `es_clave_primaria` 0→1, `base_datos` 0→1, `es_obligatorio` 0→1, `es_referencia` 0→1 |
| H8 | **Coder Team no está en el canon**: vive en el Host (`coder-delegation.ts`) y en `resolveSpecialistRuntime('SPECIALIST@CODER')` | 0 términos del canon lo nombran |
| H9 | **El workspace GUARDIAN de la cantera es un despachador.** En TmIA caen `SPECIALIST_INVITATION` y `AWAITING_HUMAN_EXECUTION_DECISION`; quedan `SUPERVISING` y `VALIDATING` | §2 |
| H10 | **La clase `libreria` ya tiene medición.** Cerrada la Fase 1b: 26 filas con `libreria` y 10 solo `codigo` | 36 filas con evidencia como miembro de estructura; 102 solo `sql` |

---

## 7. Decisiones abiertas

| # | Decisión | Estado |
|---|---|---|
| D1 | **Acuerdo, propuesta, impacto y entregable**: ¿contenido de `entregas_control` (`entrega_clase` + `contenido`) o tabla propia en el canon? | abierta. Hoy el canon no tiene tabla para ninguno de los cuatro; el modelo los trata como documentos del canal de entregas |
| D2 | **Identidad del actor**: el canon tiene `actor_clase` (texto) + `actor_origen` / `actor_destino`. ¿Basta, o se quiere tabla de actores con `actor_id`? | abierta |
| D3 | **Checkpoint de contexto**: el canon tiene dos (`gobierno_checkpoint_id` y `historico_checkpoint_id`) y la cantera uno (`context_snapshot_id`). ¿Se unifican o se mantienen los dos? | abierta |
| D4 | **`correlacion_id` y `alcance_id`**: existen en el diccionario con 0 ligaduras y sin materialización en `tmia` | abierta: declarar si son de otra solución o retirar |
| D5 | **La evidencia del hallazgo** (H3): ¿se liga `referencia_evidencia` / `evidencia_tipo` en `hallazgos_control`, o se materializa una tabla de evidencia de supervisión? | abierta — es la única alta posible que la proyección del §8 deja viva |
| D6 | **Fase 1b — la clasificación `libreria`**: la fuente es el `ESTUDIO_DOMINIOS_TmIA_COMPACT_V1.md` (27 cadenas candidatas), no los cuerpos de SP ni las vistas. Medida y aplicada | CERRADA 2026-09-30 |
| D7 | **Los 410 sin ligadura**: declarar a qué solución pertenece cada uno, o retirarlos si son de una solución muerta | pendiente |

---

## 8. Fases

| Fase | Estado | Alcance reproyectado |
|---|---|---|
| **1 — usos y clasificación de los términos que ya existen** | **APLICADA 2026-09-30** | los 138 términos del canon escritos en el diccionario: 26 con `libreria`, 36 con `codigo`, 102 sólo `sql`. Verificado por el filtro del diccionario (§10) |
| **2 — altas al diccionario** | **APLICADA 2026-09-30 · con residuo declarado** | medida **vacía desde el eje de campo** —el bloque de altas de la V2 se disolvió con el Bloque 7; la proyección del Guardián (§5) no produjo altas; y los nombres del modelo —`acuerdo`, `propuesta`, `impacto`, `plan`, `veredicto`, `desviación`, `reporte`— no son términos, son valores de `entrega_clase`, `hallazgo_clase` o `evento_tipo`—. Medida **desde el eje de código** produjo **200 altas** (§11), los símbolos de las 10 cadenas candidatas a librería. El veredicto de forma de esas altas está en **§12: 139 entran a normalización** |
| **1b — clasificación `libreria`** | **APLICADA** | medida contra las cadenas candidatas del estudio de dominios, por término y alias. Ningún término aparece como función ni método: todos como miembro de estructura |

---

## 9. Trazabilidad

- Canon medido: solución `tmia`, 39 materializaciones, 369 campos, 138 términos distintos (`TmIA/.historial/canon_tmia_columnas_39_tablas.txt`).
- Aparato del Guardián medido campo a campo: `supervisiones_control` (8), `hallazgos_control` (10), `correcciones_control` (8), `eventos_control` (9), y `evidencias_candidato` (6) para descartar la pertenencia de la evidencia.
- Diccionario vivo: 548 términos (138 con ligadura, 410 sin). Verificados en este acto: `supervis`, `auditor`, `veredicto`, `desviac`, `impacto`, `propuesta`, `verificacion`, `solicitud`, `evento`, `hito`, `bitacora`, `entrega`, `ejecucion`, `objeto`, `estado_revision`, `cerrado_en`, `acuerdo`, `plan`, `reporte`.
- Workspaces: `CompileWorkspace` y los estados del GUARDIAN, medidos en `packages/hosts-vscode/src/domains/`.
- Bloque podado: `TmIA/.historial/MATRIZ_V3_bloque_poda_cantera_extraido.md`.
- V2 medida sobre la cantera: `TmIA/.historial/MATRIZ_NORMALIZACION_TERMINOS_TmIA_V2_medida_sobre_cantera.md`.
- Modelo: `TmIA/SPEC_TmIA_COMPACT_V1.md` (§7:183-185, §8:189-229), `TmIA/MODELO_FUNCIONAL_PROYECTADO_TmIA_COMPACT_V1.md`, `TmIA/CATALOGO_PROTOTIPOS_TmIA_LLM_ENGINE_V1.md`.

## Fase 1b — medición de la clase `libreria` (2026-09-30)

Aplicada a la matriz en este turno. El UPDATE del diccionario —usos y clasificación de los términos que ya existen— se ejecutó después, por decisión humana, y quedó verificado: ver §10.

Fuente del ámbito: `ESTUDIO_DOMINIOS_TmIA_COMPACT_V1.md` — las cadenas con techo **candidato a librería** (§17.5). Método: sobre `packages/**` (cantera), excluyendo `dist`, `node_modules`, `test`, `.d.ts` y cuerpos de comentario, se buscó cada término del canon **y sus alias declarados** como miembro de estructura —la firma real de un campo de DTO o de interface—, que el código escribe como `TERM:` o `TERM?` al inicio de la línea de declaración.

**Hallazgo de forma:** ningún término aparece como **función** ni como **método**. Los 36 con evidencia aparecen como **miembro de estructura**, mayoritariamente en `packages/operation/src/library-types.ts` (DTO del cliente de la Biblioteca) y en `packages/hosts-vscode/src/agent-tools.ts` (catálogo y entrega de capacidades al modelo).

**`libreria` (26)** — con al menos una aparición dentro de una cadena candidata: `actualizado_en`, `arquetipo`, `base_datos`, `clasificacion`, `contrato_id`, `creado_en`, `decisiones`, `descripcion`, `es_clave_primaria`, `es_referencia`, `esquema`, `limite`, `motivo`, `nombre_columna`, `nombre_tabla`, `objetivo`, `objeto_clase`, `orden`, `repositorio`, `sesion_id`, `significado`, `solucion`, `tarea_id`, `termino`, `tipo_dato`, `usos`.

**`codigo` (36)** — con al menos una aparición fuera de esas cadenas. Solo `codigo`, sin `libreria` (10): `actor_clase`, `entrega_id`, `gobierno_checkpoint_id`, `historico_checkpoint_id`, `ingenieria_id`, `memoria_vinculo_id`, `perfil_resolucion_id`, `resultado`, `resumen`, `version`.

**Marcas `codigo` no reproducidas (11)** — la matriz las traía marcadas y esta medición no las sostiene: `candidato_id`, `checksum`, `codigo`, `contrato_tipo`, `ejecucion_id`, `evento_id`, `evento_tipo`, `hallazgo_id`, `regla_id`, `sesion_tipo`, `turno_id`. Quedan retiradas; si su origen fue otra medición, procede reponerlas con su evidencia.

Límite declarado del método: dos rutas candidatas que usé en el primer pase no están citadas por el estudio y quedaron **fuera** del ámbito (`packages/tools/src/tool-descriptor.ts`, `packages/host-ui/src/model-builder.ts`), de modo que `entrega_id` y `version` no figuran con `libreria`. Si se aceptan como parte de la cadena de capacidades y de la proyección de superficie, ambas filas la ganan.

## 10. Fase 1 — UPDATE del diccionario (aplicado 2026-09-30)

Ejecutado por decisión humana (`dic_usos_clasificacion`). Acto único por término con `library_diccionario_editar`, enviando **sólo** `termino`, `usos` y `clasificacion`: el canal reemplaza las listas enviadas y conserva `significado` y forma física, lo que se verificó con una sonda sobre `supervision_id` antes de escribir las 138 filas. Ningún UPDATE previo: la clase `libreria` arrancó con universo **0** en el diccionario.

| Verificación | Esperado | Medido |
|---|---|---|
| Términos escritos | 138 | **138 · 0 fallos** |
| Filtro `clasificacion = libreria` | 26 | **26 de 26** — coincide fila por fila con el bloque §7 |
| Filtro `clasificacion = codigo` | 36 propios | **38 de 38** = 36 propios + 2 preexistentes ajenos |
| Términos sólo `sql` | 102 | **102**, por aritmética (138 − 26 − 10). El filtro `sql` **no discrimina**: devuelve 548 de 548 |

**Dos términos ajenos al eje ya traían `codigo` y no se tocaron:** `correlacion_id` y `contenido_texto`, ambos con 0 ligaduras. Su clasificación es anterior a este acto y pertenece a otras soluciones del catálogo; quedan como tercera evidencia de H6/D4/D7 —un término puede vivir en la Biblioteca sin materialización en `tmia`—. El diccionario vivo pasa a **548 términos: 138 con ligadura y 410 sin**, sin altas ni bajas en este acto.

**Residuo declarado del ámbito, no del UPDATE:** `entrega_id` y `version` quedaron sin `libreria` por el límite del §9 y así figuran en la lectura del diccionario. Aceptarlas exige ampliar el ámbito, no repetir el UPDATE.

**El canon queda servible para las tres capas del eje:** `sql` cubre las 39 tablas materializadas; `libreria` nombra los 26 términos que las librerías de TmIA pueden exponer; `codigo` los 36 que el código fuera de librerías puede usar. Medición de cierre: `sql` está en **548 de 548** términos del diccionario, así que no discrimina nada — las clases que discriminan son `libreria` y `codigo`, y `sql` se lee como clase por defecto del diccionario entero, no como pertenencia a TmIA. **La Fase 2 —términos que faltan en el diccionario— no queda «sin iniciar»: el §8 la mide VACÍA desde este eje**; sólo D1 y D5 podrían abrir altas, y por decisión, no por medición.

---

## 11. Fase 2 — alta de los términos no-campo (aplicada 2026-09-30)

La Fase 2 no estaba vacía: estaba vacía **sólo desde el eje de campo**. Medida desde el eje de código —símbolos que el código declara— tenía 205 piezas. Ese es el material que se subió.

| Medición | Valor |
|---|---|
| Cadenas medidas | las 10 candidatas a librería: superficie-agente, navegacion, card, composer, control-turno, ajustes (UI) y etapa, narrativa, cierre, proyeccion (turno) |
| Símbolos declarados en esas cadenas | 205 (100 en TypeScript, 105 en la superficie del webview) |
| Símbolos que ya tenían término | 0 |
| Términos dados de alta | 200 |
| Símbolos excluidos | 2 |
| Pares que colapsan a un mismo término | 3 |

Regla aplicada: un símbolo que vive dentro de una cadena de librería se clasifica `libreria`; si además aparece fuera de esas cadenas, lleva también `codigo`. La forma (`usos`) es la que el símbolo tiene: funcion, clase, tipo, constante.

Corrección de nombre: ningún símbolo entró con su identificador. Entró con su término canónico en español, que es el nombre que debe usar el código que se escriba sobre el diccionario. Los tres pares que colapsan son correcciones de duplicación real:

| Símbolos | Término único |
|---|---|
| `ChatMessageStreamTurn` + `StreamTurnChatMessage` | `mensaje_chat_turno` |
| `ViewportCapabilitySet` + `viewportCapabilitySet` | `conjunto_capacidades_viewport` |
| `buildGuardianViewport` + `buildGuardianParticipantViewport` | `componer_viewport_guardian` |

Excluidos, con motivo: `buildGuestSpecialistViewport` y `renderSessionTeamPreview` pertenecen al aparato de especialistas de Team Coder, que en TmIA Compact no existe.

Estado del diccionario tras la Fase 2: **748 términos** (548 antes), de los cuales **200 no son campos**; `clasificacion`: 226 `libreria` y 111 `codigo`. La forma `campo` sigue en 548, sin cambios: la Fase 2 no tocó ningún término de campo.

### Correspondencia símbolo de código → término canónico

| Símbolo del código | Término en el diccionario |
|---|---|
| `ApprovalTracker` | `rastreador_aprobacion` |
| `NarrativeEmitter` | `emisor_narrativa` |
| `PanelScrollManager` | `gestor_desplazamiento_panel` |
| `UiStateStore` | `almacen_estado_ui` |
| `WrapManager` | `gestor_ajuste_texto` |
| `CLOSING_CONTRACTS` | `contratos_cierre` |
| `CONTEXT_PRESSURE_LABEL_RATIO` | `proporcion_etiqueta_presion_contexto` |
| `DEFAULT_AGENT_STATUS` | `estado_agente_predeterminado` |
| `DEFAULT_LAYOUT` | `disposicion_predeterminada` |
| `DEFAULT_THEME_MAP` | `mapa_tema_predeterminado` |
| `GUARDIAN_STREAM_TURN_CHUNK_PREFIX` | `prefijo_fragmento_turno_guardian` |
| `INTENT_HELPER_CONCEPT` | `concepto_auxiliar_intencion` |
| `PUBLIC_WORK_NARRATIVE_CONTRACT` | `contrato_publico_narrativa_trabajo` |
| `STREAM_TURN_CONCEPT` | `concepto_turno` |
| `STREAM_TURN_ORDERED_SLOTS` | `ranuras_ordenadas_turno` |
| `THEME_TOKENS` | `tokens_tema` |
| `VIEWPORT_CAPABILITIES_BY_PROFILE` | `capacidades_viewport_por_perfil` |
| `applyIntentToRequirements` | `aplicar_intencion_requisitos` |
| `buildAgentStreamTurnMessage` | `componer_mensaje_turno_agente` |
| `buildArchitectViewport` | `componer_viewport_arquitecto` |
| `buildCanonicalStreamTurn` | `componer_turno_canonico` |
| `buildClosingContract` | `componer_contrato_cierre` |
| `buildCoderViewport` | `componer_viewport_codificador` |
| `buildContextStatusView` | `componer_vista_estado_contexto` |
| `buildFinalReportDoc` | `componer_documento_reporte_final` |
| `buildGuardianParticipantViewport` | `componer_viewport_guardian` |
| `buildGuardianViewport` | `componer_viewport_guardian` |
| `buildGuestSpecialistViewport` | — |
| `buildHumanViewport` | `componer_viewport_humano` |
| `changesFromInvocations` | `cambios_desde_invocaciones` |
| `closingContractForLevel` | `contrato_cierre_por_nivel` |
| `collectFinalReportDecisions` | `recoger_decisiones_reporte_final` |
| `collectFinalReportPending` | `recoger_pendientes_reporte_final` |
| `contextStatusLabel` | `etiqueta_estado_contexto` |
| `createDefaultUiState` | `crear_estado_ui_predeterminado` |
| `createViewport` | `crear_viewport` |
| `decisionToSurfaceState` | `decision_a_estado_superficie` |
| `dedupeStreamTurnNarrative` | `deduplicar_narrativa_turno` |
| `defaultFoundationState` | `estado_foundation_predeterminado` |
| `deriveStreamTurnDelivery` | `derivar_entrega_turno` |
| `encodeGuardianStreamTurnChunk` | `codificar_fragmento_turno_guardian` |
| `finalStagesViolation` | `violacion_etapas_finales` |
| `guardianTurnViewportId` | `identificador_viewport_turno_guardian` |
| `isRespondingStatus` | `es_estado_respondiendo` |
| `isThinkingStatus` | `es_estado_pensando` |
| `isTurnCompleteState` | `es_estado_turno_completo` |
| `profileMayEmit` | `perfil_puede_emitir` |
| `projectStreamSurface` | `proyectar_superficie_turno` |
| `proposalFromInvocations` | `propuesta_desde_invocaciones` |
| `pushStreamEvent` | `publicar_evento_turno` |
| `reconcileNeededLane` | `reconciliar_carril_requerido` |
| `resolveGuardianToolApproval` | `resolver_aprobacion_herramienta_guardian` |
| `resolveLaneRequirement` | `resolver_requisito_carril` |
| `resolveStreamTurnFinalReport` | `resolver_reporte_final_turno` |
| `resolveTurnCase` | `resolver_caso_turno` |
| `splitClosingSections` | `dividir_secciones_cierre` |
| `stampCloseFormat` | `marcar_formato_cierre` |
| `streamTurnSlotIndex` | `indice_ranura_turno` |
| `turnMayEmit` | `turno_puede_emitir` |
| `viewportCapabilitySet` | `conjunto_capacidades_viewport` |
| `withWorkNarrativeContract` | `con_contrato_narrativa_trabajo` |
| `CanonicalStreamTurn` | `turno_canonico` |
| `CanonicalStreamTurnInput` | `entrada_turno_canonico` |
| `ChatMessageStreamTurn` | `mensaje_chat_turno` |
| `ClosingSections` | `secciones_cierre` |
| `ContextCompactionView` | `vista_compactacion_contexto` |
| `ContextMemoryState` | `estado_memoria_contexto` |
| `ContextStatusReportInput` | `entrada_reporte_estado_contexto` |
| `ContextStatusState` | `estado_contexto` |
| `ContextStatusUsageInput` | `entrada_uso_estado_contexto` |
| `ContextStatusUsageView` | `vista_uso_estado_contexto` |
| `ContextStatusView` | `vista_estado_contexto` |
| `FinalReportDocInput` | `entrada_documento_reporte_final` |
| `GuardianCapabilityGrants` | `concesiones_capacidad_guardian` |
| `GuardianToolApprovalResult` | `resultado_aprobacion_herramienta_guardian` |
| `LaneNeed` | `necesidad_carril` |
| `MessageBlock` | `bloque_mensaje` |
| `MessageBlockDelimiter` | `delimitador_bloque_mensaje` |
| `MessageBlockKind` | `bloque_mensaje_clase` |
| `MessageViewport` | `viewport_mensaje` |
| `NarrativeEmitterOptions` | `opciones_emisor_narrativa` |
| `OperationalNarrativeListener` | `escucha_narrativa_operativa` |
| `StreamSurfaceProjection` | `proyeccion_superficie_turno` |
| `StreamSurfaceProjectionInput` | `entrada_proyeccion_superficie_turno` |
| `StreamTurnActor` | `actor_turno` |
| `StreamTurnBlockSlot` | `ranura_bloque_turno` |
| `StreamTurnChatMessage` | `mensaje_chat_turno` |
| `StreamTurnDelivery` | `entrega_turno` |
| `StreamTurnEvent` | `evento_turno` |
| `StreamTurnFinalReportInput` | `entrada_reporte_final_turno` |
| `StreamTurnLifecycle` | `ciclo_vida_turno` |
| `StreamTurnModel` | `modelo_turno` |
| `StreamTurnNarrativeEntry` | `entrada_narrativa_turno` |
| `StreamTurnStatus` | `estado_turno` |
| `ThemeToken` | `token_tema` |
| `TurnMode` | `modo_turno` |
| `ViewportCapability` | `capacidad_viewport` |
| `ViewportCapabilitySet` | `conjunto_capacidades_viewport` |
| `ViewportProfile` | `perfil_viewport` |
| `ViewportStatus` | `estado_viewport` |
| `aboutHtml` | `html_acerca_de` |
| `addSessionReference` | `agregar_referencia_sesion` |
| `appearanceHtml` | `html_apariencia` |
| `applyLayout` | `aplicar_disposicion` |
| `applySolutionSessionIdentity` | `aplicar_identidad_sesion_solucion` |
| `bindScroll` | `enlazar_desplazamiento` |
| `bindSettingsEvents` | `enlazar_eventos_ajustes` |
| `buildSessionBootstrapPayload` | `componer_carga_inicial_sesion` |
| `candidateRowsHtml` | `html_filas_candidato` |
| `catalogRowsHtml` | `html_filas_catalogo` |
| `closeSessionFoundation` | `cerrar_sesion_foundation` |
| `closeSessionHistory` | `cerrar_historial_sesion` |
| `ctxActiveActor` | `actor_activo_contexto` |
| `ctxDetail` | `detalle_contexto` |
| `ctxNum` | `numero_contexto` |
| `defaultBootstrapPayload` | `carga_inicial_predeterminada` |
| `devHtml` | `html_desarrollo` |
| `diagnosticsHtml` | `html_diagnostico` |
| `fillFoundationYamlBase` | `rellenar_base_yaml_foundation` |
| `foundationHtml` | `html_foundation` |
| `hydrateAgentConfiguration` | `hidratar_configuracion_agente` |
| `markFieldInvalid` | `marcar_campo_invalido` |
| `memoryHtml` | `html_memoria` |
| `modelsHtml` | `html_modelos` |
| `onScrollDecision` | `decision_desplazamiento` |
| `openSessionFoundation` | `abrir_sesion_foundation` |
| `openSettings` | `abrir_ajustes` |
| `openSolutionSessions` | `abrir_sesiones_solucion` |
| `openSurfaceForAgent` | `abrir_superficie_agente` |
| `persistAgentConfiguration` | `persistir_configuracion_agente` |
| `profilesHtml` | `html_perfiles` |
| `providersHtml` | `html_proveedores` |
| `render` | `renderizar_superficie` |
| `renderActiveSurface` | `renderizar_superficie_activa` |
| `renderBootstrapProgress` | `renderizar_avance_carga_inicial` |
| `renderContextStatus` | `renderizar_estado_contexto` |
| `renderSection` | `renderizar_seccion` |
| `renderSessionFiles` | `renderizar_archivos_sesion` |
| `renderSessionGuardians` | `renderizar_guardianes_sesion` |
| `renderSessionPacks` | `renderizar_paquetes_sesion` |
| `renderSessionTeamPreview` | — |
| `renderSolutionSessions` | `renderizar_sesiones_solucion` |
| `renderVisualInspection` | `renderizar_inspeccion_visual` |
| `roleChecklistHtml` | `html_lista_roles` |
| `scopeValue` | `valor_alcance` |
| `securityHtml` | `html_seguridad` |
| `selectedPackIds` | `paquetes_seleccionados` |
| `sessionBootstrapFieldErrors` | `errores_campo_carga_inicial_sesion` |
| `sessionDateLabel` | `etiqueta_fecha_sesion` |
| `switchSurface` | `cambiar_superficie` |
| `syncProfilesFromDom` | `sincronizar_perfiles_desde_dom` |
| `attachmentSize` | `tamano_adjunto` |
| `blockState` | `estado_bloque` |
| `childrenOf` | `hijos_de` |
| `clamp` | `acotar` |
| `closeSectionList` | `cerrar_lista_secciones` |
| `commitStreamSurface` | `confirmar_superficie_turno` |
| `copyCard` | `copiar_tarjeta` |
| `cssEscape` | `escapar_css` |
| `dedupeSurfaceIdentities` | `deduplicar_identidades_superficie` |
| `elementAt` | `elemento_en` |
| `esc` | `escapar_html` |
| `fileActionLabel` | `etiqueta_accion_archivo` |
| `finalReportConformanceNotice` | `aviso_conformidad_reporte_final` |
| `finalReportDocOf` | `documento_reporte_final_de` |
| `finalReportEntries` | `entradas_reporte_final` |
| `finalReportEntryText` | `texto_entrada_reporte_final` |
| `finalReportScalar` | `escalar_reporte_final` |
| `finalReportValuesText` | `texto_valores_reporte_final` |
| `finalReportValueText` | `texto_valor_reporte_final` |
| `formatBytes` | `formatear_bytes` |
| `getActiveSurface` | `superficie_activa` |
| `getState` | `leer_estado_superficie` |
| `getSuppressScroll` | `leer_supresion_desplazamiento` |
| `getSurface` | `leer_superficie` |
| `hashString` | `resumen_cadena` |
| `identityOf` | `identidad_de` |
| `incRender` | `contar_renderizado` |
| `md` | `markdown_a_html` |
| `mergedById` | `combinar_por_identidad` |
| `post` | `enviar_mensaje_host` |
| `reconcileKeyedChildren` | `reconciliar_hijos_indexados` |
| `reconcileStageBody` | `reconciliar_cuerpo_etapa` |
| `reconcileStageShell` | `reconciliar_armazon_etapa` |
| `reconcileStreamSurface` | `reconciliar_superficie_turno` |
| `reconcileViewport` | `reconciliar_viewport` |
| `register` | `registrar_componente` |
| `renderCloseClassDeclared` | `renderizar_clase_cierre_declarada` |
| `renderFinalReportCard` | `renderizar_tarjeta_reporte_final` |
| `renderProposalBody` | `renderizar_cuerpo_propuesta` |
| `renderProposalCard` | `renderizar_tarjeta_propuesta` |
| `renderViewportBlock` | `renderizar_bloque_viewport` |
| `renderViewportCard` | `renderizar_tarjeta_viewport` |
| `renderViewportGeneral` | `renderizar_viewport_general` |
| `serializeBlockForCopy` | `serializar_bloque_para_copia` |
| `serializeFinalReportDoc` | `serializar_documento_reporte_final` |
| `serializeViewportForCopy` | `serializar_viewport_para_copia` |
| `setActiveSurface` | `fijar_superficie_activa` |
| `setState` | `escribir_estado_superficie` |
| `setSuppressScroll` | `fijar_supresion_desplazamiento` |
| `tallyMessage` | `contabilizar_mensaje` |
| `titleCaseToolName` | `titular_nombre_herramienta` |
| `truncateCopyPayload` | `truncar_carga_copia` |
| `vpAllowed` | `viewport_permitido` |
| `vpCaps` | `capacidades_viewport_de` |

---

## 12. Bitácora de admisión — veredicto de forma sobre el diccionario vivo (2026-09-30)

**Para qué existe esta sección.** La matriz no es un inventario: es la bitácora donde cada término de GrdCoderIA recibe su veredicto antes de entrar al diccionario. El circuito es uno solo:

1. Se registra el término **tal como está escrito en el código** de GrdCoderIA.
2. Se **compara contra el diccionario**: ¿ya existe?
3. Si no existe, se **normaliza aquí** y se sube.
4. Si existe pero **no cumple las reglas de forma**, se corrige aquí y se reescribe.

La matriz no es el diccionario —es su puerta—: el diccionario guarda lo admitido, la matriz guarda el veredicto.

**Fuente.** `GET /operation/library/diccionario/listar`, dos páginas (500 + 248). Forma medida por conteo de segmentos (`split('_')`).

| Dimensión | Valor |
|---|---|
| Términos vivos | **748** |
| Con forma física (campo) | 548 — preexistentes; no tocados por ninguna fase |
| Sin forma física (no campo) | 200 — altas de la Fase 2 (§11) |
| Con acentos o no-ASCII | **0** |
| Máximo de segmentos observado | **5** — `errores_campo_carga_inicial_sesion` |

### 12.1 Veredicto por conjunto

| Conjunto | Total | ≤ 2 segmentos | > 2 con `_id` (identidad compuesta, regla 10) | **> 2 sin `_id` → entra a normalización** |
|---|---|---|---|---|
| Campos | 548 | 434 | 96 | **18** |
| No campo (altas Fase 2) | 200 | 61 | 0 | **139** |

Los 96 de identidad compuesta —`grupo_permiso_id`, `plantilla_locacion_id`, `perfil_resolucion_id`…— son la excepción que la regla 10 del manual autoriza expresamente: **no entran a normalización**.

### 12.2 Residuo A — 139 altas de la Fase 2 escritas como frase, no como término

Reparto por longitud: 98 de tres segmentos · 40 de cuatro · 1 de cinco. Reparto por verbo de apertura: `renderizar` 17 · `html` 13 · `componer` 10 · `entrada` 7 · `estado` 7 · `reconciliar` 6 · `abrir` 4 · `resolver` 4.

**La causa grave no es la longitud: es el sinónimo por sufijo.** Cada familia de abajo es **un solo hecho repartido en varios términos** porque el parámetro quedó dentro del nombre —exactamente lo que la regla 8 del manual prohíbe («si dos campos significan lo mismo, comparten término»)—:

| Familia | Miembros | Diagnóstico |
|---|---|---|
| `componer_viewport_*` | arquitecto · codificador · guardian · humano | una función; el perfil es parámetro, no término |
| `renderizar_tarjeta_*` | propuesta · reporte_final · viewport | idem la clase de tarjeta |
| `es_estado_*` | pensando · respondiendo · turno_completo | idem el estado consultado |
| `html_filas_*` | candidato · catalogo | idem la fuente de las filas |
| `capacidades_viewport_*` | `_de` · `_por_perfil` | idem; `capacidades_viewport_de` además es el resto truncado de `vpCaps` |
| `bloque_mensaje` / `bloque_mensaje_clase` | 2 | uno de los dos sobra |
| `entrada_reporte_*` | estado_contexto · final_turno | idem la etapa |
| `renderizar_superficie` / `renderizar_superficie_activa` | 2 | idem el estado |

### 12.3 Residuo B — 18 campos preexistentes que violan la regla 12

La regla 12 prohíbe concatenar más de dos segmentos en un campo. Estos dieciocho llevan tres o más y **no** son identidad compuesta. Uno de ellos no es un término en absoluto: **`es_clave_primaria` es el nombre de un parámetro del canal de la Biblioteca**, no un dato del canon —entró al diccionario como término y debe retirarse—.

`alcance_padre_nivel` · `codigo_ingenieria_clase` · `creado_en_cliente` · `credencial_verificada_en` · `enviado_revision_en` · `escalado_a_agente` · `es_clave_primaria` · `estado_entrega_actor` · `fin_planeado_en` · `perfil_resolucion_clase` · `proveedor_evento_tipo` · `puntaje_tiempo_espera` · `restringir_por_locacion` · `tarjeta_ultimos_cuatro` · `total_clics_cta` · `total_toques_mapa` · `total_toques_whatsapp` · `url_codigo_barras`

### 12.4 Decisión faltante declarada — no la invento

El manual **sí** fija la forma del **campo** (§3.2, regla 12: máximo dos segmentos salvo identidad compuesta) y **sí** fija el vocabulario de **función de tabla** (§3.3). **No fija ninguna forma para el término que no nace como campo**, que es justo la capa donde viven los 139. Sin esa regla, la admisión de un término de librería o de código no tiene contra qué medirse, y la Fase 2 se ejecutó sin ella.

El manual manda declararlo antes que inventarlo (§3, «Regla de lectura»): **la regla de forma del término no-campo es la ausencia que hay que cerrar antes de corregir los 139**, o la corrección se hará contra un criterio que todavía no existe.

### 12.5 Los 139 que entran a normalización

Agrupados por su primer segmento, tal como están hoy escritos en el diccionario.

**139 términos.**

- **abrir** (3): `abrir_sesion_foundation` · `abrir_sesiones_solucion` · `abrir_superficie_agente`
- **actor** (1): `actor_activo_contexto`
- **agregar** (1): `agregar_referencia_sesion`
- **almacen** (1): `almacen_estado_ui`
- **aplicar** (2): `aplicar_identidad_sesion_solucion` · `aplicar_intencion_requisitos`
- **aviso** (1): `aviso_conformidad_reporte_final`
- **bloque** (1): `bloque_mensaje_clase`
- **cambios** (1): `cambios_desde_invocaciones`
- **capacidades** (2): `capacidades_viewport_de` · `capacidades_viewport_por_perfil`
- **carga** (1): `carga_inicial_predeterminada`
- **cerrar** (3): `cerrar_historial_sesion` · `cerrar_lista_secciones` · `cerrar_sesion_foundation`
- **ciclo** (1): `ciclo_vida_turno`
- **codificar** (1): `codificar_fragmento_turno_guardian`
- **combinar** (1): `combinar_por_identidad`
- **componer** (10): `componer_carga_inicial_sesion` · `componer_contrato_cierre` · `componer_documento_reporte_final` · `componer_mensaje_turno_agente` · `componer_turno_canonico` · `componer_viewport_arquitecto` · `componer_viewport_codificador` · `componer_viewport_guardian` · `componer_viewport_humano` · `componer_vista_estado_contexto`
- **con** (1): `con_contrato_narrativa_trabajo`
- **concepto** (1): `concepto_auxiliar_intencion`
- **concesiones** (1): `concesiones_capacidad_guardian`
- **confirmar** (1): `confirmar_superficie_turno`
- **conjunto** (1): `conjunto_capacidades_viewport`
- **contrato** (2): `contrato_cierre_por_nivel` · `contrato_publico_narrativa_trabajo`
- **crear** (1): `crear_estado_ui_predeterminado`
- **decision** (1): `decision_a_estado_superficie`
- **deduplicar** (2): `deduplicar_identidades_superficie` · `deduplicar_narrativa_turno`
- **delimitador** (1): `delimitador_bloque_mensaje`
- **derivar** (1): `derivar_entrega_turno`
- **dividir** (1): `dividir_secciones_cierre`
- **documento** (1): `documento_reporte_final_de`
- **enlazar** (1): `enlazar_eventos_ajustes`
- **entrada** (7): `entrada_documento_reporte_final` · `entrada_narrativa_turno` · `entrada_proyeccion_superficie_turno` · `entrada_reporte_estado_contexto` · `entrada_reporte_final_turno` · `entrada_turno_canonico` · `entrada_uso_estado_contexto`
- **entradas** (1): `entradas_reporte_final`
- **enviar** (1): `enviar_mensaje_host`
- **errores** (1): `errores_campo_carga_inicial_sesion`
- **es** (3): `es_estado_pensando` · `es_estado_respondiendo` · `es_estado_turno_completo`
- **escalar** (1): `escalar_reporte_final`
- **escribir** (1): `escribir_estado_superficie`
- **escucha** (1): `escucha_narrativa_operativa`
- **estado** (3): `estado_agente_predeterminado` · `estado_foundation_predeterminado` · `estado_memoria_contexto`
- **etiqueta** (3): `etiqueta_accion_archivo` · `etiqueta_estado_contexto` · `etiqueta_fecha_sesion`
- **fijar** (2): `fijar_superficie_activa` · `fijar_supresion_desplazamiento`
- **gestor** (2): `gestor_ajuste_texto` · `gestor_desplazamiento_panel`
- **hidratar** (1): `hidratar_configuracion_agente`
- **html** (4): `html_acerca_de` · `html_filas_candidato` · `html_filas_catalogo` · `html_lista_roles`
- **identificador** (1): `identificador_viewport_turno_guardian`
- **indice** (1): `indice_ranura_turno`
- **leer** (2): `leer_estado_superficie` · `leer_supresion_desplazamiento`
- **mapa** (1): `mapa_tema_predeterminado`
- **marcar** (2): `marcar_campo_invalido` · `marcar_formato_cierre`
- **markdown** (1): `markdown_a_html`
- **mensaje** (1): `mensaje_chat_turno`
- **opciones** (1): `opciones_emisor_narrativa`
- **perfil** (1): `perfil_puede_emitir`
- **persistir** (1): `persistir_configuracion_agente`
- **prefijo** (1): `prefijo_fragmento_turno_guardian`
- **proporcion** (1): `proporcion_etiqueta_presion_contexto`
- **propuesta** (1): `propuesta_desde_invocaciones`
- **proyeccion** (1): `proyeccion_superficie_turno`
- **proyectar** (1): `proyectar_superficie_turno`
- **publicar** (1): `publicar_evento_turno`
- **ranura** (1): `ranura_bloque_turno`
- **ranuras** (1): `ranuras_ordenadas_turno`
- **recoger** (2): `recoger_decisiones_reporte_final` · `recoger_pendientes_reporte_final`
- **reconciliar** (5): `reconciliar_armazon_etapa` · `reconciliar_carril_requerido` · `reconciliar_cuerpo_etapa` · `reconciliar_hijos_indexados` · `reconciliar_superficie_turno`
- **rellenar** (1): `rellenar_base_yaml_foundation`
- **renderizar** (15): `renderizar_archivos_sesion` · `renderizar_avance_carga_inicial` · `renderizar_bloque_viewport` · `renderizar_clase_cierre_declarada` · `renderizar_cuerpo_propuesta` · `renderizar_estado_contexto` · `renderizar_guardianes_sesion` · `renderizar_inspeccion_visual` · `renderizar_paquetes_sesion` · `renderizar_sesiones_solucion` · `renderizar_superficie_activa` · `renderizar_tarjeta_propuesta` · `renderizar_tarjeta_reporte_final` · `renderizar_tarjeta_viewport` · `renderizar_viewport_general`
- **resolver** (4): `resolver_aprobacion_herramienta_guardian` · `resolver_caso_turno` · `resolver_reporte_final_turno` · `resolver_requisito_carril`
- **resultado** (1): `resultado_aprobacion_herramienta_guardian`
- **serializar** (3): `serializar_bloque_para_copia` · `serializar_documento_reporte_final` · `serializar_viewport_para_copia`
- **sincronizar** (1): `sincronizar_perfiles_desde_dom`
- **texto** (3): `texto_entrada_reporte_final` · `texto_valor_reporte_final` · `texto_valores_reporte_final`
- **titular** (1): `titular_nombre_herramienta`
- **truncar** (1): `truncar_carga_copia`
- **turno** (1): `turno_puede_emitir`
- **violacion** (1): `violacion_etapas_finales`
- **vista** (3): `vista_compactacion_contexto` · `vista_estado_contexto` · `vista_uso_estado_contexto`
---

---

## 13. Corrección de la Fase 2 — el término que no nace como campo

### 13.1 Qué estaba mal (medido, no supuesto)

Los términos que subí en la Fase 2 **no eran términos: eran frases**. Cada una llevaba
dentro el dueño (`foundation`, `guardian`, `sesion`, `solucion`, `turno`), el contexto de
llamada (`superficie`, `viewport`) o una preposición. De ahí salieron tres defectos:

| Defecto | Medición |
|---|---|
| Un hecho con muchos nombres | `componer_viewport_{arquitecto,codificador,guardian,humano}` (4) · `es_estado_{pensando,respondiendo,turno_completo}` (3) · `renderizar_tarjeta_{propuesta,reporte_final,viewport}` (3) · `capacidades_viewport_{de,por_perfil}` (2) · `html_filas_{candidato,catalogo}` (2) · `texto_valor{,es}_reporte_final` (2) · `{perfil,turno}_puede_emitir` (2) · `estado_{agente,foundation}_predeterminado` (2) |
| Nombres con más de dos segmentos | 139 de los declarados |
| Nombres con preposición | `capacidades_viewport_de` · `documento_reporte_final_de` · `con_contrato_narrativa_trabajo` · `combinar_por_identidad` · `decision_a_estado_superficie` · `elemento_en` · `identidad_de` · `hijos_de` · `markdown_a_html` · `contrato_cierre_por_nivel` · `serializar_*_para_copia` · `sincronizar_perfiles_desde_dom` · `html_acerca_de` · `proporcion_etiqueta_presion_contexto` |
| `usos` mal declarado | 12 términos que son valores o propiedades del estado quedaron como `funcion` |

**Retracto de §12.4.** Ahí escribí que el manual no fija forma para el término que no nace
como campo, y lo declaré una ausencia. Es falso: la forma es la misma nomenclatura de
§3.2, y `usos` + `clasificacion` existen justamente para que el diccionario rija términos
de librería y de código, no sólo campos. La regla quedó escrita en
`MANUAL_BIBLIOTECA_SQL.md` §3.2.1.

### 13.2 Qué se aplicó

| Acto | Cuántos |
|---|---|
| Renombrados (frase → término) | 124 |
| Bajas (el hecho ya tenía término, o el nombre no era nombrable) | 18 |
| `usos` reclasificado (`funcion` → `propiedad` / `constante`) | 12 |

### 13.3 Estado medido del bloque no-campo

Medido contra el diccionario vivo por la ruta de lectura (`GET /operation/library/diccionario/listar`):

| Uso | Términos |
|---|---|
| función | 116 |
| tipo | 38 |
| constante | 12 |
| clase | 5 |
| propiedad | 11 |
| **total no-campo** | **182** |

Universo: **730 términos**, todos ACTIVO (182 no-campo + 548 campos). Del bloque no-campo:
**cero** con preposición, **cero** con más de dos segmentos, **cero** con ligadura —no son
campos—. `clasificacion`: `libreria` 182 · `codigo` 67 (los declarados candidatos a código
fuera de librería). Las únicas excepciones de forma vivas son las que el manual ya autoriza:
identidad compuesta (regla 10) y clasificación por entidad (regla 11).

### 13.4 El mapa completo (viejo → nuevo)

```
abrir_sesion_foundation                        → abrir_sesion
abrir_superficie_agente                        → abrir_superficie
actor_activo_contexto                          → actor_activo
agregar_referencia_sesion                      → agregar_referencia
almacen_estado_ui                              → almacen_estado
aplicar_identidad_sesion_solucion              → aplicar_identidad
aplicar_intencion_requisitos                   → aplicar_intencion
aviso_conformidad_reporte_final                → aviso_conformidad
bloque_mensaje_clase                           → bloque_clase
cambios_desde_invocaciones                     → derivar_cambios
conjunto_capacidades_viewport                  → capacidades_viewport
carga_inicial_predeterminada                   → carga_inicial
cerrar_historial_sesion                        → cerrar_historial
cerrar_lista_secciones                         → cerrar_secciones
cerrar_sesion_foundation                       → cerrar_sesion
ciclo_vida_turno                               → ciclo_turno
codificar_fragmento_turno_guardian             → codificar_fragmento
combinar_por_identidad                         → combinar_identidad
componer_carga_inicial_sesion                  → componer_carga
componer_contrato_cierre                       → componer_contrato
componer_documento_reporte_final               → componer_documento
componer_mensaje_turno_agente                  → componer_mensaje
componer_turno_canonico                        → componer_turno
componer_viewport_arquitecto                   → componer_viewport
componer_vista_estado_contexto                 → componer_vista
con_contrato_narrativa_trabajo                 → aplicar_contrato
concepto_auxiliar_intencion                    → concepto_auxiliar
concesiones_capacidad_guardian                 → concesiones_capacidad
confirmar_superficie_turno                     → confirmar_turno
contrato_cierre_por_nivel                      → contrato_cierre
contrato_publico_narrativa_trabajo             → contrato_narrativa
crear_estado_ui_predeterminado                 → crear_estado
decision_a_estado_superficie                   → decision_estado
deduplicar_identidades_superficie              → deduplicar_identidades
deduplicar_narrativa_turno                     → deduplicar_narrativa
delimitador_bloque_mensaje                     → delimitador_bloque
derivar_entrega_turno                          → derivar_entrega
dividir_secciones_cierre                       → dividir_secciones
documento_reporte_final_de                     → documento_reporte
elemento_en                                    → elemento_posicion
enlazar_eventos_ajustes                        → enlazar_eventos
entrada_documento_reporte_final                → entrada_documento
entrada_narrativa_turno                        → entrada_narrativa
entrada_proyeccion_superficie_turno            → entrada_proyeccion
entrada_reporte_estado_contexto                → entrada_contexto
entrada_reporte_final_turno                    → entrada_reporte
entrada_turno_canonico                         → entrada_turno
entrada_uso_estado_contexto                    → entrada_uso
enviar_mensaje_host                            → enviar_mensaje
errores_campo_carga_inicial_sesion             → errores_campo
escribir_estado_superficie                     → escribir_estado
escucha_narrativa_operativa                    → escucha_narrativa
estado_agente_predeterminado                   → estado_predeterminado
estado_memoria_contexto                        → estado_memoria
etiqueta_accion_archivo                        → etiqueta_accion
etiqueta_estado_contexto                       → etiqueta_contexto
etiqueta_fecha_sesion                          → etiqueta_fecha
fijar_superficie_activa                        → fijar_superficie
fijar_supresion_desplazamiento                 → fijar_supresion
gestor_ajuste_texto                            → gestor_texto
gestor_desplazamiento_panel                    → gestor_desplazamiento
hidratar_configuracion_agente                  → hidratar_configuracion
html_acerca_de                                 → html_acerca
html_filas_candidato                           → html_filas
html_lista_roles                               → html_roles
identidad_de                                   → identidad_elemento
identificador_viewport_turno_guardian          → identificador_viewport
hijos_de                                       → hijos_elemento
indice_ranura_turno                            → indice_ranura
leer_estado_superficie                         → leer_estado
leer_supresion_desplazamiento                  → leer_supresion
mapa_tema_predeterminado                       → mapa_tema
marcar_campo_invalido                          → marcar_campo
marcar_formato_cierre                          → marcar_cierre
markdown_a_html                                → convertir_markdown
mensaje_chat_turno                             → mensaje_chat
opciones_emisor_narrativa                      → opciones_emisor
perfil_puede_emitir                            → puede_emitir
persistir_configuracion_agente                 → persistir_configuracion
prefijo_fragmento_turno_guardian               → prefijo_fragmento
proporcion_etiqueta_presion_contexto           → proporcion_presion
propuesta_desde_invocaciones                   → derivar_propuesta
proyeccion_superficie_turno                    → proyeccion_turno
proyectar_superficie_turno                     → proyectar_superficie
publicar_evento_turno                          → publicar_evento
ranura_bloque_turno                            → ranura_bloque
ranuras_ordenadas_turno                        → ranuras_turno
recoger_decisiones_reporte_final               → recoger_decisiones
recoger_pendientes_reporte_final               → recoger_pendientes
reconciliar_armazon_etapa                      → reconciliar_armazon
reconciliar_carril_requerido                   → reconciliar_carril
reconciliar_cuerpo_etapa                       → reconciliar_cuerpo
reconciliar_hijos_indexados                    → reconciliar_hijos
reconciliar_superficie_turno                   → reconciliar_superficie
rellenar_base_yaml_foundation                  → rellenar_base
renderizar_archivos_sesion                     → renderizar_archivos
renderizar_avance_carga_inicial                → renderizar_avance
renderizar_bloque_viewport                     → renderizar_bloque
renderizar_clase_cierre_declarada              → renderizar_clase
renderizar_cuerpo_propuesta                    → renderizar_cuerpo
renderizar_estado_contexto                     → renderizar_contexto
renderizar_inspeccion_visual                   → renderizar_inspeccion
renderizar_paquetes_sesion                     → renderizar_paquetes
renderizar_sesiones_solucion                   → renderizar_sesiones
renderizar_tarjeta_propuesta                   → renderizar_tarjeta
renderizar_viewport_general                    → renderizar_viewport
resolver_aprobacion_herramienta_guardian       → resolver_aprobacion
resolver_caso_turno                            → resolver_caso
resolver_reporte_final_turno                   → resolver_reporte
resolver_requisito_carril                      → resolver_requisito
resultado_aprobacion_herramienta_guardian      → resultado_aprobacion
serializar_bloque_para_copia                   → serializar_bloque
serializar_documento_reporte_final             → serializar_documento
serializar_viewport_para_copia                 → serializar_viewport
sincronizar_perfiles_desde_dom                 → sincronizar_perfiles
texto_entrada_reporte_final                    → texto_entrada
texto_valor_reporte_final                      → texto_valor
titular_nombre_herramienta                     → titular_herramienta
truncar_carga_copia                            → truncar_carga
violacion_etapas_finales                       → violacion_etapas
vista_compactacion_contexto                    → vista_compactacion
vista_estado_contexto                          → vista_contexto
vista_uso_estado_contexto                      → vista_uso
escalar_reporte_final                          → valor_reporte

BAJAS (18) — el hecho ya tenía término, o el nombre no era nombrable:
  abrir_sesiones_solucion · capacidades_viewport_de · capacidades_viewport_por_perfil
  componer_viewport_codificador · componer_viewport_guardian · componer_viewport_humano
  texto_valores_reporte_final · renderizar_superficie_activa · es_estado_pensando
  es_estado_respondiendo · es_estado_turno_completo · entradas_reporte_final
  estado_foundation_predeterminado · html_filas_catalogo · renderizar_guardianes_sesion
  renderizar_tarjeta_reporte_final · renderizar_tarjeta_viewport · turno_puede_emitir
```

### 13.5 Lo que NO se tocó, y por qué

Los términos de campo de dos segmentos con forma física y ligadura vigente —entre ellos
`arquetipo`, `base_datos`, `clasificacion`, `es_clave_primaria`, `es_referencia`,
`nombre_columna`, `nombre_tabla`— son las columnas del **propio modelo de la Biblioteca**
(`catalogo_tablas`, `tabla_campos_checked`): su forma física es la columna real de esa
tabla y su nombre no se corrige desde aquí. No son parte de esta Fase 2.
