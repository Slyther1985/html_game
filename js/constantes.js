export const CLASES_VEHICULO = ['coche', 'moto', 'barco', 'avion'];
export const TOPE_STAT_UI = 85;
export const IDS_HABITACIONES = [
  'habitacion_andy',
  'habitacion_acuatica',
  'habitacion_atico',
  'habitacion_hangar'
];

export const CATALOGO_HABITACIONES = {
  habitacion_andy: {
    id: 'habitacion_andy',
    nombre: 'Cuarto de Andy (Grand Prix)',
    dimensiones: { ancho: 85.0, largo: 85.0, alto: 7.5 },
    taller: { radioBase: 1.5 },
    ambiente: { cantidadParticulas: 350, techoParticulas: 6.2, colorFondo: 0xdbeafe },
    meta: { x: -1.8, y: 0.025, z: 26.0, yaw: 0, cruceZ: 26.0, rangoX: 5.5 },
    pistaSugeridaId: 'autopista_16bit',
    claseIdeal: 'coche'
  },
  habitacion_acuatica: {
    id: 'habitacion_acuatica',
    nombre: 'Bahía Acuática (Splash GP)',
    dimensiones: { ancho: 90.0, largo: 90.0, alto: 9.0 },
    taller: { radioBase: 1.8 },
    ambiente: { cantidadParticulas: 320, techoParticulas: 7.8, colorFondo: 0xbae6fd },
    meta: { x: -1.8, y: 0.025, z: 28.0, yaw: 0, cruceZ: 28.0, rangoX: 6.0 },
    pistaSugeridaId: 'ola_snes',
    claseIdeal: 'barco'
  },
  habitacion_atico: {
    id: 'habitacion_atico',
    nombre: 'Ático Enduro (Stunt Park)',
    dimensiones: { ancho: 92.0, largo: 92.0, alto: 10.0 },
    taller: { radioBase: 1.6 },
    ambiente: { cantidadParticulas: 380, techoParticulas: 8.5, colorFondo: 0xfef3c7 },
    meta: { x: -1.8, y: 0.025, z: 27.0, yaw: 0, cruceZ: 27.0, rangoX: 5.8 },
    pistaSugeridaId: 'turbo_apex',
    claseIdeal: 'moto'
  },
  habitacion_hangar: {
    id: 'habitacion_hangar',
    nombre: 'Domo Aéreo (Sky Hangar)',
    dimensiones: { ancho: 110.0, largo: 110.0, alto: 18.0 },
    taller: { radioBase: 2.0 },
    ambiente: { cantidadParticulas: 420, techoParticulas: 16.0, colorFondo: 0x0f172a },
    meta: { x: -1.8, y: 0.025, z: 32.0, yaw: 0, cruceZ: 32.0, rangoX: 7.0 },
    pistaSugeridaId: 'cielo_snes',
    claseIdeal: 'avion'
  }
};

// Alias conservados por compatibilidad con el escenario inicial
export const HABITACION_ANCHO = CATALOGO_HABITACIONES.habitacion_andy.dimensiones.ancho;
export const HABITACION_LARGO = CATALOGO_HABITACIONES.habitacion_andy.dimensiones.largo;
export const HABITACION_ALTO = CATALOGO_HABITACIONES.habitacion_andy.dimensiones.alto;
export const ALFOMBRA_RADIO = CATALOGO_HABITACIONES.habitacion_andy.taller.radioBase;
export const CANTIDAD_POLVO = CATALOGO_HABITACIONES.habitacion_andy.ambiente.cantidadParticulas;

export const URLS_TEXTURAS = {
  maderaDiffuse: 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/hardwood2_diffuse.jpg',
  maderaRoughness: 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/hardwood2_roughness.jpg',
  maderaBump: 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/hardwood2_bump.jpg',
  chispaPolvo: 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/sprites/spark1.png',
  discoParticula: 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/sprites/disc.png'
};

export const PALETA_COLORES = [
  { id: 'rojo', nombre: 'Rojo Carmesí', hex: 0xff1e27 },
  { id: 'azul', nombre: 'Azul Eléctrico', hex: 0x0066ff },
  { id: 'amarillo', nombre: 'Amarillo Cyber', hex: 0xffdd00 },
  { id: 'verde', nombre: 'Verde Lima Nitro', hex: 0x00f566 },
  { id: 'naranja', nombre: 'Naranja Papaya', hex: 0xff5e00 },
  { id: 'morado', nombre: 'Púrpura Ultravioleta', hex: 0x9d00ff },
  { id: 'turquesa', nombre: 'Cian Hiper', hex: 0x00f0ff },
  { id: 'blanco', nombre: 'Blanco Titanio', hex: 0xffffff }
];
