import { PALETA_COLORES, TOPE_STAT_UI, CLASES_VEHICULO, IDS_HABITACIONES, CATALOGO_HABITACIONES } from './constantes.js';
import {
  estadoCarro,
  fisicaCarro,
  teclasConduccion,
  nodosEnganches,
  listaColisionadoresEnganches,
  estadoCronometro,
  estadoRed,
  jugadoresRemotos
} from './estado.js';
import { cacheMiniaturas, liberarObjeto3D, crearVistaPreviaEscenario } from './recursos.js';
import { lienzo, camara, renderizador, controles, cargarEscenario } from './escenario.js';
import { TABLA_CARROCERIAS, TABLA_PIEZAS, obtenerAtributosFinalesVehiculo } from './catalogoPiezas.js';
import {
  grupoJuguete,
  colocarPiezaEnEnganche,
  construirOActualizarCarroceria,
  dispararChispasEnEnganche
} from './enganches.js';
import {
  reposicionarEnMeta,
  reiniciarCronometroVuelta,
  actualizarHUDCronometro,
  formatearTiempoMMSS
} from './conduccion.js';
import {
  alternarSilencio,
  cambiarModoMusical,
  cambiarPistaConduccion,
  seleccionarPistaMusicalPorId,
  reproducirCambioColor,
  inicializarAudioInteractivo
} from './audio.js';
import {
  crearSalaOnline,
  unirseSalaOnline,
  salirDeSala,
  enviarApariencia,
  notificarCambioHabitacion
} from './red.js';

const ETIQUETAS_CLASE = {
  coche: '🚗 Clase: Coche (V)',
  moto: '🏍️ Clase: Moto (V)',
  barco: '🚤 Clase: Barco (V)',
  avion: '✈️ Clase: Avión (V)'
};

const PESTANAS_POR_CLASE = {
  coche: [
    { cat: 'carroceria', texto: 'Carrocerías' },
    { cat: 'rueda', texto: 'Ruedas' },
    { cat: 'accesorio', texto: 'Accesorios' },
    { cat: 'color', texto: 'Colores' }
  ],
  moto: [
    { cat: 'carroceria', texto: 'Motos' },
    { cat: 'rueda_moto', texto: 'Ruedas' },
    { cat: 'accesorio_moto', texto: 'Escape' },
    { cat: 'color', texto: 'Colores' }
  ],
  barco: [
    { cat: 'carroceria', texto: 'Cascos' },
    { cat: 'propulsor_barco', texto: 'Propulsor' },
    { cat: 'timon_cubierta', texto: 'Timón y Cubierta' },
    { cat: 'color', texto: 'Colores' }
  ],
  avion: [
    { cat: 'carroceria', texto: 'Fuselajes' },
    { cat: 'ala_avion', texto: 'Alas' },
    { cat: 'motor_cola', texto: 'Motor y Cola' },
    { cat: 'color', texto: 'Colores' }
  ]
};

const CATEGORIAS_AGRUPADAS = {
  timon_cubierta: ['timon_barco', 'accesorio_barco'],
  motor_cola: ['motor_avion', 'cola_avion']
};

const RANURAS_MK_POR_CLASE = {
  coche: {
    chasisLabel: 'CHASIS',
    primaria: { cat: 'rueda', label: 'RUEDAS' },
    secundarias: [{ cat: 'accesorio', label: 'ACCESORIO' }]
  },
  moto: {
    chasisLabel: 'CHÁSIS MOTO',
    primaria: { cat: 'rueda_moto', label: 'RUEDAS' },
    secundarias: [{ cat: 'accesorio_moto', label: 'ESCAPE / EXTRA' }]
  },
  barco: {
    chasisLabel: 'CASCO NAVAL',
    primaria: { cat: 'propulsor_barco', label: 'PROPULSOR' },
    secundarias: [
      { cat: 'timon_barco', label: 'TIMÓN' },
      { cat: 'accesorio_barco', label: 'CUBIERTA' }
    ]
  },
  avion: {
    chasisLabel: 'FUSELAJE',
    primaria: { cat: 'ala_avion', label: 'ALAS' },
    secundarias: [
      { cat: 'motor_avion', label: 'MOTOR' },
      { cat: 'cola_avion', label: 'COLA' }
    ]
  }
};

const DESCRIPCIONES_SUPERFICIE_HAB = {
  habitacion_andy: 'Asfalto Grand Prix',
  habitacion_acuatica: 'Agua Navegable',
  habitacion_atico: 'Circuito de Tierra',
  habitacion_hangar: 'Circuito Aéreo + Anillos'
};

let categoriaActiva = 'carroceria';
let ranuraMKActiva = 'chasis';
let subRanuraSecundariaIdx = 0;

const barraEstado = document.getElementById('barra-estado');
const contenedorItems = document.getElementById('contenedor-items');
const bandejaInferior = document.getElementById('bandeja-inferior');
const hudConduccion = document.getElementById('hud-conduccion');
const btnModoRuedas = document.getElementById('btn-modo-ruedas');
const btnQuitar = document.getElementById('btn-quitar');
const btnAlternarModo = document.getElementById('btn-alternar-modo');
const btnCamara = document.getElementById('btn-camara');
const btnAudio = document.getElementById('btn-audio');
const btnPista = document.getElementById('btn-pista');
const btnClaseVehiculo = document.getElementById('btn-clase-vehiculo');
const btnHabitacion = document.getElementById('btn-habitacion');
const altitudHud = document.getElementById('altitud-hud');
const guiaVueloHud = document.getElementById('guia-vuelo-hud');

// Controles estilo Mario Kart 8 Deluxe
const selectorClaseMK = document.getElementById('selector-clase-mk');
const panelPersonalizacionMK = document.getElementById('panel-personalizacion-mk');
const panelStatsMK = document.getElementById('panel-stats-mk');
const modalCircuitosMK = document.getElementById('modal-circuitos-mk');
const gridCircuitosMK = document.getElementById('grid-circuitos-mk');
const btnAbrirCopasMK = document.getElementById('btn-abrir-copas-mk');
const btnCopasMK = document.getElementById('btn-copas-mk');
const btnCerrarModalMK = document.getElementById('btn-cerrar-modal-mk');

// Controles de Multijugador, Etiquetas 3D y Clasificación en Vivo
const CLAVE_APODO_LOCAL = 'apodo_piloto_3d';
const panelMultijugador = document.getElementById('panel-multijugador');
const badgeModoRed = document.getElementById('badge-modo-red');
const inputApodoRed = document.getElementById('input-apodo-red');
const vistaRedLobby = document.getElementById('vista-red-lobby');
const btnCrearSala = document.getElementById('btn-crear-sala');
const inputCodigoSala = document.getElementById('input-codigo-sala');
const btnUnirseSala = document.getElementById('btn-unirse-sala');
const vistaRedActiva = document.getElementById('vista-red-activa');
const codigoSalaActivo = document.getElementById('codigo-sala-activo');
const rolSalaActivo = document.getElementById('rol-sala-activo');
const listaJugadoresSala = document.getElementById('lista-jugadores-sala');
const btnSalirSala = document.getElementById('btn-salir-sala');
const avisoRed = document.getElementById('aviso-red');
const capaEtiquetas3D = document.getElementById('capa-etiquetas-3d');
const hudLeaderboard = document.getElementById('hud-leaderboard');
const listaLeaderboardHud = document.getElementById('lista-leaderboard-hud');

const etiquetasDomPorId = new Map();
let timerAvisoRed = null;
let ultimoHtmlLeaderboard = '';

function mostrarAvisoRed(mensaje, esError = false) {
  if (!avisoRed) return;
  avisoRed.textContent = mensaje || '';
  avisoRed.classList.toggle('visible', Boolean(mensaje));
  avisoRed.classList.toggle('error', Boolean(esError));
  if (timerAvisoRed) clearTimeout(timerAvisoRed);
  if (mensaje) {
    timerAvisoRed = setTimeout(() => {
      avisoRed.classList.remove('visible');
    }, 4000);
  }
}

/**
 * Sincroniza la vista del panel compacto de multijugador (lobby vs sala activa y lista de pilotos).
 */
