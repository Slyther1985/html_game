// Sistema de audio procedural sintetizado 100% mediante Web Audio API (sin archivos externos).

import {
  notaAFrecuencia,
  CATALOGO_PARTITURAS,
  IDS_PISTAS_CONDUCCION
} from './partituras.js';

const GANANCIA_MAESTRA = 0.72;

const PERFIL_MOTOR_GRAVE = {
  tipo1: 'sawtooth',
  tipo2: 'triangle',
  mult2: 0.5,
  freqBase: 36,
  freqMax: 92,
  filtroBase: 120,
  filtroMax: 290,
  volMin: 0.025,
  volMax: 0.065
};

const PERFIL_MOTOR_MEDIO = {
  tipo1: 'sawtooth',
  tipo2: 'triangle',
  mult2: 0.5,
  freqBase: 45,
  freqMax: 120,
  filtroBase: 120,
  filtroMax: 325,
  volMin: 0.025,
  volMax: 0.06
};

const PERFIL_MOTOR_DEPORTIVO = {
  tipo1: 'sawtooth',
  tipo2: 'triangle',
  mult2: 0.5,
  freqBase: 58,
  freqMax: 155,
  filtroBase: 120,
  filtroMax: 360,
  volMin: 0.025,
  volMax: 0.056
};

const PERFIL_MOTOR_MOTO = {
  tipo1: 'sawtooth',
  tipo2: 'square',
  mult2: 0.5,
  freqBase: 65,
  freqMax: 195,
  filtroBase: 140,
  filtroMax: 360,
  volMin: 0.024,
  volMax: 0.056,
  suavizadoFreq: 0.028,
  derrapeFreqBase: 780,
  derrapeFreqRango: 520,
  derrapeQ: 3.2
};

const PERFIL_MOTOR_BARCO = {
  tipo1: 'sawtooth',
  tipo2: 'triangle',
  mult2: 0.5,
  freqBase: 34,
  freqMax: 98,
  filtroBase: 110,
  filtroMax: 280,
  volMin: 0.025,
  volMax: 0.062,
  modulacionBorboteo: true,
  derrapeFreqBase: 420,
  derrapeFreqRango: 180,
  derrapeQ: 1.6
};

const PERFIL_MOTOR_AVION = {
  tipo1: 'triangle',
  tipo2: 'sawtooth',
  mult2: 0.5,
  freqBase: 48,
  freqMax: 145,
  filtroBase: 130,
  filtroMax: 350,
  volMin: 0.025,
  volMax: 0.058,
  derrapeFreqBase: 1050,
  derrapeFreqRango: 460,
  derrapeQ: 2.0
};

const PERFILES_MOTOR = {
  carroceria_muscle: PERFIL_MOTOR_GRAVE,
  carroceria_camioneta: PERFIL_MOTOR_GRAVE,
  carroceria_sedan: PERFIL_MOTOR_MEDIO,
  carroceria_buggy: PERFIL_MOTOR_MEDIO,
  carroceria_formula: PERFIL_MOTOR_DEPORTIVO,
  carroceria_deportivo: PERFIL_MOTOR_DEPORTIVO,
  moto_superbike: PERFIL_MOTOR_MOTO,
  moto_cross: PERFIL_MOTOR_MOTO,
  moto_chopper: PERFIL_MOTOR_MOTO,
  moto_scooter: PERFIL_MOTOR_MOTO,
  moto_cyber: PERFIL_MOTOR_MOTO,
  moto_caferacer: PERFIL_MOTOR_MOTO,
  barco_hidroplano: PERFIL_MOTOR_BARCO,
  barco_lancha: PERFIL_MOTOR_BARCO,
  barco_jetski: PERFIL_MOTOR_BARCO,
  barco_hovercraft: PERFIL_MOTOR_BARCO,
  barco_galeon: PERFIL_MOTOR_BARCO,
  barco_submarino: PERFIL_MOTOR_BARCO,
  avion_acrobatico: PERFIL_MOTOR_AVION,
  avion_jet: PERFIL_MOTOR_AVION,
  avion_steampunk: PERFIL_MOTOR_AVION,
  avion_stealth: PERFIL_MOTOR_AVION,
  avion_hidroavion: PERFIL_MOTOR_AVION,
  avion_espacial: PERFIL_MOTOR_AVION,
  defecto: PERFIL_MOTOR_MEDIO
};

