import {
  HABITACION_ANCHO,
  HABITACION_LARGO,
  HABITACION_ALTO,
  ALFOMBRA_RADIO,
  CANTIDAD_POLVO,
  CATALOGO_HABITACIONES
} from './constantes.js';
import {
  bancoTexturas,
  liberarObjeto3D,
  crearCajaRedondeada,
  crearTexturaPosterPared,
  crearTexturaLetraCubo,
  crearTexturaPelotaLuxo
} from './recursos.js';
import {
  estadoCarro,
  estadoCronometro,
  mallasSuperficieConducible,
  obstaculosHabitacion,
  plataformasTurbo,
  obstaculosDinamicos,
  obstaculosMoviles,
  trampasPista,
  checkpointsPista
} from './estado.js';

export const lienzo = document.getElementById('lienzo-3d');
export const escena = new THREE.Scene();
escena.background = new THREE.Color(CATALOGO_HABITACIONES.habitacion_andy.ambiente.colorFondo);

export const grupoEscenarioActivo = new THREE.Group();
escena.add(grupoEscenarioActivo);

export const camara = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.25,
  250
);
camara.position.set(2.3, 1.55, 2.6);

export const renderizador = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.outputEncoding = THREE.sRGBEncoding;
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.05;
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;

// Entorno de iluminación suave con RoomEnvironment (A1)
if (typeof THREE.RoomEnvironment === 'function') {
  const pmremGenerator = new THREE.PMREMGenerator(renderizador);
  pmremGenerator.compileEquirectangularShader();
  escena.environment = pmremGenerator.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();
}

// Cámara OrbitControls para Modo Taller (A6)
export const controles = new THREE.OrbitControls(camara, renderizador.domElement);
controles.target.set(0, 0.25, 0);
controles.enableDamping = true;
controles.dampingFactor = 0.07;
controles.minDistance = 1.5;
controles.maxDistance = 8.0;
controles.minPolarAngle = 0.15;
controles.maxPolarAngle = Math.PI / 2 - 0.04;
controles.update();

export let sistemaPolvo = null;

/**
 * Configura las luces de la habitación activa dentro del grupo del escenario.
 * Por qué: adapta intensidad y rango de sombras al tamaño de la habitación (hasta 110 m).
 */
export function crearIluminacion(contenedor = grupoEscenarioActivo, hab = CATALOGO_HABITACIONES.habitacion_andy) {
  const esHangar = hab.id === 'habitacion_hangar';
  const esAcuatica = hab.id === 'habitacion_acuatica';
  const colorSky = esHangar ? 0x60a5fa : esAcuatica ? 0xe0f2fe : 0xfff8eb;
  const colorGround = esHangar ? 0x1e293b : esAcuatica ? 0x7dd3fc : 0xb89f85;
  const intHemi = esHangar ? 0.65 : 0.5;

  const luzHemi = new THREE.HemisphereLight(colorSky, colorGround, intHemi);
  luzHemi.position.set(0, hab.dimensiones.alto, 0);
  contenedor.add(luzHemi);

  const colorSol = esHangar ? 0xbfdbfe : 0xfff1d0;
  const intSol = esHangar ? 1.15 : 1.35;
  const luzSolVentana = new THREE.DirectionalLight(colorSol, intSol);
  luzSolVentana.position.set(-hab.dimensiones.ancho * 0.52, Math.max(7.2, hab.dimensiones.alto * 0.85), -2.0);
  luzSolVentana.castShadow = true;
  luzSolVentana.shadow.mapSize.width = 2048;
  luzSolVentana.shadow.mapSize.height = 2048;
  luzSolVentana.shadow.camera.near = 0.5;
  luzSolVentana.shadow.camera.far = Math.max(135, hab.dimensiones.ancho * 1.65);
  const d = Math.max(52, hab.dimensiones.ancho * 0.6);
  luzSolVentana.shadow.camera.left = -d;
  luzSolVentana.shadow.camera.right = d;
  luzSolVentana.shadow.camera.top = d;
  luzSolVentana.shadow.camera.bottom = -d;
  luzSolVentana.shadow.bias = -0.0005;
  contenedor.add(luzSolVentana);

  const luzLampara = new THREE.PointLight(
    esHangar ? 0x38bdf8 : 0xffb76b,
    esHangar ? 1.4 : 1.1,
    Math.max(24.0, hab.dimensiones.ancho * 0.45),
    1.8
  );
  luzLampara.position.set(hab.dimensiones.ancho * 0.46, 1.85, -hab.dimensiones.largo * 0.46);
  luzLampara.castShadow = true;
  luzLampara.shadow.bias = -0.001;
  contenedor.add(luzLampara);
}

// ============================================================================
// Utilidades compartidas de pistas continuas, checkpoints y obstáculos
// ============================================================================

function crearMaterialClonTextura(texBase, opciones = {}, repX = 1, repY = 1) {
  const tex = texBase.clone();
  tex.needsUpdate = true;
  tex.repeat.set(repX, repY);
  tex.userData = { ...(tex.userData || {}), esClonTemporal: true };
  return new THREE.MeshStandardMaterial({ map: tex, ...opciones });
}

function interpolarSegmentoCatmull(p0, p1, p2, p3, pasos) {
  const salida = [];
  for (let s = 1; s <= pasos; s++) {
    const t = s / pasos;
    const t2 = t * t;
    const t3 = t2 * t;
    const x =
      0.5 *
      (2 * p1[0] +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
    const y = p1[1] + (p2[1] - p1[1]) * t;
    const z =
      0.5 *
      (2 * p1[2] +
        (-p0[2] + p2[2]) * t +
        (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
        (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3);
    salida.push([x, y, z]);
  }
  return salida;
}

function subdividirCurvaSuave(puntos, guiaAntes, guiaDespues, pasosPorTramo = 6) {
  const res = [];
  const n = puntos.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? puntos[i - 1] : guiaAntes || puntos[0];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = i + 2 < n ? puntos[i + 2] : guiaDespues || puntos[n - 1];
    res.push(...interpolarSegmentoCatmull(p0, p1, p2, p3, pasosPorTramo));
  }
  return res;
}

function crearArcoCheckpointEnGrupo(grupoPista, defCP, anchoPorDefecto = 4.0) {
  const grupoCP = new THREE.Group();
  const dirNorm = new THREE.Vector3(defCP.dir[0], 0, defCP.dir[2]).normalize();
  grupoCP.position.set(defCP.x, defCP.y, defCP.z);
  grupoCP.rotation.y = Math.atan2(-dirNorm.z, dirNorm.x);

  const matSoporte = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.35
  });
  const matIndicador = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: 0xff5500,
    emissiveIntensity: 0.8,
    roughness: 0.25,
    transparent: true,
    opacity: 0.88
  });
  const matCampo = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: 0xff5500,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const halfSep = (defCP.ancho || anchoPorDefecto) * 0.5 + 0.38;
  const altoPoste = 1.72;

  [-halfSep, halfSep].forEach((offsetZ) => {
    const base = new THREE.Mesh(crearCajaRedondeada(0.26, 0.24, 0.26, 2, 0.03), matSoporte);
    base.position.set(0, 0.12, offsetZ);
    base.castShadow = true;

    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, altoPoste, 12), matSoporte);
    poste.position.set(0, altoPoste * 0.5 + 0.12, offsetZ);
    poste.castShadow = true;

    const baliza = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), matIndicador);
    baliza.position.set(0, altoPoste + 0.16, offsetZ);

    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 14), matIndicador);
    anillo.position.set(0, 0.85, offsetZ);

    grupoCP.add(base, poste, baliza, anillo);
  });

  const travesano = new THREE.Mesh(
    crearCajaRedondeada(0.18, 0.16, halfSep * 2 + 0.16, 2, 0.04),
    matIndicador
  );
  travesano.position.set(0, altoPoste + 0.14, 0);

  const cortina = new THREE.Mesh(
    new THREE.PlaneGeometry(halfSep * 2 - 0.2, altoPoste),
    matCampo
  );
  cortina.position.set(0, altoPoste * 0.5 + 0.08, 0);
  cortina.rotation.y = Math.PI / 2;

  grupoCP.add(travesano, cortina);

  if (defCP.anilloAereoY) {
    const anilloAereo = new THREE.Mesh(
      new THREE.TorusGeometry(defCP.anilloRadio || 3.8, 0.22, 12, 32),
      matIndicador
    );
    anilloAereo.position.set(0, defCP.anilloAereoY - defCP.y, 0);
    anilloAereo.rotation.y = Math.PI / 2;
    const campoAereo = new THREE.Mesh(
      new THREE.CircleGeometry((defCP.anilloRadio || 3.8) - 0.15, 28),
      matCampo
    );
    campoAereo.position.set(0, defCP.anilloAereoY - defCP.y, 0);
    campoAereo.rotation.y = Math.PI / 2;
    grupoCP.add(anilloAereo, campoAereo);
  }

  grupoPista.add(grupoCP);

  checkpointsPista.push({
    indice: defCP.indice,
    x: defCP.x,
    y: defCP.y,
    z: defCP.z,
    radio: defCP.radio || 3.4,
    radioVertical: defCP.radioVertical || 0.85,
    materialesLuz: [matIndicador, matCampo],
    matIndicador,
    matCampo
  });
}

function crearBoostPadsEnGrupo(grupoPista, defsTurbo) {
  const matTurbo = new THREE.MeshStandardMaterial({
    map: bancoTexturas.texturaTurboPad,
    emissive: 0x00f0ff,
    emissiveMap: bancoTexturas.texturaTurboPad,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const matAnilloAereo = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.25,
    roughness: 0.2,
    metalness: 0.4
  });

  defsTurbo.forEach((pad) => {
    const dirVec = new THREE.Vector3(pad.dir[0], 0, pad.dir[2]).normalize();
    const posVec = new THREE.Vector3(pad.pos[0], pad.pos[1], pad.pos[2]);
    let mallaPad;

    if (pad.esAnilloAereo) {
      mallaPad = new THREE.Mesh(new THREE.TorusGeometry(pad.radioTorus || 3.2, 0.2, 12, 32), matAnilloAereo);
      mallaPad.position.copy(posVec);
      mallaPad.rotation.y = Math.atan2(-dirVec.z, dirVec.x) + Math.PI / 2;
    } else {
      mallaPad = new THREE.Mesh(crearCajaRedondeada(3.0, 0.004, 2.6, 2, 0.002), matTurbo);
      mallaPad.position.copy(posVec);
      mallaPad.rotation.y = Math.atan2(-dirVec.z, dirVec.x);
    }
    grupoPista.add(mallaPad);

    plataformasTurbo.push({
      malla: mallaPad,
      posicion: posVec,
      direccion: dirVec,
      radio: pad.radio || 1.9,
      margenY: pad.margenY || 0.75,
      factorImpulso: pad.factorImpulso || 1.35
    });
  });
}

/**
 * Construye la mega-habitación de 85x85x7.5 m con piso de madera, paredes, gran ventanal,
 * alfombra central y muebles perimetrales en los límites de ±42.0 m.
 */