export function actualizarPanelMultijugador() {
  const enConduccion = estadoCarro.modoJuego === 'conduccion';
  if (panelMultijugador) {
    panelMultijugador.classList.toggle('oculta', enConduccion);
  }
  const enLinea = Boolean(estadoRed.conectado && estadoRed.modo === 'online');

  if (badgeModoRed) {
    badgeModoRed.textContent = enLinea ? 'ONLINE' : 'SOLO';
    badgeModoRed.classList.toggle('online', enLinea);
  }
  if (vistaRedLobby) {
    vistaRedLobby.style.display = enLinea ? 'none' : 'flex';
  }
  if (vistaRedActiva) {
    vistaRedActiva.style.display = enLinea ? 'flex' : 'none';
  }
  if (enLinea) {
    if (codigoSalaActivo) {
      codigoSalaActivo.textContent = `SALA: ${estadoRed.codigoSala || '----'}`;
    }
    if (rolSalaActivo) {
      rolSalaActivo.textContent = estadoRed.esAnfitrion ? 'Anfitrión' : 'Invitado';
    }
    if (listaJugadoresSala) {
      listaJugadoresSala.innerHTML = '';
      const lista = [
        {
          id: estadoRed.miId || 'local',
          apodo: `${estadoRed.apodo || 'Piloto'} (Tú)`,
          slotParrilla: estadoRed.slotParrilla || 0,
          esAnfitrion: Boolean(estadoRed.esAnfitrion),
          enPista: estadoCarro.modoJuego === 'conduccion'
        },
        ...Array.from(jugadoresRemotos.values()).map((r) => ({
          id: r.id,
          apodo: r.apodo || 'Rival',
          slotParrilla: Number.isFinite(r.slotParrilla) ? r.slotParrilla : 0,
          esAnfitrion: Boolean(r.esAnfitrion),
          enPista: r.enPista !== false
        }))
      ].sort((a, b) => a.slotParrilla - b.slotParrilla);

      lista.forEach((jug) => {
        const fila = document.createElement('div');
        fila.className = 'fila-jugador-sala';
        const nombre = document.createElement('span');
        nombre.textContent = `${jug.esAnfitrion ? '👑 ' : ''}${jug.apodo}`;
        const estado = document.createElement('span');
        estado.className = 'estado-jugador-sala' + (jug.enPista ? ' pista' : '');
        estado.textContent = jug.enPista ? 'En Pista' : 'En Taller';
        fila.append(nombre, estado);
        listaJugadoresSala.appendChild(fila);
      });
    }
  } else if (listaJugadoresSala) {
    listaJugadoresSala.innerHTML = '';
  }
}

/**
 * Proyecta etiquetas 3D flotantes sobre vehículos remotos y actualiza la clasificación en vivo.
 */
export function actualizarEtiquetasYLeaderboard() {
  if (capaEtiquetas3D) {
    const idsActivos = new Set();
    const ancho = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280;
    const alto = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 720;

    if (jugadoresRemotos.size > 0 && camara) {
      if (typeof camara.updateMatrixWorld === 'function') {
        camara.updateMatrixWorld();
      }
      for (const rem of jugadoresRemotos.values()) {
        if (!rem || !rem.grupoRaiz || rem.enPista === false) continue;
        idsActivos.add(rem.id);

        let etiqueta = etiquetasDomPorId.get(rem.id);
        if (!etiqueta) {
          etiqueta = document.createElement('div');
          etiqueta.className = 'etiqueta-jugador-3d';
          etiqueta.dataset.id = rem.id;
          capaEtiquetas3D.appendChild(etiqueta);
          etiquetasDomPorId.set(rem.id, etiqueta);
        }

        const pos3D = new THREE.Vector3(
          rem.grupoRaiz.position.x,
          rem.grupoRaiz.position.y + 0.95,
          rem.grupoRaiz.position.z
        );
        if (typeof pos3D.project === 'function') {
          pos3D.project(camara);
        }

        if (pos3D.z >= -1 && pos3D.z <= 1) {
          const px = (pos3D.x * 0.5 + 0.5) * ancho;
          const py = (-pos3D.y * 0.5 + 0.5) * alto;
          etiqueta.style.display = 'flex';
          etiqueta.style.left = `${px.toFixed(1)}px`;
          etiqueta.style.top = `${py.toFixed(1)}px`;
          const estadoTxt = rem.enPista !== false ? 'En Pista' : 'En Taller';
          etiqueta.classList.toggle('en-taller', rem.enPista === false);
          const textoMeta = `${rem.apodo || 'Rival'} · ${estadoTxt}`;
          if (etiqueta.textContent !== textoMeta) {
            etiqueta.textContent = textoMeta;
          }
        } else {
          etiqueta.style.display = 'none';
        }
      }
    }

    for (const [id, el] of etiquetasDomPorId.entries()) {
      if (!idsActivos.has(id)) {
        if (typeof el.remove === 'function') {
          el.remove();
        } else if (Array.isArray(capaEtiquetas3D.children)) {
          capaEtiquetas3D.children = capaEtiquetas3D.children.filter((c) => c !== el);
        }
        etiquetasDomPorId.delete(id);
      }
    }
  }

  if (hudLeaderboard) {
    const mostrarLB =
      estadoCarro.modoJuego === 'conduccion' &&
      (estadoRed.modo === 'online' || jugadoresRemotos.size > 0);
    hudLeaderboard.style.display = mostrarLB ? 'block' : 'none';

    if (mostrarLB && listaLeaderboardHud) {
      const corredores = [
        {
          id: estadoRed.miId || 'local',
          apodo: estadoRed.apodo || 'Piloto',
          esLocal: true,
          vuelta: estadoCronometro.vuelta || 1,
          checkpointActual: estadoCronometro.checkpointActual || 0,
          mejorVuelta: estadoCronometro.mejorVuelta ?? null
        },
        ...Array.from(jugadoresRemotos.values()).map((r) => ({
          id: r.id,
          apodo: r.apodo || 'Rival',
          esLocal: false,
          vuelta: r.vuelta || 1,
          checkpointActual: r.checkpointActual || 0,
          mejorVuelta: r.mejorVuelta ?? null
        }))
      ].sort((a, b) => {
        if (b.vuelta !== a.vuelta) return b.vuelta - a.vuelta;
        if (b.checkpointActual !== a.checkpointActual) {
          return b.checkpointActual - a.checkpointActual;
        }
        const mA = a.mejorVuelta !== null && Number.isFinite(a.mejorVuelta) ? a.mejorVuelta : Infinity;
        const mB = b.mejorVuelta !== null && Number.isFinite(b.mejorVuelta) ? b.mejorVuelta : Infinity;
        if (mA !== mB) return mA - mB;
        return a.esLocal ? -1 : b.esLocal ? 1 : 0;
      });

      const firma = corredores
        .map((c, idx) => `${idx + 1}|${c.id}|${c.apodo}|${c.vuelta}|${c.checkpointActual}|${c.mejorVuelta ?? ''}`)
        .join(';');
      if (firma !== ultimoHtmlLeaderboard) {
        ultimoHtmlLeaderboard = firma;
        listaLeaderboardHud.innerHTML = '';
        corredores.forEach((c, idx) => {
          const fila = document.createElement('div');
          fila.className = 'fila-leaderboard-hud' + (c.esLocal ? ' propio' : '');
          const posSpan = document.createElement('span');
          posSpan.className = 'pos-leaderboard-hud';
          posSpan.textContent = `#${idx + 1}`;
          const nomSpan = document.createElement('span');
          nomSpan.textContent = c.esLocal ? `${c.apodo} (Tú)` : c.apodo;
          const metaSpan = document.createElement('span');
          metaSpan.className = 'meta-leaderboard-hud';
          metaSpan.textContent = `V${c.vuelta} · CP ${c.checkpointActual}/5`;
          fila.append(posSpan, nomSpan, metaSpan);
          listaLeaderboardHud.appendChild(fila);
        });
      }
    }
  }
}

/**
 * Genera en código las miniaturas 2D de todas las piezas usando un único WebGLRenderer pequeño.
 * Encuadra dinámicamente según Box3 para que alas y cascos largos se muestren completos.
 */
