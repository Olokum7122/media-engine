'use strict';

/**
 * serviceRegistry.js — Registro de servicios cliente del Media Engine
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      ATLX Media Engine — Multi-servicio
 * RESPONSABLE:  Registrar y resolver adaptadores específicos por servicio (sourceApp)
 *               Cada servicio (antojados, explorer, etc.) se registra con su
 *               propio conjunto de adaptadores.
 *
 * NO HACE:
 *   - No procesa media (lo hace mediaProcessorV3)
 *   - No expone endpoints HTTP (lo hace mediaRoutes)
 *   - No ejecuta workers (lo hace processingWorker)
 *   - No valida derechos (lo hace policyEvaluator)
 *
 * REGISTRO:
 *   registerService(sourceApp, adapters):
 *     Adapters disponibles:
 *       - channelProfileMapper  → resolveProfile(channel, mediaType, orientation)
 *       - mediaPackageMapper    → mapToGatewayFormat(enginePayload)
 *       - rightsDefaults        → defaultRights(mediaRequest)
 *       - processingHooks       → { beforeProcess, afterProcess }
 *
 *   Servicios built-in:
 *     - antojados (AntojadosMX — App Social + Negocios)
 *     - explorer (Explorer App — Descubrimiento de lugares)
 *     - generic  (Fallback para servicios no registrados)
 *
 * FLUJO:
 *   processingWorker.js:
 *     1. Obtiene mediaRequest.sourceApp
 *     2. serviceRegistry.getAdapters(sourceApp) → { channelProfileMapper, ... }
 *     3. Usa el mapper específico del servicio
 *
 * REFERENCIAS:
 *   - processingWorker.js → consulta serviceRegistry para resolver perfiles
 *   - mediaRoutes.js → podría usar serviceRegistry para validar sourceApp
 * ══════════════════════════════════════════════════════════════════════════════
 */

const registry = new Map();

/**
 * Registra un servicio con sus adaptadores.
 *
 * @param {string} sourceApp         - Identificador único del servicio
 * @param {object} adapters
 * @param {object} [adapters.channelProfileMapper]  - Resuelve perfil de procesamiento
 * @param {object} [adapters.mediaPackageMapper]    - Mapea engine → formato cliente
 * @param {object} [adapters.rightsDefaults]        - Valores por defecto de derechos
 * @param {object} [adapters.processingHooks]       - Hooks antes/después de procesar
 */
function registerService(sourceApp, adapters = {}) {
  if (!sourceApp || typeof sourceApp !== 'string') {
    throw new Error('serviceRegistry: sourceApp es requerido');
  }
  if (registry.has(sourceApp)) {
    console.warn(`[serviceRegistry] Sobrescribiendo servicio existente: ${sourceApp}`);
  }

  registry.set(sourceApp, {
    channelProfileMapper: adapters.channelProfileMapper || null,
    mediaPackageMapper: adapters.mediaPackageMapper || null,
    rightsDefaults: adapters.rightsDefaults || null,
    processingHooks: adapters.processingHooks || null,
    _registeredAt: new Date().toISOString(),
  });

  console.log(`[serviceRegistry] Servicio registrado: ${sourceApp}`);
}

/**
 * Obtiene los adaptadores de un servicio.
 *
 * @param {string} sourceApp
 * @returns {object|null} - Adaptadores o null si no existe
 */
function getAdapters(sourceApp) {
  if (!sourceApp) return registry.get('generic') || null;
  return registry.get(sourceApp) || registry.get('generic') || null;
}

/**
 * Obtiene el channelProfileMapper específico de un servicio.
 *
 * @param {string} sourceApp
 * @returns {function|null}
 */
function getChannelProfileMapper(sourceApp) {
  const svc = getAdapters(sourceApp);
  return svc?.channelProfileMapper || null;
}

/**
 * Obtiene el mediaPackageMapper específico de un servicio.
 *
 * @param {string} sourceApp
 * @returns {object|null}
 */
function getMediaPackageMapper(sourceApp) {
  const svc = getAdapters(sourceApp);
  return svc?.mediaPackageMapper || null;
}

/**
 * Lista todos los servicios registrados.
 *
 * @returns {Array<{sourceApp: string, adapters: string[]}>}
 */
function listServices() {
  const result = [];
  for (const [sourceApp, adapters] of registry.entries()) {
    const adapterNames = [];
    if (adapters.channelProfileMapper) adapterNames.push('channelProfileMapper');
    if (adapters.mediaPackageMapper) adapterNames.push('mediaPackageMapper');
    if (adapters.rightsDefaults) adapterNames.push('rightsDefaults');
    if (adapters.processingHooks) adapterNames.push('processingHooks');
    result.push({ sourceApp, adapters: adapterNames });
  }
  return result;
}

/**
 * Verifica si un servicio está registrado.
 *
 * @param {string} sourceApp
 * @returns {boolean}
 */
function hasService(sourceApp) {
  return registry.has(sourceApp);
}

module.exports = {
  registerService,
  getAdapters,
  getChannelProfileMapper,
  getMediaPackageMapper,
  listServices,
  hasService,
};