// Escala pentatónica mayor ascendente Do5 -> Re5 -> Mi5 -> Sol5 -> La5 para CP 1..5
const NOTAS_CHECKPOINTS = [523.25, 587.33, 659.25, 783.99, 880.0];

let ctxAudio = null;
let gainMaestro = null;
let bufferRuidoBlanco = null;
let delayMusica = null;
let feedbackEco = null;
let filtroEco = null;
let envioEcoMusica = null;

// Nodos de motor continuo y derrape continuo
let oscMotor1 = null;
let oscMotor2 = null;
let filtroMotor = null;
let gainMotor = null;

let fuenteDerrape = null;
let filtroDerrape = null;
let gainDerrape = null;

let silenciado = false;
let modoMusicaActual = 'taller';
let indicePistaConduccion = 0;
let acumuladorSecuencia = 0;
let pasoSecuencia = 0;
let ultimoImpactoTs = -1;
let ultimoChasisMotor = '';
let listenersRegistrados = false;

/**
 * Crea un AudioBuffer de ruido blanco reutilizable para derrape e impactos.
 */
function crearBufferRuido(ctx) {
  const muestras = Math.floor(ctx.sampleRate * 1.5);
  const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < muestras; i++) {
    datos[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Inicializa o reanuda de forma segura el AudioContext y los nodos continuos tras gesto del usuario.
 */
function desbloquearAudio() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!ctxAudio) {
    ctxAudio = new AudioCtx();
    gainMaestro = ctxAudio.createGain();
    gainMaestro.gain.value = silenciado ? 0 : GANANCIA_MAESTRA;
    gainMaestro.connect(ctxAudio.destination);

    bufferRuidoBlanco = crearBufferRuido(ctxAudio);

    // Cadena de motor continuo: 2 osciladores -> BiquadFilter (lowpass) -> gainMotor -> gainMaestro
    oscMotor1 = ctxAudio.createOscillator();
    oscMotor2 = ctxAudio.createOscillator();
    filtroMotor = ctxAudio.createBiquadFilter();
    filtroMotor.type = 'lowpass';
    filtroMotor.frequency.value = 300;
    filtroMotor.Q.value = 1.6;

    gainMotor = ctxAudio.createGain();
    gainMotor.gain.value = 0;

    oscMotor1.connect(filtroMotor);
    oscMotor2.connect(filtroMotor);
    filtroMotor.connect(gainMotor);
    gainMotor.connect(gainMaestro);
    oscMotor1.start();
    oscMotor2.start();

    // Cadena de derrape continuo: ruido en bucle -> bandpass -> gainDerrape -> gainMaestro
    fuenteDerrape = ctxAudio.createBufferSource();
    fuenteDerrape.buffer = bufferRuidoBlanco;
    fuenteDerrape.loop = true;

    filtroDerrape = ctxAudio.createBiquadFilter();
    filtroDerrape.type = 'bandpass';
    filtroDerrape.frequency.value = 980;
    filtroDerrape.Q.value = 3.2;

    gainDerrape = ctxAudio.createGain();
    gainDerrape.gain.value = 0;

    fuenteDerrape.connect(filtroDerrape);
    filtroDerrape.connect(gainDerrape);
    gainDerrape.connect(gainMaestro);
    fuenteDerrape.start();

    // Bus de eco espacial estilo SNES SPC700 (envío auxiliar 22% para melodía y armonía)
    delayMusica = ctxAudio.createDelay(0.5);
    delayMusica.delayTime.value = 0.135;

    feedbackEco = ctxAudio.createGain();
    feedbackEco.gain.value = 0.24;

    filtroEco = ctxAudio.createBiquadFilter();
    filtroEco.type = 'lowpass';
    filtroEco.frequency.value = 2200;

    envioEcoMusica = ctxAudio.createGain();
    envioEcoMusica.gain.value = 0.22;

    envioEcoMusica.connect(delayMusica);
    delayMusica.connect(filtroEco);
    filtroEco.connect(gainMaestro);
    filtroEco.connect(feedbackEco);
    feedbackEco.connect(delayMusica);
  }

  if (ctxAudio.state === 'suspended' && typeof ctxAudio.resume === 'function') {
    ctxAudio.resume().catch(() => {});
  }

  return ctxAudio;
}

