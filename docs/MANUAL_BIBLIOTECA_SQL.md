# MANUAL DE BIBLIOTECA SQL — CÓMO ALIMENTARLA Y CÓMO CONSULTARLA

## Guía operativa del Guardián, aplicable desde cualquier repositorio

**Estado:** VIGENTE — versión 2.6, modelo de **cuatro piezas**, con **nomenclatura oficial fijada** (§3.2, incluida la **composición del término de campo**: el término nombra la función, no la tabla), **vocabulario de función fijado** (§3.3), **retiro de plantilla ya aplicado en la base y ejecutado** (migración 076, §8.1) y **papel del campo declarado en la ligadura** (migración 077, §5.5): el diccionario aporta el término y su forma física, no el papel.
**Deriva de:** `ArchitectHandoff AH-MUCQWYFU` · migraciones `075_biblioteca_reconstruccion_cuatro_piezas.sql`, `076_biblioteca_catalogo_retiro_y_correcciones.sql` y `077_biblioteca_papel_del_campo_en_la_ligadura.sql`, **aplicadas en producción**.
**Revisión 2.6 — 2026-09-27.** El manual se midió contra el canal vigente (Host **0.2.70**, bundle `grdcoderia.grdcoderia-cpct-0.2.70`, 50 generaciones instaladas) y se corrigieron **sólo los desfases de hecho**: el **inventario real de actos** (§4.1: **23**, no 8), la declaración falsa de que **no hay actos de lectura del canon** (§8), la declaración falsa de que **no hay acto que ponga `ACTIVA` una materialización** (§8), los **conteos** de generaciones y de procedimientos (§8.1, §10) y un error de tipeo. **No** se tocaron los criterios —forma del esquema, jerarquía de reglas, sinonimia de términos, frontera retirar/eliminar—: siguen **pendientes de decisión del Human** y se declaran abiertos en §8.2. Informe de la auditoría que originó esta revisión: `AUDITORIA_MANUAL_BIBLIOTECA_SQL_V1.md`.
**Sustituye a:** el borrador del modelo retirado (términos · tipos_tabla · admisiones · publicaciones · equivalencias y las rutas `library/query`, `library/propose`, `library/admit`). Ese modelo **fue retirado por completo**: sus rutas responden **404**. Este manual no describe el modelo viejo; declara el vigente.
**Audiencia:** el agente Guardián que trabaja desde un repositorio y necesita **alimentar el canon** o **consultar la definición** de una tabla.
**No sustituye:** la biblioteca de contratos (`query_contract_library`) ni el conocimiento de ingeniería (`query_knowledge`). Comparten la palabra «biblioteca»; **no el objeto**. Son tres autoridades distintas.
**Regla de lectura:** si algo no está en este manual, **no lo inventes**. Decláralo como decisión faltante.

---

## 1. Qué es la Biblioteca SQL

La **autoridad única** de vocabulario canónico y forma física de tablas del ecosistema. No es una plantilla de proyecto ni una convención: es **dato consultable**, y alimentarla es un acto de escritura con autoridad declarada.

| Es | No es |
|---|---|
| Autoridad de **nombres** y **forma física** de tablas | Memoria de agente |
| Dato versionado y auditable | Base de negocio de una solución |
| Fuente de la que se deriva el SQL de solución | Repositorio de código o de comportamiento |
| Tercera autoridad del canon, separada de contratos y conocimiento | Un documento: prosa sin canal no sirve |

### 1.1 La frontera que hay que respetar

**Consumir no es alimentar.** Consultar la biblioteca no te autoriza a cargarla, y cargarla no te autoriza a inventar lo que no está admitido. El canon se **carga** por el canal (acto explícito); se **consulta** por su acto de lectura; y **nada** se escribe por fuera del canal.

---

## 2. Cómo te conectas — el canal es la API de Operación, nunca la base

**Regla primera: tú no abres PostgreSQL.** No hay cadena de conexión, ni usuario, ni base para ti. Los datos viven en la base de operaciones, esquema `grdcoder_biblioteca` — pero **solo el servicio la abre**. Tú hablas por HTTP con la API de Operación, y el servicio resuelve nombres contra las claves internas.

> Si buscas la biblioteca por Postgres, no la vas a encontrar. El canal es la **Operation API**.

| Dato | Valor |
|---|---|
| Base por defecto | `https://api.antojadosmx.mx/grdcoder` |
| Prefijo de API | `/api/v1` |
| URL de un acto | `{BASE}/api/v1/operation/library/...` |
| Método | **POST** en los 23 actos vigentes (§4.1) |
| Dónde se configura | Settings → **Security** (Operation base URL) · variable de entorno `OPERATION_NODE_URL` sobre el Host |
| Credencial | token de Operation en **SecretStorage** (clave lógica `operation`), enviado como `authorization: Bearer <token>` |
| Cabeceras del cliente | `content-type: application/json` · `authorization: Bearer <token>` · `x-correlation-id: corr-<id>` |
| Dónde residen los datos | base de operaciones · esquema `grdcoder_biblioteca` (no es tu responsabilidad; el servicio es el único que la toca) |

**Comprueba el canal antes de culpar a la herramienta:**

```
GET {BASE}/api/v1/operation/health   →   {"state":"READY"}
```

Si eso responde, **el canal existe**. Decir «no tengo acceso a la base» o «no tengo canal» es falso cuando el health responde: lo que falta es la **herramienta en tu catálogo** (§4.2) o la ruta que estás usando (§7).

---

## 3. El modelo: cuatro piezas en dos planos

| Plano | Tabla | Qué guarda | Ciclo de vida |
|---|---|---|---|
| **Canon global** | `catalogo_tablas` | **plantillas** de tabla: nombre + arquetipo + objetivo | se escribe una vez; casi no cambia |
| **Canon global** | `diccionario_campos` | **términos** de campo: significado + forma física base | se escribe una vez; casi no cambia |
| **Materialización (por solución)** | `tablas_checked` | qué plantilla se usa en qué solución, con qué esquema y nombre real | se escribe por solución; cambia seguido |
| **Materialización (por solución)** | `tabla_campos_checked` | **la ligadura tabla ↔ campo**: orden, clave, obligatoriedad y destino | es el corazón del modelo |

Hay una **vista** derivada, `v_definicion_efectiva_tabla`: la tabla materializada con sus campos en orden y su **forma física efectiva** (el override si existe, si no la del diccionario).

### 3.1 Las tres ideas que explican casi todos los rechazos

1. **El nombre es identidad.** El nombre de tabla sigue `{entidad}_{funcion}` — **dos segmentos obligatorios** — en minúsculas (§3.2); el término del diccionario también. Un nombre **retirado no se reutiliza**.
2. **El diccionario no sabe a qué tabla pertenece un campo.** La pertenencia vive en la **ligadura**, no en el diccionario y no en ningún JSON. Por eso materializar y ligar son actos distintos.
3. **El `uuid` es interno.** Es la clave de relación entre las cuatro piezas y **no cruza el canal**: tú envías **nombres** y recibes **nombres**. Ninguna respuesta trae un id.

### 3.2 La nomenclatura oficial

Es la letra que rige cada nombre que declaras. Cada capa identifica **una sola cosa**, y lo que no le corresponde no aparece dentro del nombre.

| Capa | Qué identifica | Forma | Ejemplo |
|---|---|---|---|
| Base de datos | la **solución** — y solo eso | `{solución}` | `antojados` · `media` · `editorial` |
| Esquema | el **área** y la **función del grupo** de tablas que agrupa | `{área}_{función}` | `administracion_registro` |
| Tabla | la **entidad** y la **función** de la tabla sobre ella — **ambas obligatorias** | `{entidad}_{función}` | `usuarios_control` · `locaciones_plantilla` |
| Campo | el **término** del diccionario | `{término}` — `{entidad}_id` cuando es identidad | `usuario_id` · `creado_en` |

Reglas duras:

