import { bancoTexturas, liberarObjeto3D } from './recursos.js';
import { escena } from './escenario.js';
import { TABLA_CARROCERIAS, TABLA_PIEZAS } from './catalogoPiezas.js';
import {
  estadoCarro,
  nodosEnganches,
  listaColisionadoresEnganches,
  animacionesActivas,
  chorrosChispasActivos,
  jugadoresRemotos
} from './estado.js';
import { reproducirEncajePieza, reproducirQuitarPieza } from './audio.js';

export const grupoJuguete = new THREE.Group();
grupoJuguete.rotation.order = 'YZX'; // Yaw (Y), luego Pitch de rampa (Z), luego Roll (X)
grupoJuguete.position.set(0, 0.02, 0);
escena.add(grupoJuguete);

let mallaCarroceriaActual = null;

/**
 * Lanza un chorro de partículas con disc.png y mezcla aditiva en el punto indicado.
 * Por qué: celebra encajes/saltos y simula chispas o espuma acuática según la clase activa.
 */
export function dispararChispasEnEnganche(posicionMundo, colorHex = 0xffd166) {
  const numChispas = 24;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(numChispas * 3);
  const vels = [];

  for (let i = 0; i < numChispas; i++) {
    pos[i * 3] = posicionMundo.x;
    pos[i * 3 + 1] = posicionMundo.y;
    pos[i * 3 + 2] = posicionMundo.z;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const rapidez = 0.6 + Math.random() * 1.3;
    vels.push({
      vx: Math.cos(theta) * Math.sin(phi) * rapidez,
      vy: Math.abs(Math.cos(phi)) * rapidez + 0.4,
      vz: Math.sin(theta) * Math.sin(phi) * rapidez
    });
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: bancoTexturas.discoParticula,
    color: colorHex,
    size: 0.11,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const puntos = new THREE.Points(geo, mat);
  escena.add(puntos);
  chorrosChispasActivos.push({ puntos, vels, edad: 0, duracion: 0.65 });
}

/**
 * Anima la salida de una pieza retirada (rebota y se desvanece) y libera su memoria GPU.
 * Por qué: cumple el requisito B4 de animación y limpieza de recursos.
 */
export function animarSalidaYLiberar(mallaSaliente, grupoPadre) {
  if (!mallaSaliente) return;
  const posMundial = new THREE.Vector3();
  const quatMundial = new THREE.Quaternion();
  const escMundial = new THREE.Vector3();
  mallaSaliente.getWorldPosition(posMundial);
  mallaSaliente.getWorldQuaternion(quatMundial);
  mallaSaliente.getWorldScale(escMundial);

  grupoPadre.remove(mallaSaliente);
  escena.add(mallaSaliente);
  mallaSaliente.position.copy(posMundial);
  mallaSaliente.quaternion.copy(quatMundial);
  mallaSaliente.scale.copy(escMundial);

  mallaSaliente.traverse((h) => {
    if (h.isMesh && h.material) {
      h.material = h.material.clone();
      h.material.transparent = true;
    }
  });

  animacionesActivas.push({
    tipo: 'salida',
    objeto: mallaSaliente,
    yInicial: posMundial.y,
    escalaInicial: escMundial.clone(),
    progreso: 0,
    duracion: 0.38
  });
}

/**
 * Aplica una animación de entrada con escala elástica a una pieza recién colocada.
 * Por qué: da respuesta táctil inmediata cuando el usuario encaja una pieza (B4).
 */
export function animarEntradaElastica(objeto, escalaObjetivo) {
  if (!objeto) return;
  const destino = escalaObjetivo ? escalaObjetivo.clone() : new THREE.Vector3(1, 1, 1);
  objeto.scale.set(0.01, 0.01, 0.01);
  animacionesActivas.push({
    tipo: 'entrada',
    objeto,
    escalaDestino: destino,
    progreso: 0,
    duracion: 0.45
  });
}

function sincronizarConfiguracionClase() {
  if (!estadoCarro.configuracionesPorClase) {
    estadoCarro.configuracionesPorClase = {};
  }
  estadoCarro.configuracionesPorClase[estadoCarro.claseVehiculo] = {
    idCarroceria: estadoCarro.idCarroceria,
    colorHex: estadoCarro.colorHex,
    idColor: estadoCarro.idColor,
    piezasEnEnganches: { ...estadoCarro.piezasEnEnganches }
  };
}

/**
 * Coloca o quita una pieza en un enganche verificando compatibilidad de tipo y clase de vehículo.
 * Por qué: mantiene la integridad del sistema de enganches y prepara las piezas para animarse.
 */
export function colocarPiezaEnEnganche(idEnganche, idPieza, conEfectos = true) {
  const nodo = nodosEnganches[idEnganche];
  if (!nodo) return;

  const defPieza = TABLA_PIEZAS.find((p) => p.id === idPieza);
  if (defPieza) {
    if (defPieza.tipoEnganche !== nodo.definicion.tipo) return;
    if (
      Array.isArray(defPieza.clasesCompatibles) &&
      !defPieza.clasesCompatibles.includes(estadoCarro.claseVehiculo)
    ) {
      return;
    }
  }

  if (nodo.mallaPieza) {
    if (conEfectos) {
      animarSalidaYLiberar(nodo.mallaPieza, nodo.grupoContenedor);
    } else {
      nodo.grupoContenedor.remove(nodo.mallaPieza);
      liberarObjeto3D(nodo.mallaPieza);
    }
    nodo.mallaPieza = null;
  }

  if (!defPieza || defPieza.esVacio === true) {
    estadoCarro.piezasEnEnganches[idEnganche] = null;
    sincronizarConfiguracionClase();
    if (conEfectos) {
      const posChispa = new THREE.Vector3();
      nodo.grupoContenedor.getWorldPosition(posChispa);
      dispararChispasEnEnganche(posChispa);
      reproducirQuitarPieza();
    }
    return;
  }

  const nuevaMalla = defPieza.crear(estadoCarro.colorHex);
  if (nuevaMalla) {
    nodo.grupoContenedor.add(nuevaMalla);
    nodo.mallaPieza = nuevaMalla;
    estadoCarro.piezasEnEnganches[idEnganche] = idPieza;
    sincronizarConfiguracionClase();

    if (conEfectos) {
      animarEntradaElastica(nuevaMalla, new THREE.Vector3(1, 1, 1));
      const posChispa = new THREE.Vector3();
      nodo.grupoContenedor.getWorldPosition(posChispa);
      dispararChispasEnEnganche(posChispa);
      reproducirEncajePieza();
    }
  }
}

/**
 * Construye una instancia 3D completa e independiente de cualquier vehículo a partir de configuración.
 * Por qué: permite ensamblar tanto al jugador local como a los vehículos remotos sin mutar estado global.
 */
export function ensamblarGrupoVehiculo(config = {}) {
  const idObjetivo = config.carroceria || config.idCarroceria;
  const defBase =
    (idObjetivo ? TABLA_CARROCERIAS.find((b) => b.id === idObjetivo) : null) ||
    (config.clase ? TABLA_CARROCERIAS.find((b) => b.clase === config.clase) : null) ||
    TABLA_CARROCERIAS[0];
  const claseEfectiva = defBase.clase || config.clase || 'coche';
  const colorEfectivo = config.color ?? config.colorHex ?? 0xff1e27;
  const mapaPiezas = config.piezas || config.piezasEnEnganches || {};
  const conIndicadores = Boolean(config.conIndicadores);

  const grupoRaiz = config.grupoDestino || new THREE.Group();
  if (!config.grupoDestino) {
    grupoRaiz.rotation.order = 'YZX';
  }

  const mallaChasis = defBase.crear(colorEfectivo);
  grupoRaiz.add(mallaChasis);

  const pivotesRuedas = [];
  let helice = null;
  let timon = null;
  const nodosPorEnganche = {};

  defBase.enganches.forEach((eng) => {
    const grupoEng = new THREE.Group();
    grupoEng.position.fromArray(eng.posicion);
    grupoEng.rotation.fromArray(eng.rotacion);
    grupoEng.scale.fromArray(eng.escala);
    grupoRaiz.add(grupoEng);

    let anillo = null;
    let colisionador = null;
    if (conIndicadores) {
      const geoAnillo = new THREE.TorusGeometry(0.15, 0.018, 12, 32);
      const matAnillo = new THREE.MeshStandardMaterial({
        color: 0xffbe0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.0
      });
      anillo = new THREE.Mesh(geoAnillo, matAnillo);
      if (Array.isArray(eng.orientacionAnillo)) {
        if (anillo.rotation.fromArray) {
          anillo.rotation.fromArray(eng.orientacionAnillo);
        } else {
          anillo.rotation.set(...eng.orientacionAnillo);
        }
      } else if (eng.tipo === 'accesorio') {
        anillo.rotation.x = Math.PI / 2;
      }
      grupoEng.add(anillo);

      colisionador = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      colisionador.userData.idEnganche = eng.id;
      grupoEng.add(colisionador);
    }

    const idPieza = mapaPiezas[eng.id];
    const defPieza = idPieza ? TABLA_PIEZAS.find((p) => p.id === idPieza) : null;
    let mallaPieza = null;
    if (
      defPieza &&
      defPieza.esVacio !== true &&
      defPieza.tipoEnganche === eng.tipo &&
      (!Array.isArray(defPieza.clasesCompatibles) || defPieza.clasesCompatibles.includes(claseEfectiva))
    ) {
      mallaPieza = defPieza.crear(colorEfectivo);
      if (mallaPieza) {
        grupoEng.add(mallaPieza);
      }
    }

    const nodo = {
      definicion: eng,
      rotacionBaseY: eng.rotacion[1],
      grupoContenedor: grupoEng,
      anilloIndicador: anillo,
      colisionador,
      mallaPieza
    };
    nodosPorEnganche[eng.id] = nodo;

    const rol = eng.rolAnimacion || (eng.tipo === 'rueda' ? 'rueda_motriz' : 'estatico');
    if (rol === 'rueda_motriz' || eng.tipo === 'rueda' || eng.tipo === 'rueda_moto') {
      pivotesRuedas.push(nodo);
    } else if ((rol === 'helice_z' || rol === 'helice_x') && !helice) {
      helice = mallaPieza || null;
    } else if (rol === 'timon_y' && !timon) {
      timon = grupoEng;
    }
  });

  return {
    grupoRaiz,
    mallaChasis,
    pivotesRuedas,
    helice,
    timon,
    alturaPiso: defBase.alturaPiso ?? 0.025,
    nodosPorEnganche
  };
}

/**
 * Libera recursos GPU y retira de la escena el vehículo remoto identificado por `id`.
 */
export function destruirVehiculoRemoto(id) {
  const remoto = jugadoresRemotos.get(id);
  if (!remoto) return false;

  const grupo = remoto.grupoRaiz || remoto.grupo || (remoto.isObject3D ? remoto : null);
  if (grupo) {
    if (grupo.parent) {
      grupo.parent.remove(grupo);
    } else {
      escena.remove(grupo);
    }
    liberarObjeto3D(grupo);
  }
  jugadoresRemotos.delete(id);
  return true;
}

/**
 * Construye o actualiza el chasis base y recoloca las piezas compatibles en sus enganches.
 * Por qué: garantiza que al cambiar de chasis o clase se sincronicen los enganches sin llaves huérfanas.
 */
export function construirOActualizarCarroceria(idNuevaCarroceria, conEfectos = true, esCambioColor = false) {
  const defBase = TABLA_CARROCERIAS.find((b) => b.id === idNuevaCarroceria) || TABLA_CARROCERIAS[0];
  const claseAnterior = estadoCarro.claseVehiculo;
  const nuevaClase = defBase.clase || 'coche';

  estadoCarro.idCarroceria = defBase.id;
  estadoCarro.claseVehiculo = nuevaClase;

  // Al cambiar de clase, restaura las piezas previamente guardadas para esa clase antes de validar
  if (!esCambioColor && nuevaClase !== claseAnterior) {
    const confGuardada = estadoCarro.configuracionesPorClase?.[nuevaClase];
    if (confGuardada && confGuardada.piezasEnEnganches) {
      Object.keys(estadoCarro.piezasEnEnganches).forEach((k) => {
        delete estadoCarro.piezasEnEnganches[k];
      });
      Object.assign(estadoCarro.piezasEnEnganches, confGuardada.piezasEnEnganches);
    }
  }

  // Sincroniza dinámicamente las llaves de piezasEnEnganches con los enganches del chasis activo
  const idsEnganchesActivos = new Set(defBase.enganches.map((eng) => eng.id));
  defBase.enganches.forEach((eng) => {
    const idActual = estadoCarro.piezasEnEnganches[eng.id];
    const pieza = idActual ? TABLA_PIEZAS.find((p) => p.id === idActual) : null;
    const compatible =
      pieza &&
      !pieza.esVacio &&
      pieza.tipoEnganche === eng.tipo &&
      (!Array.isArray(pieza.clasesCompatibles) ||
        pieza.clasesCompatibles.includes(estadoCarro.claseVehiculo));
    if (!compatible) {
      estadoCarro.piezasEnEnganches[eng.id] = null;
    }
  });
  Object.keys(estadoCarro.piezasEnEnganches).forEach((idKey) => {
    if (!idsEnganchesActivos.has(idKey)) {
      delete estadoCarro.piezasEnEnganches[idKey];
    }
  });
  sincronizarConfiguracionClase();

  if (mallaCarroceriaActual) {
    if (conEfectos) {
      animarSalidaYLiberar(mallaCarroceriaActual, grupoJuguete);
    } else {
      grupoJuguete.remove(mallaCarroceriaActual);
      liberarObjeto3D(mallaCarroceriaActual);
    }
  }

  Object.keys(nodosEnganches).forEach((idEng) => {
    const n = nodosEnganches[idEng];
    grupoJuguete.remove(n.grupoContenedor);
    liberarObjeto3D(n.grupoContenedor);
    delete nodosEnganches[idEng];
  });
  listaColisionadoresEnganches.length = 0;

  const ensamblado = ensamblarGrupoVehiculo({
    clase: estadoCarro.claseVehiculo,
    carroceria: defBase.id,
    color: estadoCarro.colorHex,
    piezas: estadoCarro.piezasEnEnganches,
    conIndicadores: true,
    grupoDestino: grupoJuguete
  });

  mallaCarroceriaActual = ensamblado.mallaChasis;
  if (conEfectos) {
    animarEntradaElastica(mallaCarroceriaActual, new THREE.Vector3(1, 1, 1));
    const posCentro = new THREE.Vector3();
    grupoJuguete.getWorldPosition(posCentro);
    posCentro.y += 0.35;
    dispararChispasEnEnganche(posCentro);
    if (!esCambioColor) {
      reproducirEncajePieza();
    }
  }

  Object.entries(ensamblado.nodosPorEnganche).forEach(([idEng, nodo]) => {
    nodosEnganches[idEng] = nodo;
    if (nodo.colisionador) {
      listaColisionadoresEnganches.push(nodo.colisionador);
    }
  });
}