/**
 * Devuelve true solo cuando el AudioContext existe y está activo para sintetizar.
 */
function audioDisponible() {
  return Boolean(ctxAudio && ctxAudio.state !== 'closed' && gainMaestro);
}

/**
 * Helper compartido para programar un tono sintetizado de 16 bits con unison, vibrato LFO,
 * slide de entrada, envolvente dinámica de filtro paso bajo y envío opcional al bus de eco.
 */
function dispararTono({
  tipo = 'sine',
  freqInicio,
  freqFin = freqInicio,
  duracion = 0.14,
  volumen = 0.2,
  retardo = 0,
  freqCorte = null,
  sostener = false,
  unison = false,
  vibrato = false,
  slideEntrada = false,
  envolventeFiltro = false,
  enviarEco = false
}) {
  if (!audioDisponible() || silenciado) return;

  const t0 = ctxAudio.currentTime + retardo;
  const tStop = t0 + duracion + 0.03;
  const gain = ctxAudio.createGain();
  const volFinal = unison ? volumen * 0.72 : volumen;

  const tiempoAtaque = Math.min(sostener ? 0.016 : 0.012, duracion * 0.25);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volFinal, t0 + tiempoAtaque);
  if (sostener && duracion > 0.06) {
    gain.gain.linearRampToValueAtTime(volFinal * 0.76, t0 + duracion * 0.65);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);

  let nodoDestino = gain;
  if (freqCorte) {
    const filtro = ctxAudio.createBiquadFilter();
    filtro.type = 'lowpass';
    if (envolventeFiltro) {
      filtro.Q.setValueAtTime(2.4, t0);
      filtro.frequency.setValueAtTime(Math.min(12000, freqCorte * 2.2), t0);
      filtro.frequency.exponentialRampToValueAtTime(
        Math.max(40, freqCorte),
        t0 + Math.min(0.12, duracion * 0.85)
      );
    } else {
      filtro.frequency.setValueAtTime(freqCorte, t0);
    }
    filtro.connect(gain);
    nodoDestino = filtro;
  }

  const configurarOsc = (detuneCents) => {
    const osc = ctxAudio.createOscillator();
    osc.type = tipo;
    if (osc.detune && detuneCents !== 0) {
      osc.detune.setValueAtTime(detuneCents, t0);
    }
    if (slideEntrada && freqFin === freqInicio) {
      osc.frequency.setValueAtTime(Math.max(20, freqInicio * 0.944), t0);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freqInicio),
        t0 + Math.min(0.028, duracion * 0.45)
      );
    } else {
      osc.frequency.setValueAtTime(Math.max(20, freqInicio), t0);
      if (freqFin !== freqInicio) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqFin), t0 + duracion);
      }
    }
    osc.connect(nodoDestino);
    osc.start(t0);
    osc.stop(tStop);
    return osc;
  };

  const oscPrincipal = configurarOsc(unison ? -9 : 0);
  const oscUnison = unison ? configurarOsc(9) : null;

  if (vibrato && duracion > 0.22) {
    const lfo = ctxAudio.createOscillator();
    const gainLfo = ctxAudio.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6.0, t0);
    gainLfo.gain.setValueAtTime(4.5, t0);
    lfo.connect(gainLfo);
    gainLfo.connect(oscPrincipal.frequency);
    if (oscUnison) gainLfo.connect(oscUnison.frequency);
    lfo.start(t0);
    lfo.stop(tStop);
  }

  gain.connect(gainMaestro);
  if (enviarEco && envioEcoMusica) {
    gain.connect(envioEcoMusica);
  }
}

/**
 * Emite una ráfaga de ruido blanco filtrada para capas de percusión de 16 bits.
 */