1. **La solución se identifica en el nombre de la base de datos, y en ninguna otra capa.** No entra en el esquema ni en la tabla. Si aparece en el esquema, el nombre está diciendo dos veces lo mismo: el esquema ya vive dentro de la base de su solución.
2. **La solución no es el nombre de la plataforma.** El ecosistema se llama ATLX; `atlx` es la plataforma, no una solución. Un token que se repite en base, esquema y tabla no distingue nada, y si además coincide con el nombre de una solución, deja **una palabra nombrando dos cosas**.
3. **El nombre de tabla no lleva área ni solución dentro.** El área vive en el esquema; la solución, en la base. Consecuencia: el `nombre_tabla` del catálogo es **identidad global** — dos tablas con el mismo nombre **son la misma cosa** en todo el ecosistema. Un nombre repetido no se arregla con prefijos: o es la **misma plantilla materializada** en dos esquemas, o la `función` está mal puesta porque no distingue lo que las dos tablas hacen.
4. **La `función` NO es opcional: el nombre lleva dos segmentos.** Medido contra el receptor en la carga del primer seed: `lugares`, `interacciones`, `seguimientos`, `insignias`, `campanas`, `elegibilidades` y `redenciones` fueron **rechazados** por la restricción `ck_ct_nombre_formato` de `catalogo_tablas`, mientras que 79 nombres de dos segmentos entraron sin objeción. El receptor no admite el nombre monosegmento, así que **toda tabla declara su función**, incluso cuando la tabla *es* la entidad (`usuarios_control`, no `usuarios`). Lo que sigue prohibido es la concatenación de **más** de dos tokens y el orden invertido.
5. **Minúsculas, español, sin anglicismos y sin acentos**, en las cuatro capas. El material observado —`ATLX_`, `_APP`, `biz_`, `sys_`, `soc_`, nombres en inglés concatenados— son nombres **observados a retirar**, no una forma a canonizar.
6. **La función tiene que distinguir.** Un token que aparece en el segundo lugar de **todos** los esquemas (el `core` de `antojados_core`) no nombra función alguna: deja el grupo de tablas sin declarar para qué existe, que es justo lo que la nomenclatura viene a decir.

**Las reglas del CAMPO —la capa que guarda el diccionario.** Son distintas de las de la tabla, y son estas:

7. **El término nombra el campo lógico y su función, NUNCA la tabla que lo contiene.** El diccionario **no sabe a qué tabla pertenece un campo** (§3.1, idea 2): por eso meter el nombre de la tabla dentro del término declara una pertenencia que no existe y **fabrica un sinónimo del mismo campo**. `instancia_estado` no es un término: es `estado_registro` ligado en `instancias_control`. La tabla ya dice de quién es el dato; el término dice **qué dato es**.
8. **Un término = un significado.** Si dos campos de dos tablas distintas significan lo mismo, **comparten término**: `nombre`, `codigo`, `orden`, `creado_en`, `estado_registro`. Cargar dos términos para el mismo campo lógico es el desorden que este modelo existe para matar.
9. **El campo se compone cuando el significado difiere, y el calificador va DESPUÉS y describe la NATURALEZA del dato, no su dueño.** Medido en el código: el `estado` del ciclo de vida del registro es `estado_registro`; el de una entrega, `estado_entrega`; el de un procesamiento, `estado_procesamiento`; el de una revisión, `estado_revision`; el de una emisión, `estado_envio`. **El orden importa: `estado_entrega`, nunca `entrega_estado`** ni `notificacion_estado`.
10. **Identidad: `{entidad}_id`.** El primer segmento es la **entidad del dato**, que puede estar compuesta si la entidad lo está (`grupo_permiso_id`, `plantilla_locacion_id`, `media_id`). Sólo la identidad y sus referencias llevan `_id`.
11. **`clase` y `tipo` describen a un identificador que admite varios elementos**, y se califican con la **entidad clasificada** (`instancia_clase`, `instancia_tipo`, `usuario_clase`, `media_clase`), no con la tabla donde viven.
12. **Prohibido concatenar más de dos segmentos en un campo** —salvo la identidad compuesta del punto 10— y prohibido el orden invertido. `notificacion_destinatario_estado_entrega` no es un término: es `estado_entrega`.
13. **Un campo simple no se inventa si ya existe su término.** Antes de cargar, se busca en la lista de control del diccionario; si existe, **se cita**, no se recarga ni se le inventa un sinónimo.

**Qué se declara en cada acto, entonces:**

- En `library_catalogo_cargar` (§5.2) va **solo** `nombre_tabla` = `{entidad}_{función}`: canon global, sin dueño.
- En `library_tabla_materializar` (§5.4) entran `solucion`, `esquema` y `nombre_tabla`: ahí el canon adquiere dueño, y el `esquema` que envías sigue `{área}_{función}`.

### 3.2.1 El término que no nace como campo

El diccionario no es sólo para campos. Los campos `usos` y `clasificacion` existen
precisamente para eso: `usos` declara **dónde aparece** el término (campo, propiedad,
función, método, clase, tipo, constante, consulta, vista, sp) y `clasificacion` declara
**con qué capa se consulta** (libreria, codigo). Así un mismo diccionario rige los
términos de las tablas, de las librerías y del código que no puede vivir en librería.
El código no cambia de lenguaje: el término es **el nombre al que se le aplica código**
—una función, una consulta, un método, una clase, una constante—, y sólo entra al
diccionario si es nombrable y si se le puede aplicar código.

La forma de ese término es la misma nomenclatura de §3.2, con seis reglas:

1. Minúsculas, en español, sin acentos y sin anglicismos (regla 5).
2. `{verbo|sustantivo}_{naturaleza}`: el término nombra **una** cosa.
3. El nombre **no lleva dentro al dueño ni al contexto de llamada** (reglas 7 y 9): el
   perfil, la sesión, la solución, el agente y el turno son parámetros, no segmentos.
4. **No lleva preposición** (`de`, `a`, `en`, `con`, `por`, `para`, `desde`): un nombre
   con preposición es una frase, y a una frase no se le aplica código.
5. **No lleva más de dos segmentos**, salvo las dos excepciones que este manual ya
   autoriza: identidad compuesta (regla 10) y clasificación por entidad (regla 11).
6. **Un término = un significado** (regla 8): si dos nombres describen el mismo hecho,
   existe un solo término; los demás se **eliminan** —no se retiran—, porque el retiro
   reserva el nombre para siempre y una corrección no debe quemar el nombre.

Lo que **no** es nombrable en código —un resto truncado de una expresión, un parámetro
del canal, un valor suelto de una enumeración— **no entra al diccionario**.

La matriz de normalización es la bitácora de este acto: ahí se registra el término tal
como aparece en GrdCoderIA, su normalización y el resultado de la comparación contra el
diccionario, antes de cargar o corregir nada.

### 3.3 El vocabulario de función

El segundo segmento es la **función**. No se improvisa ni se elige por gusto: se lee del papel que la tabla ejerce, medido en su DDL. Estos son los valores admitidos, con el caso real que los fijó.

| función | cuándo se usa | ejemplo cargado |
|---|---|---|
| **`control`** | la tabla **es el registro vivo** de la entidad: su cabecera, con identidad, atributos y estado | `usuarios_control` · `instancias_control` · `pedidos_control` |
| **`catalogo`** | la tabla es la **lista de referencia** de la que otras toman valores. Va en **segundo** lugar | `productos_catalogo` · `insignias_catalogo` · `dimensiones_catalogo` |
| **el nombre del padre** | la tabla es **detalle** de otra y cuelga de ella por clave foránea | `conversaciones_mensajes` · `facturas_cobros` · `medios_variantes` · `campanas_elegibilidades` |
| **el término del vínculo** | la tabla **liga** dos entidades | `procesos_asignaciones` · `seguimientos_participantes` |
| **el sujeto del cálculo** | la tabla es un **agregado** calculado sobre algo | `recomendaciones_contenido` · `tendencias_contenido` · `posiciones_instancias` |
| **`plantilla`** | la tabla es el **molde sin dueño**, que no pertenece a ninguna instancia | `locaciones_plantilla` |

