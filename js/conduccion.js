import { CATALOGO_HABITACIONES } from './constantes.js';
import {
  estadoCarro,
  fisicaCarro,
  teclasConduccion,
  mallasSuperficieConducible,
  obstaculosHabitacion,
  nodosEnganches,
  plataformasTurbo,
  obstaculosDinamicos,
  obstaculosMoviles,
  trampasPista,
  estadoCronometro,
  checkpointsPista,
  obtenerClaveRecord
} from './estado.js';
import { camara, controles } from './escenario.js';
import { TABLA_CARROCERIAS, obtenerAtributosFinalesVehiculo } from './catalogoPiezas.js';
import { grupoJuguete, dispararChispasEnEnganche } from './enganches.js';
import {
  actualizarAudioMotor,
  actualizarAudioDerrape,
  reproducirTurbo,
  reproducirImpacto,
  reproducirCheckpoint,
  reproducirMeta
} from './audio.js';

const raycasterSuelo = new THREE.Raycaster();
const vectorAbajo = new THREE.Vector3(0, -1, 0);
let acumuladorChispasDerrape = 0;
let enPistaActual = true;
let tipoSuperficieActual = 'pista_asfalto';
let temporizadorVibracionAudio = 0;
let ultimoPitchTerreno = 0;
let tiempoHidrodinamico = 0;
let tipoTrampaActiva = null;

function calcularFactorAfinidadMedio(claseVehiculo, tipoSuperficie, enAire, idHabitacion) {
  if (claseVehiculo === 'barco' && !enAire && tipoSuperficie === 'agua_navegable') return 1.06;
  if (claseVehiculo === 'moto' && !enAire && tipoSuperficie === 'pista_tierra') return 1.06;
  if (claseVehiculo === 'avion' && enAire && idHabitacion === 'habitacion_hangar') return 1.06;
  return 1.0;
}

export const PERFILES_FISICA = {
  coche: {
    semieje: 0.44,
    factorRoll: 0.11,
    factorRollDerrape: 0.16,
    rollMax: 0.25,
    superficiesValidas: ['pista_asfalto', 'pista_tierra'],
    colorChispa: 0xffd166,
    bonoWheelieTurbo: 0,
    vuela: false,
    flota: false
  },
  moto: {
    semieje: 0.36,
    factorRoll: 1.15,
    factorRollDerrape: 1.35,
    rollMax: 0.48,
    superficiesValidas: ['pista_asfalto', 'pista_tierra'],
    colorChispa: 0xffd166,
    bonoWheelieTurbo: 0.12,
    vuela: false,
    flota: false
  },
  barco: {
    semieje: 0.50,
    factorRoll: 0.24,
    factorRollDerrape: 0.34,
    rollMax: 0.32,
    superficiesValidas: ['agua_navegable', 'pista_asfalto'],
    colorChispa: 0x7dd3fc,
    bonoWheelieTurbo: 0,
    vuela: false,
    flota: true
  },
  avion: {
    semieje: 0.46,
    factorRoll: 1.88,
    factorRollDerrape: 1.9,
    rollMax: 0.68,
    superficiesValidas: ['pista_asfalto', 'agua_navegable'],
    colorChispa: 0xe0f2fe,
    bonoWheelieTurbo: 0,
    vuela: true,
    velDespegue: 3.8,
    velSustentoMin: 3.2,
    flota: false
  }
};

/**
 * Formatea una duración en segundos como MM:SS.ms (ej. 00:24.68).
 */
export function formatearTiempoMMSS(segundos) {
  if (segundos === null || segundos === undefined || !Number.isFinite(segundos)) {
    return '--:--.--';
  }
  const centesimasTotales = Math.max(0, Math.floor(segundos * 100));
  const minutos = Math.floor(centesimasTotales / 6000);
  const segs = Math.floor((centesimasTotales % 6000) / 100);
  const centesimas = centesimasTotales % 100;
  return (
    String(minutos).padStart(2, '0') +
    ':' +
    String(segs).padStart(2, '0') +
    '.' +
    String(centesimas).padStart(2, '0')
  );
}

/**
 * Restaura los materiales luminosos de los 5 checkpoints al estado pendiente (naranja neón).
 */
function reiniciarLucesCheckpoints() {
  for (let i = 0; i < checkpointsPista.length; i++) {
    const cp = checkpointsPista[i];
    if (cp.matIndicador) {
      cp.matIndicador.color.setHex(0xff7700);
      cp.matIndicador.emissive.setHex(0xff5500);
      cp.matIndicador.emissiveIntensity = 0.8;
    }
    if (cp.matCampo) {
      cp.matCampo.color.setHex(0xff7700);
      cp.matCampo.emissive.setHex(0xff5500);
      cp.matCampo.opacity = 0.16;
    }
  }
}

/**
 * Actualiza los valores del panel cronómetro y progreso de checkpoints en #hud-conduccion.
 */
export function actualizarHUDCronometro() {
  const elActual = document.getElementById('tiempo-actual-hud');
  const elUltima = document.getElementById('ultima-vuelta-hud');
  const elMejor = document.getElementById('mejor-vuelta-hud');
  const elCP = document.getElementById('checkpoints-hud');
  const elAviso = document.getElementById('aviso-record-hud');

  if (elActual) {
    elActual.textContent = formatearTiempoMMSS(
      estadoCronometro.vueltaActiva || estadoCronometro.tiempoActual > 0
        ? estadoCronometro.tiempoActual
        : 0
    );
  }
  if (elUltima) {
    elUltima.textContent = formatearTiempoMMSS(estadoCronometro.ultimaVuelta);
  }
  if (elMejor) {
    elMejor.textContent = formatearTiempoMMSS(estadoCronometro.mejorVuelta);
  }
  if (elCP) {
    elCP.textContent = `CP: ${estadoCronometro.checkpointActual} / ${estadoCronometro.totalCheckpoints}`;
    elCP.classList.toggle(
      'listo-meta',
      estadoCronometro.checkpointActual === estadoCronometro.totalCheckpoints
    );
  }
  if (elAviso) {
    elAviso.classList.toggle('visible', estadoCronometro.avisoRecord > 0);
  }
}

/**
 * Reinicia la vuelta en curso, el contador de checkpoints y las luces de los arcos.
 */
export function reiniciarCronometroVuelta(activar = false) {
  estadoCronometro.vueltaActiva = activar;
  estadoCronometro.tiempoActual = 0;
  estadoCronometro.checkpointActual = 0;
  if (!activar) {
    estadoCronometro.avisoRecord = 0;
  }
  reiniciarLucesCheckpoints();
  actualizarHUDCronometro();
}