export function generarMiniaturasCatalogo() {
  try {
    const renderMini = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderMini.setSize(96, 96);
    renderMini.outputEncoding = THREE.sRGBEncoding;

    const escenaMini = new THREE.Scene();
    const camMini = new THREE.PerspectiveCamera(40, 1, 0.1, 15);

    const luzA = new THREE.HemisphereLight(0xffffff, 0x888888, 0.9);
    const luzD = new THREE.DirectionalLight(0xffffff, 1.1);
    luzD.position.set(2, 3, 2);
    escenaMini.add(luzA, luzD);

    [...TABLA_CARROCERIAS, ...TABLA_PIEZAS].forEach((item) => {
      const malla = item.crear(PALETA_COLORES[0].hex);
      if (!malla) return;

      let encuadrado = false;
      if (typeof THREE.Box3 === 'function') {
        const box = new THREE.Box3().setFromObject(malla);
        if (!box.isEmpty()) {
          const centro = new THREE.Vector3();
          const tam = new THREE.Vector3();
          box.getCenter(centro);
          box.getSize(tam);
          const maxDim = Math.max(tam.x, tam.y, tam.z, 0.3);
          const dist = maxDim * (item.categoria === 'carroceria' ? 1.55 : 1.72);
          camMini.position.set(centro.x + dist * 0.92, centro.y + dist * 0.60, centro.z + dist * 0.96);
          camMini.lookAt(centro.x, centro.y, centro.z);
          encuadrado = true;
        }
      }

      if (!encuadrado) {
        if (item.categoria === 'carroceria') {
          camMini.position.set(1.7, 1.05, 1.75);
          camMini.lookAt(0, 0.3, 0);
        } else {
          camMini.position.set(0.42, 0.28, 0.52);
          camMini.lookAt(0, 0.08, 0);
        }
      }

      escenaMini.add(malla);
      renderMini.render(escenaMini, camMini);
      cacheMiniaturas[item.id] = renderMini.domElement.toDataURL('image/png');
      escenaMini.remove(malla);
      liberarObjeto3D(malla);
    });

    renderMini.dispose();
  } catch (err) {
    console.warn('Aviso: No se pudieron generar miniaturas 3D; se mostrará el nombre.', err);
  }
}

/**
 * Sincroniza el botón de clase, pestañas dinámicas del taller e indicadores de vuelo en HUD.
 */
function actualizarBotonesClaseYHUD() {
  if (btnClaseVehiculo) {
    btnClaseVehiculo.textContent = ETIQUETAS_CLASE[estadoCarro.claseVehiculo] || ETIQUETAS_CLASE.coche;
  }
  const esAvion = estadoCarro.claseVehiculo === 'avion';
  if (altitudHud) {
    altitudHud.style.display = esAvion ? 'inline-block' : 'none';
    if (esAvion) altitudHud.textContent = `ALT: ${Math.max(0, fisicaCarro.altitudVuelo).toFixed(1)} m`;
  }
  if (guiaVueloHud) {
    guiaVueloHud.style.display = esAvion ? 'inline-block' : 'none';
  }

  const pestanasDef = PESTANAS_POR_CLASE[estadoCarro.claseVehiculo] || PESTANAS_POR_CLASE.coche;
  const botonesPestana = document.querySelectorAll('.btn-pestana');
  botonesPestana.forEach((btn, idx) => {
    const def = pestanasDef[idx];
    if (def) {
      btn.dataset.cat = def.cat;
      btn.textContent = def.texto;
    }
  });

  if (btnModoRuedas) {
    const tieneGrupoMultiple = Object.values(nodosEnganches).filter((n) => n.definicion.grupoSimetria).length > 1;
    btnModoRuedas.style.display = tieneGrupoMultiple ? 'inline-block' : 'none';
    if (tieneGrupoMultiple) {
      btnModoRuedas.textContent = estadoCarro.modoSimetriaEnganches
        ? estadoCarro.claseVehiculo === 'moto'
          ? 'Modo: 2 ruedas juntas'
          : 'Modo: 4 ruedas juntas'
        : 'Modo: Rueda individual';
      btnModoRuedas.classList.toggle('modo-activo', estadoCarro.modoSimetriaEnganches);
    }
  }
}

/**
 * Actualiza el nombre del chasis activo mostrado en el HUD de conducción.
 */
function actualizarNombreChasisHUD() {
  const elNombre = document.getElementById('nombre-chasis-hud');
  if (!elNombre) return;
  const def = TABLA_CARROCERIAS.find((b) => b.id === estadoCarro.idCarroceria) || TABLA_CARROCERIAS[0];
  elNombre.textContent = def.nombre;
}

function formatearBonoPieza(mod) {
  if (!mod) return 'Equilibrado';
  const partes = [];
  if (mod.velocidad) partes.push(`${mod.velocidad > 0 ? '+' : ''}${mod.velocidad} VEL`);
  if (mod.aceleracion) partes.push(`${mod.aceleracion > 0 ? '+' : ''}${mod.aceleracion} ACEL`);
  if (mod.control) partes.push(`${mod.control > 0 ? '+' : ''}${mod.control} CTRL`);
  return partes.length ? partes.join(' · ') : 'Equilibrado';
}

function obtenerListaYActivaPorCategoria(categoria) {
  const lista = TABLA_PIEZAS.filter(
    (p) =>
      p.categoria === categoria &&
      (!Array.isArray(p.clasesCompatibles) || p.clasesCompatibles.includes(estadoCarro.claseVehiculo))
  );
  const nodoSel = estadoCarro.engancheSeleccionadoId
    ? nodosEnganches[estadoCarro.engancheSeleccionadoId]
    : null;
  const engObj =
    nodoSel && nodoSel.definicion.tipo === categoria
      ? nodoSel
      : Object.values(nodosEnganches).find((n) => n.definicion.tipo === categoria) || null;
  const idEq = engObj ? estadoCarro.piezasEnEnganches[engObj.definicion.id] : null;
  const piezaActiva = idEq
    ? lista.find((p) => p.id === idEq) || lista[0]
    : lista.find((p) => p.esVacio) || lista[0] || null;
  return { lista, piezaActiva };
}

function aplicarSeleccionItemTaller(pieza) {
  if (!pieza) return;
  if (pieza.categoria === 'carroceria') {
    estadoCarro.engancheSeleccionadoId = null;
    construirOActualizarCarroceria(pieza.id, true);
    actualizarNombreChasisHUD();
    actualizarBotonesClaseYHUD();
  } else {
    const enganchesCompatibles = Object.values(nodosEnganches)
      .map((n) => n.definicion)
      .filter((def) => def.tipo === pieza.tipoEnganche);
    const nodoActivo = estadoCarro.engancheSeleccionadoId
      ? nodosEnganches[estadoCarro.engancheSeleccionadoId]
      : null;

    if (
      nodoActivo &&
      nodoActivo.definicion.tipo === pieza.tipoEnganche &&
      (!estadoCarro.modoSimetriaEnganches || !nodoActivo.definicion.grupoSimetria)
    ) {
      colocarPiezaEnEnganche(estadoCarro.engancheSeleccionadoId, pieza.id, true);
    } else if (
      estadoCarro.modoSimetriaEnganches &&
      enganchesCompatibles.some((def) => def.grupoSimetria)
    ) {
      const grupoObjetivo =
        (nodoActivo &&
          nodoActivo.definicion.tipo === pieza.tipoEnganche &&
          nodoActivo.definicion.grupoSimetria) ||
        (enganchesCompatibles.find((def) => def.grupoSimetria) || {}).grupoSimetria;
      enganchesCompatibles
        .filter((def) => !grupoObjetivo || def.grupoSimetria === grupoObjetivo)
        .forEach((def) => colocarPiezaEnEnganche(def.id, pieza.id, true));
    } else {
      enganchesCompatibles.forEach((def) =>
        colocarPiezaEnEnganche(def.id, pieza.id, true)
      );
    }
  }
  enviarApariencia();
}

/**
 * Sincroniza los paneles laterales y selector superior estilo Mario Kart 8 Deluxe
 * con el vehículo armado, sus modificadores modStats y colores.
 */
