import {
  crearCajaRedondeada,
  crearTexturaBandaRodadura,
  crearTexturaDiscoFreno,
  crearTexturaTablero
} from './recursos.js';

/**
 * Crea el material físico con barniz brillante (clearcoat 1) y acabado de competición.
 * Por qué: potencia los tonos vivos de la nueva paleta deportiva.
 */
export function crearMaterialPintura(colorHex) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    metalness: 0.32,
    roughness: 0.18
  });
}

/**
 * Crea el material de cristal semitransparente para la cabina.
 * Por qué: usa DoubleSide y depthWrite:false para permitir ver con nitidez desde
 * la cámara interior de cabina hacia la pista (B2 y C3).
 */
export function crearMaterialCristalCabina() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.20,
    roughness: 0.06,
    metalness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}

/**
 * Añade faros LED afilados y luces traseras deportivas a la carrocería.
 * Por qué: aporta realismo exterior e inmersión sin duplicar el volante interior articulado.
 */
export function agregarDetallesCarroceria(grupo, largoX, altoY, anchoZ) {
  const matFaro = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f7ff,
    emissiveIntensity: 1.0,
    roughness: 0.15
  });
  const matTrasera = new THREE.MeshStandardMaterial({
    color: 0xff1e27,
    emissive: 0xff1111,
    emissiveIntensity: 0.85,
    roughness: 0.25
  });

  [-1, 1].forEach((signo) => {
    const faro = new THREE.Mesh(crearCajaRedondeada(0.06, 0.045, 0.15, 3, 0.015), matFaro);
    faro.position.set(largoX / 2 - 0.01, altoY, signo * (anchoZ * 0.33));
    faro.rotation.y = signo * -0.18;

    const luzTrasera = new THREE.Mesh(crearCajaRedondeada(0.05, 0.045, 0.17, 3, 0.015), matTrasera);
    luzTrasera.position.set(-largoX / 2 + 0.01, altoY + 0.02, signo * (anchoZ * 0.31));
    grupo.add(faro, luzTrasera);
  });
}

/**
 * Construye un interior de habitáculo detallado con bañera oscura, asientos baquet,
 * consola central con palanca de cambios, salpicadero retroiluminado con textura procedural,
 * volante 3D articulado ('volanteCabina'), pilares de parabrisas y espejos retrovisores.
 */
export function crearInteriorDetallado(config) {
  const {
    xInicio,
    xFin,
    yPiso,
    yTecho,
    anchoInt,
    yVentanaBase,
    posVolante,
    radioVolante = 0.058,
    xTablero = posVolante[0] + 0.10,
    xParabrisasBot = xTablero + 0.04,
    xParabrisasTop = xTablero - 0.14,
    xLunetaTop = xInicio + 0.04,
    xLunetaBot = xInicio - 0.14,
    monoplaza = false,
    conCabinaCerrada = true,
    colorHex = 0xff1e27
  } = config;

  const gInt = new THREE.Group();
  const matPisoInt = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.88, metalness: 0.08 });
  const matTapizAsiento = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78, metalness: 0.05 });
  const matAcentoColor = crearMaterialPintura(colorHex);
  const matTableroBase = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65, metalness: 0.15 });
  const matAluminio = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.22, metalness: 0.90 });
  const matPomo = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const matNegroVolante = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.55, metalness: 0.1 });
  const matEspejo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.08, metalness: 0.96 });
  const texTablero = crearTexturaTablero();
  const matPantallaTablero = new THREE.MeshStandardMaterial({
    map: texTablero,
    emissive: 0xffffff,
    emissiveMap: texTablero,
    emissiveIntensity: 0.85,
    roughness: 0.35
  });

  // 1. Piso del habitáculo y mamparo trasero
  const largoInt = Math.max(0.24, xFin - xInicio);
  const centroX = (xInicio + xFin) * 0.5;
  const piso = new THREE.Mesh(crearCajaRedondeada(largoInt, 0.016, anchoInt, 2, 0.004), matPisoInt);
  piso.position.set(centroX, yPiso, 0);
  gInt.add(piso);

  // 2. Asientos deportivos baquet (1 central en monoplaza, 2 laterales en el resto)
  const zAsientos = monoplaza ? [0] : [-anchoInt * 0.28, anchoInt * 0.28];
  const anchoAsiento = monoplaza ? Math.min(0.15, anchoInt * 0.78) : Math.min(0.16, anchoInt * 0.34);
  const altoDisp = Math.max(0.14, yTecho - yPiso - 0.03);
  const xAsiento = posVolante[0] - 0.19;

  zAsientos.forEach((zS) => {
    const cojin = new THREE.Mesh(
      crearCajaRedondeada(0.16, 0.036, anchoAsiento, 2, 0.01),
      matTapizAsiento
    );
    cojin.position.set(xAsiento + 0.02, yPiso + 0.024, zS);

    const altoResp = Math.min(0.175, altoDisp * 0.72);
    const respaldo = new THREE.Mesh(
      crearCajaRedondeada(0.036, altoResp, anchoAsiento * 0.92, 2, 0.01),
      matTapizAsiento
    );
    respaldo.position.set(xAsiento - 0.06, yPiso + 0.035 + altoResp * 0.45, zS);
    respaldo.rotation.z = 0.22;

    const cabecera = new THREE.Mesh(
      crearCajaRedondeada(0.034, 0.048, anchoAsiento * 0.62, 2, 0.01),
      matAcentoColor
    );
    cabecera.position.set(xAsiento - 0.088, yPiso + 0.045 + altoResp, zS);
    cabecera.rotation.z = 0.15;

    // Orejeras laterales de sujeción deportiva
    [-1, 1].forEach((lado) => {
      const orejera = new THREE.Mesh(
        crearCajaRedondeada(0.045, altoResp * 0.78, 0.018, 2, 0.005),
        matTableroBase
      );
      orejera.position.set(
        xAsiento - 0.045,
        yPiso + 0.038 + altoResp * 0.42,
        zS + lado * (anchoAsiento * 0.46)
      );
      orejera.rotation.z = 0.22;
      gInt.add(orejera);
    });

    gInt.add(cojin, respaldo, cabecera);
  });

  // 3. Consola central y palanca de cambios (en vehículos biplaza)
  if (!monoplaza) {
    const consola = new THREE.Mesh(
      crearCajaRedondeada(largoInt * 0.74, 0.052, 0.078, 2, 0.012),
      matTableroBase
    );
    consola.position.set(centroX + 0.02, yPiso + 0.03, 0);

    const basePalanca = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.014, 12), matAluminio);
    basePalanca.position.set(posVolante[0] - 0.04, yPiso + 0.06, 0);

    const varilla = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.062, 8), matAluminio);
    varilla.position.set(posVolante[0] - 0.04, yPiso + 0.09, 0);
    varilla.rotation.z = -0.18;

    const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), matPomo);
    pomo.position.set(posVolante[0] - 0.032, yPiso + 0.122, 0);

    gInt.add(consola, basePalanca, varilla, pomo);
  }

  // 4. Salpicadero frontal 3D y cuadro de instrumentos retroiluminado
  const yDash = Math.max(yPiso + 0.09, posVolante[1] - 0.012);
  const anchoDash = monoplaza ? anchoInt * 0.88 : anchoInt * 0.96;
  const salpicadero = new THREE.Mesh(
    crearCajaRedondeada(0.095, 0.088, anchoDash, 3, 0.018),
    matTableroBase
  );
  salpicadero.position.set(xTablero, yDash, 0);

  const visera = new THREE.Mesh(
    crearCajaRedondeada(0.075, 0.016, monoplaza ? 0.13 : anchoDash * 0.46, 2, 0.006),
    matTableroBase
  );
  visera.position.set(xTablero - 0.018, yDash + 0.048, posVolante[2]);

  const anchoPantalla = monoplaza ? 0.11 : Math.min(0.20, anchoDash * 0.44);
  const altoPantalla = monoplaza ? 0.042 : 0.052;
  const pantallaTablero = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoPantalla, altoPantalla),
    matPantallaTablero
  );
  pantallaTablero.position.set(xTablero - 0.049, yDash + 0.012, posVolante[2]);
  pantallaTablero.rotation.y = -Math.PI / 2;

  gInt.add(salpicadero, visera, pantallaTablero);

  // 5. Volante 3D articulado ('volanteCabina') con columna inclinada y marca superior roja
  const grupoColumna = new THREE.Group();
  grupoColumna.position.set(posVolante[0], posVolante[1], posVolante[2]);
  grupoColumna.rotation.order = 'YXZ';
  grupoColumna.rotation.set(-0.34, Math.PI / 2, 0);

  const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.14, 10), matAluminio);
  columna.rotation.x = Math.PI / 2;
  columna.position.set(0, 0, 0.068);
  grupoColumna.add(columna);

  const volante = new THREE.Group();
  volante.name = 'volanteCabina';

  const aro = new THREE.Mesh(new THREE.TorusGeometry(radioVolante, 0.010, 10, 24), matNegroVolante);
  const marcaTop = new THREE.Mesh(
    new THREE.TorusGeometry(radioVolante, 0.0115, 8, 8, 0.34),
    matPomo
  );
  marcaTop.rotation.z = Math.PI / 2 - 0.17;

  const centroVol = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 14), matTableroBase);
  centroVol.rotation.x = Math.PI / 2;

  const brazoHoriz = new THREE.Mesh(new THREE.BoxGeometry(radioVolante * 1.85, 0.012, 0.008), matAluminio);
  const brazoInf = new THREE.Mesh(new THREE.BoxGeometry(0.013, radioVolante * 0.92, 0.008), matAluminio);
  brazoInf.position.y = -radioVolante * 0.45;

  volante.add(aro, marcaTop, centroVol, brazoHoriz, brazoInf);
  grupoColumna.add(volante);
  gInt.add(grupoColumna);

  // 6. Espejos laterales exteriores + parabrisas enmarcado con pilares A y retrovisor central
  const offsetEspejoZ = (monoplaza ? anchoInt * 0.85 : anchoInt * 0.56) + 0.07;
  [-1, 1].forEach((lado) => {
    const zEsp = lado * offsetEspejoZ;
    const brazoEsp = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.065), matTableroBase);
    brazoEsp.position.set(xParabrisasBot - 0.03, yVentanaBase + 0.03, zEsp - lado * 0.032);

    const carcasaEsp = new THREE.Mesh(crearCajaRedondeada(0.034, 0.028, 0.056, 2, 0.008), matAcentoColor);
    carcasaEsp.position.set(xParabrisasBot - 0.028, yVentanaBase + 0.042, zEsp);

    const vidrioEsp = new THREE.Mesh(new THREE.PlaneGeometry(0.046, 0.020), matEspejo);
    vidrioEsp.position.set(xParabrisasBot - 0.046, yVentanaBase + 0.042, zEsp);
    vidrioEsp.rotation.y = -Math.PI / 2;

    gInt.add(brazoEsp, carcasaEsp, vidrioEsp);
  });

  if (conCabinaCerrada) {
    const matCristalLimpio = crearMaterialCristalCabina();
    const altoCabina = Math.max(0.08, yTecho - yVentanaBase);

    // Parabrisas delantero transparente y pilares A laterales
    const dxPar = xParabrisasBot - xParabrisasTop;
    const largoPar = Math.hypot(dxPar, altoCabina);
    const angPar = Math.atan2(dxPar, altoCabina);
    const xParMed = (xParabrisasBot + xParabrisasTop) * 0.5;
    const yParMed = (yVentanaBase + yTecho) * 0.5;

    const parabrisas = new THREE.Mesh(
      new THREE.PlaneGeometry(anchoInt + 0.02, largoPar),
      matCristalLimpio
    );
    parabrisas.position.set(xParMed, yParMed, 0);
    parabrisas.rotation.order = 'YXZ';
    parabrisas.rotation.y = Math.PI / 2;
    parabrisas.rotation.x = -angPar;
    gInt.add(parabrisas);

    // Pilares A delanteros inclinados
    [-1, 1].forEach((lado) => {
      const pilarA = new THREE.Mesh(
        crearCajaRedondeada(0.026, largoPar + 0.01, 0.028, 2, 0.006),
        matTableroBase
      );
      pilarA.position.set(xParMed, yParMed, lado * (anchoInt * 0.52));
      pilarA.rotation.z = angPar;
      gInt.add(pilarA);
    });

    // Pilares traseros (C) y luneta trasera inclinada
    const dxLun = xLunetaTop - xLunetaBot;
    const largoLun = Math.hypot(dxLun, altoCabina);
    const angLun = Math.atan2(dxLun, altoCabina);
    const xLunMed = (xLunetaTop + xLunetaBot) * 0.5;

    const luneta = new THREE.Mesh(
      new THREE.PlaneGeometry(anchoInt * 0.94, largoLun),
      matCristalLimpio
    );
    luneta.position.set(xLunMed, yParMed, 0);
    luneta.rotation.order = 'YXZ';
    luneta.rotation.y = -Math.PI / 2;
    luneta.rotation.x = -angLun;
    gInt.add(luneta);

    [-1, 1].forEach((lado) => {
      const pilarC = new THREE.Mesh(
        crearCajaRedondeada(0.034, largoLun + 0.01, 0.03, 2, 0.006),
        matAcentoColor
      );
      pilarC.position.set(xLunMed, yParMed, lado * (anchoInt * 0.52));
      pilarC.rotation.z = -angLun;
      gInt.add(pilarC);
    });

    // Retrovisor interior central suspendido del marco superior
    const retroCen = new THREE.Mesh(crearCajaRedondeada(0.018, 0.024, 0.095, 2, 0.005), matTableroBase);
    retroCen.position.set(xParabrisasTop + 0.025, yTecho - 0.024, 0);
    const caraCen = new THREE.Mesh(new THREE.PlaneGeometry(0.084, 0.018), matEspejo);
    caraCen.position.set(xParabrisasTop + 0.015, yTecho - 0.024, 0);
    caraCen.rotation.y = -Math.PI / 2;
    gInt.add(retroCen, caraCen);
  }

  return gInt;
}

/**
 * Añade un disco de freno ventilado con textura radial y una mordaza roja deportiva
 * en el interior de cada conjunto de rueda.
 */
function agregarDiscoYMordaza(grupo, radioDisco = 0.088) {
  const matDisco = new THREE.MeshStandardMaterial({
    map: crearTexturaDiscoFreno(),
    metalness: 0.82,
    roughness: 0.28
  });
  const disco = new THREE.Mesh(
    new THREE.CylinderGeometry(radioDisco, radioDisco, 0.014, 24),
    matDisco
  );
  disco.rotation.x = Math.PI / 2;
  disco.position.z = -0.012;

  const matMordaza = new THREE.MeshPhysicalMaterial({
    color: 0xff1e27,
    clearcoat: 1.0,
    roughness: 0.22,
    metalness: 0.25
  });
  const mordaza = new THREE.Mesh(
    crearCajaRedondeada(0.042, 0.078, 0.036, 2, 0.008),
    matMordaza
  );
  mordaza.position.set(radioDisco * 0.58, radioDisco * 0.35, -0.004);
  mordaza.rotation.z = -0.45;

  grupo.add(disco, mordaza);
}

/**
 * Crea el material de caucho con banda de rodadura procedural (bumpMap y roughnessMap).
 */
function crearMaterialCaucho(estilo = 'deportiva', colorHex = 0x1a1e26) {
  const texRodadura = crearTexturaBandaRodadura(estilo);
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    bumpMap: texRodadura,
    bumpScale: 0.025,
    roughnessMap: texRodadura,
    roughness: 0.9,
    metalness: 0.06
  });
}

/**
 * Calcula los atributos físicos derivados del chasis (VEL, ACEL, CTRL).
 */
function crearAtributosChasis(velocidad, aceleracion, control, agarreDerrape, pesoImpacto) {
  return {
    velMax: +((2.5 + velocidad * 0.065) * 1.20 * 1.30).toFixed(3),
    aceleracion: +((1.8 + aceleracion * 0.065) * 1.18 * 1.30).toFixed(3),
    manejo: +(1.1 + control * 0.022).toFixed(3),
    agarreDerrape,
    pesoImpacto,
    statsUI: { velocidad, aceleracion, control }
  };
}

/**
 * Construye tablero retroiluminado y mando articulado ('volanteCabina') para moto, barco o avión.
 */
function crearConsolaMandoVehiculo(tipo, posMando, colorHex = 0xff1e27) {
  const g = new THREE.Group();
  const matOscuro = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.2 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.9 });
  const matAcento = crearMaterialPintura(colorHex);
  const texTab = crearTexturaTablero();
  texTab.userData = { ...(texTab.userData || {}), esClonTemporal: true };
  const matPantalla = new THREE.MeshStandardMaterial({
    map: texTab,
    emissive: 0xffffff,
    emissiveMap: texTab,
    emissiveIntensity: 0.85,
    roughness: 0.35
  });

  const consola = new THREE.Mesh(crearCajaRedondeada(0.11, 0.075, 0.19, 2, 0.015), matOscuro);
  consola.position.set(posMando[0] + 0.08, posMando[1] + 0.03, posMando[2]);
  consola.rotation.z = 0.28;

  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.145, 0.052), matPantalla);
  pantalla.position.set(posMando[0] + 0.045, posMando[1] + 0.048, posMando[2]);
  pantalla.rotation.set(0, -Math.PI / 2, 0);

  const pivote = new THREE.Group();
  pivote.name = 'volanteCabina';
  pivote.position.set(posMando[0], posMando[1], posMando[2]);
  pivote.rotation.set(0, Math.PI / 2, 0.35);

  if (tipo === 'manillar') {
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 12), matMetal);
    barra.rotation.z = Math.PI / 2;
    [-0.14, 0.14].forEach((px) => {
      const puno = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.085, 10), matAcento);
      puno.rotation.z = Math.PI / 2;
      puno.position.set(px, 0, 0);
      pivote.add(puno);
    });
    pivote.add(barra);
  } else if (tipo === 'yugo') {
    const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 12), matMetal);
    eje.rotation.x = Math.PI / 2;
    const barraHoriz = new THREE.Mesh(crearCajaRedondeada(0.16, 0.022, 0.022, 2, 0.006), matOscuro);
    [-0.072, 0.072].forEach((cx) => {
      const cuerno = new THREE.Mesh(crearCajaRedondeada(0.022, 0.085, 0.024, 2, 0.008), matAcento);
      cuerno.position.set(cx, 0.028, 0);
      pivote.add(cuerno);
    });
    pivote.add(eje, barraHoriz);
  } else {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 10, 22), matMetal);
    const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.022, 12), matOscuro);
    centro.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const radio = new THREE.Mesh(crearCajaRedondeada(0.13, 0.012, 0.012, 2, 0.004), matAcento);
      radio.rotation.z = (i * Math.PI) / 4;
      pivote.add(radio);
    }
    pivote.add(aro, centro);
  }

  g.add(consola, pantalla, pivote);
  return g;
}

/**
 * Crea una rueda estrecha para motocicleta con neumático toroidal, rin y disco ventilado.
 */