export function construirHabitacionExpandida(contenedor = grupoEscenarioActivo) {
  const grupoHab = new THREE.Group();
  const mitad = HABITACION_ANCHO / 2; // 42.5 m

  // 1. Piso de madera de 85x85 m
  const matPiso = new THREE.MeshStandardMaterial({
    map: bancoTexturas.maderaDiffuse,
    roughnessMap: bancoTexturas.maderaRoughness,
    bumpMap: bancoTexturas.maderaBump,
    bumpScale: 0.015,
    roughness: 0.78,
    metalness: 0.05
  });
  const mallaPiso = new THREE.Mesh(
    crearCajaRedondeada(HABITACION_ANCHO, 0.12, HABITACION_LARGO, 2, 0.02),
    matPiso
  );
  mallaPiso.position.y = -0.06;
  mallaPiso.receiveShadow = true;
  mallaPiso.userData.esPista = false;
  mallaPiso.userData.tipoSuperficie = 'fuera_pista';
  grupoHab.add(mallaPiso);
  mallasSuperficieConducible.push(mallaPiso);

  // 2. Techo
  const matTecho = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.9 });
  const mallaTecho = new THREE.Mesh(
    crearCajaRedondeada(HABITACION_ANCHO, 0.12, HABITACION_LARGO, 2, 0.02),
    matTecho
  );
  mallaTecho.position.y = HABITACION_ALTO + 0.06;
  grupoHab.add(mallaTecho);

  // 3. Paredes con papel tapiz de nubes y friso blanco
  const matPared = new THREE.MeshStandardMaterial({
    map: bancoTexturas.papelTapiz,
    roughness: 0.85
  });

  const paredNorte = new THREE.Mesh(
    crearCajaRedondeada(HABITACION_ANCHO, HABITACION_ALTO, 0.2, 3, 0.02),
    matPared
  );
  paredNorte.position.set(0, HABITACION_ALTO / 2, -mitad);
  paredNorte.receiveShadow = true;

  const paredSur = new THREE.Mesh(
    crearCajaRedondeada(HABITACION_ANCHO, HABITACION_ALTO, 0.2, 3, 0.02),
    matPared
  );
  paredSur.position.set(0, HABITACION_ALTO / 2, mitad);
  paredSur.receiveShadow = true;

  const paredEste = new THREE.Mesh(
    crearCajaRedondeada(0.2, HABITACION_ALTO, HABITACION_LARGO, 3, 0.02),
    matPared
  );
  paredEste.position.set(mitad, HABITACION_ALTO / 2, 0);
  paredEste.receiveShadow = true;

  grupoHab.add(paredNorte, paredSur, paredEste);

  // Pared Oeste (X = -42.5) con hueco para gran ventanal (Z: -4.5 a +4.5, Y: 1.5 a 5.5)
  const tramosOeste = [
    { alto: 1.5, y: 0.75, largo: HABITACION_LARGO, z: 0 },
    { alto: 2.0, y: 6.5, largo: HABITACION_LARGO, z: 0 },
    { alto: 4.0, y: 3.5, largo: 38.0, z: -23.5 },
    { alto: 4.0, y: 3.5, largo: 38.0, z: 23.5 }
  ];
  tramosOeste.forEach((t) => {
    const m = new THREE.Mesh(crearCajaRedondeada(0.2, t.alto, t.largo, 3, 0.02), matPared);
    m.position.set(-mitad, t.y, t.z);
    m.receiveShadow = true;
    m.castShadow = true;
    grupoHab.add(m);
  });

  // Zócalos / friso blanco de madera más alto (1.15 m) estilo habitación infantil
  const matFrisoBlanco = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  [
    { w: HABITACION_ANCHO, d: 0.24, x: 0, z: -mitad + 0.08, largoX: true },
    { w: HABITACION_ANCHO, d: 0.24, x: 0, z: mitad - 0.08, largoX: true },
    { w: 0.24, d: HABITACION_LARGO, x: mitad - 0.08, z: 0, largoX: false },
    { w: 0.24, d: HABITACION_LARGO, x: -mitad + 0.08, z: 0, largoX: false }
  ].forEach((z) => {
    const zoc = new THREE.Mesh(crearCajaRedondeada(z.w, 1.15, z.d, 3, 0.02), matFrisoBlanco);
    zoc.position.set(z.x, 0.575, z.z);
    zoc.receiveShadow = true;
    const moldura = new THREE.Mesh(
      crearCajaRedondeada(z.largoX ? z.w : 0.30, 0.10, z.largoX ? 0.30 : z.d, 2, 0.015),
      matFrisoBlanco
    );
    moldura.position.set(z.x, 1.16, z.z);
    moldura.castShadow = true;
    grupoHab.add(zoc, moldura);
  });

  // Pósters gigantes y tablero de corcho con marco en paredes Norte, Este y Sur
  const agregarPosterGigante = (tex, colorMarco, ancho, alto, x, y, z, rotY) => {
    const marcoGrupo = new THREE.Group();
    const marco = new THREE.Mesh(
      crearCajaRedondeada(ancho + 0.36, alto + 0.36, 0.12, 3, 0.03),
      new THREE.MeshStandardMaterial({ color: colorMarco, roughness: 0.45 })
    );
    marco.castShadow = true;
    const lienzoPoster = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, 0.04),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
    );
    lienzoPoster.position.z = 0.06;
    marcoGrupo.add(marco, lienzoPoster);
    marcoGrupo.position.set(x, y, z);
    marcoGrupo.rotation.y = rotY;
    grupoHab.add(marcoGrupo);
  };

  agregarPosterGigante(bancoTexturas.posterEspacial || crearTexturaPosterPared('espacial'), 0x16a34a, 7.5, 4.2, -16.0, 4.2, -42.32, 0);
  agregarPosterGigante(bancoTexturas.posterCorcho || crearTexturaPosterPared('corcho'), 0xb45309, 7.0, 4.0, 18.0, 4.2, -42.32, 0);
  agregarPosterGigante(bancoTexturas.posterVaquero || crearTexturaPosterPared('vaquero'), 0x92400e, 7.5, 4.2, 42.32, 4.2, -4.0, -Math.PI / 2);
  agregarPosterGigante(bancoTexturas.posterCarreras || crearTexturaPosterPared('carreras'), 0x1e293b, 8.0, 4.2, 4.0, 4.2, 42.32, Math.PI);

  // 4. Gran Ventanal en la pared Oeste (X = -25.92)
  const matMarco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  [
    { w: 0.26, h: 4.1, d: 0.18, y: 3.5, z: -4.5 },
    { w: 0.26, h: 4.1, d: 0.18, y: 3.5, z: 4.5 },
    { w: 0.32, h: 0.18, d: 9.2, y: 5.5, z: 0 },
    { w: 0.34, h: 0.18, d: 9.28, y: 1.5, z: 0 },
    { w: 0.22, h: 4.0, d: 0.1, y: 3.5, z: 0 },
    { w: 0.22, h: 0.1, d: 9.0, y: 3.5, z: 0 }
  ].forEach((mc) => {
    const m = new THREE.Mesh(crearCajaRedondeada(mc.w, mc.h, mc.d, 3, 0.015), matMarco);
    m.position.set(-mitad + 0.08, mc.y, mc.z);
    m.castShadow = true;
    grupoHab.add(m);
  });

  const cristal = new THREE.Mesh(
    crearCajaRedondeada(0.04, 3.92, 8.92, 2, 0.005),
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.24,
      roughness: 0.05,
      transmission: 0.6
    })
  );
  cristal.position.set(-mitad + 0.06, 3.5, 0);
  grupoHab.add(cristal);

  // 5. Alfombra circular de 3 m de diámetro en el centro (Zona Taller)
  const alfombra = new THREE.Mesh(
    new THREE.CylinderGeometry(ALFOMBRA_RADIO, ALFOMBRA_RADIO, 0.02, 48),
    new THREE.MeshStandardMaterial({ map: bancoTexturas.alfombra, roughness: 0.92 })
  );
  alfombra.position.set(0, 0.01, 0);
  alfombra.receiveShadow = true;
  alfombra.userData.esPista = false;
  alfombra.userData.tipoSuperficie = 'fuera_pista';
  grupoHab.add(alfombra);
  mallasSuperficieConducible.push(alfombra);

  // Anillo luminoso del podio central del Taller
  const aroPodioAndy = new THREE.Mesh(
    new THREE.TorusGeometry(ALFOMBRA_RADIO + 0.08, 0.045, 10, 48),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95, roughness: 0.25 })
  );
  aroPodioAndy.rotation.x = Math.PI / 2;
  aroPodioAndy.position.set(0, 0.03, 0);
  grupoHab.add(aroPodioAndy);

  // 6. Cofre de juguetes gigante junto al muro Norte (X = -28.0, Z = -40.8)
  const grupoCofre = new THREE.Group();
  const baseCofre = new THREE.Mesh(
    crearCajaRedondeada(2.4, 0.95, 1.25, 4, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.6 })
  );
  baseCofre.position.y = 0.475;
  baseCofre.castShadow = true;
  baseCofre.receiveShadow = true;
  const tapaCofre = new THREE.Mesh(
    crearCajaRedondeada(2.5, 0.2, 1.34, 4, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.5 })
  );
  tapaCofre.position.y = 1.04;
  tapaCofre.castShadow = true;
  grupoCofre.add(baseCofre, tapaCofre);
  grupoCofre.position.set(-28.0, 0, -40.8);
  grupoHab.add(grupoCofre);
  obstaculosHabitacion.push({ x: -28.0, z: -40.8, radio: 1.35 });

  // 7. Estante con 3 libros de colores en la pared Norte (X = 4.0, Y = 3.4, Z = -42.1)
  const grupoEstante = new THREE.Group();
  const tablaEstante = new THREE.Mesh(
    crearCajaRedondeada(2.8, 0.12, 0.56, 3, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xf4f1de, roughness: 0.5 })
  );
  tablaEstante.castShadow = true;
  grupoEstante.add(tablaEstante);

  [0xff1e27, 0x0066ff, 0x00f566].forEach((col, idx) => {
    const libro = new THREE.Mesh(
      crearCajaRedondeada(0.16, 0.52 - idx * 0.04, 0.36, 3, 0.02),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 })
    );
    libro.position.set(-0.75 + idx * 0.22, 0.30, 0);
    libro.castShadow = true;
    grupoEstante.add(libro);
  });
  grupoEstante.position.set(4.0, 3.4, -42.1);
  grupoHab.add(grupoEstante);

  // 8. Mesita y lámpara de mesa en la esquina Noreste (X = 39.5, Z = -39.5)
  const grupoLampara = new THREE.Group();
  const matMesa = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.65 });
  const tableroMesa = new THREE.Mesh(crearCajaRedondeada(1.5, 0.12, 1.5, 4, 0.03), matMesa);
  tableroMesa.position.y = 1.05;
  tableroMesa.castShadow = true;
  tableroMesa.receiveShadow = true;
  grupoLampara.add(tableroMesa);

  [[-0.58, -0.58], [0.58, -0.58], [-0.58, 0.58], [0.58, 0.58]].forEach(([px, pz]) => {
    const pata = new THREE.Mesh(crearCajaRedondeada(0.14, 1.02, 0.14, 3, 0.02), matMesa);
    pata.position.set(px, 0.51, pz);
    pata.castShadow = true;
    grupoLampara.add(pata);
  });

  const baseLamp = new THREE.Mesh(
    crearCajaRedondeada(0.36, 0.09, 0.36, 3, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0066ff, roughness: 0.3 })
  );
  baseLamp.position.y = 1.15;
  const posteLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.56, 16),
    new THREE.MeshStandardMaterial({ color: 0xe9c46a, metalness: 0.6, roughness: 0.3 })
  );
  posteLamp.position.y = 1.46;
  const pantallaLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.42, 0.44, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffae33,
      emissiveIntensity: 0.55,
      side: THREE.DoubleSide,
      roughness: 0.7
    })
  );
  pantallaLamp.position.y = 1.82;
  grupoLampara.add(baseLamp, posteLamp, pantallaLamp);
  grupoLampara.position.set(39.5, 0, -39.5);
  grupoHab.add(grupoLampara);
  obstaculosHabitacion.push({ x: 39.5, z: -39.5, radio: 1.05 });

  // 9. Puerta blanca gigante cerrada con pomo dorado en la pared Oeste (X = -42.28, Z = 22.0)
  const grupoPuerta = new THREE.Group();
  const matPuertaBlanca = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const matPanelPuerta = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });
  const matPomoDorado = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.88, roughness: 0.18 });
  const marcoPuerta = new THREE.Mesh(crearCajaRedondeada(0.22, 6.4, 3.76, 3, 0.03), matPuertaBlanca);
  marcoPuerta.position.y = 3.2;
  const hojaPuerta = new THREE.Mesh(crearCajaRedondeada(0.26, 6.2, 3.4, 3, 0.025), matPuertaBlanca);
  hojaPuerta.position.set(0.04, 3.1, 0);
  hojaPuerta.castShadow = true;
  grupoPuerta.add(marcoPuerta, hojaPuerta);

  [1.7, 4.5].forEach((py) => {
    [-0.78, 0.78].forEach((pz) => {
      const panel = new THREE.Mesh(crearCajaRedondeada(0.06, 2.1, 1.15, 2, 0.02), matPanelPuerta);
      panel.position.set(0.17, py, pz);
      grupoPuerta.add(panel);
    });
  });
  const basePomo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 16), matPomoDorado);
  basePomo.rotation.z = Math.PI / 2;
  basePomo.position.set(0.22, 2.7, 1.32);
  const bolaPomo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), matPomoDorado);
  bolaPomo.position.set(0.34, 2.7, 1.32);
  grupoPuerta.add(basePomo, bolaPomo);
  grupoPuerta.position.set(-42.28, 0, 22.0);
  grupoHab.add(grupoPuerta);
  obstaculosHabitacion.push({ x: -42.28, z: 22.0, radio: 1.8 });

  // 10. Cama infantil gigante de madera con colcha azul y estrella amarilla (X = 32.0, Z = 38.0)
  const grupoCama = new THREE.Group();
  const matMaderaCama = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.58 });
  const matColchon = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const matColchaAzul = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.78 });
  const matEstrella = new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.45 });

  const somier = new THREE.Mesh(crearCajaRedondeada(7.6, 0.45, 4.4, 3, 0.05), matMaderaCama);
  somier.position.y = 0.45;
  somier.castShadow = true;
  somier.receiveShadow = true;

  const cabecero = new THREE.Mesh(crearCajaRedondeada(0.32, 2.2, 4.5, 3, 0.05), matMaderaCama);
  cabecero.position.set(3.65, 1.1, 0);
  cabecero.castShadow = true;
  const piecero = new THREE.Mesh(crearCajaRedondeada(0.30, 1.4, 4.5, 3, 0.05), matMaderaCama);
  piecero.position.set(-3.65, 0.7, 0);
  piecero.castShadow = true;

  const colchon = new THREE.Mesh(crearCajaRedondeada(7.0, 0.52, 4.05, 4, 0.08), matColchon);
  colchon.position.y = 0.88;
  colchon.castShadow = true;

  const colcha = new THREE.Mesh(crearCajaRedondeada(5.2, 0.56, 4.18, 4, 0.10), matColchaAzul);
  colcha.position.set(-0.9, 0.90, 0);
  colcha.castShadow = true;
  colcha.receiveShadow = true;

  const almohada = new THREE.Mesh(crearCajaRedondeada(1.25, 0.34, 2.8, 4, 0.12), matColchon);
  almohada.position.set(2.6, 1.24, 0);
  almohada.castShadow = true;

  const formaEstrella = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? 1.15 : 0.48;
    const sx = Math.cos(ang) * rad;
    const sy = Math.sin(ang) * rad;
    if (i === 0) formaEstrella.moveTo(sx, sy);
    else formaEstrella.lineTo(sx, sy);
  }
  formaEstrella.closePath();
  const estrellaColcha = new THREE.Mesh(
    new THREE.ExtrudeGeometry(formaEstrella, { depth: 0.06, bevelEnabled: false }),
    matEstrella
  );
  estrellaColcha.rotation.x = -Math.PI / 2;
  estrellaColcha.position.set(-1.1, 1.18, 0);

  grupoCama.add(somier, cabecero, piecero, colchon, colcha, almohada, estrellaColcha);
  grupoCama.position.set(32.0, 0, 38.0);
  grupoHab.add(grupoCama);
  obstaculosHabitacion.push({ x: 32.0, z: 38.0, radio: 3.8 });

  // 11. Tres cubos gigantes de madera con letras A, B y C apilados junto al muro Oeste
  const crearCuboLetra = (tex, x, y, z, rotY) => {
    const cubo = new THREE.Mesh(
      crearCajaRedondeada(1.8, 1.8, 1.8, 3, 0.05),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.58 })
    );
    cubo.position.set(x, y, z);
    cubo.rotation.y = rotY;
    cubo.castShadow = true;
    cubo.receiveShadow = true;
    grupoHab.add(cubo);
  };
  crearCuboLetra(bancoTexturas.cuboA || crearTexturaLetraCubo('A', '#ff1e27'), -37.5, 0.9, -12.5, 0.25);
  crearCuboLetra(bancoTexturas.cuboB || crearTexturaLetraCubo('B', '#0066ff'), -35.4, 0.9, -11.2, -0.35);
  crearCuboLetra(bancoTexturas.cuboC || crearTexturaLetraCubo('C', '#00a854'), -36.5, 2.7, -11.9, 0.15);
  obstaculosHabitacion.push({ x: -37.5, z: -12.5, radio: 1.25 });
  obstaculosHabitacion.push({ x: -35.4, z: -11.2, radio: 1.25 });

  // 12. Pelota gigante amarilla con franja azul y estrella roja (Luxo Ball) en (-28.0, 1.45, 36.0)
  const pelotaLuxo = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 32, 24),
    new THREE.MeshStandardMaterial({
      map: bancoTexturas.pelotaLuxo || crearTexturaPelotaLuxo(),
      roughness: 0.28,
      metalness: 0.05
    })
  );
  pelotaLuxo.position.set(-28.0, 1.45, 36.0);
  pelotaLuxo.rotation.set(0.38, 0.7, 0.28);
  pelotaLuxo.castShadow = true;
  pelotaLuxo.receiveShadow = true;
  grupoHab.add(pelotaLuxo);
  obstaculosHabitacion.push({ x: -28.0, z: 36.0, radio: 1.5 });

  (contenedor || grupoEscenarioActivo).add(grupoHab);
}

/**
 * Construye una malla continua de barrido (BufferGeometry) reutilizable para cualquier pista.
 */
function crearCintaPistaDesdeNodos(grupoPista, nodos, config) {
  if (!nodos || nodos.length < 2) return;
  const {
    anchoPista = 4.0,
    matSuperficie,
    matBorde,
    matLineaDivisoria,
    matBaranda,
    tipoSuperficie = 'pista_asfalto',
    metaZSkip = 26.0
  } = config;
  const n = nodos.length;

  const secciones = [];
  let distAcum = 0;

  for (let i = 0; i < n; i++) {
    const curr = nodos[i];
    if (i > 0) {
      const prev = nodos[i - 1];
      distAcum += Math.hypot(curr.x - prev.x, curr.z - prev.z);
    }

    let tPrevX = 0;
    let tPrevZ = 0;
    if (i > 0) {
      const dx = curr.x - nodos[i - 1].x;
      const dz = curr.z - nodos[i - 1].z;
      const len = Math.hypot(dx, dz) || 1;
      tPrevX = dx / len;
      tPrevZ = dz / len;
    }

    let tNextX = 0;
    let tNextZ = 0;
    if (i < n - 1) {
      const dx = nodos[i + 1].x - curr.x;
      const dz = nodos[i + 1].z - curr.z;
      const len = Math.hypot(dx, dz) || 1;
      tNextX = dx / len;
      tNextZ = dz / len;
    }

    let tx = i === 0 ? tNextX : i === n - 1 ? tPrevX : tPrevX + tNextX;
    let tz = i === 0 ? tNextZ : i === n - 1 ? tPrevZ : tPrevZ + tNextZ;
    let lenAvg = Math.hypot(tx, tz);
    if (lenAvg < 0.001) {
      tx = tNextX || tPrevX || 1;
      tz = tNextZ || tPrevZ || 0;
      lenAvg = Math.hypot(tx, tz) || 1;
    }
    tx /= lenAvg;
    tz /= lenAvg;

    const rx = -tz;
    const rz = tx;
    let miterScale = 1.0;
    if (i > 0 && i < n - 1) {
      const rSegX = -tNextZ;
      const rSegZ = tNextX;
      const dot = rx * rSegX + rz * rSegZ;
      miterScale = Math.min(1.45, 1 / Math.max(0.68, dot));
    }

    const hw = (curr.ancho || anchoPista) * 0.5;
    const peralte = curr.peralte || 0;
    const sPer = Math.sin(peralte);
    const cPer = Math.cos(peralte);
    const lift = Math.abs(sPer) * hw;

    const xSpan = rx * hw * miterScale * cPer;
    const zSpan = rz * hw * miterScale * cPer;

    const yTopL = curr.y + 0.02 + lift + hw * sPer;
    const yTopR = curr.y + 0.02 + lift - hw * sPer;
    const yTopCenter = (yTopL + yTopR) * 0.5;
    const yBot = curr.y + 0.002;

    const lx = curr.x - xSpan;
    const lz = curr.z - zSpan;
    const rightX = curr.x + xSpan;
    const rightZ = curr.z + zSpan;

    const anchoPiano = curr.anchoPiano || 0.28;
    const pSpanX = rx * anchoPiano * miterScale;
    const pSpanZ = rz * anchoPiano * miterScale;

    secciones.push({
      dist: distAcum,
      tx,
      tz,
      rx: rx * miterScale,
      rz: rz * miterScale,
      cy: curr.y,
      yTopCenter,
      yBot,
      L: [lx, yTopL, lz],
      R: [rightX, yTopR, rightZ],
      Lbot: [lx, yBot, lz],
      Rbot: [rightX, yBot, rightZ],
      CLin: [lx, yTopL + 0.02, lz],
      CLout: [lx - pSpanX, yTopL + 0.02, lz - pSpanZ],
      CLoutBot: [lx - pSpanX, yBot, lz - pSpanZ],
      CRin: [rightX, yTopR + 0.02, rightZ],
      CRout: [rightX + pSpanX, yTopR + 0.02, rightZ + pSpanZ],
      CRoutBot: [rightX + pSpanX, yBot, rightZ + pSpanZ],
      barandas: Boolean(curr.barandas),
      conDivisoria: curr.conDivisoria !== false
    });
  }

  const crearConstructorGeo = () => ({
    pos: [],
    uv: [],
    idx: [],
    vCount: 0,
    conectarQuadContinuo(basePrev, baseCurr) {
      const a = basePrev;
      const b = basePrev + 1;
      const c = baseCurr;
      const d = baseCurr + 1;
      this.idx.push(a, b, c, b, d, c);
    },
    construir() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
      g.setIndex(this.idx);
      g.computeVertexNormals();
      return g;
    }
  });

  const geoAsfaltoTop = crearConstructorGeo();
  const geoAsfaltoLados = crearConstructorGeo();
  const geoPianoTop = crearConstructorGeo();
  const geoPianoLados = crearConstructorGeo();
  const geoLineasDiv = crearConstructorGeo();
  const geoBarandas = crearConstructorGeo();

  let prevTop = null;
  let prevLWall = null;
  let prevRWall = null;
  let prevPLTop = null;
  let prevPRTop = null;
  let prevPLInWall = null;
  let prevPLOutWall = null;
  let prevPRInWall = null;
  let prevPROutWall = null;

  for (let i = 0; i < n; i++) {
    const s = secciones[i];
    const uAsf = s.dist / 2.2;
    const uPno = s.dist / 0.8;

    const curTop = geoAsfaltoTop.pos.length / 3;
    geoAsfaltoTop.pos.push(s.L[0], s.L[1], s.L[2], s.R[0], s.R[1], s.R[2]);
    geoAsfaltoTop.uv.push(uAsf, 0, uAsf, 1);
    geoAsfaltoTop.vCount += 2;
    if (prevTop !== null) geoAsfaltoTop.conectarQuadContinuo(prevTop, curTop);
    prevTop = curTop;

    const curLWall = geoAsfaltoLados.pos.length / 3;
    geoAsfaltoLados.pos.push(s.Lbot[0], s.Lbot[1], s.Lbot[2], s.L[0], s.L[1], s.L[2]);
    geoAsfaltoLados.uv.push(uAsf, 0, uAsf, 0.1);
    geoAsfaltoLados.vCount += 2;
    if (prevLWall !== null) geoAsfaltoLados.conectarQuadContinuo(prevLWall, curLWall);
    prevLWall = curLWall;

    const curRWall = geoAsfaltoLados.pos.length / 3;
    geoAsfaltoLados.pos.push(s.R[0], s.R[1], s.R[2], s.Rbot[0], s.Rbot[1], s.Rbot[2]);
    geoAsfaltoLados.uv.push(uAsf, 0.9, uAsf, 1);
    geoAsfaltoLados.vCount += 2;
    if (prevRWall !== null) geoAsfaltoLados.conectarQuadContinuo(prevRWall, curRWall);
    prevRWall = curRWall;

    const curPLTop = geoPianoTop.pos.length / 3;
    geoPianoTop.pos.push(s.CLout[0], s.CLout[1], s.CLout[2], s.CLin[0], s.CLin[1], s.CLin[2]);
    geoPianoTop.uv.push(uPno, 0, uPno, 1);
    geoPianoTop.vCount += 2;
    if (prevPLTop !== null) geoPianoTop.conectarQuadContinuo(prevPLTop, curPLTop);
    prevPLTop = curPLTop;

    const curPRTop = geoPianoTop.pos.length / 3;
    geoPianoTop.pos.push(s.CRin[0], s.CRin[1], s.CRin[2], s.CRout[0], s.CRout[1], s.CRout[2]);
    geoPianoTop.uv.push(uPno, 0, uPno, 1);
    geoPianoTop.vCount += 2;
    if (prevPRTop !== null) geoPianoTop.conectarQuadContinuo(prevPRTop, curPRTop);
    prevPRTop = curPRTop;

    const curPLInWall = geoPianoLados.pos.length / 3;
    geoPianoLados.pos.push(s.CLin[0], s.CLin[1], s.CLin[2], s.L[0], s.L[1], s.L[2]);
    geoPianoLados.uv.push(uPno, 0, uPno, 1);
    geoPianoLados.vCount += 2;
    if (prevPLInWall !== null) geoPianoLados.conectarQuadContinuo(prevPLInWall, curPLInWall);
    prevPLInWall = curPLInWall;

    const curPLOutWall = geoPianoLados.pos.length / 3;
    geoPianoLados.pos.push(s.CLoutBot[0], s.CLoutBot[1], s.CLoutBot[2], s.CLout[0], s.CLout[1], s.CLout[2]);
    geoPianoLados.uv.push(uPno, 0, uPno, 1);
    geoPianoLados.vCount += 2;
    if (prevPLOutWall !== null) geoPianoLados.conectarQuadContinuo(prevPLOutWall, curPLOutWall);
    prevPLOutWall = curPLOutWall;

    const curPRInWall = geoPianoLados.pos.length / 3;
    geoPianoLados.pos.push(s.R[0], s.R[1], s.R[2], s.CRin[0], s.CRin[1], s.CRin[2]);
    geoPianoLados.uv.push(uPno, 0, uPno, 1);
    geoPianoLados.vCount += 2;
    if (prevPRInWall !== null) geoPianoLados.conectarQuadContinuo(prevPRInWall, curPRInWall);
    prevPRInWall = curPRInWall;

    const curPROutWall = geoPianoLados.pos.length / 3;
    geoPianoLados.pos.push(s.CRout[0], s.CRout[1], s.CRout[2], s.CRoutBot[0], s.CRoutBot[1], s.CRoutBot[2]);
    geoPianoLados.uv.push(uPno, 0, uPno, 1);
    geoPianoLados.vCount += 2;
    if (prevPROutWall !== null) geoPianoLados.conectarQuadContinuo(prevPROutWall, curPROutWall);
    prevPROutWall = curPROutWall;
  }

  for (let i = 0; i < n - 1; i++) {
    const s0 = secciones[i];
    const s1 = secciones[i + 1];
    if (!s0.conDivisoria || !s1.conDivisoria) continue;
    const cx0 = (s0.L[0] + s0.R[0]) * 0.5;
    const cz0 = (s0.L[2] + s0.R[2]) * 0.5;
    if (Math.abs(cz0 - metaZSkip) < 2.2 && cx0 >= -9.0 && cx0 <= 1.5) continue;

    const ciclo = s0.dist % 2.4;
    if (ciclo > 1.25) continue;

    const cx1 = (s1.L[0] + s1.R[0]) * 0.5;
    const cz1 = (s1.L[2] + s1.R[2]) * 0.5;
    const yD0 = s0.yTopCenter + 0.006;
    const yD1 = s1.yTopCenter + 0.006;
    const hwLinea = 0.075;

    const b0 = geoLineasDiv.pos.length / 3;
    geoLineasDiv.pos.push(
      cx0 - s0.rx * hwLinea, yD0, cz0 - s0.rz * hwLinea,
      cx0 + s0.rx * hwLinea, yD0, cz0 + s0.rz * hwLinea,
      cx1 - s1.rx * hwLinea, yD1, cz1 - s1.rz * hwLinea,
      cx1 + s1.rx * hwLinea, yD1, cz1 + s1.rz * hwLinea
    );
    geoLineasDiv.uv.push(0, 0, 0, 1, 1, 0, 1, 1);
    geoLineasDiv.vCount += 4;
    geoLineasDiv.idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2);
  }

  if (matBaranda) {
    for (let i = 0; i < n - 1; i++) {
      const s0 = secciones[i];
      const s1 = secciones[i + 1];
      if (!s0.barandas || !s1.barandas) continue;

      const u0 = s0.dist / 0.9;
      const u1 = s1.dist / 0.9;

      [-1, 1].forEach((lado) => {
        const edge0 = lado < 0 ? s0.L : s0.R;
        const edge1 = lado < 0 ? s1.L : s1.R;
        const dirIn = lado;
        const offIn = 0.06 * dirIn;
        const offOut = 0.22 * dirIn;
        const yBot0 = edge0[1] + 0.02;
        const yBot1 = edge1[1] + 0.02;
        const yTop0 = yBot0 + 0.22;
        const yTop1 = yBot1 + 0.22;

        const p0InX = edge0[0] + s0.rx * offIn;
        const p0InZ = edge0[2] + s0.rz * offIn;
        const p0OutX = edge0[0] + s0.rx * offOut;
        const p0OutZ = edge0[2] + s0.rz * offOut;
        const p1InX = edge1[0] + s1.rx * offIn;
        const p1InZ = edge1[2] + s1.rz * offIn;
        const p1OutX = edge1[0] + s1.rx * offOut;
        const p1OutZ = edge1[2] + s1.rz * offOut;

        const lx0 = lado < 0 ? p0OutX : p0InX;
        const lz0 = lado < 0 ? p0OutZ : p0InZ;
        const rx0 = lado < 0 ? p0InX : p0OutX;
        const rz0 = lado < 0 ? p0InZ : p0OutZ;
        const lx1 = lado < 0 ? p1OutX : p1InX;
        const lz1 = lado < 0 ? p1OutZ : p1InZ;
        const rx1 = lado < 0 ? p1InX : p1OutX;
        const rz1 = lado < 0 ? p1InZ : p1OutZ;

        let base = geoBarandas.pos.length / 3;
        geoBarandas.pos.push(lx0, yTop0, lz0, rx0, yTop0, rz0, lx1, yTop1, lz1, rx1, yTop1, rz1);
        geoBarandas.uv.push(u0, 0, u0, 1, u1, 0, u1, 1);
        geoBarandas.idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        geoBarandas.vCount += 4;

        base = geoBarandas.pos.length / 3;
        geoBarandas.pos.push(lx0, yBot0, lz0, lx0, yTop0, lz0, lx1, yBot1, lz1, lx1, yTop1, lz1);
        geoBarandas.uv.push(u0, 0, u0, 1, u1, 0, u1, 1);
        geoBarandas.idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        geoBarandas.vCount += 4;

        base = geoBarandas.pos.length / 3;
        geoBarandas.pos.push(rx0, yTop0, rz0, rx0, yBot0, rz0, rx1, yTop1, rz1, rx1, yBot1, rz1);
        geoBarandas.uv.push(u0, 0, u0, 1, u1, 0, u1, 1);
        geoBarandas.idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        geoBarandas.vCount += 4;
      });
    }
  }

  const mallaSupTop = new THREE.Mesh(geoAsfaltoTop.construir(), matSuperficie);
  mallaSupTop.receiveShadow = true;
  mallaSupTop.castShadow = true;
  mallaSupTop.userData.esPista = true;
  mallaSupTop.userData.tipoSuperficie = tipoSuperficie;
  grupoPista.add(mallaSupTop);
  mallasSuperficieConducible.push(mallaSupTop);

  const mallaSupLados = new THREE.Mesh(geoAsfaltoLados.construir(), matSuperficie);
  mallaSupLados.receiveShadow = true;
  grupoPista.add(mallaSupLados);

  const mallaBordeTop = new THREE.Mesh(geoPianoTop.construir(), matBorde);
  mallaBordeTop.receiveShadow = true;
  mallaBordeTop.userData.esPista = true;
  mallaBordeTop.userData.tipoSuperficie = tipoSuperficie;
  grupoPista.add(mallaBordeTop);
  mallasSuperficieConducible.push(mallaBordeTop);

  const mallaBordeLados = new THREE.Mesh(geoPianoLados.construir(), matBorde);
  mallaBordeLados.receiveShadow = true;
  grupoPista.add(mallaBordeLados);

  if (geoLineasDiv.pos.length > 0 && matLineaDivisoria) {
    const mallaLineas = new THREE.Mesh(geoLineasDiv.construir(), matLineaDivisoria);
    mallaLineas.receiveShadow = true;
    grupoPista.add(mallaLineas);
  }

  if (geoBarandas.pos.length > 0 && matBaranda) {
    const mallaBarandas = new THREE.Mesh(geoBarandas.construir(), matBaranda);
    mallaBarandas.castShadow = true;
    mallaBarandas.receiveShadow = true;
    grupoPista.add(mallaBarandas);
  }
}

