export const URL_WS_PRODUCCION = 'wss://taller-3d-ws.victoriouswater-aacb8bb6.eastus.azurecontainerapps.io';
export const URL_WS_LOCAL = 'ws://localhost:8080';
export const TASA_ENVIO_HZ = 20;

/**
 * Resuelve la URL WebSocket según el hostname del entorno (local vs Azure producción).
 */
export function resolverUrlWebSocket(hostname) {
  const host = hostname !== undefined && hostname !== null
    ? String(hostname)
    : ((typeof window !== 'undefined' && window.location && window.location.hostname) || '');
  const esLocal = host === 'localhost' || host === '127.0.0.1';
  return esLocal ? URL_WS_LOCAL : URL_WS_PRODUCCION;
}

const esEntornoLocalInicial = typeof window !== 'undefined' &&
  window.location &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const CONFIG_RED = {
  urlWs: resolverUrlWebSocket(),
  urlWsLocal: URL_WS_LOCAL,
  urlWsProduccion: URL_WS_PRODUCCION,
  tasaEnvioHz: TASA_ENVIO_HZ,
  intervaloEnvioMs: 1000 / TASA_ENVIO_HZ,
  esLocal: Boolean(esEntornoLocalInicial),
  resolverUrlWebSocket
};