function crearMallaRuedaMoto(radio, grosor, estiloCaucho, colorRin, conNeon = false) {
  const g = new THREE.Group();
  const texCaucho = crearTexturaBandaRodadura(estiloCaucho);
  texCaucho.userData = { ...(texCaucho.userData || {}), esClonTemporal: true };
  const matCaucho = new THREE.MeshStandardMaterial({
    color: 0x161920,
    bumpMap: texCaucho,
    bumpScale: 0.022,
    roughnessMap: texCaucho,
    roughness: 0.88,
    metalness: 0.08
  });
  const matRin = new THREE.MeshStandardMaterial({ color: colorRin, roughness: 0.25, metalness: 0.88 });

  const neumatico = new THREE.Mesh(new THREE.TorusGeometry(radio, grosor, 18, 32), matCaucho);
  neumatico.castShadow = true;
  g.add(neumatico);

  agregarDiscoYMordaza(g, radio * 0.72);

  for (let i = 0; i < 6; i++) {
    const brazo = new THREE.Mesh(crearCajaRedondeada(radio * 1.48, 0.014, 0.016, 2, 0.004), matRin);
    brazo.rotation.z = (i * Math.PI) / 6;
    g.add(brazo);
  }

  const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.048, 14), matRin);
  buje.rotation.x = Math.PI / 2;
  g.add(buje);

  if (conNeon) {
    const matNeon = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    [-0.022, 0.022].forEach((zOff) => {
      const aroNeon = new THREE.Mesh(new THREE.TorusGeometry(radio * 0.78, 0.008, 8, 28), matNeon);
      aroNeon.position.z = zOff;
      g.add(aroNeon);
    });
  }

  return g;
}

