# Auditoría Técnica de Arquitectura y Escalado Vertical

> **Propósito:** Radiografía técnica exacta del estado actual del proyecto **Taller y Circuito de Juguetes 3D** (Three.js r128, módulos ES6 en `js/*.js`), orientada a diseñar la siguiente fase de crecimiento vertical sin romper la estabilidad de 60 FPS ni los contratos físicos actuales:
> 1. **Múltiples Habitaciones / Escenarios** seleccionables en tiempo de ejecución (distintas dimensiones, temáticas, trazados de pista y tipos de superficie).
> 2. **Parametrización de las Físicas Actuales** (presupuesto de estadísticas, derrape táctico + Mini-Turbo, penalización fuera de pista `-30%`, modificador de pendiente `±20%`, *Boost Pads* y obstáculos dinámicos/móviles).
> 3. **Múltiples Clases de Vehículos** con enganches y catálogo propios: **Coches (4 ruedas)**, **Motos (2 ruedas)**, **Barcos (cascos, propulsores, timones y accesorios náuticos)** y **Aviones (fuselajes, alas, hélices/reactores y timones)**.

---

## 1. Estado Global y Contratos de Datos Actuales (`js/constantes.js` y `js/estado.js`)

### 1.1. Constantes de Escenario vs. Constantes Transversales (`js/constantes.js`, 25 líneas)

Actualmente `js/constantes.js` mezcla configuración visual global con dimensiones rígidas de una única habitación:

| Símbolo | Línea | Valor Actual | Clasificación para Escalado Vertical |
| :--- | :---: | :--- | :--- |
| `HABITACION_ANCHO` | L1 | `85.0` | **Atada al escenario único** → migrar a `CATALOGO_HABITACIONES[id].dimensiones.ancho` |
| `HABITACION_LARGO` | L2 | `85.0` | **Atada al escenario único** → migrar a `CATALOGO_HABITACIONES[id].dimensiones.largo` |
| `HABITACION_ALTO` | L3 | `7.5` | **Atada al escenario único** → migrar a `CATALOGO_HABITACIONES[id].dimensiones.alto` |
| `ALFOMBRA_RADIO` | L4 | `1.5` | **Atada al escenario único** → migrar a `CATALOGO_HABITACIONES[id].taller.radioBase` |
| `CANTIDAD_POLVO` | L5 | `350` | **Atada al escenario único** → migrar a `CATALOGO_HABITACIONES[id].ambiente.cantidadParticulas` |
| `URLS_TEXTURAS` | L7–L13 | 5 URLs con respaldo canvas | **Transversal** (se conserva global como banco base de respaldo) |
| `PALETA_COLORES` | L15–L24 | 8 colores (`rojo`..`blanco`) | **Transversal** (reutilizable por todas las clases de vehículos) |

---

### 1.2. Estado Centralizado (`js/estado.js`, 84 líneas)

#### `estadoCarro` (L3–L19)
```js
export const estadoCarro = {
  modoJuego: 'taller',            // 'taller' | 'conduccion'
  modoCamara: 'tercera',          // 'tercera' | 'cabina'
  idCarroceria: 'carroceria_sedan',
  colorHex: PALETA_COLORES[0].hex,
  idColor: PALETA_COLORES[0].id,
  piezasEnEnganches: {            // Acoplado rígidamente a 4 ruedas + 1 accesorio de techo
    rueda_di: 'rueda_clasica',
    rueda_dd: 'rueda_clasica',
    rueda_ti: 'rueda_clasica',
    rueda_td: 'rueda_clasica',
    acc_techo: 'acc_aleron'
  },
  modoCuatroRuedas: true,         // Booleano específico de la clase coche
  engancheSeleccionadoId: null,
  engancheHoverId: null
};
```

#### `fisicaCarro` (L22–L41)
```js
export const fisicaCarro = {
  x: 0.0, y: 0.02, z: 0.0,
  velocidad: 0.0, velY: 0.0,
  yaw: 0.0,                       // Orientación horizontal del chasis (radianes)
  anguloMovimiento: 0.0,          // Vector real de desplazamiento XZ (separa dirección al derrapar)
  pitch: 0.0, roll: 0.0,
  anguloVolante: 0,               // Giro visual de dirección (radianes, máx. ±0.36)
  rotacionRodadura: 0,            // Acumulador angular de giro mecánico de ruedas
  enAire: false,
  derrapando: false,
  tiempoDerrape: 0.0,
  tiempoDerrapeActivo: 0.0,
  enfriamientoDerrape: 0.0,
  tiempoTurbo: 0.0,
  tiempoMiniTurbo: 0.0
};
```

#### Listas de Escena, Taller y Colisión (L43–L58, L83)
- **Controles e Interacción Taller:**
  - `teclasConduccion` (L43): `{ [code: string]: boolean }`.
  - `nodosEnganches` (L45): `{ [idEnganche]: { definicion, rotacionBaseY, grupoContenedor, anilloIndicador, colisionador, mallaPieza } }`.
  - `listaColisionadoresEnganches` (L46): `THREE.Mesh[]` (esferas invisibles con `userData.idEnganche` para Raycaster del Taller).
  - `animacionesActivas` (L47): `[{ tipo: 'entrada' | 'salida', objeto, progreso, duracion, ... }]`.
  - `chorrosChispasActivos` (L48): `[{ puntos, vels, edad, duracion }]`.