/**
 * Construye el recinto base cerrado (piso, techo y 4 paredes) y base circular de Taller en (0, 0).
 */
function crearRecintoHabitacionBase(grupoHab, hab, opts) {
  const { ancho, largo, alto } = hab.dimensiones;
  const mitadX = ancho / 2;
  const mitadZ = largo / 2;

  const mallaPiso = new THREE.Mesh(
    crearCajaRedondeada(ancho, 0.12, largo, 2, 0.02),
    opts.matPiso
  );
  mallaPiso.position.y = -0.06;
  mallaPiso.receiveShadow = true;
  mallaPiso.userData.esPista = false;
  mallaPiso.userData.tipoSuperficie = 'fuera_pista';
  grupoHab.add(mallaPiso);
  mallasSuperficieConducible.push(mallaPiso);

  const mallaTecho = new THREE.Mesh(
    crearCajaRedondeada(ancho, 0.14, largo, 2, 0.02),
    new THREE.MeshStandardMaterial({ color: opts.colorTecho, roughness: 0.85 })
  );
  mallaTecho.position.y = alto + 0.07;
  grupoHab.add(mallaTecho);

  const matPared = new THREE.MeshStandardMaterial({ color: opts.colorPared, roughness: 0.8 });
  [
    { dim: [ancho, alto, 0.3], pos: [0, alto / 2, -mitadZ - 0.15] },
    { dim: [ancho, alto, 0.3], pos: [0, alto / 2, mitadZ + 0.15] },
    { dim: [0.3, alto, largo], pos: [-mitadX - 0.15, alto / 2, 0] },
    { dim: [0.3, alto, largo], pos: [mitadX + 0.15, alto / 2, 0] }
  ].forEach((p) => {
    const muro = new THREE.Mesh(crearCajaRedondeada(p.dim[0], p.dim[1], p.dim[2], 2, 0.02), matPared);
    muro.position.set(p.pos[0], p.pos[1], p.pos[2]);
    muro.receiveShadow = true;
    grupoHab.add(muro);
  });

  const plataformaTaller = new THREE.Mesh(
    new THREE.CylinderGeometry(hab.taller.radioBase, hab.taller.radioBase, 0.022, 48),
    opts.matTaller
  );
  plataformaTaller.position.set(0, 0.011, 0);
  plataformaTaller.receiveShadow = true;
  plataformaTaller.userData.esPista = false;
  plataformaTaller.userData.tipoSuperficie = 'fuera_pista';
  grupoHab.add(plataformaTaller);
  mallasSuperficieConducible.push(plataformaTaller);

  // Podio iluminado alrededor de la plataforma de Taller
  const colorPodio =
    hab.id === 'habitacion_acuatica'
      ? 0x0ea5e9
      : hab.id === 'habitacion_atico'
      ? 0xf59e0b
      : 0x38bdf8;
  const aroPodio = new THREE.Mesh(
    new THREE.TorusGeometry(hab.taller.radioBase + 0.08, 0.055, 10, 48),
    new THREE.MeshStandardMaterial({
      color: colorPodio,
      emissive: colorPodio,
      emissiveIntensity: 0.95,
      roughness: 0.25
    })
  );
  aroPodio.rotation.x = Math.PI / 2;
  aroPodio.position.set(0, 0.032, 0);
  grupoHab.add(aroPodio);

  // Zócalos perimetrales (alto=0.45, grosor=0.16) y molduras superiores (alto=0.35, grosor=0.20)
  const colorZocalo =
    opts.colorZocalo ||
    (hab.id === 'habitacion_acuatica' ? 0xf8fafc : hab.id === 'habitacion_atico' ? 0x451a03 : 0xfacc15);
  const colorMoldura =
    opts.colorMoldura ||
    (hab.id === 'habitacion_acuatica' ? 0x0284c7 : hab.id === 'habitacion_atico' ? 0x78350f : 0x334155);
  const matZocalo = new THREE.MeshStandardMaterial({ color: colorZocalo, roughness: 0.48 });
  const matMoldura = new THREE.MeshStandardMaterial({ color: colorMoldura, roughness: 0.45 });

  [
    { x: 0, z: -mitadZ + 0.08, largoX: true },
    { x: 0, z: mitadZ - 0.08, largoX: true },
    { x: mitadX - 0.08, z: 0, largoX: false },
    { x: -mitadX + 0.08, z: 0, largoX: false }
  ].forEach((b) => {
    const zoc = new THREE.Mesh(
      crearCajaRedondeada(b.largoX ? ancho : 0.16, 0.45, b.largoX ? 0.16 : largo, 2, 0.02),
      matZocalo
    );
    zoc.position.set(b.x, 0.225, b.z);
    const mol = new THREE.Mesh(
      crearCajaRedondeada(b.largoX ? ancho : 0.20, 0.35, b.largoX ? 0.20 : largo, 2, 0.02),
      matMoldura
    );
    mol.position.set(b.x, alto - 0.175, b.z);
    grupoHab.add(zoc, mol);
  });

  // Puerta temática de gran formato en el muro Oeste (X = -mitadX + 0.12, Z = -14.0)
  const colorMarcoPuerta =
    hab.id === 'habitacion_acuatica' ? 0x0369a1 : hab.id === 'habitacion_atico' ? 0x451a03 : 0x334155;
  const colorHojaPuerta =
    hab.id === 'habitacion_acuatica' ? 0xe0f2fe : hab.id === 'habitacion_atico' ? 0x78350f : 0x0f172a;
  const grupoPuerta = new THREE.Group();
  const marcoP = new THREE.Mesh(
    crearCajaRedondeada(0.24, 5.4, 3.8, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: colorMarcoPuerta, roughness: 0.45 })
  );
  const hojaP = new THREE.Mesh(
    crearCajaRedondeada(0.16, 4.95, 3.2, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: colorHojaPuerta, roughness: 0.5 })
  );
  hojaP.position.set(0.08, -0.1, 0);
  const panelSup = new THREE.Mesh(
    crearCajaRedondeada(0.08, 1.5, 2.2, 2, 0.02),
    new THREE.MeshStandardMaterial({ color: colorPodio, roughness: 0.35, emissive: colorPodio, emissiveIntensity: 0.2 })
  );
  panelSup.position.set(0.16, 1.0, 0);
  const barraPomo = new THREE.Mesh(
    crearCajaRedondeada(0.12, 0.16, 1.4, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 })
  );
  barraPomo.position.set(0.18, -0.45, 0.7);
  const balizaPuerta = new THREE.Mesh(
    crearCajaRedondeada(0.18, 0.28, 1.6, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.0 })
  );
  balizaPuerta.position.set(0.14, 2.95, 0);
  grupoPuerta.add(marcoP, hojaP, panelSup, barraPomo, balizaPuerta);
  grupoPuerta.position.set(-mitadX + 0.12, 2.7, -14.0);
  grupoHab.add(grupoPuerta);

  // 4 Pósters / murales temáticos enmarcados (Norte, Sur, Este y Oeste)
  const listaPosters =
    hab.id === 'habitacion_acuatica'
      ? bancoTexturas.postersAcuaticos || [crearTexturaPosterPared('acuatico_ola'), crearTexturaPosterPared('acuatico_faro'), crearTexturaPosterPared('acuatico_pirata'), crearTexturaPosterPared('acuatico_submarino')]
      : hab.id === 'habitacion_atico'
      ? bancoTexturas.postersAtico || [crearTexturaPosterPared('atico_enduro'), crearTexturaPosterPared('atico_arcade'), crearTexturaPosterPared('atico_comic'), crearTexturaPosterPared('atico_planos')]
      : bancoTexturas.postersHangar || [crearTexturaPosterPared('hangar_radar'), crearTexturaPosterPared('hangar_orbita'), crearTexturaPosterPared('hangar_escuadron'), crearTexturaPosterPared('hangar_telemetria')];

  const coordsPosters = [
    { x: -16.0, y: Math.min(alto * 0.56, 5.2), z: -mitadZ + 0.16, rotY: 0 },
    { x: 16.0, y: Math.min(alto * 0.56, 5.2), z: mitadZ - 0.16, rotY: Math.PI },
    { x: mitadX - 0.16, y: Math.min(alto * 0.56, 5.2), z: 0.0, rotY: -Math.PI / 2 },
    { x: -mitadX + 0.16, y: Math.min(alto * 0.56, 5.2), z: 14.0, rotY: Math.PI / 2 }
  ];
  coordsPosters.forEach((cp, idx) => {
    const texPoster = listaPosters[idx % listaPosters.length];
    if (!texPoster) return;
    const gPoster = new THREE.Group();
    const marco = new THREE.Mesh(
      crearCajaRedondeada(8.6, 5.0, 0.16, 2, 0.04),
      new THREE.MeshStandardMaterial({ color: colorMarcoPuerta, roughness: 0.45 })
    );
    const tela = new THREE.Mesh(
      new THREE.BoxGeometry(8.0, 4.4, 0.06),
      new THREE.MeshStandardMaterial({ map: texPoster, roughness: 0.55 })
    );
    tela.position.z = 0.08;
    gPoster.add(marco, tela);
    gPoster.position.set(cp.x, cp.y, cp.z);
    gPoster.rotation.y = cp.rotY;
    grupoHab.add(gPoster);
  });
}

/**
 * Crea el arco de Meta Grand Prix y vía de enlace desde el taller (0, 0) hasta metaZ.
 */
function crearMetaYEnlaceTallerEnGrupo(grupoPista, metaZ, anchoPista, tipoSuperficie, colorPoste, matEnlace) {
  const enlace = new THREE.Mesh(
    crearCajaRedondeada(2.8, 0.018, Math.max(4, metaZ - 3.3), 2, 0.006),
    matEnlace
  );
  enlace.position.set(0, 0.009, metaZ * 0.5 - 0.25);
  enlace.receiveShadow = true;
  enlace.userData.esPista = true;
  enlace.userData.tipoSuperficie = tipoSuperficie;
  grupoPista.add(enlace);
  mallasSuperficieConducible.push(enlace);

  const matMeta = new THREE.MeshStandardMaterial({
    map: bancoTexturas.meta,
    roughness: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const franja = new THREE.Mesh(
    crearCajaRedondeada(0.95, 0.006, anchoPista - 0.04, 2, 0.002),
    matMeta
  );
  franja.position.set(0.0, 0.024, metaZ);
  franja.receiveShadow = true;
  franja.userData.esPista = true;
  franja.userData.tipoSuperficie = tipoSuperficie;
  grupoPista.add(franja);
  mallasSuperficieConducible.push(franja);

  const matPoste = new THREE.MeshStandardMaterial({ color: colorPoste, roughness: 0.35 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const halfSpan = anchoPista * 0.5 + 0.42;
  [-halfSpan, halfSpan].forEach((offZ) => {
    const base = new THREE.Mesh(crearCajaRedondeada(0.42, 0.30, 0.42, 3, 0.03), matBase);
    base.position.set(0.0, 0.15, metaZ + offZ);
    base.castShadow = true;
    const pilar = new THREE.Mesh(crearCajaRedondeada(0.26, 2.35, 0.26, 3, 0.03), matPoste);
    pilar.position.set(0.0, 1.18, metaZ + offZ);
    pilar.castShadow = true;
    grupoPista.add(base, pilar);
    obstaculosHabitacion.push({ x: 0.0, z: metaZ + offZ, radio: 0.28 });
  });

  const pancarta = new THREE.Mesh(
    crearCajaRedondeada(0.32, 0.65, halfSpan * 2 + 0.4, 3, 0.04),
    new THREE.MeshStandardMaterial({ map: bancoTexturas.meta, roughness: 0.4 })
  );
  pancarta.position.set(0.0, 2.28, metaZ);
  pancarta.castShadow = true;
  grupoPista.add(pancarta);
}

function registrarObstaculoDinamico(grupoPista, malla, x, y, z, radio = 0.34) {
  malla.position.set(x, y, z);
  grupoPista.add(malla);
  obstaculosDinamicos.push({
    malla,
    posInicial: malla.position.clone(),
    rotInicial: malla.rotation.clone(),
    velocidad: new THREE.Vector3(),
    velAngular: new THREE.Vector3(),
    radio,
    derribado: false,
    tiempoReset: 0
  });
}

function crearBarreraMovilTematica(grupoPista, x, y, z, ejeX, ejeZ, fase, color1 = 0xff1e27, color2 = 0xf8fafc) {
  const g = new THREE.Group();
  const mat1 = new THREE.MeshStandardMaterial({ color: color1, roughness: 0.4 });
  const mat2 = new THREE.MeshStandardMaterial({ color: color2, roughness: 0.4 });
  const cil1 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.45, 20), mat1);
  cil1.position.y = 0.225;
  cil1.castShadow = true;
  const cil2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.45, 20), mat2);
  cil2.position.y = 0.675;
  cil2.castShadow = true;
  const tapa = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat1);
  tapa.position.y = 0.90;
  g.add(cil1, cil2, tapa);
  g.position.set(x, y, z);
  grupoPista.add(g);

  obstaculosMoviles.push({
    malla: g,
    posBase: new THREE.Vector3(x, y, z),
    ejeOscilacion: new THREE.Vector3(ejeX, 0, ejeZ).normalize(),
    fase,
    amplitud: 1.45,
    velocidadOscilacion: 2.2,
    radio: 0.48
  });
}

/**
 * Construye una bifurcación elevada, rampa paralela o atajo sin barandas reutilizando la malla continua.
 */