Reglas que se derivan, y que ya se aplicaron al completar el catálogo:

1. **El primer segmento es la entidad, siempre.** `catalogo` en primer lugar es orden invertido: dice la función donde va la entidad.
2. **`catalogo` como función no es el arquetipo copiado**: declara para qué sirve la tabla (ser la lista canónica). El arquetipo vive en su columna, que es texto abierto y puede cambiar; el nombre declara el papel.
3. **El segundo segmento no repite el área ni la solución.** El área ya está en el esquema y la solución en la base.
4. **Un token que aparece en todas partes no es función** (el `core` de `antojados_core`): no distingue y por tanto no declara nada.

---

## 4. Las herramientas que tienes asignadas

### 4.1 Los actos vigentes — 23, en tres familias

Medido el 2026-09-27 contra el canal vigente (**Host 0.2.70**, bundle `grdcoderia.grdcoderia-cpct-0.2.70`): el Host expone **23 actos** de biblioteca, no ocho. Todos son **POST** bajo `{BASE}/api/v1/operation/library/…` y **ninguno recibe ni devuelve un id**: se envían nombres y se reciben nombres (§3.1, idea 3). Las rutas de las tablas van con el prefijo `/api/v1/operation/` omitido para que quepan.

**Familia A — Lectura del canon (6).** Permiso `knowledge_queries`. Carriles **auditar** y **ejecutar**.

| # | Acto | Herramienta | Ruta |
|---|---|---|---|
| 1 | Consultar la definición efectiva de una tabla materializada | `library_definicion_consultar` | `library/definicion/consultar` |
| 2 | Inventario de plantillas del catálogo | `library_catalogo_listar` | `library/catalogo/listar` |
| 3 | Inventario de términos del diccionario | `library_diccionario_listar` | `library/diccionario/listar` |
| 4 | Inventario de materializaciones por solución | `library_tabla_listar` | `library/tabla/listar` |
| 5 | Campos de una tabla materializada (confirmados **y** en borrador) | `library_tabla_campos_listar` | `library/tabla/campos/listar` |
| 6 | SQL compuesto de las tablas materializadas de una solución | `library_tabla_ddl` | `library/tabla/ddl/listar` |

**Familia B — Escritura sobre el canon (10).** Permiso `library_canon_write`. Carril **solo ejecutar**.

| # | Acto | Herramienta | Ruta |
|---|---|---|---|
| 7 | Cargar una plantilla de tabla | `library_catalogo_cargar` | `library/catalogo/cargar` |
| 8 | Cargar un término del diccionario (nacido como campo o como símbolo de librería/código) | `library_diccionario_cargar` | `library/diccionario/cargar` |
| 9 | Materializar una plantilla en una solución | `library_tabla_materializar` | `library/tabla/materializar` |
| 10 | Ligar un término a una tabla materializada | `library_tabla_campo_ligar` | `library/tabla/campo/ligar` |
| 11 | Confirmar la ligadura | `library_tabla_campo_confirmar` | `library/tabla/campo/confirmar` |
| 12 | Retirar una materialización de tabla | `library_tabla_retirar` | `library/tabla/retirar` |
| 13 | Retirar un término del diccionario | `library_diccionario_retirar` | `library/diccionario/retirar` |
| 14 | Editar una materialización (objetivo, `checked`, estado, renombrado) | `library_tabla_editar` | `library/tabla/editar` |
| 15 | Editar una plantilla del canon (arquetipo, objetivo, renombrado) | `library_catalogo_editar` | `library/catalogo/editar` |
| 16 | Editar un término del diccionario (significado, forma física, `usos`, `clasificacion`, renombrado) | `library_diccionario_editar` | `library/diccionario/editar` |

**Familia C — Borrado físico (7).** Mismo permiso `library_canon_write`: **el Host no tiene un permiso aparte que aísle lo destructivo** (§4.2, §8.2). Carril **solo ejecutar**. Estos actos **borran la fila** y **liberan el nombre**, a diferencia del retiro, que lo reserva para siempre.

| # | Acto | Herramienta | Ruta |
|---|---|---|---|
| 17 | Desligar **un** campo de una tabla (conserva la tabla y sus demás campos) | `library_tabla_campo_desligar` | `library/tabla/campo/desligar` |
| 18 | Purgar **todos** los campos de una tabla (conserva la tabla) | `library_tabla_campos_purgar` | `library/tabla/campos/purgar` |
| 19 | Eliminar físicamente una materialización (arrastra sus ligaduras) | `library_tabla_eliminar` | `library/tabla/eliminar` |
| 20 | Eliminar físicamente una plantilla del canon | `library_catalogo_eliminar` | `library/catalogo/eliminar` |
| 21 | Eliminar físicamente un término del diccionario | `library_diccionario_eliminar` | `library/diccionario/eliminar` |
| 22 | Purgar todas las materializaciones de una solución | `library_solucion_purgar` | `library/solucion/purgar` |
| 23 | Purgar bloques del canon (materializaciones → catálogo → diccionario) | `library_canon_purgar` | `library/canon/purgar` |

**Cuadre: 6 + 10 + 7 = 23.** Existe además **un acto declarado y todavía no expuesto**: `library_catalogo_retirar` (§5.9). Su procedimiento `sp_biblioteca_catalogo_retirar` está aplicado desde la migración **076** y ya operó, pero **ni la ruta ni la herramienta existen** en el canal vigente —0 apariciones en las 50 generaciones instaladas, 0.2.18 → **0.2.70**—. Mientras no se exponga, un retiro de plantilla se ejecuta **por migración**, nunca cargando el nombre nuevo sobre el viejo.

**El acto de lectura de la definición se llama `library_definicion_consultar`** y es el nº 1. No existe `query_sql_library`: era el nombre del modelo retirado y ya no responde.

**Qué desarrolla §5 y qué no.** §5 trae ficha completa de **ocho** actos —el nº 1 y los nº 7 a 13, que son el camino dorado de alimentar el canon y consultarlo— más la del acto declarado y no expuesto. Los **quince** restantes se documentan aquí con sus parámetros exactos:

| Acto | Obligatorios | Opcionales / valores |
|---|---|---|
| `library_catalogo_listar` | — | `estado` (`ACTIVO`/`RETIRADO`) · `arquetipo` · `busqueda` · `limite` · `desplazamiento` |
| `library_diccionario_listar` | — | `estado` · `busqueda` · `clasificacion` (`sql`/`libreria`/`codigo`) · `uso` (`campo`/`sp`/`vista`/`funcion`…) · `limite` · `desplazamiento` |
| `library_tabla_listar` | — | `solucion` · `esquema` · `estado` (`BORRADOR`/`ACTIVA`/`DEPRECADA`/`RETIRADA`) · `busqueda` · `limite` · `desplazamiento` |
| `library_tabla_campos_listar` | `solucion` · `esquema` · `nombre_tabla` | `solo_confirmados` — sin él devuelve también los borradores, que es lo que **muestra qué falta** de un seed |
| `library_tabla_ddl` | `solucion` | `esquema` · `nombre_tabla` |
| `library_tabla_editar` | `solucion` · `esquema` · `nombre_tabla` | `nuevo_esquema` · `nuevo_nombre` · `objetivo` · `checked` · `estado` (`BORRADOR`\|`ACTIVA`\|`DEPRECADA` — **`RETIRADA` no se acepta aquí**: va por el acto 12) · `observaciones` |
| `library_catalogo_editar` | `nombre_tabla` | `nuevo_nombre` · `arquetipo` · `objetivo` · `descripcion` |
| `library_diccionario_editar` | `termino` | `nuevo_termino` · `significado` · `tipo_dato` · `longitud` · `precision` · `escala` · `valor_por_defecto` · **`usos`** · **`clasificacion`** |
| `library_tabla_campo_desligar` | `solucion` · `esquema` · `nombre_tabla` · `termino` | — |
| `library_tabla_campos_purgar` | `solucion` · `esquema` · `nombre_tabla` · `confirmacion` | `confirmacion` = literal `ELIMINAR` |
| `library_tabla_eliminar` | `solucion` · `esquema` · `nombre_tabla` | — |
| `library_catalogo_eliminar` | `nombre_tabla` | — |
| `library_diccionario_eliminar` | `termino` | — |
| `library_solucion_purgar` | `solucion` · `confirmacion` | `confirmacion` = literal `ELIMINAR` |
| `library_canon_purgar` | `confirmacion` | `materializaciones` · `catalogo` · `diccionario` (banderas de bloque) · `confirmacion` = literal `ELIMINAR` |

