/**
 * Verificación del motor: ciclo funcional COMPLETO dentro de una transacción
 * que se REVIERTE (no deja datos de prueba).
 *
 * Cadena declarada del ciclo:
 *   ACTIVO      registrar_activo_media        (idempotente por origen_media_id)
 *     → SOLICITUD registrar_solicitud_media   (ligada por media_id)
 *       → EJECUCIÓN encolar → reclamar → cerrar
 *         → PRODUCTOS variante / superposición / derivación / derechos / evento
 *
 * Ejercita los 18 procedimientos de medios_operacion.
 * Las afirmaciones se leen de las TABLAS (no de la forma del recordset).
 * Uso: node scripts/_verificar-media-engine-v2.mjs
 */
import sql from 'mssql';

const base = {
  server: '185.187.235.253', port: 1433, user: 'sa', password: 'Olokum681228$',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 15000 },
  connectionTimeout: 20000, requestTimeout: 120000,
};

const pool = await new sql.ConnectionPool({ ...base, database: 'Atlx_Media_Engine' }).connect();

const sps = await pool.request().query(`
  SELECT p.name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id = p.schema_id
  WHERE s.name = 'medios_operacion' ORDER BY p.name`);
console.log(`SPs en medios_operacion: ${sps.recordset.length}`);
console.log(`  ${sps.recordset.map(r => r.name).join('\n  ')}`);

for (const t of ['estados_media', 'estados_solicitud_media']) {
  const v = await pool.request().query(`SELECT codigo, es_terminal FROM medios_operacion.${t} ORDER BY codigo`);
  console.log(`${t}: ${v.recordset.length} fila(s) → ${v.recordset.map(r => r.codigo + (r.es_terminal ? '*' : '')).join(', ')}`);
}

const ux = await pool.request().query(`
  SELECT i.name, OBJECT_NAME(i.object_id) tabla, i.has_filter, i.filter_definition
  FROM sys.indexes i
  WHERE i.object_id IN (SELECT object_id FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
                        WHERE s.name = 'medios_operacion')
    AND i.is_unique = 1 AND i.is_primary_key = 0
  ORDER BY i.name`);
console.log(`Índices únicos no-PK: ${ux.recordset.map(r => `${r.name}(${r.tabla}${r.has_filter ? ', filtrado' : ''})`).join(', ') || '(ninguno)'}`);

const tx = new sql.Transaction(pool);
await tx.begin();
const run = (sqlText, bind) => {
  const req = new sql.Request(tx);
  for (const [k, v, t] of bind || []) req.input(k, t, v);
  return req.query(sqlText);
};
const uno = r => (r.recordset && r.recordset[0]) || {};