/**
 * Actualiza cronómetro, validación secuencial de los 5 checkpoints y detección de cruce de meta.
 */
function actualizarCronometroYCheckpoints(dt, xAnterior) {
  if (estadoCronometro.avisoRecord > 0) {
    estadoCronometro.avisoRecord = Math.max(0, estadoCronometro.avisoRecord - dt);
  }

  const margenVertical = estadoCarro.claseVehiculo === 'avion' ? 4.5 : 0.85;

  if (estadoCronometro.vueltaActiva) {
    estadoCronometro.tiempoActual += dt;

    // Validación estricta del siguiente checkpoint esperado
    if (estadoCronometro.checkpointActual < checkpointsPista.length) {
      const cp = checkpointsPista[estadoCronometro.checkpointActual];
      const distXZ = Math.hypot(fisicaCarro.x - cp.x, fisicaCarro.z - cp.z);
      const diffY = Math.abs(fisicaCarro.y - cp.y);
      const margenCP = Math.max(cp.radioVertical || 0.85, margenVertical);

      if (distXZ <= cp.radio && diffY <= margenCP) {
        if (cp.matIndicador) {
          cp.matIndicador.color.setHex(0x00ff66);
          cp.matIndicador.emissive.setHex(0x00f566);
          cp.matIndicador.emissiveIntensity = 1.2;
        }
        if (cp.matCampo) {
          cp.matCampo.color.setHex(0x00ff66);
          cp.matCampo.emissive.setHex(0x00f566);
          cp.matCampo.opacity = 0.24;
        }
        estadoCronometro.checkpointActual += 1;
        dispararChispasEnEnganche(new THREE.Vector3(fisicaCarro.x, fisicaCarro.y + 0.35, fisicaCarro.z));
        reproducirCheckpoint(cp.indice);
      }
    }
  }

  const habActiva = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  const meta = habActiva.meta;
  const xCruceMeta = meta.xCruce ?? 0.0;
  const radioCruceZ = meta.rangoX ? meta.rangoX * 0.5 : 2.8;
  const margenYMeta = estadoCarro.idHabitacion === 'habitacion_hangar' || estadoCarro.claseVehiculo === 'avion' ? 9.0 : 0.6;

  // Cruce de la línea de meta según la habitación activa avanzando en sentido +X
  const cruzaMetaAdelante =
    xAnterior < xCruceMeta &&
    fisicaCarro.x >= xCruceMeta &&
    Math.abs(fisicaCarro.z - meta.cruceZ) <= radioCruceZ &&
    Math.abs(fisicaCarro.y - meta.y) < margenYMeta;

  if (cruzaMetaAdelante) {
    if (
      estadoCronometro.vueltaActiva &&
      estadoCronometro.checkpointActual === estadoCronometro.totalCheckpoints
    ) {
      const tiempoCompletado = estadoCronometro.tiempoActual;
      estadoCronometro.ultimaVuelta = tiempoCompletado;
      let esNuevoRecord = false;

      if (
        estadoCronometro.mejorVuelta === null ||
        tiempoCompletado < estadoCronometro.mejorVuelta
      ) {
        estadoCronometro.mejorVuelta = tiempoCompletado;
        estadoCronometro.avisoRecord = 3.5;
        esNuevoRecord = true;
        if (typeof estadoCronometro.guardarRecord === 'function') {
          estadoCronometro.guardarRecord(
            tiempoCompletado,
            estadoCarro.idHabitacion,
            estadoCarro.claseVehiculo
          );
        } else if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(
              obtenerClaveRecord(estadoCarro.idHabitacion, estadoCarro.claseVehiculo),
              String(tiempoCompletado)
            );
          } catch (e) {
            // Ignora errores de almacenamiento local
          }
        }
      }
      reproducirMeta(esNuevoRecord);
    }
    reiniciarCronometroVuelta(true);
    return;
  }

  actualizarHUDCronometro();
}

/**
 * Normaliza una diferencia angular al rango [-PI, PI].
 */
function diferenciaAngular(objetivo, actual) {
  return Math.atan2(Math.sin(objetivo - actual), Math.cos(objetivo - actual));
}

/**
 * Actualiza la insignia visual de derrape/turbo en el HUD de conducción.
 */
function actualizarInsigniaEstadoHUD() {
  const insignia = document.getElementById('insignia-estado-hud');
  if (!insignia) return;

  if (fisicaCarro.tiempoTurbo > 0) {
    insignia.textContent = '¡TURBO!';
    insignia.className = 'activo-turbo';
  } else if (fisicaCarro.tiempoMiniTurbo > 0) {
    insignia.textContent = '¡MINI-TURBO!';
    insignia.className = 'activo-turbo';
  } else if (fisicaCarro.derrapando) {
    insignia.textContent = 'DERRAPE';
    insignia.className = 'activo-derrape';
  } else {
    insignia.textContent = '';
    insignia.className = '';
  }
}

/**
 * Cancela un derrape activo tras chocar para evitar el Mini-Turbo y activar el enfriamiento.
 */
function cancelarDerrapePorChoque() {
  if (!fisicaCarro.derrapando) return;
  fisicaCarro.derrapando = false;
  fisicaCarro.tiempoDerrapeActivo = 0;
  fisicaCarro.tiempoDerrape = 0;
  fisicaCarro.enfriamientoDerrape = 0.65;
  acumuladorChispasDerrape = 0;
}

/**
 * Consulta la altura y el tipo de superficie ('esPista') directamente debajo de una coordenada (x, z).
 * Por qué: detecta rampas/puente y distingue el trazado oficial del suelo de madera o alfombra.
 */
export function obtenerInfoSuperficieEnPunto(x, z, alturaReferencia) {
  const origenY = alturaReferencia + 0.55;
  raycasterSuelo.set(new THREE.Vector3(x, origenY, z), vectorAbajo);
  const impactos = raycasterSuelo.intersectObjects(mallasSuperficieConducible, false);
  const perfil = PERFILES_FISICA[estadoCarro.claseVehiculo] || PERFILES_FISICA.coche;

  for (let i = 0; i < impactos.length; i++) {
    const pY = impactos[i].point.y;
    // Evita teletransportarse al techo del paso elevado al pasar por debajo
    if (pY <= alturaReferencia + 0.36) {
      const obj = impactos[i].object;
      const esPistaDirecto = Boolean(obj && obj.userData && obj.userData.esPista);
      const tipoSuperficie =
        (obj && obj.userData && obj.userData.tipoSuperficie) ||
        (esPistaDirecto ? 'pista_asfalto' : 'fuera_pista');
      const esPista = esPistaDirecto || perfil.superficiesValidas.includes(tipoSuperficie);
      return {
        altura: pY,
        esPista,
        tipoSuperficie
      };
    }
  }
  return { altura: 0.015, esPista: false, tipoSuperficie: 'fuera_pista' };
}