export function actualizarPanelesMarioKart() {
  const enConduccion = estadoCarro.modoJuego === 'conduccion';
  [selectorClaseMK, panelPersonalizacionMK, panelStatsMK].forEach((el) => {
    if (el) el.classList.toggle('oculta', enConduccion);
  });

  document.querySelectorAll('.btn-clase-mk').forEach((btn) => {
    btn.classList.toggle('activa', btn.dataset.clase === estadoCarro.claseVehiculo);
  });
  document.querySelectorAll('.ranura-mk').forEach((fila) => {
    fila.classList.toggle('activa', fila.dataset.ranura === ranuraMKActiva);
  });

  const cfg = RANURAS_MK_POR_CLASE[estadoCarro.claseVehiculo] || RANURAS_MK_POR_CLASE.coche;
  const subLista = cfg.secundarias || [{ cat: 'accesorio', label: 'ACCESORIO' }];
  if (subRanuraSecundariaIdx >= subLista.length) subRanuraSecundariaIdx = 0;
  const subCfg = subLista[subRanuraSecundariaIdx];

  const badgeEng = document.getElementById('mk-enganche-activo');
  if (badgeEng) {
    badgeEng.textContent = estadoCarro.engancheSeleccionadoId
      ? `Enganche: ${estadoCarro.engancheSeleccionadoId}`
      : estadoCarro.modoSimetriaEnganches
      ? 'Simetría activa'
      : 'Pieza individual';
  }

  // Fila 1: Chasis
  const defChasis =
    TABLA_CARROCERIAS.find((b) => b.id === estadoCarro.idCarroceria) || TABLA_CARROCERIAS[0];
  const lblCh = document.getElementById('mk-lbl-chasis');
  const imgCh = document.getElementById('mk-img-chasis');
  const nomCh = document.getElementById('mk-nombre-chasis');
  const bonCh = document.getElementById('mk-bono-chasis');
  if (lblCh) lblCh.textContent = cfg.chasisLabel;
  if (imgCh && cacheMiniaturas[defChasis.id]) imgCh.src = cacheMiniaturas[defChasis.id];
  if (nomCh) nomCh.textContent = defChasis.nombre;
  if (bonCh && defChasis.atributos && defChasis.atributos.statsUI) {
    const s = defChasis.atributos.statsUI;
    bonCh.textContent = `VEL ${s.velocidad} · ACEL ${s.aceleracion} · CTRL ${s.control}`;
  }

  // Fila 2: Ranura primaria
  const { piezaActiva: piezaPrim } = obtenerListaYActivaPorCategoria(cfg.primaria.cat);
  const lblPr = document.getElementById('mk-lbl-primaria');
  const imgPr = document.getElementById('mk-img-primaria');
  const nomPr = document.getElementById('mk-nombre-primaria');
  const bonPr = document.getElementById('mk-bono-primaria');
  if (lblPr) lblPr.textContent = cfg.primaria.label;
  if (piezaPrim) {
    if (imgPr) imgPr.src = cacheMiniaturas[piezaPrim.id] || '';
    if (nomPr) nomPr.textContent = piezaPrim.nombre;
    if (bonPr) bonPr.textContent = formatearBonoPieza(piezaPrim.modStats);
  }

  // Fila 3: Ranura secundaria (+ sub-pestañas en barco/avión)
  const { piezaActiva: piezaSec } = obtenerListaYActivaPorCategoria(subCfg.cat);
  const lblSec = document.getElementById('mk-lbl-secundaria');
  const tabsSec = document.getElementById('mk-subranura-tabs');
  const imgSec = document.getElementById('mk-img-secundaria');
  const nomSec = document.getElementById('mk-nombre-secundaria');
  const bonSec = document.getElementById('mk-bono-secundaria');
  if (lblSec) lblSec.textContent = subCfg.label;
  if (tabsSec) {
    tabsSec.innerHTML = '';
    if (subLista.length > 1) {
      subLista.forEach((sCfg, idx) => {
        const b = document.createElement('button');
        b.className = 'btn-subranura-mk' + (idx === subRanuraSecundariaIdx ? ' activa' : '');
        b.textContent = sCfg.label;
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          subRanuraSecundariaIdx = idx;
          ranuraMKActiva = 'secundaria';
          actualizarPanelesMarioKart();
        });
        tabsSec.appendChild(b);
      });
    }
  }
  if (piezaSec) {
    if (imgSec) imgSec.src = cacheMiniaturas[piezaSec.id] || cacheMiniaturas[defChasis.id] || '';
    if (nomSec) nomSec.textContent = piezaSec.nombre;
    if (bonSec) bonSec.textContent = formatearBonoPieza(piezaSec.modStats);
  }

  // Fila 4: Paleta rápida de 8 colores
  const gridCol = document.getElementById('mk-grid-colores');
  if (gridCol) {
    gridCol.innerHTML = '';
    PALETA_COLORES.forEach((col) => {
      const btnCol = document.createElement('button');
      btnCol.className = 'muestra-color-mk' + (estadoCarro.idColor === col.id ? ' activa' : '');
      btnCol.title = col.nombre;
      btnCol.style.backgroundColor = '#' + col.hex.toString(16).padStart(6, '0');
      btnCol.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ranuraMKActiva = 'pintura';
        estadoCarro.colorHex = col.hex;
        estadoCarro.idColor = col.id;
        construirOActualizarCarroceria(estadoCarro.idCarroceria, true, true);
        reproducirCambioColor();
        actualizarPanelesMarioKart();
        enviarApariencia();
      });
      gridCol.appendChild(btnCol);
    });
  }

  // Panel derecho de estadísticas comparativas (base chasis + bono modStats)
  const nomVehMK = document.getElementById('nombre-vehiculo-mk');
  const insigMK = document.getElementById('insignia-clase-mk');
  if (nomVehMK) nomVehMK.textContent = defChasis.nombre;
  if (insigMK) insigMK.textContent = (estadoCarro.claseVehiculo || 'coche').toUpperCase();

  const barrasCont = document.getElementById('barras-stats-mk');
  if (barrasCont) {
    barrasCont.innerHTML = '';
    const atrib = obtenerAtributosFinalesVehiculo(estadoCarro);
    const escalaMax = TOPE_STAT_UI + 15;
    [
      { clave: 'velocidad', etiqueta: 'VELOCIDAD' },
      { clave: 'aceleracion', etiqueta: 'ACELERACIÓN' },
      { clave: 'control', etiqueta: 'CONTROL' }
    ].forEach(({ clave, etiqueta }) => {
      const baseVal = atrib.statsBase[clave] || 0;
      const bonoVal = atrib.bonoStats[clave] || 0;
      const finalVal = atrib.statsUI[clave] || 0;

      const fila = document.createElement('div');
      fila.className = 'fila-stat-mk';

      const cabe = document.createElement('div');
      cabe.className = 'etiquetas-stat-mk';
      const lbl = document.createElement('span');
      lbl.textContent = etiqueta;
      const valSpan = document.createElement('span');
      const sufijo = bonoVal === 0 ? '' : ` (${bonoVal > 0 ? '+' : ''}${bonoVal})`;
      valSpan.className = `valor-stat-mk${bonoVal > 0 ? ' positivo' : bonoVal < 0 ? ' negativo' : ''}`;
      valSpan.textContent = `${finalVal}${sufijo}`;
      cabe.append(lbl, valSpan);

      const pista = document.createElement('div');
      pista.className = 'pista-barra-mk';

      const tramoBase = document.createElement('div');
      tramoBase.className = 'barra-mk-base';
      const baseMostrable = bonoVal >= 0 ? baseVal : Math.max(0, finalVal);
      tramoBase.style.width = `${Math.max(0, Math.min(100, (baseMostrable / escalaMax) * 100))}%`;
      pista.appendChild(tramoBase);

      if (bonoVal !== 0) {
        const tramoBono = document.createElement('div');
        tramoBono.className = `barra-mk-bono ${bonoVal > 0 ? 'positivo' : 'negativo'}`;
        tramoBono.style.width = `${Math.max(0, Math.min(100, (Math.abs(bonoVal) / escalaMax) * 100))}%`;
        pista.appendChild(tramoBono);
      }

      fila.append(cabe, pista);
      barrasCont.appendChild(fila);
    });
  }
}

/**
 * Cicla la opción activa en una de las 4 ranuras estilo Mario Kart ('chasis', 'primaria', 'secundaria', 'pintura').
 */
export function ciclarOpcionRanuraMK(ranuraId, direccion = 1) {
  ranuraMKActiva = ranuraId || ranuraMKActiva;
  const paso = direccion < 0 ? -1 : 1;
  const cfg = RANURAS_MK_POR_CLASE[estadoCarro.claseVehiculo] || RANURAS_MK_POR_CLASE.coche;
  let idSeleccionado = null;

  if (ranuraId === 'chasis') {
    const chasisClase = TABLA_CARROCERIAS.filter(
      (c) => !c.clase || c.clase === estadoCarro.claseVehiculo
    );
    const idx = Math.max(0, chasisClase.findIndex((c) => c.id === estadoCarro.idCarroceria));
    const siguiente = chasisClase[(idx + paso + chasisClase.length) % chasisClase.length];
    aplicarSeleccionItemTaller(siguiente);
    idSeleccionado = siguiente ? siguiente.id : null;
  } else if (ranuraId === 'pintura') {
    const idx = Math.max(0, PALETA_COLORES.findIndex((c) => c.id === estadoCarro.idColor));
    const colSig = PALETA_COLORES[(idx + paso + PALETA_COLORES.length) % PALETA_COLORES.length];
    if (colSig) {
      estadoCarro.colorHex = colSig.hex;
      estadoCarro.idColor = colSig.id;
      construirOActualizarCarroceria(estadoCarro.idCarroceria, true, true);
      reproducirCambioColor();
      idSeleccionado = colSig.id;
      enviarApariencia();
    }
  } else {
    const subLista = cfg.secundarias || [{ cat: 'accesorio', label: 'ACCESORIO' }];
    const subCfg = subLista[subRanuraSecundariaIdx % subLista.length];
    const cat = ranuraId === 'primaria' ? cfg.primaria.cat : subCfg.cat;
    const { lista, piezaActiva } = obtenerListaYActivaPorCategoria(cat);
    if (lista.length > 0) {
      const idx = Math.max(0, lista.findIndex((p) => piezaActiva && p.id === piezaActiva.id));
      const siguiente = lista[(idx + paso + lista.length) % lista.length];
      aplicarSeleccionItemTaller(siguiente);
      idSeleccionado = siguiente ? siguiente.id : null;
    }
  }

  actualizarTextoEstado();
  actualizarPanelesMarioKart();
  return idSeleccionado;
}