- **Contratos de Superficie, Obstáculos y Circuito del Escenario Activo:**
  - `mallasSuperficieConducible` (L51): `THREE.Mesh[]`. La distinción actual es binaria mediante `malla.userData.esPista = true` (asfalto, pianos, enlace de taller, meta y colchoneta) frente a `undefined/false` (piso de madera y alfombra).
  - `obstaculosHabitacion` (L53): `[{ x: number, z: number, radio: number }]`. Colisionadores circulares 2D estáticos (muebles, paredes interiores, pilares).
  - `plataformasTurbo` (L56): `[{ malla: THREE.Mesh, posicion: THREE.Vector3, direccion: THREE.Vector3, radio: 1.9, factorImpulso: 1.35 }]`.
  - `obstaculosDinamicos` (L57): `[{ malla, posInicial, rotInicial, velocidad, velAngular, radio: 0.34, derribado: boolean, tiempoReset: number }]`.
  - `obstaculosMoviles` (L58): `[{ malla, posBase: THREE.Vector3, ejeOscilacion: THREE.Vector3, fase, amplitud: 1.45, velocidadOscilacion: 2.2, radio: 0.48 }]`.
  - `checkpointsPista` (L83): `[{ indice, x, y, z, radio, materialesLuz: [matIndicador, matCampo], matIndicador, matCampo }]`.

#### `estadoCronometro` y `localStorage` (L60–L81)
- Lectura inicial en L60–L70 desde una única clave global `'record_vuelta_pista_3d'` (L63).
- Estructura en L73–L81:
  ```js
  export const estadoCronometro = {
    vueltaActiva: false,
    tiempoActual: 0,
    ultimaVuelta: null,
    mejorVuelta: recordVueltaGuardado,
    checkpointActual: 0,
    totalCheckpoints: 5,
    avisoRecord: 0
  };
  ```
- **Limitación para múltiples escenarios:** Un récord único sobrescribiría los tiempos al cambiar de habitación/circuito y `totalCheckpoints: 5` está fijado estáticamente aunque otra pista tenga 4 u 8 checkpoints.

---

### 1.3. Contrato Propuesto para Soportar Múltiples Habitaciones y Clases de Vehículos

Sin eliminar la compatibilidad de lectura para módulos existentes, `estadoCarro` y `estadoCronometro` deben extenderse hacia:

```js
// Propuesta de extensión en js/estado.js
export const estadoJuego = {
  idHabitacion: 'habitacion_infantil', // Clave en CATALOGO_HABITACIONES
  claseVehiculo: 'coche',              // 'coche' | 'moto' | 'barco' | 'avion'
  vehiculosPorClase: {                 // Preserva la configuración armada al cambiar de clase
    coche: { idCarroceria: 'carroceria_sedan', colorHex: ..., piezas: { ... } },
    moto:  { idCarroceria: 'moto_sport', colorHex: ..., piezas: { ... } },
    barco: { idCarroceria: 'barco_lancha', colorHex: ..., piezas: { ... } },
    avion: { idCarroceria: 'avion_biplano', colorHex: ..., piezas: { ... } }
  }
};
```

- **Generalización de `modoCuatroRuedas`:** Reemplazar por `estadoCarro.modoSimetriaEnganches` (booleano que aplica el cambio a todos los enganches que compartan `grupoSimetria`, p. ej. `'ruedas'`, `'alas'` o `'turbinas'`).
- **Generalización de `piezasEnEnganches`:** Mantenerlo como diccionario dinámico cuyas llaves coinciden exactamente con los `eng.id` declarados en la carrocería/chasis activo, validando al cambiar de chasis las piezas compatibles y limpiando claves huérfanas.
- **Superficies tipadas en `mallasSuperficieConducible`:** Reemplazar o complementar `userData.esPista` con `userData.tipoSuperficie`: `'pista_asfalto' | 'pista_tierra' | 'pista_aire' | 'agua_navegable' | 'fuera_pista' | 'obstaculo_suelo'`.
- **Récords por escenario + clase:** Clave en `localStorage` `'record_vuelta_' + idHabitacion + '_' + claseVehiculo` (manteniendo fallback de lectura a `'record_vuelta_pista_3d'` para el escenario inicial de coches).

---

## 2. Ciclo de Vida del Escenario y Pistas (`js/escenario.js` y `js/recursos.js`)

### 2.1. Radiografía de Acoplamiento en `js/escenario.js` (1506 líneas)

Al inicializar en `js/main.js` (L174–L178), se invocan cuatro constructores que **añaden nodos directamente a la raíz global `escena` sin almacenar un grupo contenedor único desmontable**:

1. **`crearIluminacion()` (L70–L95):**
   - Añade directamente a `escena`: `luzHemi` (`HemisphereLight`, L73), `luzSolVentana` (`DirectionalLight` con mapa de sombras `2048x2048` cubriendo `d = 52`, L75–L88) y `luzLampara` (`PointLight` en `(39.5, 1.65, -39.5)`, L90–L94).
   - La altura (`HABITACION_ALTO`) y alcance de sombras (`far = 135`, `±52 m`) están ligados a `85x85x7.5 m`.
2. **`construirHabitacionExpandida()` (L101–L460):**
   - Instancia un `const grupoHab = new THREE.Group()` local (L102) y ejecuta `escena.add(grupoHab)` (L459) **sin exportarlo ni guardarlo en referencia de módulo**.
   - Inserta en `mallasSuperficieConducible` el piso `mallaPiso` (`L114–L121`) y la alfombra central (`L250–L257`), y puebla `obstaculosHabitacion` con los colisionadores del cofre, cama, estantería, torre de cubos y pelota Luxo (`L457`).