/**
 * Consulta la altura de la superficie conducible directamente debajo de una coordenada (x, z).
 */
export function obtenerAlturaSuperficieEnPunto(x, z, alturaReferencia) {
  return obtenerInfoSuperficieEnPunto(x, z, alturaReferencia).altura;
}

/**
 * Reposiciona el vehículo en la línea de salida/meta configurada en la habitación activa.
 */
export function reposicionarEnMeta() {
  const habActiva = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  const meta = habActiva.meta;

  fisicaCarro.x = meta.x;
  fisicaCarro.y = meta.y;
  fisicaCarro.z = meta.z;
  fisicaCarro.altitudVuelo = 0;
  fisicaCarro.velocidad = 0;
  fisicaCarro.velY = 0;
  fisicaCarro.yaw = meta.yaw || 0;
  fisicaCarro.anguloMovimiento = meta.yaw || 0;
  fisicaCarro.pitch = 0;
  fisicaCarro.roll = 0;
  fisicaCarro.enAire = false;
  fisicaCarro.derrapando = false;
  fisicaCarro.tiempoDerrape = 0;
  fisicaCarro.tiempoDerrapeActivo = 0;
  fisicaCarro.enfriamientoDerrape = 0;
  fisicaCarro.tiempoTurbo = 0;
  fisicaCarro.tiempoMiniTurbo = 0;
  fisicaCarro.anguloVolante = 0;
  const habMetaSuperficie = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  acumuladorChispasDerrape = 0;
  enPistaActual = true;
  tipoSuperficieActual = habMetaSuperficie.claseIdeal === 'barco' ? 'agua_navegable' : (habMetaSuperficie.claseIdeal === 'moto' ? 'pista_tierra' : 'pista_asfalto');
  temporizadorVibracionAudio = 0;
  ultimoPitchTerreno = 0;
  tiempoHidrodinamico = 0;
  tipoTrampaActiva = null;

  const volanteCabina = grupoJuguete.getObjectByName('volanteCabina');
  if (volanteCabina) volanteCabina.rotation.z = 0;

  if (camara.fov !== 60) {
    camara.fov = 60;
    camara.updateProjectionMatrix();
  }
  const elAlt = document.getElementById('altitud-hud');
  if (elAlt) elAlt.textContent = 'ALT: 0.0 m';
  reiniciarCronometroVuelta(false);
  actualizarInsigniaEstadoHUD();
  dispararChispasEnEnganche(new THREE.Vector3(meta.x, meta.y + 0.225, meta.z));
}

/**
 * Actualiza el movimiento del vehículo según los atributos del chasis y el perfil físico
 * de su clase (coche, moto, barco, avión), manteniendo ±20% en pendientes y -30% fuera de pista.
 */