/**
 * Abre la pantalla modal de selección de Copa / Circuito estilo Mario Kart con vistas previas y récords.
 */
export function abrirModalCircuitosMK() {
  if (!modalCircuitosMK) return;
  modalCircuitosMK.classList.add('abierto');

  const subtitulo = document.getElementById('subtitulo-modal-mk');
  if (subtitulo) {
    subtitulo.textContent = `Clase activa: ${(estadoCarro.claseVehiculo || 'coche').toUpperCase()} — Elige circuito (+6% Bono en tu terreno ideal)`;
  }

  if (gridCircuitosMK) {
    gridCircuitosMK.innerHTML = '';
    IDS_HABITACIONES.forEach((idHab) => {
      const hab = CATALOGO_HABITACIONES[idHab];
      if (!hab) return;

      const card = document.createElement('div');
      card.className = 'tarjeta-circuito-mk' + (estadoCarro.idHabitacion === hab.id ? ' activa' : '');
      card.dataset.habitacion = hab.id;

      const img = document.createElement('img');
      img.src = cacheMiniaturas[hab.id] || crearVistaPreviaEscenario(hab.id);
      img.alt = hab.nombre;

      const cuerpo = document.createElement('div');
      cuerpo.className = 'cuerpo-circuito-mk';

      const filaTit = document.createElement('div');
      filaTit.className = 'fila-titulo-circuito-mk';
      const nom = document.createElement('div');
      nom.className = 'nombre-circuito-mk';
      nom.textContent = hab.nombre;

      const esIdeal = hab.claseIdeal === estadoCarro.claseVehiculo;
      const insignia = document.createElement('span');
      insignia.className = 'insignia-bono-mk' + (esIdeal ? ' ideal' : '');
      insignia.textContent = esIdeal
        ? '+6% Bono Activo'
        : `+6% Bono ${String(hab.claseIdeal || 'coche').toUpperCase()}`;
      filaTit.append(nom, insignia);

      const meta = document.createElement('div');
      meta.className = 'meta-circuito-mk';
      const sup = document.createElement('span');
      sup.textContent = DESCRIPCIONES_SUPERFICIE_HAB[hab.id] || 'Circuito 3D';
      const recordSeg =
        typeof estadoCronometro.leerRecord === 'function'
          ? estadoCronometro.leerRecord(hab.id, estadoCarro.claseVehiculo)
          : null;
      const recTxt = document.createElement('span');
      recTxt.className = 'record-circuito-mk';
      recTxt.textContent = `Récord: ${recordSeg !== null ? formatearTiempoMMSS(recordSeg) : '--:--.--'}`;
      meta.append(sup, recTxt);

      cuerpo.append(filaTit, meta);
      card.append(img, cuerpo);

      card.addEventListener('click', () => {
        cambiarHabitacion(hab.id);
        cerrarModalCircuitosMK();
        if (estadoCarro.modoJuego === 'taller') {
          alternarModoTallerConduccion();
        }
      });
      gridCircuitosMK.appendChild(card);
    });
  }
}

/**
 * Cierra el modal de selección de Copa / Circuito estilo Mario Kart.
 */
export function cerrarModalCircuitosMK() {
  if (modalCircuitosMK) {
    modalCircuitosMK.classList.remove('abierto');
  }
}

/**
 * Cambia entre las clases de vehículo ('coche', 'moto', 'barco', 'avion') conservando su armado.
 */
export function cambiarClaseVehiculo(claseDestino = null) {
  subRanuraSecundariaIdx = 0;
  const claseActual = estadoCarro.claseVehiculo || 'coche';
  let nuevaClase = typeof claseDestino === 'string' ? claseDestino : null;
  if (!nuevaClase || !CLASES_VEHICULO.includes(nuevaClase)) {
    const idx = CLASES_VEHICULO.indexOf(claseActual);
    nuevaClase = CLASES_VEHICULO[(idx + 1) % CLASES_VEHICULO.length];
  }

  if (!estadoCarro.configuracionesPorClase) estadoCarro.configuracionesPorClase = {};
  estadoCarro.configuracionesPorClase[claseActual] = {
    idCarroceria: estadoCarro.idCarroceria,
    colorHex: estadoCarro.colorHex,
    idColor: estadoCarro.idColor,
    piezasEnEnganches: { ...estadoCarro.piezasEnEnganches }
  };

  const confNueva = estadoCarro.configuracionesPorClase[nuevaClase];
  const chasisDefecto =
    (confNueva && confNueva.idCarroceria) ||
    (TABLA_CARROCERIAS.find((c) => c.clase === nuevaClase) || TABLA_CARROCERIAS[0]).id;

  if (confNueva) {
    estadoCarro.colorHex = confNueva.colorHex ?? estadoCarro.colorHex;
    estadoCarro.idColor = confNueva.idColor ?? estadoCarro.idColor;
  }

  estadoCarro.engancheSeleccionadoId = null;
  estadoCarro.engancheHoverId = null;
  construirOActualizarCarroceria(chasisDefecto, true);

  estadoCronometro.mejorVuelta =
    typeof estadoCronometro.leerRecord === 'function'
      ? estadoCronometro.leerRecord(estadoCarro.idHabitacion, nuevaClase)
      : null;

  if (estadoCarro.modoJuego === 'conduccion') {
    reposicionarEnMeta();
    Object.keys(nodosEnganches).forEach((idEng) => {
      nodosEnganches[idEng].anilloIndicador.material.opacity = 0;
    });
  } else {
    fisicaCarro.altitudVuelo = 0;
  }

  actualizarNombreChasisHUD();
  actualizarHUDCronometro();
  actualizarBotonesClaseYHUD();
  renderizarBandeja('carroceria');
  actualizarTextoEstado();
  enviarApariencia();
  return nuevaClase;
}

/**
 * Sincroniza la etiqueta del botón de escenario con la habitación activa.
 * Por qué: mantiene visible en todo momento el circuito actual y su atajo (H).
 */
function actualizarTextoBtnHabitacion() {
  if (!btnHabitacion) return;
  const hab = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  const nombreCorto = (hab.nombre || hab.id).split(' (')[0];
  btnHabitacion.textContent = `🏠 Escenario: ${nombreCorto} (H)`;
}

/**
 * Cambia en caliente la habitación / circuito activo conservando el vehículo armado.
 * Por qué: permite alternar entre las 4 habitaciones temáticas desde el HUD o tecla H.
 */
export function cambiarHabitacion(idOpcional = null, origenRed = false) {
  const actual = estadoCarro.idHabitacion || IDS_HABITACIONES[0];
  const idxActual = Math.max(0, IDS_HABITACIONES.indexOf(actual));
  const siguienteId = IDS_HABITACIONES[(idxActual + 1) % IDS_HABITACIONES.length];
  const nuevoId = idOpcional && CATALOGO_HABITACIONES[idOpcional] ? idOpcional : siguienteId;

  const hab = cargarEscenario(nuevoId);
  seleccionarPistaMusicalPorId(hab.pistaSugeridaId);

  estadoCronometro.vueltaActiva = false;
  estadoCronometro.tiempoActual = 0;
  estadoCronometro.checkpointActual = 0;
  estadoCronometro.avisoRecord = 0;
  estadoCronometro.mejorVuelta =
    typeof estadoCronometro.leerRecord === 'function'
      ? estadoCronometro.leerRecord(hab.id, estadoCarro.claseVehiculo)
      : null;

  if (estadoCarro.modoJuego === 'conduccion') {
    reposicionarEnMeta();
    Object.keys(nodosEnganches).forEach((idEng) => {
      nodosEnganches[idEng].anilloIndicador.material.opacity = 0;
    });
  } else {
    fisicaCarro.x = 0;
    fisicaCarro.y = 0.02;
    fisicaCarro.z = 0;
    fisicaCarro.velocidad = 0;
    fisicaCarro.velY = 0;
    fisicaCarro.yaw = 0;
    fisicaCarro.anguloMovimiento = 0;
    fisicaCarro.pitch = 0;
    fisicaCarro.roll = 0;
    fisicaCarro.altitudVuelo = 0;
    fisicaCarro.enAire = false;
    fisicaCarro.derrapando = false;
    if (grupoJuguete) {
      grupoJuguete.position.set(0, 0.02, 0);
      grupoJuguete.rotation.set(0, 0, 0);
    }
    if (controles && controles.target) {
      controles.target.set(0, 0.25, 0);
      controles.update();
    }
  }

  actualizarTextoBtnHabitacion();
  actualizarHUDCronometro();
  actualizarTextoEstado();
  if (barraEstado && estadoCarro.modoJuego === 'taller') {
    barraEstado.innerHTML = `Modo Taller (<span class="destacado">${hab.nombre}</span>): Haz clic en un <span class="destacado">enganche brillante</span> o usa las ranuras laterales. Clic derecho quita pieza.`;
  }
  actualizarPanelesMarioKart();
  if (modalCircuitosMK && modalCircuitosMK.classList.contains('abierto')) {
    abrirModalCircuitosMK();
  }
  if (!origenRed && estadoRed.conectado && estadoRed.esAnfitrion) {
    notificarCambioHabitacion(hab.id);
  }
  return hab.id;
}