function dispararRuidoPercusion(tipoFiltro, freq, Q, duracion, volumen, t0) {
  if (!bufferRuidoBlanco) return;
  const src = ctxAudio.createBufferSource();
  src.buffer = bufferRuidoBlanco;

  const filtro = ctxAudio.createBiquadFilter();
  filtro.type = tipoFiltro;
  filtro.frequency.setValueAtTime(freq, t0);
  if (Q !== null && filtro.Q) filtro.Q.setValueAtTime(Q, t0);

  const gain = ctxAudio.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volumen, t0 + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);

  src.connect(filtro);
  filtro.connect(gain);
  gain.connect(gainMaestro);
  src.start(t0);
  src.stop(t0 + duracion + 0.015);
}

/**
 * Sintetiza batería de 16 bits con pegada: bombo ('K'), caja ('S'),
 * charles cerrado ('H'), charles abierto ('O') y tom de redoble ('T').
 */
function reproducirPercusionSecuenciador(simbolo) {
  if (!audioDisponible() || silenciado || !simbolo || simbolo === '.') return;

  const t0 = ctxAudio.currentTime;
  if (simbolo === 'K') {
    dispararTono({ tipo: 'sine', freqInicio: 165, freqFin: 34, duracion: 0.13, volumen: 0.24 });
    dispararTono({ tipo: 'triangle', freqInicio: 140, freqFin: 34, duracion: 0.11, volumen: 0.14 });
    dispararRuidoPercusion('highpass', 1800, null, 0.015, 0.08, t0);
    return;
  }
  if (simbolo === 'S') {
    dispararTono({ tipo: 'triangle', freqInicio: 220, freqFin: 110, duracion: 0.09, volumen: 0.14 });
    dispararRuidoPercusion('bandpass', 1600, 1.1, 0.14, 0.18, t0);
    return;
  }
  if (simbolo === 'H') {
    dispararRuidoPercusion('highpass', 6500, null, 0.045, 0.075, t0);
    return;
  }
  if (simbolo === 'O') {
    dispararRuidoPercusion('highpass', 5800, null, 0.18, 0.095, t0);
    return;
  }
  if (simbolo === 'T') {
    dispararTono({ tipo: 'triangle', freqInicio: 260, freqFin: 90, duracion: 0.12, volumen: 0.19 });
  }
}

/**
 * Registra los listeners globales para desbloquear Web Audio API al primer gesto del usuario.
 */
export function inicializarAudioInteractivo() {
  if (typeof window === 'undefined' || listenersRegistrados) return;
  listenersRegistrados = true;

  const activar = () => {
    desbloquearAudio();
  };
  window.addEventListener('pointerdown', activar, { capture: true, passive: true });
  window.addEventListener('keydown', activar, { capture: true, passive: true });
}

/**
 * Alterna el silencio maestro aplicando una transición suave sobre gainMaestro.
 * Devuelve true si queda silenciado o false si está activo.
 */
export function alternarSilencio() {
  desbloquearAudio();
  silenciado = !silenciado;

  if (audioDisponible()) {
    const ahora = ctxAudio.currentTime;
    gainMaestro.gain.setTargetAtTime(silenciado ? 0 : GANANCIA_MAESTRA, ahora, 0.035);
    if (silenciado && gainDerrape) {
      gainDerrape.gain.setTargetAtTime(0, ahora, 0.02);
    }
  }
  return silenciado;
}

/**
 * Cambia el estilo de música ambiental y atenúa motor/derrape al regresar al Modo Taller.
 */
export function cambiarModoMusical(modo) {
  modoMusicaActual = modo === 'conduccion' ? 'conduccion' : 'taller';
  acumuladorSecuencia = 0;
  pasoSecuencia = 0;

  if (!audioDisponible()) return;
  const ahora = ctxAudio.currentTime;
  if (modoMusicaActual === 'taller') {
    if (gainMotor) gainMotor.gain.setTargetAtTime(0, ahora, 0.05);
    if (gainDerrape) gainDerrape.gain.setTargetAtTime(0, ahora, 0.03);
  }
}

/**
 * Actualiza en tiempo real las RPM y filtro del motor continuo según el chasis, velocidad y salto.
 */