3. **`construirPistaDeCarreras()` (L467–L1456):**
   - Crea un `const grupoPista = new THREE.Group()` local (L468) y ejecuta `escena.add(grupoPista)` (L1455) sin conservar referencia.
   - **Generación de geometría continua (`crearCintaPistaContinua`, L548–L910):**
     - Interpola tramos con `subdividirCurvaSuave` / `interpolarSegmentoCatmull` (`L501–L539`).
     - Calcula secciones con miter y peralte (`L553–L650`) y ensambla 6 `THREE.BufferGeometry` continuas: `geoAsfaltoTop`, `geoAsfaltoLados`, `geoPianoTop`, `geoPianoLados`, `geoLineasDiv` y `geoBarandas` (`L683–L688`).
     - Aplica alturas escalonadas sin *Z-fighting* (`Y = 0.02` asfalto en `L614–L615`, `Y = 0.02 + 0.006 = 0.026` línea divisoria en `L788`, `polygonOffsetFactor: -1` en `L492–L494`).
     - Marca como superficies conducibles oficiales (`userData.esPista = true`): `mallaAsfaltoTop` (`L885–L887`), `mallaPianosTop` (`L895–L897`), `enlaceTaller` (`L1103–L1105`), `franjaMeta` (`L1140–L1142`) y `colchonetaSalto` (`L1196–L1198`).
     - Construye arcos de checkpoints (`crearArcoCheckpoint`, `L1211–L1300`), 6 Boost Pads (`L1316–L1343`), conos y bloques derribables en `obstaculosDinamicos` (`L1348–L1417`) y 4 barreras oscilantes en `obstaculosMoviles` (`L1422–L1453`).
   - **Materiales con texturas clonadas (L472–L487):** `crearMatAsfalto()` y `crearMatPiano()` llaman `.clone()` sobre `bancoTexturas.asfalto` (L473) y `bancoTexturas.piano` (L480).
4. **`crearHazYPolvoVentana()` (L1462–L1505):**
   - Añade directamente a `escena` el cono volumétrico `mallaHaz` (L1472–L1475) y la nube `sistemaPolvo` (L1502–L1504, variable `export let sistemaPolvo` en L64).
   - En `js/main.js` (L80–L91), el bucle principal accede a `CANTIDAD_POLVO` y usa el límite fijo `if (y > 6.2) y = 0.15` (L87).

Además, en el nivel superior de `js/escenario.js` (L25–L52) se configura `escena.background = new THREE.Color(0xdbeafe)` (L26) y `camara = new THREE.PerspectiveCamera(60, ..., 0.25, 250)` (L28–L32). Para escenarios más amplios (p. ej. pista aérea para aviones o bahía acuática para barcos), `far` (`250`) y `fog`/`background` también deberán provenir de la definición de la habitación.

---

### 2.2. Análisis de Limpieza GPU en `liberarObjeto3D()` (`js/recursos.js`, L24–L36)

```js
export function liberarObjeto3D(objeto) {
  if (!objeto) return;
  objeto.traverse((hijo) => {
    if (hijo.geometry) hijo.geometry.dispose();
    if (hijo.material) {
      if (Array.isArray(hijo.material)) {
        hijo.material.forEach((m) => m.dispose());
      } else {
        hijo.material.dispose();
      }
    }
  });
}
```

**Hallazgo crítico sobre memoria GPU (VRAM):**
`liberarObjeto3D()` llama `.dispose()` sobre `geometry` y `material`, pero **no** llama `.dispose()` sobre los mapas de textura (`map`, `roughnessMap`, `bumpMap`, `emissiveMap`).
- Esto es correcto para las texturas compartidas residentes en `bancoTexturas` (`inicializarRecursos()`, L914–L969), que deben sobrevivir durante toda la sesión.
- Sin embargo, **`construirPistaDeCarreras()` clona texturas en `L473` y `L480`** (`tex = bancoTexturas.asfalto.clone()`, `bancoTexturas.piano.clone()`). Cada clon asigna un descriptor de textura WebGL independiente que quedaría huérfano si solo se llama `liberarObjeto3D(grupoPista)`. Para garantizar 0 fugas al alternar habitaciones N veces, cualquier textura clonada debe marcarse (p. ej. `tex.userData.esClonTemporal = true`) o almacenarse en `texturasEscenarioActual[]` para invocar `.dispose()` explícitamente al desmontar el escenario.

---

### 2.3. Protocolo Propuesto de Contenedor Único y Cambio de Escenario (`cambiarHabitacion`)

Para habilitar múltiples escenarios seleccionables:
1. Crear un diccionario `CATALOGO_HABITACIONES` (en `js/escenarios/` o `js/constantes.js`) donde cada escenario declare: `{ id, nombre, dimensiones: { ancho, largo, alto }, iluminacion, skyColor, taller: { origen, radioBase }, meta: { pos, yaw, anchoPista, zonaCruce }, checkpoints: [...], constructorEscenario(grupoRaiz, registroTexturasTemp) }`.
2. Exportar en `js/escenario.js` un único grupo raíz mutable `grupoEscenarioActivo` (`new THREE.Group()`) agregado una vez a `escena` (independiente de `grupoJuguete`).
3. Implementar `cargarEscenario(idHabitacion)` siguiendo esta secuencia estricta:
   - Detener o vaciar `animacionesActivas` / `chorrosChispasActivos` de escena si referencian puntos del escenario anterior.
   - Limpiar los 6 arreglos globales de `js/estado.js`: `mallasSuperficieConducible.length = 0`, `obstaculosHabitacion.length = 0`, `plataformasTurbo.length = 0`, `obstaculosDinamicos.length = 0`, `obstaculosMoviles.length = 0`, `checkpointsPista.length = 0`.
   - Ejecutar `liberarObjeto3D(grupoEscenarioActivo)`, `texturasTempEscenario.forEach((t) => t.dispose())` y `escena.remove(grupoEscenarioActivo)`.
   - Instanciar un nuevo `grupoEscenarioActivo`, actualizar `escena.background` / `sistemaPolvo`, invocar el constructor del escenario elegido y adjuntarlo a `escena`.
   - Re-sincronizar `estadoCronometro.totalCheckpoints = checkpointsPista.length` y cargar el récord correspondiente desde `localStorage`.

---

## 3. Sistema de Enganches, Catálogo y Animación Mecánica (`js/catalogoPiezas.js` y `js/enganches.js`)

### 3.1. Catálogo y Estructura de Carrocerías y Piezas (`js/catalogoPiezas.js`, 1442 líneas)

#### Generación de Atributos (`crearAtributosChasis`, L381–L390)
```js
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
```

#### Chasis Actuales en `TABLA_CARROCERIAS` (L393–L1115)
Tras el último incremento de `+20` a la velocidad base de cada chasis:

