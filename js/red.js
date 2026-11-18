import { CONFIG_RED } from './config.js';
import {
  estadoCarro,
  fisicaCarro,
  estadoCronometro,
  estadoRed,
  jugadoresRemotos
} from './estado.js';
import {
  grupoJuguete,
  ensamblarGrupoVehiculo,
  destruirVehiculoRemoto
} from './enganches.js';
import { liberarObjeto3D } from './recursos.js';

const WS_OPEN = 1;
const TIMEOUT_CONEXION_MS = 4500;

let socketActivo = null;
let acumuladorEnvio = 0;

function obtenerEscenaRaiz() {
  return (grupoJuguete && grupoJuguete.parent) || null;
}

function emitirEventoRed(nombre, detail = {}) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    const ev =
      typeof CustomEvent === 'function'
        ? new CustomEvent(nombre, { detail })
        : { type: nombre, detail };
    window.dispatchEvent(ev);
  }
}

function enviarMensaje(payload) {
  if (!socketActivo || socketActivo.readyState !== WS_OPEN) return false;
  try {
    socketActivo.send(JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

function deltaAngularCorto(objetivo, actual) {
  let diff = (objetivo - actual) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function construirRemotoDesdeDatos(datos) {
  const apariencia = datos.apariencia || {
    clase: 'coche',
    carroceria: 'carroceria_sedan',
    color: 0x0066ff,
    piezas: {}
  };
  const ensamblado = ensamblarGrupoVehiculo(apariencia);
  const escenaRaiz = obtenerEscenaRaiz();
  if (escenaRaiz && ensamblado.grupoRaiz) {
    escenaRaiz.add(ensamblado.grupoRaiz);
  }

  const slot = Number.isFinite(datos.slotParrilla) ? datos.slotParrilla : 0;
  const posIni = new THREE.Vector3(-1.8 - slot * 1.4, ensamblado.alturaPiso, 26.0 + (slot % 2 === 0 ? -0.9 : 0.9));
  ensamblado.grupoRaiz.position.copy(posIni);
  if (typeof datos.enPista === 'boolean') {
    ensamblado.grupoRaiz.visible = datos.enPista;
  }

  return {
    id: datos.id,
    apodo: datos.apodo || 'Rival',
    slotParrilla: slot,
    esAnfitrion: Boolean(datos.esAnfitrion),
    apariencia,
    grupoRaiz: ensamblado.grupoRaiz,
    pivotesRuedas: ensamblado.pivotesRuedas,
    helice: ensamblado.helice,
    timon: ensamblado.timon,
    alturaPiso: ensamblado.alturaPiso,
    posObjetivo: posIni.clone(),
    rotObjetivo: { yaw: 0, pitch: 0, roll: 0 },
    velActual: 0,
    anguloVolante: 0,
    rotacionRodadura: 0,
    derrapando: false,
    turbo: false,
    enPista: datos.enPista !== false,
    vuelta: datos.vuelta ?? 1,
    checkpointActual: datos.checkpointActual ?? 0,
    mejorVuelta: datos.mejorVuelta ?? null
  };
}

function registrarOActualizarRemoto(datos) {
  if (!datos || !datos.id || datos.id === estadoRed.miId) return null;
  const existente = jugadoresRemotos.get(datos.id);
  if (!existente) {
    const nuevo = construirRemotoDesdeDatos(datos);
    jugadoresRemotos.set(datos.id, nuevo);
    return nuevo;
  }

  if (datos.apodo) existente.apodo = datos.apodo;
  if (Number.isFinite(datos.slotParrilla)) existente.slotParrilla = datos.slotParrilla;
  if (typeof datos.esAnfitrion === 'boolean') existente.esAnfitrion = datos.esAnfitrion;
  if (typeof datos.enPista === 'boolean') {
    existente.enPista = datos.enPista;
    if (existente.grupoRaiz) existente.grupoRaiz.visible = datos.enPista;
  }

  if (datos.apariencia) {
    const posPrev = existente.grupoRaiz ? existente.grupoRaiz.position.clone() : existente.posObjetivo.clone();
    const rotPrev = existente.grupoRaiz
      ? { x: existente.grupoRaiz.rotation.x, y: existente.grupoRaiz.rotation.y, z: existente.grupoRaiz.rotation.z }
      : { x: 0, y: 0, z: 0 };

    if (existente.grupoRaiz) {
      if (existente.grupoRaiz.parent) {
        existente.grupoRaiz.parent.remove(existente.grupoRaiz);
      }
      liberarObjeto3D(existente.grupoRaiz);
    }

    const nuevoEnsamblado = ensamblarGrupoVehiculo(datos.apariencia);
    nuevoEnsamblado.grupoRaiz.position.copy(posPrev);
    nuevoEnsamblado.grupoRaiz.rotation.x = rotPrev.x;
    nuevoEnsamblado.grupoRaiz.rotation.y = rotPrev.y;
    nuevoEnsamblado.grupoRaiz.rotation.z = rotPrev.z;
    if (typeof existente.enPista === 'boolean') {
      nuevoEnsamblado.grupoRaiz.visible = existente.enPista;
    }

    const escenaRaiz = obtenerEscenaRaiz();
    if (escenaRaiz) {
      escenaRaiz.add(nuevoEnsamblado.grupoRaiz);
    }

    existente.apariencia = datos.apariencia;
    existente.grupoRaiz = nuevoEnsamblado.grupoRaiz;
    existente.pivotesRuedas = nuevoEnsamblado.pivotesRuedas;
    existente.helice = nuevoEnsamblado.helice;
    existente.timon = nuevoEnsamblado.timon;
    existente.alturaPiso = nuevoEnsamblado.alturaPiso;
  }

  return existente;
}

function conectarYEnviarInicial(mensajeInicial, urlPersonalizada = null) {
  salirDeSala();

  if (typeof WebSocket === 'undefined') {
    const err = { codigo: 'WS_NO_DISPONIBLE', mensaje: 'WebSocket no disponible en este entorno.' };
    emitirEventoRed('red:error', err);
    return Promise.resolve({ ok: false, ...err });
  }

  const url = urlPersonalizada || CONFIG_RED.urlWs;
  return new Promise((resolve) => {
    let finalizado = false;
    let timer = null;

    const concluir = (resultado) => {
      if (finalizado) return;
      finalizado = true;
      if (timer) clearTimeout(timer);
      resolve(resultado);
    };

    try {
      const ws = new WebSocket(url);
      socketActivo = ws;

      timer = setTimeout(() => {
        if (ws.readyState !== WS_OPEN) {
          try {
            ws.close();
          } catch (e) {
            // Ignora error al cerrar timeout
          }
          if (socketActivo === ws) socketActivo = null;
          const err = { codigo: 'TIMEOUT_CONEXION', mensaje: 'Tiempo de espera agotado al conectar con el servidor.' };
          emitirEventoRed('red:error', err);
          concluir({ ok: false, ...err });
        }
      }, TIMEOUT_CONEXION_MS);

      ws.addEventListener('open', () => {
        if (socketActivo !== ws) {
          try {
            ws.close();
          } catch (e) {
            // Cierre preventivo
          }
          concluir({ ok: false, codigo: 'CANCELADO', mensaje: 'Conexión reemplazada.' });
          return;
        }
        enviarMensaje(mensajeInicial);
        concluir({ ok: true });
      });

      ws.addEventListener('message', (evento) => {
        try {
          const msg = JSON.parse(String(evento.data));
          procesarMensajeRed(msg);
        } catch (e) {
          // Ignora tramas malformadas
        }
      });

      ws.addEventListener('error', () => {
        const err = { codigo: 'ERROR_CONEXION', mensaje: 'No se pudo conectar al servidor multijugador. Continúa en modo Solo.' };
        emitirEventoRed('red:error', err);
        if (!finalizado) {
          if (socketActivo === ws) socketActivo = null;
          concluir({ ok: false, ...err });
        }
      });

      ws.addEventListener('close', () => {
        if (socketActivo === ws) {
          socketActivo = null;
          if (estadoRed.conectado) {
            limpiarEstadoYSalaLocal();
            emitirEventoRed('red:error', {
              codigo: 'DESCONECTADO',
              mensaje: 'Conexión cerrada con el servidor multijugador.'
            });
          }
        }
      });
    } catch (e) {
      socketActivo = null;
      const err = { codigo: 'ERROR_WS', mensaje: e && e.message ? e.message : 'Fallo al iniciar WebSocket.' };
      emitirEventoRed('red:error', err);
      concluir({ ok: false, ...err });
    }
  });
}

function limpiarEstadoYSalaLocal() {
  Array.from(jugadoresRemotos.keys()).forEach((id) => {
    destruirVehiculoRemoto(id);
  });
  estadoRed.conectado = false;
  estadoRed.modo = 'solo';
  estadoRed.codigoSala = null;
  estadoRed.esAnfitrion = false;
  estadoRed.miId = null;
  estadoRed.slotParrilla = 0;
  acumuladorEnvio = 0;
  emitirEventoRed('red:sala_actualizada', {
    estadoRed: { ...estadoRed },
    jugadores: []
  });
}

/**
 * Empaqueta la configuración visual actual del vehículo local para compartir en red.
 */
export function obtenerAparienciaLocal() {
  return {
    clase: estadoCarro.claseVehiculo,
    carroceria: estadoCarro.idCarroceria,
    color: estadoCarro.colorHex,
    piezas: { ...estadoCarro.piezasEnEnganches }
  };
}

/**
 * Conecta al servidor WebSocket y solicita crear una nueva sala online.
 */
export function crearSalaOnline(apodo = estadoRed.apodo, habitacionId = estadoCarro.idHabitacion, urlOpcional = null) {
  const apodoLimpio = String(apodo || 'Piloto').trim().slice(0, 24) || 'Piloto';
  estadoRed.apodo = apodoLimpio;
  return conectarYEnviarInicial(
    {
      tipo: 'crear_sala',
      apodo: apodoLimpio,
      habitacionId,
      apariencia: obtenerAparienciaLocal(),
      enPista: estadoCarro.modoJuego === 'conduccion'
    },
    urlOpcional
  );
}

/**
 * Conecta al servidor WebSocket y se une a una sala existente por código de 4 caracteres.
 */
export function unirseSalaOnline(codigoSala, apodo = estadoRed.apodo, urlOpcional = null) {
  const codigo = String(codigoSala || '').trim().toUpperCase();
  const apodoLimpio = String(apodo || 'Piloto').trim().slice(0, 24) || 'Piloto';
  estadoRed.apodo = apodoLimpio;
  return conectarYEnviarInicial(
    {
      tipo: 'unirse_sala',
      codigoSala: codigo,
      apodo: apodoLimpio,
      apariencia: obtenerAparienciaLocal(),
      enPista: estadoCarro.modoJuego === 'conduccion'
    },
    urlOpcional
  );
}

/**
 * Cierra la conexión WebSocket, destruye los vehículos remotos y vuelve a modo 'solo'.
 */
export function salirDeSala() {
  if (socketActivo) {
    const ws = socketActivo;
    socketActivo = null;
    if (ws.readyState === WS_OPEN) {
      try {
        ws.send(JSON.stringify({ tipo: 'salir_sala' }));
      } catch (e) {
        // Ignora fallo al despedir
      }
    }
    try {
      ws.close();
    } catch (e) {
      // Ignora cierre previo
    }
  }
  limpiarEstadoYSalaLocal();
}

/**
 * Envía la apariencia actual del vehículo y si se encuentra en pista o en el taller.
 */
export function enviarApariencia(enPista = estadoCarro.modoJuego === 'conduccion') {
  if (!estadoRed.conectado || estadoRed.modo === 'solo') return false;
  return enviarMensaje({
    tipo: 'apariencia',
    apariencia: obtenerAparienciaLocal(),
    enPista: Boolean(enPista)
  });
}

/**
 * Solicita cambio de habitación para toda la sala si el jugador local es anfitrión.
 */
export function notificarCambioHabitacion(habitacionId = estadoCarro.idHabitacion) {
  if (!estadoRed.conectado || !estadoRed.esAnfitrion) return false;
  return enviarMensaje({
    tipo: 'cambiar_habitacion',
    habitacionId
  });
}

/**
 * Procesa mensajes JSON entrantes del servidor de salas y sincroniza jugadoresRemotos.
 */
export function procesarMensajeRed(msg) {
  if (!msg || typeof msg.tipo !== 'string') return;

  if (msg.tipo === 'sala_creada' || msg.tipo === 'sala_unida') {
    estadoRed.conectado = true;
    estadoRed.modo = 'online';
    estadoRed.codigoSala = msg.codigoSala || null;
    estadoRed.esAnfitrion = Boolean(msg.esAnfitrion);
    estadoRed.miId = msg.miId || null;
    estadoRed.slotParrilla = Number.isFinite(msg.slotParrilla) ? msg.slotParrilla : 0;

    if (msg.tipo === 'sala_unida') {
      Array.from(jugadoresRemotos.keys()).forEach((id) => {
        destruirVehiculoRemoto(id);
      });
      if (Array.isArray(msg.jugadores)) {
        msg.jugadores.forEach((j) => {
          if (j.id !== estadoRed.miId) registrarOActualizarRemoto(j);
        });
      }
      if (msg.habitacionId) {
        emitirEventoRed('red:cambiar_habitacion', { habitacionId: msg.habitacionId });
      }
    }

    emitirEventoRed('red:sala_actualizada', {
      estadoRed: { ...estadoRed },
      jugadores: Array.isArray(msg.jugadores) ? msg.jugadores : []
    });
    return;
  }

  if (msg.tipo === 'jugador_entro') {
    if (msg.jugador) {
      registrarOActualizarRemoto(msg.jugador);
    }
    emitirEventoRed('red:sala_actualizada', { estadoRed: { ...estadoRed } });
    return;
  }

  if (msg.tipo === 'jugador_salio') {
    if (msg.id) {
      destruirVehiculoRemoto(msg.id);
    }
    if (msg.nuevoAnfitrionId) {
      estadoRed.esAnfitrion = msg.nuevoAnfitrionId === estadoRed.miId;
      for (const rem of jugadoresRemotos.values()) {
        rem.esAnfitrion = rem.id === msg.nuevoAnfitrionId;
      }
    }
    emitirEventoRed('red:sala_actualizada', { estadoRed: { ...estadoRed } });
    return;
  }

  if (msg.tipo === 'habitacion_cambiada') {
    if (msg.habitacionId) {
      emitirEventoRed('red:cambiar_habitacion', { habitacionId: msg.habitacionId });
    }
    emitirEventoRed('red:sala_actualizada', { estadoRed: { ...estadoRed } });
    return;
  }

  if (msg.tipo === 'apariencia_actualizada') {
    if (msg.id && msg.id !== estadoRed.miId) {
      registrarOActualizarRemoto(msg);
      emitirEventoRed('red:sala_actualizada', { estadoRed: { ...estadoRed } });
    }
    return;
  }

  if (msg.tipo === 'telemetria') {
    if (!msg.id || msg.id === estadoRed.miId) return;
    const rem = jugadoresRemotos.get(msg.id);
    if (!rem) return;

    rem.posObjetivo.set(msg.x ?? rem.posObjetivo.x, msg.y ?? rem.posObjetivo.y, msg.z ?? rem.posObjetivo.z);
    rem.rotObjetivo.yaw = msg.yaw ?? rem.rotObjetivo.yaw;
    rem.rotObjetivo.pitch = msg.pitch ?? 0;
    rem.rotObjetivo.roll = msg.roll ?? 0;
    rem.velActual = msg.velocidad ?? 0;
    rem.anguloVolante = msg.anguloVolante ?? 0;
    rem.derrapando = Boolean(msg.derrapando);
    rem.turbo = Boolean(msg.turbo);
    if (typeof msg.enPista === 'boolean') {
      rem.enPista = msg.enPista;
      if (rem.grupoRaiz) rem.grupoRaiz.visible = msg.enPista;
    }
    if (typeof msg.vuelta === 'number') rem.vuelta = msg.vuelta;
    if (typeof msg.checkpointActual === 'number') rem.checkpointActual = msg.checkpointActual;
    if (msg.mejorVuelta !== undefined) rem.mejorVuelta = msg.mejorVuelta;
    return;
  }

  if (msg.tipo === 'error') {
    emitirEventoRed('red:error', {
      codigo: msg.codigo || 'ERROR_RED',
      mensaje: msg.mensaje || 'Error de sala multijugador.'
    });
  }
}

/**
 * Interpola los vehículos remotos y regula el envío de telemetría local a CONFIG_RED.tasaEnvioHz (20 Hz).
 */
export function actualizarRed(dt, transportPersonalizado = null) {
  const factorPos = Math.min(1, dt * 14);
  const factorRot = Math.min(1, dt * 14);

  for (const rem of jugadoresRemotos.values()) {
    if (!rem.grupoRaiz) continue;
    const pos = rem.grupoRaiz.position;
    pos.x += (rem.posObjetivo.x - pos.x) * factorPos;
    pos.y += (rem.posObjetivo.y - pos.y) * factorPos;
    pos.z += (rem.posObjetivo.z - pos.z) * factorPos;

    rem.grupoRaiz.rotation.y += deltaAngularCorto(rem.rotObjetivo.yaw, rem.grupoRaiz.rotation.y) * factorRot;
    rem.grupoRaiz.rotation.z += (rem.rotObjetivo.pitch - rem.grupoRaiz.rotation.z) * factorRot;
    rem.grupoRaiz.rotation.x += (rem.rotObjetivo.roll - rem.grupoRaiz.rotation.x) * factorRot;

    rem.rotacionRodadura += (rem.velActual * dt) / 0.175;
    if (Array.isArray(rem.pivotesRuedas)) {
      for (let i = 0; i < rem.pivotesRuedas.length; i++) {
        const nodo = rem.pivotesRuedas[i];
        const def = nodo.definicion || {};
        if (nodo.grupoContenedor) {
          nodo.grupoContenedor.rotation.y = (nodo.rotacionBaseY || 0) + (def.esDelantera ? rem.anguloVolante : 0);
        }
        if (nodo.mallaPieza) {
          nodo.mallaPieza.rotation.z = -rem.rotacionRodadura * (def.lado || 1);
        }
      }
    }
    if (rem.helice) {
      rem.helice.rotation.z += (Math.abs(rem.velActual) * 3.0 + 6.0) * dt;
    }
    if (rem.timon) {
      rem.timon.rotation.y = -rem.anguloVolante * 0.9;
    }
  }

  if (!estadoRed.conectado || estadoRed.modo === 'solo' || estadoCarro.modoJuego !== 'conduccion') {
    return false;
  }

  const intervalo = 1 / (CONFIG_RED.tasaEnvioHz || 20);
  acumuladorEnvio += dt;
  if (acumuladorEnvio < intervalo) return false;
  acumuladorEnvio = Math.min(intervalo * 0.5, acumuladorEnvio - intervalo);

  const paquete = {
    tipo: 'telemetria',
    x: +fisicaCarro.x.toFixed(3),
    y: +fisicaCarro.y.toFixed(3),
    z: +fisicaCarro.z.toFixed(3),
    yaw: +fisicaCarro.yaw.toFixed(4),
    pitch: +fisicaCarro.pitch.toFixed(4),
    roll: +fisicaCarro.roll.toFixed(4),
    velocidad: +fisicaCarro.velocidad.toFixed(3),
    anguloVolante: +fisicaCarro.anguloVolante.toFixed(4),
    derrapando: Boolean(fisicaCarro.derrapando),
    turbo: fisicaCarro.tiempoTurbo > 0 || fisicaCarro.tiempoMiniTurbo > 0,
    enPista: true,
    vuelta: 1,
    checkpointActual: estadoCronometro.checkpointActual,
    mejorVuelta: estadoCronometro.mejorVuelta
  };

  if (typeof transportPersonalizado === 'function') {
    transportPersonalizado(paquete);
    return true;
  }
  return enviarMensaje(paquete);
}