export function actualizarFisicaConduccion(dt) {
  const defBase = TABLA_CARROCERIAS.find((b) => b.id === estadoCarro.idCarroceria) || TABLA_CARROCERIAS[0];
  const claseVehiculo = defBase.clase || estadoCarro.claseVehiculo || 'coche';
  const perfil = PERFILES_FISICA[claseVehiculo] || PERFILES_FISICA.coche;
  tiempoHidrodinamico += dt;

  // Detección inmediata de trampas de calzada ('aceite', 'espuma', 'barro')
  tipoTrampaActiva = null;
  if (!fisicaCarro.enAire && trampasPista.length > 0) {
    for (let i = 0; i < trampasPista.length; i++) {
      const tr = trampasPista[i];
      const distTr = Math.hypot(fisicaCarro.x - tr.posicion.x, fisicaCarro.z - tr.posicion.z);
      if (distTr < tr.radio && Math.abs(fisicaCarro.y - tr.posicion.y) < 0.85) {
        tipoTrampaActiva = tr.tipo;
        break;
      }
    }
  }

  const atrib = obtenerAtributosFinalesVehiculo(estadoCarro);
  const stats = atrib.statsUI || { velocidad: 40, aceleracion: 40, control: 40 };

  const velMaxBase = atrib.velMax || (2.5 + stats.velocidad * 0.065) * 1.20 * 1.30;
  const acelParam = atrib.aceleracion || (1.8 + stats.aceleracion * 0.065) * 1.18 * 1.30;
  const manejoParam = atrib.manejo || 1.1 + stats.control * 0.022;
  const duracionMaxDerrape = 0.35 + (stats.control / 60) * 0.55;

  // Temporizadores de turbo, mini-turbo y enfriamiento de derrape
  if (fisicaCarro.tiempoTurbo > 0) {
    fisicaCarro.tiempoTurbo = Math.max(0, fisicaCarro.tiempoTurbo - dt);
  }
  if (fisicaCarro.tiempoMiniTurbo > 0) {
    fisicaCarro.tiempoMiniTurbo = Math.max(0, fisicaCarro.tiempoMiniTurbo - dt);
  }
  if (fisicaCarro.enfriamientoDerrape > 0) {
    fisicaCarro.enfriamientoDerrape = Math.max(0, fisicaCarro.enfriamientoDerrape - dt);
  }

  const enTurbo = fisicaCarro.tiempoTurbo > 0 || fisicaCarro.tiempoMiniTurbo > 0;
  const factorTurboVel = fisicaCarro.tiempoTurbo > 0 ? 1.32 : (fisicaCarro.tiempoMiniTurbo > 0 ? 1.18 : 1.0);
  const sentidoPrevio = fisicaCarro.velocidad >= -0.05 ? 1 : -1;
  const pendientePrev = !fisicaCarro.enAire ? ultimoPitchTerreno * sentidoPrevio : 0;
  const factorPendientePrev = pendientePrev > 0.035 ? 0.80 : (pendientePrev < -0.035 ? 1.20 : 1.0);
  const factorEmpujePendiente = pendientePrev > 0.035 ? 0.80 : 1.0;
  const factorSuperficiePrev = !fisicaCarro.enAire && !enPistaActual ? 0.70 : 1.0;
  const factorAfinidadPrev = calcularFactorAfinidadMedio(estadoCarro.claseVehiculo, tipoSuperficieActual, fisicaCarro.enAire, estadoCarro.idHabitacion);
  const factorTrampaPrev = tipoTrampaActiva === 'barro' && !enTurbo ? 0.78 : 1.0;

  const velMaxAdelante = velMaxBase * factorAfinidadPrev * factorPendientePrev * factorSuperficiePrev * factorTurboVel * factorTrampaPrev;
  const acelBase = acelParam * (enTurbo ? 1.35 : 1.0) * factorEmpujePendiente;
  const frenoMax = Math.max(7.5, acelParam * 1.65);
  const velMaxAtras = -3.432 * factorSuperficiePrev;
  const friccion = !fisicaCarro.enAire && !enPistaActual ? 2.75 : 1.65;

  // 1. Entrada de acelerador, freno y derrape
  const adelante = teclasConduccion['KeyW'] || teclasConduccion['ArrowUp'];
  const atras = teclasConduccion['KeyS'] || teclasConduccion['ArrowDown'];
  const izquierda = teclasConduccion['KeyA'] || teclasConduccion['ArrowLeft'];
  const derecha = teclasConduccion['KeyD'] || teclasConduccion['ArrowRight'];
  const teclaDerrape = teclasConduccion['ShiftLeft'] || teclasConduccion['ShiftRight'] || teclasConduccion['Space'];

  if (adelante) {
    if (fisicaCarro.velocidad < 0) {
      fisicaCarro.velocidad += frenoMax * dt;
    } else if (fisicaCarro.velocidad < velMaxAdelante) {
      const ratioVel = Math.max(0, Math.min(1, fisicaCarro.velocidad / Math.max(1, velMaxAdelante)));
      const acelCurva = acelBase * (1.28 - 0.52 * ratioVel * ratioVel);
      fisicaCarro.velocidad = Math.min(velMaxAdelante, fisicaCarro.velocidad + acelCurva * dt);
    }
  } else if (atras) {
    fisicaCarro.velocidad -= (fisicaCarro.velocidad > 0 ? frenoMax : acelParam * 0.65 * factorEmpujePendiente) * dt;
  } else if (enTurbo && fisicaCarro.velocidad < velMaxAdelante) {
    fisicaCarro.velocidad = Math.min(velMaxAdelante, fisicaCarro.velocidad + acelBase * 0.45 * dt);
  } else {
    if (Math.abs(fisicaCarro.velocidad) < 0.06) {
      fisicaCarro.velocidad = 0;
    } else {
      fisicaCarro.velocidad -= Math.sign(fisicaCarro.velocidad) * friccion * dt;
    }
  }

  // Impulso gravitatorio natural en bajadas significativas sin rebasar el tope permitido
  if (!fisicaCarro.enAire && pendientePrev < -0.035 && fisicaCarro.velocidad < velMaxAdelante) {
    fisicaCarro.velocidad = Math.min(
      velMaxAdelante,
      fisicaCarro.velocidad + sentidoPrevio * Math.abs(Math.sin(fisicaCarro.pitch)) * 2.6 * dt
    );
  }

  fisicaCarro.velocidad = Math.max(velMaxAtras, fisicaCarro.velocidad);

  // 2. Dirección reactiva (-20% giro máximo: 0.36 rad y tasaGiroBase 3.42) + Derrape táctico
  let objetivoVolante = 0;
  if (izquierda) objetivoVolante = 0.36;
  if (derecha) objetivoVolante = -0.36;
  const velLerpVolante = objetivoVolante !== 0 ? 28 : 32;
  fisicaCarro.anguloVolante += (objetivoVolante - fisicaCarro.anguloVolante) * Math.min(1, dt * velLerpVolante);

  const puedeDerrapar =
    teclaDerrape &&
    !fisicaCarro.enAire &&
    fisicaCarro.enfriamientoDerrape <= 0 &&
    fisicaCarro.velocidad > 1.65 &&
    (Math.abs(objetivoVolante) > 0.04 || fisicaCarro.derrapando);

  if (puedeDerrapar) {
    fisicaCarro.derrapando = true;
    fisicaCarro.tiempoDerrapeActivo += dt;
    fisicaCarro.tiempoDerrape = fisicaCarro.tiempoDerrapeActivo;

    acumuladorChispasDerrape += dt;
    if (acumuladorChispasDerrape >= 0.14) {
      acumuladorChispasDerrape = 0;
      const cosY = Math.cos(fisicaCarro.yaw);
      const sinY = -Math.sin(fisicaCarro.yaw);
      dispararChispasEnEnganche(
        new THREE.Vector3(
          fisicaCarro.x - cosY * 0.55,
          fisicaCarro.y + 0.12,
          fisicaCarro.z - sinY * 0.55
        ),
        perfil.colorChispa
      );
    }

    if (fisicaCarro.tiempoDerrapeActivo >= duracionMaxDerrape) {
      fisicaCarro.derrapando = false;
      fisicaCarro.tiempoDerrapeActivo = 0;
      fisicaCarro.tiempoDerrape = 0;
      fisicaCarro.enfriamientoDerrape = 0.65;
      acumuladorChispasDerrape = 0;

      fisicaCarro.tiempoMiniTurbo = 0.65;
      fisicaCarro.velocidad = Math.max(fisicaCarro.velocidad, velMaxBase * 1.16);
      dispararChispasEnEnganche(
        new THREE.Vector3(fisicaCarro.x, fisicaCarro.y + 0.18, fisicaCarro.z),
        perfil.colorChispa
      );
      reproducirTurbo(false);
    }
  } else if (fisicaCarro.derrapando) {
    if (fisicaCarro.tiempoDerrapeActivo >= duracionMaxDerrape * 0.75 && fisicaCarro.velocidad > 1.5) {
      fisicaCarro.tiempoMiniTurbo = 0.55;
      fisicaCarro.velocidad = Math.max(fisicaCarro.velocidad, velMaxBase * 1.12);
      dispararChispasEnEnganche(
        new THREE.Vector3(fisicaCarro.x, fisicaCarro.y + 0.18, fisicaCarro.z),
        perfil.colorChispa
      );
      reproducirTurbo(false);
    }
    fisicaCarro.derrapando = false;
    fisicaCarro.tiempoDerrapeActivo = 0;
    fisicaCarro.tiempoDerrape = 0;
    fisicaCarro.enfriamientoDerrape = 0.65;
    acumuladorChispasDerrape = 0;
  }

  if (Math.abs(fisicaCarro.velocidad) > 0.05) {
    const factorSentido = fisicaCarro.velocidad >= 0 ? 1 : -1;
    const factorArranque = Math.min(1, Math.abs(fisicaCarro.velocidad) / 1.1);
    const ratioAltaVel = Math.min(1, Math.abs(fisicaCarro.velocidad) / Math.max(1, velMaxBase));
    const sensibilidadVel = 1.0 - 0.04 * ratioAltaVel;
    const tasaGiroBase = 3.42;
    const multDerrape = fisicaCarro.derrapando ? (1.35 + (1.0 - atrib.agarreDerrape) * 0.5) : 1.0;
    const signoVolante = Math.abs(fisicaCarro.anguloVolante) > 0.02 ? Math.sign(fisicaCarro.anguloVolante) : 0;
    const impulsoSobreviraje = fisicaCarro.derrapando
      ? signoVolante * (0.45 + manejoParam * 0.45) * factorSentido * dt
      : 0;
    fisicaCarro.yaw +=
      fisicaCarro.anguloVolante * tasaGiroBase * (manejoParam * 0.65) * sensibilidadVel * multDerrape * factorSentido * factorArranque * dt +
      impulsoSobreviraje;
  }

  if ((tipoTrampaActiva === 'aceite' || tipoTrampaActiva === 'espuma') && Math.abs(fisicaCarro.velocidad) > 0.4) {
    fisicaCarro.yaw += Math.sin(tiempoHidrodinamico * 18.0) * 1.4 * dt;
  }

  // Separa la orientación visual (yaw) del vector de desplazamiento (anguloMovimiento) al derrapar
  if (fisicaCarro.velocidad < -0.2) {
    fisicaCarro.anguloMovimiento = fisicaCarro.yaw;
  } else {
    const diff = diferenciaAngular(fisicaCarro.yaw, fisicaCarro.anguloMovimiento);
    const factorAgarreTrampa =
      tipoTrampaActiva === 'aceite' || tipoTrampaActiva === 'espuma' ? 0.42 : 1.0;
    const tasaAlineacion =
      (fisicaCarro.derrapando ? (1.7 + atrib.agarreDerrape * 2.9) : 12.0) * factorAgarreTrampa;
    fisicaCarro.anguloMovimiento += diff * Math.min(1, dt * tasaAlineacion);
    const diffRestante = diferenciaAngular(fisicaCarro.yaw, fisicaCarro.anguloMovimiento);
    if (Math.abs(diffRestante) > 0.72) {
      fisicaCarro.anguloMovimiento = fisicaCarro.yaw - Math.sign(diffRestante) * 0.72;
    }
  }

  // 3. Avance horizontal en el plano XZ usando anguloMovimiento
  const cosMov = Math.cos(fisicaCarro.anguloMovimiento);
  const sinMov = -Math.sin(fisicaCarro.anguloMovimiento);
  const cosYaw = Math.cos(fisicaCarro.yaw);
  const sinYaw = -Math.sin(fisicaCarro.yaw);
  const avance = fisicaCarro.velocidad * Math.cos(fisicaCarro.pitch) * dt;

  let nuevoX = fisicaCarro.x + cosMov * avance;
  let nuevoZ = fisicaCarro.z + sinMov * avance;

  // 4. Colisión suave con los muros y techo según dimensiones de la habitación activa
  const habActiva = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  const dimensionesHab = habActiva.dimensiones;
  const limiteMuroX = dimensionesHab.ancho / 2 - 0.85;
  const limiteMuroZ = dimensionesHab.largo / 2 - 0.85;
  const limiteTechoY = Math.max(2.0, dimensionesHab.alto - 0.85);
  if (Math.abs(nuevoX) > limiteMuroX) {
    const velImpacto = Math.abs(fisicaCarro.velocidad);
    nuevoX = Math.sign(nuevoX) * limiteMuroX;
    fisicaCarro.velocidad *= -0.35;
    cancelarDerrapePorChoque();
    if (velImpacto > 0.35) reproducirImpacto(velImpacto / Math.max(1, velMaxBase), 'muro');
  }
  if (Math.abs(nuevoZ) > limiteMuroZ) {
    const velImpacto = Math.abs(fisicaCarro.velocidad);
    nuevoZ = Math.sign(nuevoZ) * limiteMuroZ;
    fisicaCarro.velocidad *= -0.35;
    cancelarDerrapePorChoque();
    if (velImpacto > 0.35) reproducirImpacto(velImpacto / Math.max(1, velMaxBase), 'muro');
  }

  // Colisión contra muebles, juguetes gigantes y pilares estáticos (omitiendo obstáculos bajos si el avión vuela alto)
  if (!(perfil.vuela && fisicaCarro.altitudVuelo > 1.8)) {
    obstaculosHabitacion.forEach((obs) => {
      const dx = nuevoX - obs.x;
      const dz = nuevoZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radio + 0.55;
      if (dist < minDist && dist > 0.001) {
        const velImpacto = Math.abs(fisicaCarro.velocidad);
        nuevoX = obs.x + (dx / dist) * minDist;
        nuevoZ = obs.z + (dz / dist) * minDist;
        fisicaCarro.velocidad *= -0.35;
        cancelarDerrapePorChoque();
        if (velImpacto > 0.35) reproducirImpacto(velImpacto / Math.max(1, velMaxBase), 'muro');
      }
    });
  }

  const xAnterior = fisicaCarro.x;
  fisicaCarro.x = nuevoX;
  fisicaCarro.z = nuevoZ;

  // Comprobación de Plataformas Aceleradoras (Boost Pads)
  for (let i = 0; i < plataformasTurbo.length; i++) {
    const pad = plataformasTurbo[i];
    const distPad = Math.hypot(fisicaCarro.x - pad.posicion.x, fisicaCarro.z - pad.posicion.z);
    if (distPad < pad.radio && Math.abs(fisicaCarro.y - pad.posicion.y) < (pad.margenY || 0.75)) {
      if (fisicaCarro.tiempoTurbo < 1.35) {
        dispararChispasEnEnganche(
          new THREE.Vector3(fisicaCarro.x, fisicaCarro.y + 0.18, fisicaCarro.z),
          perfil.colorChispa
        );
        reproducirTurbo(true);
      }
      fisicaCarro.tiempoTurbo = 1.6;
      fisicaCarro.velocidad = Math.max(fisicaCarro.velocidad, velMaxBase * pad.factorImpulso * 0.92);
    }
  }

  // 5. Detección de altura, pendiente y superficie según perfil físico
  const semieje = perfil.semieje;
  const infoDel = obtenerInfoSuperficieEnPunto(
    fisicaCarro.x + cosYaw * semieje,
    fisicaCarro.z + sinYaw * semieje,
    perfil.vuela ? fisicaCarro.y - fisicaCarro.altitudVuelo : fisicaCarro.y
  );
  const infoTras = obtenerInfoSuperficieEnPunto(
    fisicaCarro.x - cosYaw * semieje,
    fisicaCarro.z - sinYaw * semieje,
    perfil.vuela ? fisicaCarro.y - fisicaCarro.altitudVuelo : fisicaCarro.y
  );
  const ySueloObjetivo = (infoDel.altura + infoTras.altura) * 0.5;
  const pendienteSuelo = Math.atan2(infoDel.altura - infoTras.altura, semieje * 2);
  ultimoPitchTerreno = pendienteSuelo;
  enPistaActual = infoDel.esPista && infoTras.esPista;
  tipoSuperficieActual = enPistaActual ? infoDel.tipoSuperficie : 'fuera_pista';

  if (perfil.vuela) {
    const tecladoSube =
      teclasConduccion['KeyQ'] || (fisicaCarro.altitudVuelo > 0.05 && teclasConduccion['ShiftLeft']);
    const tecladoBaja =
      teclasConduccion['KeyE'] || teclasConduccion['ControlLeft'] || teclasConduccion['ControlRight'];
    const altMaxPermitida = Math.max(0.5, limiteTechoY - ySueloObjetivo);
    let pitchObjetivoAvion = pendienteSuelo;

    if (Math.abs(fisicaCarro.velocidad) > perfil.velDespegue) {
      if (tecladoSube) {
        fisicaCarro.altitudVuelo = Math.min(altMaxPermitida, fisicaCarro.altitudVuelo + 4.2 * dt);
        pitchObjetivoAvion = 0.26;
      } else if (tecladoBaja && fisicaCarro.altitudVuelo > 0) {
        fisicaCarro.altitudVuelo = Math.max(0, fisicaCarro.altitudVuelo - 4.4 * dt);
        pitchObjetivoAvion = -0.24;
      } else if (fisicaCarro.altitudVuelo > 0.05) {
        pitchObjetivoAvion = 0.0;
      }
    } else if (fisicaCarro.altitudVuelo > 0) {
      const tasaCaida = Math.abs(fisicaCarro.velocidad) < perfil.velSustentoMin ? 3.8 : 1.5;
      fisicaCarro.altitudVuelo = Math.max(0, fisicaCarro.altitudVuelo - tasaCaida * dt);
      pitchObjetivoAvion = -0.18;
    }

    const estabaVolando = fisicaCarro.enAire;
    fisicaCarro.enAire = fisicaCarro.altitudVuelo > 0.05;
    if (estabaVolando && !fisicaCarro.enAire && Math.abs(fisicaCarro.velocidad) > 1.0) {
      dispararChispasEnEnganche(
        new THREE.Vector3(fisicaCarro.x, ySueloObjetivo + 0.1, fisicaCarro.z),
        perfil.colorChispa
      );
      reproducirImpacto(0.35, 'aterrizaje');
    }
    fisicaCarro.y = ySueloObjetivo + fisicaCarro.altitudVuelo;
    fisicaCarro.velY = 0;
    fisicaCarro.pitch += (pitchObjetivoAvion - fisicaCarro.pitch) * Math.min(1, dt * 8);
  } else if (!fisicaCarro.enAire) {
    if (fisicaCarro.y - ySueloObjetivo > 0.09) {
      fisicaCarro.enAire = true;
      fisicaCarro.velY = fisicaCarro.velocidad * Math.sin(pendienteSuelo) + 0.95;
    } else {
      fisicaCarro.y = ySueloObjetivo;
      let pitchVisualExtra = 0;
      if (perfil.bonoWheelieTurbo && enTurbo && fisicaCarro.velocidad > 2.0) {
        pitchVisualExtra = perfil.bonoWheelieTurbo;
      } else if (perfil.flota && fisicaCarro.velocidad > 0.6) {
        pitchVisualExtra = 0.055 * Math.min(1, fisicaCarro.velocidad / Math.max(1, velMaxBase));
      }
      fisicaCarro.pitch += (pendienteSuelo + pitchVisualExtra - fisicaCarro.pitch) * Math.min(1, dt * 14);
      fisicaCarro.velY = fisicaCarro.velocidad * Math.sin(pendienteSuelo);
    }
  } else {
    fisicaCarro.velY -= 9.8 * dt;
    fisicaCarro.y += fisicaCarro.velY * dt;
    if (fisicaCarro.y > limiteTechoY) {
      fisicaCarro.y = limiteTechoY;
      if (fisicaCarro.velY > 0) fisicaCarro.velY = 0;
    }
    fisicaCarro.pitch += (-0.15 - fisicaCarro.pitch) * dt * 2.2;

    if (fisicaCarro.y <= ySueloObjetivo) {
      const velCaida = Math.abs(fisicaCarro.velY);
      fisicaCarro.y = ySueloObjetivo;
      fisicaCarro.enAire = false;
      fisicaCarro.velY = 0;
      fisicaCarro.pitch = pendienteSuelo;
      dispararChispasEnEnganche(
        new THREE.Vector3(fisicaCarro.x, fisicaCarro.y + 0.1, fisicaCarro.z),
        perfil.colorChispa
      );
      reproducirImpacto(Math.min(1, velCaida / 4.5), 'aterrizaje');
    }
  }

  // Tope final velMaxEfectiva = velMaxChasis * factorPendiente * factorSuperficie * factorTurbo
  const sentidoFinal = fisicaCarro.velocidad >= -0.05 ? 1 : -1;
  const pendienteEnMarcha = !fisicaCarro.enAire ? ultimoPitchTerreno * sentidoFinal : 0;
  const factorPendiente = pendienteEnMarcha > 0.035 ? 0.80 : (pendienteEnMarcha < -0.035 ? 1.20 : 1.0);
  const factorSuperficie = !fisicaCarro.enAire && !enPistaActual ? 0.70 : 1.0;
  const factorAfinidad = calcularFactorAfinidadMedio(estadoCarro.claseVehiculo, tipoSuperficieActual, fisicaCarro.enAire, estadoCarro.idHabitacion);
  const enTurboFinal = fisicaCarro.tiempoTurbo > 0 || fisicaCarro.tiempoMiniTurbo > 0;
  const factorTrampa = tipoTrampaActiva === 'barro' && !enTurboFinal ? 0.78 : 1.0;
  const velMaxEfectiva = velMaxBase * factorAfinidad * factorPendiente * factorSuperficie * factorTurboVel * factorTrampa;

  if (fisicaCarro.velocidad > velMaxEfectiva) {
    const tasaFrenadoExceso = !enPistaActual || factorPendiente < 1.0 || factorTrampa < 1.0 ? 6.5 : 4.5;
    fisicaCarro.velocidad += (velMaxEfectiva - fisicaCarro.velocidad) * Math.min(1, dt * tasaFrenadoExceso);
  }

  // Balanceo lateral de la carrocería + leve vibración al circular fuera de pista
  const factorRoll = fisicaCarro.derrapando ? perfil.factorRollDerrape : perfil.factorRoll;
  let vibracionRoll = 0;
  if (!fisicaCarro.enAire && !enPistaActual && Math.abs(fisicaCarro.velocidad) > 0.6) {
    temporizadorVibracionAudio += dt;
    vibracionRoll = Math.sin(temporizadorVibracionAudio * 36.0) * 0.016 * Math.min(1, Math.abs(fisicaCarro.velocidad) / 3.0);
    if (temporizadorVibracionAudio >= 0.24) {
      temporizadorVibracionAudio = 0;
      reproducirImpacto(0.18, 'aterrizaje');
    }
  } else {
    temporizadorVibracionAudio = 0;
  }
  let rollObjetivo =
    -fisicaCarro.anguloVolante * (fisicaCarro.velocidad / Math.max(4, velMaxBase)) * factorRoll +
    vibracionRoll;
  if (perfil.rollMax) {
    rollObjetivo = Math.max(-perfil.rollMax, Math.min(perfil.rollMax, rollObjetivo));
  }
  fisicaCarro.roll += (rollObjetivo - fisicaCarro.roll) * Math.min(1, dt * 10);

  const offsetOlasY = perfil.flota && !fisicaCarro.enAire ? Math.sin(tiempoHidrodinamico * 3.2) * 0.018 : 0;
  grupoJuguete.position.set(fisicaCarro.x, fisicaCarro.y + offsetOlasY, fisicaCarro.z);
  grupoJuguete.rotation.set(fisicaCarro.roll, fisicaCarro.yaw, fisicaCarro.pitch);

  // Rotación en tiempo real del volante 3D dentro de la cabina ('volanteCabina')
  const volanteCabina = grupoJuguete.getObjectByName('volanteCabina');
  if (volanteCabina) {
    volanteCabina.rotation.z = -fisicaCarro.anguloVolante * 2.4;
  }

  // 6. Animación mecánica polimórfica según rolAnimacion de cada enganche activo
  const radioRueda = 0.175;
  fisicaCarro.rotacionRodadura += (fisicaCarro.velocidad * dt) / radioRueda;
  const velHeliceBase = perfil.vuela ? 12.0 : 4.5;

  Object.values(nodosEnganches).forEach((nodo) => {
    const def = nodo.definicion;
    const rol = def.rolAnimacion || (def.tipo === 'rueda' ? 'rueda_motriz' : 'estatico');

    if (rol === 'rueda_motriz') {
      const giroDireccion = def.esDelantera ? fisicaCarro.anguloVolante : 0;
      nodo.grupoContenedor.rotation.y = nodo.rotacionBaseY + giroDireccion;
      if (nodo.mallaPieza) {
        const signoLado = def.lado || 1;
        nodo.mallaPieza.rotation.z = -fisicaCarro.rotacionRodadura * signoLado;
      }
    } else if (rol === 'helice_x' && nodo.mallaPieza) {
      const sentido = def.sentidoGiro || 1;
      nodo.mallaPieza.rotation.x += (Math.abs(fisicaCarro.velocidad) * 3.0 + velHeliceBase) * sentido * dt;
    } else if (rol === 'helice_z' && nodo.mallaPieza) {
      const sentido = def.sentidoGiro || 1;
      nodo.mallaPieza.rotation.z += (Math.abs(fisicaCarro.velocidad) * 3.0 + velHeliceBase) * sentido * dt;
    } else if (rol === 'timon_y') {
      nodo.grupoContenedor.rotation.y = nodo.rotacionBaseY - fisicaCarro.anguloVolante * 0.9;
    }
  });

  // Efecto de velocidad en FOV dinámico (60° -> 72° durante turbo)
  const fovObjetivo = enTurbo ? 72 : (fisicaCarro.derrapando ? 63 : 60);
  if (Math.abs(camara.fov - fovObjetivo) > 0.05) {
    camara.fov += (fovObjetivo - camara.fov) * Math.min(1, dt * 8);
    camara.updateProjectionMatrix();
  } else if (camara.fov !== fovObjetivo) {
    camara.fov = fovObjetivo;
    camara.updateProjectionMatrix();
  }

  // Velocímetro (multiplicador x32), altitud (para aviones), cronómetro anti-trampas y audio
  const kmh = Math.round(Math.abs(fisicaCarro.velocidad) * 32);
  const elVel = document.getElementById('valor-velocidad');
  if (elVel) elVel.textContent = kmh;
  const elAlt = document.getElementById('altitud-hud');
  if (elAlt) {
    elAlt.textContent = `ALT: ${Math.max(0, fisicaCarro.altitudVuelo).toFixed(1)} m`;
  }
  actualizarCronometroYCheckpoints(dt, xAnterior);
  actualizarInsigniaEstadoHUD();
  actualizarAudioMotor(fisicaCarro.velocidad, velMaxBase, estadoCarro.idCarroceria, fisicaCarro.enAire);
  actualizarAudioDerrape(
    fisicaCarro.derrapando,
    Math.abs(fisicaCarro.velocidad) / Math.max(1, velMaxBase),
    estadoCarro.idCarroceria
  );
}