**Dos fronteras que estos actos dejan dichas, no supuestas:** `library_tabla_editar` es el acto que pone `ACTIVA` una materialización (§8, hueco 2 ya cerrado) y el único que **renombra** esquema o nombre real sin borrar la tabla —el renombrado **falla** si cae sobre otra materialización vigente—; y `library_catalogo_editar` **renombra el canon sin reescribir los nombres reales ya materializados**, que es lo que permite corregir un nombre mal escrito sin perder sus materializaciones.

**El renombrado del diccionario sí mueve el nombre de columna efectivo** de las tablas que no declaran `nombre_columna` propio (§5.5): es la única edición del canon con efecto físico sobre la definición efectiva de las tablas.


### 4.2 «No tengo tools para ejecutar lo que pides» — por qué te pasa y cómo se comprueba

El catálogo que recibes se construye por **carril**, y el carril recorta. Estas son las combinaciones reales, medidas en el bundle **0.2.70**:

| Carril | `knowledge_queries` | `library_canon_write` | Qué puedes hacer con la biblioteca |
|---|---|---|---|
| **conversar** | false | false | **nada**: no hay herramienta de biblioteca en el catálogo |
| **auditar** | true | false | los **6 actos de lectura** (§4.1, familia A) |
| **ejecutar** | true | true | los **23**: lectura, escritura y borrado físico |

**Son dos permisos, no tres, y el segundo no distingue.** `library_canon_write` es **un solo** permiso e **incluye a la vez** los 10 actos de escritura y los 7 de borrado físico de §4.1; el Host vigente **no** tiene un permiso aparte que aísle lo destructivo. Medido: el set de permisos del bundle declara `knowledge_queries` y `library_canon_write` junto a los de repositorio, y el reparto de actos por permiso es exactamente el de §4.1. (Una lectura anterior de este manual atribuyó al Host un tercer permiso `library_canon_purgar`: ese nombre es una **herramienta**, no un permiso, y tal permiso no existe. Queda declarado el error para que nadie lo restituya.) Consecuencia que **no** se puede leer como autorización: estar en **ejecutar** habilita el borrado físico igual que la carga; la frontera entre retirar y eliminar **sigue pendiente de decisión** (§8.2).

Consecuencias que debes declarar en vez de disimular:

- Si estás en **conversar** o **auditar** y te piden cargar el canon, **la herramienta no está en tu catálogo por diseño** — no es un fallo del canal. Lo correcto es decirlo y pedir el nivel/carril, **nunca** decir «no tengo acceso a la base». En **auditar** sí tienes los 6 actos de lectura: con ellos **puedes inventariar** el canon sin conocer los nombres de antemano.
- Si estás en **ejecutar** y no ves las herramientas de carga, entonces el problema es otro y es comprobable: el paquete en ejecución es anterior al modelo de cuatro piezas. **Compruébalo antes de afirmarlo**, buscando los nombres en el bundle instalado:

```
grep -c "library_catalogo_cargar" ~/.vscode/extensions/grdcoderia.grdcoderia-cpct-*/dist/extension.js
```

Si eso devuelve `0`, el paquete no lleva las tools: hay que reemitir e instalar, y **recargar la ventana**. Sin recarga, la ventana sigue con la generación anterior en memoria.

---

## 5. Fichas de cada acto (parámetros exactos)

Todos los actos son **POST** sobre `{BASE}/api/v1/operation/library/...`. Los parámetros son los de la herramienta **y** los del cuerpo HTTP: son los mismos nombres.

### 5.1 Consultar la definición efectiva de una tabla — `library_definicion_consultar`

- **Ruta:** `POST /api/v1/operation/library/definicion/consultar`
- **Obligatorios:** `solucion`, `esquema`, `nombre_tabla`

```json
{ "solucion": "grdcodergti", "esquema": "grdcoder_ventas", "nombre_tabla": "ventas_pedidos" }
```

**Devuelve** una fila por campo, en el orden declarado:

| Campo | Significado |
|---|---|
| `plantilla`, `arquetipo` | la plantilla del canon que esta tabla materializa |
| `orden` | posición del campo en la tabla |
| `nombre_columna`, `termino` | el nombre real de la columna y el término del diccionario |
| `significado`, `tipo_dato` | semántica y tipo base |
| `longitud`, `precision`, `escala`, `valor_por_defecto` | **forma física efectiva** (override si existe; si no, la del diccionario) |
| `obligatorio`, `es_clave_primaria` | rol del campo **en esta tabla** |
| `es_referencia`, `referencia_esquema`, `referencia_tabla` | si **en esta tabla** el campo apunta a otra, y a cuál. `es_referencia` es el papel **declarado en la ligadura**, no un atributo del término: el mismo término puede ser clave en su tabla y referencia en otras |

La herramienta te lo entrega ya formateado:

```
DEFINICION EFECTIVA de grdcoder_ventas.ventas_pedidos (solucion grdcodergti) — plantilla ventas_pedidos [principal]:
- 1. pedido_id (pedido_id) uuid [PK] [NOT NULL]
- 2. cliente_ref (cliente_id) uuid [NOT NULL] -> grdcoder_ventas.ventas_clientes
- 3. total (total) numeric(12,2) [NOT NULL]
```

**Si devuelve vacío**, el mensaje de la herramienta ya te dice la causa: *o la tabla no está materializada, o sus ligaduras no están confirmadas*. No es un error del canal.

### 5.2 Cargar una plantilla de tabla en el canon — `library_catalogo_cargar`

- **Ruta:** `POST /api/v1/operation/library/catalogo/cargar`
- **Obligatorios:** `nombre_tabla`, `arquetipo`, `objetivo`
- **Opcional:** `descripcion`

```json
{ "nombre_tabla": "ventas_pedidos", "arquetipo": "principal",
  "objetivo": "Registrar los pedidos de la solución de ventas.", "descripcion": "Cabecera del pedido." }
```

- `nombre_tabla`: patrón **`{entidad}_{funcion}`** — **dos segmentos obligatorios**, en minúsculas (§3.2). Ej. `usuarios_control`, `locaciones_plantilla`, `instancia_ubicaciones`. El receptor **rechaza** el nombre de un solo segmento (`ck_ct_nombre_formato`). **Sin solución y sin esquema dentro**: el catálogo es canon global y ese nombre es identidad de todo el ecosistema.
- `arquetipo`: **texto abierto** — `principal`, `detalle`, `intermedia`, `muchos_a_muchos`, `catalogo`, `negocio`, `motor`… Un valor nuevo **entra por aquí**: no hay tabla de arquetipos, no hay lista cerrada y **no se toca el esquema**.
- Cargar **dos veces el mismo nombre ACTUALIZA**, no duplica.
- Un nombre **RETIRADO no se reutiliza**.

### 5.3 Cargar un término de campo en el diccionario — `library_diccionario_cargar`

- **Ruta:** `POST /api/v1/operation/library/diccionario/cargar`
- **Obligatorios:** `termino`, `significado`
- **Opcionales:** `tipo_dato`, `longitud`, `precision`, `escala`, `valor_por_defecto`, `usos`, `clasificacion`

```json
{ "termino": "cliente_id", "significado": "Identificador del cliente titular del registro.",
  "tipo_dato": "uuid", "usos": ["campo"], "clasificacion": ["sql"] }
```