function crearTramoBifurcacionElevada(grupoPista, puntosControl, config) {
  if (!puntosControl || puntosControl.length < 2) return;
  const p0 = puntosControl[0];
  const p1 = puntosControl[1];
  const pn = puntosControl[puntosControl.length - 1];
  const pnPrev = puntosControl[puntosControl.length - 2];
  const guiaAntes = [2 * p0[0] - p1[0], 2 * p0[1] - p1[1], 2 * p0[2] - p1[2]];
  const guiaDespues = [2 * pn[0] - pnPrev[0], 2 * pn[1] - pnPrev[1], 2 * pn[2] - pnPrev[2]];

  const pts = [p0, ...subdividirCurvaSuave(puntosControl, guiaAntes, guiaDespues, config.pasos || 5)];
  const peralteMax = config.peralte || 0;
  const nodosRama = pts.map((p, idx) => ({
    x: p[0],
    y: p[1],
    z: p[2],
    ancho: config.anchoPista || 2.6,
    anchoPiano: config.anchoPiano || 0.22,
    peralte: peralteMax ? peralteMax * Math.sin(((idx + 1) / pts.length) * Math.PI) : 0,
    barandas: Boolean(config.barandas),
    conDivisoria: false
  }));

  crearCintaPistaDesdeNodos(grupoPista, nodosRama, {
    ...config,
    anchoPista: config.anchoPista || 2.6,
    metaZSkip: 999
  });

  if (config.conPilares !== false) {
    const matSoporteRama = new THREE.MeshStandardMaterial({
      color: config.colorPilar || 0x475569,
      roughness: 0.55
    });
    puntosControl.forEach(([px, py, pz]) => {
      if (py >= 0.7) {
        const pilar = new THREE.Mesh(
          crearCajaRedondeada(0.38, py, 0.38, 2, 0.04),
          matSoporteRama
        );
        pilar.position.set(px, py * 0.5, pz);
        pilar.castShadow = true;
        grupoPista.add(pilar);
      }
    });
  }
}

/**
 * Coloca parches de trampa en calzada ('aceite', 'espuma' o 'barro') y los registra en trampasPista.
 */
function crearTrampasEnGrupo(grupoPista, defsTrampas) {
  const mapaTexturasTrampa = {
    aceite: bancoTexturas.trampaAceite,
    espuma: bancoTexturas.trampaEspuma,
    barro: bancoTexturas.trampaBarro
  };
  defsTrampas.forEach((tr) => {
    const radio = tr.radio || 1.85;
    const tipo = tr.tipo || 'aceite';
    const tex = mapaTexturasTrampa[tipo] || bancoTexturas.trampaAceite;
    const matTrampa = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: tipo === 'barro' ? 0.92 : 0.14,
      metalness: tipo === 'aceite' ? 0.35 : 0.05,
      transparent: true,
      opacity: tipo === 'espuma' ? 0.88 : 0.92,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const malla = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.008, 22), matTrampa);
    malla.position.set(tr.pos[0], tr.pos[1] + 0.012, tr.pos[2]);
    malla.receiveShadow = true;
    grupoPista.add(malla);

    trampasPista.push({
      malla,
      posicion: new THREE.Vector3(tr.pos[0], tr.pos[1], tr.pos[2]),
      radio,
      tipo
    });
  });
}

/**
 * Genera un muro derribable de 8 bloques/barriles custodiando la entrada de un atajo interior.
 */
function crearMuroAtajoDerribable(grupoPista, cx, baseY, cz, perpX, perpZ, colores = [0xff1e27, 0xffdd00, 0x00f0ff, 0x22c55e]) {
  const offsets = [-0.72, -0.24, 0.24, 0.72];
  [0.24, 0.68].forEach((offY, filaIdx) => {
    offsets.forEach((lat, idxCol) => {
      const col = colores[(idxCol + filaIdx * 2) % colores.length];
      const bloque = new THREE.Mesh(
        crearCajaRedondeada(0.42, 0.42, 0.42, 2, 0.04),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 })
      );
      bloque.castShadow = true;
      registrarObstaculoDinamico(
        grupoPista,
        bloque,
        cx + perpX * lat,
        baseY + offY,
        cz + perpZ * lat,
        0.34
      );
    });
  });
}

/**
 * Construye el Circuito Grand Prix en "8" Asimétrico ampliado (radio 24-34 m, anchoPista = 4.0 m)
 * con geometría continua sin solapamientos en curvas, alturas escalonadas + polygonOffset,
 * 5 Checkpoints anti-trampas en orden estricto, 6 Boost Pads y obstáculos dinámicos/móviles.
 */
export function construirPistaDeCarreras(contenedor = grupoEscenarioActivo) {
  const grupoPista = new THREE.Group();
  const anchoPista = 4.0;
  checkpointsPista.length = 0;
  plataformasTurbo.length = 0;
  obstaculosDinamicos.length = 0;
  obstaculosMoviles.length = 0;
  trampasPista.length = 0;

  const matAsfaltoContinuo = crearMaterialClonTextura(bancoTexturas.asfalto, { roughness: 0.85, metalness: 0.05 });
  const matPianoContinuo = crearMaterialClonTextura(bancoTexturas.piano, { roughness: 0.6 });
  const matBarandaContinua = crearMaterialClonTextura(bancoTexturas.piano, { roughness: 0.6 });
  const matLineaDivisoria = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const crearCintaPistaContinua = (nodos) =>
    crearCintaPistaDesdeNodos(grupoPista, nodos, {
      anchoPista,
      matSuperficie: matAsfaltoContinuo,
      matBorde: matPianoContinuo,
      matBaranda: matBarandaContinua,
      matLineaDivisoria,
      tipoSuperficie: 'pista_asfalto',
      metaZSkip: 26.0
    });

  // --------------------------------------------------------------------------
  // Polilínea maestra continua multinivel con peraltes (viaducto a Y = 2.65 m)
  // --------------------------------------------------------------------------
  const nodosPista = [];
  const empujarNodo = (pt, opciones = {}) => {
    const ultimo = nodosPista[nodosPista.length - 1];
    if (ultimo && Math.hypot(ultimo.x - pt[0], ultimo.y - pt[1], ultimo.z - pt[2]) < 0.05) {
      return;
    }
    nodosPista.push({
      x: pt[0],
      y: pt[1],
      z: pt[2],
      ancho: opciones.ancho || anchoPista,
      anchoPiano: opciones.anchoPiano || 0.28,
      peralte: opciones.peralte || 0,
      barandas: Boolean(opciones.barandas),
      conDivisoria: opciones.conDivisoria !== false
    });
  };

  // A. Rampa de aterrizaje Norte (X = 12.0 -> 19.5)
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    empujarNodo([12.0 + 7.5 * t, 0.58 * (1 - t), -31.2], {
      ancho: 4.6 - 0.6 * t,
      conDivisoria: false
    });
  }

  // B. Curva Noreste peraltada (19.5, -31.2 -> 24.0, -16.4)
  const ptsNE = subdividirCurvaSuave(
    [
      [19.5, 0, -31.2],
      [27.5, 0, -30.4],
      [31.8, 0, -26.8],
      [32.4, 0, -21.8],
      [29.2, 0, -18.0],
      [24.0, 0, -16.4]
    ],
    [14.0, 0, -31.2],
    [16.0, 0, -12.4],
    6
  );
  ptsNE.forEach((p, idx) => {
    const peralte = -0.14 * Math.sin(((idx + 1) / ptsNE.length) * Math.PI);
    empujarNodo(p, { peralte });
  });

  // C. Diagonal Inferior del "8" pasando bajo el viaducto y túnel de bloques
  const ptsDiagInf = subdividirCurvaSuave(
    [
      [24.0, 0, -16.4],
      [16.4, 0, -12.6],
      [8.8, 0, -8.8],
      [0.0, 0, -4.4],
      [-8.8, 0, 0.0],
      [-15.2, 0, 4.6],
      [-21.6, 0, 9.2]
    ],
    [29.2, 0, -18.0],
    [-26.8, 0, 14.8],
    4
  );
  ptsDiagInf.forEach((p) => empujarNodo(p));

  // D. Curva Suroeste peraltada hacia la Recta Principal Sur
  const ptsSW = subdividirCurvaSuave(
    [
      [-21.6, 0, 9.2],
      [-26.8, 0, 14.8],
      [-28.0, 0, 20.2],
      [-24.8, 0, 24.5],
      [-19.0, 0, 26.0]
    ],
    [-15.2, 0, 4.6],
    [-10.0, 0, 26.0],
    6
  );
  ptsSW.forEach((p, idx) => {
    const peralte = -0.10 * Math.sin(((idx + 1) / ptsSW.length) * Math.PI);
    empujarNodo(p, { peralte });
  });

  // E1. Tramo inicial plano de la Recta Principal Sur (Parrilla y Meta intactas en X=0, Z=26)
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    empujarNodo([-19.0 + 21.0 * t, 0, 26.0]);
  }

  // E2. Ondulación rápida y chicana peraltada en mitad oriental de Recta Sur (X = 2.0 -> 16.0)
  const ptsChicanaSur = subdividirCurvaSuave(
    [
      [2.0, 0, 26.0],
      [6.5, 0.38, 24.6],
      [11.5, 0.48, 27.2],
      [16.0, 0, 26.0]
    ],
    [-4.0, 0, 26.0],
    [22.0, 0, 25.2],
    4
  );
  ptsChicanaSur.forEach((p, idx) => {
    const frac = (idx + 1) / ptsChicanaSur.length;
    empujarNodo(p, { peralte: 0.14 * Math.sin(frac * Math.PI * 2) });
  });

  // F. Curvón Parabólico Sureste (16.0, 26.0 -> 24.8, -2.0) con peralte suave sin hundimiento
  const ptsParabolicaCtrl = [
    [16.0, 0, 26.0],
    [22.0, 0, 25.2],
    [27.5, 0, 22.4],
    [31.5, 0, 17.8],
    [34.0, 0, 12.2],
    [34.0, 0, 6.4],
    [31.5, 0, 1.4],
    [27.5, 0, -1.0],
    [24.8, 0, -2.0]
  ];
  const ptsParab = subdividirCurvaSuave(ptsParabolicaCtrl, [11.5, 0.48, 27.2], [16.5, 2.25, -5.5], 5);
  ptsParab.forEach((p, idx) => {
    const frac = (idx + 1) / ptsParab.length;
    const peralte = frac <= 0.85 ? -0.16 * Math.sin((frac / 0.85) * Math.PI) : 0;
    empujarNodo(p, { peralte });
  });

  // G. Viaducto Diagonal Central elevado hasta Y = 2.65 m con peralte -0.18 rad y barandas
  const tramosPuente = [
    [[24.8, 0, -2.0], [16.5, 2.25, -5.5]],
    [[16.5, 2.25, -5.5], [8.8, 2.65, -8.8]],
    [[8.8, 2.65, -8.8], [1.5, 2.25, -12.0]],
    [[1.5, 2.25, -12.0], [-8.0, 0, -16.0]]
  ];
  const totalPasosPuente = tramosPuente.length * 4;
  let pasoPuenteActual = 0;
  tramosPuente.forEach(([pa, pb]) => {
    for (let s = 1; s <= 4; s++) {
      pasoPuenteActual++;
      const t = s / 4;
      const fracP = pasoPuenteActual / totalPasosPuente;
      empujarNodo(
        [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t],
        {
          barandas: true,
          conDivisoria: true,
          peralte: -0.18 * Math.sin(fracP * Math.PI)
        }
      );
    }
  });

  // H. Recta acceso Noroeste (-8.0 -> -20.0) y Horquilla peraltada elevada a Y = 0.65 m
  for (let s = 1; s <= 4; s++) {
    const t = s / 4;
    empujarNodo([-8.0 - 12.0 * t, 0, -16.0], {
      ancho: 4.0 + 0.5 * t,
      anchoPiano: 0.28 + 0.07 * t
    });
  }

  const pasosHorquilla = 36;
  const cxH = -20.0;
  const czH = -23.2;
  const radH = 7.2;
  for (let i = 1; i <= pasosHorquilla; i++) {
    const frac = i / pasosHorquilla;
    const ang = Math.PI / 2 + frac * Math.PI;
    const elev = 0.65 * Math.sin(frac * Math.PI);
    const per = 0.20 * Math.sin(frac * Math.PI);
    empujarNodo([cxH + Math.cos(ang) * radH, elev, czH + Math.sin(ang) * radH], {
      ancho: 4.5,
      anchoPiano: 0.35,
      peralte: per
    });
  }

  // I. Chicana Rápida en "S" (-20.0, -30.4 -> 4.0, -31.2)
  const ptsChicana = subdividirCurvaSuave(
    [
      [-20.0, 0, -30.4],
      [-15.2, 0, -32.2],
      [-10.0, 0, -31.6],
      [-5.2, 0, -29.6],
      [-0.6, 0, -30.8],
      [4.0, 0, -31.2]
    ],
    [-25.0, 0, -30.4],
    [10.0, 0, -31.2],
    6
  );
  ptsChicana.forEach((p, idx) => {
    const fadeAncho = Math.max(0, 1 - (idx + 1) / 10);
    empujarNodo(p, {
      ancho: 4.0 + 0.5 * fadeAncho,
      anchoPiano: 0.28 + 0.07 * fadeAncho
    });
  });

  // J. Rampa de despegue Norte (4.0 -> 10.0, Y = 0 -> 0.58)
  for (let s = 1; s <= 4; s++) {
    const t = s / 4;
    empujarNodo([4.0 + 6.0 * t, 0.58 * t, -31.2], { conDivisoria: false });
  }

  crearCintaPistaContinua(nodosPista);

  // Bifurcación Ruta Alta sin barandas paralela a Chicana Norte (Y = 1.85 m, con 2 Boost Pads)
  crearTramoBifurcacionElevada(
    grupoPista,
    [
      [-19.5, 0.02, -30.5],
      [-13.5, 1.65, -35.8],
      [-5.0, 1.85, -36.2],
      [2.5, 1.35, -34.2],
      [5.5, 0.02, -31.2]
    ],
    {
      anchoPista: 2.6,
      matSuperficie: matAsfaltoContinuo,
      matBorde: matPianoContinuo,
      tipoSuperficie: 'pista_asfalto',
      barandas: false,
      pasos: 5,
      colorPilar: 0xe9c46a
    }
  );

  // Atajo interior cortando la Horquilla Noroeste (custodiado por muro derribable de 8 bloques)
  crearTramoBifurcacionElevada(
    grupoPista,
    [
      [-11.0, 0.02, -16.0],
      [-14.2, 0.02, -23.2],
      [-11.5, 0.02, -30.4]
    ],
    {
      anchoPista: 2.8,
      matSuperficie: matAsfaltoContinuo,
      matBorde: matPianoContinuo,
      tipoSuperficie: 'pista_asfalto',
      barandas: false,
      conPilares: false,
      pasos: 5
    }
  );
  crearMuroAtajoDerribable(grupoPista, -14.2, 0.02, -23.2, 1, 0);

  // Túnel de Bloques de Juguete sobre la Diagonal Inferior (16.4, 0, -12.6)
  const grupoTunel = new THREE.Group();
  const coloresTunel = [0xff1e27, 0x3b82f6, 0xfacc15, 0x22c55e];
  [-2.65, 2.65].forEach((offZ, idxM) => {
    const muroT = new THREE.Mesh(
      crearCajaRedondeada(4.6, 2.1, 0.55, 2, 0.05),
      new THREE.MeshStandardMaterial({ color: coloresTunel[idxM], roughness: 0.45 })
    );
    muroT.position.set(0, 1.05, offZ);
    muroT.castShadow = true;
    grupoTunel.add(muroT);
  });
  const techoT = new THREE.Mesh(
    crearCajaRedondeada(4.8, 0.48, 5.9, 2, 0.06),
    new THREE.MeshStandardMaterial({ color: coloresTunel[2], roughness: 0.4 })
  );
  techoT.position.set(0, 2.28, 0);
  techoT.castShadow = true;
  grupoTunel.add(techoT);
  grupoTunel.position.set(16.4, 0, -12.6);
  grupoTunel.rotation.y = Math.atan2(-0.447, -0.894);
  grupoPista.add(grupoTunel);

  // Vía de enlace desde alfombra central (0,0) hasta borde interno de Recta Sur
  const matEnlaceTaller = crearMaterialClonTextura(bancoTexturas.piano, { roughness: 0.6 }, 1, 22);
  matEnlaceTaller.polygonOffset = true;
  matEnlaceTaller.polygonOffsetFactor = -1;
  matEnlaceTaller.polygonOffsetUnits = -1;

  const enlaceTaller = new THREE.Mesh(
    crearCajaRedondeada(2.8, 0.018, 22.0, 2, 0.006),
    matEnlaceTaller
  );
  enlaceTaller.position.set(0, 0.009, 12.72);
  enlaceTaller.receiveShadow = true;
  enlaceTaller.userData.esPista = true;
  enlaceTaller.userData.tipoSuperficie = 'pista_asfalto';
  grupoPista.add(enlaceTaller);
  mallasSuperficieConducible.push(enlaceTaller);

  // Parrilla de salida en Y = 0.024 con polygonOffset
  const matCajon = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  [-8.0, -5.4, -2.8].forEach((xPos, idx) => {
    const zOff = idx % 2 === 0 ? -0.9 : 0.9;
    const lineaFrente = new THREE.Mesh(crearCajaRedondeada(0.08, 0.004, 0.84, 1, 0.001), matCajon);
    lineaFrente.position.set(xPos + 0.4, 0.024, 26.0 + zOff);
    const b1 = new THREE.Mesh(crearCajaRedondeada(0.76, 0.004, 0.07, 1, 0.001), matCajon);
    b1.position.set(xPos + 0.05, 0.024, 26.0 + zOff - 0.40);
    const b2 = new THREE.Mesh(crearCajaRedondeada(0.76, 0.004, 0.07, 1, 0.001), matCajon);
    b2.position.set(xPos + 0.05, 0.024, 26.0 + zOff + 0.40);
    grupoPista.add(lineaFrente, b1, b2);
  });

  // Línea y Gran Arco de Meta Grand Prix en X = 0.0, Z = 26.0
  const matFranjaMeta = new THREE.MeshStandardMaterial({
    map: bancoTexturas.meta,
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const franjaMeta = new THREE.Mesh(
    crearCajaRedondeada(0.9, 0.006, anchoPista - 0.04, 2, 0.002),
    matFranjaMeta
  );
  franjaMeta.position.set(0.0, 0.023, 26.0);
  franjaMeta.receiveShadow = true;
  franjaMeta.userData.esPista = true;
  franjaMeta.userData.tipoSuperficie = 'pista_asfalto';
  grupoPista.add(franjaMeta);
  mallasSuperficieConducible.push(franjaMeta);

  const matPosteMeta = new THREE.MeshStandardMaterial({ color: 0xff1e27, roughness: 0.35 });
  const matBasePoste = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  [-2.42, 2.42].forEach((offsetZ) => {
    const base = new THREE.Mesh(crearCajaRedondeada(0.42, 0.30, 0.42, 3, 0.03), matBasePoste);
    base.position.set(0.0, 0.15, 26.0 + offsetZ);
    base.castShadow = true;

    const pilar = new THREE.Mesh(crearCajaRedondeada(0.26, 2.25, 0.26, 3, 0.03), matPosteMeta);
    pilar.position.set(0.0, 1.12, 26.0 + offsetZ);
    pilar.castShadow = true;
    grupoPista.add(base, pilar);
    obstaculosHabitacion.push({ x: 0.0, z: 26.0 + offsetZ, radio: 0.28 });
  });

  const pancartaMeta = new THREE.Mesh(
    crearCajaRedondeada(0.32, 0.62, 5.2, 3, 0.04),
    new THREE.MeshStandardMaterial({ map: bancoTexturas.meta, roughness: 0.4 })
  );
  pancartaMeta.position.set(0.0, 2.18, 26.0);
  pancartaMeta.castShadow = true;
  grupoPista.add(pancartaMeta);

  // Pilares laterales de soporte del viaducto elevado a Y = 2.65 m
  const matPilarPuente = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.55 });
  [
    [15.2, -6.0, 2.35],
    [2.4, -11.6, 2.35]
  ].forEach(([px, pz, altoP]) => {
    const dirPerpX = -0.401;
    const dirPerpZ = 0.916;
    [-2.42, 2.42].forEach((offset) => {
      const cx = px + dirPerpX * offset;
      const cz = pz + dirPerpZ * offset;
      const col = new THREE.Mesh(crearCajaRedondeada(0.36, altoP, 0.36, 3, 0.03), matPilarPuente);
      col.position.set(cx, altoP * 0.5, cz);
      col.castShadow = true;
      grupoPista.add(col);
      obstaculosHabitacion.push({ x: cx, z: cz, radio: 0.28 });
    });
    const viga = new THREE.Mesh(crearCajaRedondeada(0.38, 0.24, 5.1, 3, 0.02), matPilarPuente);
    viga.position.set(px, altoP - 0.14, pz);
    viga.rotation.y = Math.atan2(dirPerpX, dirPerpZ);
    grupoPista.add(viga);
  });

  // Colchoneta y soportes del Salto Acrobático Norte
  const colchonetaSalto = new THREE.Mesh(
    crearCajaRedondeada(1.88, 0.04, 4.0, 3, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.65 })
  );
  colchonetaSalto.position.set(11.0, 0.02, -31.2);
  colchonetaSalto.receiveShadow = true;
  colchonetaSalto.userData.esPista = true;
  colchonetaSalto.userData.tipoSuperficie = 'pista_asfalto';
  grupoPista.add(colchonetaSalto);
  mallasSuperficieConducible.push(colchonetaSalto);

  const soporteDespegue = new THREE.Mesh(crearCajaRedondeada(0.36, 0.54, 3.9, 3, 0.03), matPilarPuente);
  soporteDespegue.position.set(9.82, 0.27, -31.2);
  soporteDespegue.castShadow = true;
  const soporteAterrizaje = new THREE.Mesh(crearCajaRedondeada(0.36, 0.54, 4.5, 3, 0.03), matPilarPuente);
  soporteAterrizaje.position.set(12.22, 0.27, -31.2);
  soporteAterrizaje.castShadow = true;
  grupoPista.add(soporteDespegue, soporteAterrizaje);

  // 5 Checkpoints Anti-Trampas alineados exactamente al trazado remodelado
  [
    { indice: 0, x: 24.8, y: 0.02, z: -2.0, dir: [-0.923, 0, -0.385], ancho: 4.0, radio: 3.4 },
    { indice: 1, x: 8.8, y: 2.65, z: -8.8, dir: [-0.916, 0, -0.401], ancho: 4.0, radio: 3.4 },
    { indice: 2, x: -27.2, y: 0.65, z: -23.2, dir: [0, 0, -1], ancho: 4.5, radio: 3.6 },
    { indice: 3, x: 19.5, y: 0.02, z: -31.2, dir: [1, 0, 0], ancho: 4.0, radio: 3.5 },
    { indice: 4, x: -15.2, y: 0.02, z: 4.6, dir: [-0.81, 0, 0.58], ancho: 4.0, radio: 3.5 }
  ].forEach((defCP) => crearArcoCheckpointEnGrupo(grupoPista, defCP, anchoPista));

  // 16 Plataformas Aceleradoras (Boost Pads) incluyendo ápices, subidas y 2 en la cima de Ruta Alta
  crearBoostPadsEnGrupo(grupoPista, [
    { pos: [-12.0, 0.024, 26.0], dir: [1, 0, 0] },
    { pos: [4.5, 0.22, 25.2], dir: [0.95, 0, -0.3] },
    { pos: [14.5, 0.06, 26.2], dir: [0.95, 0, -0.25] },
    { pos: [31.5, 0.024, 17.8], dir: [0.55, 0, -0.83] },
    { pos: [34.0, 0.024, 6.4], dir: [-0.3, 0, -0.95] },
    { pos: [26.0, 0.024, -1.55], dir: [-0.92, 0, -0.39] },
    { pos: [16.5, 2.27, -5.5], dir: [-0.92, 0, -0.39] },
    { pos: [1.5, 2.27, -12.0], dir: [-0.92, 0, -0.39] },
    { pos: [-14.0, 0.024, -16.0], dir: [-1, 0, 0] },
    { pos: [-25.5, 0.45, -18.5], dir: [-0.55, 0, -0.83] },
    { pos: [-19.0, 0.024, -30.6], dir: [0.89, 0, -0.45] },
    { pos: [3.5, 0.024, -31.2], dir: [1, 0, 0] },
    { pos: [29.2, 0.024, -18.0], dir: [-0.85, 0, 0.52] },
    { pos: [-5.2, 0.024, -1.8], dir: [-0.85, 0, 0.53] },
    // 2 Boost Pads seguidos en la cima de la Ruta Alta
    { pos: [-11.5, 1.72, -35.9], dir: [1, 0, 0] },
    { pos: [-4.5, 1.87, -36.2], dir: [1, 0, 0] }
  ]);

  // 16+ Obstáculos Dinámicos (Conos + Pilas de bloques + Muro de atajo de 8 bloques = 24 total)
  const crearCono = (x, y, z) => {
    const gCono = new THREE.Group();
    const matNaranja = new THREE.MeshStandardMaterial({ color: 0xff5e00, roughness: 0.45 });
    const matBlanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const base = new THREE.Mesh(crearCajaRedondeada(0.46, 0.06, 0.46, 2, 0.015), matNaranja);
    base.position.y = 0.03;
    const cuerpo = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 16), matNaranja);
    cuerpo.position.y = 0.30;
    const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.138, 0.12, 16), matBlanco);
    franja.position.y = 0.32;
    gCono.add(base, cuerpo, franja);
    registrarObstaculoDinamico(grupoPista, gCono, x, y, z, 0.34);
  };
  [
    [-14.8, 0.02, -31.4],
    [-9.8, 0.02, -33.2],
    [-5.0, 0.02, -29.8],
    [22.8, 0.02, -1.0],
    [21.8, 0.02, -3.5],
    [-6.5, 0.02, -14.8],
    [5.8, 0.35, 23.6],
    [10.8, 0.45, 28.1],
    [29.8, 0.02, 18.8],
    [32.4, 0.02, -23.0]
  ].forEach(([cx, cy, cz]) => crearCono(cx, cy, cz));

  const coloresCubos = [0xff1e27, 0xffdd00, 0x00f566, 0x0066ff, 0x9d00ff, 0x00f0ff];
  [
    [22.5, 0.22, -31.6],
    [22.5, 0.22, -31.2],
    [22.5, 0.22, -30.8],
    [22.5, 0.62, -31.4],
    [22.5, 0.62, -31.0],
    [22.5, 1.02, -31.2]
  ].forEach(([bx, by, bz], idx) => {
    const cubo = new THREE.Mesh(
      crearCajaRedondeada(0.38, 0.38, 0.38, 3, 0.04),
      new THREE.MeshStandardMaterial({ color: coloresCubos[idx % coloresCubos.length], roughness: 0.5 })
    );
    cubo.castShadow = true;
    registrarObstaculoDinamico(grupoPista, cubo, bx, by, bz, 0.34);
  });

  // 10 Barreras Móviles (pares sincronizados en contrafase 0 y Math.PI)
  [
    [-15.5, 0.02, 26.0, 0, 1, 0.0],
    [-11.0, 0.02, 26.0, 0, 1, Math.PI],
    [8.5, 0.36, 25.5, 0, 1, 0.4],
    [33.5, 0.02, 11.5, 1, 0, 0.0],
    [31.0, 0.02, 1.8, 1, 0, Math.PI],
    [12.5, 2.45, -7.2, 0.4, 0.9, 0.5],
    [-25.8, 0.45, -28.0, 0.7, 0.7, 0.0],
    [-12.5, 0.02, -31.6, 0, 1, Math.PI],
    [26.0, 0.02, -28.0, 0.6, 0.8, 1.2],
    [0.8, 0.02, -4.8, 0.45, 0.89, 2.1]
  ].forEach(([bx, by, bz, ex, ez, fase]) =>
    crearBarreraMovilTematica(grupoPista, bx, by, bz, ex, ez, fase, 0xff1e27, 0xf8fafc)
  );

  // 6 Trampas de calzada ('aceite') fuera de los boost pads principales
  crearTrampasEnGrupo(grupoPista, [
    { pos: [-5.5, 0.02, 26.0], radio: 1.75, tipo: 'aceite' },
    { pos: [28.0, 0.02, 22.0], radio: 1.85, tipo: 'aceite' },
    { pos: [-8.0, 0.02, -16.0], radio: 1.8, tipo: 'aceite' },
    { pos: [-22.5, 0.22, -30.2], radio: 1.8, tipo: 'aceite' },
    { pos: [26.8, 0.02, -18.2], radio: 1.85, tipo: 'aceite' },
    { pos: [-4.0, 0.02, -2.5], radio: 1.75, tipo: 'aceite' }
  ]);

  (contenedor || grupoEscenarioActivo).add(grupoPista);
}