// Tabla de CARROCERÍAS deportivas con presupuesto de 120 puntos (VEL + ACEL + CTRL = 120)
export const TABLA_CARROCERIAS = [
  {
    id: 'carroceria_sedan',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Sedán GT Turbo',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(60, 40, 40, 0.84, 1.0),
    vistaCabina: [-0.08, 0.435, -0.13],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.46, 0.16, 0.41], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.46, 0.16, -0.41], rotacion: [0, Math.PI, 0], escala: [1, 1, 1] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.46, 0.16, 0.41], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.46, 0.16, -0.41], rotacion: [0, Math.PI, 0], escala: [1, 1, 1] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.10, 0.52, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    /**
     * Construye la malla 3D de la carrocería Sedán GT Turbo con habitáculo hueco e interior completo.
     */
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.42, metalness: 0.25 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 });

      // Plataforma inferior y secciones frontal/trasera/puertas dejando bañera interior abierta
      const pisoChasis = new THREE.Mesh(crearCajaRedondeada(1.44, 0.08, 0.70, 4, 0.03), matPintura);
      pisoChasis.position.y = 0.17;
      pisoChasis.castShadow = true;
      pisoChasis.receiveShadow = true;

      const bloqueFrontal = new THREE.Mesh(crearCajaRedondeada(0.50, 0.12, 0.70, 3, 0.03), matPintura);
      bloqueFrontal.position.set(0.47, 0.27, 0);
      bloqueFrontal.castShadow = true;

      const bloqueTrasero = new THREE.Mesh(crearCajaRedondeada(0.38, 0.12, 0.70, 3, 0.03), matPintura);
      bloqueTrasero.position.set(-0.53, 0.27, 0);
      bloqueTrasero.castShadow = true;

      [-0.295, 0.295].forEach((zPuerta) => {
        const puerta = new THREE.Mesh(crearCajaRedondeada(0.58, 0.12, 0.11, 3, 0.025), matPintura);
        puerta.position.set(-0.06, 0.27, zPuerta);
        puerta.castShadow = true;
        g.add(puerta);
      });

      // Capó inclinado y toma de aire turbo
      const capo = new THREE.Mesh(crearCajaRedondeada(0.46, 0.06, 0.62, 3, 0.025), matPintura);
      capo.position.set(0.42, 0.32, 0);
      capo.rotation.z = -0.07;
      capo.castShadow = true;

      const tomaAire = new THREE.Mesh(crearCajaRedondeada(0.18, 0.04, 0.22, 3, 0.015), matCarbono);
      tomaAire.position.set(0.36, 0.355, 0);

      const techo = new THREE.Mesh(crearCajaRedondeada(0.48, 0.032, 0.50, 3, 0.015), matPintura);
      techo.position.set(-0.14, 0.51, 0);
      techo.castShadow = true;

      // Splitter frontal en carbono
      const splitter = new THREE.Mesh(crearCajaRedondeada(0.14, 0.035, 0.74, 3, 0.012), matCarbono);
      splitter.position.set(0.71, 0.125, 0);
      splitter.castShadow = true;

      // Faldones laterales entre los pasos de rueda
      [-0.365, 0.365].forEach((zPos) => {
        const faldon = new THREE.Mesh(crearCajaRedondeada(0.48, 0.055, 0.06, 2, 0.015), matCarbono);
        faldon.position.set(0, 0.145, zPos);
        g.add(faldon);
      });

      // Difusor trasero y doble escape cromado
      const difusor = new THREE.Mesh(crearCajaRedondeada(0.10, 0.07, 0.66, 3, 0.018), matCarbono);
      difusor.position.set(-0.71, 0.145, 0);

      [-0.19, 0.19].forEach((zEsc) => {
        const escape = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.10, 14), matCromo);
        escape.rotation.z = Math.PI / 2;
        escape.position.set(-0.74, 0.14, zEsc);
        g.add(escape);
      });

      const interior = crearInteriorDetallado({
        xInicio: -0.34,
        xFin: 0.22,
        yPiso: 0.215,
        yTecho: 0.495,
        anchoInt: 0.46,
        yVentanaBase: 0.33,
        posVolante: [0.10, 0.365, -0.13],
        radioVolante: 0.056,
        xParabrisasBot: 0.25,
        xParabrisasTop: 0.08,
        xLunetaTop: -0.36,
        xLunetaBot: -0.50,
        colorHex
      });

      g.add(pisoChasis, bloqueFrontal, bloqueTrasero, capo, tomaAire, techo, splitter, difusor, interior);
      agregarDetallesCarroceria(g, 1.44, 0.25, 0.68);
      return g;
    }
  },
  {
    id: 'carroceria_camioneta',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Camioneta Raptor Sport',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(50, 48, 42, 0.90, 1.45),
    vistaCabina: [0.02, 0.565, -0.15],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.50, 0.19, 0.45], rotacion: [0, 0, 0], escala: [1.12, 1.12, 1.12] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.50, 0.19, -0.45], rotacion: [0, Math.PI, 0], escala: [1.12, 1.12, 1.12] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.50, 0.19, 0.45], rotacion: [0, 0, 0], escala: [1.12, 1.12, 1.12] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.50, 0.19, -0.45], rotacion: [0, Math.PI, 0], escala: [1.12, 1.12, 1.12] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [0.12, 0.68, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    /**
     * Construye la malla 3D de la Camioneta Raptor Sport con cabina interior abierta.
     */
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matNegro = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.58, metalness: 0.2 });
      const matPlata = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 });
      const matAux = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffdd55, emissiveIntensity: 0.9, roughness: 0.2 });

      // Plataforma inferior, bloque motor delantero, platón trasero y puertas laterales
      const pisoChasis = new THREE.Mesh(crearCajaRedondeada(1.54, 0.10, 0.74, 4, 0.03), matPintura);
      pisoChasis.position.y = 0.24;
      pisoChasis.castShadow = true;
      pisoChasis.receiveShadow = true;

      const bloqueFrontal = new THREE.Mesh(crearCajaRedondeada(0.41, 0.14, 0.74, 3, 0.03), matPintura);
      bloqueFrontal.position.set(0.565, 0.36, 0);
      bloqueFrontal.castShadow = true;

      const bloquePlaton = new THREE.Mesh(crearCajaRedondeada(0.63, 0.14, 0.74, 3, 0.03), matPintura);
      bloquePlaton.position.set(-0.455, 0.36, 0);
      bloquePlaton.castShadow = true;

      [-0.32, 0.32].forEach((zPuerta) => {
        const puerta = new THREE.Mesh(crearCajaRedondeada(0.52, 0.14, 0.10, 3, 0.025), matPintura);
        puerta.position.set(0.11, 0.36, zPuerta);
        puerta.castShadow = true;
        g.add(puerta);
      });

      const techo = new THREE.Mesh(crearCajaRedondeada(0.48, 0.042, 0.56, 3, 0.02), matPintura);
      techo.position.set(0.06, 0.66, 0);
      techo.castShadow = true;

      // Platón trasero abierto con bordas
      [-0.32, 0.32].forEach((zBorda) => {
        const borda = new THREE.Mesh(crearCajaRedondeada(0.58, 0.13, 0.08, 3, 0.02), matPintura);
        borda.position.set(-0.46, 0.47, zBorda);
        borda.castShadow = true;
        g.add(borda);
      });
      const compuerta = new THREE.Mesh(crearCajaRedondeada(0.08, 0.13, 0.68, 3, 0.02), matPintura);
      compuerta.position.set(-0.73, 0.47, 0);

      // Barra antivuelco deportiva en el platón con focos auxiliares
      [-0.27, 0.27].forEach((zBarra) => {
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12), matNegro);
        poste.position.set(-0.24, 0.56, zBarra);
        const tirante = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 12), matNegro);
        tirante.position.set(-0.37, 0.55, zBarra);
        tirante.rotation.z = 0.65;
        g.add(poste, tirante);
      });
      const barraSup = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.58, 12), matNegro);
      barraSup.rotation.x = Math.PI / 2;
      barraSup.position.set(-0.24, 0.68, 0);
      g.add(barraSup);

      [-0.16, 0, 0.16].forEach((zFoco) => {
        const focoBarra = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 12), matAux);
        focoBarra.rotation.z = Math.PI / 2;
        focoBarra.position.set(-0.22, 0.71, zFoco);
        g.add(focoBarra);
      });

      // Guardabarros ensanchados deportivos sobre las 4 ruedas
      [0.50, -0.50].forEach((xRueda) => {
        [-0.39, 0.39].forEach((zLado) => {
          const aleta = new THREE.Mesh(crearCajaRedondeada(0.36, 0.08, 0.12, 3, 0.025), matNegro);
          aleta.position.set(xRueda, 0.38, zLado);
          aleta.castShadow = true;
          g.add(aleta);
        });
      });

      // Parrilla frontal negra con luces auxiliares y placa protectora de competición
      const parrilla = new THREE.Mesh(crearCajaRedondeada(0.07, 0.15, 0.46, 3, 0.02), matNegro);
      parrilla.position.set(0.77, 0.33, 0);
      [-0.14, 0, 0.14].forEach((zLed) => {
        const led = new THREE.Mesh(crearCajaRedondeada(0.03, 0.025, 0.05, 2, 0.008), matAux);
        led.position.set(0.80, 0.35, zLed);
        g.add(led);
      });

      const defensaComp = new THREE.Mesh(crearCajaRedondeada(0.10, 0.09, 0.76, 3, 0.025), matNegro);
      defensaComp.position.set(0.76, 0.21, 0);
      const placaSkid = new THREE.Mesh(crearCajaRedondeada(0.14, 0.04, 0.36, 2, 0.01), matPlata);
      placaSkid.position.set(0.74, 0.16, 0);
      placaSkid.rotation.z = 0.4;

      const interior = crearInteriorDetallado({
        xInicio: -0.14,
        xFin: 0.36,
        yPiso: 0.295,
        yTecho: 0.64,
        anchoInt: 0.52,
        yVentanaBase: 0.43,
        posVolante: [0.22, 0.485, -0.15],
        radioVolante: 0.064,
        xParabrisasBot: 0.38,
        xParabrisasTop: 0.27,
        xLunetaTop: -0.16,
        xLunetaBot: -0.18,
        colorHex
      });

      g.add(pisoChasis, bloqueFrontal, bloquePlaton, techo, compuerta, parrilla, defensaComp, placaSkid, interior);
      agregarDetallesCarroceria(g, 1.54, 0.34, 0.72);
      return g;
    }
  },
  {
    id: 'carroceria_deportivo',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Hiperdeportivo Le Mans',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(78, 36, 26, 0.82, 0.95),
    vistaCabina: [-0.08, 0.365, -0.125],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.48, 0.15, 0.42], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.48, 0.15, -0.42], rotacion: [0, Math.PI, 0], escala: [1, 1, 1] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.48, 0.15, 0.42], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.48, 0.15, -0.42], rotacion: [0, Math.PI, 0], escala: [1, 1, 1] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.46, 0.39, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    /**
     * Construye la malla 3D del Hiperdeportivo Le Mans con habitáculo de competición.
     */
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.38, metalness: 0.3 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 });

      // Plataforma baja + secciones delantera/trasera/puertas para alojar cabina prototipo
      const pisoChasis = new THREE.Mesh(crearCajaRedondeada(1.52, 0.065, 0.72, 4, 0.03), matPintura);
      pisoChasis.position.y = 0.15;
      pisoChasis.castShadow = true;
      pisoChasis.receiveShadow = true;

      const bloqueFrontal = new THREE.Mesh(crearCajaRedondeada(0.46, 0.10, 0.72, 3, 0.03), matPintura);
      bloqueFrontal.position.set(0.53, 0.23, 0);
      bloqueFrontal.castShadow = true;

      const bloqueTrasero = new THREE.Mesh(crearCajaRedondeada(0.52, 0.11, 0.72, 3, 0.03), matPintura);
      bloqueTrasero.position.set(-0.50, 0.235, 0);
      bloqueTrasero.castShadow = true;

      [-0.30, 0.30].forEach((zLado) => {
        const puerta = new THREE.Mesh(crearCajaRedondeada(0.54, 0.11, 0.12, 3, 0.025), matPintura);
        puerta.position.set(0.03, 0.235, zLado);
        puerta.castShadow = true;
        g.add(puerta);
      });

      // Morro afilado descendente y splitter con aletas canard
      const morro = new THREE.Mesh(crearCajaRedondeada(0.48, 0.10, 0.64, 4, 0.035), matPintura);
      morro.position.set(0.52, 0.18, 0);
      morro.rotation.z = -0.11;
      morro.castShadow = true;

      const splitter = new THREE.Mesh(crearCajaRedondeada(0.18, 0.025, 0.78, 3, 0.01), matCarbono);
      splitter.position.set(0.73, 0.11, 0);
      splitter.castShadow = true;

      // Pasos de rueda delanteros y traseros prominentes estilo prototipo Le Mans
      [0.48, -0.48].forEach((xPaso) => {
        [-0.31, 0.31].forEach((zPaso) => {
          const paso = new THREE.Mesh(crearCajaRedondeada(0.36, 0.12, 0.17, 4, 0.045), matPintura);
          paso.position.set(xPaso, 0.28, zPaso);
          paso.castShadow = true;
          g.add(paso);
        });
      });

      // Entradas de aire laterales esculpidas en carbono
      [-0.36, 0.36].forEach((zToma) => {
        const entrada = new THREE.Mesh(crearCajaRedondeada(0.36, 0.12, 0.06, 3, 0.015), matCarbono);
        entrada.position.set(-0.08, 0.21, zToma);
        g.add(entrada);
      });

      const techo = new THREE.Mesh(crearCajaRedondeada(0.38, 0.032, 0.42, 4, 0.016), matPintura);
      techo.position.set(-0.06, 0.43, 0);
      techo.castShadow = true;

      const cubiertaMotor = new THREE.Mesh(crearCajaRedondeada(0.50, 0.10, 0.42, 3, 0.03), matPintura);
      cubiertaMotor.position.set(-0.42, 0.31, 0);
      cubiertaMotor.castShadow = true;

      const aletaCentral = new THREE.Mesh(crearCajaRedondeada(0.38, 0.08, 0.03, 2, 0.01), matCarbono);
      aletaCentral.position.set(-0.34, 0.39, 0);

      // Difusor trasero de competición con doble escape central
      const difusor = new THREE.Mesh(crearCajaRedondeada(0.14, 0.08, 0.68, 3, 0.02), matCarbono);
      difusor.position.set(-0.74, 0.13, 0);

      [-0.06, 0.06].forEach((zEsc) => {
        const escape = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.10, 14), matCromo);
        escape.rotation.z = Math.PI / 2;
        escape.position.set(-0.77, 0.17, zEsc);
        g.add(escape);
      });

      const interior = crearInteriorDetallado({
        xInicio: -0.24,
        xFin: 0.29,
        yPiso: 0.188,
        yTecho: 0.415,
        anchoInt: 0.44,
        yVentanaBase: 0.28,
        posVolante: [0.11, 0.305, -0.125],
        radioVolante: 0.050,
        xParabrisasBot: 0.31,
        xParabrisasTop: 0.11,
        xLunetaTop: -0.22,
        xLunetaBot: -0.32,
        colorHex
      });

      g.add(pisoChasis, bloqueFrontal, bloqueTrasero, morro, splitter, techo, cubiertaMotor, aletaCentral, difusor, interior);
      agregarDetallesCarroceria(g, 1.52, 0.21, 0.66);
      return g;
    }
  },
  {
    id: 'carroceria_formula',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Monoplaza Fórmula Apex',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(54, 42, 44, 0.94, 0.80),
    vistaCabina: [-0.04, 0.375, 0.0],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.54, 0.16, 0.44], rotacion: [0, 0, 0], escala: [0.98, 0.98, 1.05] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.54, 0.16, -0.44], rotacion: [0, Math.PI, 0], escala: [0.98, 0.98, 1.05] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.50, 0.17, 0.45], rotacion: [0, 0, 0], escala: [1.08, 1.08, 1.25] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.50, 0.17, -0.45], rotacion: [0, Math.PI, 0], escala: [1.08, 1.08, 1.25] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.22, 0.43, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(hex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(hex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.42, metalness: 0.35 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
      const matLuzLluvia = new THREE.MeshStandardMaterial({ color: 0xff1e27, emissive: 0xff1111, emissiveIntensity: 1.6 });

      // Suelo plano y difusor aerodinámico
      const suelo = new THREE.Mesh(crearCajaRedondeada(1.22, 0.032, 0.54, 3, 0.012), matCarbono);
      suelo.position.set(-0.04, 0.095, 0);
      suelo.castShadow = true;

      // Monocasco hueco en la bañera central + morro delantero + cubierta motor trasera
      const monocascoDel = new THREE.Mesh(crearCajaRedondeada(0.36, 0.17, 0.26, 4, 0.042), matPintura);
      monocascoDel.position.set(0.30, 0.195, 0);
      monocascoDel.castShadow = true;

      const monocascoTras = new THREE.Mesh(crearCajaRedondeada(0.28, 0.17, 0.26, 4, 0.042), matPintura);
      monocascoTras.position.set(-0.32, 0.195, 0);
      monocascoTras.castShadow = true;

      [-0.105, 0.105].forEach((zBorde) => {
        const bordeCockpit = new THREE.Mesh(crearCajaRedondeada(0.34, 0.16, 0.05, 3, 0.018), matPintura);
        bordeCockpit.position.set(-0.03, 0.20, zBorde);
        bordeCockpit.castShadow = true;
        g.add(bordeCockpit);
      });

      const morro = new THREE.Mesh(crearCajaRedondeada(0.58, 0.10, 0.18, 4, 0.038), matPintura);
      morro.position.set(0.56, 0.175, 0);
      morro.rotation.z = -0.10;
      morro.castShadow = true;

      // Alerón delantero ancho multipieza
      const alaDelantera = new THREE.Mesh(crearCajaRedondeada(0.20, 0.024, 0.88, 3, 0.01), matCarbono);
      alaDelantera.position.set(0.80, 0.105, 0);
      alaDelantera.castShadow = true;

      const flapDel = new THREE.Mesh(crearCajaRedondeada(0.10, 0.018, 0.82, 2, 0.006), matPintura);
      flapDel.position.set(0.75, 0.128, 0);
      flapDel.rotation.z = 0.22;

      [-0.43, 0.43].forEach((zEnd) => {
        const endplate = new THREE.Mesh(crearCajaRedondeada(0.24, 0.10, 0.024, 2, 0.008), matPintura);
        endplate.position.set(0.79, 0.135, zEnd);
        endplate.castShadow = true;
        g.add(endplate);
      });

      // Pontones laterales (Sidepods) y tomas de refrigeración
      [-0.21, 0.21].forEach((zPonton) => {
        const ponton = new THREE.Mesh(crearCajaRedondeada(0.56, 0.15, 0.17, 4, 0.04), matPintura);
        ponton.position.set(-0.10, 0.185, zPonton);
        ponton.castShadow = true;
        const toma = new THREE.Mesh(crearCajaRedondeada(0.04, 0.10, 0.12, 2, 0.01), matCarbono);
        toma.position.set(0.18, 0.19, zPonton);
        g.add(ponton, toma);
      });

      // Halo de protección elevado sobre la línea de vista para despejar la cámara de cabina
      const pilarHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.15, 10), matCarbono);
      pilarHalo.position.set(0.21, 0.34, 0);
      pilarHalo.rotation.z = -0.35;

      const aroHalo = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.014, 10, 22, Math.PI * 1.28), matCarbono);
      aroHalo.rotation.x = Math.PI / 2;
      aroHalo.rotation.z = -Math.PI * 0.64;
      aroHalo.position.set(0.06, 0.415, 0);

      // Chimenea / cubierta motor + aleta dorsal
      const airbox = new THREE.Mesh(crearCajaRedondeada(0.46, 0.16, 0.18, 4, 0.045), matPintura);
      airbox.position.set(-0.26, 0.33, 0);
      airbox.castShadow = true;

      const aletaDorsal = new THREE.Mesh(crearCajaRedondeada(0.36, 0.11, 0.022, 2, 0.006), matCarbono);
      aletaDorsal.position.set(-0.36, 0.38, 0);

      // Brazos de suspensión expuestos hacia las 4 ruedas
      const posEjes = [
        { x: 0.54, y: 0.16, zBase: 0.10, zExt: 0.36 },
        { x: -0.50, y: 0.17, zBase: 0.11, zExt: 0.37 }
      ];
      posEjes.forEach((eje) => {
        [-1, 1].forEach((signoZ) => {
          [0.05, -0.05].forEach((offX) => {
            const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.28), matCarbono);
            brazo.position.set(eje.x + offX * 0.5, eje.y, signoZ * ((eje.zBase + eje.zExt) * 0.5));
            brazo.rotation.y = signoZ * offX * 2.2;
            g.add(brazo);
          });
        });
      });

      // Alerón trasero de competición + luz de lluvia LED
      const alaTrasera = new THREE.Mesh(crearCajaRedondeada(0.16, 0.025, 0.68, 3, 0.008), matCarbono);
      alaTrasera.position.set(-0.70, 0.42, 0);
      alaTrasera.rotation.z = 0.14;
      alaTrasera.castShadow = true;

      [-0.33, 0.33].forEach((zEnd) => {
        const placa = new THREE.Mesh(crearCajaRedondeada(0.18, 0.22, 0.022, 2, 0.008), matPintura);
        placa.position.set(-0.69, 0.33, zEnd);
        placa.castShadow = true;
        g.add(placa);
      });

      const luzLluvia = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.05), matLuzLluvia);
      luzLluvia.position.set(-0.74, 0.17, 0);
      const escapeCentral = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.12, 14), matCromo);
      escapeCentral.rotation.z = Math.PI / 2;
      escapeCentral.position.set(-0.70, 0.22, 0);

      const interior = crearInteriorDetallado({
        xInicio: -0.20,
        xFin: 0.18,
        yPiso: 0.115,
        yTecho: 0.39,
        anchoInt: 0.17,
        yVentanaBase: 0.25,
        posVolante: [0.10, 0.29, 0.0],
        radioVolante: 0.044,
        xTablero: 0.17,
        xParabrisasBot: 0.16,
        monoplaza: true,
        conCabinaCerrada: false,
        colorHex: hex
      });

      g.add(suelo, monocascoDel, monocascoTras, morro, alaDelantera, flapDel, pilarHalo, aroHalo, airbox, aletaDorsal, alaTrasera, luzLluvia, escapeCentral, interior);
      return g;
    }
  },
  {
    id: 'carroceria_muscle',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Muscle V8 Drift King',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(68, 44, 28, 0.64, 1.25),
    vistaCabina: [-0.10, 0.42, -0.135],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.48, 0.16, 0.43], rotacion: [0, 0, 0], escala: [1.0, 1.0, 1.0] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.48, 0.16, -0.43], rotacion: [0, Math.PI, 0], escala: [1.0, 1.0, 1.0] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.48, 0.17, 0.44], rotacion: [0, 0, 0], escala: [1.06, 1.06, 1.16] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.48, 0.17, -0.44], rotacion: [0, Math.PI, 0], escala: [1.06, 1.06, 1.16] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.12, 0.50, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(hex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(hex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.42, metalness: 0.3 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.14, metalness: 0.96 });
      const matRojoToma = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.25 });

      const pisoChasis = new THREE.Mesh(crearCajaRedondeada(1.56, 0.08, 0.72, 4, 0.03), matPintura);
      pisoChasis.position.set(0, 0.15, 0);
      pisoChasis.castShadow = true;
      pisoChasis.receiveShadow = true;

      const bloqueFrontal = new THREE.Mesh(crearCajaRedondeada(0.58, 0.14, 0.72, 3, 0.03), matPintura);
      bloqueFrontal.position.set(0.49, 0.26, 0);
      bloqueFrontal.castShadow = true;

      const bloqueTrasero = new THREE.Mesh(crearCajaRedondeada(0.42, 0.14, 0.72, 3, 0.03), matPintura);
      bloqueTrasero.position.set(-0.57, 0.26, 0);
      bloqueTrasero.castShadow = true;

      [-0.30, 0.30].forEach((zPuerta) => {
        const puerta = new THREE.Mesh(crearCajaRedondeada(0.58, 0.14, 0.12, 3, 0.025), matPintura);
        puerta.position.set(-0.08, 0.26, zPuerta);
        puerta.castShadow = true;
        g.add(puerta);
      });

      // Franjas de competición blancas/carbono sobre el centro
      [-0.08, 0.08].forEach((zFranja) => {
        const franjaCapo = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.085), matCarbono);
        franjaCapo.position.set(0.49, 0.33, zFranja);
        const franjaTecho = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.012, 0.085), matCarbono);
        franjaTecho.position.set(-0.14, 0.50, zFranja);
        g.add(franjaCapo, franjaTecho);
      });

      // Splitter delantero agresivo y pasos de rueda ensanchados (widebody)
      const splitter = new THREE.Mesh(crearCajaRedondeada(0.16, 0.03, 0.76, 3, 0.01), matCarbono);
      splitter.position.set(0.75, 0.12, 0);

      [0.48, -0.48].forEach((xPaso) => {
        [-0.36, 0.36].forEach((zPaso) => {
          const flare = new THREE.Mesh(crearCajaRedondeada(0.36, 0.11, 0.10, 3, 0.035), matCarbono);
          flare.position.set(xPaso, 0.25, zPaso);
          flare.castShadow = true;
          g.add(flare);
        });
      });

      const techo = new THREE.Mesh(crearCajaRedondeada(0.48, 0.038, 0.50, 3, 0.018), matPintura);
      techo.position.set(-0.14, 0.485, 0);
      techo.castShadow = true;

      // Compresor V8 cromado (Supercharger Blower) emergiendo del capó largo
      const bloqueBlower = new THREE.Mesh(crearCajaRedondeada(0.24, 0.09, 0.20, 3, 0.025), matCromo);
      bloqueBlower.position.set(0.40, 0.36, 0);
      bloqueBlower.castShadow = true;

      const admision = new THREE.Mesh(crearCajaRedondeada(0.16, 0.07, 0.17, 3, 0.02), matCromo);
      admision.position.set(0.39, 0.43, 0);

      [-0.048, 0, 0.048].forEach((zMariposa) => {
        const mariposa = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), matRojoToma);
        mariposa.rotation.z = Math.PI / 2;
        mariposa.position.set(0.47, 0.43, zMariposa);
        g.add(mariposa);
      });

      // Alerón trasero tipo Ducktail y cuádruple escape cromado
      const ducktail = new THREE.Mesh(crearCajaRedondeada(0.09, 0.075, 0.68, 3, 0.02), matPintura);
      ducktail.position.set(-0.74, 0.35, 0);
      ducktail.rotation.z = -0.32;
      ducktail.castShadow = true;

      [-0.22, -0.15, 0.15, 0.22].forEach((zEsc) => {
        const escape = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 12), matCromo);
        escape.rotation.z = Math.PI / 2;
        escape.position.set(-0.78, 0.15, zEsc);
        g.add(escape);
      });

      const interior = crearInteriorDetallado({
        xInicio: -0.36,
        xFin: 0.20,
        yPiso: 0.195,
        yTecho: 0.47,
        anchoInt: 0.46,
        yVentanaBase: 0.33,
        posVolante: [0.08, 0.35, -0.135],
        radioVolante: 0.056,
        xParabrisasBot: 0.21,
        xParabrisasTop: 0.08,
        xLunetaTop: -0.38,
        xLunetaBot: -0.56,
        colorHex: hex
      });

      g.add(pisoChasis, bloqueFrontal, bloqueTrasero, splitter, techo, bloqueBlower, admision, ducktail, interior);
      agregarDetallesCarroceria(g, 1.56, 0.22, 0.72);
      return g;
    }
  },
  {
    id: 'carroceria_buggy',
    clase: 'coche',
    categoria: 'carroceria',
    nombre: 'Buggy Dunas Baja',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(48, 38, 54, 0.74, 0.90),
    vistaCabina: [-0.04, 0.485, -0.105],
    enganches: [
      { id: 'rueda_di', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.50, 0.19, 0.46], rotacion: [0, 0, 0], escala: [1.10, 1.10, 1.06] },
      { id: 'rueda_dd', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: -1, posicion: [0.50, 0.19, -0.46], rotacion: [0, Math.PI, 0], escala: [1.10, 1.10, 1.06] },
      { id: 'rueda_ti', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.50, 0.20, 0.48], rotacion: [0, 0, 0], escala: [1.16, 1.16, 1.18] },
      { id: 'rueda_td', tipo: 'rueda', grupoSimetria: 'ruedas', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: -1, posicion: [-0.50, 0.20, -0.48], rotacion: [0, Math.PI, 0], escala: [1.16, 1.16, 1.18] },
      { id: 'acc_techo', tipo: 'accesorio', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.08, 0.62, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(hex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(hex);
      const matTubo = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.65 });
      const matAluminio = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.88 });
      const matLedFoco = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3c4, emissiveIntensity: 1.6 });

      // Placa protectora frontal metálica (Skid plate) y chasis bañera alto
      const skidPlate = new THREE.Mesh(crearCajaRedondeada(0.28, 0.03, 0.40, 2, 0.01), matAluminio);
      skidPlate.position.set(0.62, 0.17, 0);
      skidPlate.rotation.z = 0.48;
      skidPlate.castShadow = true;

      const banera = new THREE.Mesh(crearCajaRedondeada(1.22, 0.14, 0.50, 4, 0.04), matPintura);
      banera.position.set(0.0, 0.23, 0);
      banera.castShadow = true;
      banera.receiveShadow = true;

      // Capó corto inclinado estilo off-road y paneles traseros
      const capo = new THREE.Mesh(crearCajaRedondeada(0.42, 0.08, 0.44, 3, 0.025), matPintura);
      capo.position.set(0.46, 0.30, 0);
      capo.rotation.z = -0.18;
      capo.castShadow = true;

      // Jaula antivuelco tubular Baja + techo metálico ligero
      [-0.21, 0.21].forEach((zBarra) => {
        const barraSup = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.66, 10), matTubo);
        barraSup.rotation.x = Math.PI / 2;
        barraSup.rotation.z = Math.PI / 2;
        barraSup.position.set(-0.08, 0.59, zBarra);

        const pilarDel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 10), matTubo);
        pilarDel.position.set(0.28, 0.45, zBarra);
        pilarDel.rotation.z = 0.52;

        const pilarTras = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), matTubo);
        pilarTras.position.set(-0.46, 0.45, zBarra);
        pilarTras.rotation.z = -0.58;

        const pilarCen = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 10), matTubo);
        pilarCen.position.set(-0.18, 0.45, zBarra);

        g.add(barraSup, pilarDel, pilarTras, pilarCen);
      });

      const placaTecho = new THREE.Mesh(crearCajaRedondeada(0.44, 0.025, 0.44, 3, 0.01), matPintura);
      placaTecho.position.set(-0.08, 0.605, 0);
      placaTecho.castShadow = true;

      // Barra de 4 focos LED de rally en el techo + faros delanteros
      const barraFocos = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.40), matTubo);
      barraFocos.position.set(0.16, 0.625, 0);
      [-0.14, -0.048, 0.048, 0.14].forEach((zFoco) => {
        const foco = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 12), matLedFoco);
        foco.rotation.z = Math.PI / 2;
        foco.position.set(0.19, 0.625, zFoco);
        g.add(foco);
      });

      // Amortiguadores de largo recorrido (coilovers) hacia las 4 ruedas
      [0.50, -0.50].forEach((xRueda) => {
        [-1, 1].forEach((signoZ) => {
          const susp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 10), matPintura);
          susp.position.set(xRueda, 0.28, signoZ * 0.30);
          susp.rotation.x = signoZ * 0.58;
          const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.24), matTubo);
          brazo.position.set(xRueda, 0.19, signoZ * 0.32);
          g.add(susp, brazo);
        });
      });

      // Bloque de motor trasero expuesto y escapes ascendentes cromados
      const motor = new THREE.Mesh(crearCajaRedondeada(0.24, 0.16, 0.30, 3, 0.025), matAluminio);
      motor.position.set(-0.56, 0.29, 0);
      motor.castShadow = true;

      [-0.11, 0.11].forEach((zEsc) => {
        const escape = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.24, 12), matAluminio);
        escape.position.set(-0.68, 0.36, zEsc);
        escape.rotation.z = 0.65;
        g.add(escape);
      });

      const interior = crearInteriorDetallado({
        xInicio: -0.26,
        xFin: 0.26,
        yPiso: 0.302,
        yTecho: 0.59,
        anchoInt: 0.38,
        yVentanaBase: 0.36,
        posVolante: [0.15, 0.415, -0.105],
        radioVolante: 0.052,
        xTablero: 0.24,
        xParabrisasBot: 0.28,
        conCabinaCerrada: false,
        colorHex: hex
      });

      g.add(skidPlate, banera, capo, placaTecho, barraFocos, motor, interior);
      agregarDetallesCarroceria(g, 1.24, 0.24, 0.48);
      return g;
    }
  },
  // ====================== CLASE MOTO ======================
  {
    id: 'moto_superbike',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Superbike Cyber GP',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(72, 46, 22, 0.88, 0.65),
    vistaCabina: [-0.04, 0.56, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.48, 0.17, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.46, 0.17, 0], rotacion: [0, 0, 0], escala: [1.05, 1.05, 1.18] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.42, 0.30, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.42, metalness: 0.35 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.94 });
      const matCristal = crearMaterialCristalCabina();
      const matFaro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8dc, emissiveIntensity: 1.5 });
      const matPiloto = new THREE.MeshStandardMaterial({ color: 0xff1e27, emissive: 0xdc2626, emissiveIntensity: 1.3 });

      const chasis = new THREE.Mesh(crearCajaRedondeada(0.68, 0.16, 0.16, 3, 0.03), matCarbono);
      chasis.position.set(0.0, 0.27, 0);
      chasis.castShadow = true;

      const deposito = new THREE.Mesh(crearCajaRedondeada(0.32, 0.14, 0.21, 4, 0.05), matPintura);
      deposito.position.set(0.08, 0.41, 0);
      deposito.castShadow = true;

      const carenadoFrontal = new THREE.Mesh(crearCajaRedondeada(0.30, 0.20, 0.22, 4, 0.04), matPintura);
      carenadoFrontal.position.set(0.34, 0.39, 0);
      carenadoFrontal.rotation.z = -0.32;
      carenadoFrontal.castShadow = true;

      const cupula = new THREE.Mesh(crearCajaRedondeada(0.22, 0.12, 0.18, 3, 0.04), matCristal);
      cupula.position.set(0.32, 0.50, 0);
      cupula.rotation.z = -0.52;

      [-0.12, 0.12].forEach((zCare) => {
        const quilla = new THREE.Mesh(crearCajaRedondeada(0.42, 0.17, 0.04, 3, 0.015), matPintura);
        quilla.position.set(0.14, 0.26, zCare);
        quilla.castShadow = true;
        const barraHorq = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.38, 12), matCromo);
        barraHorq.position.set(0.41, 0.33, zCare * 0.45);
        barraHorq.rotation.z = 0.42;
        const brazoOsc = new THREE.Mesh(crearCajaRedondeada(0.34, 0.045, 0.028, 2, 0.01), matCromo);
        brazoOsc.position.set(-0.29, 0.19, zCare * 0.65);
        const tuboEsc = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.30, 12), matCromo);
        tuboEsc.rotation.z = Math.PI / 2 - 0.18;
        tuboEsc.position.set(-0.32, 0.25, zCare * 0.72);
        g.add(quilla, barraHorq, brazoOsc, tuboEsc);
      });

      const asiento = new THREE.Mesh(crearCajaRedondeada(0.28, 0.06, 0.17, 3, 0.025), matCarbono);
      asiento.position.set(-0.18, 0.37, 0);

      const colin = new THREE.Mesh(crearCajaRedondeada(0.28, 0.09, 0.16, 3, 0.03), matPintura);
      colin.position.set(-0.40, 0.39, 0);
      colin.rotation.z = 0.22;
      colin.castShadow = true;

      const faro = new THREE.Mesh(crearCajaRedondeada(0.04, 0.055, 0.13, 2, 0.01), matFaro);
      faro.position.set(0.48, 0.36, 0);
      const piloto = new THREE.Mesh(crearCajaRedondeada(0.04, 0.035, 0.10, 2, 0.01), matPiloto);
      piloto.position.set(-0.53, 0.41, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.22, 0.49, 0], colorHex);
      g.add(chasis, deposito, carenadoFrontal, cupula, asiento, colin, faro, piloto, consola);
      return g;
    }
  },
  {
    id: 'moto_cross',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Enduro Dunas XT',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(56, 48, 36, 0.78, 0.75),
    vistaCabina: [-0.02, 0.60, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.50, 0.18, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.48, 0.18, 0], rotacion: [0, 0, 0], escala: [1.04, 1.04, 1.15] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.40, 0.35, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matChasis = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.65 });
      const matMotor = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });
      const matFuelle = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
      const matAsiento = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const matFaro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3c4, emissiveIntensity: 1.4 });

      const bloqueMotor = new THREE.Mesh(crearCajaRedondeada(0.24, 0.22, 0.16, 3, 0.03), matMotor);
      bloqueMotor.position.set(0.02, 0.25, 0);
      bloqueMotor.castShadow = true;

      const tanque = new THREE.Mesh(crearCajaRedondeada(0.28, 0.12, 0.18, 3, 0.04), matPintura);
      tanque.position.set(0.10, 0.44, 0);
      tanque.castShadow = true;

      const asiento = new THREE.Mesh(crearCajaRedondeada(0.42, 0.07, 0.15, 3, 0.03), matAsiento);
      asiento.position.set(-0.18, 0.42, 0);

      const guardabarrosDel = new THREE.Mesh(crearCajaRedondeada(0.32, 0.03, 0.13, 3, 0.01), matPintura);
      guardabarrosDel.position.set(0.48, 0.40, 0);
      guardabarrosDel.rotation.z = -0.15;
      guardabarrosDel.castShadow = true;

      const guardabarrosTras = new THREE.Mesh(crearCajaRedondeada(0.30, 0.03, 0.14, 3, 0.01), matPintura);
      guardabarrosTras.position.set(-0.46, 0.43, 0);
      guardabarrosTras.rotation.z = 0.24;

      [-0.06, 0.06].forEach((zL) => {
        const larguero = new THREE.Mesh(crearCajaRedondeada(0.56, 0.04, 0.03, 2, 0.01), matChasis);
        larguero.position.set(-0.02, 0.36, zL);
        const horquilla = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.44, 10), matMotor);
        horquilla.position.set(0.42, 0.36, zL);
        horquilla.rotation.z = 0.44;
        const fuelle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 10), matFuelle);
        fuelle.position.set(0.44, 0.32, zL);
        fuelle.rotation.z = 0.44;
        const cubrevientos = new THREE.Mesh(crearCajaRedondeada(0.04, 0.06, 0.08, 2, 0.01), matPintura);
        cubrevientos.position.set(0.28, 0.56, zL * 2.5);
        g.add(larguero, horquilla, fuelle, cubrevientos);
      });

      const placaFaro = new THREE.Mesh(crearCajaRedondeada(0.05, 0.14, 0.16, 2, 0.015), matPintura);
      placaFaro.position.set(0.35, 0.48, 0);
      const faro = new THREE.Mesh(crearCajaRedondeada(0.03, 0.06, 0.09, 2, 0.01), matFaro);
      faro.position.set(0.38, 0.48, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.24, 0.54, 0], colorHex);
      g.add(bloqueMotor, tanque, asiento, guardabarrosDel, guardabarrosTras, placaFaro, faro, consola);
      return g;
    }
  },
  {
    id: 'moto_chopper',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Chopper V-Twin Custom',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(66, 44, 30, 0.80, 0.90),
    vistaCabina: [-0.08, 0.58, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.56, 0.17, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.46, 0.17, 0], rotacion: [0, 0, 0], escala: [1.06, 1.06, 1.25] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.44, 0.28, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
      const matCuero = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.72 });
      const matMotor = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.88 });
      const matFaro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8dc, emissiveIntensity: 1.5 });

      const cunaBaja = new THREE.Mesh(crearCajaRedondeada(0.74, 0.09, 0.16, 3, 0.03), matCromo);
      cunaBaja.position.set(0.02, 0.21, 0);
      cunaBaja.castShadow = true;

      const carter = new THREE.Mesh(crearCajaRedondeada(0.24, 0.14, 0.17, 3, 0.03), matMotor);
      carter.position.set(0.02, 0.27, 0);

      // Cilindros en V cromados
      [-0.28, 0.28].forEach((incl) => {
        const cil = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.16, 14), matCromo);
        cil.position.set(0.02 + incl * 0.14, 0.37, 0);
        cil.rotation.z = incl;
        g.add(cil);
      });

      const depositoLagrima = new THREE.Mesh(crearCajaRedondeada(0.32, 0.14, 0.22, 4, 0.06), matPintura);
      depositoLagrima.position.set(0.14, 0.45, 0);
      depositoLagrima.rotation.z = -0.22;
      depositoLagrima.castShadow = true;

      const asientoBajo = new THREE.Mesh(crearCajaRedondeada(0.28, 0.06, 0.18, 3, 0.025), matCuero);
      asientoBajo.position.set(-0.18, 0.31, 0);

      const respaldoPad = new THREE.Mesh(crearCajaRedondeada(0.05, 0.18, 0.14, 2, 0.02), matCuero);
      respaldoPad.position.set(-0.34, 0.46, 0);
      respaldoPad.rotation.z = 0.2;

      [-0.07, 0.07].forEach((zOff) => {
        const horqLarga = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.52, 12), matCromo);
        horqLarga.position.set(0.42, 0.38, zOff);
        horqLarga.rotation.z = 0.56;
        const sissyPoste = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 10), matCromo);
        sissyPoste.position.set(-0.35, 0.42, zOff * 0.9);
        sissyPoste.rotation.z = 0.2;
        const escapeLargo = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.62, 12), matCromo);
        escapeLargo.rotation.z = Math.PI / 2;
        escapeLargo.position.set(-0.22, 0.20, zOff * 1.45);
        g.add(horqLarga, sissyPoste, escapeLargo);
      });

      const faro = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 14), matFaro);
      faro.rotation.z = Math.PI / 2;
      faro.position.set(0.44, 0.49, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.16, 0.60, 0], colorHex);
      g.add(cunaBaja, carter, depositoLagrima, asientoBajo, respaldoPad, faro, consola);
      return g;
    }
  },
  {
    id: 'moto_scooter',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Scooter Urbano Turbo',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(58, 52, 30, 0.86, 0.62),
    vistaCabina: [-0.02, 0.58, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.44, 0.15, 0], rotacion: [0, 0, 0], escala: [0.92, 0.92, 1.05] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.42, 0.15, 0], rotacion: [0, 0, 0], escala: [0.94, 0.94, 1.12] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.46, 0.34, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCrema = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.7, roughness: 0.25 });
      const matAsiento = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.68 });
      const matPiso = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
      const matFaro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8dc, emissiveIntensity: 1.4 });

      const pisoPlano = new THREE.Mesh(crearCajaRedondeada(0.46, 0.06, 0.24, 3, 0.02), matPiso);
      pisoPlano.position.set(0.04, 0.20, 0);
      pisoPlano.castShadow = true;

      const escudoFrontal = new THREE.Mesh(crearCajaRedondeada(0.14, 0.36, 0.26, 4, 0.05), matPintura);
      escudoFrontal.position.set(0.28, 0.36, 0);
      escudoFrontal.rotation.z = -0.22;
      escudoFrontal.castShadow = true;

      const corbata = new THREE.Mesh(crearCajaRedondeada(0.04, 0.24, 0.08, 2, 0.015), matCromo);
      corbata.position.set(0.35, 0.37, 0);
      corbata.rotation.z = -0.22;

      const cuerpoTras = new THREE.Mesh(crearCajaRedondeada(0.42, 0.20, 0.22, 4, 0.05), matPintura);
      cuerpoTras.position.set(-0.24, 0.30, 0);
      cuerpoTras.castShadow = true;

      [-0.12, 0.12].forEach((zCof) => {
        const cofano = new THREE.Mesh(crearCajaRedondeada(0.36, 0.16, 0.07, 4, 0.03), matCrema);
        cofano.position.set(-0.26, 0.29, zCof);
        const horq = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 10), matCromo);
        horq.position.set(0.38, 0.26, zCof * 0.42);
        horq.rotation.z = 0.28;
        g.add(cofano, horq);
      });

      const asientoBi = new THREE.Mesh(crearCajaRedondeada(0.38, 0.07, 0.20, 3, 0.03), matAsiento);
      asientoBi.position.set(-0.20, 0.42, 0);

      const faroRedondo = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.06, 16), matFaro);
      faroRedondo.rotation.z = Math.PI / 2;
      faroRedondo.position.set(0.35, 0.48, 0);

      const guardabarrosDel = new THREE.Mesh(crearCajaRedondeada(0.22, 0.06, 0.14, 3, 0.02), matPintura);
      guardabarrosDel.position.set(0.42, 0.28, 0);

      const parrillaTras = new THREE.Mesh(crearCajaRedondeada(0.16, 0.04, 0.18, 2, 0.01), matCromo);
      parrillaTras.position.set(-0.44, 0.41, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.22, 0.54, 0], colorHex);
      g.add(pisoPlano, escudoFrontal, corbata, cuerpoTras, asientoBi, faroRedondo, guardabarrosDel, parrillaTras, consola);
      return g;
    }
  },
  {
    id: 'moto_cyber',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Cyber-Light Neon GP',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(76, 42, 22, 0.90, 0.72),
    vistaCabina: [0.0, 0.52, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.48, 0.17, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.46, 0.17, 0], rotacion: [0, 0, 0], escala: [1.06, 1.06, 1.24] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.42, 0.31, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matOscuro = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.55 });
      const matNeon = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 });
      const matCristal = crearMaterialCristalCabina();

      const cuerpoEnvol = new THREE.Mesh(crearCajaRedondeada(0.84, 0.22, 0.22, 4, 0.06), matOscuro);
      cuerpoEnvol.position.set(0.02, 0.31, 0);
      cuerpoEnvol.castShadow = true;

      const lomoFut = new THREE.Mesh(crearCajaRedondeada(0.68, 0.12, 0.20, 4, 0.05), matPintura);
      lomoFut.position.set(0.10, 0.41, 0);
      lomoFut.rotation.z = -0.18;
      lomoFut.castShadow = true;

      const cupulaAero = new THREE.Mesh(crearCajaRedondeada(0.28, 0.10, 0.18, 3, 0.04), matCristal);
      cupulaAero.position.set(0.32, 0.47, 0);
      cupulaAero.rotation.z = -0.42;

      [-0.12, 0.12].forEach((zL) => {
        const tiraLed = new THREE.Mesh(crearCajaRedondeada(0.76, 0.028, 0.025, 2, 0.008), matNeon);
        tiraLed.position.set(0.0, 0.33, zL);
        const ledDel = new THREE.Mesh(crearCajaRedondeada(0.14, 0.03, 0.03, 2, 0.008), matNeon);
        ledDel.position.set(0.46, 0.36, zL * 0.72);
        const cubiertaHorq = new THREE.Mesh(crearCajaRedondeada(0.14, 0.32, 0.035, 2, 0.01), matPintura);
        cubiertaHorq.position.set(0.42, 0.30, zL * 0.58);
        cubiertaHorq.rotation.z = 0.35;
        const bascTras = new THREE.Mesh(crearCajaRedondeada(0.32, 0.05, 0.03, 2, 0.01), matOscuro);
        bascTras.position.set(-0.32, 0.21, zL * 0.75);
        g.add(tiraLed, ledDel, cubiertaHorq, bascTras);
      });

      const quillaNeon = new THREE.Mesh(crearCajaRedondeada(0.46, 0.06, 0.20, 3, 0.02), matPintura);
      quillaNeon.position.set(0.12, 0.20, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.24, 0.47, 0], colorHex);
      g.add(cuerpoEnvol, lomoFut, cupulaAero, quillaNeon, consola);
      return g;
    }
  },
  {
    id: 'moto_caferacer',
    clase: 'moto',
    categoria: 'carroceria',
    nombre: 'Café Racer Vintage 77',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(68, 42, 30, 0.84, 0.70),
    vistaCabina: [-0.04, 0.53, 0.0],
    enganches: [
      { id: 'rueda_delantera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: true, lado: 1, posicion: [0.47, 0.17, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'rueda_trasera', tipo: 'rueda_moto', grupoSimetria: 'ruedas_moto', rolAnimacion: 'rueda_motriz', orientacionAnillo: [0, 0, 0], esDelantera: false, lado: 1, posicion: [-0.45, 0.17, 0], rotacion: [0, 0, 0], escala: [1.02, 1.02, 1.12] },
      { id: 'acc_escape', tipo: 'accesorio_moto', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.40, 0.32, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.94 });
      const matMotor = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.82 });
      const matCuero = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.68 });
      const matFaro = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.4 });

      const bloque = new THREE.Mesh(crearCajaRedondeada(0.28, 0.20, 0.18, 3, 0.03), matMotor);
      bloque.position.set(0.02, 0.25, 0);
      bloque.castShadow = true;

      const depositoLargo = new THREE.Mesh(crearCajaRedondeada(0.38, 0.12, 0.20, 4, 0.045), matPintura);
      depositoLargo.position.set(0.08, 0.41, 0);
      depositoLargo.castShadow = true;

      const franjaDep = new THREE.Mesh(crearCajaRedondeada(0.39, 0.02, 0.055, 2, 0.005), matBlanco);
      franjaDep.position.set(0.08, 0.468, 0);

      const asientoCuero = new THREE.Mesh(crearCajaRedondeada(0.24, 0.055, 0.17, 3, 0.02), matCuero);
      asientoCuero.position.set(-0.20, 0.38, 0);

      const joroba = new THREE.Mesh(crearCajaRedondeada(0.20, 0.11, 0.17, 4, 0.05), matPintura);
      joroba.position.set(-0.39, 0.41, 0);
      joroba.castShadow = true;

      const faroClasico = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.08, 16), matFaro);
      faroClasico.rotation.z = Math.PI / 2;
      faroClasico.position.set(0.45, 0.41, 0);

      [-0.02, 0, 0.02].forEach((yRej) => {
        const barraRej = new THREE.Mesh(crearCajaRedondeada(0.02, 0.008, 0.10, 1, 0.002), matMotor);
        barraRej.position.set(0.495, 0.41 + yRej, 0);
        g.add(barraRej);
      });

      [-0.08, 0.08].forEach((zL) => {
        const tuboCuadro = new THREE.Mesh(crearCajaRedondeada(0.56, 0.032, 0.028, 2, 0.008), matCromo);
        tuboCuadro.position.set(-0.04, 0.35, zL);
        const horq = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 10), matCromo);
        horq.position.set(0.41, 0.32, zL * 0.65);
        horq.rotation.z = 0.38;
        const megafono = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.016, 0.34, 12), matCromo);
        megafono.rotation.z = Math.PI / 2;
        megafono.position.set(-0.26, 0.18, zL * 1.4);
        g.add(tuboCuadro, horq, megafono);
      });

      const consola = crearConsolaMandoVehiculo('manillar', [0.24, 0.47, 0], colorHex);
      g.add(bloque, depositoLargo, franjaDep, asientoCuero, joroba, faroClasico, consola);
      return g;
    }
  },
  // ====================== CLASE BARCO ======================
  {
    id: 'barco_hidroplano',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Hidroplano F1 Nitro',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(74, 42, 24, 0.72, 1.15),
    vistaCabina: [-0.06, 0.44, 0.0],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.72, 0.18, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.78, 0.12, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.28, 0.38, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.35 });
      const matBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.9, roughness: 0.2 });
      const matCristal = crearMaterialCristalCabina();

      // Doble patín catamarán y patines ocultos de deslizamiento bajo la quilla
      [-0.28, 0.28].forEach((zPat) => {
        const patin = new THREE.Mesh(crearCajaRedondeada(1.42, 0.14, 0.22, 4, 0.04), matPintura);
        patin.position.set(0.02, 0.11, zPat);
        patin.castShadow = true;
        patin.receiveShadow = true;
        const quilla = new THREE.Mesh(crearCajaRedondeada(1.30, 0.04, 0.10, 2, 0.015), matBlanco);
        quilla.position.set(0.0, 0.025, zPat);
        const aletaProa = new THREE.Mesh(crearCajaRedondeada(0.32, 0.08, 0.18, 3, 0.02), matCarbono);
        aletaProa.position.set(0.62, 0.14, zPat);
        aletaProa.rotation.z = -0.14;
        g.add(patin, quilla, aletaProa);
      });

      const puenteCentral = new THREE.Mesh(crearCajaRedondeada(1.18, 0.10, 0.44, 3, 0.03), matPintura);
      puenteCentral.position.set(-0.08, 0.17, 0);
      puenteCentral.castShadow = true;

      const narizAlar = new THREE.Mesh(crearCajaRedondeada(0.24, 0.04, 0.72, 3, 0.015), matCarbono);
      narizAlar.position.set(0.60, 0.18, 0);

      [-0.16, 0.16].forEach((zBorda) => {
        const borda = new THREE.Mesh(crearCajaRedondeada(0.62, 0.13, 0.06, 3, 0.02), matBlanco);
        borda.position.set(-0.04, 0.27, zBorda);
        g.add(borda);
      });

      const asiento = new THREE.Mesh(crearCajaRedondeada(0.24, 0.16, 0.22, 3, 0.03), matCarbono);
      asiento.position.set(-0.18, 0.27, 0);

      const parabrisas = new THREE.Mesh(crearCajaRedondeada(0.22, 0.11, 0.28, 3, 0.03), matCristal);
      parabrisas.position.set(0.18, 0.31, 0);
      parabrisas.rotation.z = -0.45;

      const capotaMotor = new THREE.Mesh(crearCajaRedondeada(0.38, 0.16, 0.26, 3, 0.04), matPintura);
      capotaMotor.position.set(-0.46, 0.27, 0);
      capotaMotor.castShadow = true;

      const consola = crearConsolaMandoVehiculo('timon', [0.10, 0.34, 0], colorHex);
      g.add(puenteCentral, narizAlar, asiento, parabrisas, capotaMotor, consola);
      return g;
    }
  },
  {
    id: 'barco_lancha',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Lancha Offshore V8',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(62, 40, 38, 0.76, 1.35),
    vistaCabina: [-0.05, 0.48, -0.12],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.75, 0.19, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.80, 0.12, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.24, 0.44, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.9, roughness: 0.18 });
      const matTapiz = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.92 });
      const matCristal = crearMaterialCristalCabina();

      const quillaV = new THREE.Mesh(crearCajaRedondeada(1.36, 0.12, 0.48, 4, 0.04), matBlanco);
      quillaV.position.set(0.0, 0.08, 0);
      quillaV.castShadow = true;

      const cubiertaProa = new THREE.Mesh(crearCajaRedondeada(0.62, 0.12, 0.64, 4, 0.04), matPintura);
      cubiertaProa.position.set(0.42, 0.20, 0);
      cubiertaProa.rotation.z = -0.08;
      cubiertaProa.castShadow = true;

      [-0.29, 0.29].forEach((zLado) => {
        const costado = new THREE.Mesh(crearCajaRedondeada(0.84, 0.19, 0.10, 3, 0.03), matPintura);
        costado.position.set(-0.26, 0.22, zLado);
        costado.castShadow = true;
        const barandilla = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 10), matCromo);
        barandilla.rotation.z = Math.PI / 2;
        barandilla.position.set(0.42, 0.29, zLado * 0.82);
        const butaca = new THREE.Mesh(crearCajaRedondeada(0.22, 0.18, 0.20, 3, 0.03), matTapiz);
        butaca.position.set(-0.08, 0.25, zLado * 0.48);
        g.add(costado, barandilla, butaca);
      });

      const solarium = new THREE.Mesh(crearCajaRedondeada(0.40, 0.14, 0.54, 3, 0.03), matBlanco);
      solarium.position.set(-0.48, 0.24, 0);
      solarium.castShadow = true;

      const parabrisas = new THREE.Mesh(crearCajaRedondeada(0.18, 0.14, 0.56, 3, 0.03), matCristal);
      parabrisas.position.set(0.22, 0.34, 0);
      parabrisas.rotation.z = -0.50;

      const consola = crearConsolaMandoVehiculo('timon', [0.12, 0.37, -0.12], colorHex);
      g.add(quillaV, cubiertaProa, solarium, parabrisas, consola);
      return g;
    }
  },
  {
    id: 'barco_jetski',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Jet Ski Wave Runner',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(66, 48, 26, 0.82, 0.85),
    vistaCabina: [-0.06, 0.48, 0.0],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.62, 0.16, 0], rotacion: [0, Math.PI / 2, 0], escala: [0.9, 0.9, 0.9] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.68, 0.11, 0], rotacion: [0, 0, 0], escala: [0.9, 0.9, 0.9] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.36, 0.34, 0], rotacion: [0, 0, 0], escala: [0.85, 0.85, 0.85] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.9, roughness: 0.2 });
      const matGrip = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.88 });
      const matMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.88 });
      const matCristal = crearMaterialCristalCabina();

      const cascoInferior = new THREE.Mesh(crearCajaRedondeada(1.16, 0.13, 0.44, 4, 0.045), matBlanco);
      cascoInferior.position.set(0.0, 0.10, 0);
      cascoInferior.castShadow = true;

      const carenadoProa = new THREE.Mesh(crearCajaRedondeada(0.56, 0.14, 0.38, 4, 0.05), matPintura);
      carenadoProa.position.set(0.32, 0.24, 0);
      carenadoProa.rotation.z = -0.20;
      carenadoProa.castShadow = true;

      const deflector = new THREE.Mesh(crearCajaRedondeada(0.16, 0.09, 0.28, 3, 0.03), matCristal);
      deflector.position.set(0.26, 0.36, 0);
      deflector.rotation.z = -0.45;

      const asientoJet = new THREE.Mesh(crearCajaRedondeada(0.46, 0.12, 0.20, 3, 0.04), matGrip);
      asientoJet.position.set(-0.20, 0.29, 0);

      const respaldoJet = new THREE.Mesh(crearCajaRedondeada(0.10, 0.12, 0.20, 3, 0.03), matPintura);
      respaldoJet.position.set(-0.46, 0.31, 0);

      [-0.22, 0.22].forEach((zSide) => {
        const patinFlot = new THREE.Mesh(crearCajaRedondeada(1.04, 0.08, 0.10, 3, 0.03), matPintura);
        patinFlot.position.set(-0.02, 0.17, zSide);
        const reposapies = new THREE.Mesh(crearCajaRedondeada(0.52, 0.04, 0.10, 2, 0.01), matGrip);
        reposapies.position.set(-0.14, 0.21, zSide * 0.72);
        g.add(patinFlot, reposapies);
      });

      const toberaTras = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.14, 14), matMetal);
      toberaTras.rotation.z = Math.PI / 2;
      toberaTras.position.set(-0.58, 0.16, 0);

      const consola = crearConsolaMandoVehiculo('manillar', [0.16, 0.44, 0], colorHex);
      g.add(cascoInferior, carenadoProa, deflector, asientoJet, respaldoJet, toberaTras, consola);
      return g;
    }
  },
  {
    id: 'barco_hovercraft',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Aerodeslizador Vortex',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(64, 42, 34, 0.68, 1.25),
    vistaCabina: [0.02, 0.46, 0.0],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.72, 0.24, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.78, 0.18, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.32, 0.40, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matFaldon = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88, metalness: 0.05 });
      const matCubierta = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.25 });
      const matCristal = crearMaterialCristalCabina();

      // Colchón / faldón neumático perimetral en negro mate
      [-0.34, 0.34].forEach((zF) => {
        const tuboL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 1.24, 14), matFaldon);
        tuboL.rotation.z = Math.PI / 2;
        tuboL.position.set(0, 0.10, zF);
        tuboL.castShadow = true;
        const ducto = new THREE.Mesh(crearCajaRedondeada(0.32, 0.14, 0.11, 3, 0.03), matCubierta);
        ducto.position.set(-0.46, 0.27, zF * 0.72);
        g.add(tuboL, ducto);
      });
      [-0.64, 0.64].forEach((xF) => {
        const tuboT = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.68, 14), matFaldon);
        tuboT.rotation.x = Math.PI / 2;
        tuboT.position.set(xF, 0.10, 0);
        g.add(tuboT);
      });

      const plataforma = new THREE.Mesh(crearCajaRedondeada(1.26, 0.10, 0.66, 3, 0.03), matPintura);
      plataforma.position.set(0, 0.19, 0);
      plataforma.castShadow = true;

      const cubiertaSup = new THREE.Mesh(crearCajaRedondeada(0.92, 0.08, 0.50, 3, 0.025), matCubierta);
      cubiertaSup.position.set(-0.04, 0.25, 0);

      const cabinaAdelantada = new THREE.Mesh(crearCajaRedondeada(0.42, 0.16, 0.42, 3, 0.04), matPintura);
      cabinaAdelantada.position.set(0.18, 0.32, 0);
      cabinaAdelantada.castShadow = true;

      const parabrisas = new THREE.Mesh(crearCajaRedondeada(0.18, 0.13, 0.38, 3, 0.03), matCristal);
      parabrisas.position.set(0.36, 0.40, 0);
      parabrisas.rotation.z = -0.45;

      const consola = crearConsolaMandoVehiculo('timon', [0.18, 0.38, 0], colorHex);
      g.add(plataforma, cubiertaSup, cabinaAdelantada, parabrisas, consola);
      return g;
    }
  },
  {
    id: 'barco_galeon',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Mini Galeón Pirata Turbo',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(58, 38, 44, 0.78, 1.55),
    vistaCabina: [-0.20, 0.54, 0.0],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.75, 0.16, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.80, 0.11, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.18, 0.44, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matMadera = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
      const matTablas = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const matOro = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.24, metalness: 0.85 });
      const matBronce = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.35, metalness: 0.82 });

      const casco = new THREE.Mesh(crearCajaRedondeada(1.32, 0.18, 0.54, 4, 0.05), matMadera);
      casco.position.set(0.0, 0.12, 0);
      casco.castShadow = true;

      const cubierta = new THREE.Mesh(crearCajaRedondeada(1.16, 0.05, 0.46, 3, 0.02), matTablas);
      cubierta.position.set(0.02, 0.22, 0);

      const proa = new THREE.Mesh(crearCajaRedondeada(0.38, 0.20, 0.36, 4, 0.06), matMadera);
      proa.position.set(0.62, 0.20, 0);
      proa.rotation.z = 0.25;

      const baupres = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.032, 0.34, 10), matTablas);
      baupres.rotation.z = -Math.PI / 2 + 0.32;
      baupres.position.set(0.84, 0.33, 0);

      const mascaron = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), matOro);
      mascaron.position.set(0.79, 0.25, 0);

      const castilloPopa = new THREE.Mesh(crearCajaRedondeada(0.42, 0.20, 0.52, 3, 0.04), matPintura);
      castilloPopa.position.set(-0.44, 0.31, 0);
      castilloPopa.castShadow = true;

      [-0.27, 0.27].forEach((zB) => {
        const borda = new THREE.Mesh(crearCajaRedondeada(1.12, 0.14, 0.06, 3, 0.02), matPintura);
        borda.position.set(0.0, 0.27, zB);
        [0.24, -0.04].forEach((xCan) => {
          const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.034, 0.15, 10), matBronce);
          canon.rotation.x = Math.PI / 2;
          canon.position.set(xCan, 0.28, zB * 1.15);
          g.add(canon);
        });
        g.add(borda);
      });

      const consola = crearConsolaMandoVehiculo('timon', [-0.22, 0.46, 0], colorHex);
      g.add(casco, cubierta, proa, baupres, mascaron, castilloPopa, consola);
      return g;
    }
  },
  {
    id: 'barco_submarino',
    clase: 'barco',
    categoria: 'carroceria',
    nombre: 'Batiscafo Deep Shark',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(70, 38, 32, 0.80, 1.45),
    vistaCabina: [0.08, 0.42, 0.0],
    enganches: [
      { id: 'propulsor_popa', tipo: 'propulsor_barco', grupoSimetria: 'propulsion', rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [-0.74, 0.20, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'timon_popa', tipo: 'timon_barco', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.80, 0.14, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'acc_cubierta', tipo: 'accesorio_barco', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.34, 0.38, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matAcero = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.78 });
      const matFoco = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 1.4 });
      const matCristal = crearMaterialCristalCabina();

      const tuboCasco = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 1.18, 20), matPintura);
      tuboCasco.rotation.z = Math.PI / 2;
      tuboCasco.position.set(-0.04, 0.22, 0);
      tuboCasco.castShadow = true;

      const cupulaProa = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 16), matCristal);
      cupulaProa.position.set(0.54, 0.22, 0);

      const aroFrontal = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 10, 24), matAcero);
      aroFrontal.rotation.y = Math.PI / 2;
      aroFrontal.position.set(0.52, 0.22, 0);

      const torretaVela = new THREE.Mesh(crearCajaRedondeada(0.32, 0.18, 0.16, 3, 0.04), matPintura);
      torretaVela.position.set(-0.06, 0.44, 0);
      torretaVela.castShadow = true;

      const periscopioV = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.18, 10), matAcero);
      periscopioV.position.set(-0.02, 0.59, 0);
      const periscopioH = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 10), matAcero);
      periscopioH.rotation.z = Math.PI / 2;
      periscopioH.position.set(0.02, 0.67, 0);

      [-0.24, 0.24].forEach((zT) => {
        const tanque = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.78, 14), matAcero);
        tanque.rotation.z = Math.PI / 2;
        tanque.position.set(-0.04, 0.13, zT);
        const aletaInm = new THREE.Mesh(crearCajaRedondeada(0.16, 0.025, 0.18, 2, 0.008), matPintura);
        aletaInm.position.set(0.42, 0.22, zT * 1.15);
        const foco = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), matFoco);
        foco.position.set(0.50, 0.15, zT * 0.72);
        g.add(tanque, aletaInm, foco);
      });

      const consola = crearConsolaMandoVehiculo('timon', [0.14, 0.34, 0], colorHex);
      g.add(tuboCasco, cupulaProa, aroFrontal, torretaVela, periscopioV, periscopioH, consola);
      return g;
    }
  },
  // ====================== CLASE AVIÓN ======================
  {
    id: 'avion_acrobatico',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Aeroplano Red Baron',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(64, 38, 38, 0.86, 0.85),
    vistaCabina: [-0.10, 0.44, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [0.06, 0.25, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.68, 0.26, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.66, 0.28, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matMetal = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.9 });
      const matCuero = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.75 });
      const matCaucho = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
      const matCristal = crearMaterialCristalCabina();

      const capotaMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.34, 20), matMetal);
      capotaMotor.rotation.z = Math.PI / 2;
      capotaMotor.position.set(0.48, 0.26, 0);
      capotaMotor.castShadow = true;

      const fuselajeCentral = new THREE.Mesh(crearCajaRedondeada(0.62, 0.30, 0.34, 4, 0.08), matPintura);
      fuselajeCentral.position.set(0.06, 0.26, 0);
      fuselajeCentral.castShadow = true;

      const conoCola = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.17, 0.56, 16), matPintura);
      conoCola.rotation.z = Math.PI / 2;
      conoCola.position.set(-0.46, 0.27, 0);
      conoCola.castShadow = true;

      const marcoCabina = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 10, 20), matCuero);
      marcoCabina.rotation.x = Math.PI / 2;
      marcoCabina.position.set(-0.08, 0.41, 0);

      const parabrisas = new THREE.Mesh(crearCajaRedondeada(0.10, 0.09, 0.22, 3, 0.02), matCristal);
      parabrisas.position.set(0.08, 0.45, 0);
      parabrisas.rotation.z = -0.38;

      [-0.18, 0.18].forEach((zTren) => {
        const pata = new THREE.Mesh(crearCajaRedondeada(0.04, 0.22, 0.03, 2, 0.01), matMetal);
        pata.position.set(0.28, 0.13, zTren * 0.72);
        pata.rotation.x = zTren > 0 ? 0.25 : -0.25;
        const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.045, 16), matCaucho);
        rueda.rotation.x = Math.PI / 2;
        rueda.position.set(0.28, 0.068, zTren);
        rueda.castShadow = true;
        g.add(pata, rueda);
      });

      const patinCola = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.028, 12), matCaucho);
      patinCola.rotation.x = Math.PI / 2;
      patinCola.position.set(-0.62, 0.08, 0);

      const consola = crearConsolaMandoVehiculo('yugo', [0.06, 0.34, 0], colorHex);
      g.add(capotaMotor, fuselajeCentral, conoCola, marcoCabina, parabrisas, patinCola, consola);
      return g;
    }
  },
  {
    id: 'avion_jet',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Caza Interceptor X',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(80, 40, 20, 0.90, 1.05),
    vistaCabina: [0.04, 0.42, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.08, 0.24, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.66, 0.24, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.66, 0.28, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.4 });
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.92 });
      const matFuego = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.4 });
      const matCristal = crearMaterialCristalCabina();

      const morroJet = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.56, 16), matPintura);
      morroJet.rotation.z = -Math.PI / 2;
      morroJet.position.set(0.46, 0.23, 0);
      morroJet.castShadow = true;

      const fuselaje = new THREE.Mesh(crearCajaRedondeada(0.92, 0.20, 0.34, 4, 0.05), matPintura);
      fuselaje.position.set(-0.14, 0.23, 0);
      fuselaje.castShadow = true;

      [-0.21, 0.21].forEach((zToma) => {
        const toma = new THREE.Mesh(crearCajaRedondeada(0.44, 0.14, 0.11, 3, 0.02), matCarbono);
        toma.position.set(0.02, 0.22, zToma);
        const tobera = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.082, 0.16, 16), matTitanio);
        tobera.rotation.z = Math.PI / 2;
        tobera.position.set(-0.62, 0.22, zToma * 0.52);
        const postComb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), matFuego);
        postComb.rotation.z = Math.PI / 2;
        postComb.position.set(-0.69, 0.22, zToma * 0.52);
        const patin = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 12), matCarbono);
        patin.rotation.x = Math.PI / 2;
        patin.position.set(-0.24, 0.06, zToma * 0.8);
        g.add(toma, tobera, postComb, patin);
      });

      const canopy = new THREE.Mesh(crearCajaRedondeada(0.42, 0.14, 0.22, 4, 0.06), matCristal);
      canopy.position.set(0.06, 0.38, 0);

      const hud = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), matFuego);
      hud.position.set(0.24, 0.38, 0);
      hud.rotation.set(0, -Math.PI / 2, 0);

      const trenFrontal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), matCarbono);
      trenFrontal.rotation.x = Math.PI / 2;
      trenFrontal.position.set(0.32, 0.06, 0);

      const consola = crearConsolaMandoVehiculo('yugo', [0.16, 0.33, 0], colorHex);
      g.add(morroJet, fuselaje, canopy, hud, trenFrontal, consola);
      return g;
    }
  },
  {
    id: 'avion_steampunk',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Biplano Steampunk Brass',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(60, 42, 38, 0.84, 0.95),
    vistaCabina: [-0.08, 0.45, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [0.06, 0.25, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.68, 0.26, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.66, 0.28, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBronce = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.26, metalness: 0.88 });
      const matCobre = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.32, metalness: 0.82 });
      const matCuero = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.72 });
      const matCaucho = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.86 });
      const matCristal = crearMaterialCristalCabina();

      const calderaFrontal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.34, 20), matBronce);
      calderaFrontal.rotation.z = Math.PI / 2;
      calderaFrontal.position.set(0.46, 0.26, 0);
      calderaFrontal.castShadow = true;

      const fuselaje = new THREE.Mesh(crearCajaRedondeada(0.64, 0.28, 0.32, 4, 0.08), matPintura);
      fuselaje.position.set(0.06, 0.26, 0);
      fuselaje.castShadow = true;

      const conoCola = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.17, 0.54, 16), matPintura);
      conoCola.rotation.z = Math.PI / 2;
      conoCola.position.set(-0.46, 0.27, 0);

      [-0.12, 0.12, 0.34].forEach((xAro) => {
        const aroB = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 8, 20), matBronce);
        aroB.rotation.y = Math.PI / 2;
        aroB.position.set(xAro, 0.26, 0);
        g.add(aroB);
      });

      const chimeneaVapor = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.24, 12), matCobre);
      chimeneaVapor.position.set(0.38, 0.44, 0.12);
      const bocaChim = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.034, 0.04, 12), matBronce);
      bocaChim.position.set(0.38, 0.56, 0.12);

      [-0.18, 0.18].forEach((zEng) => {
        const engranaje = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 10), matBronce);
        engranaje.rotation.x = Math.PI / 2;
        engranaje.position.set(0.24, 0.25, zEng);
        const pata = new THREE.Mesh(crearCajaRedondeada(0.04, 0.22, 0.03, 2, 0.01), matCobre);
        pata.position.set(0.28, 0.13, zEng * 0.72);
        const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.042, 16), matCaucho);
        rueda.rotation.x = Math.PI / 2;
        rueda.position.set(0.28, 0.068, zEng);
        g.add(engranaje, pata, rueda);
      });

      const anilloCabina = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 10, 18), matCuero);
      anilloCabina.rotation.x = Math.PI / 2;
      anilloCabina.position.set(-0.08, 0.40, 0);

      const parabrisas = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 14), matCristal);
      parabrisas.rotation.z = Math.PI / 2 - 0.35;
      parabrisas.position.set(0.08, 0.44, 0);

      const consola = crearConsolaMandoVehiculo('yugo', [0.06, 0.36, 0], colorHex);
      g.add(calderaFrontal, fuselaje, conoCola, chimeneaVapor, bocaChim, anilloCabina, parabrisas, consola);
      return g;
    }
  },
  {
    id: 'avion_stealth',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Caza Furtivo Nightwing',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(78, 38, 24, 0.88, 1.00),
    vistaCabina: [0.06, 0.40, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.08, 0.23, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.68, 0.22, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.66, 0.26, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matAcento = crearMaterialPintura(colorHex);
      const matCarbono = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.35 });
      const matOscuro = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.45 });
      const matCristal = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.78 });

      const morroPiram = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.56, 4), matCarbono);
      morroPiram.rotation.z = -Math.PI / 2;
      morroPiram.rotation.x = Math.PI / 4;
      morroPiram.position.set(0.46, 0.21, 0);
      morroPiram.castShadow = true;

      const fuselajeFurt = new THREE.Mesh(crearCajaRedondeada(0.92, 0.16, 0.42, 2, 0.02), matCarbono);
      fuselajeFurt.position.set(-0.14, 0.21, 0);
      fuselajeFurt.castShadow = true;

      const lomoAcento = new THREE.Mesh(crearCajaRedondeada(0.76, 0.06, 0.22, 2, 0.015), matAcento);
      lomoAcento.position.set(-0.16, 0.29, 0);

      [-0.22, 0.22].forEach((zT) => {
        const tomaTrap = new THREE.Mesh(crearCajaRedondeada(0.44, 0.12, 0.12, 2, 0.015), matOscuro);
        tomaTrap.position.set(0.04, 0.20, zT);
        tomaTrap.rotation.x = zT > 0 ? -0.35 : 0.35;
        const bordePint = new THREE.Mesh(crearCajaRedondeada(0.48, 0.028, 0.05, 1, 0.008), matAcento);
        bordePint.position.set(-0.18, 0.22, zT * 1.1);
        const toberaPlana = new THREE.Mesh(crearCajaRedondeada(0.16, 0.09, 0.13, 2, 0.015), matOscuro);
        toberaPlana.position.set(-0.62, 0.21, zT * 0.48);
        const ruedaTras = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 12), matCarbono);
        ruedaTras.rotation.x = Math.PI / 2;
        ruedaTras.position.set(-0.24, 0.06, zT * 0.82);
        g.add(tomaTrap, bordePint, toberaPlana, ruedaTras);
      });

      const canopySigilo = new THREE.Mesh(crearCajaRedondeada(0.44, 0.12, 0.20, 2, 0.03), matCristal);
      canopySigilo.position.set(0.08, 0.34, 0);

      const ruedaDel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), matCarbono);
      ruedaDel.rotation.x = Math.PI / 2;
      ruedaDel.position.set(0.32, 0.06, 0);

      const consola = crearConsolaMandoVehiculo('yugo', [0.16, 0.32, 0], colorHex);
      g.add(morroPiram, fuselajeFurt, lomoAcento, canopySigilo, ruedaDel, consola);
      return g;
    }
  },
  {
    id: 'avion_hidroavion',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Hidroavión Explorer',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(62, 40, 38, 0.82, 1.15),
    vistaCabina: [0.02, 0.46, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [0.06, 0.40, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.64, 0.34, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.68, 0.34, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.7, roughness: 0.25 });
      const matMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.86 });
      const matCristal = crearMaterialCristalCabina();

      const morroMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 18), matMetal);
      morroMotor.rotation.z = Math.PI / 2;
      morroMotor.position.set(0.46, 0.34, 0);
      morroMotor.castShadow = true;

      const fuselaje = new THREE.Mesh(crearCajaRedondeada(0.68, 0.26, 0.34, 4, 0.06), matPintura);
      fuselaje.position.set(0.04, 0.32, 0);
      fuselaje.castShadow = true;

      const cabinaPanoramica = new THREE.Mesh(crearCajaRedondeada(0.42, 0.16, 0.30, 3, 0.04), matCristal);
      cabinaPanoramica.position.set(0.08, 0.45, 0);

      const conoCola = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.56, 16), matBlanco);
      conoCola.rotation.z = Math.PI / 2;
      conoCola.position.set(-0.48, 0.34, 0);

      // 2 grandes flotadores/pontones inferiores + 4 riostras metálicas
      [-0.24, 0.24].forEach((zFlot) => {
        const ponton = new THREE.Mesh(crearCajaRedondeada(1.06, 0.11, 0.15, 4, 0.045), matBlanco);
        ponton.position.set(0.06, 0.075, zFlot);
        ponton.castShadow = true;
        const proaPonton = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.18, 12), matPintura);
        proaPonton.rotation.z = -Math.PI / 2;
        proaPonton.position.set(0.65, 0.085, zFlot);
        [0.24, -0.18].forEach((xRiostra) => {
          const riostra = new THREE.Mesh(crearCajaRedondeada(0.035, 0.22, 0.03, 2, 0.008), matMetal);
          riostra.position.set(xRiostra, 0.19, zFlot * 0.72);
          riostra.rotation.x = zFlot > 0 ? 0.38 : -0.38;
          g.add(riostra);
        });
        g.add(ponton, proaPonton);
      });

      const consola = crearConsolaMandoVehiculo('yugo', [0.12, 0.38, 0], colorHex);
      g.add(morroMotor, fuselaje, cabinaPanoramica, conoCola, consola);
      return g;
    }
  },
  {
    id: 'avion_espacial',
    clase: 'avion',
    categoria: 'carroceria',
    nombre: 'Caza Estelar Nova-X',
    tipoEnganche: 'base',
    atributos: crearAtributosChasis(82, 38, 20, 0.92, 1.08),
    vistaCabina: [0.06, 0.42, 0.0],
    enganches: [
      { id: 'alas_principales', tipo: 'ala_avion', grupoSimetria: null, rolAnimacion: 'estatico', orientacionAnillo: [Math.PI / 2, 0, 0], posicion: [-0.06, 0.24, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] },
      { id: 'motor_frontal', tipo: 'motor_avion', grupoSimetria: null, rolAnimacion: 'helice_z', sentidoGiro: 1, orientacionAnillo: [0, 0, 0], posicion: [0.68, 0.23, 0], rotacion: [0, Math.PI / 2, 0], escala: [1, 1, 1] },
      { id: 'cola_timon', tipo: 'cola_avion', grupoSimetria: null, rolAnimacion: 'timon_y', orientacionAnillo: [0, Math.PI / 2, 0], posicion: [-0.66, 0.28, 0], rotacion: [0, 0, 0], escala: [1, 1, 1] }
    ],
    crear(colorHex) {
      const g = new THREE.Group();
      const matPintura = crearMaterialPintura(colorHex);
      const matBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 0.9, roughness: 0.2 });
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.88 });
      const matIon = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 });
      const matCristal = crearMaterialCristalCabina();

      const morroSciFi = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.56, 16), matBlanco);
      morroSciFi.rotation.z = -Math.PI / 2;
      morroSciFi.position.set(0.46, 0.23, 0);
      morroSciFi.castShadow = true;

      const fuselaje = new THREE.Mesh(crearCajaRedondeada(0.92, 0.20, 0.34, 4, 0.05), matPintura);
      fuselaje.position.set(-0.14, 0.23, 0);
      fuselaje.castShadow = true;

      const nucleoEnergia = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 16), matIon);
      nucleoEnergia.position.set(-0.26, 0.34, 0);

      const canopyEspacial = new THREE.Mesh(crearCajaRedondeada(0.42, 0.14, 0.22, 4, 0.06), matCristal);
      canopyEspacial.position.set(0.08, 0.38, 0);

      [-0.22, 0.22].forEach((zLado) => {
        const gondola = new THREE.Mesh(crearCajaRedondeada(0.56, 0.13, 0.12, 3, 0.03), matTitanio);
        gondola.position.set(-0.12, 0.22, zLado);
        const canonLaser = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.34, 10), matTitanio);
        canonLaser.rotation.z = Math.PI / 2;
        canonLaser.position.set(0.42, 0.20, zLado * 0.68);
        const toberaIon = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.082, 0.16, 16), matTitanio);
        toberaIon.rotation.z = Math.PI / 2;
        toberaIon.position.set(-0.62, 0.23, zLado * 0.52);
        const llamaIon = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.06, 14), matIon);
        llamaIon.rotation.z = Math.PI / 2;
        llamaIon.position.set(-0.70, 0.23, zLado * 0.52);
        g.add(gondola, canonLaser, toberaIon, llamaIon);
      });

      const consola = crearConsolaMandoVehiculo('yugo', [0.14, 0.34, 0], colorHex);
      g.add(morroSciFi, fuselaje, nucleoEnergia, canopyEspacial, consola);
      return g;
    }
  }
];

