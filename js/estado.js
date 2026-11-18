import { PALETA_COLORES } from './constantes.js';

const PIEZAS_COCHE_INICIAL = {
  rueda_di: 'rueda_clasica',
  rueda_dd: 'rueda_clasica',
  rueda_ti: 'rueda_clasica',
  rueda_td: 'rueda_clasica',
  acc_techo: 'acc_aleron'
};

export const estadoCarro = {
  idHabitacion: 'habitacion_andy',
  claseVehiculo: 'coche',
  modoJuego: 'taller', // 'taller' | 'conduccion'
  modoCamara: 'tercera', // 'tercera' | 'cabina'
  idCarroceria: 'carroceria_sedan',
  colorHex: PALETA_COLORES[0].hex,
  idColor: PALETA_COLORES[0].id,
  piezasEnEnganches: { ...PIEZAS_COCHE_INICIAL },
  configuracionesPorClase: {
    coche: {
      idCarroceria: 'carroceria_sedan',
      colorHex: PALETA_COLORES[0].hex,
      idColor: PALETA_COLORES[0].id,
      piezasEnEnganches: { ...PIEZAS_COCHE_INICIAL }
    },
    moto: {
      idCarroceria: 'moto_superbike',
      colorHex: PALETA_COLORES[1].hex,
      idColor: PALETA_COLORES[1].id,
      piezasEnEnganches: {
        rueda_delantera: 'rueda_moto_slick',
        rueda_trasera: 'rueda_moto_slick',
        acc_escape: 'acc_moto_turbina'
      }
    },
    barco: {
      idCarroceria: 'barco_hidroplano',
      colorHex: PALETA_COLORES[6].hex,
      idColor: PALETA_COLORES[6].id,
      piezasEnEnganches: {
        propulsor_popa: 'prop_helice_bronce',
        timon_popa: 'timon_doble_aleta',
        acc_cubierta: 'acc_barco_spoiler'
      }
    },
    avion: {
      idCarroceria: 'avion_acrobatico',
      colorHex: PALETA_COLORES[0].hex,
      idColor: PALETA_COLORES[0].id,
      piezasEnEnganches: {
        alas_principales: 'ala_recta_acrobatica',
        motor_frontal: 'motor_helice_bipala',
        cola_timon: 'cola_clasica'
      }
    }
  },
  modoSimetriaEnganches: true,
  get modoCuatroRuedas() {
    return this.modoSimetriaEnganches;
  },
  set modoCuatroRuedas(valor) {
    this.modoSimetriaEnganches = Boolean(valor);
  },
  engancheSeleccionadoId: null,
  engancheHoverId: null
};

// Estado físico del vehículo en la habitación
export const fisicaCarro = {
  x: 0.0,
  y: 0.02,
  z: 0.0,
  altitudVuelo: 0.0,
  velocidad: 0.0,
  velY: 0.0,
  yaw: 0.0,              // Orientación horizontal del morro en radianes
  anguloMovimiento: 0.0, // Dirección real del vector de velocidad (derrape)
  pitch: 0.0,            // Inclinación longitudinal en rampas y saltos
  roll: 0.0,             // Inclinación lateral en curvas
  anguloVolante: 0,      // Giro visual de las ruedas delanteras
  rotacionRodadura: 0,
  enAire: false,
  derrapando: false,
  tiempoDerrape: 0.0,
  tiempoDerrapeActivo: 0.0,
  enfriamientoDerrape: 0.0,
  tiempoTurbo: 0.0,
  tiempoMiniTurbo: 0.0
};

export const teclasConduccion = {};

export const nodosEnganches = {};
export const listaColisionadoresEnganches = [];
export const animacionesActivas = [];
export const chorrosChispasActivos = [];

// Lista de mallas conducibles para el cálculo exacto de altura y pendiente con Raycaster
export const mallasSuperficieConducible = [];
// Lista de obstáculos fijos (muebles y pilares) con colisión en el suelo
export const obstaculosHabitacion = [];

// Nuevas listas reactivas para Boost Pads, obstáculos derribables, barreras móviles y trampas de calzada
export const plataformasTurbo = [];
export const obstaculosDinamicos = [];
export const obstaculosMoviles = [];
export const trampasPista = [];

const CLAVE_RECORD_LEGACY = 'record_vuelta_pista_3d';

/**
 * Construye la clave única en localStorage para el récord por habitación y clase de vehículo.
 */
export function obtenerClaveRecord(idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo) {
  return `record_vuelta_${idHabitacion}_${claseVehiculo}`;
}

function leerRecordLocalStorage(idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const clave = obtenerClaveRecord(idHabitacion, claseVehiculo);
    let guardado = parseFloat(localStorage.getItem(clave));
    if ((Number.isNaN(guardado) || guardado <= 0) && idHabitacion === 'habitacion_andy' && claseVehiculo === 'coche') {
      guardado = parseFloat(localStorage.getItem(CLAVE_RECORD_LEGACY));
    }
    if (!Number.isNaN(guardado) && guardado > 0) {
      return guardado;
    }
  } catch (e) {
    // Ignora restricciones de almacenamiento local
  }
  return null;
}

function guardarRecordLocalStorage(tiempo, idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(obtenerClaveRecord(idHabitacion, claseVehiculo), String(tiempo));
    if (idHabitacion === 'habitacion_andy' && claseVehiculo === 'coche') {
      localStorage.setItem(CLAVE_RECORD_LEGACY, String(tiempo));
    }
  } catch (e) {
    // Ignora errores de almacenamiento local
  }
}

// Estado del cronómetro de vueltas y checkpoints anti-trampas
export const estadoCronometro = {
  vueltaActiva: false,
  tiempoActual: 0,
  ultimaVuelta: null,
  mejorVuelta: leerRecordLocalStorage(estadoCarro.idHabitacion, estadoCarro.claseVehiculo),
  checkpointActual: 0,
  totalCheckpoints: 5,
  avisoRecord: 0,
  obtenerClaveRecord,
  leerRecord: leerRecordLocalStorage,
  guardarRecord: guardarRecordLocalStorage
};

export const checkpointsPista = [];

// Estado de red y mapa de instancias remotas (Multijugador Fase 1)
export const estadoRed = {
  conectado: false,
  modo: 'solo',
  codigoSala: null,
  esAnfitrion: false,
  miId: null,
  apodo: 'Piloto',
  slotParrilla: 0
};

export const jugadoresRemotos = new Map();