export function actualizarAudioMotor(velocidad, velMax, idCarroceria, enAire) {
  if (!audioDisponible()) return;

  const ahora = ctxAudio.currentTime;
  if (modoMusicaActual === 'taller' || silenciado) {
    gainMotor.gain.setTargetAtTime(0, ahora, 0.05);
    return;
  }

  const perfil = PERFILES_MOTOR[idCarroceria] || PERFILES_MOTOR.defecto;
  if (ultimoChasisMotor !== idCarroceria) {
    oscMotor1.type = perfil.tipo1;
    oscMotor2.type = perfil.tipo2;
    ultimoChasisMotor = idCarroceria;
  }

  const ratioVel = Math.min(1.0, Math.abs(velocidad) / Math.max(1, velMax));
  const bonoAire = enAire ? 1.06 : 1.0;
  const modBorboteo = perfil.modulacionBorboteo ? 1 + Math.sin(ahora * 14.0) * 0.045 : 1.0;
  const freq1 = (perfil.freqBase + (perfil.freqMax - perfil.freqBase) * ratioVel) * bonoAire * modBorboteo;
  const freqCorte = Math.min(
    360,
    Math.max(110, (perfil.filtroBase + (perfil.filtroMax - perfil.filtroBase) * ratioVel) * modBorboteo)
  );
  const suavizado = perfil.suavizadoFreq || 0.045;
  const volMin = perfil.volMin || 0.025;
  const volMax = Math.min(0.065, perfil.volMax || 0.06);
  const volObjetivo = volMin + (volMax - volMin) * ratioVel;

  oscMotor1.frequency.setTargetAtTime(freq1, ahora, suavizado);
  oscMotor2.frequency.setTargetAtTime(freq1 * (perfil.mult2 || 0.5), ahora, suavizado);
  filtroMotor.frequency.setTargetAtTime(freqCorte, ahora, 0.05);
  gainMotor.gain.setTargetAtTime(volObjetivo, ahora, 0.05);
}

/**
 * Controla el generador continuo de ruido blanco filtrado para derrape, spray acuático o ráfaga aérea.
 */
export function actualizarAudioDerrape(enDerrape, ratioVelocidad, idCarroceria = '') {
  if (!audioDisponible()) return;
  const ahora = ctxAudio.currentTime;

  if (!enDerrape || silenciado || modoMusicaActual === 'taller') {
    gainDerrape.gain.setTargetAtTime(0, ahora, 0.035);
    return;
  }

  const perfil = PERFILES_MOTOR[idCarroceria] || PERFILES_MOTOR.defecto;
  const r = Math.max(0.2, Math.min(1.3, ratioVelocidad));
  const freqBase = perfil.derrapeFreqBase || 750;
  const freqRango = perfil.derrapeFreqRango || 520;
  const qObjetivo = perfil.derrapeQ || 3.5;

  if (filtroDerrape.Q) {
    filtroDerrape.Q.setTargetAtTime(qObjetivo, ahora, 0.04);
  }
  filtroDerrape.frequency.setTargetAtTime(freqBase + freqRango * r, ahora, 0.04);
  gainDerrape.gain.setTargetAtTime(0.06 + 0.08 * Math.min(1, r), ahora, 0.03);
}

/**
 * Reproduce un barrido electrónico ascendente para Boost Pads o un silbido corto para Mini-Turbo.
 */
export function reproducirTurbo(esPlataforma = false) {
  if (!audioDisponible() || silenciado) return;

  if (esPlataforma) {
    dispararTono({ tipo: 'sawtooth', freqInicio: 220, freqFin: 880, duracion: 0.36, volumen: 0.16, freqCorte: 2400 });
    dispararTono({ tipo: 'sine', freqInicio: 440, freqFin: 1320, duracion: 0.32, volumen: 0.14 });
  } else {
    dispararTono({ tipo: 'triangle', freqInicio: 340, freqFin: 760, duracion: 0.22, volumen: 0.15 });
  }
}

/**
 * Reproduce un golpe acústico escalado por velocidad al chocar o al aterrizar de un salto.
 */