| Línea | ID | Nombre | `statsUI` (`VEL / ACEL / CTRL`) | Suma | `velMax` (m/s) | `aceleracion` (m/s²) | `manejo` | `agarreDerrape` | `pesoImpacto` |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| L395 | `carroceria_sedan` | Sedán GT Turbo | `60 / 40 / 40` | 140 | `9.984` | `6.750` | `1.98` | `0.84` | `1.00` |
| L496 | `carroceria_camioneta` | Camioneta Raptor Sport | `50 / 48 / 42` | 140 | `8.970` | `7.547` | `2.024` | `0.90` | `1.45` |
| L622 | `carroceria_deportivo` | Hiperdeportivo Le Mans | `78 / 36 / 26` | 140 | `11.809` | `6.351` | `1.672` | `0.82` | `0.95` |
| L736 | `carroceria_formula` | Monoplaza Fórmula Apex | `54 / 42 / 44` | 140 | `9.376` | `6.949` | `2.068` | `0.94` | `0.80` |
| L882 | `carroceria_muscle` | Muscle V8 Drift King | `68 / 44 / 28` | 140 | `10.795` | `7.148` | `1.716` | `0.64` | `1.25` |
| L998 | `carroceria_buggy` | Buggy Dunas Baja | `48 / 38 / 54` | 140 | `8.767` | `6.550` | `2.288` | `0.74` | `0.90` |

> **Discrepancia detectada para normalizar:** El comentario de `crearAtributosChasis` (`L379`) y `TABLA_CARROCERIAS` (`L392`) habla todavía del presupuesto original de `120` puntos (`máx. 60`), y `js/interfaz.js` (`L287`) divide `(stat.valor / 60) * 100`. Con el ajuste `+20` en `VEL`, `carroceria_sedan` (`60`), `carroceria_muscle` (`68`) y `carroceria_deportivo` (`78`) saturan la barra UI al `100%`. Al escalar verticalmente conviene parametrizar `PRESUPUESTO_CLASE` y `TOPE_STAT_UI` (p. ej. `80`) o reescalar el presupuesto balanceado según cada clase de vehículo.

#### Piezas Actuales en `TABLA_PIEZAS` (L1117–L1441)
- **4 Ruedas** (`categoria: 'rueda'`, `tipoEnganche: 'rueda'`): `rueda_clasica` (L1119), `rueda_todoterreno` (L1173), `rueda_deportiva` (L1240), `rueda_juguete` (L1290).
- **4 Accesorios** (`categoria: 'accesorio'`, `tipoEnganche: 'accesorio'`): `acc_aleron` (L1343), `acc_antena` (L1375), `acc_portaequipajes` (L1402), `acc_ninguno` (L1433, devuelve `null`).

---

### 3.2. Inventario Completo de Acoplamientos Rígidos a "4 Ruedas + 1 Techo"

Para introducir **Motos**, **Barcos** y **Aviones**, es obligatorio desacoplar las siguientes suposiciones fijas distribuidas por el proyecto:

| Módulo | Línea(s) | Acoplamiento Rígido Actual | Impacto al Añadir Moto / Barco / Avión |
| :--- | :---: | :--- | :--- |
| `js/estado.js` | L9–L16 | `piezasEnEnganches` fijado a `{ rueda_di, rueda_dd, rueda_ti, rueda_td, acc_techo }` y `modoCuatroRuedas: true`. | Moto solo usa 2 ruedas; Barco usa turbina/hélice y timón; Avión usa alas, hélice/reactor y cola. |
| `js/enganches.js` | L122 | `defPieza.tipoEnganche !== nodo.definicion.tipo` | Correcto a nivel genérico, pero no filtra `clasesCompatibles` (una rueda de camión no debe aparecer ni montarse en un barco). |
| `js/enganches.js` | L134 | `if (!defPieza \|\| idPieza === 'acc_ninguno')` | Asume un ID literal `'acc_ninguno'` como sentencia de borrado; debe usar `defPieza.esVacio === true`. |
| `js/enganches.js` | L215 | `if (eng.tipo === 'accesorio') anillo.rotation.x = Math.PI / 2;` | Solo orienta horizontalmente el torus guía para `'accesorio'`; los anillos de alas o cascos pueden necesitar `orientacionAnillo` declarativa. |
| `js/conduccion.js` | L606–L609 | `grupoJuguete.getObjectByName('volanteCabina')` con `rotation.z`. | Funciona en coches y timones circulares, pero un manillar de moto o yugo de avión gira sobre su eje propio o requiere nombre/eje configurable. |
| `js/conduccion.js` | L615–L624 | `['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td'].forEach(...)` asumiendo giro en `rotation.z` por `lado` y dirección en `esDelantera`. | Ignora cualquier ID nuevo (`rueda_delantera`, `propulsor_popa`, `helice_frontal`, `alas_principales`, `timon_cola`) y su eje de rotación (`X` vs `Z`). |
| `js/interfaz.js` | L165–L168 | Recorre `['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td']` para resetear dirección al volver al taller. | Debe iterar `Object.values(nodosEnganches)`. |
| `js/interfaz.js` | L254 | `pieza.id === estadoCarro.piezasEquipadas.acc_techo` | **Bug latente en código actual:** `estadoCarro.piezasEquipadas` no existe (la propiedad real en `js/estado.js` L9 es `piezasEnEnganches`). Lanzaría `TypeError` al abrir la pestaña `Accesorios`. |
| `js/interfaz.js` | L304–L317 | `const idsRuedas = ['rueda_di', 'rueda_dd', 'rueda_ti', 'rueda_td']` y `colocarPiezaEnEnganche('acc_techo', ...)`. | Impide colocar piezas en `rueda_delantera` de moto, `propulsor_popa` de barco o `alas` de avión. |
| `js/interfaz.js` | L398–L416, L459 | `btnModoRuedas` habla de *"4 ruedas juntas"*, `btnQuitar` recae a `idsRuedas` o `'acc_techo'`, y `pointerup` comprueba `tipo === 'rueda'`. | Requiere generalización por `grupoSimetria` y tipo de enganche activo. |
| `js/catalogoPiezas.js` | L393–L1115 | `TABLA_CARROCERIAS` carece de campo `clase: 'coche'` y `fisica`. `TABLA_PIEZAS` carece de `clasesCompatibles`. | No permite filtrar la bandeja según la clase de vehículo seleccionada. |