- `termino`: minúsculas. Ej. `instancia_id`, `cliente_id`, `total`.
- `tipo_dato`: base — `uuid`, `text`, `integer`, `numeric`, `timestamptz`… **Opcional desde la migración 091**: un término que **no nace como campo** entra sin forma física (y sus campos de forma quedan nulos) declarando sólo `usos` y `clasificacion`.
- `longitud` > 0 · `precision` > 0 · `escala` ≥ 0 y ≤ `precision`.
- **`usos` — la FORMA en que el término se materializa.** Lista de tokens en minúsculas: `campo` (columna del motor LLM) · `sp` · `vista` · `indice` · `funcion` · `metodo` · `consulta` · `clase` · `constante` · `tipo` · `parametro`. Es lo que permite que **un mismo término** sirva como campo y, a la vez, como símbolo de librería o de código — **sin crear un segundo término**.
- **`clasificacion` — el DESTINO con el que se consulta el término.** Tokens: `sql` · `libreria` · `codigo`. Un término puede llevar **varios** (librería y código a la vez) y el eje existe para una sola pregunta: **qué términos puedo usar al escribir DDL, código o librería**.
- **Regla de dueño único.** Si el término ya es **columna** de una tabla materializada, el papel lo manda la **ligadura** y los ejes declaran `campo`/`sql`: el diccionario no declara pertenencia. Si el término **no nace como columna**, no hay ligadura posible y el diccionario es su **única** autoridad.
- **`usos` y `clasificacion` se REEMPLAZAN, no se acumulan**: la lista enviada es el eje completo. `null` —enviarlos vacíos es lo mismo— **conserva** el contenido vigente; el eje no se vacía por esta vía.
- **Aquí NO se declara el papel del campo.** El diccionario aporta el término, su forma física base y sus dos ejes de consulta, y nada más: **no decide si el campo es clave, referencia o campo simple** — eso se declara al ligar (§5.5), que es donde vive cada uso.
- Cargar dos veces el mismo término **ACTUALIZA**; un término retirado **no se reutiliza**.
- **El diccionario NO sabe a qué tabla pertenece el campo.** No intentes declarar la tabla aquí: se declara ligando (§6.3).
- El parámetro `es_referencia` sigue aceptándose en el canal **INFORMATIVO y sin efecto**: la migración 077 retiró su efecto de candado y 091 lo dejó fuera de la decisión. No lo envíes.

### 5.4 Materializar una plantilla en una solución — `library_tabla_materializar`

- **Ruta:** `POST /api/v1/operation/library/tabla/materializar`
- **Obligatorios:** `plantilla`, `solucion`, `esquema`, `nombre_tabla`
- **Opcionales:** `base_datos`, `objetivo`, `motivo`

```json
{ "plantilla": "ventas_pedidos", "solucion": "grdcodergti", "esquema": "grdcoder_ventas",
  "nombre_tabla": "ventas_pedidos", "base_datos": "ventas_node",
  "motivo": "Alta inicial de la tabla de pedidos." }
```

- `plantilla` debe **existir en el catálogo**. Si no existe o está retirada, **el acto FALLA** con error explícito — es el criterio de coherencia del handoff, no un bug.
- **Materializar no declara canon**: crea la relación «esta solución usa esta plantilla».
- Materializar es **paso previo obligatorio** a ligar: una ligadura sobre una tabla no materializada falla.
- La materialización nace en estado `BORRADOR`. Sus **cuatro** estados son `BORRADOR`, `ACTIVA`, `DEPRECADA` y `RETIRADA`: los tres primeros los mueve `library_tabla_editar` (§4.1, nº 14) —que es además el único acto que **renombra** esquema o nombre real **sin borrar** la tabla, y que rechaza `RETIRADA`—, y `RETIRADA` sólo lo pone el acto de retiro (§5.7). Esto **no bloquea** la consulta (§5.1), que exige únicamente que la tabla no esté retirada y que sus ligaduras estén confirmadas.

### 5.5 Ligar un término a una tabla materializada — `library_tabla_campo_ligar`

**Es el corazón del modelo: aquí se declara la estructura de la tabla. No en un JSON, no en el diccionario.**

- **Ruta:** `POST /api/v1/operation/library/tabla/campo/ligar`
- **Obligatorios:** `solucion`, `esquema`, `nombre_tabla`, `termino`, `orden`
- **Opcionales:** `obligatorio`, `es_clave_primaria`, `esquema_referencia`, `tabla_referencia`, `nombre_columna`, `longitud_override`, `precision_override`, `escala_override`, `valor_por_defecto_override`

```json
{ "solucion": "grdcodergti", "esquema": "grdcoder_ventas", "nombre_tabla": "ventas_pedidos",
  "termino": "pedido_id", "orden": 1, "es_clave_primaria": true, "obligatorio": true }
```

```json
{ "solucion": "grdcodergti", "esquema": "grdcoder_ventas", "nombre_tabla": "ventas_pedidos",
  "termino": "cliente_id", "orden": 2, "obligatorio": true,
  "tabla_referencia": "ventas_clientes" }
```

**El papel del campo se declara AQUÍ, y es por tabla.** El mismo término (`instancia_id`, `usuario_id`) es **clave en su tabla** y **referencia en otras**, así que ningún atributo del término puede decidirlo. En la ligadura:

| lo que envías | lo que se declara |
|---|---|
| `tabla_referencia` | el campo es una **referencia directa**: apunta a esa única tabla **en esta tabla** |
| sin `tabla_referencia` | el campo es **clave propia**, **campo simple** o **referencia que no admite destino único**. Los tres casos se distinguen por derivación (§5.5.1); ninguno autoriza a inventar un destino |
| `es_clave_primaria: true` | el campo es la clave de **esta** tabla |

**Reglas duras de coherencia (se verifican y fallan si se incumplen):**

1. Si envías `tabla_referencia`, esa tabla debe estar **materializada** en la solución: es integridad del grafo, porque la definición efectiva resuelve el destino contra las tablas materializadas.
2. Si **no** la envías, el campo se liga sin destino. **No hay candado por término**: el `es_referencia` que hubieras cargado en el diccionario no cambia nada aquí (migración 077).
3. `orden` debe ser **> 0** y **único entre las ligaduras vigentes** de esa tabla.

- `esquema_referencia`: si se omite, se asume el esquema de la tabla ligada.
- `nombre_columna`: úsalo **sólo** si el nombre real de la columna difiere del término.
- `longitud_override`, `precision_override`, `escala_override`, `valor_por_defecto_override`: la forma física **propia de esta tabla**. Si son `NULL`, **hereda del diccionario**.
- Ligar el mismo campo dos veces a la misma tabla **ACTUALIZA**, no duplica.

### 5.5.1 Los cuatro tipos de relación

**Corrección declarada.** Hasta esta revisión, la tabla de §5.5 afirmaba que «sin `tabla_referencia` el campo **no apunta**: clave propia o campo simple». Esa forma era **incompleta y quedó retirada**, con su motivo: describe únicamente la referencia directa y, aplicada a las otras tres, obliga al agente a inventar un destino único para una referencia que legítimamente no lo tiene —o, peor, a **dividir la identidad** (`regla_contrato_id`, `regla_ingenieria_id`) para poder declararla. La regla correcta se deriva de la ligadura:

| tipo | cómo se reconoce en la ligadura | qué garantiza el canon | destino declarado |
|---|---|---|---|
| **REFERENCIA_DIRECTA** | el campo lleva `tabla_referencia` | la fila destino existe: integridad por FK convencional | uno, materializado |
| **REFERENCIA_CLASIFICADA** | identidad `{entidad}_id` + clasificador `{entidad}_clase` en la misma tabla, sin destino | la identidad es única **dentro de su clase**; la clase resuelve la tabla de la entidad | ninguno |
| **REFERENCIA_POLIMÓRFICA** | `objeto_referencia` + `objeto_clase` | la clase declara a qué entidad pertenece la referencia; el localizador es **texto** porque la identidad destino no es única entre entidades | ninguno |
| **REFERENCIA_EXTERNA** | identidad de una entidad que vive en **otra base o solución** | la frontera es deliberada: la identidad viaja interoperable y el canon **prohíbe** la FK local | ninguno, ni tabla local |