/**
 * Construye un circuito cerrado suave y devuelve sus nodos listos para crearCintaPistaDesdeNodos.
 */
function generarNodosCircuitoCerrado(tramosCtrl, anchoDefecto, opcionesPorTramo = null) {
  const nodos = [];
  const empujar = (pt, opc = {}) => {
    const u = nodos[nodos.length - 1];
    if (u && Math.hypot(u.x - pt[0], u.y - pt[1], u.z - pt[2]) < 0.05) return;
    nodos.push({
      x: pt[0],
      y: pt[1],
      z: pt[2],
      ancho: opc.ancho || anchoDefecto,
      anchoPiano: opc.anchoPiano || 0.28,
      peralte: opc.peralte || 0,
      barandas: Boolean(opc.barandas),
      conDivisoria: opc.conDivisoria !== false
    });
  };

  tramosCtrl.forEach((tramo, idxTramo) => {
    const ptsSub = subdividirCurvaSuave(tramo.puntos, tramo.guiaAntes, tramo.guiaDespues, tramo.pasos || 5);
    ptsSub.forEach((p, idxP) => {
      const opc = typeof opcionesPorTramo === 'function' ? opcionesPorTramo(tramo, idxTramo, idxP, ptsSub.length, p) : {};
      empujar(p, opc);
    });
  });
  return nodos;
}

/**
 * Escenario 2: Bahía Acuática (Splash GP) de 90x90x9 m con canales de agua navegable,
 * acueducto, hidro-salto, barco pirata, faro, pato gigante, boyas y compuertas.
 */