/**
 * Actualiza el mensaje de la barra superior según el modo activo (Taller o Conducción).
 * Por qué: informa claramente al jugador de las acciones disponibles.
 */
export function actualizarTextoEstado() {
  if (estadoCarro.modoJuego === 'conduccion') {
    const hab = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
    const vistaTxt = estadoCarro.modoCamara === 'cabina' ? 'Vista desde Cabina' : 'Vista en 3ª Persona';
    const extraControl =
      estadoCarro.claseVehiculo === 'avion'
        ? 'usa Q/E para subir/bajar altitud en vuelo'
        : 'usa Shift o Espacio para derrapar';
    barraEstado.innerHTML = `Modo Conducción (<span class="destacado">${vistaTxt}</span>): Recorre el circuito de <span class="destacado">${hab.nombre}</span>, activa los Boost Pads y ${extraControl}.`;
    return;
  }

  if (estadoCarro.engancheSeleccionadoId) {
    const nodo = nodosEnganches[estadoCarro.engancheSeleccionadoId];
    const etiqueta =
      nodo && (nodo.definicion.tipo === 'rueda' || nodo.definicion.tipo === 'rueda_moto')
        ? 'Enganche de Rueda'
        : nodo && nodo.definicion.tipo.startsWith('accesorio')
        ? 'Enganche de Accesorio'
        : `Enganche (${nodo ? nodo.definicion.tipo : 'pieza'})`;
    barraEstado.innerHTML = `Taller: <span class="destacado">${etiqueta}</span> (${estadoCarro.engancheSeleccionadoId}). Elige una pieza con ◀/▶ o clic.`;
  } else {
    barraEstado.innerHTML = `Modo Taller: Usa los <span class="destacado">paneles laterales Mario Kart</span> o haz clic en un enganche 3D.`;
  }
}

/**
 * Alterna entre el Modo Taller (en la alfombra central) y el Modo Conducción Libre.
 * Por qué: permite probar en la pista cualquier clase y regresar sin perder piezas elegidas.
 */
export function alternarModoTallerConduccion() {
  if (estadoCarro.modoJuego === 'taller') {
    estadoCarro.modoJuego = 'conduccion';
    estadoCarro.engancheSeleccionadoId = null;
    estadoCarro.engancheHoverId = null;
    cerrarModalCircuitosMK();

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    controles.enabled = false;
    bandejaInferior.classList.add('oculta');
    hudConduccion.style.display = 'flex';
    btnCamara.style.display = 'inline-block';
    btnAlternarModo.textContent = 'Volver al Taller (T)';
    btnAlternarModo.classList.add('en-conduccion');
    actualizarNombreChasisHUD();
    actualizarBotonesClaseYHUD();
    actualizarHUDCronometro();

    // Ocultar anillos de enganche durante la conducción
    Object.keys(nodosEnganches).forEach((idEng) => {
      nodosEnganches[idEng].anilloIndicador.material.opacity = 0;
    });
    if (estadoRed.modo === 'online') {
      reposicionarEnMeta();
    }
    enviarApariencia(true);
  } else {
    estadoCarro.modoJuego = 'taller';
    // Reposicionar suavemente el vehículo en el centro de la alfombra del taller
    fisicaCarro.x = 0;
    fisicaCarro.y = 0.02;
    fisicaCarro.z = 0;
    fisicaCarro.altitudVuelo = 0;
    fisicaCarro.velocidad = 0;
    fisicaCarro.velY = 0;
    fisicaCarro.yaw = 0;
    fisicaCarro.anguloMovimiento = 0;
    fisicaCarro.pitch = 0;
    fisicaCarro.roll = 0;
    fisicaCarro.anguloVolante = 0;
    fisicaCarro.enAire = false;
    fisicaCarro.derrapando = false;
    fisicaCarro.tiempoDerrape = 0;
    fisicaCarro.tiempoDerrapeActivo = 0;
    fisicaCarro.enfriamientoDerrape = 0;
    fisicaCarro.tiempoTurbo = 0;
    fisicaCarro.tiempoMiniTurbo = 0;

    grupoJuguete.position.set(0, 0.02, 0);
    grupoJuguete.rotation.set(0, 0, 0);
    Object.values(nodosEnganches).forEach((n) => {
      n.grupoContenedor.rotation.y = n.rotacionBaseY;
    });
    const volante = grupoJuguete.getObjectByName('volanteCabina');
    if (volante) volante.rotation.z = 0;

    camara.fov = 60;
    camara.updateProjectionMatrix();
    camara.position.set(2.3, 1.55, 2.6);
    controles.target.set(0, 0.25, 0);
    controles.enabled = true;
    controles.update();

    const insignia = document.getElementById('insignia-estado-hud');
    if (insignia) {
      insignia.textContent = '';
      insignia.className = '';
    }
    const elVel = document.getElementById('valor-velocidad');
    if (elVel) elVel.textContent = '0';
    actualizarBotonesClaseYHUD();
    reiniciarCronometroVuelta(false);

    bandejaInferior.classList.remove('oculta');
    hudConduccion.style.display = 'none';
    btnCamara.style.display = 'none';
    btnAlternarModo.textContent = '¡Conducir! (T)';
    btnAlternarModo.classList.remove('en-conduccion');
    dispararChispasEnEnganche(new THREE.Vector3(0, 0.3, 0));
    enviarApariencia(false);
  }
  cambiarModoMusical(estadoCarro.modoJuego);
  actualizarTextoEstado();
  actualizarPanelesMarioKart();
  actualizarPanelMultijugador();
  actualizarEtiquetasYLeaderboard();
}

/**
 * Alterna entre la cámara en tercera persona y la cámara interior desde la cabina (C3).
 * Por qué: permite cambiar el punto de vista en tiempo real con el botón o la tecla C.
 */
export function alternarCamaraConduccion() {
  estadoCarro.modoCamara = estadoCarro.modoCamara === 'tercera' ? 'cabina' : 'tercera';
  btnCamara.textContent =
    estadoCarro.modoCamara === 'tercera' ? 'Cámara: 3ª Persona (C)' : 'Cámara: Cabina (C)';
  actualizarTextoEstado();
}

/**
 * Renderiza las tarjetas de la bandeja inferior según la categoría activa (B3).
 * Por qué: permite elegir carrocerías, ruedas, accesorios y colores de forma ilimitada.
 */