Reglas de la derivación:

1. **El tipo no se almacena.** Se deriva de la ligadura más el clasificador; guardarlo sería una segunda autoridad del mismo hecho y podría divergir. El tipo es una **regla de lectura**, no un campo: no se agrega columna, ni acto, ni catálogo de tipos.
2. **La ausencia de `tabla_referencia` no es una relación olvidada**: es el estado correcto de los tipos 2, 3 y 4. No procede ninguna corrección que agregue destino a `regla_id`, `objeto_referencia` ni `turno_id`.
3. **Identidad y clasificador viajan juntas**, en la referencia clasificada: el par viaja **completo** — identidad sin su clase, o clase sin su identidad, es violación. La regla alcanza **sólo** a la clase que acompaña a una identidad de referencia. Un **clasificador de valor** —`actor_clase`, `perfil_resolucion_clase`, `disparador_clase`, `candidato_clase`, `estado_registro`— clasifica el propio registro, no porta identidad y **no es una referencia**: no se le exige par ni se le prohíbe.
4. **La unicidad de una identidad clasificada es por clase, no global.** `regla_id` puede repetirse entre clases; la identidad es `regla_id + regla_clase`. No se exige unicidad global.
5. **Un caso que no encaje en los cuatro tipos no se resuelve inventando**: se declara `HUECO_REAL_DE_INTEGRIDAD` y exige autoridad. A la fecha de esta revisión: **0**.

**Aplicado a la solución `tmia` (35 materializaciones · 57 relaciones):** 48 directas · 4 clasificadas · 4 polimórficas · 1 externa. Registro nominal de las 9 no directas:

| tabla | referencia | tipo | resolución |
|---|---|---|---|
| conocimiento_gobierno.disparadores_regla | `regla_id` + `regla_clase` | clasificada | la clase resuelve `reglas_contrato` / `reglas_ingenieria` |
| conocimiento_gobierno.filtros_regla | `regla_id` + `regla_clase` | clasificada | idem |
| fundacion_resolucion.activaciones_detalle | `regla_id` + `regla_clase` | clasificada | idem |
| operacion_desarrollo.hallazgos_control | `regla_id` + `regla_clase` (opcional) | clasificada | idem |
| conocimiento_gobierno.candidatos_control | `objeto_referencia` + `objeto_clase` | polimórfica | la clase declara la entidad destino |
| fundacion_resolucion.filtros_detalle | `objeto_referencia` + `objeto_clase` | polimórfica | idem |
| memoria_contexto.memorias_vinculo | `objeto_referencia` + `objeto_clase` | polimórfica | idem |
| operacion_desarrollo.eventos_control | `objeto_referencia` + `objeto_clase` | polimórfica | idem |
| memoria_contexto.historicos_temporal | `turno_id` | externa | turno de **Compact**: identidad interoperable, sin FK local |

### 5.6 Confirmar la ligadura — `library_tabla_campo_confirmar`

- **Ruta:** `POST /api/v1/operation/library/tabla/campo/confirmar`
- **Obligatorios:** `solucion`, `esquema`, `nombre_tabla`, `termino`
- **Opcional:** `checked` (por defecto `true`; `false` la devuelve a borrador)

```json
{ "solucion": "grdcodergti", "esquema": "grdcoder_ventas",
  "nombre_tabla": "ventas_pedidos", "termino": "cliente_id" }
```

**Confirmar es lo que hace visible la ligadura.** La definición efectiva (§5.1) sólo muestra las ligaduras **confirmadas**. Si ligaste y no confirmaste, la consulta saldrá vacía y creerás que falló el canal.

Identificas la ligadura **por nombres** — `solucion`, `esquema`, `nombre_tabla`, `termino`. El `uuid` interno **lo resuelve el canal y no se envía nunca**.

### 5.7 Retirar una materialización — `library_tabla_retirar`

- **Ruta:** `POST /api/v1/operation/library/tabla/retirar`
- **Obligatorios:** `solucion`, `esquema`, `nombre_tabla` · **Opcional:** `motivo`

El canon **no se borra: se retira**. Una materialización retirada **no puede reutilizarse** — para volver a usarla hay que crear una nueva. El `motivo` queda registrado: úsalo siempre.

**Declarado, no resuelto (§8.2).** El canal expone además **siete actos de borrado físico** que sí borran la fila y **liberan el nombre** (§4.1, familia C), bajo **el mismo permiso** que concede la carga. Este manual **no los admite como vía**: declara que existen y deja la frontera `retirar`/`eliminar` **pendiente de decisión**. Mientras no esté decidida, la vía de este manual sigue siendo **retirar**.

### 5.8 Retirar un término del diccionario — `library_diccionario_retirar`

- **Ruta:** `POST /api/v1/operation/library/diccionario/retirar`
- **Obligatorios:** `termino` · **Opcional:** `motivo`

**Se NIEGA si el término está en uso en una tabla activa**: retirarlo dejaría la ligadura sin su forma física. Un término retirado **no puede volver a cargarse**.

### 5.9 Retirar una plantilla del canon — `library_catalogo_retirar`

- **Ruta:** `POST /api/v1/operation/library/catalogo/retirar` — **declarada; el servicio aún no la expone**
- **Obligatorios:** `nombre_tabla` · **Opcional:** `motivo`
- **Devuelve:** `nombre_tabla` y `estado` (`RETIRADO`) — **nombres, nunca ids**
- **Respaldo en la base:** `grdcoder_biblioteca.sp_biblioteca_catalogo_retirar(text, text)` — **ya aplicado** (migración 076)

El canon **no se borra: se retira**, y el motivo queda escrito en la columna `catalogo_tablas.motivo`. Un nombre retirado **no se reutiliza**: `library_catalogo_cargar` lo rechaza. Y **se NIEGA si la plantilla está materializada** en alguna solución, porque retirarla dejaría la materialización sin su canon — la misma protección que tiene el término en uso (§5.8).

**Estado, medido el 2026-09-27:** el procedimiento está aplicado y ya retiró las ocho plantillas corregidas (§8.1); su exposición por el canal **sigue sin existir**: la ruta `library/catalogo/retirar` no está entre las 23 expuestas (§4.1) y `library_catalogo_retirar` da **0 apariciones** en las **50 generaciones instaladas** (0.2.18 → **0.2.70**). Que llegue «con la próxima generación» es una expectativa, no un hecho medido: ninguna generación posterior a la 076 lo ha expuesto todavía.

---

## 6. Los flujos, en orden

El orden no es opcional: cada acto exige el anterior.

```
CANON       ① cargar plantilla     ② cargar término
                                    │
SOLUCIÓN    ③ materializar ─────────┴──► ④ ligar campo  ──► ⑤ confirmar
                                                              │
                                                      ⑥ consultar definición
```

### 6.1 Alimentar el catálogo de tablas

**Cuándo:** existe una forma de tabla que debe ser canónica y todavía no está.
**Regla:** el canon **no se deduce de tu solución**. Si el nombre no está, se **propone por el canal** (§5.2) con su arquetipo y su objetivo — nunca se «adapta» un nombre para que quepa.

| Paso | Acto | Comprobación |
|---|---|---|
| 1 | `library_catalogo_cargar` | devuelve la plantilla con su `estado` (`ACTIVO`/`RETIRADO`) |
| 2 | materializar (§6.3, paso 3) | si la plantilla no existe, materializar **falla** |

### 6.2 Alimentar el diccionario

**Cuándo:** hace falta un término de campo que aún no está.
**Regla:** un término se carga **una vez** y sirve a todas las tablas. Si ya existe, cargarlo otra vez **actualiza** su forma base — no crea duplicado.

| Paso | Acto | Nota |
|---|---|---|
| 1 | `library_diccionario_cargar` | sólo el término y su forma física base: el diccionario **no decide papeles** |

### 6.3 Crear la relación tabla ↔ campos (el flujo completo)