---

### 3.3. Arquitectura Polimórfica Propuesta para Enganches y Piezas

Cada vehículo base (`TABLA_VEHICULOS` o `TABLA_CARROCERIAS` extendida) declarará:
```js
{
  id: 'barco_hidroplano',
  clase: 'barco',                // 'coche' | 'moto' | 'barco' | 'avion'
  categoria: 'carroceria',       // O 'chasis_base'
  nombre: 'Hidroplano Nitro',
  entornoPermitido: ['agua', 'anfibio'], // Relación con CATALOGO_HABITACIONES
  atributos: crearAtributosChasis(...),
  vistaCabina: [...],
  enganches: [
    {
      id: 'propulsor_popa',
      tipo: 'propulsor',         // 'rueda' | 'propulsor' | 'ala' | 'timon' | 'accesorio'
      grupoSimetria: 'propulsion',
      rolAnimacion: 'helice_z',  // 'rodadura_x' | 'direccional_y' | 'helice_x' | 'helice_z' | 'timon_y' | 'estatico'
      sentidoGiro: 1,
      orientacionAnillo: [Math.PI / 2, 0, 0],
      posicion: [-0.72, 0.14, 0],
      rotacion: [0, 0, 0],
      escala: [1, 1, 1]
    }
  ]
}
```

#### Mapa de Enganches por Clase de Vehículo

| Clase | Enganches Base | Categorías en Bandeja Taller | Animación Mecánica Genérica en Conducción |
| :--- | :--- | :--- | :--- |
| **Coche** (`coche`) | `rueda_di`, `rueda_dd`, `rueda_ti`, `rueda_td`, `acc_techo` | Chasis, Ruedas (`rueda`), Accesorios (`accesorio`), Colores | `rueda_di/dd`: dirección `yaw` (`anguloVolante`) + rodadura `rotation.z`; `rueda_ti/td`: rodadura `rotation.z`. |
| **Moto** (`moto`) | `rueda_delantera` (`esDelantera: true`), `rueda_trasera`, `acc_carenado` / `acc_escape` | Chasis Moto, Ruedas (`rueda_moto`), Accesorios (`accesorio_moto`), Colores | `rueda_delantera`: dirección `yaw` (y horquilla/manillar en cabina) + rodadura `rotation.z`; `rueda_trasera`: rodadura + peralte dinámico del chasis (`roll` hasta `±0.48 rad`). |
| **Barco** (`barco`) | `propulsor_popa` (hélice o doble turbina), `timon_popa`, `acc_cubierta` (radar, mástil, spoiler) | Cascos (`casco`), Propulsores (`propulsor`), Timones/Accesorios (`timon`, `accesorio_barco`), Colores | `propulsor_popa`: giro continuo de aspas (`rotation.x`) proporcional a `velocidad` (+ chorro de burbujas/espuma en vez de chispas); `timon_popa`: giro en `Y` inverso a `anguloVolante`. |
| **Avión** (`avion`) | `alas_principales`, `propulsor_frontal` (o `turbinas_ala`), `estabilizador_cola`, `tren_aterrizaje` | Fuselajes (`fuselaje`), Alas (`ala`), Motores (`motor_aereo`), Colas/Accesorios (`cola`, `accesorio_aereo`), Colores | `propulsor_frontal`: hélice en `rotation.x` con velocidad mínima incluso en ralentí (`> 12 rad/s`); `estabilizador_cola`: timón `Y` (`anguloVolante`) y elevadores `Z` (`pitch`). |

---

## 4. Radiografía del Motor Físico y Superficies (`js/conduccion.js`, 786 líneas)

### 4.1. Desglose Matemático Exacto de `actualizarFisicaConduccion(dt)` (L308–L644)

Las siguientes reglas definen la "sensación de manejo" actual del proyecto y deben parametrizarse como perfil base (`clase: 'coche'`) antes de derivar variantes para Moto, Barco y Avión:

1. **Parámetros derivados de `atributos` (`L310–L320`):**
   - `velMaxBase = atrib.velMax` (`8.767` a `11.809 m/s`, equivalente a `280`–`378 km/h` con el multiplicador visual `x32` de `L637`).
   - `acelParam = atrib.aceleracion` (`4.756` a `8.040 m/s²`).
   - `manejoParam = atrib.manejo` (`1.672` a `2.288`).
   - `duracionMaxDerrape = 0.35 + (stats.control / 60) * 0.55` s (`L320`).
2. **Modificadores Dinámicos de Velocidad (`L333–L345`, `L573–L582`):**
   - **Turbo (`L334`):** `factorTurboVel = 1.32` mientras `tiempoTurbo > 0` (Boost Pad: `1.6 s`, `L526`) o `1.18` mientras `tiempoMiniTurbo > 0` (`0.65 s` ó `0.55 s`).
   - **Pendiente `±20%` (`L335–L338`, `L375–L380`, `L574–L575`):**
     - `pendienteEnMarcha = !enAire ? pitch * sentido : 0`. Umbral muerto: `|pendiente| <= 0.035 rad`.
     - Subida (`> 0.035`): `factorPendiente = 0.80` (y `factorEmpujePendiente = 0.80` en aceleración).
     - Bajada (`< -0.035`): `factorPendiente = 1.20` más asistencia gravitacional `+ sentido * |sin(pitch)| * 2.6 * dt` (`L378`).
   - **Penalización fuera de pista `-30%` (`L339`, `L345`, `L576`, `L587–L596`):**
     - Cuando `!enAire && !enPistaActual`: `factorSuperficie = 0.70`, fricción sube de `1.65` a `2.75`, el desacelerador por exceso usa tasa `6.5` en lugar de `4.5` (`L580`), y se inyecta vibración sinusoidal en `roll` (`Math.sin(t * 36) * 0.016`) + impacto sonoro suave cada `0.24 s`.
   - **Tope unificado (`L341`, `L577`):**
     $$\text{velMaxEfectiva} = \text{velMaxBase} \times \text{factorPendiente} \times \text{factorSuperficie} \times \text{factorTurboVel}$$
   - **Reversa (`L344`):** `velMaxAtras = -3.432 * factorSuperficiePrev`.