export function renderizarBandeja(categoria) {
  categoriaActiva = categoria;
  document.querySelectorAll('.btn-pestana').forEach((btn) => {
    const catBtn = btn.dataset.cat;
    const grupoBtn = CATEGORIAS_AGRUPADAS[catBtn];
    const esActiva = catBtn === categoria || (Array.isArray(grupoBtn) && grupoBtn.includes(categoria));
    btn.classList.toggle('activa', esActiva);
  });

  contenedorItems.innerHTML = '';

  if (categoria === 'color') {
    PALETA_COLORES.forEach((col) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-pieza' + (estadoCarro.idColor === col.id ? ' seleccionada' : '');
      const circulo = document.createElement('div');
      circulo.className = 'muestra-color';
      circulo.style.backgroundColor = '#' + col.hex.toString(16).padStart(6, '0');
      const txt = document.createElement('div');
      txt.className = 'nombre-item';
      txt.textContent = col.nombre;
      tarjeta.append(circulo, txt);
      tarjeta.addEventListener('click', () => {
        estadoCarro.colorHex = col.hex;
        estadoCarro.idColor = col.id;
        construirOActualizarCarroceria(estadoCarro.idCarroceria, true, true);
        reproducirCambioColor();
        renderizarBandeja('color');
        enviarApariencia();
      });
      contenedorItems.appendChild(tarjeta);
    });
    return;
  }

  const categoriasPermitidas = CATEGORIAS_AGRUPADAS[categoria] || [categoria];
  const lista =
    categoria === 'carroceria'
      ? TABLA_CARROCERIAS.filter((c) => !c.clase || c.clase === estadoCarro.claseVehiculo)
      : TABLA_PIEZAS.filter(
          (p) =>
            categoriasPermitidas.includes(p.categoria) &&
            (!Array.isArray(p.clasesCompatibles) ||
              p.clasesCompatibles.includes(estadoCarro.claseVehiculo))
        );

  const nodoSeleccionado = estadoCarro.engancheSeleccionadoId
    ? nodosEnganches[estadoCarro.engancheSeleccionadoId]
    : null;
  const piezasActuales = Object.values(estadoCarro.piezasEnEnganches || {});

  lista.forEach((pieza) => {
    const tarjeta = document.createElement('div');
    let estaSeleccionada = false;
    if (pieza.categoria === 'carroceria') {
      estaSeleccionada = pieza.id === estadoCarro.idCarroceria;
    } else if (nodoSeleccionado && nodoSeleccionado.definicion.tipo === pieza.tipoEnganche) {
      const equipada = estadoCarro.piezasEnEnganches[estadoCarro.engancheSeleccionadoId];
      estaSeleccionada = pieza.esVacio ? !equipada : equipada === pieza.id;
    } else if (pieza.esVacio) {
      estaSeleccionada = Object.values(nodosEnganches).some(
        (n) =>
          n.definicion.tipo === pieza.tipoEnganche &&
          !estadoCarro.piezasEnEnganches[n.definicion.id]
      );
    } else {
      estaSeleccionada = piezasActuales.includes(pieza.id);
    }
    tarjeta.className = 'tarjeta-pieza' + (estaSeleccionada ? ' seleccionada' : '');

    if (cacheMiniaturas[pieza.id]) {
      const img = document.createElement('img');
      img.src = cacheMiniaturas[pieza.id];
      img.alt = pieza.nombre;
      tarjeta.appendChild(img);
    }

    const txt = document.createElement('div');
    txt.className = 'nombre-item';
    txt.textContent = pieza.nombre;
    tarjeta.appendChild(txt);

    if (pieza.categoria === 'carroceria' && pieza.atributos && pieza.atributos.statsUI) {
      tarjeta.classList.add('con-stats');
      const { velocidad, aceleracion, control } = pieza.atributos.statsUI;
      const statsBox = document.createElement('div');
      statsBox.className = 'stats-carroceria';
      [
        { etiqueta: 'VEL', valor: velocidad, clase: 'vel' },
        { etiqueta: 'ACEL', valor: aceleracion, clase: 'acel' },
        { etiqueta: 'CTRL', valor: control, clase: 'ctrl' }
      ].forEach((stat) => {
        const fila = document.createElement('div');
        fila.className = 'fila-stat';
        const lbl = document.createElement('span');
        lbl.textContent = stat.etiqueta;
        const fondo = document.createElement('div');
        fondo.className = 'barra-stat-fondo';
        const relleno = document.createElement('div');
        relleno.className = `barra-stat-relleno ${stat.clase}`;
        const pct = Math.max(0, Math.min(100, (stat.valor / TOPE_STAT_UI) * 100));
        relleno.style.width = `${pct}%`;
        fondo.appendChild(relleno);
        const valTxt = document.createElement('span');
        valTxt.className = 'valor-stat';
        valTxt.textContent = stat.valor;
        fila.append(lbl, fondo, valTxt);
        statsBox.appendChild(fila);
      });
      tarjeta.appendChild(statsBox);
    }

    tarjeta.addEventListener('click', () => {
      aplicarSeleccionItemTaller(pieza);
      actualizarTextoEstado();
      renderizarBandeja(categoriaActiva);
    });

    contenedorItems.appendChild(tarjeta);
  });

  actualizarPanelesMarioKart();
}

/**
 * Configura todos los eventos de ratón y teclado tanto para el Taller como para Conducción.
 * Por qué: mantiene el cursor siempre libre (sin pointer lock) y conecta los atajos T, C, R, M, N, V y H.
 */
