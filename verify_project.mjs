import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'c:\\html_games';
const jsDir = path.join(root, 'js');
const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();

console.log('=== 1. Verificación de archivos, localStorage y URLs externas ===');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssText = fs.readFileSync(path.join(root, 'css', 'estilos.css'), 'utf8');

const expectedCdns = [
  'three.js/r128/three.min.js',
  'three@0.128.0/examples/js/controls/OrbitControls.js',
  'three@0.128.0/examples/js/geometries/RoundedBoxGeometry.js',
  'three@0.128.0/examples/js/environments/RoomEnvironment.js'
];
for (const cdn of expectedCdns) {
  if (!indexHtml.includes(cdn)) throw new Error(`Falta script r128 requerido en index.html: ${cdn}`);
}

const urlRegex = /https?:\/\/[^\s'"`<>)]+/g;
const allUrls = [];
for (const file of ['index.html', 'css/estilos.css', ...jsFiles.map((f) => `js/${f}`)]) {
  const txt = fs.readFileSync(path.join(root, file), 'utf8');
  const matches = txt.match(urlRegex) || [];
  for (const m of matches) allUrls.push({ file, url: m });
}
const allowedPrefixes = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/',
  'https://raw.githubusercontent.com/mrdoob/three.js/',
  'http://www.w3.org/2000/svg'
];
for (const { file, url } of allUrls) {
  if (!allowedPrefixes.some((p) => url.startsWith(p))) {
    throw new Error(`URL externa no autorizada en ${file}: ${url}`);
  }
}
const rawGithubUrls = allUrls.filter((u) => u.url.startsWith('https://raw.githubusercontent.com/mrdoob/three.js/'));
if (rawGithubUrls.length !== 5) {
  throw new Error(`Se esperaban exactamente 5 URLs GitHub Raw autorizadas, encontradas: ${rawGithubUrls.length}`);
}
console.log(`OK: Three.js r128 en index.html, ${rawGithubUrls.length} texturas GitHub Raw autorizadas.`);

console.log('=== 2. Verificación de Exports, Imports y Grafo Acíclico ===');
const exportsMap = new Map();
const depsMap = new Map();
const domIdsReferenced = new Set();

for (const f of jsFiles) {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const expSet = new Set();
  for (const m of src.matchAll(/export\s+(?:const|let|var|function|async\s+function|class)\s+([A-Za-z0-9_$]+)/g)) {
    expSet.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean).forEach((id) => expSet.add(id));
  }
  exportsMap.set(f, expSet);

  const deps = [];
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'\.\/([^']+)'/g)) {
    const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    deps.push({ target: m[2], names });
  }
  depsMap.set(f, deps);

  for (const m of src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    domIdsReferenced.add(m[1]);
  }
}

for (const [f, deps] of depsMap.entries()) {
  for (const d of deps) {
    const targetExports = exportsMap.get(d.target);
    if (!targetExports) throw new Error(`${f} importa módulo inexistente: ${d.target}`);
    for (const name of d.names) {
      if (!targetExports.has(name)) {
        throw new Error(`${f} importa '${name}' de ${d.target}, pero no está exportado`);
      }
    }
  }
}

const visitState = new Map();
function dfs(node, trail) {
  const st = visitState.get(node) || 0;
  if (st === 1) throw new Error(`Ciclo de importación detectado: ${[...trail, node].join(' -> ')}`);
  if (st === 2) return;
  visitState.set(node, 1);
  for (const d of depsMap.get(node) || []) {
    dfs(d.target, [...trail, node]);
  }
  visitState.set(node, 2);
}
for (const f of jsFiles) dfs(f, []);
if (jsFiles.length !== 13) {
  throw new Error(`Se esperaban 13 módulos en js/*.js (incluyendo config.js, red.js, audio.js y partituras.js), encontrados ${jsFiles.length}`);
}
console.log(`OK: Todas las importaciones/exportaciones coinciden en los ${jsFiles.length} módulos y no hay ciclos.`);