// Tabla de PIEZAS intercambiables (4 llantas detalladas + 3 accesorios + opción ninguno)
export const TABLA_PIEZAS = [
  {
    id: 'rueda_clasica',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'Clásica',
    tipoEnganche: 'rueda',
    modStats: { velocidad: 2, aceleracion: 2, control: 2 },
    /**
     * Crea la rueda Clásica con banda de rodadura en V, rin cromado multirradio
     * de garganta profunda, tuerca central hexagonal y disco de freno ventilado.
     */
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('clasica', 0x1a1e26);
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.94 });
      const matOscuro = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 });

      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.052, 18, 32), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      agregarDiscoYMordaza(g, 0.086);

      // Garganta profunda cromada exterior
      const garganta = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.095, 0.072, 24, 1, true),
        matCromo
      );
      garganta.rotation.x = Math.PI / 2;
      garganta.position.z = 0.006;

      const aroExterior = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.011, 10, 28), matCromo);
      aroExterior.position.z = 0.040;

      // 10 radios finos cromados
      const geoRadio = crearCajaRedondeada(0.165, 0.013, 0.014, 2, 0.004);
      for (let i = 0; i < 5; i++) {
        const radio = new THREE.Mesh(geoRadio, matCromo);
        radio.rotation.z = (i * Math.PI) / 5;
        radio.position.z = 0.022;
        g.add(radio);
      }

      // Centro y tuerca central hexagonal
      const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.03, 16), matOscuro);
      centro.rotation.x = Math.PI / 2;
      centro.position.z = 0.024;

      const tuercaHex = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), matCromo);
      tuercaHex.rotation.x = Math.PI / 2;
      tuercaHex.position.z = 0.042;

      g.add(garganta, aroExterior, centro, tuercaHex);
      return g;
    }
  },
  {
    id: 'rueda_todoterreno',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'Todoterreno',
    tipoEnganche: 'rueda',
    modStats: { velocidad: -3, aceleracion: 3, control: 6 },
    /**
     * Crea la rueda Todoterreno sobredimensionada con textura de tacos escalonados,
     * doble fila de tacos 3D laterales y rin beadlock reforzado con pernos visibles.
     */
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('todoterreno', 0x16191e);
      const matRin = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.85 });
      const matBeadlock = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.92 });
      const matPerno = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.95 });

      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.062, 18, 28), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      // Doble fila de tacos laterales 3D escalonados
      const geoTaco = crearCajaRedondeada(0.038, 0.030, 0.046, 2, 0.006);
      for (let i = 0; i < 12; i++) {
        const ang1 = (i * Math.PI * 2) / 12;
        const tacoA = new THREE.Mesh(geoTaco, matCaucho);
        tacoA.position.set(Math.cos(ang1) * 0.184, Math.sin(ang1) * 0.184, 0.025);
        tacoA.rotation.z = ang1;
        tacoA.castShadow = true;

        const ang2 = ang1 + Math.PI / 12;
        const tacoB = new THREE.Mesh(geoTaco, matCaucho);
        tacoB.position.set(Math.cos(ang2) * 0.184, Math.sin(ang2) * 0.184, -0.025);
        tacoB.rotation.z = ang2;
        tacoB.castShadow = true;

        g.add(tacoA, tacoB);
      }

      agregarDiscoYMordaza(g, 0.082);

      // Tambor reforzado y 6 radios gruesos
      const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.07, 18), matRin);
      tambor.rotation.x = Math.PI / 2;
      g.add(tambor);

      // Anillo beadlock exterior con 10 pernos visibles
      const anilloBeadlock = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.014, 10, 24), matBeadlock);
      anilloBeadlock.position.z = 0.042;
      g.add(anilloBeadlock);

      const geoPerno = new THREE.CylinderGeometry(0.005, 0.005, 0.015, 6);
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI * 2) / 10;
        const perno = new THREE.Mesh(geoPerno, matPerno);
        perno.rotation.x = Math.PI / 2;
        perno.position.set(Math.cos(ang) * 0.088, Math.sin(ang) * 0.088, 0.052);
        g.add(perno);
      }

      // Tapacubos central todoterreno
      const cuboCentral = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.036, 12), matBeadlock);
      cuboCentral.rotation.x = Math.PI / 2;
      cuboCentral.position.z = 0.038;
      g.add(cuboCentral);
      return g;
    }
  },
  {
    id: 'rueda_deportiva',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'Deportiva',
    tipoEnganche: 'rueda',
    modStats: { velocidad: 6, aceleracion: 2, control: -3 },
    /**
     * Crea la rueda Deportiva de perfil bajo con textura direccional en V,
     * rin de aleación ligera con 5 radios dobles en V bitono, tuerca roja y disco ventilado.
     */
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('deportiva', 0x181c24);
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.88 });
      const matMecanizado = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.14, metalness: 0.94 });
      const matCentroRojo = new THREE.MeshPhysicalMaterial({ color: 0xff1e27, clearcoat: 1.0, roughness: 0.2, metalness: 0.4 });

      // Perfil bajo deportivo
      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.042, 18, 32), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      agregarDiscoYMordaza(g, 0.094);

      const aroBitono = new THREE.Mesh(new THREE.TorusGeometry(0.100, 0.011, 10, 28), matTitanio);
      aroBitono.position.z = 0.026;
      const labioPlata = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.006, 8, 28), matMecanizado);
      labioPlata.position.z = 0.034;

      // 5 radios dobles en "V" bitono
      const geoBrazo = crearCajaRedondeada(0.088, 0.012, 0.015, 2, 0.004);
      for (let i = 0; i < 5; i++) {
        const angBase = (i * Math.PI * 2) / 5;
        [-0.20, 0.20].forEach((apertura) => {
          const brazo = new THREE.Mesh(geoBrazo, i % 2 === 0 ? matMecanizado : matTitanio);
          const ang = angBase + apertura * 0.55;
          brazo.position.set(Math.cos(ang) * 0.056, Math.sin(ang) * 0.056, 0.026);
          brazo.rotation.z = ang + apertura * 0.35;
          g.add(brazo);
        });
      }

      // Tuerca central de competición anodizada en rojo
      const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.035, 16), matCentroRojo);
      buje.rotation.x = Math.PI / 2;
      buje.position.z = 0.028;

      g.add(aroBitono, labioPlata, buje);
      return g;
    }
  },
  {
    id: 'rueda_juguete',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'De Juguete',
    tipoEnganche: 'rueda',
    modStats: { velocidad: 1, aceleracion: 5, control: 3 },
    /**
     * Crea la rueda estilo Turbo Fanblade con banda de rodadura procedural,
     * aletas aerodinámicas direccionales, anillos de color vivo y tapacubos central.
     */
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('clasica', 0x1e222a);
      const matAmarillo = new THREE.MeshPhysicalMaterial({ color: 0xffdd00, clearcoat: 1.0, roughness: 0.2, metalness: 0.35 });
      const matCian = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, clearcoat: 1.0, roughness: 0.2, metalness: 0.35 });
      const matOscuro = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });

      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.054, 18, 30), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      agregarDiscoYMordaza(g, 0.084);

      // Disco turbo aerodinámico base
      const platoTurbo = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.094, 0.032, 24), matOscuro);
      platoTurbo.rotation.x = Math.PI / 2;
      platoTurbo.position.z = 0.022;

      // Anillo exterior en Amarillo Cyber
      const anilloColor = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.011, 10, 28), matAmarillo);
      anilloColor.position.z = 0.036;

      // 8 aletas direccionales estilo fanblade
      const geoAleta = crearCajaRedondeada(0.062, 0.014, 0.014, 2, 0.004);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        const aleta = new THREE.Mesh(geoAleta, i % 2 === 0 ? matAmarillo : matCian);
        aleta.position.set(Math.cos(ang) * 0.056, Math.sin(ang) * 0.056, 0.038);
        aleta.rotation.z = ang + 0.45;
        g.add(aleta);
      }

      // Tapacubos central en relieve bitono
      const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.022, 18), matCian);
      tapa.rotation.x = Math.PI / 2;
      tapa.position.z = 0.042;
      const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.014, 14), matAmarillo);
      boton.rotation.x = Math.PI / 2;
      boton.position.z = 0.052;

      g.add(platoTurbo, anilloColor, tapa, boton);
      return g;
    }
  },
  {
    id: 'acc_aleron',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    nombre: 'Alerón',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: 2, aceleracion: 0, control: 5 },
    /**
     * Crea el accesorio Alerón de competición.
     * Por qué: personaliza el vehículo con estética de pista de carreras (B2).
     */
    crear() {
      const g = new THREE.Group();
      const matAla = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, clearcoat: 1.0, roughness: 0.2, metalness: 0.3 });
      const matSoporte = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

      const ala = new THREE.Mesh(crearCajaRedondeada(0.18, 0.03, 0.58, 3, 0.01), matAla);
      ala.position.y = 0.11;
      ala.castShadow = true;

      [-0.18, 0.18].forEach((z) => {
        const soporte = new THREE.Mesh(crearCajaRedondeada(0.08, 0.10, 0.03, 2, 0.008), matSoporte);
        soporte.position.set(0, 0.05, z);
        g.add(soporte);
      });
      [-0.29, 0.29].forEach((z) => {
        const aleta = new THREE.Mesh(crearCajaRedondeada(0.20, 0.07, 0.025, 2, 0.008), matAla);
        aleta.position.set(0, 0.11, z);
        g.add(aleta);
      });
      g.add(ala);
      return g;
    }
  },
  {
    id: 'acc_antena',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    nombre: 'Antena',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: 1, aceleracion: 4, control: 2 },
    /**
     * Crea el accesorio Antena de radiocontrol.
     * Por qué: da aspecto de carro a control remoto al conducir por la habitación.
     */
    crear() {
      const g = new THREE.Group();
      const matMetal = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
      const matPunta = new THREE.MeshStandardMaterial({ color: 0xff1e27, emissive: 0x991b1b, emissiveIntensity: 0.4, roughness: 0.3 });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.04, 16), matMetal);
      base.position.y = 0.02;
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 0.34, 12), matMetal);
      mastil.position.set(-0.03, 0.18, 0);
      mastil.rotation.z = 0.18;
      const esfera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), matPunta);
      esfera.position.set(-0.06, 0.35, 0);
      esfera.castShadow = true;

      g.add(base, mastil, esfera);
      return g;
    }
  },
  {
    id: 'acc_portaequipajes',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    nombre: 'Portaequipajes',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: -2, aceleracion: -1, control: 6 },
    /**
     * Crea el accesorio Portaequipajes con parrilla y maleta.
     * Por qué: ofrece una alternativa aventurera para la camioneta o el sedán.
     */
    crear() {
      const g = new THREE.Group();
      const matMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
      const matMaleta = new THREE.MeshStandardMaterial({ color: 0xff5e00, roughness: 0.45 });

      [-0.20, 0.20].forEach((z) => {
        const barra = new THREE.Mesh(crearCajaRedondeada(0.44, 0.025, 0.025, 2, 0.008), matMetal);
        barra.position.set(0, 0.03, z);
        g.add(barra);
      });
      [-0.18, 0, 0.18].forEach((x) => {
        const trav = new THREE.Mesh(crearCajaRedondeada(0.025, 0.02, 0.42, 2, 0.006), matMetal);
        trav.position.set(x, 0.02, 0);
        g.add(trav);
      });
      const maleta = new THREE.Mesh(crearCajaRedondeada(0.28, 0.09, 0.26, 3, 0.02), matMaleta);
      maleta.position.set(0, 0.075, 0);
      maleta.castShadow = true;
      g.add(maleta);
      return g;
    }
  },
  {
    id: 'acc_ninguno',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    esVacio: true,
    nombre: 'Ninguno',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: 0, aceleracion: 2, control: 0 },
    crear() {
      return null;
    }
  },
  {
    id: 'rueda_oruga_tank',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'Oruga Triangular',
    tipoEnganche: 'rueda',
    modStats: { velocidad: -4, aceleracion: 5, control: 7 },
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('todoterreno', 0x111827);
      const matAcero = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.85 });
      const matAmarillo = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });

      const baseBanda = new THREE.Mesh(crearCajaRedondeada(0.28, 0.042, 0.14, 2, 0.015), matCaucho);
      baseBanda.position.set(0, -0.10, 0);
      baseBanda.castShadow = true;
      const ladoDel = new THREE.Mesh(crearCajaRedondeada(0.22, 0.04, 0.14, 2, 0.015), matCaucho);
      ladoDel.position.set(0.075, 0.0, 0);
      ladoDel.rotation.z = -0.92;
      const ladoTras = new THREE.Mesh(crearCajaRedondeada(0.22, 0.04, 0.14, 2, 0.015), matCaucho);
      ladoTras.position.set(-0.075, 0.0, 0);
      ladoTras.rotation.z = 0.92;
      g.add(baseBanda, ladoDel, ladoTras);

      [
        [0, 0.075, 0.056],
        [-0.10, -0.065, 0.046],
        [0.10, -0.065, 0.046]
      ].forEach(([rx, ry, rad]) => {
        const rodillo = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.125, 16), matAcero);
        rodillo.rotation.x = Math.PI / 2;
        rodillo.position.set(rx, ry, 0);
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, 0.02, 12), matAmarillo);
        tapa.rotation.x = Math.PI / 2;
        tapa.position.set(rx, ry, 0.065);
        g.add(rodillo, tapa);
      });

      const brazoSop = new THREE.Mesh(crearCajaRedondeada(0.18, 0.06, 0.03, 2, 0.01), matAcero);
      brazoSop.position.set(0, -0.01, 0.045);
      g.add(brazoSop);
      return g;
    }
  },
  {
    id: 'rueda_dorada_lujo',
    categoria: 'rueda',
    clasesCompatibles: ['coche'],
    nombre: 'Rin Imperial Gold',
    tipoEnganche: 'rueda',
    modStats: { velocidad: 5, aceleracion: 3, control: -2 },
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('deportiva', 0x151921);
      const matOro = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.16, metalness: 0.94 });
      const matCentro = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });

      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.136, 0.036, 18, 32), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      agregarDiscoYMordaza(g, 0.098);

      const aroOro = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.011, 10, 30), matOro);
      aroOro.position.z = 0.028;
      g.add(aroOro);

      const geoRadioOro = crearCajaRedondeada(0.19, 0.010, 0.014, 2, 0.004);
      for (let i = 0; i < 6; i++) {
        const radio = new THREE.Mesh(geoRadioOro, matOro);
        radio.rotation.z = (i * Math.PI) / 6;
        radio.position.z = 0.026;
        g.add(radio);
      }

      const tapaCentral = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.032, 16), matCentro);
      tapaCentral.rotation.x = Math.PI / 2;
      tapaCentral.position.z = 0.028;
      const tuercaOro = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), matOro);
      tuercaOro.rotation.x = Math.PI / 2;
      tuercaOro.position.z = 0.042;
      g.add(tapaCentral, tuercaOro);
      return g;
    }
  },
  {
    id: 'acc_cohete_techo',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    nombre: 'Doble Cohete Nitro',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: 7, aceleracion: 5, control: -4 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 });
      const matPintura = crearMaterialPintura(colorHex);
      const matFuego = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x0284c7, emissiveIntensity: 1.5 });
      const matNaranja = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.2 });

      const cuna = new THREE.Mesh(crearCajaRedondeada(0.24, 0.04, 0.34, 2, 0.01), matCromo);
      cuna.position.y = 0.02;
      g.add(cuna);

      [-0.12, 0.12].forEach((zOff) => {
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.42, 16), matCromo);
        tubo.rotation.z = Math.PI / 2;
        tubo.position.set(0, 0.085, zOff);
        tubo.castShadow = true;
        const ojiva = new THREE.Mesh(new THREE.ConeGeometry(0.064, 0.12, 16), matPintura);
        ojiva.rotation.z = -Math.PI / 2;
        ojiva.position.set(0.27, 0.085, zOff);
        const tobera = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.068, 0.08, 14), matNaranja);
        tobera.rotation.z = Math.PI / 2;
        tobera.position.set(-0.24, 0.085, zOff);
        const llama = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.14, 14), matFuego);
        llama.rotation.z = Math.PI / 2;
        llama.position.set(-0.33, 0.085, zOff);
        g.add(tubo, ojiva, tobera, llama);
      });
      return g;
    }
  },
  {
    id: 'acc_sirena_policia',
    categoria: 'accesorio',
    clasesCompatibles: ['coche'],
    nombre: 'Puente Sirena LED',
    tipoEnganche: 'accesorio',
    modStats: { velocidad: 2, aceleracion: 3, control: 3 },
    crear() {
      const g = new THREE.Group();
      const matBase = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
      const matRojo = new THREE.MeshStandardMaterial({ color: 0xff1e27, emissive: 0xdc2626, emissiveIntensity: 1.5 });
      const matAzul = new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x2563eb, emissiveIntensity: 1.5 });
      const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xe2e8f0, emissiveIntensity: 0.7 });

      const barra = new THREE.Mesh(crearCajaRedondeada(0.16, 0.035, 0.52, 2, 0.01), matBase);
      barra.position.y = 0.025;
      const bocina = new THREE.Mesh(crearCajaRedondeada(0.17, 0.065, 0.12, 2, 0.01), matBlanco);
      bocina.position.set(0, 0.065, 0);
      const ledIzq = new THREE.Mesh(crearCajaRedondeada(0.16, 0.068, 0.19, 3, 0.02), matRojo);
      ledIzq.position.set(0, 0.068, -0.17);
      const ledDer = new THREE.Mesh(crearCajaRedondeada(0.16, 0.068, 0.19, 3, 0.02), matAzul);
      ledDer.position.set(0, 0.068, 0.17);
      g.add(barra, bocina, ledIzq, ledDer);
      return g;
    }
  },
  // ====================== PIEZAS MOTO ======================
  {
    id: 'rueda_moto_slick',
    categoria: 'rueda_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Slick GP',
    tipoEnganche: 'rueda_moto',
    modStats: { velocidad: 6, aceleracion: 2, control: -3 },
    crear() {
      return crearMallaRuedaMoto(0.145, 0.036, 'deportiva', 0xe2e8f0, false);
    }
  },
  {
    id: 'rueda_moto_tacos',
    categoria: 'rueda_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Tacos Cross',
    tipoEnganche: 'rueda_moto',
    modStats: { velocidad: -3, aceleracion: 3, control: 6 },
    crear() {
      const g = crearMallaRuedaMoto(0.15, 0.038, 'todoterreno', 0x475569, false);
      const matTaco = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.92 });
      const geoTaco = crearCajaRedondeada(0.022, 0.02, 0.038, 1, 0.004);
      for (let i = 0; i < 14; i++) {
        const ang = (i * Math.PI * 2) / 14;
        const taco = new THREE.Mesh(geoTaco, matTaco);
        taco.position.set(Math.cos(ang) * 0.188, Math.sin(ang) * 0.188, 0);
        taco.rotation.z = ang;
        g.add(taco);
      }
      return g;
    }
  },
  {
    id: 'rueda_moto_neon',
    categoria: 'rueda_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Aro Neón',
    tipoEnganche: 'rueda_moto',
    modStats: { velocidad: 3, aceleracion: 4, control: 2 },
    crear() {
      return crearMallaRuedaMoto(0.145, 0.034, 'clasica', 0x0f172a, true);
    }
  },
  {
    id: 'acc_moto_turbina',
    categoria: 'accesorio_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Escape Doble',
    tipoEnganche: 'accesorio_moto',
    modStats: { velocidad: 3, aceleracion: 5, control: -1 },
    crear() {
      const g = new THREE.Group();
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.2 });
      const matNitro = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.1 });
      [-0.10, 0.10].forEach((zOff) => {
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.24, 14), matTitanio);
        tubo.rotation.z = Math.PI / 2 - 0.15;
        tubo.position.set(-0.04, 0.02, zOff);
        const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 12), matNitro);
        boca.rotation.z = Math.PI / 2 - 0.15;
        boca.position.set(-0.16, 0.04, zOff);
        g.add(tubo, boca);
      });
      return g;
    }
  },
  {
    id: 'acc_moto_maletin',
    categoria: 'accesorio_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Top Case',
    tipoEnganche: 'accesorio_moto',
    modStats: { velocidad: -2, aceleracion: 0, control: 5 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
      const matTapa = crearMaterialPintura(colorHex);
      const caja = new THREE.Mesh(crearCajaRedondeada(0.24, 0.14, 0.24, 3, 0.03), matBase);
      caja.position.set(-0.08, 0.10, 0);
      caja.castShadow = true;
      const tapa = new THREE.Mesh(crearCajaRedondeada(0.25, 0.05, 0.25, 3, 0.02), matTapa);
      tapa.position.set(-0.08, 0.17, 0);
      g.add(caja, tapa);
      return g;
    }
  },
  {
    id: 'acc_moto_ninguno',
    categoria: 'accesorio_moto',
    clasesCompatibles: ['moto'],
    esVacio: true,
    nombre: 'Ninguno',
    tipoEnganche: 'accesorio_moto',
    modStats: { velocidad: 0, aceleracion: 2, control: 0 },
    crear() {
      return null;
    }
  },
  {
    id: 'rueda_moto_radios',
    categoria: 'rueda_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Clásica de Radios',
    tipoEnganche: 'rueda_moto',
    modStats: { velocidad: 2, aceleracion: 4, control: 3 },
    crear() {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('clasica', 0x1a1e26);
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.12, metalness: 0.96 });

      const neumatico = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.036, 18, 32), matCaucho);
      neumatico.castShadow = true;
      g.add(neumatico);

      agregarDiscoYMordaza(g, 0.102);

      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.114, 0.011, 10, 30), matCromo);
      g.add(aro);

      const radioGeo = crearCajaRedondeada(0.22, 0.005, 0.005, 1, 0.001);
      for (let i = 0; i < 9; i++) {
        const rad = new THREE.Mesh(radioGeo, matCromo);
        rad.rotation.z = (i * Math.PI) / 9;
        rad.rotation.y = i % 2 === 0 ? 0.08 : -0.08;
        g.add(rad);
      }

      const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.056, 16), matCromo);
      buje.rotation.x = Math.PI / 2;
      g.add(buje);
      return g;
    }
  },
  {
    id: 'rueda_moto_dragster',
    categoria: 'rueda_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Slick Ancha Drag',
    tipoEnganche: 'rueda_moto',
    modStats: { velocidad: 7, aceleracion: 5, control: -5 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matCaucho = crearMaterialCaucho('deportiva', 0x11151c);
      const matAnod = crearMaterialPintura(colorHex);
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.88 });

      const bandaAncha = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.125, 28), matCaucho);
      bandaAncha.rotation.x = Math.PI / 2;
      bandaAncha.castShadow = true;
      g.add(bandaAncha);

      agregarDiscoYMordaza(g, 0.105);

      [-0.048, 0.048].forEach((zAro) => {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.114, 0.012, 10, 26), matAnod);
        aro.position.z = zAro;
        g.add(aro);
      });

      const discoRin = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.075, 22), matTitanio);
      discoRin.rotation.x = Math.PI / 2;
      const bujeAnod = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.135, 16), matAnod);
      bujeAnod.rotation.x = Math.PI / 2;
      g.add(discoRin, bujeAnod);
      return g;
    }
  },
  {
    id: 'acc_moto_aleron_gp',
    categoria: 'accesorio_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Winglets MotoGP',
    tipoEnganche: 'accesorio_moto',
    modStats: { velocidad: 4, aceleracion: 2, control: 5 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matCarb = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.38, metalness: 0.4 });
      const matAcento = crearMaterialPintura(colorHex);

      const colin = new THREE.Mesh(crearCajaRedondeada(0.24, 0.06, 0.16, 3, 0.02), matCarb);
      colin.position.set(-0.04, 0.06, 0);
      colin.rotation.z = 0.2;
      const planoSup = new THREE.Mesh(crearCajaRedondeada(0.12, 0.022, 0.36, 2, 0.008), matAcento);
      planoSup.position.set(-0.10, 0.11, 0);
      g.add(colin, planoSup);

      [-0.17, 0.17].forEach((zW) => {
        const wing = new THREE.Mesh(crearCajaRedondeada(0.15, 0.08, 0.025, 2, 0.008), matCarb);
        wing.position.set(-0.10, 0.09, zW);
        wing.rotation.x = zW > 0 ? -0.18 : 0.18;
        g.add(wing);
      });
      return g;
    }
  },
  {
    id: 'acc_moto_nitro',
    categoria: 'accesorio_moto',
    clasesCompatibles: ['moto'],
    nombre: 'Botellas NOS Duales',
    tipoEnganche: 'accesorio_moto',
    modStats: { velocidad: 6, aceleracion: 6, control: -3 },
    crear() {
      const g = new THREE.Group();
      const matNos = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, clearcoat: 1.0, roughness: 0.18, metalness: 0.5 });
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.94, roughness: 0.15 });
      const soporte = new THREE.Mesh(crearCajaRedondeada(0.14, 0.03, 0.24, 2, 0.008), matCromo);
      soporte.position.set(-0.05, 0.02, 0);
      g.add(soporte);

      [-0.09, 0.09].forEach((zN) => {
        const botella = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.22, 16), matNos);
        botella.rotation.z = Math.PI / 2 - 0.25;
        botella.position.set(-0.06, 0.075, zN);
        const valvula = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.05, 12), matCromo);
        valvula.rotation.z = Math.PI / 2 - 0.25;
        valvula.position.set(0.05, 0.105, zN);
        g.add(botella, valvula);
      });
      return g;
    }
  },
  // ====================== PIEZAS BARCO ======================
  {
    id: 'prop_helice_bronce',
    categoria: 'propulsor_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Hélice Bronce',
    tipoEnganche: 'propulsor_barco',
    modStats: { velocidad: 2, aceleracion: 3, control: 2 },
    crear() {
      const g = new THREE.Group();
      const matBronce = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.88, roughness: 0.22 });
      const cono = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.11, 14), matBronce);
      cono.rotation.x = -Math.PI / 2;
      g.add(cono);
      for (let i = 0; i < 3; i++) {
        const pala = new THREE.Mesh(crearCajaRedondeada(0.038, 0.11, 0.012, 2, 0.004), matBronce);
        const ang = (i * Math.PI * 2) / 3;
        pala.position.set(Math.cos(ang) * 0.068, Math.sin(ang) * 0.068, 0);
        pala.rotation.z = ang + Math.PI / 2;
        pala.rotation.y = 0.42;
        g.add(pala);
      }
      return g;
    }
  },
  {
    id: 'prop_doble_turbina',
    categoria: 'propulsor_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Doble Hidrojet',
    tipoEnganche: 'propulsor_barco',
    modStats: { velocidad: 3, aceleracion: 5, control: 1 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matMetal = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const matBrillo = new THREE.MeshStandardMaterial({ color: colorHex, emissive: 0x0ea5e9, emissiveIntensity: 0.9 });
      [-0.11, 0.11].forEach((xOff) => {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.014, 10, 20), matMetal);
        aro.position.set(xOff, 0, 0);
        const aspa1 = new THREE.Mesh(crearCajaRedondeada(0.09, 0.016, 0.012, 1, 0.003), matBrillo);
        aspa1.position.set(xOff, 0, 0);
        const aspa2 = new THREE.Mesh(crearCajaRedondeada(0.016, 0.09, 0.012, 1, 0.003), matBrillo);
        aspa2.position.set(xOff, 0, 0);
        g.add(aro, aspa1, aspa2);
      });
      return g;
    }
  },
  {
    id: 'prop_ventilador_pantano',
    categoria: 'propulsor_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Turbina Pantano',
    tipoEnganche: 'propulsor_barco',
    modStats: { velocidad: 6, aceleracion: -1, control: 3 },
    crear() {
      const g = new THREE.Group();
      const matJaula = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 });
      const matPala = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 10, 26), matJaula);
      aro.position.y = 0.09;
      g.add(aro);
      for (let i = 0; i < 4; i++) {
        const pala = new THREE.Mesh(crearCajaRedondeada(0.032, 0.13, 0.012, 2, 0.003), matPala);
        const ang = (i * Math.PI) / 2;
        pala.position.set(Math.cos(ang) * 0.068, 0.09 + Math.sin(ang) * 0.068, 0);
        pala.rotation.z = ang + Math.PI / 2;
        g.add(pala);
      }
      return g;
    }
  },
  {
    id: 'timon_doble_aleta',
    categoria: 'timon_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Timón Doble',
    tipoEnganche: 'timon_barco',
    modStats: { velocidad: -1, aceleracion: 1, control: 6 },
    crear() {
      const g = new THREE.Group();
      const matMetal = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.82, roughness: 0.28 });
      const barra = new THREE.Mesh(crearCajaRedondeada(0.06, 0.025, 0.28, 2, 0.006), matMetal);
      g.add(barra);
      [-0.12, 0.12].forEach((zOff) => {
        const aleta = new THREE.Mesh(crearCajaRedondeada(0.10, 0.14, 0.018, 2, 0.004), matMetal);
        aleta.position.set(-0.05, -0.04, zOff);
        g.add(aleta);
      });
      return g;
    }
  },
  {
    id: 'timon_competicion',
    categoria: 'timon_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Timón Carbono',
    tipoEnganche: 'timon_barco',
    modStats: { velocidad: 4, aceleracion: 2, control: 3 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matCarb = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.4 });
      const matAcento = crearMaterialPintura(colorHex);
      const pala = new THREE.Mesh(crearCajaRedondeada(0.14, 0.18, 0.022, 2, 0.005), matCarb);
      pala.position.set(-0.04, -0.02, 0);
      const borde = new THREE.Mesh(crearCajaRedondeada(0.12, 0.03, 0.032, 2, 0.005), matAcento);
      borde.position.set(-0.04, 0.08, 0);
      g.add(pala, borde);
      return g;
    }
  },
  {
    id: 'acc_barco_radar',
    categoria: 'accesorio_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Arco Radar',
    tipoEnganche: 'accesorio_barco',
    modStats: { velocidad: 0, aceleracion: 2, control: 5 },
    crear() {
      const g = new THREE.Group();
      const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
      const matDomo = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.6 });
      [-0.20, 0.20].forEach((zPost) => {
        const poste = new THREE.Mesh(crearCajaRedondeada(0.05, 0.18, 0.04, 2, 0.008), matBlanco);
        poste.position.set(0, 0.08, zPost);
        g.add(poste);
      });
      const puente = new THREE.Mesh(crearCajaRedondeada(0.08, 0.04, 0.46, 2, 0.01), matBlanco);
      puente.position.set(0, 0.18, 0);
      const radar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.055, 16), matDomo);
      radar.position.set(0, 0.22, 0);
      g.add(puente, radar);
      return g;
    }
  },
  {
    id: 'acc_barco_spoiler',
    categoria: 'accesorio_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Alerón Marino',
    tipoEnganche: 'accesorio_barco',
    modStats: { velocidad: 4, aceleracion: 1, control: 3 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matBase = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
      const ala = new THREE.Mesh(crearCajaRedondeada(0.18, 0.03, 0.62, 3, 0.01), matAla);
      ala.position.set(-0.08, 0.14, 0);
      ala.castShadow = true;
      [-0.18, 0.18].forEach((zS) => {
        const sop = new THREE.Mesh(crearCajaRedondeada(0.10, 0.14, 0.03, 2, 0.008), matBase);
        sop.position.set(-0.08, 0.07, zS);
        g.add(sop);
      });
      g.add(ala);
      return g;
    }
  },
  {
    id: 'acc_barco_ninguno',
    categoria: 'accesorio_barco',
    clasesCompatibles: ['barco'],
    esVacio: true,
    nombre: 'Ninguno',
    tipoEnganche: 'accesorio_barco',
    modStats: { velocidad: 0, aceleracion: 2, control: 0 },
    crear() {
      return null;
    }
  },
  {
    id: 'prop_reactor_plasma',
    categoria: 'propulsor_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Turbina Plasma',
    tipoEnganche: 'propulsor_barco',
    modStats: { velocidad: 8, aceleracion: 4, control: -3 },
    crear() {
      const g = new THREE.Group();
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.22 });
      const matPlasma = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 });
      const anilloExt = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 12, 24), matTitanio);
      const anilloInt = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.012, 10, 24), matPlasma);
      const nucleo = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 14), matPlasma);
      nucleo.rotation.x = -Math.PI / 2;
      g.add(anilloExt, anilloInt, nucleo);
      for (let i = 0; i < 6; i++) {
        const aspa = new THREE.Mesh(crearCajaRedondeada(0.022, 0.17, 0.01, 1, 0.002), matTitanio);
        aspa.rotation.z = (i * Math.PI) / 6;
        g.add(aspa);
      }
      return g;
    }
  },
  {
    id: 'prop_rueda_paletas',
    categoria: 'propulsor_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Rodillo de Paletas',
    tipoEnganche: 'propulsor_barco',
    modStats: { velocidad: -2, aceleracion: 6, control: 5 },
    crear() {
      const g = new THREE.Group();
      const matRojo = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
      const matMadera = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.72 });
      const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.28, 18), matRojo);
      tambor.rotation.z = Math.PI / 2;
      g.add(tambor);
      [-0.14, 0.14].forEach((xAro) => {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.014, 8, 20), matRojo);
        aro.rotation.y = Math.PI / 2;
        aro.position.x = xAro;
        g.add(aro);
      });
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const paleta = new THREE.Mesh(crearCajaRedondeada(0.26, 0.018, 0.075, 1, 0.004), matMadera);
        paleta.position.set(0, Math.sin(ang) * 0.12, Math.cos(ang) * 0.12);
        paleta.rotation.x = -ang;
        g.add(paleta);
      }
      return g;
    }
  },
  {
    id: 'timon_aleta_tiburon',
    categoria: 'timon_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Timón Tiburón',
    tipoEnganche: 'timon_barco',
    modStats: { velocidad: 2, aceleracion: 2, control: 6 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matGris = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.65 });
      const matAcento = crearMaterialPintura(colorHex);
      const aleta = new THREE.Mesh(crearCajaRedondeada(0.16, 0.24, 0.024, 3, 0.01), matGris);
      aleta.position.set(-0.04, 0.01, 0);
      aleta.rotation.z = -0.35;
      const punta = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.12, 10), matAcento);
      punta.position.set(-0.07, 0.14, 0);
      punta.rotation.z = -0.35;
      g.add(aleta, punta);
      return g;
    }
  },
  {
    id: 'acc_barco_canones',
    categoria: 'accesorio_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Batería Pirata',
    tipoEnganche: 'accesorio_barco',
    modStats: { velocidad: 4, aceleracion: 5, control: -2 },
    crear() {
      const g = new THREE.Group();
      const matMadera = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 });
      const matBronce = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.26 });
      const matBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

      const plataforma = new THREE.Mesh(crearCajaRedondeada(0.24, 0.03, 0.44, 2, 0.008), matBase);
      g.add(plataforma);
      [-0.14, 0.14].forEach((zC) => {
        const curena = new THREE.Mesh(crearCajaRedondeada(0.18, 0.07, 0.10, 2, 0.01), matMadera);
        curena.position.set(0, 0.05, zC);
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.046, 0.28, 14), matBronce);
        tubo.rotation.z = -Math.PI / 2 + 0.12;
        tubo.position.set(0.04, 0.10, zC);
        g.add(curena, tubo);
      });
      return g;
    }
  },
  {
    id: 'acc_barco_hidrocanon',
    categoria: 'accesorio_barco',
    clasesCompatibles: ['barco'],
    nombre: 'Cañón de Agua',
    tipoEnganche: 'accesorio_barco',
    modStats: { velocidad: 3, aceleracion: 3, control: 4 },
    crear() {
      const g = new THREE.Group();
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const matAzul = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.45, roughness: 0.28 });

      const torreta = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.10, 16), matAzul);
      torreta.position.y = 0.05;
      const domo = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), matCromo);
      domo.position.y = 0.10;
      const boquilla = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 0.26, 14), matCromo);
      boquilla.rotation.z = -Math.PI / 2 + 0.22;
      boquilla.position.set(0.11, 0.14, 0);
      const depósito = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.16, 14), matAzul);
      depósito.position.set(-0.08, 0.12, 0);
      g.add(torreta, domo, boquilla, depósito);
      return g;
    }
  },
  // ====================== PIEZAS AVIÓN ======================
  {
    id: 'ala_recta_acrobatica',
    categoria: 'ala_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Ala Acrobática',
    tipoEnganche: 'ala_avion',
    modStats: { velocidad: -3, aceleracion: 3, control: 6 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matFranja = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const plano = new THREE.Mesh(crearCajaRedondeada(0.38, 0.038, 1.56, 4, 0.015), matAla);
      plano.castShadow = true;
      [-0.58, 0.58].forEach((zF) => {
        const franja = new THREE.Mesh(crearCajaRedondeada(0.39, 0.042, 0.12, 2, 0.008), matFranja);
        franja.position.z = zF;
        g.add(franja);
      });
      g.add(plano);
      return g;
    }
  },
  {
    id: 'ala_flecha_jet',
    categoria: 'ala_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Ala Delta Jet',
    tipoEnganche: 'ala_avion',
    modStats: { velocidad: 6, aceleracion: 2, control: -3 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matCarb = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42 });
      [-1, 1].forEach((lado) => {
        const semi = new THREE.Mesh(crearCajaRedondeada(0.42, 0.034, 0.72, 3, 0.012), matAla);
        semi.position.set(-0.08, 0, lado * 0.42);
        semi.rotation.y = lado * -0.44;
        semi.castShadow = true;
        const misil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), matCarb);
        misil.rotation.z = Math.PI / 2;
        misil.position.set(-0.18, -0.02, lado * 0.76);
        g.add(semi, misil);
      });
      return g;
    }
  },
  {
    id: 'ala_biplano_doble',
    categoria: 'ala_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Ala Biplano',
    tipoEnganche: 'ala_avion',
    modStats: { velocidad: -2, aceleracion: 4, control: 7 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matMadera = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
      const inf = new THREE.Mesh(crearCajaRedondeada(0.32, 0.034, 1.38, 3, 0.012), matAla);
      inf.castShadow = true;
      const sup = new THREE.Mesh(crearCajaRedondeada(0.34, 0.034, 1.46, 3, 0.012), matAla);
      sup.position.set(0.05, 0.25, 0);
      sup.castShadow = true;
      [-0.45, 0.45].forEach((zMont) => {
        const mont = new THREE.Mesh(crearCajaRedondeada(0.04, 0.26, 0.03, 2, 0.006), matMadera);
        mont.position.set(0.02, 0.125, zMont);
        g.add(mont);
      });
      g.add(inf, sup);
      return g;
    }
  },
  {
    id: 'motor_helice_bipala',
    categoria: 'motor_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Hélice Bipala',
    tipoEnganche: 'motor_avion',
    modStats: { velocidad: 2, aceleracion: 4, control: 2 },
    crear() {
      const g = new THREE.Group();
      const matCono = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 });
      const matMadera = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 16), matCono);
      spinner.rotation.x = Math.PI / 2;
      const pala = new THREE.Mesh(crearCajaRedondeada(0.048, 0.56, 0.016, 2, 0.005), matMadera);
      pala.position.z = 0.01;
      g.add(spinner, pala);
      return g;
    }
  },
  {
    id: 'motor_helice_cuatripala',
    categoria: 'motor_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Hélice Cuatripala',
    tipoEnganche: 'motor_avion',
    modStats: { velocidad: 4, aceleracion: 3, control: 2 },
    crear() {
      const g = new THREE.Group();
      const matCono = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const matPala = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 16), matCono);
      spinner.rotation.x = Math.PI / 2;
      const p1 = new THREE.Mesh(crearCajaRedondeada(0.045, 0.52, 0.015, 2, 0.005), matPala);
      const p2 = new THREE.Mesh(crearCajaRedondeada(0.52, 0.045, 0.015, 2, 0.005), matPala);
      g.add(spinner, p1, p2);
      return g;
    }
  },
  {
    id: 'motor_reactor_postcombustion',
    categoria: 'motor_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Turbina Reactor',
    tipoEnganche: 'motor_avion',
    modStats: { velocidad: 7, aceleracion: 5, control: -3 },
    crear() {
      const g = new THREE.Group();
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.92, roughness: 0.22 });
      const matNucleo = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 });
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 12, 24), matTitanio);
      const centro = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 16), matNucleo);
      centro.rotation.x = Math.PI / 2;
      g.add(anillo);
      for (let i = 0; i < 6; i++) {
        const alabe = new THREE.Mesh(crearCajaRedondeada(0.024, 0.19, 0.012, 1, 0.003), matTitanio);
        alabe.rotation.z = (i * Math.PI) / 6;
        g.add(alabe);
      }
      g.add(centro);
      return g;
    }
  },
  {
    id: 'cola_clasica',
    categoria: 'cola_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Cola Clásica',
    tipoEnganche: 'cola_avion',
    modStats: { velocidad: 1, aceleracion: 2, control: 4 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const horiz = new THREE.Mesh(crearCajaRedondeada(0.18, 0.028, 0.56, 3, 0.008), matAla);
      horiz.castShadow = true;
      const vert = new THREE.Mesh(crearCajaRedondeada(0.18, 0.24, 0.028, 3, 0.008), matAla);
      vert.position.set(-0.02, 0.12, 0);
      vert.castShadow = true;
      g.add(horiz, vert);
      return g;
    }
  },
  {
    id: 'cola_doble_deriva',
    categoria: 'cola_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Doble Deriva',
    tipoEnganche: 'cola_avion',
    modStats: { velocidad: 3, aceleracion: 1, control: 6 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const horiz = new THREE.Mesh(crearCajaRedondeada(0.20, 0.028, 0.62, 3, 0.008), matAla);
      horiz.castShadow = true;
      g.add(horiz);
      [-0.17, 0.17].forEach((zDer) => {
        const deriva = new THREE.Mesh(crearCajaRedondeada(0.20, 0.24, 0.026, 3, 0.008), matAla);
        deriva.position.set(-0.02, 0.11, zDer);
        deriva.rotation.x = zDer > 0 ? -0.22 : 0.22;
        deriva.castShadow = true;
        g.add(deriva);
      });
      return g;
    }
  },
  {
    id: 'ala_invertida_x',
    categoria: 'ala_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Ala Flecha Invertida',
    tipoEnganche: 'ala_avion',
    modStats: { velocidad: 5, aceleracion: 2, control: 6 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matCian = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });
      [-1, 1].forEach((lado) => {
        const semi = new THREE.Mesh(crearCajaRedondeada(0.36, 0.034, 0.78, 3, 0.012), matAla);
        semi.position.set(0.08, 0, lado * 0.44);
        semi.rotation.y = lado * 0.42;
        semi.castShadow = true;
        const winglet = new THREE.Mesh(crearCajaRedondeada(0.22, 0.16, 0.024, 2, 0.006), matCian);
        winglet.position.set(0.22, 0.075, lado * 0.80);
        g.add(semi, winglet);
      });
      return g;
    }
  },
  {
    id: 'ala_solar_dorada',
    categoria: 'ala_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Ala Fotovoltaica',
    tipoEnganche: 'ala_avion',
    modStats: { velocidad: 2, aceleracion: 5, control: 5 },
    crear() {
      const g = new THREE.Group();
      const matOro = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.88, roughness: 0.22 });
      const matCelda = new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, clearcoat: 1.0, roughness: 0.12, metalness: 0.45 });
      const marco = new THREE.Mesh(crearCajaRedondeada(0.38, 0.032, 1.72, 3, 0.012), matOro);
      marco.castShadow = true;
      g.add(marco);
      [-0.62, -0.31, 0.31, 0.62].forEach((zCel) => {
        const celda = new THREE.Mesh(crearCajaRedondeada(0.30, 0.038, 0.24, 2, 0.004), matCelda);
        celda.position.z = zCel;
        g.add(celda);
      });
      return g;
    }
  },
  {
    id: 'motor_doble_helice',
    categoria: 'motor_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Hélice Contrarrotativa',
    tipoEnganche: 'motor_avion',
    modStats: { velocidad: 5, aceleracion: 6, control: 1 },
    crear() {
      const g = new THREE.Group();
      const matCono = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.28, metalness: 0.5 });
      const matPala = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.32 });
      const matPunta = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.16, 16), matCono);
      spinner.rotation.x = Math.PI / 2;
      spinner.position.z = 0.02;
      g.add(spinner);
      for (let c = 0; c < 2; c++) {
        const zC = c === 0 ? -0.015 : 0.035;
        for (let i = 0; i < 3; i++) {
          const pala = new THREE.Mesh(crearCajaRedondeada(0.042, 0.25, 0.014, 2, 0.004), matPala);
          const ang = (i * Math.PI * 2) / 3 + c * 0.52;
          pala.position.set(Math.cos(ang) * 0.14, Math.sin(ang) * 0.14, zC);
          pala.rotation.z = ang + Math.PI / 2;
          const punta = new THREE.Mesh(crearCajaRedondeada(0.044, 0.04, 0.016, 1, 0.002), matPunta);
          punta.position.set(Math.cos(ang) * 0.255, Math.sin(ang) * 0.255, zC);
          punta.rotation.z = ang + Math.PI / 2;
          g.add(pala, punta);
        }
      }
      return g;
    }
  },
  {
    id: 'motor_plasma_ion',
    categoria: 'motor_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Reactor Iónico',
    tipoEnganche: 'motor_avion',
    modStats: { velocidad: 8, aceleracion: 5, control: -4 },
    crear() {
      const g = new THREE.Group();
      const matTitanio = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.2 });
      const matVioleta = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.4 });
      const matCian = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.6 });

      const anilloExt = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 12, 24), matTitanio);
      const anilloIon = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.012, 10, 24), matVioleta);
      const emisor = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.14, 16), matCian);
      emisor.rotation.x = Math.PI / 2;
      g.add(anilloExt, anilloIon, emisor);
      return g;
    }
  },
  {
    id: 'cola_v_stealth',
    categoria: 'cola_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Cola en V Furtiva',
    tipoEnganche: 'cola_avion',
    modStats: { velocidad: 4, aceleracion: 2, control: 4 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matCarb = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.52, metalness: 0.45 });
      const matAcento = crearMaterialPintura(colorHex);
      [-1, 1].forEach((lado) => {
        const aletaV = new THREE.Mesh(crearCajaRedondeada(0.22, 0.28, 0.024, 2, 0.006), matCarb);
        aletaV.position.set(-0.02, 0.11, lado * 0.11);
        aletaV.rotation.x = lado * 0.65;
        aletaV.castShadow = true;
        const bordeV = new THREE.Mesh(crearCajaRedondeada(0.06, 0.26, 0.028, 1, 0.004), matAcento);
        bordeV.position.set(0.07, 0.11, lado * 0.11);
        bordeV.rotation.x = lado * 0.65;
        g.add(aletaV, bordeV);
      });
      return g;
    }
  },
  {
    id: 'cola_booster_cohete',
    categoria: 'cola_avion',
    clasesCompatibles: ['avion'],
    nombre: 'Cola con Booster',
    tipoEnganche: 'cola_avion',
    modStats: { velocidad: 6, aceleracion: 4, control: -2 },
    crear(colorHex) {
      const g = new THREE.Group();
      const matAla = crearMaterialPintura(colorHex);
      const matCromo = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
      const matFuego = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.5 });

      const horiz = new THREE.Mesh(crearCajaRedondeada(0.18, 0.026, 0.54, 3, 0.008), matAla);
      const vert = new THREE.Mesh(crearCajaRedondeada(0.20, 0.24, 0.028, 3, 0.008), matAla);
      vert.position.set(-0.02, 0.12, 0);
      const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.24, 14), matCromo);
      booster.rotation.z = Math.PI / 2;
      booster.position.set(-0.04, 0.23, 0);
      const llama = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 12), matFuego);
      llama.rotation.z = Math.PI / 2;
      llama.position.set(-0.20, 0.23, 0);
      g.add(horiz, vert, booster, llama);
      return g;
    }
  }
];