export function reproducirImpacto(intensidad = 0.6, tipo = 'obstaculo') {
  if (!audioDisponible() || silenciado) return;

  const ahora = ctxAudio.currentTime;
  if (ahora - ultimoImpactoTs < 0.075 && tipo !== 'aterrizaje') return;
  ultimoImpactoTs = ahora;

  const fuerza = Math.max(0.18, Math.min(1.0, intensidad));
  const esAterrizaje = tipo === 'aterrizaje';

  dispararTono({
    tipo: esAterrizaje ? 'sine' : 'triangle',
    freqInicio: esAterrizaje ? 88 : 135,
    freqFin: esAterrizaje ? 32 : 40,
    duracion: esAterrizaje ? 0.16 : 0.13,
    volumen: (esAterrizaje ? 0.20 : 0.24) * fuerza
  });

  if (bufferRuidoBlanco) {
    const src = ctxAudio.createBufferSource();
    src.buffer = bufferRuidoBlanco;
    const filtro = ctxAudio.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.setValueAtTime(tipo === 'obstaculo' ? 920 : 480, ahora);
    filtro.Q.setValueAtTime(1.4, ahora);

    const g = ctxAudio.createGain();
    const durRuido = esAterrizaje ? 0.09 : 0.12;
    g.gain.setValueAtTime(0.18 * fuerza, ahora);
    g.gain.exponentialRampToValueAtTime(0.0001, ahora + durRuido);

    src.connect(filtro);
    filtro.connect(g);
    g.connect(gainMaestro);
    src.start(ahora);
    src.stop(ahora + durRuido + 0.02);
  }
}

/**
 * Emite un tono cristalino ascendente en escala del CP 1 al CP 5.
 */
export function reproducirCheckpoint(indice) {
  const idxSeguro = Math.max(0, Math.min(NOTAS_CHECKPOINTS.length - 1, indice));
  const freq = NOTAS_CHECKPOINTS[idxSeguro];
  dispararTono({ tipo: 'triangle', freqInicio: freq, freqFin: freq * 1.01, duracion: 0.24, volumen: 0.18 });
  dispararTono({ tipo: 'sine', freqInicio: freq * 2, duracion: 0.18, volumen: 0.07, retardo: 0.02 });
}

/**
 * Reproduce acorde de vuelta completada o fanfarria de 4 notas ascendentes si hay nuevo récord.
 */
export function reproducirMeta(esRecord = false) {
  if (esRecord) {
    const fanfarria = [523.25, 659.25, 783.99, 1046.5];
    fanfarria.forEach((freq, i) => {
      dispararTono({
        tipo: 'triangle',
        freqInicio: freq,
        duracion: i === 3 ? 0.42 : 0.16,
        volumen: 0.20,
        retardo: i * 0.095
      });
    });
  } else {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      dispararTono({
        tipo: 'triangle',
        freqInicio: freq,
        duracion: 0.28,
        volumen: 0.14,
        retardo: i * 0.03
      });
    });
  }
}

/**
 * Clic-pop mecánico ascendente al equipar una pieza o carrocería en el taller.
 */
export function reproducirEncajePieza() {
  dispararTono({ tipo: 'triangle', freqInicio: 240, freqFin: 620, duracion: 0.09, volumen: 0.18 });
  dispararTono({ tipo: 'sine', freqInicio: 780, freqFin: 980, duracion: 0.07, volumen: 0.10, retardo: 0.04 });
}

/**
 * Tono descendente corto al desmontar una pieza del vehículo.
 */
export function reproducirQuitarPieza() {
  dispararTono({ tipo: 'sine', freqInicio: 440, freqFin: 180, duracion: 0.11, volumen: 0.17 });
}

/**
 * Pulso brillante suave al cambiar el color de la carrocería.
 */
export function reproducirCambioColor() {
  dispararTono({ tipo: 'sine', freqInicio: 520, freqFin: 780, duracion: 0.11, volumen: 0.14 });
}

/**
 * Selecciona una pista de conducción específica por ID (usado al cambiar de escenario).
 */
export function seleccionarPistaMusicalPorId(idPista) {
  const idx = IDS_PISTAS_CONDUCCION.indexOf(idPista);
  if (idx >= 0) {
    indicePistaConduccion = idx;
    acumuladorSecuencia = 0;
    pasoSecuencia = 0;
  }
  const idActual = IDS_PISTAS_CONDUCCION[indicePistaConduccion];
  const partitura = CATALOGO_PARTITURAS[idActual];
  return partitura ? partitura.titulo : idActual;
}