export function construirEscenarioAcuatico(contenedor = grupoEscenarioActivo) {
  const hab = CATALOGO_HABITACIONES.habitacion_acuatica;
  const grupoEsc = new THREE.Group();
  const anchoPista = 4.6;

  const matAzulejo = crearMaterialClonTextura(bancoTexturas.azulejo, { roughness: 0.35, metalness: 0.05 }, 1, 1);
  const matMuelle = new THREE.MeshStandardMaterial({ map: bancoTexturas.maderaDiffuse, roughness: 0.72 });
  crearRecintoHabitacionBase(grupoEsc, hab, {
    matPiso: matAzulejo,
    colorTecho: 0xe0f2fe,
    colorPared: 0x7dd3fc,
    matTaller: matMuelle
  });

  // Decoración marítima perimetral con colisionadores
  // 1. Faro rojiblanco en Noroeste (-37, -37)
  const grupoFaro = new THREE.Group();
  [0, 1, 2, 3].forEach((k) => {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15 - k * 0.14, 1.3 - k * 0.14, 1.35, 20),
      new THREE.MeshStandardMaterial({ color: k % 2 === 0 ? 0xff1e27 : 0xf8fafc, roughness: 0.45 })
    );
    seg.position.y = 0.68 + k * 1.35;
    seg.castShadow = true;
    grupoFaro.add(seg);
  });
  const linterna = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.4 })
  );
  linterna.position.y = 6.1;
  grupoFaro.add(linterna);
  grupoFaro.position.set(-37.5, 0, -37.5);
  grupoEsc.add(grupoFaro);
  obstaculosHabitacion.push({ x: -37.5, z: -37.5, radio: 1.7 });

  // 2. Barco pirata gigante de juguete en Sureste (38, 34)
  const grupoPirata = new THREE.Group();
  const cascoPirata = new THREE.Mesh(
    crearCajaRedondeada(5.2, 1.8, 2.4, 4, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  cascoPirata.position.y = 0.9;
  cascoPirata.castShadow = true;
  const mastil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 4.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 })
  );
  mastil.position.y = 3.2;
  const vela = new THREE.Mesh(
    crearCajaRedondeada(0.12, 2.2, 2.6, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
  );
  vela.position.set(0.35, 3.4, 0);
  grupoPirata.add(cascoPirata, mastil, vela);
  grupoPirata.position.set(37.0, 0, 35.5);
  grupoPirata.rotation.y = -0.5;
  grupoEsc.add(grupoPirata);
  obstaculosHabitacion.push({ x: 37.0, z: 35.5, radio: 2.8 });

  // 3. Pato de hule gigante en Suroeste (-37, 36)
  const grupoPato = new THREE.Group();
  const matAmarillo = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.32 });
  const cuerpoPato = new THREE.Mesh(new THREE.SphereGeometry(1.65, 20, 16), matAmarillo);
  cuerpoPato.position.y = 1.25;
  cuerpoPato.scale.set(1.25, 0.9, 1.0);
  cuerpoPato.castShadow = true;
  const cabezaPato = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), matAmarillo);
  cabezaPato.position.set(1.1, 2.55, 0);
  const pico = new THREE.Mesh(
    crearCajaRedondeada(0.65, 0.25, 0.55, 2, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
  );
  pico.position.set(1.95, 2.4, 0);
  grupoPato.add(cuerpoPato, cabezaPato, pico);
  grupoPato.position.set(-36.5, 0, 36.0);
  grupoEsc.add(grupoPato);
  obstaculosHabitacion.push({ x: -36.5, z: 36.0, radio: 2.1 });

  // 4. 6 Ojos de buey gigantes iluminados en los muros de la Bahía Acuática
  const matBronceBuey = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.78, roughness: 0.3 });
  const matCristalBuey = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.95, roughness: 0.15 });
  [
    { x: 0, z: -44.8, rotY: 0 },
    { x: 22, z: -44.8, rotY: 0 },
    { x: -20, z: 44.8, rotY: Math.PI },
    { x: 0, z: 44.8, rotY: Math.PI },
    { x: 44.8, z: -24, rotY: -Math.PI / 2 },
    { x: 44.8, z: 24, rotY: -Math.PI / 2 }
  ].forEach((b) => {
    const ojo = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.22, 12, 28), matBronceBuey);
    const cristalBuey = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.16, 24), matCristalBuey);
    cristalBuey.rotation.x = Math.PI / 2;
    ojo.add(aro, cristalBuey);
    ojo.position.set(b.x, 5.6, b.z);
    ojo.rotation.y = b.rotY;
    grupoEsc.add(ojo);
  });

  // 5. Tobogán acuático en espiral (NE: 36.5, -34.0)
  const grupoTobogan = new THREE.Group();
  const torreTobogan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 5.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  torreTobogan.position.y = 2.9;
  torreTobogan.castShadow = true;
  grupoTobogan.add(torreTobogan);
  const coloresTobogan = [0xff1e27, 0xffdd00, 0x22c55e, 0x0ea5e9, 0xa855f7];
  for (let s = 0; s < 14; s++) {
    const ang = s * 0.45;
    const tramo = new THREE.Mesh(
      crearCajaRedondeada(1.3, 0.22, 1.05, 2, 0.06),
      new THREE.MeshStandardMaterial({ color: coloresTobogan[s % coloresTobogan.length], roughness: 0.3 })
    );
    tramo.position.set(Math.cos(ang) * 1.45, 5.2 - s * 0.34, Math.sin(ang) * 1.45);
    tramo.rotation.y = -ang;
    tramo.castShadow = true;
    grupoTobogan.add(tramo);
  }
  const piscinaTobogan = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.9, 0.35, 24),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.35, roughness: 0.2 })
  );
  piscinaTobogan.position.y = 0.18;
  grupoTobogan.add(piscinaTobogan);
  grupoTobogan.position.set(36.5, 0, -34.0);
  grupoEsc.add(grupoTobogan);
  obstaculosHabitacion.push({ x: 36.5, z: -34.0, radio: 3.2 });

  // 6. Trampolín de piscina elevado con escalera (-38.0, 14.0)
  const grupoTrampolin = new THREE.Group();
  const baseTramp = new THREE.Mesh(
    crearCajaRedondeada(1.8, 2.2, 1.2, 2, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.45 })
  );
  baseTramp.position.set(-0.6, 1.1, 0);
  const tablaTramp = new THREE.Mesh(
    crearCajaRedondeada(3.4, 0.14, 1.05, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  tablaTramp.position.set(0.6, 2.25, 0);
  tablaTramp.castShadow = true;
  const pasamanos = new THREE.Mesh(
    crearCajaRedondeada(1.5, 0.75, 0.08, 2, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 })
  );
  pasamanos.position.set(-0.4, 2.65, 0.45);
  grupoTrampolin.add(baseTramp, tablaTramp, pasamanos);
  grupoTrampolin.position.set(-38.0, 0, 14.0);
  grupoEsc.add(grupoTrampolin);
  obstaculosHabitacion.push({ x: -38.0, z: 14.0, radio: 2.4 });

  // 7. Castillo de arena gigante con 4 torres y almenas (12.0, -39.0)
  const grupoCastillo = new THREE.Group();
  const matArena = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.88 });
  const muralla = new THREE.Mesh(crearCajaRedondeada(3.6, 1.8, 3.6, 3, 0.12), matArena);
  muralla.position.y = 0.9;
  muralla.castShadow = true;
  grupoCastillo.add(muralla);
  [
    [-1.6, -1.6],
    [1.6, -1.6],
    [-1.6, 1.6],
    [1.6, 1.6]
  ].forEach(([tx, tz]) => {
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 2.9, 16), matArena);
    torre.position.set(tx, 1.45, tz);
    torre.castShadow = true;
    const almena = new THREE.Mesh(
      new THREE.ConeGeometry(0.66, 0.95, 16),
      new THREE.MeshStandardMaterial({ color: 0xff1e27, roughness: 0.45 })
    );
    almena.position.set(tx, 3.35, tz);
    grupoCastillo.add(torre, almena);
  });
  grupoCastillo.position.set(12.0, 0, -39.0);
  grupoEsc.add(grupoCastillo);
  obstaculosHabitacion.push({ x: 12.0, z: -39.0, radio: 2.8 });

  // 8. 2 Palmeras inflables gigantes
  [
    [-38.0, -18.0],
    [38.0, -12.0]
  ].forEach(([px, pz]) => {
    const palmera = new THREE.Group();
    const tronco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.48, 4.6, 14),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55 })
    );
    tronco.position.y = 2.3;
    tronco.castShadow = true;
    palmera.add(tronco);
    for (let h = 0; h < 6; h++) {
      const hoja = new THREE.Mesh(
        crearCajaRedondeada(1.9, 0.12, 0.62, 2, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 })
      );
      const ang = (h * Math.PI * 2) / 6;
      hoja.position.set(Math.cos(ang) * 0.95, 4.45, Math.sin(ang) * 0.95);
      hoja.rotation.y = -ang;
      hoja.rotation.z = -0.25;
      palmera.add(hoja);
    }
    palmera.position.set(px, 0, pz);
    grupoEsc.add(palmera);
    obstaculosHabitacion.push({ x: px, z: pz, radio: 1.6 });
  });

  // 9. Silla alta de salvavidas con sombrilla (-18.0, 38.5)
  const grupoSalvavidas = new THREE.Group();
  const matBlancoSal = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  [
    [-0.65, -0.65],
    [0.65, -0.65],
    [-0.65, 0.65],
    [0.65, 0.65]
  ].forEach(([lx, lz]) => {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 10), matBlancoSal);
    pata.position.set(lx, 1.4, lz);
    grupoSalvavidas.add(pata);
  });
  const asiento = new THREE.Mesh(crearCajaRedondeada(1.5, 0.18, 1.4, 2, 0.04), matBlancoSal);
  asiento.position.y = 2.8;
  const sombrilla = new THREE.Mesh(
    new THREE.ConeGeometry(1.75, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0xff1e27, roughness: 0.45 })
  );
  sombrilla.position.y = 4.9;
  const mastilSom = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), matBlancoSal);
  mastilSom.position.y = 3.85;
  grupoSalvavidas.add(asiento, mastilSom, sombrilla);
  grupoSalvavidas.position.set(-18.0, 0, 38.5);
  grupoEsc.add(grupoSalvavidas);
  obstaculosHabitacion.push({ x: -18.0, z: 38.5, radio: 1.9 });

  // 10. 2 Pilas de salvavidas rojiblancos gigantes
  [
    [18.0, 38.5],
    [39.0, 12.0]
  ].forEach(([sx, sz]) => {
    const pila = new THREE.Group();
    [0.32, 0.86, 1.38].forEach((py, idx) => {
      const aroSal = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.28, 12, 24),
        new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xff1e27 : 0xf8fafc, roughness: 0.35 })
      );
      aroSal.rotation.x = Math.PI / 2;
      aroSal.position.y = py;
      aroSal.castShadow = true;
      pila.add(aroSal);
    });
    pila.position.set(sx, 0, sz);
    grupoEsc.add(pila);
    obstaculosHabitacion.push({ x: sx, z: sz, radio: 1.5 });
  });

  // Circuito continuo de canales de agua: bobsleigh peraltado, acueducto a Y=3.4m, doble hidro-salto y ruta dividida oeste
  const matAgua = crearMaterialClonTextura(bancoTexturas.agua, { roughness: 0.18, metalness: 0.12 });
  const matFlotador = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
  const matBarandaAgua = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.35 });
  const matLineaAgua = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const nodosAgua = generarNodosCircuitoCerrado(
    [
      { puntos: [[-20, 0, 28], [-10, 0, 28], [0, 0, 28], [10, 0, 28], [20, 0, 28]], guiaAntes: [-28, 0, 23], guiaDespues: [31, 0.35, 22], pasos: 4 },
      // Bobsleigh acuático peraltado (-0.26 rad) curvando hacia el interior y subiendo al acueducto
      { puntos: [[20, 0, 28], [31, 0.35, 22], [34, 0.65, 8], [27, 1.15, -4], [29, 2.2, -11]], guiaAntes: [10, 0, 28], guiaDespues: [24, 3.4, -16], pasos: 5, peralteMax: -0.26 },
      // Acueducto NE elevado (Y = 3.4 m) y caída en cascada pronunciada a Y = 0
      { puntos: [[29, 2.2, -11], [24, 3.4, -16], [19, 3.4, -21], [14, 3.4, -25], [6, 1.65, -29], [-1, 0, -31]], guiaAntes: [27, 1.15, -4], guiaDespues: [-7, 1.15, -31], pasos: 6, barandas: true },
      // Doble hidro-salto central norte (Y = 1.15 m)
      { puntos: [[-1, 0, -31], [-7, 1.15, -31], [-13, 0.12, -31], [-19, 1.15, -31], [-26, 0.08, -29]], guiaAntes: [6, 1.65, -29], guiaDespues: [-34, 0, -21], pasos: 6 },
      // Curva peraltada Oeste de retorno (+0.25 rad)
      { puntos: [[-26, 0.08, -29], [-34, 0, -21], [-36, 0.4, -7], [-34, 0.2, 13], [-28, 0, 23], [-20, 0, 28]], guiaAntes: [-19, 1.15, -31], guiaDespues: [-10, 0, 28], pasos: 6, peralteMax: 0.25 }
    ],
    anchoPista,
    (tramo, _idxT, idxP, total) => ({
      barandas: Boolean(tramo.barandas),
      peralte: tramo.peralteMax ? tramo.peralteMax * Math.sin(((idxP + 1) / total) * Math.PI) : 0,
      anchoPiano: 0.26
    })
  );

  crearCintaPistaDesdeNodos(grupoEsc, nodosAgua, {
    anchoPista,
    matSuperficie: matAgua,
    matBorde: matFlotador,
    matBaranda: matBarandaAgua,
    matLineaDivisoria: matLineaAgua,
    tipoSuperficie: 'agua_navegable',
    metaZSkip: 28.0
  });

  // Ruta dividida elevada Oeste (estrecha, sin barandas, con 2 Boost Pads seguidos)
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[-28, 0.12, -26], [-31, 1.85, -14], [-30, 1.85, 0], [-29, 1.85, 16], [-22, 0.12, 26]],
    {
      anchoPista: 2.6,
      anchoPiano: 0.22,
      matSuperficie: matAgua,
      matBorde: matFlotador,
      tipoSuperficie: 'agua_navegable',
      barandas: false,
      conPilares: true,
      colorPilar: 0x0284c7,
      peralte: 0,
      pasos: 5
    }
  );

  // Atajo interior Sureste protegido por muro derribable de boyas/bloques
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[14, 0.02, 28], [20, 0.22, 22], [26, 0.45, 15], [31, 0.58, 9]],
    {
      anchoPista: 2.8,
      anchoPiano: 0.22,
      matSuperficie: matAgua,
      matBorde: matFlotador,
      tipoSuperficie: 'agua_navegable',
      barandas: false,
      conPilares: false,
      colorPilar: 0x0284c7,
      peralte: 0,
      pasos: 4
    }
  );
  crearMuroAtajoDerribable(grupoEsc, 20.0, 0.22, 22.0, 0.707, 0.707, [0x38bdf8, 0xfacc15, 0xf97316, 0xe0f2fe]);

  // Isla central decorativa bajo el hidro-salto
  const isla = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 4.2, 0.42, 24),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.85 })
  );
  isla.position.set(-13, 0.18, -31.0);
  grupoEsc.add(isla);

  crearMetaYEnlaceTallerEnGrupo(grupoEsc, 28.0, anchoPista, 'agua_navegable', 0x0284c7, matAgua);

  [
    { indice: 0, x: 34.0, y: 0.65, z: 8.0, dir: [-0.25, 0, -0.97], ancho: anchoPista, radio: 4.0 },
    { indice: 1, x: 24.0, y: 3.4, z: -16.0, dir: [-0.7, 0, -0.7], ancho: anchoPista, radio: 4.0 },
    { indice: 2, x: -13.0, y: 0.12, z: -31.0, dir: [-1, 0, 0], ancho: anchoPista, radio: 4.0 },
    { indice: 3, x: -36.0, y: 0.4, z: -7.0, dir: [0, 0, 1], ancho: anchoPista, radio: 4.0 },
    { indice: 4, x: -28.0, y: 0.0, z: 23.0, dir: [0.85, 0, 0.52], ancho: anchoPista, radio: 4.0 }
  ].forEach((cp) => crearArcoCheckpointEnGrupo(grupoEsc, cp, anchoPista));

  // 16 Boost Pads (14 en trazado principal + 2 seguidos en ruta elevada Oeste)
  crearBoostPadsEnGrupo(grupoEsc, [
    { pos: [-13.0, 0.024, 28.0], dir: [1, 0, 0] },
    { pos: [8.0, 0.024, 28.0], dir: [1, 0, 0] },
    { pos: [27.5, 0.25, 24.5], dir: [0.85, 0, -0.52] },
    { pos: [33.5, 0.62, 12.0], dir: [-0.1, 0, -0.99] },
    { pos: [28.0, 1.05, 0.0], dir: [-0.45, 0, -0.89] },
    { pos: [28.5, 2.22, -11.0], dir: [-0.4, 0, -0.91] },
    { pos: [19.0, 3.42, -21.0], dir: [-0.7, 0, -0.7] },
    { pos: [6.0, 1.67, -29.0], dir: [-0.9, 0, -0.4] },
    { pos: [-4.0, 0.65, -31.0], dir: [-1, 0, 0] },
    { pos: [-16.0, 0.65, -31.0], dir: [-1, 0, 0] },
    { pos: [-31.0, 0.05, -25.0], dir: [-0.65, 0, 0.75] },
    { pos: [-35.5, 0.32, -13.0], dir: [-0.1, 0, 0.99] },
    { pos: [-32.5, 0.14, 16.5], dir: [0.45, 0, 0.89] },
    { pos: [-24.0, 0.024, 25.8], dir: [0.8, 0, 0.6] },
    { pos: [-30.6, 1.874, -8.0], dir: [0.05, 0, 0.99] },
    { pos: [-29.6, 1.874, 4.0], dir: [0.05, 0, 0.99] }
  ]);

  // 14 boyas flotantes derribables (+ 8 bloques del muro de atajo = 22 obstáculos dinámicos)
  [
    [-8.0, 0.34, 26.8],
    [12.0, 0.34, 29.2],
    [29.5, 0.65, 22.8],
    [34.8, 0.95, 10.5],
    [32.8, 0.95, 6.2],
    [27.8, 1.45, -1.8],
    [22.2, 3.74, -17.8],
    [16.5, 3.74, -23.0],
    [-9.5, 1.15, -29.8],
    [-21.5, 1.15, -29.8],
    [-31.5, 0.34, -23.5],
    [-36.8, 0.68, -10.5],
    [-31.0, 0.34, 18.0],
    [-24.0, 0.34, 24.5]
  ].forEach(([bx, by, bz]) => {
    const boya = new THREE.Group();
    const esfera = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xff5e00, roughness: 0.35 })
    );
    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.08, 10, 18),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    aro.rotation.x = Math.PI / 2;
    boya.add(esfera, aro);
    registrarObstaculoDinamico(grupoEsc, boya, bx, by, bz, 0.36);
  });

  // 10 compuertas oscilantes acuáticas (incluyendo parejas en contrafase)
  crearBarreraMovilTematica(grupoEsc, -15.0, 0.02, 28.0, 0, 1, 0.0, 0x0284c7, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, 6.0, 0.02, 28.0, 0, 1, Math.PI, 0x0284c7, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, 15.0, 0.02, 28.0, 0, 1, 0.8, 0x38bdf8, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, 33.5, 0.58, 12.0, 1, 0, 0.0, 0x0284c7, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, 27.5, 1.05, -2.5, 1, 0, Math.PI, 0x38bdf8, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, 21.0, 3.4, -19.0, 0.7, -0.7, 0.0, 0x0284c7, 0xfacc15);
  crearBarreraMovilTematica(grupoEsc, 16.0, 3.4, -23.0, 0.7, -0.7, Math.PI, 0x0284c7, 0xfacc15);
  crearBarreraMovilTematica(grupoEsc, -4.0, 0.58, -31.0, 0, 1, 1.5, 0x0284c7, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, -35.0, 0.25, -14.0, 1, 0, 0.4, 0x0284c7, 0xe0f2fe);
  crearBarreraMovilTematica(grupoEsc, -31.0, 0.06, 19.0, 0.85, -0.52, 2.2, 0x0284c7, 0xe0f2fe);

  // 6 trampas de espuma jabonosa en calzada
  crearTrampasEnGrupo(grupoEsc, [
    { pos: [3.0, 0.02, 28.0], radio: 1.55, tipo: 'espuma' },
    { pos: [31.5, 0.48, 16.5], radio: 1.55, tipo: 'espuma' },
    { pos: [19.0, 3.4, -21.0], radio: 1.45, tipo: 'espuma' },
    { pos: [-13.0, 0.12, -31.0], radio: 1.55, tipo: 'espuma' },
    { pos: [-35.2, 0.28, -14.5], radio: 1.55, tipo: 'espuma' },
    { pos: [-28.8, 0.02, 22.0], radio: 1.55, tipo: 'espuma' }
  ]);

  (contenedor || grupoEscenarioActivo).add(grupoEsc);
}

/**
 * Escenario 3: Ático Enduro (Stunt Park) de 92x92x10 m con circuito de tierra compacto,
 * peraltes pronunciados, montículos rítmicos (whoops), doble salto, cajas, baúl y tren de madera.
 */