1. **Materializar** la plantilla en la solución — `library_tabla_materializar` (§5.4). *Sin esto, ligar falla.*
2. **Ligar cada campo**, en orden — `library_tabla_campo_ligar` (§5.5). Declara `orden`, `es_clave_primaria`, `obligatorio` y, **si en esta tabla el campo apunta a otra**, `tabla_referencia`. El papel es **por tabla, no por término**: el mismo término puede ser clave en una tabla y referencia en otra.
3. **Confirmar cada ligadura** — `library_tabla_campo_confirmar` (§5.6). *Sin esto, la definición efectiva no existe.*
4. **Consultar** — `library_definicion_consultar` (§5.1) para verificar que la definición salió completa.

**Ejemplo mínimo end-to-end** (canon ya cargado):

```
① library_tabla_materializar
   { "plantilla":"ventas_pedidos", "solucion":"grdcodergti",
     "esquema":"grdcoder_ventas", "nombre_tabla":"ventas_pedidos" }

② library_tabla_campo_ligar  ×N
   { "solucion":"grdcodergti","esquema":"grdcoder_ventas","nombre_tabla":"ventas_pedidos",
     "termino":"pedido_id","orden":1,"es_clave_primaria":true,"obligatorio":true }
   { ... "termino":"cliente_id","orden":2,"obligatorio":true,"tabla_referencia":"ventas_clientes" }
   { ... "termino":"total","orden":3,"obligatorio":true }

③ library_tabla_campo_confirmar  ×N
   { "solucion":"grdcodergti","esquema":"grdcoder_ventas",
     "nombre_tabla":"ventas_pedidos","termino":"pedido_id" }
   …

④ library_definicion_consultar
   { "solucion":"grdcodergti","esquema":"grdcoder_ventas","nombre_tabla":"ventas_pedidos" }
```

### 6.4 Consultar la información de biblioteca de una tabla

**Es el acto nº 1 de §4.1 y se hace con `library_definicion_consultar`** (§5.1). Responde: qué plantilla implementa la tabla, su arquetipo, y **cada campo en orden** con su término, su significado, su tipo, su forma física efectiva, si es clave **en esa tabla**, si es obligatorio y **a qué tabla apunta en esa tabla**, si apunta.

**Lo que necesitas para consultar son NOMBRES, no claves:** solución, esquema y nombre de la tabla materializada. Si no conoces el esquema donde vive la tabla de la solución, ese dato no lo resuelve la biblioteca — consúltalo en el repositorio o en el contrato de la solución.

### 6.5 Retirar

- **Tabla materializada** (`library_tabla_retirar`, §5.7): se retira la materialización; el nombre **no se reutiliza**.
- **Término** (`library_diccionario_retirar`, §5.8): se **niega** si el término está en uso en una tabla activa.
- **Plantilla de tabla** (`library_catalogo_retirar`, §5.9): se retira con su motivo; el nombre **no se reutiliza**, y **se niega si la plantilla está materializada** en alguna solución.

---

## 7. Errores: cómo leerlos (y qué NO concluir)

| Respuesta | Significado | Qué haces |
|---|---|---|
| `200` con la fila | el acto se ejecutó; la respuesta trae **nombres**, nunca ids | continúa con el paso siguiente |
| `400 MISSING_PARAMS` | falta un campo del cuerpo; **el mensaje te dice cuál**: «biblioteca ligar: falta(n) orden» | envía el campo nombrado |
| `409 BIBLIOTECA_RECHAZO` | el procedimiento **rechazó el acto por una regla**: plantilla inexistente, término no admitido, destino de referencia ausente o indebido, orden repetido, nombre retirado, término en uso | lee el motivo del rechazo; **no lo rodees**: corrige el dato o escala |
| `404 NOT_FOUND` | estás usando una ruta del **modelo retirado** | usa la ruta vigente de §5 |
| La herramienta no aparece en tu catálogo | el **carril** no la concede o el paquete es anterior | §4.2 |

**Prohibido concluir de un error:** «no tengo acceso», «no existe la biblioteca», «no hay canal». Ninguna de las tres cosas se sigue de un `409`: el `409` **prueba** que el canal llegó y que la regla actuó.

---

## 8. Lo que NO existe — declarado, no inventado

Estos huecos están medidos y se declaran para que nadie los busque ni los supla. **Los dos primeros de la versión 2.5 ya no eran ciertos**: quedan retirados con su corrección a la vista, para que nadie los restituya por haberlos leído aquí.

1. ~~**No hay acto de inventario del canon.**~~ **FALSO desde la migración 078.** El canal **sí** expone actos de inventario: `library_catalogo_listar`, `library_diccionario_listar`, `library_tabla_listar` (materializaciones por solución, con el **avance de campos** `confirmados`/`total`) y `library_tabla_campos_listar` (campos confirmados **y** en borrador), más `library_tabla_ddl` (§4.1, familia A). **Medido en vivo el 2026-09-30:** el catálogo responde **119 plantillas** (111 `ACTIVO` + 8 `RETIRADO`) y el diccionario **548 términos, todos `ACTIVO`** (0 retirados), con `usos` y `clasificacion` declarados y consultables — 548 con `clasificacion` `sql`, 138 de ellos con ligadura vigente. *(Cifras anteriores —«200 términos, 146 activos y 54 retirados», y «440 términos» del 2026-09-27— **no se reproducen hoy** y quedan retiradas.)* Consecuencia práctica **invertida**: ya **no** hace falta conocer el nombre de una plantilla para materializarla — se **inventaría primero**; antes se decía lo contrario. Lo que el inventario **no** da sigue en pie y es lo que hay que declarar: devuelve nombre, arquetipo, estado, forma base, `usos`, `clasificacion` y **ligaduras**, **no** el significado ni la decisión que autoriza cada término — y `ligaduras` cuenta ligaduras vigentes, no existencia, así que **no valida por sí solo** las marcas de progresión. **Homonimia declarada:** `usos` nombra a la vez el array del diccionario (forma declarada) y el conteo de ligaduras que reporta `library_diccionario_listar` cuando se lee sin el campo: al leer el inventario, el número es **ligaduras**; al leer el término, la lista es **forma**.
2. ~~**No hay acto que declare `ACTIVA` una materialización.**~~ **FALSO: existe y se llama `library_tabla_editar`** (§4.1, nº 14). Declara `estado` con `BORRADOR`, `ACTIVA` o `DEPRECADA` —`RETIRADA` se rechaza aquí y va por el acto de retiro—, y además mueve el flag `checked` de la tabla, su objetivo y su renombrado de esquema/nombre. Lo que sigue siendo cierto es sólo la mitad: **materializar nace `BORRADOR`** (§5.4); lo que faltaba era el acto para moverlo, y ya está.
3. **No hay clave de la ligadura que viaje por el canal.** El `uuid` es interno por diseño (§3.1, idea 3). Si una fuente te pide un id de ligadura, esa fuente está describiendo el modelo retirado.
4. **No hay ruta ni herramienta para retirar una plantilla.** `sp_biblioteca_catalogo_retirar` está aplicado (migración **076**, §8.1) y es la autoridad del retiro; lo que **no** existe es la ruta del servicio ni la herramienta del Host —0 apariciones en las 50 generaciones instaladas, 0.2.18 → **0.2.70**—. Hasta que lleguen, y también después, **no rodees el retiro cargando el nombre nuevo**: eso deja **dos plantillas vivas nombrando la misma tabla**.

### 8.1 El retiro de plantilla — aplicado en la base (migración 076)

**Estado real, medido en la base y no deducido del archivo.** El acto existe, quedó aplicado y ya operó; lo que sigue faltando es su exposición al agente por el canal.

| pieza | estado |
|---|---|
| procedimiento `grdcoder_biblioteca.sp_biblioteca_catalogo_retirar(text, text)` | **APLICADO** — migración `076_biblioteca_catalogo_retiro_y_correcciones.sql`, registrada en `public.grdcoder_schema_migration` versión **76** |
| columna `catalogo_tablas.motivo` | **APLICADA** — el motivo del retiro queda escrito en la propia fila |
| las **ocho correcciones** | **EJECUTADAS** — ocho nombres `RETIRADO` con su motivo y ocho nombres corregidos `ACTIVO` |
| ruta `POST /api/v1/operation/library/catalogo/retirar` | **no existe** — ninguna generación posterior a la 076 la ha expuesto |
| herramienta `library_catalogo_retirar` en el Host | **no existe** — 0 apariciones en las **50 generaciones instaladas** (0.2.18 → **0.2.70**) |