try {
  const cliente = '11111111-1111-1111-1111-111111111111';
  await run(`IF NOT EXISTS (SELECT 1 FROM medios_operacion.clientes_integracion WHERE cliente_integracion_id=@c)
             INSERT INTO medios_operacion.clientes_integracion
               (cliente_integracion_id, nombre, ecosistema, estado_registro)
             VALUES (@c, N'Streaming Live Engine', N'atlx', N'activo')`,
    [['c', cliente, sql.UniqueIdentifier]]);

  /* ---- 1. ACTIVO: alta idempotente por origen_media_id -------------------- */
  const a = await run(`EXEC medios_operacion.registrar_activo_media
      @media_clase=@cl, @politica_conservacion=@pol, @cliente_integracion_id=@c,
      @contenido_tipo=@ct, @archivo_url=@url, @archivo_nombre=@nom,
      @duracion=@dur, @peso=@peso, @origen_media_id=@om`,
    [['cl', 'video', sql.NVarChar(40)], ['pol', 'conservar_original', sql.NVarChar(40)],
     ['c', cliente, sql.UniqueIdentifier], ['ct', 'video/mp4', sql.NVarChar(120)],
     ['url', 'https://media.atlx.test/v2/grabacion-001.mp4', sql.NVarChar(600)],
     ['nom', 'grabacion-001.mp4', sql.NVarChar(260)],
     ['dur', 5400, sql.Int], ['peso', 3221225472, sql.BigInt],
     ['om', 'grab-001', sql.NVarChar(200)]]);
  const mediaId = uno(a).media_id;
  console.log(`1. registrar_activo_media → estado=${uno(a).estado_media}, duracion=${uno(a).duracion}s, peso=${uno(a).peso}, origen=${uno(a).origen_media_id}`);

  /* ---- 1b. PROCEDENCIA del activo (cierre del hueco §28.7) --------------- */
  const o1 = await run(`EXEC medios_operacion.registrar_origen_media
      @media_id=@m, @origen_clase=@oc, @origen_plataforma=@op,
      @origen_contenido_id=@oi, @origen_url=@ou`,
    [['m', mediaId, sql.UniqueIdentifier], ['oc', 'transmision_live', sql.NVarChar(40)],
     ['op', 'Streaming Live Engine', sql.NVarChar(60)], ['oi', 'grab-001', sql.NVarChar(128)],
     ['ou', 'https://motor.atlx.test/grabaciones/grab-001.mp4', sql.NVarChar(1200)]]);
  console.log(`1b. registrar_origen_media → clase=${uno(o1).origen_clase}, plataforma=${uno(o1).origen_plataforma}, contenido=${uno(o1).origen_contenido_id}`);

  const o2 = await run(`EXEC medios_operacion.registrar_origen_media
      @media_id=@m, @origen_clase=@oc, @origen_plataforma=@op, @origen_contenido_id=@oi`,
    [['m', mediaId, sql.UniqueIdentifier], ['oc', 'transmision_live', sql.NVarChar(40)],
     ['op', 'Streaming Live Engine', sql.NVarChar(60)], ['oi', 'grab-001', sql.NVarChar(128)]]);
  const oCount = uno(await run(`SELECT COUNT(*) filas FROM medios_operacion.medios_origenes WHERE media_id=@m`,
    [['m', mediaId, sql.UniqueIdentifier]]));
  console.log(`1c. idempotencia de la procedencia → misma fila=${uno(o2).media_origen_id === uno(o1).media_origen_id}, filas=${oCount.filas}`);

  /* ---- 2. RESOLUTOR de idempotencia por el activo en origen -------------- */
  const r = await run(`EXEC medios_operacion.resolver_activo_por_origen
      @cliente_integracion_id=@c, @origen_media_id=@om`,
    [['c', cliente, sql.UniqueIdentifier], ['om', 'grab-001', sql.NVarChar(200)]]);
  console.log(`2. resolver_activo_por_origen → coincide=${uno(r).media_id === mediaId}`);

  /* ---- 3. SOLICITUD ligada al activo ------------------------------------ */
  const s = await run(`EXEC medios_operacion.registrar_solicitud_media
      @cliente_integracion_id=@c, @media_clase=@cl, @solicitud_origen_id=@so,
      @perfil_procesamiento=@pp, @media_id=@m`,
    [['c', cliente, sql.UniqueIdentifier], ['cl', 'video', sql.NVarChar(40)],
     ['so', 'handoff-9', sql.NVarChar(200)], ['pp', 'video_largo', sql.NVarChar(80)],
     ['m', mediaId, sql.UniqueIdentifier]]);
  const solicitudId = uno(s).solicitud_media_id;
  console.log(`3. registrar_solicitud_media → estado=${uno(s).estado_solicitud_media}, ligada al activo=${uno(s).media_id === mediaId}`);

  const s2 = await run(`EXEC medios_operacion.registrar_solicitud_media
      @cliente_integracion_id=@c, @media_clase=@cl, @solicitud_origen_id=@so,
      @perfil_procesamiento=@pp, @media_id=@m`,
    [['c', cliente, sql.UniqueIdentifier], ['cl', 'video', sql.NVarChar(40)],
     ['so', 'handoff-9', sql.NVarChar(200)], ['pp', 'video_largo', sql.NVarChar(80)],
     ['m', mediaId, sql.UniqueIdentifier]]);
  console.log(`4. idempotencia de la solicitud → misma=${uno(s2).solicitud_media_id === solicitudId}`);

  /* ---- 4. EJECUCIÓN: encolar, reclamar ---------------------------------- */
  await run(`EXEC medios_operacion.encolar_ejecucion_media
      @solicitud_media_id=@s, @ejecucion_modo=@modo, @prioridad=1`,
    [['s', solicitudId, sql.UniqueIdentifier], ['modo', 'procesamiento', sql.NVarChar(40)]]);
  const eRow = uno(await run(`SELECT TOP 1 ejecucion_id, estado_ejecucion, media_id
                              FROM medios_operacion.ejecuciones_media
                              WHERE solicitud_media_id=@s ORDER BY creado_en DESC`,
    [['s', solicitudId, sql.UniqueIdentifier]]));
  const ejecucionId = eRow.ejecucion_id;
  console.log(`5. encolar_ejecucion_media → estado=${eRow.estado_ejecucion}, hereda el activo=${eRow.media_id === mediaId}`);

  await run(`EXEC medios_operacion.reclamar_ejecucion_media`);
  const eRec = uno(await run(`SELECT estado_ejecucion, intentos FROM medios_operacion.ejecuciones_media WHERE ejecucion_id=@e`,
    [['e', ejecucionId, sql.UniqueIdentifier]]));
  const blq = await run(`SELECT estado_registro FROM medios_operacion.bloqueos_control WHERE objeto_referencia=@e`,
    [['e', ejecucionId, sql.NVarChar(64)]]);
  console.log(`6. reclamar_ejecucion_media → estado=${eRec.estado_ejecucion}, intentos=${eRec.intentos}, bloqueo=${blq.recordset.map(x => x.estado_registro).join(',') || '(ninguno)'}`);

  /* ---- 5. PRODUCTOS ------------------------------------------------------ */
  const v = await run(`EXEC medios_operacion.registrar_variante_media
      @media_id=@m, @variante_clase=@vc, @archivo_url=@url, @contenido_tipo=@ct,
      @ancho=1280, @alto=720, @duracion=5400, @peso=805306368,
      @proporcion='16:9', @perfil_procesamiento=@pp, @es_predeterminado=1`,
    [['m', mediaId, sql.UniqueIdentifier], ['vc', 'video_720', sql.NVarChar(60)],
     ['url', 'https://media.atlx.test/v2/grabacion-001-720.mp4', sql.NVarChar(600)],
     ['ct', 'video/mp4', sql.NVarChar(120)], ['pp', 'video_largo', sql.NVarChar(80)]]);
  const varianteId = uno(v).media_variante_id;
  console.log(`7. registrar_variante_media → clase=${uno(v).variante_clase}, predeterminada=${uno(v).es_predeterminado}`);

  const v2 = await run(`EXEC medios_operacion.registrar_variante_media
      @media_id=@m, @variante_clase=@vc, @archivo_url=@url, @contenido_tipo=@ct,
      @ancho=1280, @alto=720, @duracion=5400, @peso=805306368,
      @proporcion='16:9', @perfil_procesamiento=@pp, @es_predeterminado=1`,
    [['m', mediaId, sql.UniqueIdentifier], ['vc', 'video_720', sql.NVarChar(60)],
     ['url', 'https://media.atlx.test/v2/grabacion-001-720.mp4', sql.NVarChar(600)],
     ['ct', 'video/mp4', sql.NVarChar(120)], ['pp', 'video_largo', sql.NVarChar(80)]]);
  const vCount = uno(await run(`SELECT COUNT(*) filas FROM medios_operacion.medios_variantes WHERE media_id=@m AND variante_clase=@vc`,
    [['m', mediaId, sql.UniqueIdentifier], ['vc', 'video_720', sql.NVarChar(60)]]));
  console.log(`7b. clave de la variante → misma fila=${uno(v2).media_variante_id === varianteId}, filas de la clase=${vCount.filas}`);

  const sp2 = await run(`EXEC medios_operacion.registrar_superposicion_media
      @media_id=@m, @media_variante_id=@v, @texto=@tx, @posicion=@po, @opacidad=@op`,
    [['m', mediaId, sql.UniqueIdentifier], ['v', varianteId, sql.UniqueIdentifier],
     ['tx', 'ATLX', sql.NVarChar(200)], ['po', 'inferior_derecha', sql.NVarChar(40)],
     ['op', 0.65, sql.Decimal(4, 2)]]);
  console.log(`8. registrar_superposicion_media → texto=${uno(sp2).texto}, posicion=${uno(sp2).posicion}, opacidad=${uno(sp2).opacidad}`);

  const clip = await run(`EXEC medios_operacion.registrar_activo_media
      @media_clase=@cl, @politica_conservacion=@pol, @cliente_integracion_id=@c,
      @contenido_tipo=@ct, @archivo_url=@url, @duracion=@dur, @peso=@peso`,
    [['cl', 'video', sql.NVarChar(40)], ['pol', 'conservar_original', sql.NVarChar(40)],
     ['c', cliente, sql.UniqueIdentifier], ['ct', 'video/mp4', sql.NVarChar(120)],
     ['url', 'https://media.atlx.test/v2/clip-001.mp4', sql.NVarChar(600)],
     ['dur', 45, sql.Int], ['peso', 12582912, sql.BigInt]]);
  const clipId = uno(clip).media_id;

  const d = await run(`EXEC medios_operacion.registrar_derivacion_media @media_id=@m, @media_padre_id=@p`,
    [['m', clipId, sql.UniqueIdentifier], ['p', mediaId, sql.UniqueIdentifier]]);
  console.log(`9. registrar_derivacion_media → filas=${d.recordset?.length ?? 0} (derivado propio=${clipId !== mediaId})`);

  const dr = await run(`EXEC medios_operacion.registrar_derechos_media
      @media_id=@m, @titularidad_clase=@tc, @derechos_declaracion=@dd, @estado_derechos=@ed,
      @licencia_clase=@lc, @licencia_alcance=@la,
      @permitido_mostrar=1, @permitido_descargar=1, @permitido_compartir=0, @permitido_remezclar=0`,
    [['m', mediaId, sql.UniqueIdentifier], ['tc', 'propia', sql.NVarChar(60)],
     ['dd', 'declarados', sql.NVarChar(60)], ['ed', 'vigente', sql.NVarChar(40)],
     ['lc', 'exclusiva', sql.NVarChar(60)], ['la', 'atlx', sql.NVarChar(60)]]);
  console.log(`10. registrar_derechos_media → estado=${uno(dr).estado_derechos}, mostrar=${uno(dr).permitido_mostrar}`);

  const dc = uno(await run(`EXEC medios_operacion.consultar_derechos_media @media_id=@m`,
    [['m', mediaId, sql.UniqueIdentifier]]));
  console.log(`11. consultar_derechos_media → estado=${dc.estado_derechos}, remezclar=${dc.permitido_remezclar}`);

  const evMostrar = uno(await run(`EXEC medios_operacion.evaluar_derechos_media @media_id=@m, @accion=@a`,
    [['m', mediaId, sql.UniqueIdentifier], ['a', 'mostrar', sql.NVarChar(40)]]));
  const evRem = uno(await run(`EXEC medios_operacion.evaluar_derechos_media @media_id=@m, @accion=@a`,
    [['m', mediaId, sql.UniqueIdentifier], ['a', 'remezclar', sql.NVarChar(40)]]));
  console.log(`12. evaluar_derechos_media → mostrar=${evMostrar.permitido}, remezclar=${evRem.permitido}`);

  const ev = await run(`EXEC medios_operacion.emitir_evento_media
      @evento_tipo=@t, @media_id=@m, @ejecucion_id=@e`,
    [['t', 'procesamiento_terminado', sql.NVarChar(60)], ['m', mediaId, sql.UniqueIdentifier],
     ['e', ejecucionId, sql.UniqueIdentifier]]);
  console.log(`13. emitir_evento_media → tipo=${uno(ev).evento_tipo ?? '(evento)'}`);

  /* ---- 6. CIERRE y estado resultante del activo y de la solicitud -------- */
  await run(`EXEC medios_operacion.cerrar_ejecucion_media
      @ejecucion_id=@e, @estado_ejecucion=@st`,
    [['e', ejecucionId, sql.UniqueIdentifier], ['st', 'terminada', sql.NVarChar(40)]]);

  const cierre = uno(await run(`SELECT
      (SELECT estado_ejecucion FROM medios_operacion.ejecuciones_media WHERE ejecucion_id=@e) estado_ejecucion,
      (SELECT estado_solicitud_media FROM medios_operacion.solicitudes_medios WHERE solicitud_media_id=@s) estado_solicitud_media,
      (SELECT estado_media FROM medios_operacion.medios_control WHERE media_id=@m) estado_media`,
    [['e', ejecucionId, sql.UniqueIdentifier], ['s', solicitudId, sql.UniqueIdentifier],
     ['m', mediaId, sql.UniqueIdentifier]]));
  console.log(`14. cerrar_ejecucion_media → ejecucion=${cierre.estado_ejecucion}, solicitud=${cierre.estado_solicitud_media}, activo=${cierre.estado_media} (disponible=${cierre.estado_media === 'disponible'})`);

  /* ---- 7. CONSULTAS del ciclo ------------------------------------------- */
  const cs = await run(`EXEC medios_operacion.consultar_solicitud_media @solicitud_media_id=@s`,
    [['s', solicitudId, sql.UniqueIdentifier]]);
  console.log(`15. consultar_solicitud_media → resultados=${cs.recordsets?.map(x => x.length).join('/') ?? 1}, estado=${uno(cs).estado_solicitud_media}`);

  const ca = await run(`EXEC medios_operacion.consultar_activo_media @media_id=@m`,
    [['m', mediaId, sql.UniqueIdentifier]]);
  console.log(`16. consultar_activo_media → resultados=${ca.recordsets?.map(x => x.length).join('/') ?? 1}`);

  const la = await run(`EXEC medios_operacion.listar_activos_media @cliente_integracion_id=@c, @media_clase=@cl`,
    [['c', cliente, sql.UniqueIdentifier], ['cl', 'video', sql.NVarChar(40)]]);
  console.log(`17. listar_activos_media → ${la.recordset?.length ?? 0} activo(s) del cliente`);

  /* ---- 8. Invariantes --------------------------------------------------- */
  const inv = uno(await run(`SELECT
      (SELECT COUNT(*) FROM medios_operacion.medios_variantes WHERE media_id=@m AND variante_clase='video_720') variantes_clase,
      (SELECT COUNT(*) FROM medios_operacion.medios_origenes WHERE media_id=@m) origenes,
      (SELECT COUNT(*) FROM medios_operacion.medios_superposiciones WHERE media_id=@m) superposiciones,
      (SELECT COUNT(*) FROM medios_operacion.medios_derivaciones WHERE media_padre_id=@m) derivaciones,
      (SELECT COUNT(*) FROM medios_operacion.medios_eventos WHERE media_id=@m) eventos,
      (SELECT COUNT(*) FROM medios_operacion.medios_control WHERE media_id=@d AND origen_media_id IS NULL) clip_sin_origen`,
    [['m', mediaId, sql.UniqueIdentifier], ['d', clipId, sql.UniqueIdentifier]]));
  console.log(`invariantes → variantes(video_720)=${inv.variantes_clase}, origenes=${inv.origenes}, superposiciones=${inv.superposiciones}, derivaciones=${inv.derivaciones}, eventos=${inv.eventos}, clip_sin_origen=${inv.clip_sin_origen}`);

  const cn = await run(`EXEC medios_operacion.cancelar_solicitud_media @solicitud_media_id=@s`,
    [['s', solicitudId, sql.UniqueIdentifier]]);
  console.log(`cancelar_solicitud_media → estado=${uno(cn).estado_solicitud_media} (ya completada: no retrocede)`);

  const blq2 = await run(`SELECT estado_registro FROM medios_operacion.bloqueos_control WHERE objeto_referencia=@e`,
    [['e', ejecucionId, sql.NVarChar(64)]]);
  console.log(`bloqueos_control tras el cierre → ${blq2.recordset.map(x => x.estado_registro).join(', ') || '(ninguno)'}`);
} finally {
  await tx.rollback();
  console.log('\nTransacción revertida: sin datos de prueba persistidos.');
}

const chk = await pool.request().query(`
  SELECT (SELECT COUNT(*) FROM medios_operacion.medios_control) medios,
         (SELECT COUNT(*) FROM medios_operacion.solicitudes_medios) solicitudes,
         (SELECT COUNT(*) FROM medios_operacion.clientes_integracion) clientes`);
console.log(`Residuo tras rollback → medios=${chk.recordset[0].medios}, solicitudes=${chk.recordset[0].solicitudes}, clientes=${chk.recordset[0].clientes}`);

await pool.close();