export function construirEscenarioAtico(contenedor = grupoEscenarioActivo) {
  const hab = CATALOGO_HABITACIONES.habitacion_atico;
  const grupoEsc = new THREE.Group();
  const anchoPista = 4.4;

  const matMadera = new THREE.MeshStandardMaterial({
    map: bancoTexturas.maderaDiffuse,
    roughnessMap: bancoTexturas.maderaRoughness,
    bumpMap: bancoTexturas.maderaBump,
    bumpScale: 0.015,
    roughness: 0.8
  });
  const matAlfombraAtico = new THREE.MeshStandardMaterial({ map: bancoTexturas.alfombra, roughness: 0.92 });
  crearRecintoHabitacionBase(grupoEsc, hab, {
    matPiso: matMadera,
    colorTecho: 0x78350f,
    colorPared: 0xd97706,
    matTaller: matAlfombraAtico
  });

  // Vigas estructurales de madera en el techo (Y = 9.35 m)
  const matViga = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  [-32, -16, 0, 16, 32].forEach((zViga) => {
    const viga = new THREE.Mesh(crearCajaRedondeada(hab.dimensiones.ancho - 1, 0.7, 0.7, 2, 0.04), matViga);
    viga.position.set(0, 9.45, zViga);
    grupoEsc.add(viga);
  });

  // Baúl antiguo gigante (NE: 38, -36), cajas de mudanza (NO: -38, -36) y locomotora de madera (SO: -38, 36)
  const baul = new THREE.Mesh(
    crearCajaRedondeada(4.8, 2.4, 2.8, 3, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.7 })
  );
  baul.position.set(38.5, 1.2, -37.0);
  baul.castShadow = true;
  grupoEsc.add(baul);
  obstaculosHabitacion.push({ x: 38.5, z: -37.0, radio: 2.9 });

  const cajaCarton = new THREE.Mesh(
    crearCajaRedondeada(3.8, 3.2, 3.8, 3, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 })
  );
  cajaCarton.position.set(-39.0, 1.6, -37.0);
  cajaCarton.castShadow = true;
  grupoEsc.add(cajaCarton);
  obstaculosHabitacion.push({ x: -39.0, z: -37.0, radio: 2.7 });

  const grupoTren = new THREE.Group();
  const baseTren = new THREE.Mesh(
    crearCajaRedondeada(4.2, 1.2, 1.8, 3, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  baseTren.position.y = 0.7;
  const caldera = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 2.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 })
  );
  caldera.rotation.z = Math.PI / 2;
  caldera.position.set(0.6, 1.75, 0);
  grupoTren.add(baseTren, caldera);
  grupoTren.position.set(-38.0, 0, 36.5);
  grupoEsc.add(grupoTren);
  obstaculosHabitacion.push({ x: -38.0, z: 36.5, radio: 2.4 });

  // 4 Tragaluces inclinados en el techo del Ático con luz cálida
  const matCristalCalido = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde047,
    emissiveIntensity: 0.95,
    roughness: 0.15
  });
  [
    [-22, -18, 0.22],
    [22, -18, -0.22],
    [-22, 18, 0.22],
    [22, 18, -0.22]
  ].forEach(([tx, tz, rotZ]) => {
    const tragaluz = new THREE.Group();
    const marcoTrag = new THREE.Mesh(crearCajaRedondeada(11.0, 0.42, 7.6, 2, 0.05), matViga);
    const panelLuz = new THREE.Mesh(crearCajaRedondeada(10.0, 0.16, 6.6, 2, 0.02), matCristalCalido);
    panelLuz.position.y = -0.16;
    tragaluz.add(marcoTrag, panelLuz);
    tragaluz.position.set(tx, 9.65, tz);
    tragaluz.rotation.z = rotZ;
    grupoEsc.add(tragaluz);
  });

  // Estantería metálica gigante con latas de pintura y cajas de herramientas (41.0, 0.0)
  const grupoEstante = new THREE.Group();
  const matMetalEstante = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.72, roughness: 0.35 });
  [
    [-1.4, -2.2],
    [1.4, -2.2],
    [-1.4, 2.2],
    [1.4, 2.2]
  ].forEach(([px, pz]) => {
    const posteE = new THREE.Mesh(crearCajaRedondeada(0.22, 6.2, 0.22, 2, 0.02), matMetalEstante);
    posteE.position.set(px, 3.1, pz);
    posteE.castShadow = true;
    grupoEstante.add(posteE);
  });
  const coloresLatas = [0xff1e27, 0x3b82f6, 0x22c55e, 0xfacc15];
  [1.4, 3.3, 5.2].forEach((by, nivel) => {
    const balda = new THREE.Mesh(crearCajaRedondeada(3.0, 0.18, 4.6, 2, 0.03), matMetalEstante);
    balda.position.y = by;
    grupoEstante.add(balda);
    const lata = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.95, 16),
      new THREE.MeshStandardMaterial({ color: coloresLatas[nivel % coloresLatas.length], roughness: 0.3 })
    );
    lata.position.set(0, by + 0.56, -1.1);
    const cajaHerr = new THREE.Mesh(
      crearCajaRedondeada(1.3, 0.75, 1.4, 2, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    cajaHerr.position.set(0, by + 0.46, 1.0);
    grupoEstante.add(lata, cajaHerr);
  });
  grupoEstante.position.set(41.0, 0, 0.0);
  grupoEsc.add(grupoEstante);
  obstaculosHabitacion.push({ x: 41.0, z: 0.0, radio: 2.8 });

  // Televisor retro CRT con consola de 16 bits (37.5, 36.5)
  const grupoRetro = new THREE.Group();
  const muebleTV = new THREE.Mesh(
    crearCajaRedondeada(3.4, 1.2, 2.2, 2, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.68 })
  );
  muebleTV.position.y = 0.6;
  const carcasaTV = new THREE.Mesh(
    crearCajaRedondeada(2.4, 2.0, 1.9, 3, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
  );
  carcasaTV.position.set(0, 2.2, -0.1);
  carcasaTV.castShadow = true;
  const pantallaTV = new THREE.Mesh(
    crearCajaRedondeada(1.85, 1.4, 0.14, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95 })
  );
  pantallaTV.position.set(0, 2.25, 0.85);
  const consola = new THREE.Mesh(
    crearCajaRedondeada(1.4, 0.35, 1.1, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 })
  );
  consola.position.set(1.3, 1.38, 0.25);
  grupoRetro.add(muebleTV, carcasaTV, pantallaTV, consola);
  grupoRetro.position.set(37.5, 0, 36.5);
  grupoRetro.rotation.y = -Math.PI * 0.75;
  grupoEsc.add(grupoRetro);
  obstaculosHabitacion.push({ x: 37.5, z: 36.5, radio: 2.6 });

  // Bicicleta clásica apoyada (-41.0, 16.0)
  const grupoBici = new THREE.Group();
  const matCuadroBici = new THREE.MeshStandardMaterial({ color: 0xff1e27, roughness: 0.32, metalness: 0.5 });
  const matRuedaBici = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  [-1.05, 1.05].forEach((rz) => {
    const ruedaBici = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.12, 10, 24), matRuedaBici);
    ruedaBici.position.set(0, 0.9, rz);
    ruedaBici.rotation.y = Math.PI / 2;
    ruedaBici.castShadow = true;
    grupoBici.add(ruedaBici);
  });
  const barraCuadro = new THREE.Mesh(crearCajaRedondeada(0.14, 0.14, 2.0, 2, 0.03), matCuadroBici);
  barraCuadro.position.set(0, 1.55, 0);
  const manillar = new THREE.Mesh(crearCajaRedondeada(0.95, 0.12, 0.14, 2, 0.03), matMetalEstante);
  manillar.position.set(0, 2.05, 0.9);
  const sillin = new THREE.Mesh(crearCajaRedondeada(0.32, 0.14, 0.48, 2, 0.04), matCuadroBici);
  sillin.position.set(0, 1.95, -0.75);
  grupoBici.add(barraCuadro, manillar, sillin);
  grupoBici.position.set(-41.0, 0, 16.0);
  grupoBici.rotation.z = 0.16;
  grupoEsc.add(grupoBici);
  obstaculosHabitacion.push({ x: -41.0, z: 16.0, radio: 1.8 });

  // Ventilador de pie gigante (-18.0, -39.5)
  const grupoVent = new THREE.Group();
  const baseVent = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.25, 20), matMetalEstante);
  baseVent.position.y = 0.125;
  const mastilVent = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.6, 14), matMetalEstante);
  mastilVent.position.y = 1.9;
  const rejilla = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.1, 10, 28), matMetalEstante);
  rejilla.position.y = 3.8;
  grupoVent.add(baseVent, mastilVent, rejilla);
  for (let i = 0; i < 4; i++) {
    const aspa = new THREE.Mesh(
      crearCajaRedondeada(0.32, 1.15, 0.08, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
    );
    const ang = (i * Math.PI) / 2;
    aspa.position.set(Math.cos(ang) * 0.62, 3.8 + Math.sin(ang) * 0.62, 0.05);
    aspa.rotation.z = ang + Math.PI / 2;
    grupoVent.add(aspa);
  }
  grupoVent.position.set(-18.0, 0, -39.5);
  grupoEsc.add(grupoVent);
  obstaculosHabitacion.push({ x: -18.0, z: -39.5, radio: 2.0 });

  // 2 Pilas de cómics y maletas antiguas (16.0, 38.5 y -18.0, 38.5)
  [
    [16.0, 38.5, 0x991b1b],
    [-18.0, 38.5, 0x1e3a8a]
  ].forEach(([mx, mz, colMaleta]) => {
    const pilaMal = new THREE.Group();
    const maletaG = new THREE.Mesh(
      crearCajaRedondeada(2.8, 1.1, 1.9, 3, 0.08),
      new THREE.MeshStandardMaterial({ color: colMaleta, roughness: 0.6 })
    );
    maletaG.position.y = 0.55;
    maletaG.castShadow = true;
    const correa = new THREE.Mesh(
      crearCajaRedondeada(2.88, 1.14, 0.24, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    correa.position.y = 0.55;
    const comic1 = new THREE.Mesh(
      crearCajaRedondeada(1.4, 0.25, 1.1, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
    );
    comic1.position.set(-0.2, 1.22, 0.1);
    comic1.rotation.y = 0.25;
    const comic2 = new THREE.Mesh(
      crearCajaRedondeada(1.35, 0.25, 1.05, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff1e27, roughness: 0.5 })
    );
    comic2.position.set(-0.1, 1.46, 0.05);
    comic2.rotation.y = -0.18;
    pilaMal.add(maletaG, correa, comic1, comic2);
    pilaMal.position.set(mx, 0, mz);
    grupoEsc.add(pilaMal);
    obstaculosHabitacion.push({ x: mx, z: mz, radio: 2.1 });
  });

  // Circuito Stunt de Tierra: pasarela alta (Y=4.2m), sacacorchos peraltado, 4 whoops Norte y ruta dividida Oeste
  const matTierra = crearMaterialClonTextura(bancoTexturas.tierra, { roughness: 0.92, metalness: 0.02 });
  const matMaderaBorde = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 });
  const matBarandaMadera = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });
  const matLineaTierra = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const nodosTierra = generarNodosCircuitoCerrado(
    [
      { puntos: [[-20, 0, 27], [-10, 0, 27], [0, 0, 27], [10, 0, 27], [20, 0, 27]], guiaAntes: [-31, 0.05, 22], guiaDespues: [31, 1.3, 20], pasos: 4 },
      // Subida Este hacia la pasarela elevada de tablones (Y = 4.2 m)
      { puntos: [[20, 0, 27], [31, 1.3, 20], [36, 2.8, 9], [35, 4.2, -4], [28, 4.2, -16]], guiaAntes: [10, 0, 27], guiaDespues: [22, 3.4, -22], pasos: 5, peralteMax: -0.20, barandas: true },
      // Sacacorchos descendente peraltado (-0.24 rad) con giro en S abierto
      { puntos: [[28, 4.2, -16], [22, 3.4, -22], [14, 2.3, -23], [8, 1.2, -20], [1, 0.2, -23], [-5, 0, -29]], guiaAntes: [35, 4.2, -4], guiaDespues: [-9, 1.15, -31], pasos: 5, peralteMax: -0.24, barandas: true },
      // Recta Norte con 4 montículos rítmicos (whoops) de 1.15 m
      { puntos: [[-5, 0, -29], [-9, 1.15, -31], [-13, 0.15, -31], [-17, 1.15, -31], [-21, 0.15, -31], [-25, 1.15, -31], [-29, 0.15, -31], [-33, 1.15, -30], [-37, 0.1, -26]], guiaAntes: [1, 0.2, -23], guiaDespues: [-39, 0.35, -14], pasos: 3 },
      // Retorno Oeste peraltado (+0.24 rad)
      { puntos: [[-37, 0.1, -26], [-39, 0.35, -14], [-38, 0.25, 13], [-31, 0.05, 22], [-20, 0, 27]], guiaAntes: [-33, 1.15, -30], guiaDespues: [-10, 0, 27], pasos: 6, peralteMax: 0.24 }
    ],
    anchoPista,
    (tramo, _idxT, idxP, total) => ({
      barandas: Boolean(tramo.barandas),
      peralte: tramo.peralteMax ? tramo.peralteMax * Math.sin(((idxP + 1) / total) * Math.PI) : 0,
      anchoPiano: 0.28
    })
  );

  crearCintaPistaDesdeNodos(grupoEsc, nodosTierra, {
    anchoPista,
    matSuperficie: matTierra,
    matBorde: matMaderaBorde,
    matBaranda: matBarandaMadera,
    matLineaDivisoria: matLineaTierra,
    tipoSuperficie: 'pista_tierra',
    metaZSkip: 27.0
  });

  // Ruta dividida elevada de tablones al Oeste (Y = 2.1 m, estrecha, sin barandas, con 2 Boost Pads)
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[-34, 0.2, -24], [-31, 2.1, -13], [-30, 2.1, 1], [-29, 2.1, 15], [-23, 0.15, 24]],
    {
      anchoPista: 2.6,
      anchoPiano: 0.22,
      matSuperficie: matTierra,
      matBorde: matMaderaBorde,
      tipoSuperficie: 'pista_tierra',
      barandas: false,
      conPilares: true,
      colorPilar: 0x92400e,
      peralte: 0,
      pasos: 5
    }
  );

  // Atajo interior que corta la curva del Sacacorchos protegido por muro derribable
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[22, 3.4, -22], [12, 1.9, -29], [1, 0.4, -30], [-5, 0, -29]],
    {
      anchoPista: 2.8,
      anchoPiano: 0.22,
      matSuperficie: matTierra,
      matBorde: matMaderaBorde,
      tipoSuperficie: 'pista_tierra',
      barandas: false,
      conPilares: true,
      colorPilar: 0x78350f,
      peralte: 0,
      pasos: 4
    }
  );
  crearMuroAtajoDerribable(grupoEsc, 15.0, 2.35, -27.0, 0.5, 0.86, [0xf59e0b, 0x92400e, 0xfef3c7, 0xea580c]);

  crearMetaYEnlaceTallerEnGrupo(grupoEsc, 27.0, anchoPista, 'pista_tierra', 0xf59e0b, matTierra);

  [
    { indice: 0, x: 35.0, y: 4.2, z: -4.0, dir: [-0.25, 0, -0.96], ancho: anchoPista, radio: 3.8 },
    { indice: 1, x: 14.0, y: 2.3, z: -23.0, dir: [-0.98, 0, 0.15], ancho: anchoPista, radio: 3.8 },
    { indice: 2, x: -17.0, y: 1.15, z: -31.0, dir: [-1, 0, 0], ancho: anchoPista, radio: 3.8 },
    { indice: 3, x: -39.0, y: 0.35, z: -14.0, dir: [0, 0, 1], ancho: anchoPista, radio: 3.8 },
    { indice: 4, x: -31.0, y: 0.05, z: 22.0, dir: [0.85, 0, 0.52], ancho: anchoPista, radio: 3.8 }
  ].forEach((cp) => crearArcoCheckpointEnGrupo(grupoEsc, cp, anchoPista));

  // 16 Boost Pads (14 en circuito principal + 2 seguidos en ruta dividida elevada Oeste)
  crearBoostPadsEnGrupo(grupoEsc, [
    { pos: [-14.0, 0.024, 27.0], dir: [1, 0, 0] },
    { pos: [7.0, 0.024, 27.0], dir: [1, 0, 0] },
    { pos: [27.0, 0.85, 23.0], dir: [0.75, 0, -0.66] },
    { pos: [35.5, 2.5, 11.0], dir: [0.15, 0, -0.98] },
    { pos: [35.0, 4.224, -4.0], dir: [-0.2, 0, -0.98] },
    { pos: [28.0, 4.224, -16.0], dir: [-0.65, 0, -0.76] },
    { pos: [14.0, 2.324, -23.0], dir: [-0.98, 0, 0.15] },
    { pos: [4.0, 0.72, -21.0], dir: [-0.85, 0, -0.52] },
    { pos: [-7.0, 0.62, -30.0], dir: [-1, 0, 0] },
    { pos: [-19.0, 0.62, -31.0], dir: [-1, 0, 0] },
    { pos: [-31.0, 0.62, -30.5], dir: [-0.95, 0, 0.31] },
    { pos: [-39.0, 0.37, -14.0], dir: [0, 0, 1] },
    { pos: [-33.0, 0.12, 19.0], dir: [0.55, 0, 0.83] },
    { pos: [-25.0, 0.024, 24.5], dir: [0.85, 0, 0.52] },
    { pos: [-30.5, 2.124, -6.0], dir: [0.08, 0, 0.99] },
    { pos: [-29.6, 2.124, 6.0], dir: [0.08, 0, 0.99] }
  ]);

  // 14 barriles derribables (+ 8 bloques del muro del atajo = 22 obstáculos dinámicos)
  [
    [-8.0, 0.32, 25.8],
    [13.0, 0.32, 28.0],
    [29.0, 1.4, 21.5],
    [34.5, 3.0, 10.0],
    [36.5, 4.52, -1.5],
    [30.5, 4.52, -13.5],
    [18.0, 3.1, -22.5],
    [10.0, 1.8, -21.0],
    [-11.0, 0.92, -29.8],
    [-23.0, 0.92, -29.8],
    [-35.0, 0.72, -28.0],
    [-37.8, 0.65, -16.0],
    [-33.5, 0.38, 19.5],
    [-16.0, 0.32, 26.2]
  ].forEach(([bx, by, bz]) => {
    const barril = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.64, 16),
      new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
    );
    barril.castShadow = true;
    registrarObstaculoDinamico(grupoEsc, barril, bx, by, bz, 0.34);
  });

  // 10 barreras móviles temáticas (incluyendo parejas en contrafase)
  crearBarreraMovilTematica(grupoEsc, -15.0, 0.02, 27.0, 0, 1, 0.0, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, 8.0, 0.02, 27.0, 0, 1, Math.PI, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, 16.0, 0.02, 27.0, 0, 1, 1.1, 0xea580c, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, 36.0, 2.8, 9.0, 1, 0, 0.0, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, 33.0, 4.2, -10.0, 0.9, -0.4, Math.PI, 0xf59e0b, 0xfef3c7);
  crearBarreraMovilTematica(grupoEsc, 18.0, 2.8, -22.5, 0, 1, 0.0, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, 5.0, 0.8, -21.0, 0.5, 0.86, Math.PI, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, -13.0, 0.15, -31.0, 0, 1, 1.8, 0xea580c, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, -29.0, 0.15, -31.0, 0, 1, 2.4, 0xf59e0b, 0x1e293b);
  crearBarreraMovilTematica(grupoEsc, -38.5, 0.32, -12.0, 1, 0, 0.7, 0xf59e0b, 0x1e293b);

  // 6 trampas de barro (penalizan 0.78x velocidad salvo con turbo activo)
  crearTrampasEnGrupo(grupoEsc, [
    { pos: [4.0, 0.02, 27.0], radio: 1.55, tipo: 'barro' },
    { pos: [35.5, 2.75, 9.0], radio: 1.45, tipo: 'barro' },
    { pos: [20.0, 3.25, -22.0], radio: 1.45, tipo: 'barro' },
    { pos: [1.0, 0.2, -23.0], radio: 1.45, tipo: 'barro' },
    { pos: [-21.0, 0.15, -31.0], radio: 1.55, tipo: 'barro' },
    { pos: [-32.5, 0.08, 20.5], radio: 1.55, tipo: 'barro' }
  ]);

  (contenedor || grupoEscenarioActivo).add(grupoEsc);
}

/**
 * Escenario 4: Domo Aéreo (Sky Hangar) de 110x110x18 m con circuito híbrido terrestre + aros aéreos,
 * 4 Anillos Turbo Aéreos en altura, helipuerto central, torres de control y cohetes gigantes.
 */
