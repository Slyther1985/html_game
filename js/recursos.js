import { URLS_TEXTURAS } from './constantes.js';

export const cargadorTexturas = new THREE.TextureLoader();
cargadorTexturas.setCrossOrigin('anonymous');

export const bancoTexturas = {};
export const cacheMiniaturas = {};

/**
 * Crea una geometría de caja con bordes redondeados usando RoundedBoxGeometry.
 * Por qué: garantiza que ningún mueble, rampa ni pieza tenga aristas afiladas (A3).
 */
export function crearCajaRedondeada(ancho, alto, profundo, segmentos, radio) {
  if (typeof THREE.RoundedBoxGeometry === 'function') {
    return new THREE.RoundedBoxGeometry(ancho, alto, profundo, segmentos || 4, radio || 0.03);
  }
  return new THREE.BoxGeometry(ancho, alto, profundo);
}

const SLOTS_TEXTURA_MATERIAL = [
  'map',
  'roughnessMap',
  'bumpMap',
  'normalMap',
  'emissiveMap',
  'alphaMap',
  'aoMap',
  'metalnessMap',
  'specularMap'
];

function liberarMaterialYClones(mat, texturasLiberadas) {
  if (!mat) return;
  for (let i = 0; i < SLOTS_TEXTURA_MATERIAL.length; i++) {
    const tex = mat[SLOTS_TEXTURA_MATERIAL[i]];
    if (
      tex &&
      tex.userData &&
      tex.userData.esClonTemporal === true &&
      typeof tex.dispose === 'function' &&
      !texturasLiberadas.has(tex)
    ) {
      texturasLiberadas.add(tex);
      tex.dispose();
    }
  }
  if (typeof mat.dispose === 'function') {
    mat.dispose();
  }
}

/**
 * Libera de la memoria GPU las geometrías, materiales y texturas clonadas temporalmente
 * de un objeto 3D retirado sin afectar las texturas compartidas de bancoTexturas.
 * Por qué: evita fugas de memoria al cambiar piezas o escenarios repetidamente (B4 y C4.c).
 */
export function liberarObjeto3D(objeto) {
  if (!objeto) return;
  const texturasLiberadas = new Set();
  objeto.traverse((hijo) => {
    if (hijo.geometry) hijo.geometry.dispose();
    if (hijo.material) {
      if (Array.isArray(hijo.material)) {
        hijo.material.forEach((m) => liberarMaterialYClones(m, texturasLiberadas));
      } else {
        liberarMaterialYClones(hijo.material, texturasLiberadas);
      }
    }
  });
}

/**
 * Genera en un canvas una textura de madera de respaldo (diffuse, roughness o bump).
 * Por qué: asegura que el piso luzca vetas de madera aunque falle la conexión a internet.
 */