3. **Curva de Aceleración y Dirección (`L354–L468`):**
   - Aceleración progresiva: `acelCurva = acelBase * (1.28 - 0.52 * ratioVel^2)` limitada con `Math.min(velMaxAdelante, ...)` (`L358–L360`).
   - Volante: rango máximo `±0.36 rad` (`L386–L387`), interpolación rápida (`lerp 28/32`, `L388`) y `tasaGiroBase = 3.42` (`L446`).
   - **Derrape táctico (`L391–L439`):** exige `teclaDerrape && !enAire && enfriamientoDerrape <= 0 && velocidad > 1.65` y giro activo. Al alcanzar `duracionMaxDerrape` (o soltar al `>= 75%` en `L428`), otorga Mini-Turbo y activa `enfriamientoDerrape = 0.65 s`. Chocar cancela el derrape sin recompensa (`cancelarDerrapePorChoque`, `L228–L235`).
   - **Vector de deslizamiento (`L458–L468`):** `anguloMovimiento` persigue a `yaw` con tasa `12.0` en agarre normal o `(1.7 + agarreDerrape * 2.9)` en derrape, con límite máximo de ángulo de deriva de `0.72 rad` (`L465`).
4. **Muestreo de Superficie y Rampas (`L241–L265`, `L531–L570`):**
   - Lanza 2 rayos verticales (`obtenerInfoSuperficieEnPunto`, `L241`) a `±semieje` (`0.44 m`, `L532`) desde `alturaReferencia + 0.55 m`.
   - Ignora superficies por encima de `alturaReferencia + 0.36 m` (`L249`) para pasar bajo el puente del viaducto sin teletransportarse arriba.
   - Si el descenso supera `0.09 m` (`L548`), entra en `enAire = true` con gravedad `9.8 m/s²` (`L557`).
5. **Colisiones y Puntos Fijos del Circuito (`L156–L162`, `L270–L302`, `L481–L515`, `L650–L750`):**
   - Muros duros: `limiteMuro = HABITACION_ANCHO / 2 - 0.85` (`L481`), asume **habitación cuadrada** (`HABITACION_ANCHO` usado tanto para X como para Z en `L482` y `L489`, ignorando `HABITACION_LARGO`).
   - Línea de Meta hardcodeada en `X = 0.0, Z ≈ 26.0` (`L157–L161`), y `reposicionarEnMeta()` (`L270–L302`) fija `(-1.8, 0.025, 26.0)` y `yaw = 0`.
   - Obstáculos dinámicos (`L683–L750`): lanzan conos/cubos usando `pesoImpacto` del chasis y los restauran a los `8.0 s` (`L740`).

---

### 4.2. Estrategia Parametrizada por Entorno / Clase de Vehículo (`PERFILES_FISICA`)

En lugar de duplicar `actualizarFisicaConduccion()`, conviene extraer los bloques mutables a **4 perfiles de comportamiento** seleccionados según `claseVehiculo`:

| Parámetro / Subsistema | Coche (`coche`) | Moto (`moto`) | Barco (`barco`) | Avión (`avion`) |
| :--- | :--- | :--- | :--- | :--- |
| **Medio válido (`superficiesValidas`)** | `['pista_asfalto', 'pista_tierra']` | `['pista_asfalto', 'pista_tierra']` | `['agua_navegable']` | Libre 3D (`alturaMin..techoHab`), aterriza en `'pista_asfalto'` / `'agua'` |
| **Penalización fuera de medio** | `0.70x` vel, fricción `2.75`, vibración roll | `0.65x` vel, fricción `2.90`, vibración roll | Varado en suelo sólido (`0.35x` vel, fricción `4.5`) | Rodaje en suelo limitado (`0.45x` velMax) bajo velocidad de despegue |
| **Longitud de muestreo (`semieje`)** | `0.44 m` | `0.36 m` | `0.58 m` | `0.50 m` (tren de aterrizaje) |
| **Inclinación lateral (`roll`)** | Sutil (`factorRoll = 0.11..0.16`) | Pronunciada tipo GP (`factorRoll = 0.42..0.52 rad`) | Contrapesado (`0.22`) + cabeceo de proa al acelerar | Alabeo libre (`roll` gobierna el viraje en aire, hasta `±0.85 rad`) |
| **Eje vertical (`Y` / `velY`)** | Raycast suelo + gravedad `9.8` | Raycast suelo + gravedad `9.8` + leve *wheelie* en turbo | Flotabilidad elástica sobre `nivelAgua` (`ola = sin(t*2.8 + vx)*0.03`) | Sustentación aerodinámica proporcional a `(velocidad - velSustentacion)` + controles de cabeceo (`W/S` o `E/Q` / flechas) |
| **Mecánica de derrape / impulso** | Derrape lateral + Mini-Turbo | Derrape inclinado cerrado (`duracionMax * 0.9`) | Deslizamiento de popa amplio (`agarreDerrape` menor, estela de agua) | Tonel / giro brusco o *postcombustión* (Turbo temporal con enfriamiento) |
| **Límites de habitación** | `±(ancho/2 - margenX)`, `±(largo/2 - margenZ)` usando ambos ejes reales | Idem | Contención en cuenca acuática / boyas | Caja 3D completa `(X, Y <= altoHab - 0.6, Z)` |

---

## 5. Interfaz, Audio y Partituras (`js/interfaz.js`, `js/audio.js`, `js/partituras.js`)