export function construirEscenarioHangar(contenedor = grupoEscenarioActivo) {
  const hab = CATALOGO_HABITACIONES.habitacion_hangar;
  const grupoEsc = new THREE.Group();
  const anchoPista = 5.4;

  const matHangar = crearMaterialClonTextura(bancoTexturas.hangar, { roughness: 0.45, metalness: 0.25 }, 1, 1);
  const matHelipuerto = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.35
  });
  crearRecintoHabitacionBase(grupoEsc, hab, {
    matPiso: matHangar,
    colorTecho: 0x020617,
    colorPared: 0x1e293b,
    matTaller: matHelipuerto
  });

  // Aro luminoso del helipuerto central + tragaluces estelares en el techo (Y = 17.8 m)
  const aroHeli = new THREE.Mesh(
    new THREE.TorusGeometry(hab.taller.radioBase - 0.1, 0.06, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 1.2 })
  );
  aroHeli.rotation.x = Math.PI / 2;
  aroHeli.position.y = 0.03;
  grupoEsc.add(aroHeli);

  const matTragaluz = new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 1.2 });
  [-28, 0, 28].forEach((tx) => {
    [-26, 26].forEach((tz) => {
      const panel = new THREE.Mesh(crearCajaRedondeada(14, 0.25, 10, 2, 0.04), matTragaluz);
      panel.position.set(tx, 17.85, tz);
      grupoEsc.add(panel);
    });
  });

  // Cohetes y torres de control gigantes en las esquinas
  [
    [47, 45, 0xff1e27],
    [-47, -45, 0x38bdf8]
  ].forEach(([cx, cz, colAcento]) => {
    const cohete = new THREE.Group();
    const fuselaje = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 8.5, 18),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    fuselaje.position.y = 4.25;
    fuselaje.castShadow = true;
    const ojiva = new THREE.Mesh(
      new THREE.ConeGeometry(1.45, 3.2, 18),
      new THREE.MeshStandardMaterial({ color: colAcento, roughness: 0.3 })
    );
    ojiva.position.y = 10.1;
    cohete.add(fuselaje, ojiva);
    cohete.position.set(cx, 0, cz);
    grupoEsc.add(cohete);
    obstaculosHabitacion.push({ x: cx, z: cz, radio: 2.1 });
  });

  const torre = new THREE.Mesh(
    crearCajaRedondeada(3.6, 11.5, 3.6, 3, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
  );
  torre.position.set(47.0, 5.75, -46.0);
  torre.castShadow = true;
  grupoEsc.add(torre);
  obstaculosHabitacion.push({ x: 47.0, z: -46.0, radio: 2.5 });

  // 2 Grúas puente industriales amarillas/negras en el techo (Y = 15.6 m)
  const matAmarilloGrua = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.4 });
  const matNegroGrua = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
  [-18.0, 18.0].forEach((zGrua, idxG) => {
    const grua = new THREE.Group();
    const vigaPrin = new THREE.Mesh(crearCajaRedondeada(106.0, 1.3, 1.5, 2, 0.06), matAmarilloGrua);
    grua.add(vigaPrin);
    for (let xF = -42; xF <= 42; xF += 14) {
      const franjaG = new THREE.Mesh(crearCajaRedondeada(4.5, 1.38, 1.58, 1, 0.02), matNegroGrua);
      franjaG.position.x = xF;
      grua.add(franjaG);
    }
    const carro = new THREE.Mesh(crearCajaRedondeada(5.2, 1.1, 2.8, 2, 0.06), matNegroGrua);
    carro.position.set(idxG === 0 ? -16 : 18, -0.9, 0);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 10), matNegroGrua);
    cable.position.set(carro.position.x, -2.4, 0);
    grua.add(carro, cable);
    grua.position.set(0, 15.6, zGrua);
    grupoEsc.add(grua);
  });

  // Satélite artificial con paneles solares suspendido en altura (-18.0, 12.2, -12.0)
  const grupoSatelite = new THREE.Group();
  const cuerpoSat = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 2.8, 16),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.25 })
  );
  cuerpoSat.rotation.z = Math.PI / 2;
  const matPanelSolar = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x0284c7, emissiveIntensity: 0.35, metalness: 0.6 });
  [-3.8, 3.8].forEach((zPan) => {
    const panelSat = new THREE.Mesh(crearCajaRedondeada(1.8, 0.12, 4.6, 2, 0.03), matPanelSolar);
    panelSat.position.z = zPan;
    grupoSatelite.add(panelSat);
  });
  const platoSat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.25, 0.55, 18),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.3 })
  );
  platoSat.rotation.z = -Math.PI / 2;
  platoSat.position.x = 1.65;
  grupoSatelite.add(cuerpoSat, platoSat);
  grupoSatelite.position.set(-18.0, 12.2, -12.0);
  grupoSatelite.rotation.y = 0.45;
  grupoEsc.add(grupoSatelite);

  // 4 Pantallas holográficas de telemetría en los muros (Y = 10.5 m)
  const matHoloMarco = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.6 });
  const matHoloPantalla = new THREE.MeshStandardMaterial({
    map: bancoTexturas.tablero,
    emissive: 0x00f0ff,
    emissiveMap: bancoTexturas.tablero,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  [
    { x: 24.0, z: -54.7, rotY: 0 },
    { x: -24.0, z: 54.7, rotY: Math.PI },
    { x: 54.7, z: 22.0, rotY: -Math.PI / 2 },
    { x: -54.7, z: -28.0, rotY: Math.PI / 2 }
  ].forEach((ph) => {
    const holo = new THREE.Group();
    const marcoH = new THREE.Mesh(crearCajaRedondeada(10.6, 5.2, 0.25, 2, 0.04), matHoloMarco);
    const screenH = new THREE.Mesh(new THREE.BoxGeometry(9.8, 4.5, 0.1), matHoloPantalla);
    screenH.position.z = 0.14;
    holo.add(marcoH, screenH);
    holo.position.set(ph.x, 10.5, ph.z);
    holo.rotation.y = ph.rotY;
    grupoEsc.add(holo);
  });

  // 2 Pilas de contenedores de carga espacial con luces LED
  [
    [-48.0, 38.0, 0x0284c7, 3.2],
    [50.5, -18.0, 0xd97706, 2.8]
  ].forEach(([cx, cz, colCont, radioCol]) => {
    const cont = new THREE.Group();
    const c1 = new THREE.Mesh(
      crearCajaRedondeada(3.8, 2.5, 5.2, 2, 0.06),
      new THREE.MeshStandardMaterial({ color: colCont, roughness: 0.45, metalness: 0.3 })
    );
    c1.position.y = 1.25;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(
      crearCajaRedondeada(3.6, 2.3, 4.6, 2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.4 })
    );
    c2.position.set(0, 3.65, 0);
    const led = new THREE.Mesh(
      crearCajaRedondeada(3.9, 0.2, 0.4, 1, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 })
    );
    led.position.set(0, 2.35, 2.5);
    cont.add(c1, c2, led);
    cont.position.set(cx, 0, cz);
    grupoEsc.add(cont);
    obstaculosHabitacion.push({ x: cx, z: cz, radio: radioCol });
  });

  // 2 Antenas parabólicas de radar
  [
    [-50.2, -18.0, 2.3],
    [18.0, -48.5, 2.5]
  ].forEach(([ax, az, radA]) => {
    const antenaG = new THREE.Group();
    const baseA = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 2.4, 16), matNegroGrua);
    baseA.position.y = 1.2;
    const platoA = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 0.45, 1.0, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.5 })
    );
    platoA.position.y = 3.2;
    platoA.rotation.x = 0.55;
    const punteroA = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff1e27, emissive: 0xff1e27, emissiveIntensity: 1.0 })
    );
    punteroA.position.set(0, 4.1, 0.7);
    antenaG.add(baseA, platoA, punteroA);
    antenaG.position.set(ax, 0, az);
    grupoEsc.add(antenaG);
    obstaculosHabitacion.push({ x: ax, z: az, radio: radA });
  });

  // 2 Baterías de tanques cilíndricos de combustible
  [
    [-20.0, 47.0],
    [22.0, 47.0]
  ].forEach(([fx, fz]) => {
    const tanques = new THREE.Group();
    [-1.15, 1.15].forEach((offX) => {
      const tq = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.95, 4.2, 18),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.55 })
      );
      tq.position.set(offX, 2.1, 0);
      tq.castShadow = true;
      const banda = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.55, 18),
        matAmarilloGrua
      );
      banda.position.set(offX, 2.8, 0);
      tanques.add(tq, banda);
    });
    tanques.position.set(fx, 0, fz);
    grupoEsc.add(tanques);
    obstaculosHabitacion.push({ x: fx, z: fz, radio: 2.6 });
  });

  // Gran portón blindado de hangar en el muro Norte (0.0, -54.2)
  const porton = new THREE.Group();
  const marcoPorton = new THREE.Mesh(
    crearCajaRedondeada(14.0, 10.5, 1.2, 2, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 })
  );
  marcoPorton.position.y = 5.25;
  const hojaPorton = new THREE.Mesh(
    crearCajaRedondeada(11.8, 9.2, 0.7, 2, 0.04),
    matNegroGrua
  );
  hojaPorton.position.set(0, 4.6, 0.35);
  const franjaPeligro = new THREE.Mesh(crearCajaRedondeada(12.2, 0.65, 0.85, 2, 0.02), matAmarilloGrua);
  franjaPeligro.position.set(0, 0.4, 0.45);
  const balizaPorton = new THREE.Mesh(
    crearCajaRedondeada(4.8, 0.45, 0.9, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 })
  );
  balizaPorton.position.set(0, 9.8, 0.45);
  porton.add(marcoPorton, hojaPorton, franjaPeligro, balizaPorton);
  porton.position.set(0.0, 0, -54.2);
  grupoEsc.add(porton);
  obstaculosHabitacion.push({ x: 0.0, z: -54.2, radio: 3.2 });

  // Circuito ancho híbrido: autopista magnética a Y=4.5m, S-curve norte alrededor del helipuerto, ruta dividida Oeste y 8 anillos aéreos en zig-zag
  const matAsfalto = crearMaterialClonTextura(bancoTexturas.asfalto, { roughness: 0.8, metalness: 0.08 });
  const matBordeHangar = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.35, roughness: 0.4 });
  const matBarandaHangar = new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x0284c7, emissiveIntensity: 0.25, roughness: 0.35 });
  const matLineaHangar = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const nodosHangar = generarNodosCircuitoCerrado(
    [
      // Recta de despegue Sur (Z = 32) con rampa de lanzamiento #1 en X = 12
      { puntos: [[-30, 0, 32], [-15, 0, 32], [0, 0, 32], [12, 1.1, 32], [22, 0.15, 32], [32, 1.6, 26]], guiaAntes: [-37, 0.1, 28], guiaDespues: [42, 3.2, 14], pasos: 4 },
      // Subida Este hacia autopista magnética elevada (Y = 4.5 m)
      { puntos: [[32, 1.6, 26], [42, 3.2, 14], [44, 4.5, 0], [38, 4.5, -22]], guiaAntes: [22, 0.15, 32], guiaDespues: [26, 3.8, -32], pasos: 5, peralteMax: -0.22, barandas: true },
      // Curva en S interior rodeando el lado norte del helipuerto (peralte alterno ±0.22 rad)
      { puntos: [[38, 4.5, -22], [26, 3.8, -32], [15, 2.9, -29], [4, 2.0, -24], [-10, 1.2, -16]], guiaAntes: [44, 4.5, 0], guiaDespues: [-18, 1.8, -24], pasos: 4, peralteMax: 0.22, barandas: true },
      { puntos: [[-10, 1.2, -16], [-18, 1.8, -24], [-24, 2.4, -34]], guiaAntes: [4, 2.0, -24], guiaDespues: [-38, 1.2, -26], pasos: 4, peralteMax: -0.22, barandas: true },
      // Descenso Noroeste + corredor Oeste + rampa de lanzamiento #2 en [-42, 1.15, 21]
      { puntos: [[-24, 2.4, -34], [-38, 1.2, -26], [-44, 0.15, -8], [-44, 0.1, 12], [-42, 1.15, 21], [-37, 0.1, 28], [-30, 0, 32]], guiaAntes: [-18, 1.8, -24], guiaDespues: [-15, 0, 32], pasos: 5 }
    ],
    anchoPista,
    (tramo, _idxT, idxP, total) => ({
      barandas: Boolean(tramo.barandas),
      peralte: tramo.peralteMax ? tramo.peralteMax * Math.sin(((idxP + 1) / total) * Math.PI) : 0,
      anchoPiano: 0.32
    })
  );

  crearCintaPistaDesdeNodos(grupoEsc, nodosHangar, {
    anchoPista,
    matSuperficie: matAsfalto,
    matBorde: matBordeHangar,
    matBaranda: matBarandaHangar,
    matLineaDivisoria: matLineaHangar,
    tipoSuperficie: 'pista_asfalto',
    metaZSkip: 32.0
  });

  // Ruta dividida elevada Oeste (Y = 3.2 m, estrecha, sin barandas, con 2 Boost Pads seguidos)
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[-34, 1.4, -28], [-37, 3.2, -12], [-37, 3.2, 4], [-36, 3.2, 18], [-32, 0.15, 30]],
    {
      anchoPista: 2.6,
      anchoPiano: 0.24,
      matSuperficie: matAsfalto,
      matBorde: matBordeHangar,
      tipoSuperficie: 'pista_asfalto',
      barandas: false,
      conPilares: true,
      colorPilar: 0x0284c7,
      peralte: 0,
      pasos: 5
    }
  );

  // Atajo interior Norte protegido por muro derribable de balizas
  crearTramoBifurcacionElevada(
    grupoEsc,
    [[4, 2.0, -24], [-10, 2.2, -32], [-24, 2.4, -34]],
    {
      anchoPista: 2.8,
      anchoPiano: 0.24,
      matSuperficie: matAsfalto,
      matBorde: matBordeHangar,
      tipoSuperficie: 'pista_asfalto',
      barandas: false,
      conPilares: true,
      colorPilar: 0x0369a1,
      peralte: 0,
      pasos: 4
    }
  );
  crearMuroAtajoDerribable(grupoEsc, -10.0, 2.2, -32.0, 0.0, 1.0, [0x38bdf8, 0xfacc15, 0x0284c7, 0xf8fafc]);

  crearMetaYEnlaceTallerEnGrupo(grupoEsc, 32.0, anchoPista, 'pista_asfalto', 0x38bdf8, matAsfalto);

  // 5 Checkpoints híbridos (columna en trazado principal + Gran Anillo Aéreo y radioVertical = 11.0)
  [
    { indice: 0, x: 44.0, y: 4.5, z: 0.0, dir: [-0.2, 0, -0.98], ancho: anchoPista, radio: 4.6, radioVertical: 11.0, anilloAereoY: 8.5, anilloRadio: 3.8 },
    { indice: 1, x: 4.0, y: 2.0, z: -24.0, dir: [-0.9, 0, 0.42], ancho: anchoPista, radio: 4.6, radioVertical: 11.0, anilloAereoY: 6.5, anilloRadio: 3.8 },
    { indice: 2, x: -24.0, y: 2.4, z: -34.0, dir: [-0.7, 0, -0.7], ancho: anchoPista, radio: 4.6, radioVertical: 11.0, anilloAereoY: 7.5, anilloRadio: 3.8 },
    { indice: 3, x: -44.0, y: 0.15, z: -8.0, dir: [0, 0, 1], ancho: anchoPista, radio: 4.6, radioVertical: 11.0, anilloAereoY: 5.8, anilloRadio: 3.8 },
    { indice: 4, x: -30.0, y: 0.0, z: 32.0, dir: [1, 0, 0], ancho: anchoPista, radio: 4.6, radioVertical: 11.0, anilloAereoY: 4.8, anilloRadio: 3.8 }
  ].forEach((cp) => crearArcoCheckpointEnGrupo(grupoEsc, cp, anchoPista));

  // 18 Boost Pads: 8 en trazado principal + 2 seguidos en ruta elevada Oeste + 8 Anillos Turbo Aéreos en zig-zag (Y = 3.8..13.2 m)
  crearBoostPadsEnGrupo(grupoEsc, [
    { pos: [-14.0, 0.024, 32.0], dir: [1, 0, 0] },
    { pos: [5.0, 0.55, 32.0], dir: [1, 0, 0] },
    { pos: [43.5, 4.52, -8.0], dir: [-0.15, 0, -0.98] },
    { pos: [26.0, 3.82, -32.0], dir: [-0.9, 0, 0.35] },
    { pos: [-10.0, 1.22, -16.0], dir: [-0.85, 0, -0.52] },
    { pos: [-32.0, 1.72, -30.0], dir: [-0.7, 0, 0.7] },
    { pos: [-42.0, 1.17, 21.0], dir: [0.35, 0, 0.93] },
    { pos: [-23.0, 0.024, 32.0], dir: [1, 0, 0] },
    // 2 seguidos en ruta elevada Oeste
    { pos: [-37.0, 3.224, -4.0], dir: [0, 0, 1] },
    { pos: [-36.5, 3.224, 10.0], dir: [0.05, 0, 0.99] },
    // 8 Anillos Turbo Aéreos en zig-zag ascendente/descendente
    { pos: [12.0, 3.8, 32.0], dir: [1, 0, 0], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [41.0, 5.8, 12.0], dir: [0.15, 0, -0.98], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [38.0, 8.6, -20.0], dir: [-0.55, 0, -0.83], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [15.0, 11.2, -29.0], dir: [-0.9, 0, 0.4], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [-10.0, 13.2, -18.0], dir: [-0.7, 0, -0.7], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [-28.0, 10.4, -32.0], dir: [-0.7, 0, 0.7], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [-43.5, 7.2, -14.0], dir: [0, 0, 1], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 },
    { pos: [-40.5, 4.6, 22.0], dir: [0.55, 0, 0.83], esAnilloAereo: true, radio: 3.6, margenY: 3.8, factorImpulso: 1.4 }
  ]);

  // 14 balizas luminosas derribables (+ 8 bloques del muro del atajo = 22 obstáculos dinámicos)
  [
    [-10.0, 0.32, 30.8],
    [16.0, 0.82, 33.0],
    [39.0, 2.8, 18.0],
    [45.5, 4.82, -3.0],
    [40.0, 4.82, -16.0],
    [22.0, 3.8, -30.5],
    [10.0, 2.6, -26.5],
    [-4.0, 1.75, -18.5],
    [-14.0, 1.65, -20.5],
    [-29.0, 2.2, -31.5],
    [-42.5, 0.42, -12.0],
    [-43.0, 1.45, 20.0],
    [-34.0, 0.32, 29.8],
    [-21.0, 0.32, 30.8]
  ].forEach(([bx, by, bz]) => {
    const baliza = new THREE.Mesh(
      crearCajaRedondeada(0.45, 0.6, 0.45, 2, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.4 })
    );
    registrarObstaculoDinamico(grupoEsc, baliza, bx, by, bz, 0.36);
  });

  // 10 drones / barreras móviles (parejas en contrafase en pista y altura)
  crearBarreraMovilTematica(grupoEsc, -18.0, 0.02, 32.0, 0, 1, 0.0, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, 8.0, 0.65, 32.0, 0, 1, Math.PI, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, 26.0, 0.9, 30.0, 0.5, 0.86, 0.6, 0x0284c7, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, 43.0, 4.5, -10.0, 1, 0, 0.0, 0x38bdf8, 0xfacc15);
  crearBarreraMovilTematica(grupoEsc, 20.0, 3.3, -30.0, 0.4, 0.91, Math.PI, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, -4.0, 1.5, -19.0, 0.5, 0.86, 1.2, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, -32.0, 1.7, -30.0, 0.7, 0.7, 2.1, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, -43.5, 0.15, -14.0, 1, 0, 0.0, 0x38bdf8, 0xf8fafc);
  crearBarreraMovilTematica(grupoEsc, 0.0, 6.2, -32.0, 0, 1, 0.8, 0xfacc15, 0x38bdf8);
  crearBarreraMovilTematica(grupoEsc, 40.0, 7.2, 0.0, 1, 0, Math.PI, 0xfacc15, 0x38bdf8);

  // 6 manchas de aceite de turbina en la calzada del hangar
  crearTrampasEnGrupo(grupoEsc, [
    { pos: [-6.0, 0.02, 32.0], radio: 1.65, tipo: 'aceite' },
    { pos: [44.0, 4.5, -5.0], radio: 1.65, tipo: 'aceite' },
    { pos: [15.0, 2.9, -29.0], radio: 1.65, tipo: 'aceite' },
    { pos: [-10.0, 1.2, -16.0], radio: 1.65, tipo: 'aceite' },
    { pos: [-44.0, 0.15, -14.0], radio: 1.65, tipo: 'aceite' },
    { pos: [-37.0, 0.1, 28.0], radio: 1.65, tipo: 'aceite' }
  ]);

  (contenedor || grupoEscenarioActivo).add(grupoEsc);
}

/**
 * Crea el haz de luz volumétrica falsa y las motas de polvo flotando dentro del escenario activo.
 * Por qué: mantiene la atmósfera cálida y viva dentro del escenario activo.
 */
export function crearHazYPolvoVentana(contenedor = grupoEscenarioActivo, hab = CATALOGO_HABITACIONES.habitacion_andy) {
  const geoHaz = new THREE.ConeGeometry(5.2, 22.0, 32, 1, true);
  const matHaz = new THREE.MeshBasicMaterial({
    color: hab.id === 'habitacion_hangar' ? 0x38bdf8 : 0xfff3c4,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mallaHaz = new THREE.Mesh(geoHaz, matHaz);
  mallaHaz.position.set(-hab.dimensiones.ancho * 0.38, Math.min(4.2, hab.dimensiones.alto * 0.4), 0.0);
  mallaHaz.rotation.z = -1.16;
  (contenedor || grupoEscenarioActivo).add(mallaHaz);

  const cantidadParticulas = hab.ambiente.cantidadParticulas || CANTIDAD_POLVO;
  const techoPolvo = hab.ambiente.techoParticulas || 6.2;
  const rangoX = hab.dimensiones.ancho * 0.48;
  const geoPolvo = new THREE.BufferGeometry();
  const posiciones = new Float32Array(cantidadParticulas * 3);
  const velocidades = [];

  for (let i = 0; i < cantidadParticulas; i++) {
    posiciones[i * 3] = -rangoX + Math.random() * (rangoX * 1.15);
    posiciones[i * 3 + 1] = 0.2 + Math.random() * Math.max(0.5, techoPolvo - 0.2);
    posiciones[i * 3 + 2] = -12.0 + Math.random() * 24.0;
    velocidades.push({
      vy: 0.03 + Math.random() * 0.06,
      fase: Math.random() * Math.PI * 2
    });
  }

  geoPolvo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  const matPolvo = new THREE.PointsMaterial({
    map: bancoTexturas.chispaPolvo,
    color: hab.id === 'habitacion_hangar' ? 0xbae6fd : 0xfff5d6,
    size: 0.14,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  sistemaPolvo = new THREE.Points(geoPolvo, matPolvo);
  sistemaPolvo.userData.velocidades = velocidades;
  (contenedor || grupoEscenarioActivo).add(sistemaPolvo);
}

/**
 * Desmonta de forma segura el escenario actual, limpia GPU y colisionadores globales,
 * reconstruye la habitación solicitada en grupoEscenarioActivo y carga su récord en localStorage.
 */
export function cargarEscenario(idHabitacion = estadoCarro.idHabitacion) {
  const hab = CATALOGO_HABITACIONES[idHabitacion] || CATALOGO_HABITACIONES.habitacion_andy;
  estadoCarro.idHabitacion = hab.id;

  camara.far = Math.max(280, hab.dimensiones.ancho * 3);
  camara.updateProjectionMatrix();

  mallasSuperficieConducible.length = 0;
  obstaculosHabitacion.length = 0;
  plataformasTurbo.length = 0;
  obstaculosDinamicos.length = 0;
  obstaculosMoviles.length = 0;
  trampasPista.length = 0;
  checkpointsPista.length = 0;
  sistemaPolvo = null;

  liberarObjeto3D(grupoEscenarioActivo);
  while (grupoEscenarioActivo.children.length > 0) {
    grupoEscenarioActivo.remove(grupoEscenarioActivo.children[0]);
  }
  if (grupoEscenarioActivo.parent !== escena) {
    escena.add(grupoEscenarioActivo);
  }

  if (escena.background && typeof escena.background.setHex === 'function') {
    escena.background.setHex(hab.ambiente.colorFondo);
  } else {
    escena.background = new THREE.Color(hab.ambiente.colorFondo);
  }

  crearIluminacion(grupoEscenarioActivo, hab);
  if (hab.id === 'habitacion_acuatica') {
    construirEscenarioAcuatico(grupoEscenarioActivo);
  } else if (hab.id === 'habitacion_atico') {
    construirEscenarioAtico(grupoEscenarioActivo);
  } else if (hab.id === 'habitacion_hangar') {
    construirEscenarioHangar(grupoEscenarioActivo);
  } else {
    construirHabitacionExpandida(grupoEscenarioActivo);
    construirPistaDeCarreras(grupoEscenarioActivo);
  }
  crearHazYPolvoVentana(grupoEscenarioActivo, hab);

  estadoCronometro.vueltaActiva = false;
  estadoCronometro.tiempoActual = 0;
  estadoCronometro.checkpointActual = 0;
  estadoCronometro.avisoRecord = 0;
  estadoCronometro.totalCheckpoints = checkpointsPista.length || 5;
  estadoCronometro.mejorVuelta =
    typeof estadoCronometro.leerRecord === 'function'
      ? estadoCronometro.leerRecord(hab.id, estadoCarro.claseVehiculo)
      : null;

  return hab;
}