export function crearRespaldoMaderaCanvas(modo) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  if (modo === 'diffuse') {
    ctx.fillStyle = '#9c6b43';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(80, 45, 20, 0.16)' : 'rgba(190, 140, 95, 0.14)';
      ctx.fillRect(0, (i * 17) % 256, 256, 3 + (i % 5));
    }
    ctx.strokeStyle = 'rgba(50, 28, 12, 0.45)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = modo === 'roughness' ? '#b0b0b0' : '#808080';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#606060';
    for (let y = 0; y < 256; y += 64) ctx.fillRect(0, y, 256, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  if (modo === 'diffuse') tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera en un canvas un sprite radial suave para partículas de polvo o chispas.
 * Por qué: mantiene funcionales los efectos de luz y chispas sin conexión a internet.
 */
export function crearRespaldoSpriteCanvas(suave) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(suave ? 0.4 : 0.7, 'rgba(255, 245, 210, 0.7)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Carga una textura externa autorizada aplicando de inmediato su respaldo en canvas.
 * Por qué: evita errores fatales si falla la carga y avisa en consola.
 */
export function cargarTexturaSegura(url, texRespaldo, configurar) {
  if (configurar) configurar(texRespaldo);
  cargadorTexturas.load(
    url,
    (texCargada) => {
      texRespaldo.image = texCargada.image;
      if (configurar) configurar(texRespaldo);
      texRespaldo.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn('Aviso: Falló la carga de ' + url + '. Usando textura procedural de respaldo.');
    }
  );
  return texRespaldo;
}

/**
 * Genera la textura del papel tapiz icónico estilo habitación infantil con cielo azul vibrante
 * y nubes blancas estilizadas de base horizontal plana.
 */
export function crearTexturaPapelTapiz() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Cielo azul vibrante (#52a8ff) con leve luminosidad hacia el horizonte
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#469ef8');
  grad.addColorStop(0.55, '#52a8ff');
  grad.addColorStop(1, '#68b7ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const dibujarNubePlana = (cx, cy, s) => {
    // Sombra suave bajo la base plana
    ctx.fillStyle = '#d8eeff';
    ctx.beginPath();
    ctx.ellipse(cx + 2 * s, cy + 4 * s, 56 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cúpulas blancas superiores y base horizontal perfectamente plana
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 56 * s, cy);
    ctx.arc(cx - 34 * s, cy, 22 * s, Math.PI, 0, false);
    ctx.arc(cx - 8 * s, cy - 2 * s, 31 * s, Math.PI, 0, false);
    ctx.arc(cx + 22 * s, cy, 23 * s, Math.PI, 0, false);
    ctx.arc(cx + 43 * s, cy, 14 * s, Math.PI, 0, false);
    ctx.lineTo(cx + 57 * s, cy);
    ctx.lineTo(cx - 56 * s, cy);
    ctx.closePath();
    ctx.fill();

    // Relleno central para unificar la base plana sin huecos
    ctx.fillRect(cx - 55 * s, cy - 12 * s, 111 * s, 12 * s);
  };

  // Patrón escalonado limpio sin cortar bordes
  dibujarNubePlana(118, 108, 1.05);
  dibujarNubePlana(372, 134, 0.92);
  dibujarNubePlana(248, 256, 1.12);
  dibujarNubePlana(102, 396, 0.88);
  dibujarNubePlana(386, 412, 1.02);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 2);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la textura tejida de la alfombra circular con anillos de colores y ruido.
 * Por qué: marca en el centro de la habitación la zona de taller de 3 m de diámetro (A3).
 */
export function crearTexturaAlfombra() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const anillos = [
    { r: 256, color: '#d97742' },
    { r: 230, color: '#f3e5ab' },
    { r: 190, color: '#5c9ead' },
    { r: 140, color: '#f4a261' },
    { r: 90, color: '#e9c46a' },
    { r: 45, color: '#2a9d8f' }
  ];

  ctx.fillStyle = '#d97742';
  ctx.fillRect(0, 0, 512, 512);
  anillos.forEach((a) => {
    ctx.beginPath();
    ctx.arc(256, 256, a.r, 0, Math.PI * 2);
    ctx.fillStyle = a.color;
    ctx.fill();
  });

  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la textura de asfalto de juguete con líneas centrales discontinuas y bordes.
 * Por qué: viste todos los tramos rectos, curvas y rampas de la pista de carreras (A4).
 */
export function crearTexturaPistaAsfalto() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#2d343e';
  ctx.fillRect(0, 0, 256, 256);

  // Grano de asfalto
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Líneas blancas continuas en los bordes laterales
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 10, 256, 8);
  ctx.fillRect(0, 238, 256, 8);

  // Línea central discontinua amarilla
  ctx.fillStyle = '#fbbf24';
  for (let x = 16; x < 256; x += 64) {
    ctx.fillRect(x, 124, 36, 8);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la textura rojiblanca para los pianos (bordes de curva y rampas).
 * Por qué: resalta las curvas de carreras y las zonas de rampa del circuito (A4).
 */
export function crearTexturaPianoCurva() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f8fafc';
    ctx.fillRect(i * 32, 0, 32, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la textura de bandera a cuadros blancos y negros para la línea y el arco de meta.
 * Por qué: identifica visualmente la salida y meta del circuito en la recta Sur (A4).
 */
export function crearTexturaMetaCuadros() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const tam = 32;
  for (let y = 0; y < 128; y += tam) {
    for (let x = 0; x < 256; x += tam) {
      ctx.fillStyle = (x / tam + y / tam) % 2 === 0 ? '#111827' : '#ffffff';
      ctx.fillRect(x, y, tam, tam);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera y cachea la textura procedural en canvas para la banda de rodadura de los neumáticos.
 * Soporta estilo 'todoterreno' (bloques profundos escalonados) y 'deportiva'/'clasica' (en V).
 */
export function crearTexturaBandaRodadura(estilo = 'deportiva') {
  const clave = estilo === 'todoterreno' ? 'rodaduraTodoterreno' : 'rodaduraDeportiva';
  if (bancoTexturas[clave]) return bancoTexturas[clave];

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  if (estilo === 'todoterreno') {
    // Fondo oscuro profundo para los surcos entre tacos
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, 256, 256);

    // Bloques escalonados de alto contraste en filas centrales y laterales
    for (let x = 0; x < 256; x += 64) {
      ctx.fillStyle = '#e8e8e8';
      // Tacos laterales izquierdos y derechos
      ctx.fillRect(x + 6, 12, 50, 52);
      ctx.fillRect(x + 6, 192, 50, 52);

      // Tacos centrales alternados (escalonados)
      ctx.fillRect(x + 4, 78, 26, 44);
      ctx.fillRect((x + 34) % 256, 134, 26, 44);
    }
    // Micro-laminillas en cada taco
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 3;
    for (let x = 16; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 38);
      ctx.lineTo(x + 28, 38);
      ctx.moveTo(x, 218);
      ctx.lineTo(x + 28, 218);
      ctx.stroke();
    }
  } else {
    // Superficie elevada del caucho
    ctx.fillStyle = '#dedede';
    ctx.fillRect(0, 0, 256, 256);

    // Canales longitudinales principales
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 108, 256, 12);
    ctx.fillRect(0, 136, 256, 12);

    // Surcos direccionales en "V" (espiga)
    ctx.strokeStyle = '#242424';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (let x = -64; x < 320; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 124);
      ctx.lineTo(x + 46, 28);
      ctx.moveTo(x, 132);
      ctx.lineTo(x + 46, 228);
      ctx.stroke();
    }

    // Laminillas finas en los hombros
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 4;
    for (let x = 8; x < 256; x += 21) {
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x + 10, 22);
      ctx.moveTo(x, 252);
      ctx.lineTo(x + 10, 234);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  tex.offset.set(0, 0.5);
  bancoTexturas[clave] = tex;
  return tex;
}

/**
 * Genera y cachea en canvas la textura de un disco de freno ventilado con
 * perforaciones radiales y detalle de mordaza deportiva.
 */
export function crearTexturaDiscoFreno() {
  if (bancoTexturas.discoFreno) return bancoTexturas.discoFreno;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const cx = 128;
  const cy = 128;

  ctx.clearRect(0, 0, 256, 256);

  // Anillo metálico cepillado del disco
  const grad = ctx.createRadialGradient(cx, cy, 42, cx, cy, 122);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.36, '#94a3b8');
  grad.addColorStop(0.65, '#e2e8f0');
  grad.addColorStop(0.92, '#cbd5e1');
  grad.addColorStop(1, '#64748b');

  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Surcos concéntricos de fricción del acero cepillado
  for (let r = 56; r <= 114; r += 5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 10 === 0 ? 'rgba(51, 65, 85, 0.25)' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Perforaciones radiales de ventilación (patrón curvo)
  ctx.fillStyle = '#1e293b';
  for (let i = 0; i < 16; i++) {
    const baseAng = (i * Math.PI * 2) / 16;
    [64, 80, 96, 108].forEach((r, idx) => {
      const ang = baseAng + idx * 0.08;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Detalle de mordaza (cáliper) deportiva pintada en arco
  ctx.beginPath();
  ctx.arc(cx, cy, 96, -0.45, 0.45);
  ctx.arc(cx, cy, 62, 0.45, -0.45, true);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 30, 39, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Campana central oscura y pernos
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 30, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  bancoTexturas.discoFreno = tex;
  return tex;
}

/**
 * Genera y cachea en canvas la textura animable para plataformas aceleradoras (Boost Pads)
 * con fondo oscuro tecnológico y chevrones de neón cian y amarillo.
 */
export function crearTexturaTurboPad() {
  if (bancoTexturas.texturaTurboPad) return bancoTexturas.texturaTurboPad;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Fondo oscuro tecnológico
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 256);

  // Líneas de cuadrícula sutil
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Bordes laterales luminosos neón cian
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(0, 8, 256, 14);
  ctx.fillRect(0, 234, 256, 14);

  // Flechas / chevrones apuntando hacia +X (dirección de impulso)
  const dibujarChevron = (xBase, color, grosor) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(xBase - 46, 46);
    ctx.lineTo(xBase + 26, 128);
    ctx.lineTo(xBase - 46, 210);
    ctx.stroke();
  };

  dibujarChevron(72, '#00f0ff', 22);
  dibujarChevron(164, '#ffdd00', 22);
  dibujarChevron(256, '#00f0ff', 22);
  dibujarChevron(-20, '#ffdd00', 22);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.encoding = THREE.sRGBEncoding;
  bancoTexturas.texturaTurboPad = tex;
  return tex;
}

/**
 * Dibuja una estrella de 5 puntas en el contexto 2D indicado.
 */
function dibujarEstrella2D(ctx, cx, cy, radioExt, radioInt, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? radioExt : radioInt;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Genera pósters decorativos gigantes y tablero de corcho infantil en `<canvas>`.
 * Tipos soportados: 'espacial' | 'vaquero' | 'carreras' | 'corcho'.
 */
export function crearTexturaPosterPared(tipo) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');

  if (tipo === 'espacial') {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#090d26');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    // Estrellas de fondo
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#fde047' : '#ffffff';
      ctx.beginPath();
      ctx.arc((i * 89) % 512, (i * 53) % 320, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Planeta con anillo
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(385, 115, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(385, 118, 92, 22, -0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Cohete retro despegando
    ctx.save();
    ctx.translate(155, 158);
    ctx.rotate(-0.45);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-18, 52);
    ctx.lineTo(0, 96);
    ctx.lineTo(18, 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-22, -26);
    ctx.lineTo(0, -68);
    ctx.lineTo(22, -26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-38, 22, 16, 30);
    ctx.fillRect(22, 22, 16, 30);
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(24, 246, 464, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GUARDIÁN ESPACIAL', 256, 280);
  } else if (tipo === 'vaquero') {
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.65, '#fbbf24');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    // Siluetas del desierto y cactus
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 230, 512, 90);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(68, 138, 20, 96);
    ctx.fillRect(48, 166, 20, 14);
    ctx.fillRect(48, 148, 12, 30);
    ctx.fillRect(88, 174, 20, 14);
    ctx.fillRect(96, 152, 12, 34);

    // Gran estrella de Sheriff dorada y sombrero
    dibujarEstrella2D(ctx, 256, 142, 72, 31, '#fef08a');
    dibujarEstrella2D(ctx, 256, 142, 54, 23, '#ca8a04');
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.ellipse(412, 158, 52, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(382, 118, 60, 40);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(24, 246, 464, 48);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHERIFF DEL OESTE', 256, 280);
  } else if (tipo === 'carreras') {
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(0, 0, 512, 320);

    // Líneas dinámicas de velocidad
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let y = 36; y < 220; y += 26) {
      ctx.fillRect(30, y, 160 + (y % 70), 8);
    }

    // Banderas a cuadros cruzadas arriba a la derecha
    const dibujarCuadros = (ox, oy, ang) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(ang);
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 6; col++) {
          ctx.fillStyle = (r + col) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(col * 16, r * 14, 16, 14);
        }
      }
      ctx.restore();
    };
    dibujarCuadros(330, 32, 0.25);
    dibujarCuadros(295, 58, -0.25);

    // Silueta de bólido
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(100, 198);
    ctx.lineTo(150, 152);
    ctx.lineTo(295, 148);
    ctx.lineTo(395, 178);
    ctx.lineTo(410, 204);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(170, 206, 26, 0, Math.PI * 2);
    ctx.arc(348, 206, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 246, 464, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRAN PREMIO 3D', 256, 281);
  } else if (tipo === 'corcho' || !tipo) {
    // Tablero de corcho moteado con 4 dibujos/notas y chinchetas
    ctx.fillStyle = '#c68b59';
    ctx.fillRect(0, 0, 512, 320);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(92, 52, 20, 0.20)' : 'rgba(245, 210, 170, 0.16)';
      ctx.fillRect((i * 73) % 512, (i * 41) % 320, 3, 3);
    }

    const notas = [
      { x: 46, y: 34, w: 120, h: 112, rot: -0.06, bg: '#fef08a', pin: '#ef4444' },
      { x: 198, y: 42, w: 128, h: 115, rot: 0.05, bg: '#ffffff', pin: '#2563eb' },
      { x: 354, y: 30, w: 116, h: 110, rot: -0.04, bg: '#bbf7d0', pin: '#16a34a' },
      { x: 132, y: 174, w: 230, h: 114, rot: 0.02, bg: '#e0f2fe', pin: '#ef4444' }
    ];
    notas.forEach((n, idx) => {
      ctx.save();
      ctx.translate(n.x + n.w * 0.5, n.y + n.h * 0.5);
      ctx.rotate(n.rot);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-n.w * 0.5 + 4, -n.h * 0.5 + 4, n.w, n.h);
      ctx.fillStyle = n.bg;
      ctx.fillRect(-n.w * 0.5, -n.h * 0.5, n.w, n.h);

      // Garabatos/dibujos infantiles dentro de cada nota
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      if (idx === 0) {
        ctx.strokeRect(-28, -10, 56, 30);
      } else if (idx === 1) {
        dibujarEstrella2D(ctx, 0, 8, 26, 11, '#f97316');
      } else if (idx === 2) {
        ctx.beginPath();
        ctx.arc(0, 6, 22, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PISTA DE ANDY', 0, 10);
      }

      // Chincheta en la parte superior
      ctx.fillStyle = n.pin;
      ctx.beginPath();
      ctx.arc(0, -n.h * 0.5 + 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else if (tipo && tipo.startsWith('acuatico_')) {
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(415, 76, 44, 0, Math.PI * 2);
    ctx.fill();

    // Olas estilizadas
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = k === 0 ? '#0ea5e9' : (k === 1 ? '#0369a1' : '#0284c7');
      ctx.beginPath();
      ctx.moveTo(0, 210 + k * 30);
      for (let x = 0; x <= 512; x += 64) {
        ctx.quadraticCurveTo(x + 32, 184 + k * 30, x + 64, 210 + k * 30);
      }
      ctx.lineTo(512, 320);
      ctx.lineTo(0, 320);
      ctx.closePath();
      ctx.fill();
    }

    const titulosAcu = {
      acuatico_ola: 'SPLASH WAVE GP',
      acuatico_faro: 'FARO DEL NORTE',
      acuatico_pirata: 'BAHÍA PIRATA',
      acuatico_submarino: 'HIDRO TURBO 92'
    };
    if (tipo === 'acuatico_faro') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(120, 120);
      ctx.lineTo(512, 40);
      ctx.lineTo(512, 195);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(92, 108, 42, 120);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(92, 145, 42, 36);
    } else if (tipo === 'acuatico_pirata') {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(256, 125, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(190, 165, 132, 42);
    } else if (tipo === 'acuatico_submarino') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(256, 145, 92, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(236, 92, 36, 30);
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(28, 250, 456, 46);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 26px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titulosAcu[tipo] || 'BAHÍA ACUÁTICA', 256, 282);
  } else if (tipo && tipo.startsWith('atico_')) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, tipo === 'atico_planos' ? '#1e3a8a' : '#78350f');
    grad.addColorStop(1, tipo === 'atico_planos' ? '#1d4ed8' : '#d97706');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    if (tipo === 'atico_planos') {
      ctx.strokeStyle = 'rgba(191, 219, 254, 0.32)';
      ctx.lineWidth = 2;
      for (let x = 24; x < 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 320);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(70, 56, 372, 165);
    } else {
      ctx.fillStyle = '#facc15';
      dibujarEstrella2D(ctx, 256, 130, 88, 42, '#f59e0b');
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(64, 150, 384, 52);
    }

    const titulosAtico = {
      atico_enduro: 'ENDURO STUNT XT',
      atico_arcade: 'SUPER 16-BIT CLUB',
      atico_comic: 'TURBO HEROES #1',
      atico_planos: 'PLANO CHASIS 4X4'
    };
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(26, 248, 460, 48);
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 26px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titulosAtico[tipo] || 'ÁTICO ENDURO', 256, 281);
  } else if (tipo && tipo.startsWith('hangar_')) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 132, 92, 0, Math.PI * 2);
    ctx.arc(256, 132, 54, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(256, 72);
    ctx.lineTo(318, 168);
    ctx.lineTo(256, 146);
    ctx.lineTo(194, 168);
    ctx.closePath();
    ctx.fill();

    const titulosHan = {
      hangar_radar: 'SKY RADAR SECTOR',
      hangar_orbita: 'ORBITA APEX X-9',
      hangar_escuadron: 'ESCUADRÓN SUPERSONIC',
      hangar_telemetria: 'TELEMETRÍA AÉREA'
    };
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(24, 246, 464, 48);
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 25px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titulosHan[tipo] || 'SKY HANGAR', 256, 279);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la cara de madera pintada de un cubo gigante con una letra (A, B o C) y marco de color.
 */
export function crearTexturaLetraCubo(letra, colorBorde) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Fondo madera clara (#f7ebd2) con vetas sutiles
  ctx.fillStyle = '#f7ebd2';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = 'rgba(180, 140, 90, 0.08)';
    ctx.fillRect(0, i * 11, 256, 4);
  }

  // Marco grueso en relieve
  ctx.strokeStyle = colorBorde;
  ctx.lineWidth = 28;
  ctx.strokeRect(14, 14, 228, 228);

  // Letra grande centrada
  ctx.fillStyle = colorBorde;
  ctx.font = 'bold 148px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letra, 128, 136);

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera la textura equirectangular de la icónica pelota amarilla con franja azul y estrella roja.
 */
export function crearTexturaPelotaLuxo() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(0, 0, 512, 256);

  // Franja ecuatorial azul
  ctx.fillStyle = '#0066ff';
  ctx.fillRect(0, 102, 512, 52);

  // Estrellas rojas en ambos hemisferios
  dibujarEstrella2D(ctx, 128, 54, 34, 14, '#ff1e27');
  dibujarEstrella2D(ctx, 384, 54, 34, 14, '#ff1e27');
  dibujarEstrella2D(ctx, 128, 202, 34, 14, '#ff1e27');
  dibujarEstrella2D(ctx, 384, 202, 34, 14, '#ff1e27');

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera y cachea en canvas la textura retroiluminada del tablero de instrumentos
 * (tacómetro RPM, velocímetro digital, leds de marcha/turbo y rejillas de ventilación).
 */
export function crearTexturaTablero() {
  if (bancoTexturas.tablero) return bancoTexturas.tablero;

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');

  // Fondo negro mate carbono del panel
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 128);

  // Marco biselado sutil
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  // Tacómetro izquierdo de RPM
  const rx = 86;
  const ry = 66;
  ctx.beginPath();
  ctx.arc(rx, ry, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  for (let i = 0; i <= 10; i++) {
    const ang = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.strokeStyle = i >= 8 ? '#ff1e27' : i >= 6 ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx + Math.cos(ang) * 33, ry + Math.sin(ang) * 33);
    ctx.lineTo(rx + Math.cos(ang) * 42, ry + Math.sin(ang) * 42);
    ctx.stroke();
  }
  // Aguja roja deportiva
  ctx.strokeStyle = '#ff1e27';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(rx + 28, ry - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rx, ry, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();

  // Pantalla digital central (Velocímetro + Barra LED + Indicador Turbo)
  ctx.fillStyle = '#071324';
  ctx.fillRect(156, 16, 198, 96);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(156, 16, 198, 96);

  // Barra LED superior de revoluciones
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i < 7 ? '#00f566' : i < 11 ? '#ffdd00' : '#ff1e27';
    ctx.fillRect(166 + i * 13, 24, 9, 8);
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('188 KM/H', 255, 70);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('MARCHA 4  •  TURBO OK', 255, 96);

  // Reloj derecho (Temperatura / Presión Boost) y rejillas laterales
  const tx = 414;
  ctx.beginPath();
  ctx.arc(tx, ry, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#10b981';
  ctx.stroke();
  ctx.fillStyle = '#00f566';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('BOOST', tx, 58);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('98°C', tx, 82);

  // Testigos LED inferiores
  ['#00f566', '#38bdf8', '#ffdd00', '#ff1e27'].forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(474, 30 + i * 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  bancoTexturas.tablero = tex;
  return tex;
}

/**
 * Crea una CanvasTexture repetible y con codificación sRGB a partir de un callback de dibujo 2D.
 */
function crearCanvasTexturaRepetible(tam, dibujar) {
  const c = document.createElement('canvas');
  c.width = tam;
  c.height = tam;
  const ctx = c.getContext('2d');
  dibujar(ctx, tam);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Genera en canvas una textura estilizada de agua cristalina turquesa/azul con cáusticas luminosas.
 */
export function crearTexturaAgua() {
  return crearCanvasTexturaRepetible(256, (ctx, tam) => {
    const grad = ctx.createLinearGradient(0, 0, tam, tam);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, tam, tam);

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 16; y < tam; y += 32) {
      ctx.beginPath();
      for (let x = 0; x <= tam; x += 16) {
        const py = y + Math.sin((x / tam) * Math.PI * 4 + y) * 6;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(224, 242, 254, 0.22)';
    for (let i = 0; i < 18; i++) {
      const rx = ((i * 53) % (tam - 20)) + 10;
      const ry = ((i * 79) % (tam - 20)) + 10;
      ctx.beginPath();
      ctx.arc(rx, ry, 7 + (i % 5) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/**
 * Genera en canvas una cuadrícula clara de azulejos de piscina con juntas suaves.
 */
export function crearTexturaAzulejoPiscina() {
  const tex = crearCanvasTexturaRepetible(256, (ctx, tam) => {
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, tam, tam);

    const paso = 64;
    for (let y = 0; y < tam; y += paso) {
      for (let x = 0; x < tam; x += paso) {
        const tono = ((x + y) / paso) % 2 === 0 ? '#f0f9ff' : '#dbeafe';
        ctx.fillStyle = tono;
        ctx.fillRect(x + 2, y + 2, paso - 4, paso - 4);
      }
    }
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    for (let i = 0; i <= tam; i += paso) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, tam);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(tam, i);
      ctx.stroke();
    }
  });
  tex.repeat.set(18, 18);
  return tex;
}

/**
 * Genera en canvas una textura de arcilla/tierra compactada con rodadas de neumáticos.
 */
export function crearTexturaTierraCompactada() {
  return crearCanvasTexturaRepetible(256, (ctx, tam) => {
    ctx.fillStyle = '#9a5b32';
    ctx.fillRect(0, 0, tam, tam);

    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 63, 24, 0.28)' : 'rgba(217, 155, 102, 0.22)';
      ctx.fillRect((i * 37) % tam, (i * 73) % tam, 4, 3);
    }

    // Rodadas longitudinales oscuras y bordes laterales de tierra suelta
    ctx.fillStyle = 'rgba(72, 34, 12, 0.25)';
    ctx.fillRect(54, 0, 26, tam);
    ctx.fillRect(tam - 80, 0, 26, tam);

    ctx.strokeStyle = 'rgba(254, 243, 199, 0.16)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(14, tam);
    ctx.moveTo(tam - 14, 0);
    ctx.lineTo(tam - 14, tam);
    ctx.stroke();
  });
}

/**
 * Genera en canvas placas metálicas industriales oscuras con líneas amarillas y cian para el Hangar.
 */
export function crearTexturaPisoHangar() {
  const tex = crearCanvasTexturaRepetible(256, (ctx, tam) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, tam, tam);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, tam - 8, tam - 8);
    ctx.beginPath();
    ctx.moveTo(tam / 2, 0);
    ctx.lineTo(tam / 2, tam);
    ctx.moveTo(0, tam / 2);
    ctx.lineTo(tam, tam / 2);
    ctx.stroke();

    // Franja de advertencia amarilla y acento cian
    ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
    for (let x = 8; x < tam; x += 28) {
      ctx.fillRect(x, 8, 14, 6);
    }
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.fillRect(10, tam - 14, tam - 20, 4);
  });
  tex.repeat.set(22, 22);
  return tex;
}

/**
 * Genera en canvas una tarjeta ilustrada (320x180) para la vista previa de cada escenario
 * en el menú modal estilo Mario Kart.
 */
export function crearVistaPreviaEscenario(idHabitacion) {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 180;
  const ctx = c.getContext('2d');

  const estilos = {
    habitacion_andy: {
      cielo: ['#93c5fd', '#dbeafe'],
      suelo: '#c68b59',
      pista: '#334155',
      linea: '#fbbf24',
      acento: '#ff1e27',
      etiqueta: 'GRAND PRIX'
    },
    habitacion_acuatica: {
      cielo: ['#0284c7', '#bae6fd'],
      suelo: '#0e7490',
      pista: '#38bdf8',
      linea: '#e0f2fe',
      acento: '#facc15',
      etiqueta: 'SPLASH GP'
    },
    habitacion_atico: {
      cielo: ['#78350f', '#fef3c7'],
      suelo: '#92400e',
      pista: '#b45309',
      linea: '#fef3c7',
      acento: '#f59e0b',
      etiqueta: 'STUNT PARK'
    },
    habitacion_hangar: {
      cielo: ['#020617', '#1e293b'],
      suelo: '#0f172a',
      pista: '#1e293b',
      linea: '#38bdf8',
      acento: '#facc15',
      etiqueta: 'SKY HANGAR'
    }
  };
  const st = estilos[idHabitacion] || estilos.habitacion_andy;

  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, st.cielo[0]);
  grad.addColorStop(1, st.cielo[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 180);

  // Suelo en perspectiva
  ctx.fillStyle = st.suelo;
  ctx.fillRect(0, 96, 320, 84);

  // Elementos característicos por escenario
  if (idHabitacion === 'habitacion_acuatica') {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(26, 34, 20, 62);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(26, 52, 20, 18);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(36, 30, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (idHabitacion === 'habitacion_atico') {
    ctx.fillStyle = '#451a03';
    for (let x = 20; x < 320; x += 64) {
      ctx.fillRect(x, 0, 14, 72);
    }
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(220, 18, 56, 32);
  } else if (idHabitacion === 'habitacion_hangar') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 320; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 96);
      ctx.lineTo(x - 40, 180);
      ctx.stroke();
    }
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(244, 58, 22, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 26, 48, 42);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(28, 30, 40, 34);
  }

  // Trazado del circuito estilizado
  ctx.strokeStyle = st.pista;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.ellipse(160, 134, 114, 34, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = st.linea;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(160, 134, 114, 34, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Arco de meta
  ctx.fillStyle = st.acento;
  ctx.fillRect(142, 148, 36, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(148, 150, 8, 6);
  ctx.fillRect(164, 150, 8, 6);

  // Insignia superior
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fillRect(10, 10, 122, 22);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 12px Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(st.etiqueta, 18, 25);

  return typeof c.toDataURL === 'function' ? c.toDataURL('image/png') : 'data:image/png;base64,MOCK';
}

/**
 * Genera textura procedural en canvas para las trampas de calzada ('aceite', 'espuma' o 'barro').
 */
export function crearTexturaTrampa(tipo = 'aceite') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  if (tipo === 'espuma') {
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 65; i++) {
      const bx = (i * 53) % 240 + 8;
      const by = (i * 89) % 240 + 8;
      const br = 8 + (i % 18);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(56, 189, 248, 0.55)';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (tipo === 'barro') {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 180; i++) {
      const lx = (i * 47) % 256;
      const ly = (i * 71) % 256;
      const lr = 4 + (i % 14);
      ctx.fillStyle = i % 2 === 0 ? '#78350f' : '#291509';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 256, 256);
    const irid = [
      [90, 95, 78, 'rgba(168, 85, 247, 0.45)'],
      [158, 132, 72, 'rgba(6, 182, 212, 0.42)'],
      [118, 168, 66, 'rgba(16, 185, 129, 0.36)']
    ];
    irid.forEach(([cx, cy, cr, color]) => {
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, cr);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/**
 * Inicializa todas las texturas del juego antes de construir la escena.
 * Por qué: garantiza que tanto las imágenes externas como las de canvas estén listas.
 */
export function inicializarRecursos() {
  bancoTexturas.maderaDiffuse = cargarTexturaSegura(
    URLS_TEXTURAS.maderaDiffuse,
    crearRespaldoMaderaCanvas('diffuse'),
    (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(26, 26);
      t.encoding = THREE.sRGBEncoding;
    }
  );
  bancoTexturas.maderaRoughness = cargarTexturaSegura(
    URLS_TEXTURAS.maderaRoughness,
    crearRespaldoMaderaCanvas('roughness'),
    (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(26, 26);
    }
  );
  bancoTexturas.maderaBump = cargarTexturaSegura(
    URLS_TEXTURAS.maderaBump,
    crearRespaldoMaderaCanvas('bump'),
    (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(26, 26);
    }
  );
  bancoTexturas.chispaPolvo = cargarTexturaSegura(
    URLS_TEXTURAS.chispaPolvo,
    crearRespaldoSpriteCanvas(true)
  );
  bancoTexturas.discoParticula = cargarTexturaSegura(
    URLS_TEXTURAS.discoParticula,
    crearRespaldoSpriteCanvas(false)
  );
  bancoTexturas.papelTapiz = crearTexturaPapelTapiz();
  bancoTexturas.alfombra = crearTexturaAlfombra();
  bancoTexturas.asfalto = crearTexturaPistaAsfalto();
  bancoTexturas.piano = crearTexturaPianoCurva();
  bancoTexturas.meta = crearTexturaMetaCuadros();
  bancoTexturas.rodaduraDeportiva = crearTexturaBandaRodadura('deportiva');
  bancoTexturas.rodaduraTodoterreno = crearTexturaBandaRodadura('todoterreno');
  bancoTexturas.discoFreno = crearTexturaDiscoFreno();
  bancoTexturas.texturaTurboPad = crearTexturaTurboPad();
  bancoTexturas.posterEspacial = crearTexturaPosterPared('espacial');
  bancoTexturas.posterVaquero = crearTexturaPosterPared('vaquero');
  bancoTexturas.posterCarreras = crearTexturaPosterPared('carreras');
  bancoTexturas.posterCorcho = crearTexturaPosterPared('corcho');
  bancoTexturas.cuboA = crearTexturaLetraCubo('A', '#ff1e27');
  bancoTexturas.cuboB = crearTexturaLetraCubo('B', '#0066ff');
  bancoTexturas.cuboC = crearTexturaLetraCubo('C', '#00a854');
  bancoTexturas.pelotaLuxo = crearTexturaPelotaLuxo();
  bancoTexturas.tablero = crearTexturaTablero();
  bancoTexturas.agua = crearTexturaAgua();
  bancoTexturas.azulejo = crearTexturaAzulejoPiscina();
  bancoTexturas.tierra = crearTexturaTierraCompactada();
  bancoTexturas.hangar = crearTexturaPisoHangar();
  bancoTexturas.trampaAceite = crearTexturaTrampa('aceite');
  bancoTexturas.trampaEspuma = crearTexturaTrampa('espuma');
  bancoTexturas.trampaBarro = crearTexturaTrampa('barro');
  bancoTexturas.postersAcuaticos = [
    crearTexturaPosterPared('acuatico_ola'),
    crearTexturaPosterPared('acuatico_faro'),
    crearTexturaPosterPared('acuatico_pirata'),
    crearTexturaPosterPared('acuatico_submarino')
  ];
  bancoTexturas.postersAtico = [
    crearTexturaPosterPared('atico_enduro'),
    crearTexturaPosterPared('atico_arcade'),
    crearTexturaPosterPared('atico_comic'),
    crearTexturaPosterPared('atico_planos')
  ];
  bancoTexturas.postersHangar = [
    crearTexturaPosterPared('hangar_radar'),
    crearTexturaPosterPared('hangar_orbita'),
    crearTexturaPosterPared('hangar_escuadron'),
    crearTexturaPosterPared('hangar_telemetria')
  ];
  ['habitacion_andy', 'habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar'].forEach((idHab) => {
    cacheMiniaturas[idHab] = crearVistaPreviaEscenario(idHab);
  });
}