/**
 * Calcula los atributos efectivos del vehículo combinando el chasis activo y
 * los modificadores `modStats` de todas las piezas equipadas (agrupando simetrías).
 */
export function obtenerAtributosFinalesVehiculo(estado = null) {
  const defChasis =
    TABLA_CARROCERIAS.find((b) => b.id === (estado && estado.idCarroceria)) || TABLA_CARROCERIAS[0];
  const atribBase = defChasis.atributos || {};
  const statsBase = {
    velocidad: 40,
    aceleracion: 40,
    control: 40,
    ...(atribBase.statsUI || {})
  };
  const piezasMap = (estado && estado.piezasEnEnganches) || {};
  const enganches = Array.isArray(defChasis.enganches) ? defChasis.enganches : [];

  const grupos = new Map();
  enganches.forEach((eng) => {
    const clave = eng.grupoSimetria || eng.id;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(eng);
  });

  let sumVel = 0;
  let sumAcel = 0;
  let sumCtrl = 0;

  grupos.forEach((listaEng) => {
    let gVel = 0;
    let gAcel = 0;
    let gCtrl = 0;
    listaEng.forEach((eng) => {
      const idPieza = piezasMap[eng.id];
      let defPieza = idPieza ? TABLA_PIEZAS.find((p) => p.id === idPieza) : null;
      if (!defPieza) {
        defPieza = TABLA_PIEZAS.find((p) => p.esVacio === true && p.tipoEnganche === eng.tipo) || null;
      }
      const mod = (defPieza && defPieza.modStats) || { velocidad: 0, aceleracion: 0, control: 0 };
      gVel += mod.velocidad || 0;
      gAcel += mod.aceleracion || 0;
      gCtrl += mod.control || 0;
    });
    const divisor = Math.max(1, listaEng.length);
    sumVel += gVel / divisor;
    sumAcel += gAcel / divisor;
    sumCtrl += gCtrl / divisor;
  });

  const bonoStats = {
    velocidad: Math.round(sumVel),
    aceleracion: Math.round(sumAcel),
    control: Math.round(sumCtrl)
  };
  const statsUI = {
    velocidad: Math.max(5, statsBase.velocidad + bonoStats.velocidad),
    aceleracion: Math.max(5, statsBase.aceleracion + bonoStats.aceleracion),
    control: Math.max(5, statsBase.control + bonoStats.control)
  };

  return {
    velMax: +((2.5 + statsUI.velocidad * 0.065) * 1.20 * 1.30).toFixed(3),
    aceleracion: +((1.8 + statsUI.aceleracion * 0.065) * 1.18 * 1.30).toFixed(3),
    manejo: +(1.1 + statsUI.control * 0.022).toFixed(3),
    agarreDerrape: atribBase.agarreDerrape ?? 0.84,
    pesoImpacto: atribBase.pesoImpacto ?? 1.0,
    statsBase,
    bonoStats,
    statsUI
  };
}