**Las tres reglas, tal como quedaron escritas en el procedimiento:**

1. Retiro **lógico**: el canon no se borra — el estado pasa a `RETIRADO` y el motivo queda en la fila.
2. Un nombre retirado **no se reutiliza**: lo hace cumplir `sp_biblioteca_catalogo_cargar`, que rechaza cargar sobre un nombre `RETIRADO`.
3. **Se NIEGA si la plantilla está materializada** en alguna solución: retirarla dejaría la materialización sin su canon. Es la misma protección que ya tiene el término en uso (§5.8).

**Las ocho correcciones, ejecutadas y verificadas.** El nombre viejo queda `RETIRADO` y no vuelve; el nuevo entra `ACTIVO` **conservando el arquetipo, el objetivo y la descripción** de la fila original — esta corrección cambia el nombre, no reescribe el canon.

| # | retirado | cargado | arquetipo conservado | motivo registrado |
|---|---|---|---|---|
| 1 | `hosts_editoriales` | `canales_editoriales` | catalogo | su único es el canal: la fila **es** un canal, no un host |
| 2 | `puntajes_engagement` | `puntajes_interaccion` | negocio | `engagement` es el inglés de «interacción», término ya canónico |
| 3 | `sesiones_chatbot` | `sesiones_asistente` | cola | su columna decisiva es el escalado a agente humano |
| 4 | `snapshot_economico` | `cortes_economicos` | negocio | su único es instancia+fecha+periodo: es un corte |
| 5 | `solicitudes_checks` | `solicitudes_verificaciones` | detalle | su objetivo ya dice «verificaciones» |
| 6 | `solicitudes_media` | `solicitudes_medios` | cola | el canon ya llama `medios` al activo |
| 7 | `eventos_normalizados` | `eventos_consumo` | historica | «normalizados» describe la forma, no la función |
| 8 | `catalogo_alcance` | `alcances_catalogo` | catalogo | **orden invertido**: decía la función donde va la entidad (§3.3 regla 1) |

**Orden obligatorio, respetado:** **primero el retiro, después la carga**, y todo **antes de materializar ninguna solución**. Al revés queda durante un tiempo dos plantillas vivas para la misma tabla; y una vez materializada, la regla 3 lo niega y habría que retirar antes la materialización.

**Verificación reportada por la migración, medida después en la base:** canon `ACTIVO` = **111** antes y después (no se pierde ni se duplica ninguna), `RETIRADO` = **8**, filas totales = **119**, **0** nombres vigentes duplicados, **0** nombres vigentes fuera del patrón de dos segmentos, y el runner reejecutado **salta** la 076 sin repetirla.

Fundamento de cada nombre nuevo, leído en el DDL de su tabla: `NORMALIZACION_V3_RONDA_2.md` §4 y `CATALOGO_TABLAS_SEED_V1.md` §4.2. La migración aplicada y su respaldo previo: `ENTREGA_ACTO_RETIRO_PLANTILLA.md`.

### 8.2 Fronteras abiertas — criterio del Human, no medición

Lo que sigue **no** se corrige en esta revisión a propósito: son decisiones de criterio, y escribir una versión propia sería inventar canon. Se declaran para que la próxima pasada no las redescubra ni las resuelva por su cuenta.

| frontera abierta | qué está sin decidir | dónde vive hoy |
|---|---|---|
| **retirar vs. eliminar** | el manual sostiene que **el canon no se borra: se retira**, y el canal expone **7 actos de borrado físico** que **liberan el nombre**, bajo **el mismo permiso** que concede la carga. Este manual no admite el borrado físico como vía; su admisión **no está decidida** | §4.1 familia C · §4.2 · §5.7 |
| **forma del nombre de esquema** | §3.2 fija `{área}_{función}` para el esquema, pero los esquemas que el propio manual usa son `{plataforma}_{área}` (`grdcoder_ventas`, `grdcoder_biblioteca`) y **ninguna regla tipifica el prefijo** `grdcoder` | §3.2 (regla de esquema) · §5.1–§6.3 |
| **jerarquía de las reglas** | qué manda cuando la regla del manual y una regla del receptor se contradicen: el manual **no declara jerarquía** con el estudio v3 / `GOBIERNO_IDS.md` | §3.2, reglas 1–13 |
| **sinonimia de términos** | si dos términos que significan lo mismo **se fusionan o conviven**: el manual prohíbe duplicar el término y prohíbe inventarle un sinónimo, pero no dice qué hacer con el que ya existe duplicado | §3.2, reglas 8 y 13 |
| **orden del nombre compuesto** | `clase`/`tipo` calificados por la entidad clasificada (`usuario_id` + `usuario_clase`) frente al orden `{entidad}_{atributo}` de los nombres de plantilla | §3.2, reglas 9 y 12 |
| **vocabulario de función: cerrado o abierto** | §3.3 lo presenta como **valores admitidos**; el `arquetipo` del catálogo es **texto abierto** por diseño, y la tensión no está resuelta | §3.3 · §5.2 |

---

## 9. Checklist antes de declarar que alimentaste o consultaste

- [ ] El **health** del canal responde `READY` (no estoy culpando al canal sin medirlo).
- [ ] Estoy en el carril correcto: **auditar** para consultar · **ejecutar** para alimentar (§4.2).
- [ ] Cada nombre que envié **existe**: la plantilla antes de materializar · el término antes de ligar.
- [ ] Cada **referencia directa** lleva `tabla_referencia`, y esa tabla **está materializada**.
- [ ] Cada campo **sin** `tabla_referencia` está en uno de estos tres casos, y sólo en estos: **clave propia**, **campo simple**, o **referencia no directa** derivada por §5.5.1 (clasificada, polimórfica o externa). *Corrección declarada:* la redacción anterior —«cada término que **no** es de referencia va **sin** `tabla_referencia`»— equiparaba «sin destino» con «no es referencia» y quedó retirada, porque obligaba a inventar un destino único para las otras tres o a dividir la identidad para poder declararlo.
- [ ] El `orden` es único y > 0 en la tabla.
- [ ] **Confirmé** las ligaduras (si no, la definición aparece vacía).
- [ ] Consulté la **definición efectiva** y verifiqué que salió completa y en orden.
- [ ] Ningún retiro se hizo sobre un término **en uso**.
- [ ] No inventé arquetipos, términos ni nombres fuera del canon: lo que faltaba lo **propuse por el canal**.

---

## 10. Frontera de este manual

Este manual gobierna **cómo se alimenta y cómo se consulta la Biblioteca SQL por su canal**. No gobierna: el comportamiento de la solución, la estructura de sus repositorios, la biblioteca de contratos (`query_contract_library`), el conocimiento de ingeniería (`query_knowledge`) ni el diseño de las librerías de código.

**Autoridad de la forma física:** la migración `075` y los **12 procedimientos `sp_biblioteca_*`** del esquema `grdcoder_biblioteca` que existen en el workspace —`catalogo_cargar` · `catalogo_listar` · `catalogo_retirar` · `diccionario_cargar` · `diccionario_listar` · `diccionario_retirar` · `campo_retirar` · `materializacion_listar` · `tabla_campo_ligar` · `tabla_campo_listar` · `tabla_retirar` · `inventario_resumen`—, nombrados en las migraciones `076`, `077`, `078` y `083`. Si este manual y la migración discrepasen, **manda la migración** — y la discrepancia se declara, no se resuelve en silencio. **Dos límites declarados:** la migración `075` **no está en este workspace**, así que la coautoridad de forma física que esta línea invoca se **cita, no se lee**; y el servicio de Operación tampoco está versionado aquí, de modo que **qué procedimiento respalda qué ruta no se verifica desde este repositorio**.