console.log('=== 3. Verificación de IDs del DOM, Favicon y Selectores CSS ===');
if (!indexHtml.includes('rel="icon"') || !indexHtml.includes('data:image/svg+xml')) {
  throw new Error('Falta <link rel="icon" ... href="data:image/svg+xml,..."> inline en index.html');
}
for (const id of domIdsReferenced) {
  if (!indexHtml.includes(`id="${id}"`) && !indexHtml.includes(`id='${id}'`)) {
    throw new Error(`El ID de DOM '${id}' referenciado en JS no existe en index.html`);
  }
}
for (const id of ['btn-habitacion', 'btn-clase-vehiculo', 'btn-audio', 'btn-pista', 'altitud-hud', 'guia-vuelo-hud', 'tiempo-actual-hud', 'ultima-vuelta-hud', 'mejor-vuelta-hud', 'checkpoints-hud', 'aviso-record-hud', 'selector-clase-mk', 'panel-personalizacion-mk', 'panel-stats-mk', 'modal-circuitos-mk', 'grid-circuitos-mk', 'btn-abrir-copas-mk', 'btn-copas-mk', 'btn-cerrar-modal-mk']) {
  if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Falta elemento HUD '${id}' en index.html`);
}
for (const sel of [
  '.btn-habitacion',
  '.btn-clase',
  '#selector-clase-mk',
  '.btn-clase-mk',
  '#panel-personalizacion-mk',
  '#panel-stats-mk',
  '#modal-circuitos-mk',
  '.tarjeta-circuito-mk',
  '.barra-mk-base',
  '.barra-mk-bono.positivo',
  '.barra-mk-bono.negativo',
  '.btn-audio',
  '.btn-audio.silenciado',
  '.btn-pista',
  '.lectura-altitud',
  '#nombre-chasis-hud',
  '#insignia-estado-hud.activo-derrape',
  '#insignia-estado-hud.activo-turbo',
  '.panel-cronometro-hud',
  '#mejor-vuelta-hud.record',
  '#checkpoints-hud.listo-meta',
  '#aviso-record-hud.visible',
  '.stats-carroceria'
]) {
  if (!cssText.includes(sel)) throw new Error(`Falta selector CSS: ${sel}`);
}
console.log(`OK: Favicon SVG inline, los ${domIdsReferenced.size} IDs getElementById y selectores CSS existen.`);

console.log('=== 4. Verificación funcional: Catálogo, Audio Web API, Geometría Continua, Checkpoints y Cronómetro ===');
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

class MockAudioParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime(v) { this.value = v; }
  linearRampToValueAtTime(v) { this.value = v; }
  exponentialRampToValueAtTime(v) { this.value = v; }
  setTargetAtTime(v) { this.value = v; }
}
class MockAudioNode {
  connect() {}
  start() {}
  stop() {}
}
class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 1.0;
    this.state = 'running';
    this.destination = {};
  }
  resume() { return Promise.resolve(); }
  createGain() { return Object.assign(new MockAudioNode(), { gain: new MockAudioParam(1) }); }
  createOscillator() {
    return Object.assign(new MockAudioNode(), {
      type: 'sine',
      frequency: new MockAudioParam(440),
      detune: new MockAudioParam(0)
    });
  }
  createBiquadFilter() { return Object.assign(new MockAudioNode(), { type: 'lowpass', frequency: new MockAudioParam(350), Q: new MockAudioParam(1) }); }
  createDelay() { return Object.assign(new MockAudioNode(), { delayTime: new MockAudioParam(0) }); }
  createBuffer(c, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { return Object.assign(new MockAudioNode(), { buffer: null, loop: false }); }
}

const windowListeners = new Map();
const windowListenersAll = new Map();
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  AudioContext: MockAudioContext,
  addEventListener(ev, fn) {
    windowListeners.set(ev, fn);
    if (!windowListenersAll.has(ev)) windowListenersAll.set(ev, []);
    windowListenersAll.get(ev).push(fn);
  }
};

const domElements = new Map();
function makeMockEl(id = '', tag = 'div') {
  const classes = new Set();
  const el = {
    id,
    tagName: tag.toUpperCase(),
    textContent: '',
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) {
      this._innerHTML = v;
      if (v === '') this.children.length = 0;
    },
    style: {},
    className: '',
    dataset: {},
    children: [],
    classList: {
      toggle(c, force) {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) classes.add(c);
        else classes.delete(c);
      },
      contains: (c) => classes.has(c),
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c)
    },
    append(...kids) { this.children.push(...kids); },
    appendChild(k) { this.children.push(k); return k; },
    addEventListener() {}
  };
  return el;
}
globalThis.document = {
  getElementById: (id) => {
    if (!domElements.has(id)) domElements.set(id, makeMockEl(id));
    return domElements.get(id);
  },
  querySelectorAll: () => [],
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        style: {},
        toDataURL: () => 'data:image/png;base64,MOCK',
        getContext: () =>
          new Proxy(
            {
              fillStyle: '',
              strokeStyle: '',
              lineWidth: 1,
              createLinearGradient: () => ({ addColorStop() {} }),
              createRadialGradient: () => ({ addColorStop() {} })
            },
            { get: (target, prop) => (prop in target ? target[prop] : () => {}) }
          )
      };
    }
    return makeMockEl('', tag);
  }
};

class MockVec {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  fromArray(a) { this.x = a[0]; this.y = a[1]; this.z = a[2]; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new MockVec(this.x, this.y, this.z); }
  normalize() {
    const l = Math.hypot(this.x, this.y, this.z) || 1;
    this.x /= l; this.y /= l; this.z /= l;
    return this;
  }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  applyMatrix4() { return this; }
  lerp() { return this; }
  project(cam) {
    const cx = cam && cam.position ? cam.position.x : 0;
    const cy = cam && cam.position ? cam.position.y : 0;
    this.x = Math.max(-0.9, Math.min(0.9, (this.x - cx) * 0.05));
    this.y = Math.max(-0.9, Math.min(0.9, (this.y - cy) * 0.05));
    this.z = 0.2;
    return this;
  }
  getWorldPosition(target) { return target ? target.copy(this) : new MockVec(); }
}
class MockObj {
  constructor() {
    this.children = [];
    this.parent = null;
    this.position = new MockVec();
    this.rotation = new MockVec();
    this.rotation.order = 'XYZ';
    this.quaternion = new MockVec(0, 0, 0);
    this.scale = new MockVec(1, 1, 1);
    this.matrixWorld = {};
    this.userData = {};
  }
  getWorldPosition(target) { return target ? target.copy(this.position) : this.position.clone(); }
  getWorldQuaternion(target) { return target ? target.copy(this.quaternion) : this.quaternion.clone(); }
  getWorldScale(target) { return target ? target.copy(this.scale) : this.scale.clone(); }
  add(...items) {
    for (const item of items) {
      if (item) {
        item.parent = this;
        this.children.push(item);
      }
    }
  }
  remove(item) {
    if (item && item.parent === this) item.parent = null;
    this.children = this.children.filter((c) => c !== item);
  }
  traverse(fn) { fn(this); this.children.forEach((c) => c.traverse && c.traverse(fn)); }
  getObjectByName(name) {
    if (this.name === name) return this;
    for (const c of this.children) {
      if (c && typeof c.getObjectByName === 'function') {
        const hit = c.getObjectByName(name);
        if (hit) return hit;
      }
    }
    return null;
  }
  updateMatrixWorld() {}
}
class MockColor {
  constructor(hex = 0xffffff) { this.hex = hex; }
  setHex(h) { this.hex = h; }
}
class MockTexture {
  constructor() {
    this.repeat = new MockVec(1, 1);
    this.offset = new MockVec();
    this.userData = {};
    this.disposeCount = 0;
  }
  clone() {
    const t = new MockTexture();
    t.wrapS = this.wrapS;
    t.wrapT = this.wrapT;
    t.encoding = this.encoding;
    return t;
  }
  dispose() { this.disposeCount++; }
}
class MockMaterial {
  constructor(o = {}) {
    Object.assign(this, o);
    this.color = new MockColor(o.color ?? 0xffffff);
    this.emissive = new MockColor(o.emissive ?? 0x000000);
  }
  clone() {
    return new MockMaterial({ ...this });
  }
  dispose() {}
}
class MockBufferGeometry {
  constructor() {
    this.attributes = {};
    this.index = null;
  }
  setAttribute(name, attr) { this.attributes[name] = attr; }
  setIndex(idx) { this.index = Array.isArray(idx) ? { array: idx } : idx; }
  computeVertexNormals() {}
  dispose() {}
}
class MockLight extends MockObj {
  constructor() {
    super();
    this.shadow = {
      mapSize: { width: 0, height: 0 },
      camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 },
      bias: 0
    };
  }
}

globalThis.THREE = {
  Scene: class extends MockObj {},
  Group: class extends MockObj {},
  HemisphereLight: MockLight,
  DirectionalLight: MockLight,
  PointLight: MockLight,
  PerspectiveCamera: class extends MockObj {
    constructor(fov, aspect, near, far) {
      super();
      this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
    }
    lookAt() {}
    updateProjectionMatrix() {}
  },
  WebGLRenderer: class {
    constructor() {
      this.shadowMap = {};
      this.domElement = { toDataURL: () => 'data:image/png;base64,mock' };
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
  },
  OrbitControls: class {
    constructor() { this.target = new MockVec(); }
    update() {}
  },
  Raycaster: class {
    set(origin) { this._origin = origin; }
    intersectObjects() {
      const st = globalThis._mockRayEstado || { esPista: true, pendientePorX: 0 };
      const dy = this._origin ? (this._origin.x - (st.refX || 0)) * (st.pendientePorX || 0) : 0;
      const baseY = st.sueloFijo !== undefined
        ? st.sueloFijo
        : (this._origin && this._origin.y > 1.0 ? Math.max(0.02, this._origin.y - 0.55) : 0.02);
      return [{
        point: { y: baseY + dy },
        object: {
          userData: {
            esPista: st.esPista !== false,
            tipoSuperficie: st.tipoSuperficie || (st.esPista !== false ? 'pista_asfalto' : 'fuera_pista')
          }
        }
      }];
    }
  },
  Box3: class {
    setFromObject() { return this; }
    isEmpty() { return false; }
    getCenter(t) { t.set(0, 0.25, 0); return t; }
    getSize(t) { t.set(1.2, 0.5, 0.8); return t; }
  },
  Color: MockColor,
  Mesh: class extends MockObj {
    constructor(g, m) { super(); this.geometry = g; this.material = m; }
  },
  MeshPhysicalMaterial: MockMaterial,
  MeshStandardMaterial: MockMaterial,
  MeshBasicMaterial: MockMaterial,
  BufferGeometry: MockBufferGeometry,
  BufferAttribute: class {
    constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; this.count = arr.length / (itemSize || 3); }
    getX(i) { return this.array[i * 3]; }
    getY(i) { return this.array[i * 3 + 1]; }
    getZ(i) { return this.array[i * 3 + 2]; }
    setXYZ(i, x, y, z) { this.array[i * 3] = x; this.array[i * 3 + 1] = y; this.array[i * 3 + 2] = z; }
  },
  Float32BufferAttribute: class {
    constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; this.count = arr.length / (itemSize || 3); }
  },
  PointsMaterial: MockMaterial,
  Points: class extends MockObj {
    constructor(g, m) { super(); this.geometry = g; this.material = m; }
  },
  BoxGeometry: class { dispose() {} },
  CylinderGeometry: class { dispose() {} },
  ConeGeometry: class { dispose() {} },
  SphereGeometry: class { dispose() {} },
  TorusGeometry: class { dispose() {} },
  PlaneGeometry: class { dispose() {} },
  CircleGeometry: class { dispose() {} },
  RingGeometry: class { dispose() {} },
  RoundedBoxGeometry: class { dispose() {} },
  ExtrudeGeometry: class { dispose() {} },
  Shape: class { moveTo(){} lineTo(){} quadraticCurveTo(){} closePath(){} },
  Vector3: MockVec,
  Quaternion: class { constructor(x=0,y=0,z=0,w=1){this.x=x;this.y=y;this.z=z;this.w=w;} copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this;} },
  Euler: class { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} clone() { return new this.constructor(this.x, this.y, this.z); } },
  CanvasTexture: MockTexture,
  RepeatWrapping: 1000,
  DoubleSide: 2,
  sRGBEncoding: 3001,
  ACESFilmicToneMapping: 4,
  PCFSoftShadowMap: 2,
  AdditiveBlending: 2,
  TextureLoader: class { setCrossOrigin() {} load() { return new MockTexture(); } }
};

const modConst = await import(pathToFileURL(path.join(jsDir, 'constantes.js')).href);
const modEstado = await import(pathToFileURL(path.join(jsDir, 'estado.js')).href);
const modRec = await import(pathToFileURL(path.join(jsDir, 'recursos.js')).href);
const modEsc = await import(pathToFileURL(path.join(jsDir, 'escenario.js')).href);
const modCond = await import(pathToFileURL(path.join(jsDir, 'conduccion.js')).href);
const modCat = await import(pathToFileURL(path.join(jsDir, 'catalogoPiezas.js')).href);

// 4A. Verificar parámetro cámara near y giro reducido un 20% en código
if (Math.abs(modEsc.camara.near - 0.25) > 1e-6) {
  throw new Error(`camara.near esperado 0.25, obtenido ${modEsc.camara.near}`);
}
const condSrc = fs.readFileSync(path.join(jsDir, 'conduccion.js'), 'utf8');
if (!condSrc.includes('objetivoVolante = 0.36') || !condSrc.includes('objetivoVolante = -0.36') || !condSrc.includes('tasaGiroBase = 3.42')) {
  throw new Error('Falta reducción del 20% en giro máximo (0.36 rad) o tasaGiroBase (3.42) en conduccion.js');
}
console.log('OK: camara.near = 0.25 y reducción del 20% en dirección (0.36 rad / 3.42) verificados.');

// 4B. Inicializar texturas y construir pista continua + 5 checkpoints
modRec.inicializarRecursos();
modEsc.construirPistaDeCarreras();

if (modEstado.checkpointsPista.length !== 5) {
  throw new Error(`Se esperaban exactamente 5 checkpoints, encontrados ${modEstado.checkpointsPista.length}`);
}

// Verificar que todas las mallas conducibles BufferGeometry (asfalto y pianos top) tienen normales +Y
const mallasBufferTop = modEstado.mallasSuperficieConducible.filter(
  (m) => m.geometry instanceof MockBufferGeometry
);
if (mallasBufferTop.length < 6) {
  throw new Error(`Se esperaban >= 6 mallas continuas conducibles (trazado principal + bifurcación + atajo), encontradas ${mallasBufferTop.length}`);
}
let totalTrisTop = 0;
for (const mTop of mallasBufferTop) {
  const pA = mTop.geometry.attributes.position.array;
  const iA = mTop.geometry.index.array;
  for (let t = 0; t < iA.length; t += 3) {
    const ia = iA[t] * 3, ib = iA[t + 1] * 3, ic = iA[t + 2] * 3;
    const abx = pA[ib] - pA[ia], abz = pA[ib + 2] - pA[ia + 2];
    const acx = pA[ic] - pA[ia], acz = pA[ic + 2] - pA[ia + 2];
    const ny = abz * acx - abx * acz;
    if (ny <= 0) {
      throw new Error(`Triángulo invertido en malla continua superior (tri=${t / 3}, ny=${ny})`);
    }
    totalTrisTop++;
  }
}

const mallaAsfaltoTop = mallasBufferTop[0];
const asfPos = mallaAsfaltoTop.geometry.attributes.position.array;
for (const cp of modEstado.checkpointsPista) {
  let minD = Infinity;
  for (let i = 0; i < asfPos.length; i += 6) {
    const mx = (asfPos[i] + asfPos[i + 3]) * 0.5;
    const my = (asfPos[i + 1] + asfPos[i + 4]) * 0.5;
    const mz = (asfPos[i + 2] + asfPos[i + 5]) * 0.5;
    const d = Math.hypot(mx - cp.x, my - (cp.y + 0.02), mz - cp.z);
    if (d < minD) minD = d;
  }
  if (minD > 0.65) {
    throw new Error(`Checkpoint ${cp.indice + 1} (${cp.x}, ${cp.y}, ${cp.z}) alejado del centro de pista (${minD.toFixed(2)}m)`);
  }
}
console.log(`OK: Asfalto y pianos continuos (${totalTrisTop} triángulos) 100% +Y y los 5 Checkpoints alineados con el trazado.`);

// Verificar polygonOffset en línea divisoria, parrilla, meta, enlaceTaller y pads turbo
let conteoPolygonOffset = 0;
modEsc.escena.traverse((h) => {
  if (h.material && h.material.polygonOffset) {
    if (h.material.polygonOffsetFactor !== -1 || h.material.polygonOffsetUnits !== -1) {
      throw new Error('Material con polygonOffset pero factor/units distintos de -1');
    }
    conteoPolygonOffset++;
  }
});
if (conteoPolygonOffset < 5) {
  throw new Error(`Se esperaban al menos 5 mallas con polygonOffset (-1, -1), encontradas ${conteoPolygonOffset}`);
}
console.log(`OK: ${conteoPolygonOffset} elementos de pista tienen polygonOffset (-1, -1) y alturas escalonadas.`);

// 4C. Simular validación anti-trampas en orden estricto + cronómetro + localStorage
modCond.reposicionarEnMeta();
if (modEstado.estadoCronometro.vueltaActiva || modEstado.estadoCronometro.checkpointActual !== 0) {
  throw new Error('reposicionarEnMeta() debe reiniciar vueltaActiva y checkpointActual a 0');
}

modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.fisicaCarro.x = -0.1;
modEstado.fisicaCarro.y = 0.02;
modEstado.fisicaCarro.z = 26.0;
modEstado.fisicaCarro.velocidad = 4.0;
modEstado.fisicaCarro.yaw = 0;
modEstado.fisicaCarro.anguloMovimiento = 0;
modCond.actualizarFisicaConduccion(0.1);
if (!modEstado.estadoCronometro.vueltaActiva) {
  throw new Error('Cruzar la meta (+X en Z=26) debió activar vueltaActiva=true');
}

modEstado.fisicaCarro.x = modEstado.checkpointsPista[2].x;
modEstado.fisicaCarro.y = modEstado.checkpointsPista[2].y;
modEstado.fisicaCarro.z = modEstado.checkpointsPista[2].z;
modEstado.fisicaCarro.velocidad = 0;
modCond.actualizarFisicaConduccion(0.1);
if (modEstado.estadoCronometro.checkpointActual !== 0) {
  throw new Error('Anti-trampas falló: CP 3 se activó fuera de orden antes que CP 1');
}

modEstado.fisicaCarro.x = -0.05;
modEstado.fisicaCarro.y = 0.02;
modEstado.fisicaCarro.z = 26.0;
modEstado.fisicaCarro.velocidad = 3.0;
modCond.actualizarFisicaConduccion(0.1);
if (modEstado.estadoCronometro.ultimaVuelta !== null) {
  throw new Error('Anti-trampas falló: registró ultimaVuelta con 0 checkpoints completados');
}

for (let i = 0; i < 5; i++) {
  const cp = modEstado.checkpointsPista[i];
  if (i === 1) {
    modEstado.fisicaCarro.x = cp.x - 0.1;
    modEstado.fisicaCarro.y = 0.02;
    modEstado.fisicaCarro.z = cp.z;
    modEstado.fisicaCarro.enAire = false;
    modEstado.fisicaCarro.velocidad = 0;
    modCond.actualizarFisicaConduccion(0.1);
    if (modEstado.estadoCronometro.checkpointActual !== 1) {
      throw new Error('CP 2 del puente superior NO debe activarse desde el nivel inferior');
    }
  }
  modEstado.fisicaCarro.x = cp.x - 0.1;
  modEstado.fisicaCarro.y = cp.y + 0.02;
  modEstado.fisicaCarro.z = cp.z;
  modEstado.fisicaCarro.enAire = false;
  modEstado.fisicaCarro.velocidad = 0;
  modCond.actualizarFisicaConduccion(0.5);
  if (modEstado.estadoCronometro.checkpointActual !== i + 1) {
    throw new Error(`No se validó CP ${i + 1} en orden`);
  }
  if (cp.matIndicador.emissive.hex !== 0x00f566) {
    throw new Error(`CP ${i + 1} no cambió su color luminoso a verde neón (0x00f566)`);
  }
}

modEstado.fisicaCarro.x = -0.05;
modEstado.fisicaCarro.y = 0.02;
modEstado.fisicaCarro.z = 26.0;
modEstado.fisicaCarro.velocidad = 4.0;
modCond.actualizarFisicaConduccion(0.1);
if (!modEstado.estadoCronometro.ultimaVuelta || !modEstado.estadoCronometro.mejorVuelta) {
  throw new Error('No se registró ultimaVuelta/mejorVuelta al completar vuelta válida de 5 checkpoints');
}
if (!store.get('record_vuelta_habitacion_andy_coche') || !store.get('record_vuelta_pista_3d')) {
  throw new Error('No se guardó el récord de vuelta por escenario+clase y legacy en localStorage');
}
console.log(
  `OK: Cronómetro anti-trampas OK (ultimaVuelta=${modCond.formatearTiempoMMSS(modEstado.estadoCronometro.ultimaVuelta)}, HUD CP="${domElements.get('checkpoints-hud').textContent}", mejorHUD="${domElements.get('mejor-vuelta-hud').textContent}").`
);

// 4D. Verificación de js/audio.js con AudioContext mock
const modAudio = await import(pathToFileURL(path.join(jsDir, 'audio.js')).href);
modAudio.inicializarAudioInteractivo();
const gestureFn = windowListeners.get('pointerdown');
if (typeof gestureFn !== 'function') {
  throw new Error('inicializarAudioInteractivo() debe registrar listener pointerdown en window');
}
gestureFn();
if (modAudio.alternarSilencio() !== true) {
  throw new Error('alternarSilencio() debió devolver true al silenciar por primera vez');
}
if (modAudio.alternarSilencio() !== false) {
  throw new Error('alternarSilencio() debió devolver false al reactivar audio');
}
modAudio.cambiarModoMusical('conduccion');
for (const idC of ['carroceria_muscle', 'carroceria_formula', 'carroceria_sedan', 'carroceria_buggy']) {
  modAudio.actualizarAudioMotor(4.2, 5.5, idC, false);
}
modAudio.actualizarAudioDerrape(true, 0.85);
modAudio.actualizarAudioDerrape(false, 0);
modAudio.reproducirTurbo(true);
modAudio.reproducirTurbo(false);
modAudio.reproducirImpacto(0.7, 'obstaculo');
modAudio.reproducirImpacto(0.5, 'aterrizaje');
for (let i = 0; i < 5; i++) modAudio.reproducirCheckpoint(i);
modAudio.reproducirMeta(false);
modAudio.reproducirMeta(true);
modAudio.reproducirEncajePieza();
modAudio.reproducirQuitarPieza();
modAudio.reproducirCambioColor();
modAudio.actualizarMusicaAmbiental(0.5, 'taller');
modAudio.actualizarMusicaAmbiental(0.5, 'conduccion', false);
modAudio.actualizarMusicaAmbiental(0.5, 'conduccion', true);

// 4E. Verificación de js/partituras.js y cambiarPistaConduccion()
const modPartituras = await import(pathToFileURL(path.join(jsDir, 'partituras.js')).href);
if (modPartituras.notaAFrecuencia('_') !== 0) throw new Error("notaAFrecuencia('_') debe devolver 0");
if (Math.abs(modPartituras.notaAFrecuencia('A4') - 440) > 0.01) throw new Error("notaAFrecuencia('A4') debe ser 440");
if (modPartituras.notaAFrecuencia('F#4') <= modPartituras.notaAFrecuencia('F4')) throw new Error('Sostenido F#4 incorrecto');
if (modPartituras.notaAFrecuencia('Bb4') >= modPartituras.notaAFrecuencia('B4')) throw new Error('Bemol Bb4 incorrecto');

const pistasEsperadas = ['taller_juguetes', 'circuito_kart', 'autopista_16bit', 'turbo_apex', 'ola_snes', 'cielo_snes'];
const fMinC2 = modPartituras.notaAFrecuencia('C2');
const fMaxC7 = modPartituras.notaAFrecuencia('C7');

for (const idP of pistasEsperadas) {
  const part = modPartituras.CATALOGO_PARTITURAS[idP];
  if (!part || !part.canales) throw new Error(`Falta partitura '${idP}' en CATALOGO_PARTITURAS`);
  if (part.subdivision !== 4) throw new Error(`Se esperaba subdivision=4 en '${idP}', tiene ${part.subdivision}`);
  const len = part.canales.melodia.length;
  if (len < 64) throw new Error(`La partitura '${idP}' debe tener al menos 64 pasos (tiene ${len})`);
  for (const ch of ['melodia', 'armonia', 'bajo']) {
    if (part.canales[ch].length !== len) throw new Error(`Canal '${ch}' en '${idP}' no coincide en longitud (${part.canales[ch].length} vs ${len})`);
    for (const token of part.canales[ch]) {
      if (token !== '_' && token !== '~') {
        const subNotas = String(token).split('/');
        for (const nota of subNotas) {
          const hz = modPartituras.notaAFrecuencia(nota);
          if (!hz || hz < fMinC2 || hz > fMaxC7) {
            throw new Error(`Nota inválida o fuera de rango [C2..C7] en '${idP}.${ch}': '${token}' -> '${nota}' (${hz} Hz)`);
          }
        }
      }
    }
  }
  if (part.canales.percusion.length !== len) {
    throw new Error(`Canal 'percusion' en '${idP}' no coincide en longitud (${part.canales.percusion.length} vs ${len})`);
  }
  for (const sym of part.canales.percusion) {
    if (!['K', 'S', 'H', 'O', 'T', '.'].includes(sym)) {
      throw new Error(`Símbolo percusión inválido '${sym}' en '${idP}'`);
    }
  }
}

const titulosCiclo = [
  modAudio.cambiarPistaConduccion(),
  modAudio.cambiarPistaConduccion(),
  modAudio.cambiarPistaConduccion(),
  modAudio.cambiarPistaConduccion(),
  modAudio.cambiarPistaConduccion()
];
if (new Set(titulosCiclo).size !== 5) {
  throw new Error(`cambiarPistaConduccion() no rotó por 5 pistas únicas: ${JSON.stringify(titulosCiclo)}`);
}
const tituloOla = modAudio.seleccionarPistaMusicalPorId('ola_snes');
const tituloCielo = modAudio.seleccionarPistaMusicalPorId('cielo_snes');
if (!tituloOla || typeof tituloOla !== 'string' || !tituloCielo || typeof tituloCielo !== 'string') {
  throw new Error(`seleccionarPistaMusicalPorId() devolvió título inválido: ola=${tituloOla}, cielo=${tituloCielo}`);
}
for (const modoRun of ['taller', 'conduccion']) {
  for (let step = 0; step < 140; step++) {
    modAudio.actualizarMusicaAmbiental(0.11, modoRun, step % 2 === 0);
  }
  if (modoRun === 'conduccion') {
    for (let r = 0; r < 2; r++) {
      modAudio.cambiarPistaConduccion();
      for (let step = 0; step < 140; step++) {
        modAudio.actualizarMusicaAmbiental(0.11, 'conduccion', true);
      }
    }
  }
}
console.log(`OK: js/audio.js (SPC700 echo + 16-bit synth) + js/partituras.js (4x128 pasos @ subdiv=4, rotación: ${titulosCiclo.join(' -> ')}) verificados.`);

// 4F. Verificación de +20% velocidad, ±20% pendientes, -30% fuera de pista e interior 3D + volanteCabina
const modEnganches = await import(pathToFileURL(path.join(jsDir, 'enganches.js')).href);
if (!modRec.bancoTexturas.tablero) {
  throw new Error('inicializarRecursos() debe generar bancoTexturas.tablero');
}
for (const c of modCat.TABLA_CARROCERIAS) {
  const { velMax, aceleracion, manejo, statsUI } = c.atributos;
  const espVel = +((2.5 + statsUI.velocidad * 0.065) * 1.20 * 1.30).toFixed(3);
  const espAcel = +((1.8 + statsUI.aceleracion * 0.065) * 1.18 * 1.30).toFixed(3);
  const espMan = +(1.1 + statsUI.control * 0.022).toFixed(3);
  if (Math.abs(velMax - espVel) > 1e-6 || Math.abs(aceleracion - espAcel) > 1e-6 || Math.abs(manejo - espMan) > 1e-6) {
    throw new Error(`Fórmulas físicas (+30% sobre +20% vel / +18% acel) inválidas en ${c.id}`);
  }
  const mallaC = c.crear(0xff1e27);
  if (!mallaC.getObjectByName('volanteCabina')) {
    throw new Error(`La carrocería ${c.id} no contiene el nodo articulado 'volanteCabina'`);
  }
  let contGeo = 0;
  mallaC.traverse((h) => { if (h.geometry) contGeo++; });
  if (contGeo < 10) {
    throw new Error(`Falta detalle 3D en ${c.id} (geometrías=${contGeo})`);
  }
  modRec.liberarObjeto3D(mallaC);
}

modEnganches.construirOActualizarCarroceria('carroceria_sedan', false);
const velMaxSedan = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro).velMax;

const simularConduccion = (esPista, pendientePorX, teclaIzq = false) => {
  modCond.reposicionarEnMeta();
  modEstado.estadoCarro.modoJuego = 'conduccion';
  modEstado.teclasConduccion['KeyW'] = true;
  modEstado.teclasConduccion['KeyA'] = teclaIzq;
  modEstado.teclasConduccion['KeyD'] = false;
  modEstado.fisicaCarro.x = teclaIzq ? -5.0 : -35.0;
  modEstado.fisicaCarro.z = 10.0;
  modEstado.fisicaCarro.y = 0.02;
  for (let i = 0; i < 100; i++) {
    globalThis._mockRayEstado = { esPista, pendientePorX, refX: modEstado.fisicaCarro.x };
    modCond.actualizarFisicaConduccion(0.05);
  }
  modEstado.teclasConduccion['KeyW'] = false;
  modEstado.teclasConduccion['KeyA'] = false;
  globalThis._mockRayEstado = { esPista: true, pendientePorX: 0 };
  return modEstado.fisicaCarro.velocidad;
};

const vPlana = simularConduccion(true, 0, false);
simularConduccion(true, 0, true);
const volanteRotado = modEnganches.grupoJuguete.getObjectByName('volanteCabina');
if (!volanteRotado || Math.abs(volanteRotado.rotation.z - -modEstado.fisicaCarro.anguloVolante * 2.4) > 1e-4 || Math.abs(volanteRotado.rotation.z) < 0.2) {
  throw new Error(`El volante de cabina no giró correctamente: rot.z=${volanteRotado && volanteRotado.rotation.z}`);
}

const vFueraPista = simularConduccion(false, 0, false);
const vSubida = simularConduccion(true, 0.22, false);
const vBajada = simularConduccion(true, -0.22, false);

if (Math.abs(vPlana - velMaxSedan) > 0.15) {
  throw new Error(`Velocidad en pista plana fuera de tolerancia: got=${vPlana.toFixed(3)}, expected=${velMaxSedan}`);
}
if (Math.abs(vFueraPista - velMaxSedan * 0.70) > 0.15) {
  throw new Error(`Penalización -30% fuera de pista inválida: got=${vFueraPista.toFixed(3)}, expected=${(velMaxSedan * 0.70).toFixed(3)}`);
}
if (Math.abs(vSubida - velMaxSedan * 0.80) > 0.15) {
  throw new Error(`Penalización -20% subida inválida: got=${vSubida.toFixed(3)}, expected=${(velMaxSedan * 0.80).toFixed(3)}`);
}
if (Math.abs(vBajada - velMaxSedan * 1.20) > 0.15) {
  throw new Error(`Bono +20% bajada inválido: got=${vBajada.toFixed(3)}, expected=${(velMaxSedan * 1.20).toFixed(3)}`);
}
console.log(
  `OK: 6 chasis (+20% velMax=${velMaxSedan}), interior+volanteCabina, fueraPista=${vFueraPista.toFixed(2)}, subida=${vSubida.toFixed(2)}, bajada=${vBajada.toFixed(2)} m/s.`
);

// 4G. Verificación Fase 1 Escalado Vertical: CATALOGO_HABITACIONES, cargarEscenario, GPU dispose y polimorfismo
if (
  !Array.isArray(modConst.CLASES_VEHICULO) ||
  modConst.CLASES_VEHICULO.join(',') !== 'coche,moto,barco,avion' ||
  modConst.TOPE_STAT_UI !== 85 ||
  !modConst.CATALOGO_HABITACIONES.habitacion_andy
) {
  throw new Error('Faltan exportaciones CLASES_VEHICULO, TOPE_STAT_UI=85 o CATALOGO_HABITACIONES.habitacion_andy en constantes.js');
}

// Estado polimórfico y alias modoCuatroRuedas <-> modoSimetriaEnganches
modEstado.estadoCarro.modoCuatroRuedas = false;
if (modEstado.estadoCarro.modoSimetriaEnganches !== false) {
  throw new Error('El setter modoCuatroRuedas no sincronizó modoSimetriaEnganches');
}
modEstado.estadoCarro.modoSimetriaEnganches = true;
if (modEstado.estadoCarro.modoCuatroRuedas !== true) {
  throw new Error('El getter modoCuatroRuedas no reflejó modoSimetriaEnganches');
}
if (
  modEstado.obtenerClaveRecord('habitacion_andy', 'barco') !== 'record_vuelta_habitacion_andy_barco' ||
  !modEstado.estadoCarro.configuracionesPorClase.coche
) {
  throw new Error('Contratos obtenerClaveRecord / configuracionesPorClase incompletos en estado.js');
}

// Carga y recarga limpia de escenario (grupoEscenarioActivo + liberación de texturas temporales sin tocar bancoTexturas)
modEsc.cargarEscenario('habitacion_andy');
const conteoMallas1 = modEstado.mallasSuperficieConducible.length;
const conteoObs1 = modEstado.obstaculosHabitacion.length;
const conteoTurbo1 = modEstado.plataformasTurbo.length;
const texturasClonadasCarga1 = [];
modEsc.grupoEscenarioActivo.traverse((obj) => {
  if (obj.material && obj.material.map && obj.material.map.userData && obj.material.map.userData.esClonTemporal) {
    texturasClonadasCarga1.push(obj.material.map);
  }
});
if (texturasClonadasCarga1.length === 0) {
  throw new Error('Las texturas clonadas de pista deben marcarse con userData.esClonTemporal = true');
}

const tieneTipoPista = modEstado.mallasSuperficieConducible.some((m) => m.userData.tipoSuperficie === 'pista_asfalto');
const tieneTipoFuera = modEstado.mallasSuperficieConducible.some((m) => m.userData.tipoSuperficie === 'fuera_pista');
if (!tieneTipoPista || !tieneTipoFuera) {
  throw new Error('Faltan etiquetas userData.tipoSuperficie (pista_asfalto / fuera_pista) en mallasSuperficieConducible');
}

// Recarga del escenario: debe limpiar texturas temporales anteriores, preservar bancoTexturas y no duplicar arreglos
modEsc.cargarEscenario('habitacion_andy');
if (
  modEstado.mallasSuperficieConducible.length !== conteoMallas1 ||
  modEstado.obstaculosHabitacion.length !== conteoObs1 ||
  modEstado.plataformasTurbo.length !== conteoTurbo1 ||
  modEstado.checkpointsPista.length !== 5
) {
  throw new Error('cargarEscenario() no vació limpiamente los arreglos de estado al recargar');
}
if (texturasClonadasCarga1.some((t) => t.disposeCount === 0)) {
  throw new Error('liberarObjeto3D() no liberó las texturas con userData.esClonTemporal === true al recargar escenario');
}
if (modRec.bancoTexturas.asfalto.disposeCount > 0 || modRec.bancoTexturas.piano.disposeCount > 0 || modRec.bancoTexturas.maderaDiffuse.disposeCount > 0) {
  throw new Error('liberarObjeto3D() liberó erróneamente texturas compartidas de bancoTexturas');
}

// Catálogo polimórfico, esVacio, limpieza de llaves y UI
for (const c of modCat.TABLA_CARROCERIAS) {
  if (!modConst.CLASES_VEHICULO.includes(c.clase)) {
    throw new Error(`Clase inválida '${c.clase}' en ${c.id}`);
  }
  for (const eng of c.enganches) {
    if (!eng.rolAnimacion) throw new Error(`Falta rolAnimacion en enganche ${c.id}.${eng.id}`);
    if (eng.tipo === 'rueda' && eng.grupoSimetria !== 'ruedas') {
      throw new Error(`Falta grupoSimetria: 'ruedas' en ${c.id}.${eng.id}`);
    }
  }
}
const accNinguno = modCat.TABLA_PIEZAS.find((p) => p.id === 'acc_ninguno');
if (!accNinguno || accNinguno.esVacio !== true) {
  throw new Error("acc_ninguno debe declararse con esVacio: true");
}
for (const p of modCat.TABLA_PIEZAS) {
  if (!Array.isArray(p.clasesCompatibles) || p.clasesCompatibles.length === 0) {
    throw new Error(`Falta clasesCompatibles en pieza ${p.id}`);
  }
  for (const cl of p.clasesCompatibles) {
    if (!modConst.CLASES_VEHICULO.includes(cl)) {
      throw new Error(`Clase compatible inválida '${cl}' en pieza ${p.id}`);
    }
  }
}

// Comprobar limpieza de llaves huérfanas y colocación por esVacio
modEstado.estadoCarro.piezasEnEnganches.llave_obsoleta_barco = 'propulsor_falso';
modEnganches.construirOActualizarCarroceria('carroceria_sedan', false);
if ('llave_obsoleta_barco' in modEstado.estadoCarro.piezasEnEnganches) {
  throw new Error('construirOActualizarCarroceria() no limpió llaves de enganche que no pertenecen al chasis');
}
modEnganches.colocarPiezaEnEnganche('acc_techo', 'acc_ninguno', false);
if (modEstado.estadoCarro.piezasEnEnganches.acc_techo !== null) {
  throw new Error('colocarPiezaEnEnganche() con esVacio: true debió establecer null en el enganche');
}

// Comprobar corrección en interfaz.js (renderizarBandeja en 'accesorio' y escala TOPE_STAT_UI=85)
const modUI = await import(pathToFileURL(path.join(jsDir, 'interfaz.js')).href);
modUI.renderizarBandeja('accesorio');
modUI.renderizarBandeja('carroceria');
const interfazSrc = fs.readFileSync(path.join(jsDir, 'interfaz.js'), 'utf8');
if (interfazSrc.includes('piezasEquipadas') || interfazSrc.includes("['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td']")) {
  throw new Error('interfaz.js aún contiene referencias rotas o hardcodeadas de ruedas/piezasEquipadas');
}
if (condSrc.includes("['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td']")) {
  throw new Error('conduccion.js aún contiene lista hardcodeada de 4 ruedas');
}

// Comprobar roles de animación polimórficos adicionales en conduccion.js (helice_x, helice_z, timon_y)
const mockMallaHelice = new MockObj();
const mockGrpTimon = new MockObj();
modEstado.nodosEnganches.test_helice = {
  definicion: { id: 'test_helice', tipo: 'propulsor', rolAnimacion: 'helice_x', sentidoGiro: 1 },
  rotacionBaseY: 0,
  grupoContenedor: new MockObj(),
  mallaPieza: mockMallaHelice
};
modEstado.nodosEnganches.test_timon = {
  definicion: { id: 'test_timon', tipo: 'timon', rolAnimacion: 'timon_y' },
  rotacionBaseY: 0,
  grupoContenedor: mockGrpTimon,
  mallaPieza: new MockObj()
};
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.teclasConduccion['KeyA'] = true;
modCond.actualizarFisicaConduccion(0.1);
modEstado.teclasConduccion['KeyA'] = false;
if (mockMallaHelice.rotation.x <= 0 || mockGrpTimon.rotation.y === 0) {
  throw new Error('Despachador rolAnimacion en conduccion.js no animó helice_x / timon_y');
}
delete modEstado.nodosEnganches.test_helice;
delete modEstado.nodosEnganches.test_timon;

console.log('OK: Fase 1 Escalado Vertical (CATALOGO_HABITACIONES, cargarEscenario + GPU cleanup, polimorfismo y rolAnimacion) verificada.');

// 4H. Verificación Fase 2: Motos, Barcos y Aviones, cambiarClaseVehiculo, PERFILES_FISICA y Audio por Clase
const conteoClasesChasis = { coche: 0, moto: 0, barco: 0, avion: 0 };
modCat.TABLA_CARROCERIAS.forEach((c) => {
  conteoClasesChasis[c.clase] = (conteoClasesChasis[c.clase] || 0) + 1;
});
if (
  modCat.TABLA_CARROCERIAS.length !== 24 ||
  conteoClasesChasis.coche !== 6 ||
  conteoClasesChasis.moto !== 6 ||
  conteoClasesChasis.barco !== 6 ||
  conteoClasesChasis.avion !== 6
) {
  throw new Error(`Conteo de chasis incorrecto por clase (esperado 24, 6x4): ${JSON.stringify(conteoClasesChasis)}`);
}
if (modCat.TABLA_PIEZAS.length !== 49) {
  throw new Error(`Se esperaban 49 piezas en TABLA_PIEZAS, encontradas ${modCat.TABLA_PIEZAS.length}`);
}

// Miniaturas Box3 de los 12 chasis + 30 piezas sin afectar bancoTexturas
modUI.generarMiniaturasCatalogo();
for (const c of modCat.TABLA_CARROCERIAS) {
  if (!modRec.cacheMiniaturas[c.id]) {
    throw new Error(`Falta miniatura para chasis ${c.id}`);
  }
}
for (const p of modCat.TABLA_PIEZAS) {
  if (!p.esVacio && !modRec.cacheMiniaturas[p.id]) {
    throw new Error(`Falta miniatura para pieza ${p.id}`);
  }
}
if (modRec.bancoTexturas.asfalto.disposeCount > 0 || modRec.bancoTexturas.maderaDiffuse.disposeCount > 0) {
  throw new Error('generarMiniaturasCatalogo() liberó erróneamente texturas compartidas de bancoTexturas');
}

// Ciclar cambiarClaseVehiculo() por moto -> barco -> avion -> coche validando piezas y bandeja
if (modUI.cambiarClaseVehiculo() !== 'moto' || !modEstado.nodosEnganches.rueda_delantera) {
  throw new Error('cambiarClaseVehiculo() no cambió correctamente a moto');
}
modUI.renderizarBandeja('rueda_moto');
modUI.renderizarBandeja('accesorio_moto');

// Física Moto: peralte pronunciado al girar (> 0.25 rad) y wheelie en turbo
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.teclasConduccion['KeyW'] = true;
modEstado.teclasConduccion['KeyA'] = true;
modEstado.fisicaCarro.x = -10.0;
modEstado.fisicaCarro.z = 10.0;
modEstado.fisicaCarro.tiempoTurbo = 1.0;
for (let i = 0; i < 40; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyW'] = false;
modEstado.teclasConduccion['KeyA'] = false;
if (Math.abs(modEstado.fisicaCarro.roll) < 0.25 || modEstado.fisicaCarro.pitch <= 0.05) {
  throw new Error(`Física de moto inválida: roll=${modEstado.fisicaCarro.roll}, pitch=${modEstado.fisicaCarro.pitch}`);
}
modAudio.actualizarAudioMotor(6.0, 9.5, 'moto_superbike', false);
modAudio.actualizarAudioDerrape(true, 0.9, 'moto_superbike');

// Física Barco: superficie agua_navegable sin penalización y animación de propulsor + timón
if (modUI.cambiarClaseVehiculo() !== 'barco' || !modEstado.nodosEnganches.propulsor_popa) {
  throw new Error('cambiarClaseVehiculo() no cambió correctamente a barco');
}
modUI.renderizarBandeja('propulsor_barco');
modUI.renderizarBandeja('timon_cubierta');
globalThis._mockRayEstado = { esPista: false, tipoSuperficie: 'agua_navegable', pendientePorX: 0 };
const infoAgua = modCond.obtenerInfoSuperficieEnPunto(0, 0, 0.02);
if (!infoAgua.esPista || infoAgua.tipoSuperficie !== 'agua_navegable') {
  throw new Error(`El barco debe navegar sobre agua_navegable sin penalización: ${JSON.stringify(infoAgua)}`);
}
const velMaxBarco = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro).velMax;
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.teclasConduccion['KeyW'] = true;
modEstado.teclasConduccion['KeyD'] = false;
modEstado.fisicaCarro.x = -35.0;
modEstado.fisicaCarro.z = 10.0;
for (let i = 0; i < 100; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
if (Math.abs(modEstado.fisicaCarro.velocidad - velMaxBarco * 1.06) > 0.25) {
  throw new Error(`Barco sobre agua_navegable no alcanzó velMax + 6% afinidad (${modEstado.fisicaCarro.velocidad.toFixed(2)} vs ${(velMaxBarco * 1.06).toFixed(2)})`);
}
modEstado.teclasConduccion['KeyD'] = true;
for (let i = 0; i < 6; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyW'] = false;
modEstado.teclasConduccion['KeyD'] = false;
if (modEstado.nodosEnganches.propulsor_popa.mallaPieza.rotation.z <= 0 || modEstado.nodosEnganches.timon_popa.grupoContenedor.rotation.y === 0) {
  throw new Error('No se animó propulsor_popa / timon_popa del barco');
}
modAudio.actualizarAudioMotor(7.0, velMaxBarco, 'barco_hidroplano', false);
modAudio.actualizarAudioDerrape(true, 0.8, 'barco_hidroplano');

// Física Avión: despegue con Q, tope techo de habitación, alabeo, descenso con E, hélice en ralentí y checkpoint aéreo
if (modUI.cambiarClaseVehiculo() !== 'avion' || !modEstado.nodosEnganches.motor_frontal) {
  throw new Error('cambiarClaseVehiculo() no cambió correctamente a avion');
}
modUI.renderizarBandeja('ala_avion');
modUI.renderizarBandeja('motor_cola');
globalThis._mockRayEstado = { esPista: true, sueloFijo: 0.02, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
// Ralentí: la hélice debe seguir girando incluso con velocidad 0
modCond.actualizarFisicaConduccion(0.1);
if (modEstado.nodosEnganches.motor_frontal.mallaPieza.rotation.z <= 0) {
  throw new Error('La hélice frontal del avión debe girar incluso en ralentí');
}
// Acelerar > 3.8 m/s en espacio libre y elevarse con KeyQ
modEstado.teclasConduccion['KeyW'] = true;
modEstado.teclasConduccion['KeyQ'] = true;
modEstado.teclasConduccion['KeyA'] = false;
modEstado.fisicaCarro.x = -15.0;
modEstado.fisicaCarro.z = 10.0;
for (let i = 0; i < 45; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyA'] = true;
for (let i = 0; i < 10; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyQ'] = false;
modEstado.teclasConduccion['KeyA'] = false;
const altoHab = modConst.CATALOGO_HABITACIONES.habitacion_andy.dimensiones.alto;
if (!modEstado.fisicaCarro.enAire || modEstado.fisicaCarro.altitudVuelo <= 1.0 || modEstado.fisicaCarro.y > altoHab - 0.80) {
  throw new Error(`Física de vuelo del avión inválida: enAire=${modEstado.fisicaCarro.enAire}, alt=${modEstado.fisicaCarro.altitudVuelo}, y=${modEstado.fisicaCarro.y}`);
}
if (Math.abs(modEstado.fisicaCarro.roll) < 0.25) {
  throw new Error(`Falta alabeo dinámico en vuelo del avión: roll=${modEstado.fisicaCarro.roll}`);
}
// Validar checkpoint aéreo (y = 2.8m mientras cp.y = 0.02m, diferencia < 4.5m)
const cp0 = modEstado.checkpointsPista[0];
modEstado.estadoCronometro.vueltaActiva = true;
modEstado.estadoCronometro.checkpointActual = 0;
modEstado.fisicaCarro.x = cp0.x - 0.1;
modEstado.fisicaCarro.z = cp0.z;
modEstado.fisicaCarro.altitudVuelo = 2.8;
modEstado.teclasConduccion['KeyW'] = false;
modCond.actualizarFisicaConduccion(0.05);
if (modEstado.estadoCronometro.checkpointActual !== 1) {
  throw new Error('Avión en vuelo no validó el checkpoint dentro del margen vertical aéreo (< 4.5m)');
}
// Descenso con KeyE
modEstado.teclasConduccion['KeyW'] = true;
modEstado.teclasConduccion['KeyE'] = true;
modEstado.fisicaCarro.velocidad = 6.0;
for (let i = 0; i < 20; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyW'] = false;
modEstado.teclasConduccion['KeyE'] = false;
if (modEstado.fisicaCarro.altitudVuelo >= 2.8) {
  throw new Error(`El avión no descendió al pulsar KeyE: altitudVuelo=${modEstado.fisicaCarro.altitudVuelo}`);
}
modAudio.actualizarAudioMotor(8.0, 10.5, 'avion_jet', true);
modAudio.actualizarAudioDerrape(true, 0.9, 'avion_jet');

// Regresar al coche inicial conservando sus piezas guardadas
if (modUI.cambiarClaseVehiculo() !== 'coche' || modEstado.estadoCarro.idCarroceria !== 'carroceria_sedan') {
  throw new Error('El ciclo de cambiarClaseVehiculo() no regresó limpiamente a carroceria_sedan');
}
if (!modEstado.nodosEnganches.rueda_di || !modEstado.nodosEnganches.rueda_di.mallaPieza) {
  throw new Error('Al volver a coche no se restauraron sus piezas guardadas en configuracionesPorClase');
}

console.log('OK: Fase 2 Escalado Vertical (12 chasis, 30 piezas, Miniaturas Box3, Moto/Barco/Avión físicas+audio) verificada.');

// 4I. Fase 3 Escalado Vertical: 4 Habitaciones, +6% Afinidad de Medio, Anillos Aéreos y Limpieza de Texturas Clones
const idsEsperadosHab = ['habitacion_andy', 'habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar'];
if (JSON.stringify(modConst.IDS_HABITACIONES) !== JSON.stringify(idsEsperadosHab)) {
  throw new Error(`IDS_HABITACIONES inesperado: ${JSON.stringify(modConst.IDS_HABITACIONES)}`);
}
for (const texKey of ['agua', 'azulejo', 'tierra', 'hangar']) {
  if (!modRec.bancoTexturas[texKey]) {
    throw new Error(`Falta textura procedural '${texKey}' en bancoTexturas`);
  }
}

function recolectarClonesActivos() {
  const clones = new Set();
  modEsc.grupoEscenarioActivo.traverse((h) => {
    if (!h.material) return;
    for (const k of ['map', 'bumpMap', 'roughnessMap', 'emissiveMap']) {
      const tex = h.material[k];
      if (tex && tex.userData && tex.userData.esClonTemporal === true) {
        clones.add(tex);
      }
    }
  });
  return clones;
}

modUI.cambiarHabitacion('habitacion_andy');
const ordenCicloHab = ['habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar', 'habitacion_andy'];
for (const habEsperada of ordenCicloHab) {
  const clonesPrevios = recolectarClonesActivos();
  const habNueva = modUI.cambiarHabitacion();
  if (habNueva !== habEsperada || modEstado.estadoCarro.idHabitacion !== habEsperada) {
    throw new Error(`cambiarHabitacion() devolvió '${habNueva}', esperaba '${habEsperada}'`);
  }
  for (const texPrev of clonesPrevios) {
    if (texPrev.disposeCount < 1) {
      throw new Error(`Fuga de GPU: textura esClonTemporal no fue liberada (.dispose) al salir hacia '${habEsperada}'`);
    }
  }
  if (modEstado.checkpointsPista.length !== 5) {
    throw new Error(`Escenario '${habEsperada}' debe tener 5 checkpoints (tiene ${modEstado.checkpointsPista.length})`);
  }
  if (modEstado.plataformasTurbo.length < 6) {
    throw new Error(`Escenario '${habEsperada}' debe tener al menos 6 boost pads (tiene ${modEstado.plataformasTurbo.length})`);
  }
  if (habEsperada === 'habitacion_hangar' && modEstado.plataformasTurbo.length < 18) {
    throw new Error(`habitacion_hangar debe tener al menos 18 boost pads (suelo + 8 anillos aéreos), tiene ${modEstado.plataformasTurbo.length}`);
  }
  if (modEstado.mallasSuperficieConducible.length < 2) {
    throw new Error(`Escenario '${habEsperada}' debe registrar mallasSuperficieConducible`);
  }
  const cintasBuffer = modEstado.mallasSuperficieConducible.filter((m) => m.geometry instanceof MockBufferGeometry);
  for (const mCinta of cintasBuffer) {
    const pA = mCinta.geometry.attributes.position.array;
    const iA = mCinta.geometry.index.array;
    for (let t = 0; t < iA.length; t += 3) {
      const ia = iA[t] * 3, ib = iA[t + 1] * 3, ic = iA[t + 2] * 3;
      const abx = pA[ib] - pA[ia], abz = pA[ib + 2] - pA[ia + 2];
      const acx = pA[ic] - pA[ia], acz = pA[ic + 2] - pA[ia + 2];
      const ny = abz * acx - abx * acz;
      if (ny <= 0) {
        throw new Error(`Triángulo invertido en '${habEsperada}' (tri=${t / 3}, ny=${ny})`);
      }
    }
  }
}

// Bonificación +6% moto en pista_tierra (Ático Enduro)
modUI.cambiarHabitacion('habitacion_atico');
while (modEstado.estadoCarro.claseVehiculo !== 'moto') {
  modUI.cambiarClaseVehiculo();
}
const velMaxMoto = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro).velMax;
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_tierra', pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.fisicaCarro.x = -35.0;
modEstado.fisicaCarro.z = 10.0;
modEstado.teclasConduccion['KeyW'] = true;
for (let i = 0; i < 120; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyW'] = false;
if (Math.abs(modEstado.fisicaCarro.velocidad - velMaxMoto * 1.06) > 0.25) {
  throw new Error(`Moto en pista_tierra no alcanzó velMax + 6% afinidad (${modEstado.fisicaCarro.velocidad.toFixed(2)} vs ${(velMaxMoto * 1.06).toFixed(2)})`);
}

// Hangar Aéreo: bonificación +6% en vuelo + anillos turbo aéreos + checkpoints elevados
modUI.cambiarHabitacion('habitacion_hangar');
while (modEstado.estadoCarro.claseVehiculo !== 'avion') {
  modUI.cambiarClaseVehiculo();
}
const velMaxAvion = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro).velMax;
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_asfalto', sueloFijo: 0.02, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.fisicaCarro.x = -45.0;
modEstado.fisicaCarro.z = 6.0;
modEstado.teclasConduccion['KeyW'] = true;
modEstado.teclasConduccion['KeyQ'] = true;
for (let i = 0; i < 35; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyQ'] = false;
for (let i = 0; i < 85; i++) {
  modCond.actualizarFisicaConduccion(0.05);
}
modEstado.teclasConduccion['KeyW'] = false;
if (!modEstado.fisicaCarro.enAire || Math.abs(modEstado.fisicaCarro.velocidad - velMaxAvion * 1.06) > 0.35) {
  throw new Error(`Avión en Hangar en vuelo no alcanzó velMax + 6% afinidad (${modEstado.fisicaCarro.velocidad.toFixed(2)} vs ${(velMaxAvion * 1.06).toFixed(2)}, enAire=${modEstado.fisicaCarro.enAire})`);
}

const padAereo = modEstado.plataformasTurbo.find((p) => (p.margenY || 0) >= 2.5);
if (!padAereo) {
  throw new Error('Faltan anillos turbo aéreos (margenY >= 2.5) en habitacion_hangar');
}
padAereo.enfriamiento = 0;
modEstado.fisicaCarro.x = padAereo.posicion.x;
modEstado.fisicaCarro.z = padAereo.posicion.z;
modEstado.fisicaCarro.altitudVuelo = padAereo.posicion.y;
modEstado.fisicaCarro.velocidad = 6.0;
modEstado.fisicaCarro.enAire = true;
modEstado.fisicaCarro.tiempoTurbo = 0;
modCond.actualizarFisicaConduccion(0.05);
if (modEstado.fisicaCarro.tiempoTurbo <= 0) {
  throw new Error('Volar por un anillo turbo aéreo en habitacion_hangar no activó tiempoTurbo');
}

const cpAereo = modEstado.checkpointsPista.find((c) => (c.radioVertical || 0) >= 9.0);
if (!cpAereo) {
  throw new Error('No se encontró checkpoint híbrido con radioVertical >= 9.0 en habitacion_hangar');
}
modEstado.estadoCronometro.vueltaActiva = true;
modEstado.estadoCronometro.checkpointActual = cpAereo.indice;
modEstado.fisicaCarro.x = cpAereo.x;
modEstado.fisicaCarro.z = cpAereo.z;
modEstado.fisicaCarro.altitudVuelo = 5.5;
modEstado.fisicaCarro.velocidad = 6.0;
modEstado.fisicaCarro.enAire = true;
modCond.actualizarFisicaConduccion(0.05);
if (modEstado.estadoCronometro.checkpointActual !== cpAereo.indice + 1) {
  throw new Error(`Avión no validó checkpoint aéreo del Hangar (esperado ${cpAereo.indice + 1}, actual ${modEstado.estadoCronometro.checkpointActual})`);
}

// Restaurar estado limpio inicial
modUI.cambiarHabitacion('habitacion_andy');
while (modEstado.estadoCarro.claseVehiculo !== 'coche') {
  modUI.cambiarClaseVehiculo();
}

console.log('OK: Fase 3 Escalado Vertical (4 Habitaciones, +6% Afinidad de Medio, Anillos Aéreos y Cero Fugas GPU) verificada.');

// 4J. Parte 1 Pulido y Expansión Visual: modStats en piezas, física dinámica, decoración de habitaciones y menú Mario Kart
for (const pieza of modCat.TABLA_PIEZAS) {
  const m = pieza.modStats;
  if (
    !m ||
    typeof m.velocidad !== 'number' ||
    typeof m.aceleracion !== 'number' ||
    typeof m.control !== 'number'
  ) {
    throw new Error(`Falta modStats válido en pieza '${pieza.id}'`);
  }
  for (const k of ['velocidad', 'aceleracion', 'control']) {
    if (m[k] < -5 || m[k] > 8) {
      throw new Error(`modStats.${k}=${m[k]} fuera de rango [-5, +8] en '${pieza.id}'`);
    }
  }
  if (pieza.esVacio && (m.velocidad !== 0 || m.aceleracion !== 2 || m.control !== 0)) {
    throw new Error(`Opción esVacio '${pieza.id}' debe tener modStats {0, 2, 0}, tiene ${JSON.stringify(m)}`);
  }
}

// Comparativa real de stats y velocidad al cambiar entre rueda_deportiva (+6 VEL) y rueda_todoterreno (-3 VEL, +6 CTRL)
modUI.cambiarHabitacion('habitacion_andy');
while (modEstado.estadoCarro.claseVehiculo !== 'coche') {
  modUI.cambiarClaseVehiculo();
}
modEnganches.construirOActualizarCarroceria('carroceria_sedan', false);
['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td'].forEach((eng) => {
  modEnganches.colocarPiezaEnEnganche(eng, 'rueda_deportiva', false);
});
modEnganches.colocarPiezaEnEnganche('acc_techo', 'acc_ninguno', false);
const atribDep = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro);
const vSimDep = simularConduccion(true, 0, false);

['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td'].forEach((eng) => {
  modEnganches.colocarPiezaEnEnganche(eng, 'rueda_todoterreno', false);
});
modEnganches.colocarPiezaEnEnganche('acc_techo', 'acc_aleron', false);
const atribTT = modCat.obtenerAtributosFinalesVehiculo(modEstado.estadoCarro);
const vSimTT = simularConduccion(true, 0, false);

if (
  atribDep.velMax <= atribTT.velMax ||
  atribTT.manejo <= atribDep.manejo ||
  atribDep.statsUI.velocidad === atribTT.statsUI.velocidad
) {
  throw new Error(`obtenerAtributosFinalesVehiculo() no diferenció piezas deportivas vs todoterreno`);
}
if (Math.abs(vSimDep - atribDep.velMax) > 0.2 || Math.abs(vSimTT - atribTT.velMax) > 0.2) {
  throw new Error(`actualizarFisicaConduccion() no reflejó modStats: dep=${vSimDep.toFixed(2)} vs ${atribDep.velMax}, tt=${vSimTT.toFixed(2)} vs ${atribTT.velMax}`);
}

// Posters temáticos, previsualizaciones canvas y colisionadores ricos en las 3 nuevas habitaciones
for (const keyPoster of ['postersAcuaticos', 'postersAtico', 'postersHangar']) {
  const arr = modRec.bancoTexturas[keyPoster];
  if (!Array.isArray(arr) || arr.length !== 4) {
    throw new Error(`Falta arreglo de 4 texturas '${keyPoster}' en bancoTexturas`);
  }
}
for (const idH of ['habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar']) {
  const prevCache = modRec.cacheMiniaturas[idH];
  const prevGen = modRec.crearVistaPreviaEscenario(idH);
  if (!String(prevCache).startsWith('data:image/png') || !String(prevGen).startsWith('data:image/png')) {
    throw new Error(`Vista previa PNG inválida para '${idH}'`);
  }
  modUI.cambiarHabitacion(idH);
  if (modEstado.obstaculosHabitacion.length < 10) {
    throw new Error(`Decoración insuficiente en '${idH}': obstaculosHabitacion=${modEstado.obstaculosHabitacion.length} (< 10)`);
  }
}

// Menú estilo Mario Kart: paneles cascada, ciclado de ranuras, barras comparativas y modal de copas
modUI.cambiarHabitacion('habitacion_andy');
if (modEstado.estadoCarro.modoJuego === 'conduccion') {
  modUI.alternarModoTallerConduccion();
}
modUI.actualizarPanelesMarioKart();
const nombreMK = globalThis.document.getElementById('nombre-vehiculo-mk').textContent;
const barrasMK = globalThis.document.getElementById('barras-stats-mk');
const coloresMK = globalThis.document.getElementById('mk-grid-colores');
if (!nombreMK || barrasMK.children.length !== 3 || coloresMK.children.length !== 8) {
  throw new Error(`Paneles Mario Kart incompletos: nombre='${nombreMK}', barras=${barrasMK.children.length}, colores=${coloresMK.children.length}`);
}

const chasisAntes = modEstado.estadoCarro.idCarroceria;
const chasisDespues = modUI.ciclarOpcionRanuraMK('chasis', 1);
if (!chasisDespues || chasisDespues === chasisAntes) {
  throw new Error('ciclarOpcionRanuraMK("chasis", 1) no cambió el chasis');
}
const ruedaAntes = modEstado.estadoCarro.piezasEnEnganches.rueda_di;
const ruedaDespues = modUI.ciclarOpcionRanuraMK('primaria', 1);
if (!ruedaDespues || ruedaDespues === ruedaAntes) {
  throw new Error('ciclarOpcionRanuraMK("primaria", 1) no cambió las ruedas');
}

modUI.abrirModalCircuitosMK();
const modalMK = globalThis.document.getElementById('modal-circuitos-mk');
const gridMK = globalThis.document.getElementById('grid-circuitos-mk');
if (!modalMK.classList.contains('abierto') || gridMK.children.length !== 4) {
  throw new Error(`abrirModalCircuitosMK() no generó las 4 tarjetas de circuito (${gridMK.children.length})`);
}
modUI.cerrarModalCircuitosMK();
if (modalMK.classList.contains('abierto')) {
  throw new Error('cerrarModalCircuitosMK() no cerró el modal');
}

modEnganches.construirOActualizarCarroceria('carroceria_sedan', false);

// Validar los 12 nuevos chasis, las 19 nuevas piezas, sus miniaturas y perfiles de audio de los 24 chasis
const idsNuevosChasis = [
  'moto_chopper', 'moto_scooter', 'moto_cyber', 'moto_caferacer',
  'barco_jetski', 'barco_hovercraft', 'barco_galeon', 'barco_submarino',
  'avion_steampunk', 'avion_stealth', 'avion_hidroavion', 'avion_espacial'
];
for (const idC of idsNuevosChasis) {
  if (!modCat.TABLA_CARROCERIAS.some((c) => c.id === idC)) {
    throw new Error(`Falta nuevo chasis '${idC}' en TABLA_CARROCERIAS`);
  }
}
const idsNuevasPiezas = [
  'rueda_oruga_tank', 'rueda_dorada_lujo', 'acc_cohete_techo', 'acc_sirena_policia',
  'rueda_moto_radios', 'rueda_moto_dragster', 'acc_moto_aleron_gp', 'acc_moto_nitro',
  'prop_reactor_plasma', 'prop_rueda_paletas', 'timon_aleta_tiburon', 'acc_barco_canones', 'acc_barco_hidrocanon',
  'ala_invertida_x', 'ala_solar_dorada', 'motor_doble_helice', 'motor_plasma_ion', 'cola_v_stealth', 'cola_booster_cohete'
];
for (const idP of idsNuevasPiezas) {
  const p = modCat.TABLA_PIEZAS.find((item) => item.id === idP);
  if (!p) throw new Error(`Falta nueva pieza '${idP}' en TABLA_PIEZAS`);
  if (!modRec.cacheMiniaturas[idP]) throw new Error(`Falta miniatura para nueva pieza '${idP}'`);
}
for (const c of modCat.TABLA_CARROCERIAS) {
  if (!modRec.cacheMiniaturas[c.id]) throw new Error(`Falta miniatura para chasis '${c.id}'`);
  modAudio.actualizarAudioMotor(7.0, c.atributos.velMax, c.id, c.clase === 'avion');
  modAudio.actualizarAudioDerrape(true, 0.8, c.id);
}

// 4K. Verificación integral del rediseño de los 4 circuitos, densidad de obstáculos/boosters, cotas elevadas y trampas de calzada
const habitacionesDiseno = ['habitacion_andy', 'habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar'];
for (const idHab of habitacionesDiseno) {
  modUI.cambiarHabitacion(idHab);
  const minBoosts = idHab === 'habitacion_hangar' ? 18 : 14;
  if (modEstado.plataformasTurbo.length < minBoosts) {
    throw new Error(`[4K] '${idHab}' debe tener >= ${minBoosts} plataformasTurbo (tiene ${modEstado.plataformasTurbo.length})`);
  }
  if (idHab === 'habitacion_hangar') {
    const anillos = modEstado.plataformasTurbo.filter((p) => (p.margenY || 0) >= 2.5);
    if (anillos.length < 8) {
      throw new Error(`[4K] 'habitacion_hangar' debe tener >= 8 anillos turbo aéreos (tiene ${anillos.length})`);
    }
  }
  if (modEstado.obstaculosMoviles.length < 10) {
    throw new Error(`[4K] '${idHab}' debe tener >= 10 obstaculosMoviles (tiene ${modEstado.obstaculosMoviles.length})`);
  }
  if (modEstado.obstaculosDinamicos.length < 20) {
    throw new Error(`[4K] '${idHab}' debe tener >= 20 obstaculosDinamicos (tiene ${modEstado.obstaculosDinamicos.length})`);
  }
  if (modEstado.trampasPista.length < 5) {
    throw new Error(`[4K] '${idHab}' debe tener >= 5 trampasPista (tiene ${modEstado.trampasPista.length})`);
  }

  let maxYCircuito = -Infinity;
  const cintasConducibles = modEstado.mallasSuperficieConducible.filter((m) => m.geometry instanceof MockBufferGeometry);
  if (cintasConducibles.length === 0) {
    throw new Error(`[4K] '${idHab}' no registró cintas BufferGeometry en mallasSuperficieConducible`);
  }
  for (const mCinta of cintasConducibles) {
    const posArr = mCinta.geometry.attributes.position.array;
    for (let i = 1; i < posArr.length; i += 3) {
      if (posArr[i] > maxYCircuito) maxYCircuito = posArr[i];
    }
  }
  if (maxYCircuito < 2.5) {
    throw new Error(`[4K] '${idHab}' debe alcanzar elevación >= 2.5 m (maxY=${maxYCircuito.toFixed(2)} m)`);
  }

  const cintaPrincipalPos = cintasConducibles[0].geometry.attributes.position.array;
  for (const cp of modEstado.checkpointsPista) {
    let minD = Infinity;
    for (let i = 0; i < cintaPrincipalPos.length; i += 6) {
      const mx = (cintaPrincipalPos[i] + cintaPrincipalPos[i + 3]) * 0.5;
      const my = (cintaPrincipalPos[i + 1] + cintaPrincipalPos[i + 4]) * 0.5;
      const mz = (cintaPrincipalPos[i + 2] + cintaPrincipalPos[i + 5]) * 0.5;
      const d = Math.hypot(mx - cp.x, my - (cp.y + 0.02), mz - cp.z);
      if (d < minD) minD = d;
    }
    if (minD >= 0.75) {
      throw new Error(`[4K] '${idHab}' CP ${cp.indice + 1} (${cp.x}, ${cp.y}, ${cp.z}) desalineado de la cinta principal (${minD.toFixed(2)} m)`);
    }
  }
}

// Prueba física de trampa 'aceite' (perturbación de guiñada en habitacion_andy)
modUI.cambiarHabitacion('habitacion_andy');
while (modEstado.estadoCarro.claseVehiculo !== 'coche') modUI.cambiarClaseVehiculo();
const trAceite = modEstado.trampasPista.find((t) => t.tipo === 'aceite');
if (!trAceite) throw new Error("[4K] Falta trampa 'aceite' en habitacion_andy");
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_asfalto', sueloFijo: trAceite.posicion.y, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.teclasConduccion['KeyA'] = false;
modEstado.teclasConduccion['KeyD'] = false;
modEstado.teclasConduccion['KeyW'] = true;
modEstado.fisicaCarro.yaw = 0;
modEstado.fisicaCarro.velocidad = 3.5;
let maxDesvioAceite = 0;
for (let i = 0; i < 15; i++) {
  modEstado.fisicaCarro.x = trAceite.posicion.x;
  modEstado.fisicaCarro.y = trAceite.posicion.y;
  modEstado.fisicaCarro.z = trAceite.posicion.z;
  modEstado.fisicaCarro.enAire = false;
  modCond.actualizarFisicaConduccion(0.04);
  maxDesvioAceite = Math.max(maxDesvioAceite, Math.abs(modEstado.fisicaCarro.yaw));
}
if (maxDesvioAceite <= 0.01) {
  throw new Error(`[4K] Trampa 'aceite' no perturbó la guiñada (maxDesvio=${maxDesvioAceite.toFixed(4)})`);
}

// Prueba física de trampa 'espuma' (perturbación de guiñada en habitacion_acuatica)
modUI.cambiarHabitacion('habitacion_acuatica');
while (modEstado.estadoCarro.claseVehiculo !== 'barco') modUI.cambiarClaseVehiculo();
const trEspuma = modEstado.trampasPista.find((t) => t.tipo === 'espuma');
if (!trEspuma) throw new Error("[4K] Falta trampa 'espuma' en habitacion_acuatica");
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'agua_navegable', sueloFijo: trEspuma.posicion.y, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.fisicaCarro.yaw = 0;
modEstado.fisicaCarro.velocidad = 3.5;
let maxDesvioEspuma = 0;
for (let i = 0; i < 15; i++) {
  modEstado.fisicaCarro.x = trEspuma.posicion.x;
  modEstado.fisicaCarro.y = trEspuma.posicion.y;
  modEstado.fisicaCarro.z = trEspuma.posicion.z;
  modEstado.fisicaCarro.enAire = false;
  modCond.actualizarFisicaConduccion(0.04);
  maxDesvioEspuma = Math.max(maxDesvioEspuma, Math.abs(modEstado.fisicaCarro.yaw));
}
if (maxDesvioEspuma <= 0.01) {
  throw new Error(`[4K] Trampa 'espuma' no perturbó la guiñada (maxDesvio=${maxDesvioEspuma.toFixed(4)})`);
}

// Prueba física de trampa 'barro' (reducción 0.78x y anulación por turbo en habitacion_atico)
modUI.cambiarHabitacion('habitacion_atico');
while (modEstado.estadoCarro.claseVehiculo !== 'moto') modUI.cambiarClaseVehiculo();
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_tierra', sueloFijo: 0.02, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
modEstado.teclasConduccion['KeyW'] = true;
for (let i = 0; i < 120; i++) {
  modEstado.fisicaCarro.x = -15.0;
  modEstado.fisicaCarro.z = 10.0;
  modEstado.fisicaCarro.y = 0.02;
  modEstado.fisicaCarro.enAire = false;
  modCond.actualizarFisicaConduccion(0.05);
}
const velLimpiaTierra = modEstado.fisicaCarro.velocidad;

const trBarro = modEstado.trampasPista.find((t) => t.tipo === 'barro' && Math.abs(t.posicion.y - 0.02) < 0.5)
  || modEstado.trampasPista.find((t) => t.tipo === 'barro');
if (!trBarro) throw new Error("[4K] Falta trampa 'barro' en habitacion_atico");
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_tierra', sueloFijo: trBarro.posicion.y, pendientePorX: 0 };
modCond.reposicionarEnMeta();
modEstado.estadoCarro.modoJuego = 'conduccion';
for (let i = 0; i < 120; i++) {
  modEstado.fisicaCarro.x = trBarro.posicion.x;
  modEstado.fisicaCarro.y = trBarro.posicion.y;
  modEstado.fisicaCarro.z = trBarro.posicion.z;
  modEstado.fisicaCarro.enAire = false;
  modEstado.fisicaCarro.tiempoTurbo = 0;
  modCond.actualizarFisicaConduccion(0.05);
}
const velBarroSinTurbo = modEstado.fisicaCarro.velocidad;
const ratioBarro = velBarroSinTurbo / velLimpiaTierra;
if (Math.abs(ratioBarro - 0.78) > 0.05) {
  throw new Error(`[4K] Trampa 'barro' no redujo velocidad a 0.78x (ratio=${ratioBarro.toFixed(3)}, limpio=${velLimpiaTierra.toFixed(2)}, barro=${velBarroSinTurbo.toFixed(2)})`);
}

for (let i = 0; i < 50; i++) {
  modEstado.fisicaCarro.x = trBarro.posicion.x;
  modEstado.fisicaCarro.y = trBarro.posicion.y;
  modEstado.fisicaCarro.z = trBarro.posicion.z;
  modEstado.fisicaCarro.enAire = false;
  modEstado.fisicaCarro.tiempoTurbo = 1.0;
  modCond.actualizarFisicaConduccion(0.05);
}
const velBarroConTurbo = modEstado.fisicaCarro.velocidad;
modEstado.teclasConduccion['KeyW'] = false;
modEstado.fisicaCarro.tiempoTurbo = 0;
globalThis._mockRayEstado = { esPista: true, pendientePorX: 0 };
if (velBarroConTurbo < velLimpiaTierra * 1.15) {
  throw new Error(`[4K] El turbo debe anular la penalización de 'barro' (conTurbo=${velBarroConTurbo.toFixed(2)}, limpio=${velLimpiaTierra.toFixed(2)})`);
}

console.log('OK: 4 circuitos rediseñados (cotas >= 2.5m, alta densidad de boosters/obstáculos/móviles y trampas aceite/espuma/barro) verificados.');
console.log('OK: Parte 1 + Parte 2 (24 chasis 6x4, 49 piezas con modStats, decoración 4 habitaciones y menú Mario Kart) verificadas.');

// 4L. Verificación Azure Static Web Apps + Configuración de Red + Multi-Instancia de Vehículos (Fase 1 Multijugador)
const swaCfgPath = path.join(root, 'staticwebapp.config.json');
if (!fs.existsSync(swaCfgPath)) {
  throw new Error('[4L] Falta staticwebapp.config.json en la raíz del proyecto');
}
const swaCfg = JSON.parse(fs.readFileSync(swaCfgPath, 'utf8'));
if (!swaCfg.navigationFallback || swaCfg.navigationFallback.rewrite !== '/index.html') {
  throw new Error('[4L] staticwebapp.config.json debe configurar navigationFallback hacia /index.html');
}
if (!swaCfg.mimeTypes || swaCfg.mimeTypes['.js'] !== 'application/javascript') {
  throw new Error('[4L] staticwebapp.config.json debe declarar mimeTypes[".js"] = "application/javascript"');
}
if (!swaCfg.globalHeaders || !swaCfg.globalHeaders['X-Content-Type-Options']) {
  throw new Error('[4L] staticwebapp.config.json debe incluir globalHeaders de seguridad');
}

const modConfig = await import(pathToFileURL(path.join(jsDir, 'config.js')).href);
if (!modConfig.CONFIG_RED || modConfig.CONFIG_RED.tasaEnvioHz !== 20 || modConfig.TASA_ENVIO_HZ !== 20) {
  throw new Error('[4L] js/config.js debe exportar CONFIG_RED con TASA_ENVIO_HZ = 20');
}
if (modConfig.CONFIG_RED.resolverUrlWebSocket('localhost') !== 'ws://localhost:8080' ||
    modConfig.CONFIG_RED.resolverUrlWebSocket('127.0.0.1') !== 'ws://localhost:8080') {
  throw new Error('[4L] CONFIG_RED.resolverUrlWebSocket debe usar ws://localhost:8080 para localhost y 127.0.0.1');
}
const urlProdResuelta = modConfig.CONFIG_RED.resolverUrlWebSocket('taller-3d.azurestaticapps.net');
if (!urlProdResuelta.startsWith('wss://') || urlProdResuelta !== modConfig.URL_WS_PRODUCCION) {
  throw new Error(`[4L] URL WebSocket de producción inválida: ${urlProdResuelta}`);
}

if (!modEstado.estadoRed || modEstado.estadoRed.modo !== 'solo' || modEstado.estadoRed.conectado !== false ||
    modEstado.estadoRed.apodo !== 'Piloto' || modEstado.estadoRed.slotParrilla !== 0) {
  throw new Error('[4L] estadoRed inicial en js/estado.js no coincide con el contrato requerido');
}
if (!(modEstado.jugadoresRemotos instanceof Map)) {
  throw new Error('[4L] jugadoresRemotos debe exportarse como instancia Map');
}

const snapshotLocalAntes = {
  idCarroceria: modEstado.estadoCarro.idCarroceria,
  claseVehiculo: modEstado.estadoCarro.claseVehiculo,
  colorHex: modEstado.estadoCarro.colorHex,
  piezas: { ...modEstado.estadoCarro.piezasEnEnganches },
  hijosGrupoLocal: modEnganches.grupoJuguete.children.length
};

const instCoche = modEnganches.ensamblarGrupoVehiculo({
  clase: 'coche',
  carroceria: 'carroceria_deportivo',
  color: 0x0066ff,
  piezas: {
    rueda_di: 'rueda_deportiva',
    rueda_dd: 'rueda_deportiva',
    rueda_ti: 'rueda_deportiva',
    rueda_td: 'rueda_deportiva',
    acc_techo: 'acc_cohete_techo'
  }
});
const instMoto = modEnganches.ensamblarGrupoVehiculo({
  clase: 'moto',
  carroceria: 'moto_cyber',
  color: 0x00f0ff,
  piezas: { rueda_delantera: 'rueda_moto_neon', rueda_trasera: 'rueda_moto_neon', acc_escape: 'acc_moto_nitro' }
});
const instBarco = modEnganches.ensamblarGrupoVehiculo({
  clase: 'barco',
  carroceria: 'barco_lancha',
  color: 0xffdd00,
  piezas: { propulsor_popa: 'prop_reactor_plasma', timon_popa: 'timon_aleta_tiburon', acc_cubierta: 'acc_barco_hidrocanon' }
});
const instAvion = modEnganches.ensamblarGrupoVehiculo({
  clase: 'avion',
  carroceria: 'avion_jet',
  color: 0x9d00ff,
  piezas: { alas_principales: 'ala_flecha_jet', motor_frontal: 'motor_plasma_ion', cola_timon: 'cola_v_stealth' }
});

if (!instCoche.grupoRaiz || instCoche.pivotesRuedas.length !== 4 || typeof instCoche.alturaPiso !== 'number') {
  throw new Error('[4L] ensamblarGrupoVehiculo(coche) no devolvió estructura multi-instancia válida');
}
if (instMoto.pivotesRuedas.length !== 2) {
  throw new Error(`[4L] ensamblarGrupoVehiculo(moto) debía devolver 2 pivotesRuedas, devolvió ${instMoto.pivotesRuedas.length}`);
}
if (!instBarco.helice || !instBarco.timon || !instAvion.helice || !instAvion.timon) {
  throw new Error('[4L] ensamblarGrupoVehiculo(barco/avion) no expuso referencias helice y timon');
}
if (modEstado.estadoCarro.idCarroceria !== snapshotLocalAntes.idCarroceria ||
    modEstado.estadoCarro.claseVehiculo !== snapshotLocalAntes.claseVehiculo ||
    modEstado.estadoCarro.colorHex !== snapshotLocalAntes.colorHex ||
    modEnganches.grupoJuguete.children.length !== snapshotLocalAntes.hijosGrupoLocal) {
  throw new Error('[4L] ensamblarGrupoVehiculo() mutó el estado o la escena del jugador local');
}

// Prueba de destrucción GPU limpia para vehículos remotos
let disposalsGeo = 0;
let disposalsMat = 0;
const texRemotaTemporal = new MockTexture();
texRemotaTemporal.userData.esClonTemporal = true;
const mallaSensor = new THREE.Mesh(
  { dispose() { disposalsGeo++; } },
  { map: texRemotaTemporal, dispose() { disposalsMat++; } }
);
instCoche.grupoRaiz.add(mallaSensor);
modEsc.escena.add(instCoche.grupoRaiz);
modEstado.jugadoresRemotos.set('remoto_test_1', instCoche);

const eliminado = modEnganches.destruirVehiculoRemoto('remoto_test_1');
if (!eliminado || modEstado.jugadoresRemotos.has('remoto_test_1')) {
  throw new Error('[4L] destruirVehiculoRemoto() no eliminó la entrada de jugadoresRemotos');
}
if (modEsc.escena.children.includes(instCoche.grupoRaiz)) {
  throw new Error('[4L] destruirVehiculoRemoto() no retiró grupoRaiz de escena');
}
if (disposalsGeo < 1 || disposalsMat < 1 || texRemotaTemporal.disposeCount < 1) {
  throw new Error('[4L] destruirVehiculoRemoto() no liberó geometrías/materiales/texturas en GPU con liberarObjeto3D()');
}

console.log('OK: Azure Static Web Apps (staticwebapp.config.json), js/config.js, estadoRed/jugadoresRemotos y ensamblaje multi-instancia GPU-safe verificados.');

// 4M. Verificación Fase 2 Multijugador: Servidor server/ (HTTP + WebSocket de salas) y módulo cliente js/red.js
const serverPkgPath = path.join(root, 'server', 'package.json');
const serverIndexPath = path.join(root, 'server', 'index.js');
const serverDockerPath = path.join(root, 'server', 'Dockerfile');
for (const pReq of [serverPkgPath, serverIndexPath, serverDockerPath]) {
  if (!fs.existsSync(pReq)) {
    throw new Error(`[4M] Falta archivo requerido del servidor: ${pReq}`);
  }
}
const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
if (serverPkg.type !== 'module' || !serverPkg.dependencies?.ws || serverPkg.scripts?.start !== 'node index.js') {
  throw new Error('[4M] server/package.json no cumple el contrato requerido ("type":"module", "ws", "start")');
}
const dockerTxt = fs.readFileSync(serverDockerPath, 'utf8');
if (!dockerTxt.includes('node:20-alpine') || !dockerTxt.includes('EXPOSE 8080') || !dockerTxt.includes('index.js')) {
  throw new Error('[4M] server/Dockerfile incompleto para Azure Container Apps');
}

// Verificar que js/red.js solo importe módulos base permitidos
const depsRed = (depsMap.get('red.js') || []).map((d) => d.target).sort();
const permitidosRed = new Set(['config.js', 'estado.js', 'enganches.js', 'recursos.js']);
if (depsRed.some((t) => !permitidosRed.has(t))) {
  throw new Error(`[4M] js/red.js importa módulos fuera de los permitidos: ${depsRed.join(', ')}`);
}

// Conectar dispatchEvent en mock window para capturar eventos red:*
const eventosRedEmitidos = [];
globalThis.window.dispatchEvent = (ev) => {
  eventosRedEmitidos.push({ type: ev.type, detail: ev.detail });
  const lista = windowListenersAll.get(ev.type) || [];
  lista.forEach((fn) => fn(ev));
  return true;
};

const modRed = await import(pathToFileURL(path.join(jsDir, 'red.js')).href);
for (const fnReq of [
  'obtenerAparienciaLocal',
  'crearSalaOnline',
  'unirseSalaOnline',
  'salirDeSala',
  'enviarApariencia',
  'notificarCambioHabitacion',
  'procesarMensajeRed',
  'actualizarRed'
]) {
  if (typeof modRed[fnReq] !== 'function') {
    throw new Error(`[4M] js/red.js debe exportar la función '${fnReq}'`);
  }
}

// Probar creación/unión, apariencia_actualizada GPU-safe, telemetría, interpolación y salirDeSala()
modRed.procesarMensajeRed({
  tipo: 'sala_unida',
  codigoSala: 'A7K9',
  miId: 'p_local',
  slotParrilla: 1,
  esAnfitrion: false,
  habitacionId: 'habitacion_atico',
  jugadores: [
    {
      id: 'p_local',
      apodo: 'Piloto',
      slotParrilla: 1,
      esAnfitrion: false
    },
    {
      id: 'p_rival_1',
      apodo: 'Rayo',
      slotParrilla: 0,
      esAnfitrion: true,
      enPista: true,
      apariencia: {
        clase: 'moto',
        carroceria: 'moto_superbike',
        color: 0x0066ff,
        piezas: { rueda_delantera: 'rueda_moto_slick', rueda_trasera: 'rueda_moto_slick', acc_escape: 'acc_moto_turbina' }
      }
    }
  ]
});

if (!modEstado.estadoRed.conectado || modEstado.estadoRed.codigoSala !== 'A7K9' || !modEstado.jugadoresRemotos.has('p_rival_1')) {
  throw new Error('[4M] procesarMensajeRed(sala_unida) no inicializó estadoRed y jugadoresRemotos');
}
if (!eventosRedEmitidos.some((e) => e.type === 'red:cambiar_habitacion' && e.detail.habitacionId === 'habitacion_atico')) {
  throw new Error('[4M] No se emitió CustomEvent red:cambiar_habitacion al unirse a sala en otra habitación');
}

const rival1 = modEstado.jugadoresRemotos.get('p_rival_1');
const grupoRivalAnterior = rival1.grupoRaiz;
let geoRivalDisposed = 0;
let matRivalDisposed = 0;
grupoRivalAnterior.add(new THREE.Mesh({ dispose() { geoRivalDisposed++; } }, { dispose() { matRivalDisposed++; } }));

modRed.procesarMensajeRed({
  tipo: 'apariencia_actualizada',
  id: 'p_rival_1',
  enPista: true,
  apariencia: {
    clase: 'avion',
    carroceria: 'avion_jet',
    color: 0xffdd00,
    piezas: { alas_principales: 'ala_flecha_jet', motor_frontal: 'motor_reactor_postcombustion', cola_timon: 'cola_doble_deriva' }
  }
});
if (geoRivalDisposed < 1 || matRivalDisposed < 1 || rival1.grupoRaiz === grupoRivalAnterior || !rival1.helice) {
  throw new Error('[4M] apariencia_actualizada no liberó GPU anterior o no reconstruyó nuevo vehículo remoto');
}

modRed.procesarMensajeRed({
  tipo: 'telemetria',
  id: 'p_rival_1',
  x: 12.5,
  y: 2.0,
  z: -8.0,
  yaw: 1.2,
  velocidad: 9.0,
  anguloVolante: 0.25,
  derrapando: true,
  turbo: true,
  vuelta: 2,
  checkpointActual: 3,
  mejorVuelta: 18.42
});
const posAntesInterp = rival1.grupoRaiz.position.x;
modRed.actualizarRed(0.05);
if (Math.abs(rival1.grupoRaiz.position.x - posAntesInterp) < 0.05 || rival1.mejorVuelta !== 18.42) {
  throw new Error('[4M] actualizarRed(dt) no interpoló el vehículo remoto hacia posObjetivo');
}

// Verificar frecuencia de envío 20 Hz (cada 0.05 s) cuando conduce online
modEstado.estadoCarro.modoJuego = 'conduccion';
let paquetesEnviados = 0;
const transportMock = () => { paquetesEnviados++; };
modRed.actualizarRed(0.02, transportMock);
modRed.actualizarRed(0.02, transportMock);
if (paquetesEnviados !== 0) {
  throw new Error(`[4M] Se envió telemetría antes de cumplir el período de 20 Hz (${paquetesEnviados})`);
}
modRed.actualizarRed(0.02, transportMock);
if (paquetesEnviados !== 1) {
  throw new Error(`[4M] No se respetó la cadencia de 20 Hz al acumular >= 0.05 s (${paquetesEnviados})`);
}

// Verificar transferencia de anfitrión y salirDeSala()
modRed.procesarMensajeRed({ tipo: 'jugador_salio', id: 'p_rival_1', nuevoAnfitrionId: 'p_local' });
if (modEstado.jugadoresRemotos.has('p_rival_1') || !modEstado.estadoRed.esAnfitrion) {
  throw new Error('[4M] jugador_salio no eliminó al rival o no transfirió anfitrión');
}

// Añadir otro rival y probar salirDeSala() limpia todo y vuelve a 'solo'
modRed.procesarMensajeRed({
  tipo: 'jugador_entro',
  jugador: { id: 'p_rival_2', apodo: 'Turbo', slotParrilla: 2, esAnfitrion: false }
});
modRed.salirDeSala();
if (modEstado.estadoRed.modo !== 'solo' || modEstado.estadoRed.conectado || modEstado.jugadoresRemotos.size !== 0) {
  throw new Error('[4M] salirDeSala() no limpió jugadoresRemotos ni restableció modo solo');
}

// Verificar que main.js conecta actualizarRed(dt) y probar servidor HTTP/WS real si ws está instalado
const mainSrc = fs.readFileSync(path.join(jsDir, 'main.js'), 'utf8');
if (!mainSrc.includes('actualizarRed(dt)')) {
  throw new Error('[4M] js/main.js debe invocar actualizarRed(dt) en el bucle principal');
}
const { crearServidorSalas } = await import(pathToFileURL(serverIndexPath).href);
const srvObj = crearServidorSalas();
if (typeof srvObj.servidorHttp?.listen !== 'function' || !(srvObj.salas instanceof Map)) {
  throw new Error('[4M] server/index.js no exportó crearServidorSalas() correctamente');
}

// Prueba funcional directa de server/index.js (HTTP health probes + WebSocket salas/slots/anfitrión/telemetría) sin abrir puertos TCP
const { EventEmitter } = await import('node:events');
class MockServerWs extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1;
    this.mensajes = [];
  }
  send(raw) {
    this.mensajes.push(JSON.parse(String(raw)));
  }
  recibir(obj) {
    this.emit('message', Buffer.from(JSON.stringify(obj)));
  }
  cerrar() {
    this.readyState = 3;
    this.emit('close');
  }
}

for (const rutaProbe of ['/', '/health']) {
  let statusRecibido = 0;
  let cuerpoRecibido = '';
  srvObj.servidorHttp.emit(
    'request',
    { method: 'GET', url: rutaProbe },
    {
      writeHead(code) { statusRecibido = code; },
      end(txt) { cuerpoRecibido = String(txt || ''); }
    }
  );
  const body = JSON.parse(cuerpoRecibido);
  if (statusRecibido !== 200 || body.status !== 'ok' || body.salasActivas !== 0) {
    throw new Error(`[4M] Health probe '${rutaProbe}' inválido: status=${statusRecibido}, body=${cuerpoRecibido}`);
  }
}

const wsAnfitrion = new MockServerWs();
const wsRival = new MockServerWs();
srvObj.wss.emit('connection', wsAnfitrion);
srvObj.wss.emit('connection', wsRival);

wsAnfitrion.recibir({
  tipo: 'crear_sala',
  apodo: 'AnfitrionLocal',
  habitacionId: 'habitacion_andy',
  enPista: true,
  apariencia: modRed.obtenerAparienciaLocal()
});
const msgCreada = wsAnfitrion.mensajes.find((m) => m.tipo === 'sala_creada');
if (!msgCreada || !/^[A-Z0-9]{4}$/.test(msgCreada.codigoSala) || msgCreada.slotParrilla !== 0 || !msgCreada.esAnfitrion) {
  throw new Error(`[4M] sala_creada inválida desde server/index.js: ${JSON.stringify(msgCreada)}`);
}
modRed.procesarMensajeRed(msgCreada);

wsRival.recibir({
  tipo: 'unirse_sala',
  codigoSala: msgCreada.codigoSala,
  apodo: 'RivalWS',
  enPista: true,
  apariencia: { clase: 'barco', carroceria: 'barco_lancha', color: 0xffdd00, piezas: {} }
});
const msgUnida = wsRival.mensajes.find((m) => m.tipo === 'sala_unida');
const msgEntroAnfitrion = wsAnfitrion.mensajes.find((m) => m.tipo === 'jugador_entro');
if (!msgUnida || msgUnida.slotParrilla !== 1 || msgUnida.habitacionId !== 'habitacion_andy' || !msgEntroAnfitrion) {
  throw new Error('[4M] unirse_sala en server/index.js no asignó slotParrilla o no difundió jugador_entro');
}
modRed.procesarMensajeRed(msgEntroAnfitrion);
if (modEstado.jugadoresRemotos.size !== 1) {
  throw new Error('[4M] El cliente js/red.js no instanció al rival conectado');
}

// Solo anfitrión puede cambiar habitación
wsRival.recibir({ tipo: 'cambiar_habitacion', habitacionId: 'habitacion_atico' });
if (!wsRival.mensajes.some((m) => m.tipo === 'error' && m.codigo === 'NO_ES_ANFITRION')) {
  throw new Error('[4M] El servidor permitió cambiar habitación a un no-anfitrión');
}
wsAnfitrion.recibir({ tipo: 'cambiar_habitacion', habitacionId: 'habitacion_hangar' });
const msgHab = wsRival.mensajes.find((m) => m.tipo === 'habitacion_cambiada');
if (!msgHab || msgHab.habitacionId !== 'habitacion_hangar') {
  throw new Error('[4M] cambiar_habitacion del anfitrión no se difundió a la sala');
}

wsRival.recibir({ tipo: 'telemetria', x: 14.5, y: 2.2, z: -7.5, yaw: 0.9, velocidad: 7.5, derrapando: true, turbo: true, checkpointActual: 2 });
const msgTele = wsAnfitrion.mensajes.find((m) => m.tipo === 'telemetria');
if (!msgTele || msgTele.x !== 14.5 || msgTele.checkpointActual !== 2) {
  throw new Error('[4M] server/index.js no retransmitió telemetria al anfitrión');
}
modRed.procesarMensajeRed(msgTele);
const [remVivo] = Array.from(modEstado.jugadoresRemotos.values());
if (!remVivo || Math.abs(remVivo.posObjetivo.x - 14.5) > 0.01) {
  throw new Error('[4M] js/red.js no actualizó posObjetivo tras recibir telemetria del servidor');
}

// Desconexión de anfitrión -> transfiere anfitrión al rival y limpia sala al salir ambos
wsAnfitrion.cerrar();
const msgSalioAnf = wsRival.mensajes.find((m) => m.tipo === 'jugador_salio');
if (!msgSalioAnf || msgSalioAnf.nuevoAnfitrionId !== msgUnida.miId) {
  throw new Error('[4M] Al salir el anfitrión, server/index.js no transfirió el rol de anfitrión');
}
wsRival.cerrar();
if (srvObj.salas.size !== 0) {
  throw new Error('[4M] La sala vacía no fue eliminada tras desconectarse todos los jugadores');
}
modRed.salirDeSala();
srvObj.wss.close();
srvObj.servidorHttp.close();

// Probar modo offline tolerante a servidor caído (sin lanzar excepción no capturada)
const resOffline = await modRed.crearSalaOnline('Tester', 'habitacion_andy', 'ws://127.0.0.1:59999');
if (resOffline.ok !== false || modEstado.estadoRed.modo !== 'solo') {
  throw new Error('[4M] crearSalaOnline() ante servidor inalcanzable debe fallar de forma segura manteniendo modo solo');
}

console.log('OK: Fase 2 Multijugador (server HTTP+WebSocket, js/red.js a 20 Hz, eventos red:*, GPU cleanup e integración en main.js) verificada.');

// 4N. Verificación Fases 3 y 4 Multijugador: Lobby DOM, Parrilla Escalonada, Colisiones PvP, Etiquetas 3D y Leaderboard
for (const idRedReq of [
  'panel-multijugador', 'badge-modo-red', 'input-apodo-red', 'vista-red-lobby',
  'btn-crear-sala', 'input-codigo-sala', 'btn-unirse-sala', 'vista-red-activa',
  'codigo-sala-activo', 'rol-sala-activo', 'lista-jugadores-sala', 'btn-salir-sala',
  'aviso-red', 'capa-etiquetas-3d', 'hud-leaderboard', 'lista-leaderboard-hud'
]) {
  if (!indexHtml.includes(`id="${idRedReq}"`)) {
    throw new Error(`[4N] Falta elemento DOM '${idRedReq}' en index.html`);
  }
}
for (const selRed of ['#panel-multijugador', '#capa-etiquetas-3d', '.etiqueta-jugador-3d', '#hud-leaderboard', '.fila-leaderboard-hud']) {
  if (!cssText.includes(selRed)) {
    throw new Error(`[4N] Falta selector CSS '${selRed}' en css/estilos.css`);
  }
}

// Probar parrilla escalonada en dos columnas para slots 0..7 en modo online vs modo solo
modUI.cambiarHabitacion('habitacion_andy');
if (modEstado.estadoCarro.modoJuego === 'conduccion') modUI.alternarModoTallerConduccion();

modEstado.estadoRed.modo = 'solo';
modCond.reposicionarEnMeta();
const xSolo = modEstado.fisicaCarro.x;
const zSolo = modEstado.fisicaCarro.z;
if (Math.abs(xSolo - -1.8) > 1e-4 || Math.abs(zSolo - 26.0) > 1e-4) {
  throw new Error(`[4N] En modo solo reposicionarEnMeta() debe ubicar exactamente en meta (-1.8, 26.0), obtenido (${xSolo}, ${zSolo})`);
}

const posSlots = [];
modEstado.estadoRed.modo = 'online';
modEstado.estadoRed.conectado = true;
for (const slot of [0, 1, 2, 7]) {
  modEstado.estadoRed.slotParrilla = slot;
  if (modEstado.estadoCarro.modoJuego !== 'taller') modUI.alternarModoTallerConduccion();
  modUI.alternarModoTallerConduccion(); // Entrar a conducción debe posicionar en parrilla escalonada
  posSlots.push({ slot, x: modEstado.fisicaCarro.x, z: modEstado.fisicaCarro.z });
}
const [s0, s1, s2, s7] = posSlots;
if (!(s1.x < s0.x && Math.abs(s1.z - s0.z) > 1.5 && s2.x < s1.x && Math.abs(s2.z - s0.z) < 0.05 && s7.x < s2.x)) {
  throw new Error(`[4N] Parrilla escalonada incorrecta: ${JSON.stringify(posSlots)}`);
}

// Probar colisión esférica entre vehículo local y rival en pista ponderada por pesoImpacto
modRed.salirDeSala();
modEstado.estadoRed.modo = 'online';
modEstado.estadoRed.conectado = true;
modEstado.estadoRed.miId = 'p_local_col';
modEstado.estadoCarro.modoJuego = 'conduccion';
globalThis._mockRayEstado = { esPista: true, tipoSuperficie: 'pista_asfalto', pendientePorX: 0, sueloFijo: 0.02 };

const probarChoquePvP = (chasisLocal, chasisRemoto) => {
  modEnganches.construirOActualizarCarroceria(chasisLocal, false);
  modEstado.jugadoresRemotos.clear();
  modRed.procesarMensajeRed({
    tipo: 'jugador_entro',
    jugador: {
      id: 'p_rival_col',
      apodo: 'Titan',
      slotParrilla: 1,
      enPista: true,
      apariencia: { clase: 'coche', carroceria: chasisRemoto, color: 0x0066ff, piezas: {} }
    }
  });
  const rem = modEstado.jugadoresRemotos.get('p_rival_col');
  rem.grupoRaiz.position.set(10.0, 0.02, 10.0);
  rem.posObjetivo.set(10.0, 0.02, 10.0);
  rem.velActual = 0;

  modEstado.fisicaCarro.x = 9.3;
  modEstado.fisicaCarro.y = 0.02;
  modEstado.fisicaCarro.z = 10.0;
  modEstado.fisicaCarro.yaw = 0;
  modEstado.fisicaCarro.anguloMovimiento = 0;
  modEstado.fisicaCarro.velocidad = 7.0;
  modEstado.fisicaCarro.enAire = false;
  modEstado.teclasConduccion['KeyW'] = false;
  modCond.actualizarFisicaConduccion(0.05);
  const distDespues = Math.hypot(modEstado.fisicaCarro.x - 10.0, modEstado.fisicaCarro.z - 10.0);
  return { distDespues, velDespues: modEstado.fisicaCarro.velocidad };
};

const choqueLigeroContraPesado = probarChoquePvP('carroceria_formula', 'carroceria_camioneta'); // 0.80 vs 1.45
const choquePesadoContraLigero = probarChoquePvP('carroceria_camioneta', 'carroceria_formula'); // 1.45 vs 0.80
if (choqueLigeroContraPesado.distDespues < 1.10 || choquePesadoContraLigero.distDespues < 1.10) {
  throw new Error(`[4N] No se aplicó separación posicional en colisión PvP (${choqueLigeroContraPesado.distDespues.toFixed(2)})`);
}
if (choqueLigeroContraPesado.velDespues >= choquePesadoContraLigero.velDespues) {
  throw new Error(`[4N] Transferencia de impulso no respetó pesoImpacto (ligero=${choqueLigeroContraPesado.velDespues.toFixed(2)}, pesado=${choquePesadoContraLigero.velDespues.toFixed(2)})`);
}

// Probar proyección 3D en #capa-etiquetas-3d y ordenamiento de #hud-leaderboard
modEstado.jugadoresRemotos.clear();
modRed.procesarMensajeRed({
  tipo: 'jugador_entro',
  jugador: { id: 'p_top', apodo: 'Ace', slotParrilla: 2, enPista: true, vuelta: 2, checkpointActual: 3, mejorVuelta: 19.2 }
});
modRed.procesarMensajeRed({
  tipo: 'jugador_entro',
  jugador: { id: 'p_cola', apodo: 'Novato', slotParrilla: 3, enPista: true, vuelta: 1, checkpointActual: 4, mejorVuelta: 25.0 }
});
modEstado.estadoCronometro.vuelta = 2;
modEstado.estadoCronometro.checkpointActual = 1;
modEsc.camara.position.set(0, 2, 10);

modUI.actualizarPanelMultijugador();
modUI.actualizarEtiquetasYLeaderboard();

const capaEtiq = globalThis.document.getElementById('capa-etiquetas-3d');
if (capaEtiq.children.length !== 2 || !String(capaEtiq.children[0].style.left).endsWith('px')) {
  throw new Error(`[4N] #capa-etiquetas-3d debe proyectar 2 etiquetas con coordenadas px (tiene ${capaEtiq.children.length})`);
}