export function configurarEventosInteraccion() {
  const raycaster = new THREE.Raycaster();
  const raton = new THREE.Vector2();
  let posDown = { x: 0, y: 0 };

  actualizarNombreChasisHUD();
  actualizarBotonesClaseYHUD();
  actualizarPanelesMarioKart();
  inicializarAudioInteractivo();

  // Restaurar apodo del piloto desde localStorage y conectar controles de sala multijugador
  let apodoGuardado = null;
  try {
    if (typeof localStorage !== 'undefined') {
      apodoGuardado = localStorage.getItem(CLAVE_APODO_LOCAL);
    }
  } catch (e) {
    // Ignora restricciones de localStorage
  }
  if (apodoGuardado && apodoGuardado.trim()) {
    estadoRed.apodo = apodoGuardado.trim().slice(0, 20);
  }
  if (inputApodoRed) {
    inputApodoRed.value = estadoRed.apodo || 'Piloto';
    const guardarApodoLocal = () => {
      const limpio = String(inputApodoRed.value || 'Piloto').trim().slice(0, 20) || 'Piloto';
      estadoRed.apodo = limpio;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(CLAVE_APODO_LOCAL, limpio);
        }
      } catch (e) {
        // Ignora errores de almacenamiento local
      }
    };
    inputApodoRed.addEventListener('input', guardarApodoLocal);
    inputApodoRed.addEventListener('change', guardarApodoLocal);
  }

  const leerApodoActual = () => {
    const crudo = inputApodoRed ? inputApodoRed.value : estadoRed.apodo;
    const limpio = String(crudo || 'Piloto').trim().slice(0, 20) || 'Piloto';
    estadoRed.apodo = limpio;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CLAVE_APODO_LOCAL, limpio);
      }
    } catch (e) {
      // Ignora errores de almacenamiento local
    }
    return limpio;
  };

  if (btnCrearSala) {
    btnCrearSala.addEventListener('click', () => {
      const apodo = leerApodoActual();
      mostrarAvisoRed('Creando sala online...');
      crearSalaOnline(apodo, estadoCarro.idHabitacion);
    });
  }
  const intentarUnirse = () => {
    const codigo = inputCodigoSala ? String(inputCodigoSala.value || '').trim().toUpperCase() : '';
    if (codigo.length < 4) {
      mostrarAvisoRed('Ingresa el código de 4 caracteres de la sala.', true);
      return;
    }
    const apodo = leerApodoActual();
    mostrarAvisoRed(`Conectando a ${codigo}...`);
    unirseSalaOnline(codigo, apodo);
  };
  if (btnUnirseSala) {
    btnUnirseSala.addEventListener('click', intentarUnirse);
  }
  if (inputCodigoSala) {
    inputCodigoSala.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        intentarUnirse();
      }
    });
  }
  if (btnSalirSala) {
    btnSalirSala.addEventListener('click', () => {
      salirDeSala();
      mostrarAvisoRed('Saliste de la sala multijugador.');
      actualizarPanelMultijugador();
      actualizarEtiquetasYLeaderboard();
    });
  }
  if (codigoSalaActivo) {
    codigoSalaActivo.addEventListener('click', () => {
      if (!estadoRed.codigoSala) return;
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(estadoRed.codigoSala).then(
          () => mostrarAvisoRed(`Código ${estadoRed.codigoSala} copiado.`),
          () => mostrarAvisoRed(`Sala: ${estadoRed.codigoSala}`)
        );
      } else {
        mostrarAvisoRed(`Sala: ${estadoRed.codigoSala}`);
      }
    });
  }

  window.addEventListener('red:sala_actualizada', () => {
    actualizarPanelMultijugador();
    actualizarEtiquetasYLeaderboard();
  });
  window.addEventListener('red:cambiar_habitacion', (ev) => {
    const hid = ev && ev.detail && ev.detail.habitacionId;
    if (hid && CATALOGO_HABITACIONES[hid] && hid !== estadoCarro.idHabitacion) {
      cambiarHabitacion(hid, true);
    }
  });
  window.addEventListener('red:error', (ev) => {
    const msg = (ev && ev.detail && ev.detail.mensaje) || 'Error de red multijugador.';
    mostrarAvisoRed(msg, true);
    actualizarPanelMultijugador();
    actualizarEtiquetasYLeaderboard();
  });

  actualizarPanelMultijugador();
  actualizarEtiquetasYLeaderboard();

  const gestionarBotonAudio = () => {
    const sil = alternarSilencio();
    if (btnAudio) {
      btnAudio.textContent = sil ? '🔇 Silencio (M)' : '🔊 Audio (M)';
      btnAudio.classList.toggle('silenciado', sil);
    }
  };
  if (btnAudio) {
    btnAudio.addEventListener('click', gestionarBotonAudio);
  }

  let timerTituloPista = null;
  const gestionarCambioPista = () => {
    const titulo = cambiarPistaConduccion();
    if (btnPista) {
      btnPista.textContent = `🎵 ${titulo} (N)`;
      if (timerTituloPista) clearTimeout(timerTituloPista);
      timerTituloPista = setTimeout(() => {
        btnPista.textContent = '🎵 Pista (N)';
      }, 2200);
    }
    if (barraEstado && estadoCarro.modoJuego === 'conduccion') {
      barraEstado.innerHTML = `Pista musical activa: <span class="destacado">${titulo}</span> (Tecla N para cambiar).`;
    }
  };
  if (btnPista) {
    btnPista.addEventListener('click', gestionarCambioPista);
  }

  actualizarTextoBtnHabitacion();
  if (btnHabitacion) {
    btnHabitacion.addEventListener('click', () => cambiarHabitacion());
  }

  if (btnClaseVehiculo) {
    btnClaseVehiculo.addEventListener('click', () => cambiarClaseVehiculo());
  }

  document.querySelectorAll('.btn-clase-mk').forEach((btn) => {
    btn.addEventListener('click', () => cambiarClaseVehiculo(btn.dataset.clase));
  });
  document.querySelectorAll('.btn-flecha-mk').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ciclarOpcionRanuraMK(btn.dataset.ranura, Number(btn.dataset.dir) || 1);
    });
  });
  document.querySelectorAll('.ranura-mk').forEach((fila) => {
    fila.addEventListener('click', () => {
      ranuraMKActiva = fila.dataset.ranura || 'chasis';
      actualizarPanelesMarioKart();
    });
  });
  if (btnAbrirCopasMK) {
    btnAbrirCopasMK.addEventListener('click', abrirModalCircuitosMK);
  }
  if (btnCopasMK) {
    btnCopasMK.addEventListener('click', abrirModalCircuitosMK);
  }
  if (btnCerrarModalMK) {
    btnCerrarModalMK.addEventListener('click', cerrarModalCircuitosMK);
  }
  if (modalCircuitosMK) {
    modalCircuitosMK.addEventListener('click', (e) => {
      if (e.target === modalCircuitosMK) cerrarModalCircuitosMK();
    });
  }

  btnAlternarModo.addEventListener('click', alternarModoTallerConduccion);
  btnCamara.addEventListener('click', alternarCamaraConduccion);

  window.addEventListener('keydown', (e) => {
    const tagActivo = document.activeElement && document.activeElement.tagName;
    if (tagActivo === 'INPUT' || tagActivo === 'TEXTAREA') {
      if (e.code === 'Escape' && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      return;
    }
    if (e.code === 'Space' && estadoCarro.modoJuego === 'conduccion') {
      e.preventDefault();
    }
    teclasConduccion[e.code] = true;
    if (!e.repeat && e.code === 'Escape') cerrarModalCircuitosMK();
    if (!e.repeat && e.code === 'KeyT') alternarModoTallerConduccion();
    if (!e.repeat && e.code === 'KeyV') cambiarClaseVehiculo();
    if (!e.repeat && e.code === 'KeyH') cambiarHabitacion();
    if (!e.repeat && e.code === 'KeyM') gestionarBotonAudio();
    if (!e.repeat && e.code === 'KeyN') gestionarCambioPista();
    if (!e.repeat && estadoCarro.modoJuego === 'taller') {
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        const ordenRanuras = ['chasis', 'primaria', 'secundaria', 'pintura'];
        const idxR = Math.max(0, ordenRanuras.indexOf(ranuraMKActiva));
        const sigR =
          (idxR + (e.code === 'ArrowUp' ? -1 : 1) + ordenRanuras.length) % ordenRanuras.length;
        ranuraMKActiva = ordenRanuras[sigR];
        actualizarPanelesMarioKart();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        ciclarOpcionRanuraMK(ranuraMKActiva, e.code === 'ArrowLeft' ? -1 : 1);
      }
    }
    if (!e.repeat && e.code === 'KeyC' && estadoCarro.modoJuego === 'conduccion') {
      alternarCamaraConduccion();
    }
    if (!e.repeat && e.code === 'KeyR' && estadoCarro.modoJuego === 'conduccion') {
      reposicionarEnMeta();
    }
  });

  window.addEventListener('keyup', (e) => {
    teclasConduccion[e.code] = false;
  });

  document.querySelectorAll('.btn-pestana').forEach((btn) => {
    btn.addEventListener('click', () => {
      estadoCarro.engancheSeleccionadoId = null;
      actualizarTextoEstado();
      renderizarBandeja(btn.dataset.cat);
    });
  });

  btnModoRuedas.addEventListener('click', () => {
    estadoCarro.modoSimetriaEnganches = !estadoCarro.modoSimetriaEnganches;
    actualizarBotonesClaseYHUD();
    actualizarPanelesMarioKart();
  });

  btnQuitar.addEventListener('click', () => {
    if (estadoCarro.engancheSeleccionadoId) {
      colocarPiezaEnEnganche(estadoCarro.engancheSeleccionadoId, null, true);
    } else {
      const cfg = RANURAS_MK_POR_CLASE[estadoCarro.claseVehiculo] || RANURAS_MK_POR_CLASE.coche;
      const catPreferida =
        ranuraMKActiva === 'primaria'
          ? [cfg.primaria.cat]
          : ranuraMKActiva === 'secundaria'
          ? [(cfg.secundarias[subRanuraSecundariaIdx % cfg.secundarias.length] || {}).cat]
          : CATEGORIAS_AGRUPADAS[categoriaActiva] || [categoriaActiva];
      const objetivos = Object.entries(nodosEnganches).filter(([, nodo]) =>
        catPreferida.includes(nodo.definicion.tipo)
      );
      const listaFinal =
        objetivos.length > 0
          ? objetivos
          : Object.entries(nodosEnganches).filter(([, nodo]) =>
              nodo.definicion.tipo.startsWith('accesorio')
            );
      listaFinal.forEach(([idEng]) => colocarPiezaEnEnganche(idEng, null, true));
    }
    actualizarTextoEstado();
    renderizarBandeja(categoriaActiva);
    enviarApariencia();
  });

  lienzo.addEventListener('pointermove', (e) => {
    if (estadoCarro.modoJuego !== 'taller') {
      lienzo.style.cursor = 'default';
      return;
    }
    raton.x = (e.clientX / window.innerWidth) * 2 - 1;
    raton.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(raton, camara);
    const intersecciones = raycaster.intersectObjects(listaColisionadoresEnganches, false);

    if (intersecciones.length > 0) {
      estadoCarro.engancheHoverId = intersecciones[0].object.userData.idEnganche;
      lienzo.style.cursor = 'pointer';
    } else {
      estadoCarro.engancheHoverId = null;
      lienzo.style.cursor = 'grab';
    }
  });

  lienzo.addEventListener('pointerdown', (e) => {
    posDown = { x: e.clientX, y: e.clientY };
  });

  lienzo.addEventListener('pointerup', (e) => {
    if (estadoCarro.modoJuego !== 'taller') return;
    if (Math.hypot(e.clientX - posDown.x, e.clientY - posDown.y) > 6) return;

    raton.x = (e.clientX / window.innerWidth) * 2 - 1;
    raton.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(raton, camara);
    const intersecciones = raycaster.intersectObjects(listaColisionadoresEnganches, false);

    if (intersecciones.length > 0) {
      const idEng = intersecciones[0].object.userData.idEnganche;
      const nodo = nodosEnganches[idEng];
      if (!nodo) return;

      if (e.button === 2) {
        colocarPiezaEnEnganche(idEng, null, true);
        actualizarTextoEstado();
        actualizarPanelesMarioKart();
        enviarApariencia();
      } else {
        estadoCarro.engancheSeleccionadoId = idEng;
        if (nodo.definicion.grupoSimetria) {
          estadoCarro.modoSimetriaEnganches = false;
          actualizarBotonesClaseYHUD();
        }
        const cfg = RANURAS_MK_POR_CLASE[estadoCarro.claseVehiculo] || RANURAS_MK_POR_CLASE.coche;
        if (nodo.definicion.tipo === cfg.primaria.cat) {
          ranuraMKActiva = 'primaria';
        } else {
          const idxSub = (cfg.secundarias || []).findIndex((s) => s.cat === nodo.definicion.tipo);
          if (idxSub >= 0) {
            ranuraMKActiva = 'secundaria';
            subRanuraSecundariaIdx = idxSub;
          }
        }
        actualizarTextoEstado();
        renderizarBandeja(nodo.definicion.tipo);
      }
    }
  });

  lienzo.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
  });
}
