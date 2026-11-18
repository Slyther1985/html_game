import http from 'node:http';
import { pathToFileURL } from 'node:url';
import WebSocket, { WebSocketServer } from 'ws';

const MAX_JUGADORES_SALA = 8;
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigoSala(salas) {
  let intento = '';
  do {
    intento = '';
    for (let i = 0; i < 4; i++) {
      intento += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
    }
  } while (salas.has(intento));
  return intento;
}

function buscarSlotLibre(sala) {
  const ocupados = new Set();
  for (const jug of sala.jugadores.values()) {
    ocupados.add(jug.slotParrilla);
  }
  for (let slot = 0; slot < MAX_JUGADORES_SALA; slot++) {
    if (!ocupados.has(slot)) return slot;
  }
  return -1;
}

function serializarJugador(jug) {
  return {
    id: jug.id,
    apodo: jug.apodo,
    slotParrilla: jug.slotParrilla,
    esAnfitrion: jug.esAnfitrion,
    apariencia: jug.apariencia,
    enPista: Boolean(jug.enPista),
    vuelta: jug.vuelta,
    checkpointActual: jug.checkpointActual,
    mejorVuelta: jug.mejorVuelta
  };
}

function enviarJson(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function difundirSala(sala, payload, excluirId = null) {
  const raw = JSON.stringify(payload);
  for (const [id, jug] of sala.jugadores.entries()) {
    if (id !== excluirId && jug.ws && jug.ws.readyState === WebSocket.OPEN) {
      jug.ws.send(raw);
    }
  }
}

export function crearServidorSalas() {
  const salas = new Map();
  let contadorJugadores = 0;

  const servidorHttp = http.createServer((req, res) => {
    const ruta = (req.url || '/').split('?')[0];
    if (req.method === 'GET' && (ruta === '/' || ruta === '/health')) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({ status: 'ok', salasActivas: salas.size }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  const wss = new WebSocketServer({ server: servidorHttp });

  function expulsarDeSalaActual(cliente) {
    if (!cliente.codigoSala) return;
    const sala = salas.get(cliente.codigoSala);
    cliente.codigoSala = null;
    if (!sala || !sala.jugadores.has(cliente.id)) return;

    sala.jugadores.delete(cliente.id);

    if (sala.jugadores.size === 0) {
      salas.delete(sala.codigo);
      return;
    }

    if (sala.anfitrionId === cliente.id) {
      let nuevoAnfitrion = null;
      for (const jug of sala.jugadores.values()) {
        if (!nuevoAnfitrion || jug.slotParrilla < nuevoAnfitrion.slotParrilla) {
          nuevoAnfitrion = jug;
        }
      }
      if (nuevoAnfitrion) {
        sala.anfitrionId = nuevoAnfitrion.id;
        nuevoAnfitrion.esAnfitrion = true;
      }
    }

    difundirSala(sala, {
      tipo: 'jugador_salio',
      codigoSala: sala.codigo,
      id: cliente.id,
      nuevoAnfitrionId: sala.anfitrionId
    });
  }

  wss.on('connection', (ws) => {
    contadorJugadores += 1;
    const cliente = {
      id: `p_${contadorJugadores}`,
      codigoSala: null,
      ws
    };

    ws.on('message', (buffer) => {
      let msg = null;
      try {
        msg = JSON.parse(String(buffer));
      } catch (e) {
        enviarJson(ws, { tipo: 'error', codigo: 'JSON_INVALIDO', mensaje: 'Mensaje JSON inválido' });
        return;
      }
      if (!msg || typeof msg.tipo !== 'string') return;

      if (msg.tipo === 'crear_sala') {
        expulsarDeSalaActual(cliente);
        const codigo = generarCodigoSala(salas);
        const habitacionId = typeof msg.habitacionId === 'string' && msg.habitacionId
          ? msg.habitacionId
          : 'habitacion_andy';
        const apodo = String(msg.apodo || 'Piloto').trim().slice(0, 24) || 'Piloto';
        const jugador = {
          id: cliente.id,
          apodo,
          slotParrilla: 0,
          esAnfitrion: true,
          apariencia: msg.apariencia || null,
          enPista: Boolean(msg.enPista),
          vuelta: 1,
          checkpointActual: 0,
          mejorVuelta: null,
          ws
        };
        const sala = {
          codigo,
          habitacionId,
          anfitrionId: cliente.id,
          jugadores: new Map([[cliente.id, jugador]])
        };
        salas.set(codigo, sala);
        cliente.codigoSala = codigo;

        enviarJson(ws, {
          tipo: 'sala_creada',
          codigoSala: codigo,
          miId: cliente.id,
          slotParrilla: 0,
          esAnfitrion: true,
          habitacionId,
          jugadores: [serializarJugador(jugador)]
        });
        return;
      }

      if (msg.tipo === 'unirse_sala') {
        const codigo = String(msg.codigoSala || '').trim().toUpperCase();
        const sala = salas.get(codigo);
        if (!sala) {
          enviarJson(ws, {
            tipo: 'error',
            codigo: 'SALA_NO_ENCONTRADA',
            mensaje: `No existe la sala '${codigo}'.`
          });
          return;
        }
        if (cliente.codigoSala !== codigo && sala.jugadores.size >= MAX_JUGADORES_SALA) {
          enviarJson(ws, {
            tipo: 'error',
            codigo: 'SALA_LLENA',
            mensaje: `La sala '${codigo}' está llena (máximo ${MAX_JUGADORES_SALA} jugadores).`
          });
          return;
        }

        expulsarDeSalaActual(cliente);
        const slot = buscarSlotLibre(sala);
        if (slot < 0) {
          enviarJson(ws, {
            tipo: 'error',
            codigo: 'SALA_LLENA',
            mensaje: `No hay lugares disponibles en la sala '${codigo}'.`
          });
          return;
        }

        const apodo = String(msg.apodo || 'Piloto').trim().slice(0, 24) || 'Piloto';
        const jugador = {
          id: cliente.id,
          apodo,
          slotParrilla: slot,
          esAnfitrion: false,
          apariencia: msg.apariencia || null,
          enPista: Boolean(msg.enPista),
          vuelta: 1,
          checkpointActual: 0,
          mejorVuelta: null,
          ws
        };
        sala.jugadores.set(cliente.id, jugador);
        cliente.codigoSala = codigo;

        const listaActual = Array.from(sala.jugadores.values()).map(serializarJugador);
        enviarJson(ws, {
          tipo: 'sala_unida',
          codigoSala: codigo,
          miId: cliente.id,
          slotParrilla: slot,
          esAnfitrion: false,
          habitacionId: sala.habitacionId,
          jugadores: listaActual
        });

        difundirSala(
          sala,
          {
            tipo: 'jugador_entro',
            codigoSala: codigo,
            jugador: serializarJugador(jugador)
          },
          cliente.id
        );
        return;
      }

      if (msg.tipo === 'salir_sala') {
        expulsarDeSalaActual(cliente);
        return;
      }

      const sala = cliente.codigoSala ? salas.get(cliente.codigoSala) : null;
      if (!sala) return;
      const jugador = sala.jugadores.get(cliente.id);
      if (!jugador) return;

      if (msg.tipo === 'cambiar_habitacion') {
        if (sala.anfitrionId !== cliente.id) {
          enviarJson(ws, {
            tipo: 'error',
            codigo: 'NO_ES_ANFITRION',
            mensaje: 'Solo el anfitrión puede cambiar la habitación de la sala.'
          });
          return;
        }
        if (typeof msg.habitacionId === 'string' && msg.habitacionId) {
          sala.habitacionId = msg.habitacionId;
          difundirSala(sala, {
            tipo: 'habitacion_cambiada',
            codigoSala: sala.codigo,
            habitacionId: sala.habitacionId
          });
        }
        return;
      }

      if (msg.tipo === 'apariencia') {
        if (msg.apariencia) {
          jugador.apariencia = msg.apariencia;
        }
        if (typeof msg.enPista === 'boolean') {
          jugador.enPista = msg.enPista;
        }
        difundirSala(
          sala,
          {
            tipo: 'apariencia_actualizada',
            id: jugador.id,
            apodo: jugador.apodo,
            slotParrilla: jugador.slotParrilla,
            apariencia: jugador.apariencia,
            enPista: jugador.enPista
          },
          cliente.id
        );
        return;
      }

      if (msg.tipo === 'telemetria') {
        if (typeof msg.vuelta === 'number') jugador.vuelta = msg.vuelta;
        if (typeof msg.checkpointActual === 'number') jugador.checkpointActual = msg.checkpointActual;
        if (msg.mejorVuelta !== undefined) jugador.mejorVuelta = msg.mejorVuelta;
        if (typeof msg.enPista === 'boolean') jugador.enPista = msg.enPista;

        difundirSala(
          sala,
          {
            tipo: 'telemetria',
            id: jugador.id,
            x: msg.x ?? 0,
            y: msg.y ?? 0.02,
            z: msg.z ?? 0,
            yaw: msg.yaw ?? 0,
            pitch: msg.pitch ?? 0,
            roll: msg.roll ?? 0,
            velocidad: msg.velocidad ?? 0,
            anguloVolante: msg.anguloVolante ?? 0,
            derrapando: Boolean(msg.derrapando),
            turbo: Boolean(msg.turbo),
            enPista: Boolean(jugador.enPista),
            vuelta: jugador.vuelta,
            checkpointActual: jugador.checkpointActual,
            mejorVuelta: jugador.mejorVuelta
          },
          cliente.id
        );
      }
    });

    ws.on('close', () => {
      expulsarDeSalaActual(cliente);
    });
  });

  return { servidorHttp, wss, salas };
}

const esEntradaDirecta =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esEntradaDirecta) {
  const puerto = Number(process.env.PORT) || 8080;
  const { servidorHttp } = crearServidorSalas();
  servidorHttp.listen(puerto, () => {
    console.log(`Servidor WebSocket de salas escuchando en puerto ${puerto}`);
  });
}