### 5.1. Interfaz y Taller (`js/interfaz.js`, `index.html`, `css/estilos.css`)

- **Selectores faltantes en `index.html` (L19–L37 y L83–L101):**
  - `#barra-superior` cuenta con `#btn-audio` (`M`), `#btn-pista` (`N`), `#btn-camara` (`C`) y `#btn-alternar-modo` (`T`). Falta un selector compacto para **Escenario/Habitación** y **Clase de Vehículo** (Coche / Moto / Barco / Avión), que puede alojarse como dos `<select>` o botones cíclicos en `#controles-modo` / cabecera del taller.
  - `#pestanas` (`index.html` L85–L90) tiene 4 botones fijos (`carroceria`, `rueda`, `accesorio`, `color`). Para las 4 clases de vehículos, `renderizarPestanasPorClase(claseVehiculo)` debe actualizar dinámicamente el `dataset.cat` y etiqueta de cada pestaña (ej. en Barco: *Cascos*, *Propulsores*, *Accesorios*, *Colores*; en Avión: *Fuselajes*, *Alas*, *Motores/Colas*, *Colores*).
- **Miniaturas 3D dinámicas (`generarMiniaturasCatalogo`, `js/interfaz.js` L47–L82):**
  - Actualmente posiciona la cámara en `[1.7, 1.05, 1.75]` para carrocería (`L65`) y `[0.42, 0.28, 0.52]` para piezas (`L68`). Al sumar alas de avión o cascos largos, conviene añadir un `zoomMiniatura` opcional o calcular `Box3().setFromObject(malla)` para centrar automáticamente cada miniatura sin recortes.
- **Corrección obligatoria en `renderizarBandeja` (`js/interfaz.js` L252–L255):**
  - `L254` evalúa `estadoCarro.piezasEquipadas.acc_techo` (propiedad inexistente) en lugar de `estadoCarro.piezasEnEnganches`. Para estado seleccionado multi-enganche conviene calcular `estaSeleccionada` verificando si `pieza.id` está presente en el enganche seleccionado (o en todos los enganches de su grupo).
- **Controles de conducción adicionales (`js/interfaz.js` L370–L388 y `#hud-conduccion`):**
  - Los aviones necesitarán control de altitud/cabeceo (p. ej. `KeyQ`/`KeyE` o flechas `↑/↓` en vuelo + altímetro en el HUD junto a `#valor-velocidad`).

---

### 5.2. Audio Procedural y Partituras (`js/audio.js`, 653 líneas; `js/partituras.js`, 353 líneas)

- **Perfiles de Motor (`PERFILES_MOTOR`, `js/audio.js` L11–L55):**
  - Hoy existen 3 perfiles (`PERFIL_MOTOR_GRAVE` `36–92 Hz`, `PERFIL_MOTOR_MEDIO` `45–120 Hz`, `PERFIL_MOTOR_DEPORTIVO` `58–155 Hz`), todos usando `oscMotor1` (`sawtooth`) + `oscMotor2` (`triangle` a sub-octava `0.5x`, `L421`), filtro pasa-bajos acotado a `120–360 Hz` (`L412–L415`) y ganancia máxima `0.065` (`L417`) para no tapar la música.
  - **Escalado por clase:** añadir campo `perfilAudio` a cada chasis o mapeo por defecto según `claseVehiculo`:
    - **Moto:** timbre bicilíndrico o 2T más ágil (`55–185 Hz`, `sawtooth` + `square` atenuada).
    - **Barco:** motor fueraborda grave con ligera modulación LFO de borboteo acuático (`32–95 Hz`, corte `110–270 Hz`).
    - **Avión:** motor de hélice (`38–110 Hz`, mezcla con banda de ruido blanco filtrado simulando flujo de aire en el propulsor).
- **Audio de Derrape / Superficie (`actualizarAudioDerrape`, `js/audio.js` L429–L441):**
  - El filtro actual (`bandpass` `750 + 520 * r` Hz, `L439`) imita fricción de caucho sobre asfalto. Parametrizando su frecuencia central y `Q` según la clase/superficie, el mismo nodo `fuenteDerrape -> filtroDerrape -> gainDerrape` puede producir espuma acuática (`320–720 Hz`, menor `Q`) en barcos o ráfaga aerodinámica en maniobras de avión.
- **Partituras por Escenario (`js/partituras.js` L41–L43):**
  - Actualmente `IDS_PISTAS_CONDUCCION = ['circuito_kart', 'autopista_16bit', 'turbo_apex']` y `actualizarMusicaAmbiental()` (`js/audio.js` L584–L588) fuerza `taller_juguetes` en Modo Taller y cicla las otras 3 pistas en conducción.
  - Para habitaciones temáticas (ej. *Piscina / Bañera Pirata* para Barcos, *Patio / Hangar Aéreo* para Aviones, *Circuito de Madera* para Coches y Motos), cada escenario podrá declarar `pistaSugeridaId` sin perder el cambio manual con la tecla `N`.

---

## 6. Mapa de Impacto por Archivo

