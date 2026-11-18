import { CATALOGO_HABITACIONES } from './constantes.js';
import {
  estadoCarro,
  fisicaCarro,
  nodosEnganches,
  animacionesActivas,
  chorrosChispasActivos
} from './estado.js';
import { inicializarRecursos, liberarObjeto3D, bancoTexturas } from './recursos.js';
import {
  escena,
  camara,
  renderizador,
  controles,
  sistemaPolvo,
  cargarEscenario
} from './escenario.js';
import { construirOActualizarCarroceria } from './enganches.js';
import { actualizarFisicaConduccion, actualizarCamaraConduccion, actualizarObstaculos } from './conduccion.js';
import {
  generarMiniaturasCatalogo,
  configurarEventosInteraccion,
  renderizarBandeja,
  actualizarEtiquetasYLeaderboard
} from './interfaz.js';
import { actualizarMusicaAmbiental, actualizarAudioMotor } from './audio.js';
import { actualizarRed } from './red.js';

let tiempoAnterior = performance.now();

/**
 * Actualiza la escena en cada fotograma según el modo activo (Taller o Conducción),
 * además de las motas de polvo, las interpolaciones elásticas y las chispas.
 * Por qué: mantiene 60 FPS constantes coordinando físicas, cámaras y efectos visuales.
 */
function actualizarEscena(dt, tiempoTotal) {
  if (estadoCarro.modoJuego === 'taller') {
    controles.update();

    if (Math.abs(camara.fov - 60) > 0.05) {
      camara.fov += (60 - camara.fov) * Math.min(1, dt * 8);
      camara.updateProjectionMatrix();
    } else if (camara.fov !== 60) {
      camara.fov = 60;
      camara.updateProjectionMatrix();
    }

    // Anillos emisivos pulsantes en los enganches (B3)
    const pulso = 1.0 + Math.sin(tiempoTotal * 5.0) * 0.14;
    Object.keys(nodosEnganches).forEach((idEng) => {
      const nodo = nodosEnganches[idEng];
      const esHover = estadoCarro.engancheHoverId === idEng;
      const esSelec = estadoCarro.engancheSeleccionadoId === idEng;
      const anillo = nodo.anilloIndicador;

      if (esHover || esSelec) {
        anillo.material.opacity = esHover ? 0.92 : 0.75;
        anillo.scale.set(pulso, pulso, pulso);
      } else {
        anillo.material.opacity = !nodo.mallaPieza ? 0.32 : 0.0;
        anillo.scale.set(1, 1, 1);
      }
    });
    actualizarAudioMotor(0, 1, estadoCarro.idCarroceria, false);
  } else {
    actualizarFisicaConduccion(dt);
    actualizarCamaraConduccion(dt);
  }

  actualizarMusicaAmbiental(dt, estadoCarro.modoJuego, fisicaCarro.tiempoTurbo > 0);
  actualizarRed(dt);
  actualizarEtiquetasYLeaderboard();

  // Animación UV de chevrones luminosos en Boost Pads y obstáculos de pista
  if (bancoTexturas.texturaTurboPad) {
    bancoTexturas.texturaTurboPad.offset.x -= dt * 2.6;
  }
  actualizarObstaculos(dt, tiempoTotal);

  // Flotación lenta del polvo en el haz de la ventana según los límites de la habitación activa (A5)
  if (sistemaPolvo) {
    const habActiva = CATALOGO_HABITACIONES[estadoCarro.idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
    const attrPos = sistemaPolvo.geometry.attributes.position;
    const vels = sistemaPolvo.userData.velocidades || [];
    const totalPolvo = Math.min(habActiva.ambiente.cantidadParticulas, attrPos.count, vels.length);
    const techoPolvo = habActiva.ambiente.techoParticulas || 6.2;
    for (let i = 0; i < totalPolvo; i++) {
      let x = attrPos.getX(i) + Math.sin(tiempoTotal * 0.7 + vels[i].fase) * 0.0015;
      let y = attrPos.getY(i) + vels[i].vy * dt;
      let z = attrPos.getZ(i) + Math.cos(tiempoTotal * 0.6 + vels[i].fase) * 0.0015;
      if (y > techoPolvo) y = 0.15;
      attrPos.setXYZ(i, x, y, z);
    }
    attrPos.needsUpdate = true;
  }

  // Interpolaciones propias de entrada elástica y salida de piezas (B4)
  for (let i = animacionesActivas.length - 1; i >= 0; i--) {
    const anim = animacionesActivas[i];
    anim.progreso += dt / anim.duracion;
    const t = Math.min(1, anim.progreso);

    if (anim.tipo === 'entrada') {
      const elastico =
        t === 1
          ? 1
          : 1 - Math.pow(2, -9 * t) * Math.cos((t * 9 - 0.75) * ((2 * Math.PI) / 3));
      anim.objeto.scale.set(
        anim.escalaDestino.x * elastico,
        anim.escalaDestino.y * elastico,
        anim.escalaDestino.z * elastico
      );
      if (t >= 1) {
        anim.objeto.scale.copy(anim.escalaDestino);
        animacionesActivas.splice(i, 1);
      }
    } else if (anim.tipo === 'salida') {
      const salto = Math.sin(t * Math.PI) * 0.18;
      anim.objeto.position.y = anim.yInicial + salto;
      const esc = Math.max(0.01, 1 - t);
      anim.objeto.scale.set(
        anim.escalaInicial.x * esc,
        anim.escalaInicial.y * esc,
        anim.escalaInicial.z * esc
      );
      anim.objeto.traverse((h) => {
        if (h.isMesh && h.material) h.material.opacity = 1 - t;
      });
      if (t >= 1) {
        escena.remove(anim.objeto);
        liberarObjeto3D(anim.objeto);
        animacionesActivas.splice(i, 1);
      }
    }
  }

  // Chorros de chispas al encajar piezas o aterrizar de un salto
  for (let i = chorrosChispasActivos.length - 1; i >= 0; i--) {
    const ch = chorrosChispasActivos[i];
    ch.edad += dt;
    const norm = ch.edad / ch.duracion;
    if (norm >= 1) {
      escena.remove(ch.puntos);
      liberarObjeto3D(ch.puntos);
      chorrosChispasActivos.splice(i, 1);
      continue;
    }
    const attr = ch.puntos.geometry.attributes.position;
    for (let p = 0; p < ch.vels.length; p++) {
      const v = ch.vels[p];
      v.vy -= 2.8 * dt;
      attr.setXYZ(
        p,
        attr.getX(p) + v.vx * dt,
        attr.getY(p) + v.vy * dt,
        attr.getZ(p) + v.vz * dt
      );
    }
    attr.needsUpdate = true;
    ch.puntos.material.opacity = 1 - norm;
  }
}

/**
 * Bucle principal de animación sincronizado con requestAnimationFrame.
 * Por qué: calcula el paso de tiempo (dt) y dibuja la escena de forma continua.
 */
function buclePrincipal(ahora) {
  const dt = Math.min(0.05, (ahora - tiempoAnterior) / 1000);
  tiempoAnterior = ahora;

  actualizarEscena(dt, ahora * 0.001);
  renderizador.render(escena, camara);
  requestAnimationFrame(buclePrincipal);
}

// Arranque ordenado del juego
inicializarRecursos();
cargarEscenario(estadoCarro.idHabitacion);
generarMiniaturasCatalogo();
construirOActualizarCarroceria('carroceria_sedan', false);
configurarEventosInteraccion();
renderizarBandeja('carroceria');
requestAnimationFrame(buclePrincipal);