/**
 * Actualiza barreras móviles oscilantes y obstáculos dinámicos derribables (conos y bloques),
 * gestionando impactos según el pesoImpacto del chasis y su reposición automática a los 8 segundos.
 */
export function actualizarObstaculos(dt, tiempoTotal) {
  const defBase = TABLA_CARROCERIAS.find((b) => b.id === estadoCarro.idCarroceria) || TABLA_CARROCERIAS[0];
  const pesoImpacto = (defBase.atributos && defBase.atributos.pesoImpacto) || 1.0;
  const enConduccion = estadoCarro.modoJuego === 'conduccion';

  // 1. Barreras oscilantes laterales en la pista
  for (let i = 0; i < obstaculosMoviles.length; i++) {
    const mob = obstaculosMoviles[i];
    const desplazamiento = Math.sin(tiempoTotal * mob.velocidadOscilacion + mob.fase) * mob.amplitud;
    mob.malla.position.copy(mob.posBase).addScaledVector(mob.ejeOscilacion, desplazamiento);

    if (enConduccion) {
      const dx = fisicaCarro.x - mob.malla.position.x;
      const dz = fisicaCarro.z - mob.malla.position.z;
      const dist = Math.hypot(dx, dz);
      const minDist = mob.radio + 0.56;
      if (dist < minDist && dist > 0.001 && Math.abs(fisicaCarro.y - mob.posBase.y) < 1.1) {
        const nx = dx / dist;
        const nz = dz / dist;
        fisicaCarro.x = mob.malla.position.x + nx * minDist;
        fisicaCarro.z = mob.malla.position.z + nz * minDist;
        fisicaCarro.velocidad = -Math.sign(fisicaCarro.velocidad || 1) * Math.max(3.6, Math.abs(fisicaCarro.velocidad) * 0.52);
        dispararChispasEnEnganche(new THREE.Vector3(
          mob.malla.position.x + nx * mob.radio,
          fisicaCarro.y + 0.25,
          mob.malla.position.z + nz * mob.radio
        ));
        reproducirImpacto(0.85, 'muro');
      }
    }
  }

  // 2. Conos y pilas de bloques derribables
  for (let i = 0; i < obstaculosDinamicos.length; i++) {
    const obs = obstaculosDinamicos[i];

    if (enConduccion && !obs.derribado) {
      const dx = obs.malla.position.x - fisicaCarro.x;
      const dz = obs.malla.position.z - fisicaCarro.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radio + 0.60;
      if (dist < minDist && Math.abs(fisicaCarro.y - obs.malla.position.y) < 1.15) {
        const invDist = dist > 0.001 ? 1 / dist : 1;
        const nx = dx * invDist;
        const nz = dz * invDist;
        const velImpulso = Math.max(4.5, Math.abs(fisicaCarro.velocidad)) * pesoImpacto;
        const vxCar = Math.cos(fisicaCarro.anguloMovimiento) * fisicaCarro.velocidad;
        const vzCar = -Math.sin(fisicaCarro.anguloMovimiento) * fisicaCarro.velocidad;

        obs.velocidad.set(
          nx * velImpulso * 0.62 + vxCar * 0.85,
          2.4 + Math.min(4.8, velImpulso * 0.28),
          nz * velImpulso * 0.62 + vzCar * 0.85
        );
        obs.velAngular.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14
        );
        obs.derribado = true;
        obs.tiempoReset = 0;

        // El pesoImpacto del chasis reduce la pérdida de velocidad al derribar obstáculos
        fisicaCarro.velocidad *= Math.min(0.985, 0.90 + pesoImpacto * 0.055);
        reproducirImpacto(Math.min(1, velImpulso / 6.0), 'obstaculo');
      }
    }

    if (obs.derribado) {
      obs.tiempoReset += dt;
      obs.velocidad.y -= 11.5 * dt;
      obs.malla.position.addScaledVector(obs.velocidad, dt);
      obs.malla.rotation.x += obs.velAngular.x * dt;
      obs.malla.rotation.y += obs.velAngular.y * dt;
      obs.malla.rotation.z += obs.velAngular.z * dt;

      const sueloObs = obs.posInicial.y > 1.15 ? 1.37 : Math.min(obs.posInicial.y, 0.17);
      if (obs.malla.position.y < sueloObs) {
        obs.malla.position.y = sueloObs;
        obs.velocidad.y = Math.abs(obs.velocidad.y) * 0.42;
        obs.velocidad.x *= 0.78;
        obs.velocidad.z *= 0.78;
        obs.velAngular.multiplyScalar(0.72);
      }

      // Parpadeo de aviso durante el último 1.5 s antes de reaparecer
      if (obs.tiempoReset > 6.5) {
        obs.malla.visible = Math.floor(obs.tiempoReset * 12) % 2 === 0;
      }

      if (obs.tiempoReset >= 8.0) {
        obs.malla.position.copy(obs.posInicial);
        obs.malla.rotation.copy(obs.rotInicial);
        obs.velocidad.set(0, 0, 0);
        obs.velAngular.set(0, 0, 0);
        obs.derribado = false;
        obs.tiempoReset = 0;
        obs.malla.visible = true;
      }
    }
  }
}