| Archivo | Líneas | Símbolos / Funciones Clave Impactados | Nivel de Impacto | Plan de Refactorización Vertical |
| :--- | :---: | :--- | :---: | :--- |
| `js/constantes.js` | 25 | `HABITACION_ANCHO` (L1), `HABITACION_LARGO` (L2), `HABITACION_ALTO` (L3), `ALFOMBRA_RADIO` (L4), `CANTIDAD_POLVO` (L5), `URLS_TEXTURAS` (L7), `PALETA_COLORES` (L15) | **Alto** | Extraer dimensiones fijas a `CATALOGO_HABITACIONES` (manteniendo exportaciones alias por compatibilidad inicial); conservar `URLS_TEXTURAS` y `PALETA_COLORES` como compartidas; añadir `CLASES_VEHICULO`. |
| `js/estado.js` | 84 | `estadoCarro` (L3), `fisicaCarro` (L22), `mallasSuperficieConducible` (L51), `obstaculosHabitacion` (L53), `plataformasTurbo` (L56), `obstaculosDinamicos` (L57), `obstaculosMoviles` (L58), `estadoCronometro` (L73), `checkpointsPista` (L83) | **Crítico** | Añadir `idHabitacion`, `claseVehiculo`, configuración guardada por clase, `modoSimetriaEnganches` (en vez de `modoCuatroRuedas`), soporte de `piezasEnEnganches` dinámico y clave de récord por `(idHabitacion, claseVehiculo)` en `localStorage`. |
| `js/recursos.js` | 970 | `liberarObjeto3D` (L24), `bancoTexturas` (L6), `inicializarRecursos` (L914) | **Medio** | Agregar seguimiento/liberación explícita de texturas clonadas por escenario (e.g. variantes de agua, cielo, tierra, pistas nuevas) sin tocar texturas compartidas de `bancoTexturas`. Añadir generadores `<canvas>` para superficies nuevas (agua animada, tierra, pista de aterrizaje). |
| `js/escenario.js` | 1506 | `crearIluminacion` (L70), `construirHabitacionExpandida` (L101), `construirPistaDeCarreras` (L467), `crearCintaPistaContinua` (L548), `crearHazYPolvoVentana` (L1462) | **Crítico** | Encapsular todo nodo del escenario bajo `grupoEscenarioActivo`; extraer el generador `crearCintaPistaContinua` a utilidad reutilizable para cualquier ruta cerrada/abierta; separar el constructor de la habitación actual hacia un módulo/registro de escenarios e implementar `cargarEscenario(id)` con limpieza GPU total. |
| `js/catalogoPiezas.js` | 1442 | `crearAtributosChasis` (L381), `crearInteriorDetallado` (L73), `TABLA_CARROCERIAS` (L393), `TABLA_PIEZAS` (L1117) | **Crítico** | Etiquetar los 6 chasis actuales con `clase: 'coche'`; corregir referencia/tope del presupuesto UI (`60` vs `+20`); añadir `rolAnimacion` a enganches y `clasesCompatibles` + `esVacio` a `TABLA_PIEZAS`; registrar chasis y piezas de Moto, Barco y Avión (o dividir por submódulos `js/piezas/*.js` re-exportados aquí). |
| `js/enganches.js` | 241 | `grupoJuguete` (L13), `colocarPiezaEnEnganche` (L117), `construirOActualizarCarroceria` (L165) | **Alto** | Reemplazar `idPieza === 'acc_ninguno'` (L134) por `defPieza.esVacio`; filtrar compatibilidad por clase/tipo; soportar `orientacionAnillo` declarativa en enganches (L215); limpiar claves obsoletas en `estadoCarro.piezasEnEnganches` al cambiar de clase/chasis. |
| `js/conduccion.js` | 786 | `actualizarCronometroYCheckpoints` (L124), `obtenerInfoSuperficieEnPunto` (L241), `reposicionarEnMeta` (L270), `actualizarFisicaConduccion` (L308), `actualizarObstaculos` (L650), `actualizarCamaraConduccion` (L757) | **Crítico** | Parametrizar límites con `(ancho, largo, alto)` reales del escenario; tomar `puntoMeta` y `totalCheckpoints` del escenario activo; introducir estrategia `PERFILES_FISICA` (coche, moto, barco, avión) manteniendo intactos `-30%` fuera de pista, `±20%` en pendiente y derrape + Mini-Turbo; generalizar bucle mecánico de enganches (L615–L624) por `rolAnimacion`. |
| `js/interfaz.js` | 478 | `generarMiniaturasCatalogo` (L47), `actualizarTextoEstado` (L98), `alternarModoTallerConduccion` (L119), `renderizarBandeja` (L214), `configurarEventosInteraccion` (L330) | **Alto** | Corregir bug `piezasEquipadas.acc_techo` (L254); reemplazar listas hardcodeadas `['rueda_di', ...]` (L165, L305, L410) y `'acc_techo'` (L316, L414) por inspección de `nodosEnganches` y `grupoSimetria`; añadir selectores de Escenario y Clase; adaptar pestañas y mensajes del taller por clase. |
| `js/audio.js` | 653 | `PERFILES_MOTOR` (L47), `actualizarAudioMotor` (L393), `actualizarAudioDerrape` (L429), `actualizarMusicaAmbiental` (L578) | **Medio** | Añadir perfiles acústicos para Moto, Barco y Avión manteniendo ganancia acotada (`<= 0.065`); parametrizar timbre de derrape según medio (asfalto, agua, aire); soportar partitura por defecto configurable por escenario. |
| `js/partituras.js` | 353 | `IDS_PISTAS_CONDUCCION` (L41), `CATALOGO_PARTITURAS` (L43) | **Bajo** | Estructura ya agnóstica y extensible: basta añadir nuevas partituras temáticas asociadas a nuevas habitaciones/clases e incluirlas en los selectores de pista. |
| `js/main.js` | 184 | `actualizarEscena` (L37), arranque principal (L173–L183) | **Bajo** | Leer dimensiones de techo de partículas y cantidad desde la configuración del escenario activo (L83, L87) y delegar el arranque del escenario inicial al gestor unificado `cargarEscenario(...)`. |
| `index.html` | 105 | `#barra-superior` (L19–L37), `#hud-conduccion` (L42–L80), `#bandeja-inferior` (L83–L101) | **Medio** | Incorporar controles para elegir Habitación/Escenario y Clase de Vehículo, indicador opcional de altitud/profundidad en `#hud-conduccion` (para Avión) y pestañas dinámicas en `#pestanas`. |
| `css/estilos.css` | 486 | `#barra-superior` (L24), `#controles-modo` (L54), `.barra-stat-relleno` (L468) | **Bajo** | Añadir estilos compactos para selectores de escenario/clase en `#barra-superior` evitando desbordamiento horizontal en resoluciones medianas. |