/**
 * Alterna cíclicamente entre las partituras de conducción y devuelve el título de la pista activa.
 */
export function cambiarPistaConduccion() {
  desbloquearAudio();
  indicePistaConduccion = (indicePistaConduccion + 1) % IDS_PISTAS_CONDUCCION.length;
  acumuladorSecuencia = 0;
  pasoSecuencia = 0;

  const idPista = IDS_PISTAS_CONDUCCION[indicePistaConduccion];
  const partitura = CATALOGO_PARTITURAS[idPista];
  dispararTono({ tipo: 'sine', freqInicio: 587.33, freqFin: 880.0, duracion: 0.11, volumen: 0.12 });
  return partitura ? partitura.titulo : idPista;
}

/**
 * Avanza el secuenciador multipista leyendo los canales melodia, armonia, bajo y percusion.
 * En Modo Conducción acelera el tempo +12% BPM cuando el vehículo está en Boost Pad.
 */
export function actualizarMusicaAmbiental(dt, modoJuego, enTurboBoost = false) {
  if (modoJuego && modoJuego !== modoMusicaActual) {
    cambiarModoMusical(modoJuego);
  }
  if (!audioDisponible() || ctxAudio.state !== 'running' || silenciado) return;

  const partitura =
    modoMusicaActual === 'taller'
      ? CATALOGO_PARTITURAS.taller_juguetes
      : CATALOGO_PARTITURAS[IDS_PISTAS_CONDUCCION[indicePistaConduccion]];

  if (!partitura || !partitura.canales) return;

  const factorBoost = modoMusicaActual === 'conduccion' && enTurboBoost ? 1.12 : 1.0;
  const bpmEfectivo = partitura.bpm * factorBoost;
  const intervaloPaso = 60 / (bpmEfectivo * (partitura.subdivision || 2));

  acumuladorSecuencia += dt;
  if (acumuladorSecuencia < intervaloPaso) return;
  acumuladorSecuencia -= intervaloPaso;
  if (acumuladorSecuencia > intervaloPaso * 2) acumuladorSecuencia = 0;

  const canales = partitura.canales;
  const totalPasos = canales.melodia.length;
  const paso = pasoSecuencia % totalPasos;
  pasoSecuencia = (pasoSecuencia + 1) % totalPasos;

  ['melodia', 'armonia', 'bajo'].forEach((nombreCanal) => {
    const patron = canales[nombreCanal];
    const conf = partitura.instrumentos[nombreCanal];
    if (!patron || !conf) return;

    const token = patron[paso];
    if (!token || token === '_' || token === '~') return;

    // Inspecciona cuántos pasos consecutivos sostienen la nota con '~'
    let pasosLigados = 1;
    while (paso + pasosLigados < totalPasos && patron[paso + pasosLigados] === '~') {
      pasosLigados++;
    }

    const duracionNota =
      pasosLigados > 1
        ? pasosLigados * intervaloPaso * 0.95
        : (conf.duracion || intervaloPaso * 0.9) / factorBoost;

    const notasAcorde = String(token).split('/');
    const volumenBase = (conf.volumen * 1.4) / Math.pow(notasAcorde.length, 0.35);
    const esCanalEco = nombreCanal === 'melodia' || nombreCanal === 'armonia';

    notasAcorde.forEach((subNota, idxNota) => {
      const freq = notaAFrecuencia(subNota);
      if (freq > 0) {
        dispararTono({
          tipo: conf.tipo,
          freqInicio: freq,
          duracion: duracionNota,
          volumen: volumenBase,
          retardo: notasAcorde.length > 1 ? idxNota * 0.016 : 0,
          freqCorte: conf.filtro || null,
          sostener: true,
          unison: Boolean(conf.unison),
          vibrato: Boolean(conf.vibrato),
          slideEntrada: Boolean(conf.slideEntrada && idxNota === 0),
          envolventeFiltro: Boolean(conf.envolventeFiltro || nombreCanal === 'bajo'),
          enviarEco: esCanalEco
        });
      }
    });
  });

  if (canales.percusion) {
    reproducirPercusionSecuenciador(canales.percusion[paso]);
  }
}