const listaLB = globalThis.document.getElementById('lista-leaderboard-hud');
const ordenLB = listaLB.children.map((fila) => fila.children[1].textContent);
if (ordenLB.length !== 3 || !ordenLB[0].includes('Ace') || !ordenLB[1].includes('(Tú)') || !ordenLB[2].includes('Novato')) {
  throw new Error(`[4N] #hud-leaderboard mal ordenado: ${JSON.stringify(ordenLB)}`);
}

// Comprobar que main.js invoca actualizarEtiquetasYLeaderboard() y limpiar red
if (!fs.readFileSync(path.join(jsDir, 'main.js'), 'utf8').includes('actualizarEtiquetasYLeaderboard()')) {
  throw new Error('[4N] js/main.js debe invocar actualizarEtiquetasYLeaderboard()');
}
modRed.salirDeSala();
modUI.actualizarEtiquetasYLeaderboard();
if (capaEtiq.children.length !== 0) {
  throw new Error('[4N] Al salir de sala, #capa-etiquetas-3d debe quedar vacía');
}

console.log('OK: Fases 3 y 4 Multijugador (Lobby, Parrilla escalonada 2 columnas, Colisiones PvP pesoImpacto, Etiquetas 3D y Leaderboard) verificadas.');
console.log('=== VERIFICACIÓN COMPLETA EXITOSA ===');