/**
 * Actualiza la posición y orientación de la cámara en Modo Conducción:
 * Tercera Persona (persecución suave) o Cabina (primera persona dentro del vehículo).
 */
export function actualizarCamaraConduccion(dt) {
  grupoJuguete.updateMatrixWorld();

  if (estadoCarro.modoCamara === 'cabina') {
    const defBase = TABLA_CARROCERIAS.find((b) => b.id === estadoCarro.idCarroceria) || TABLA_CARROCERIAS[0];
    const posOjosLocal = new THREE.Vector3().fromArray(defBase.vistaCabina);
    const mirarLocal = new THREE.Vector3(
      2.5,
      defBase.vistaCabina[1] - 0.14,
      defBase.vistaCabina[2] - fisicaCarro.anguloVolante * 0.65
    );

    const posOjosMundo = posOjosLocal.applyMatrix4(grupoJuguete.matrixWorld);
    const mirarMundo = mirarLocal.applyMatrix4(grupoJuguete.matrixWorld);

    camara.position.copy(posOjosMundo);
    camara.lookAt(mirarMundo);
  } else {
    const offsetDetras = new THREE.Vector3(-2.35, 1.05, 0);
    const posDeseada = offsetDetras.applyMatrix4(grupoJuguete.matrixWorld);
    posDeseada.y = Math.max(0.35, posDeseada.y);

    camara.position.lerp(posDeseada, Math.min(1, dt * 7.5));

    const puntoMirar = new THREE.Vector3(0.65, 0.32, 0).applyMatrix4(grupoJuguete.matrixWorld);
    controles.target.lerp(puntoMirar, Math.min(1, dt * 10));
    camara.lookAt(controles.target);
  }
}
