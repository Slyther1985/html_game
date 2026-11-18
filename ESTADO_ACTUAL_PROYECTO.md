# Estado Actual del Proyecto: Taller y Circuito de Juguetes 3D

> Documento técnico maestro de solo lectura sobre la arquitectura, contratos de datos, catálogos, circuitos, motor físico, audio, interfaz y verificación automatizada del repositorio (`c:\html_games`).

---

## 1. Métricas del Proyecto y Estado de Fases

### 1.1 Inventario y Conteo Exacto de Líneas

| Archivo | Líneas reales | Líneas en `MAPA_SIMBOLOS.md` | Rol / Responsabilidad principal |
| :--- | ---: | ---: | :--- |
| [`index.html`](file:///c:/html_games/index.html) | 214 | — | Estructura DOM, favicon SVG inline, carga CDN de Three.js r128 y punto de entrada ES6 (`js/main.js`) |
| [`css/estilos.css`](file:///c:/html_games/css/estilos.css) | 1,024 | — | Estilos del taller, menú estilo Mario Kart, modal de copas/circuitos, HUD de conducción y cronómetro |
| [`js/audio.js`](file:///c:/html_games/js/audio.js) | 742 | 743 | Motor de audio procedural Web Audio API (eco tipo SPC700, 6 perfiles de motor, derrape, efectos y secuenciador) |
| [`js/catalogoPiezas.js`](file:///c:/html_games/js/catalogoPiezas.js) | 3,761 | 3,762 | Catálogo de 24 chasis, 49 piezas con `modStats`, interiores 3D detallados y cálculo compuesto `obtenerAtributosFinalesVehiculo` |
| [`js/conduccion.js`](file:///c:/html_games/js/conduccion.js) | 1,001 | 1,002 | Motor físico polimórfico (coche/moto/barco/avión), pendientes, fuera de pista, afinidad, trampas, vuelo, obstáculos y cronómetro |
| [`js/constantes.js`](file:///c:/html_games/js/constantes.js) | 77 | 78 | Catálogo de las 4 habitaciones temáticas, clases de vehículo, paleta de pintura y URLs de texturas externas autorizadas |
| [`js/enganches.js`](file:///c:/html_games/js/enganches.js) | 303 | 304 | Sistema de ensamblaje 3D, enganches interactivos con simetría, animaciones elásticas y chispas GPU-safe |
| [`js/escenario.js`](file:///c:/html_games/js/escenario.js) | 3,318 | 3,319 | Escena Three.js, gestor caliente `cargarEscenario`, decoración de 4 habitaciones, pistas continuas, bifurcaciones, atajos y trampas |
| [`js/estado.js`](file:///c:/html_games/js/estado.js) | 162 | 163 | Estado global centralizado (`estadoCarro`, `fisicaCarro`, `estadoCronometro`), colecciones de colisión/trampas y `localStorage` |
| [`js/interfaz.js`](file:///c:/html_games/js/interfaz.js) | 1,229 | 1,230 | Menú Mario Kart, miniaturas `Box3`, modal de copas, cambios de clase/escenario, cámara, bandeja y listeners ratón/teclado |
| [`js/main.js`](file:///c:/html_games/js/main.js) | 180 | 181 | Orquestador de arranque, inicialización de recursos/escenario/UI y bucle `requestAnimationFrame` a 60 FPS |
| [`js/partituras.js`](file:///c:/html_games/js/partituras.js) | 507 | 508 | Partituras multipista de 16 bits (`CATALOGO_PARTITURAS`: 6 temas × 4 canales × 128 semicorcheas) |
| [`js/recursos.js`](file:///c:/html_games/js/recursos.js) | 1,497 | 1,498 | Texturas procedurales en `<canvas>` (`crearTexturaTrampa`, pósteres, superficies, previews), respaldo offline y `liberarObjeto3D()` |
| [`generar_mapa.mjs`](file:///c:/html_games/generar_mapa.mjs) | 237 | — | Escáner estático de módulos `js/*.js` que regenera `MAPA_SIMBOLOS.md` |
| [`verify_project.mjs`](file:///c:/html_games/verify_project.mjs) | 1,561 | — | Suite automatizada integral de contratos, grafo acíclico, DOM/CSS, física, audio, GPUs y rediseño de 4 circuitos |
| **Total código fuente (15 archivos)** | **15,813** | **12,788** *(solo `js/*.js`)* | **12,777 líneas reales en `js/*.js`** (11 módulos ES6 sin ciclos) |

*(Documentación existente adicional en raíz: [`GEMINI.md`](file:///c:/html_games/GEMINI.md) con 30 líneas, [`AUDITORIA_ESCALADO_VERTICAL.md`](file:///c:/html_games/AUDITORIA_ESCALADO_VERTICAL.md) con 396 líneas y [`MAPA_SIMBOLOS.md`](file:///c:/html_games/MAPA_SIMBOLOS.md) con 513 líneas reales / 514 según `split('\n')`.)*

### 1.2 Estado de Fases y Mejoras Aplicadas

| Fase / Mejora | Estado actual | Evidencia verificada en el código |
| :--- | :--- | :--- |
| **Física Base +20% / ±20% / -30% y Cabina 3D** | **Aplicado y verificado** | `crearAtributosChasis()` con `* 1.20 * 1.30` vel / `* 1.18 * 1.30` acel; `vistaCabina` y nodo `volanteCabina` en los 24 chasis |
| **Fase 1: Cimientos Polimórficos y Gestor de Escenarios** | **Aplicado y verificado** | `CATALOGO_HABITACIONES`, `clasesCompatibles`, `rolAnimacion`, `cargarEscenario()`, `liberarObjeto3D()` con clones `esClonTemporal` |
| **Fase 2: 4 Clases (`coche`, `moto`, `barco`, `avion`)** | **Aplicado y verificado** | `PERFILES_FISICA` en [`js/conduccion.js`](file:///c:/html_games/js/conduccion.js#L46-L93), audio por clase en [`js/audio.js`](file:///c:/html_games/js/audio.js#L11-L120), miniaturas con encuadre `Box3` |
| **Fase 3: 4 Habitaciones, +6% Afinidad y 6 Partituras** | **Aplicado y verificado** | 4 escenarios completos en `js/escenario.js`, anillos aéreos en Hangar, `calcularFactorAfinidadMedio()` y 5 pistas de conducción rotativas |
| **Parte 1: Menú Mario Kart, `modStats` y Decoración 4 Salas** | **Aplicado y verificado** | Paneles `#selector-clase-mk`, `#panel-personalizacion-mk`, `#panel-stats-mk`, `#modal-circuitos-mk`, `obtenerAtributosFinalesVehiculo()`, utilería por habitación |
| **Parte 2: Catálogo Expandido (24 Chasis 6×4 + 49 Piezas)** | **Aplicado y verificado** | 24 entradas en `TABLA_CARROCERIAS` (6 por clase), 49 entradas en `TABLA_PIEZAS` (12 coche, 10 moto, 13 barco, 14 avion), `PERFILES_MOTOR` cubriendo los 24 IDs |
| **Rediseño Profundo de 4 Circuitos, Bifurcaciones y `trampasPista`** | **Aplicado y verificado** | Ya implementado y probado en sección `4K` de [`verify_project.mjs`](file:///c:/html_games/verify_project.mjs#L1403-L1559): rutas divididas elevadas (`crearTramoBifurcacionElevada`), atajos con muro de 8 bloques (`crearMuroAtajoDerribable`), `16–18` Boost Pads, `10` móviles, `22–24` dinámicos y `6` trampas (`aceite`/`espuma`/`barro`) por pista con `crearTexturaTrampa()` |

---

## 2. Mapa de Símbolos y Líneas Actualizado (`MAPA_SIMBOLOS.md`)

A continuación se incluye el índice íntegro generado por [`node generar_mapa.mjs`](file:///c:/html_games/generar_mapa.mjs) sobre los 11 módulos de `js/*.js` (números de línea coincidentes con `MAPA_SIMBOLOS.md`):

### `js/audio.js` (743 líneas)
- **Imports**: L3 desde `./partituras.js`: `notaAFrecuencia`, `CATALOGO_PARTITURAS`, `IDS_PISTAS_CONDUCCION`
- **Exports**:
  - `inicializarAudioInteractivo()` (L410), `alternarSilencio()` (L425), `cambiarModoMusical(modo)` (L442), `actualizarAudioMotor(velocidad, velMax, idCarroceria, enAire)` (L458), `actualizarAudioDerrape(enDerrape, ratioVelocidad, idCarroceria = '')` (L496), `reproducirTurbo(esPlataforma = false)` (L521), `reproducirImpacto(intensidad = 0.6, tipo = 'obstaculo')` (L535), `reproducirCheckpoint(indice)` (L577), `reproducirMeta(esRecord = false)` (L587), `reproducirEncajePieza()` (L615), `reproducirQuitarPieza()` (L623), `reproducirCambioColor()` (L630), `seleccionarPistaMusicalPorId(idPista)` (L637), `cambiarPistaConduccion()` (L652), `actualizarMusicaAmbiental(dt, modoJuego, enTurboBoost = false)` (L668)
- **Internos (nivel superior)**:
  - Constantes: `GANANCIA_MAESTRA` (L9), `PERFIL_MOTOR_GRAVE` (L11), `PERFIL_MOTOR_MEDIO` (L23), `PERFIL_MOTOR_DEPORTIVO` (L35), `PERFIL_MOTOR_MOTO` (L47), `PERFIL_MOTOR_BARCO` (L63), `PERFIL_MOTOR_AVION` (L79), `PERFILES_MOTOR` (L94), `NOTAS_CHECKPOINTS` (L123)
  - Estado (`let`): `ctxAudio` (L125), `gainMaestro` (L126), `bufferRuidoBlanco` (L127), `delayMusica` (L128), `feedbackEco` (L129), `filtroEco` (L130), `envioEcoMusica` (L131), `oscMotor1` (L134), `oscMotor2` (L135), `filtroMotor` (L136), `gainMotor` (L137), `fuenteDerrape` (L139), `filtroDerrape` (L140), `gainDerrape` (L141), `silenciado` (L143), `modoMusicaActual` (L144), `indicePistaConduccion` (L145), `acumuladorSecuencia` (L146), `pasoSecuencia` (L147), `ultimoImpactoTs` (L148), `ultimoChasisMotor` (L149), `listenersRegistrados` (L150)
  - Funciones: `crearBufferRuido(ctx)` (L155), `desbloquearAudio()` (L168), `audioDisponible()` (L248), `dispararRuidoPercusion(tipoFiltro, freq, Q, duracion, volumen, t0)` (L353), `reproducirPercusionSecuenciador(simbolo)` (L379)

### `js/catalogoPiezas.js` (3762 líneas)
- **Imports**: L1 desde `./recursos.js`: `crearCajaRedondeada`, `crearTexturaBandaRodadura`, `crearTexturaDiscoFreno`, `crearTexturaTablero`
- **Exports**:
  - `crearMaterialPintura(colorHex)` (L12), `crearMaterialCristalCabina()` (L27), `agregarDetallesCarroceria(grupo, largoX, altoY, anchoZ)` (L43), `crearInteriorDetallado(config)` (L73), `TABLA_CARROCERIAS` (L510), `TABLA_PIEZAS` (L2357), `obtenerAtributosFinalesVehiculo(estado = null)` (L3695)
- **Internos (nivel superior)**:
  - `agregarDiscoYMordaza(grupo, radioDisco = 0.088)` (L334), `crearMaterialCaucho(estilo = 'deportiva', colorHex = 0x1a1e26)` (L366), `crearAtributosChasis(velocidad, aceleracion, control, agarreDerrape, pesoImpacto)` (L381), `crearConsolaMandoVehiculo(tipo, posMando, colorHex = 0xff1e27)` (L395), `crearMallaRuedaMoto(radio, grosor, estiloCaucho, colorRin, conNeon = false)` (L462)
- **Entradas de Catálogo**:
  - `TABLA_CARROCERIAS` (24 entradas): L512–L2299 (ver desglose completo en Sección 4)
  - `TABLA_PIEZAS` (49 entradas): L2359–L3664 (ver desglose completo en Sección 4)

### `js/conduccion.js` (1002 líneas)
- **Imports**:
  - L1 desde `./constantes.js`: `CATALOGO_HABITACIONES`
  - L2 desde `./estado.js`: `estadoCarro`, `fisicaCarro`, `teclasConduccion`, `mallasSuperficieConducible`, `obstaculosHabitacion`, `nodosEnganches`, `plataformasTurbo`, `obstaculosDinamicos`, `obstaculosMoviles`, `trampasPista`, `estadoCronometro`, `checkpointsPista`, `obtenerClaveRecord`
  - L17 desde `./escenario.js`: `camara`, `controles`
  - L18 desde `./catalogoPiezas.js`: `TABLA_CARROCERIAS`, `obtenerAtributosFinalesVehiculo`
  - L19 desde `./enganches.js`: `grupoJuguete`, `dispararChispasEnEnganche`
  - L20 desde `./audio.js`: `actualizarAudioMotor`, `actualizarAudioDerrape`, `reproducirTurbo`, `reproducirImpacto`, `reproducirCheckpoint`, `reproducirMeta`
- **Exports**:
  - `PERFILES_FISICA` (L46), `formatearTiempoMMSS(segundos)` (L98), `actualizarHUDCronometro()` (L137), `reiniciarCronometroVuelta(activar = false)` (L172), `obtenerInfoSuperficieEnPunto(x, z, alturaReferencia)` (L321), `obtenerAlturaSuperficieEnPunto(x, z, alturaReferencia)` (L350), `reposicionarEnMeta()` (L357), `actualizarFisicaConduccion(dt)` (L406), `actualizarObstaculos(dt, tiempoTotal)` (L866), `actualizarCamaraConduccion(dt)` (L973)
- **Internos (nivel superior)**:
  - Variables: `raycasterSuelo` (L29), `vectorAbajo` (L30), `acumuladorChispasDerrape` (L31), `enPistaActual` (L32), `tipoSuperficieActual` (L33), `temporizadorVibracionAudio` (L34), `ultimoPitchTerreno` (L35), `tiempoHidrodinamico` (L36), `tipoTrampaActiva` (L37)
  - Funciones: `calcularFactorAfinidadMedio(claseVehiculo, tipoSuperficie, enAire, idHabitacion)` (L39), `reiniciarLucesCheckpoints()` (L118), `actualizarCronometroYCheckpoints(dt, xAnterior)` (L186), `diferenciaAngular(objetivo, actual)` (L279), `actualizarInsigniaEstadoHUD()` (L286), `cancelarDerrapePorChoque()` (L308)

### `js/constantes.js` (78 líneas)
- **Imports**: Sin imports locales.
- **Exports**: `CLASES_VEHICULO` (L1), `TOPE_STAT_UI` (L2), `IDS_HABITACIONES` (L3), `CATALOGO_HABITACIONES` (L10), `HABITACION_ANCHO` (L54), `HABITACION_LARGO` (L55), `HABITACION_ALTO` (L56), `ALFOMBRA_RADIO` (L57), `CANTIDAD_POLVO` (L58), `URLS_TEXTURAS` (L60), `PALETA_COLORES` (L68)

### `js/enganches.js` (304 líneas)
- **Imports**: L1 `./recursos.js` (`bancoTexturas`, `liberarObjeto3D`), L2 `./escenario.js` (`escena`), L3 `./catalogoPiezas.js` (`TABLA_CARROCERIAS`, `TABLA_PIEZAS`), L4 `./estado.js` (`estadoCarro`, `nodosEnganches`, `listaColisionadoresEnganches`, `animacionesActivas`, `chorrosChispasActivos`), L11 `./audio.js` (`reproducirEncajePieza`, `reproducirQuitarPieza`)
- **Exports**: `grupoJuguete` (L13), `dispararChispasEnEnganche(posicionMundo, colorHex = 0xffd166)` (L24), `animarSalidaYLiberar(mallaSaliente, grupoPadre)` (L64), `animarEntradaElastica(objeto, escalaObjetivo)` (L100), `colocarPiezaEnEnganche(idEnganche, idPieza, conEfectos = true)` (L129), `construirOActualizarCarroceria(idNuevaCarroceria, conEfectos = true, esCambioColor = false)` (L187)
- **Internos (nivel superior)**: `mallaCarroceriaActual` (L18), `sincronizarConfiguracionClase()` (L113)

### `js/escenario.js` (3319 líneas)
- **Imports**: L1 `./constantes.js` (`HABITACION_ANCHO`, `HABITACION_LARGO`, `HABITACION_ALTO`, `ALFOMBRA_RADIO`, `CANTIDAD_POLVO`, `CATALOGO_HABITACIONES`), L9 `./recursos.js` (`bancoTexturas`, `liberarObjeto3D`, `crearCajaRedondeada`, `crearTexturaPosterPared`, `crearTexturaLetraCubo`, `crearTexturaPelotaLuxo`), L17 `./estado.js` (`estadoCarro`, `estadoCronometro`, `mallasSuperficieConducible`, `obstaculosHabitacion`, `plataformasTurbo`, `obstaculosDinamicos`, `obstaculosMoviles`, `trampasPista`, `checkpointsPista`)
- **Exports**: `lienzo` (L29), `escena` (L30), `grupoEscenarioActivo` (L33), `camara` (L36), `renderizador` (L44), `controles` (L62), `sistemaPolvo` (L72), `crearIluminacion(contenedor, hab)` (L78), `construirHabitacionExpandida(contenedor)` (L313), `construirPistaDeCarreras(contenedor)` (L1416), `construirEscenarioAcuatico(contenedor)` (L1974), `construirEscenarioAtico(contenedor)` (L2409), `construirEscenarioHangar(contenedor)` (L2804), `crearHazYPolvoVentana(contenedor, hab)` (L3212), `cargarEscenario(idHabitacion)` (L3264)
- **Internos (nivel superior)**: `crearMaterialClonTextura` (L122), `interpolarSegmentoCatmull` (L130), `subdividirCurvaSuave` (L154), `crearArcoCheckpointEnGrupo` (L167), `crearBoostPadsEnGrupo` (L263), `crearCintaPistaDesdeNodos` (L690), `crearRecintoHabitacionBase` (L1037), `crearMetaYEnlaceTallerEnGrupo` (L1204), `registrarObstaculoDinamico` (L1257), `crearBarreraMovilTematica` (L1272), `crearTramoBifurcacionElevada` (L1302), `crearTrampasEnGrupo` (L1352), `crearMuroAtajoDerribable` (L1389), `generarNodosCircuitoCerrado` (L1943)

### `js/estado.js` (163 líneas)
- **Imports**: L1 `./constantes.js` (`PALETA_COLORES`)
- **Exports**: `estadoCarro` (L11), `fisicaCarro` (L70), `teclasConduccion` (L92), `nodosEnganches` (L94), `listaColisionadoresEnganches` (L95), `animacionesActivas` (L96), `chorrosChispasActivos` (L97), `mallasSuperficieConducible` (L100), `obstaculosHabitacion` (L102), `plataformasTurbo` (L105), `obstaculosDinamicos` (L106), `obstaculosMoviles` (L107), `trampasPista` (L108), `obtenerClaveRecord` (L115), `estadoCronometro` (L149), `checkpointsPista` (L162)
- **Internos (nivel superior)**: `PIEZAS_COCHE_INICIAL` (L3), `CLAVE_RECORD_LEGACY` (L110), `leerRecordLocalStorage` (L119), `guardarRecordLocalStorage` (L136)

### `js/interfaz.js` (1230 líneas)
- **Imports**: L1 `./constantes.js`, L2 `./estado.js`, L10 `./recursos.js`, L11 `./escenario.js`, L12 `./catalogoPiezas.js`, L13 `./enganches.js`, L19 `./conduccion.js`, L25 `./audio.js`
- **Exports**: `generarMiniaturasCatalogo()` (L142), `actualizarPanelesMarioKart()` (L323), `ciclarOpcionRanuraMK(ranuraId, direccion = 1)` (L489), `abrirModalCircuitosMK()` (L534), `cerrarModalCircuitosMK()` (L605), `cambiarClaseVehiculo(claseDestino = null)` (L614), `cambiarHabitacion(idOpcional = null)` (L682), `actualizarTextoEstado()` (L745), `alternarModoTallerConduccion()` (L775), `alternarCamaraConduccion()` (L863), `renderizarBandeja(categoria)` (L874), `configurarEventosInteraccion()` (L1001)
- **Internos (nivel superior)**:
  - Tablas: `ETIQUETAS_CLASE` (L34), `PESTANAS_POR_CLASE` (L41), `CATEGORIAS_AGRUPADAS` (L68), `RANURAS_MK_POR_CLASE` (L73), `DESCRIPCIONES_SUPERFICIE_HAB` (L102)
  - Estado y DOM refs: `categoriaActiva` (L109), `ranuraMKActiva` (L110), `subRanuraSecundariaIdx` (L111), `barraEstado`..`btnCerrarModalMK` (L113–L136)
  - Funciones: `actualizarBotonesClaseYHUD()` (L202), `actualizarNombreChasisHUD()` (L242), `formatearBonoPieza(mod)` (L249), `obtenerListaYActivaPorCategoria(categoria)` (L258), `aplicarSeleccionItemTaller(pieza)` (L278), `actualizarTextoBtnHabitacion()` (L671)

### `js/main.js` (181 líneas)
- **Imports**: L1 `./constantes.js`, L2 `./estado.js`, L9 `./recursos.js`, L10 `./escenario.js`, L18 `./enganches.js`, L19 `./conduccion.js`, L20 `./interfaz.js`, L25 `./audio.js`
- **Exports**: Sin exports (módulo de arranque).
- **Internos (nivel superior)**: `tiempoAnterior` (L27), `actualizarEscena(dt, tiempoTotal)` (L34), `buclePrincipal(ahora)` (L164)

### `js/partituras.js` (508 líneas)
- **Imports**: Sin imports locales.
- **Exports**: `notaAFrecuencia(nota)` (L16), `IDS_PISTAS_CONDUCCION` (L41), `CATALOGO_PARTITURAS` (L49)
- **Internos (nivel superior)**: `SEMITONOS_BASE` (L3), `pasos` (L39)

### `js/recursos.js` (1498 líneas)
- **Imports**: L1 `./constantes.js` (`URLS_TEXTURAS`)
- **Exports**: `cargadorTexturas` (L3), `bancoTexturas` (L6), `cacheMiniaturas` (L7), `crearCajaRedondeada` (L13), `liberarObjeto3D` (L57), `crearRespaldoMaderaCanvas` (L76), `crearRespaldoSpriteCanvas` (L116), `cargarTexturaSegura` (L134), `crearTexturaPapelTapiz` (L155), `crearTexturaAlfombra` (L212), `crearTexturaPistaAsfalto` (L250), `crearTexturaPianoCurva` (L287), `crearTexturaMetaCuadros` (L307), `crearTexturaBandaRodadura` (L330), `crearTexturaDiscoFreno` (L415), `crearTexturaTurboPad` (L496), `crearTexturaPosterPared` (L572), `crearTexturaLetraCubo` (L919), `crearTexturaPelotaLuxo` (L953), `crearTexturaTablero` (L981), `crearTexturaAgua` (L1101), `crearTexturaAzulejoPiscina` (L1136), `crearTexturaTierraCompactada` (L1169), `crearTexturaPisoHangar` (L1198), `crearVistaPreviaEscenario` (L1229), `crearTexturaTrampa` (L1353), `inicializarRecursos` (L1414)
- **Internos (nivel superior)**: `SLOTS_TEXTURA_MATERIAL` (L20), `liberarMaterialYClones` (L32), `dibujarEstrella2D` (L553), `crearCanvasTexturaRepetible` (L1085)

---

## 3. Contratos de Estado y Configuración (`js/constantes.js` y `js/estado.js`)

### 3.1 Constantes y Catálogo de Habitaciones ([`js/constantes.js`](file:///c:/html_games/js/constantes.js))

- `CLASES_VEHICULO = ['coche', 'moto', 'barco', 'avion']`
- `TOPE_STAT_UI = 85` (valor máximo de referencia para las barras visuales del menú Mario Kart)
- `IDS_HABITACIONES = ['habitacion_andy', 'habitacion_acuatica', 'habitacion_atico', 'habitacion_hangar']`
- Alias de compatibilidad hacia `habitacion_andy`: `HABITACION_ANCHO = 85.0`, `HABITACION_LARGO = 85.0`, `HABITACION_ALTO = 7.5`, `ALFOMBRA_RADIO = 1.5`, `CANTIDAD_POLVO = 350`.

| ID (`id`) | Nombre | `dimensiones` (Ancho × Largo × Alto m) | `taller.radioBase` | `ambiente` (`particulas`, `techo`, `colorFondo`) | `meta` (`x, y, z, yaw, cruceZ, rangoX`) | `pistaSugeridaId` | `claseIdeal` |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `habitacion_andy` | `Cuarto de Andy (Grand Prix)` | `85.0 × 85.0 × 7.5` | `1.5` | `350`, `6.2`, `0xdbeafe` | `x: -1.8, y: 0.025, z: 26.0, yaw: 0, cruceZ: 26.0, rangoX: 5.5` | `autopista_16bit` | `coche` |
| `habitacion_acuatica` | `Bahía Acuática (Splash GP)` | `90.0 × 90.0 × 9.0` | `1.8` | `320`, `7.8`, `0xbae6fd` | `x: -1.8, y: 0.025, z: 28.0, yaw: 0, cruceZ: 28.0, rangoX: 6.0` | `ola_snes` | `barco` |
| `habitacion_atico` | `Ático Enduro (Stunt Park)` | `92.0 × 92.0 × 10.0` | `1.6` | `380`, `8.5`, `0xfef3c7` | `x: -1.8, y: 0.025, z: 27.0, yaw: 0, cruceZ: 27.0, rangoX: 5.8` | `turbo_apex` | `moto` |
| `habitacion_hangar` | `Domo Aéreo (Sky Hangar)` | `110.0 × 110.0 × 18.0` | `2.0` | `420`, `16.0`, `0x0f172a` | `x: -1.8, y: 0.025, z: 32.0, yaw: 0, cruceZ: 32.0, rangoX: 7.0` | `cielo_snes` | `avion` |

- `URLS_TEXTURAS` (5 texturas externas `mrdoob/three.js` r128 en GitHub Raw con respaldo Canvas): `maderaDiffuse`, `maderaRoughness`, `maderaBump`, `chispaPolvo`, `discoParticula`.
- `PALETA_COLORES` (8 pinturas):
  1. `rojo`: `'Rojo Carmesí'` (`0xff1e27`)
  2. `azul`: `'Azul Eléctrico'` (`0x0066ff`)
  3. `amarillo`: `'Amarillo Cyber'` (`0xffdd00`)
  4. `verde`: `'Verde Lima Nitro'` (`0x00f566`)
  5. `naranja`: `'Naranja Papaya'` (`0xff5e00`)
  6. `morado`: `'Púrpura Ultravioleta'` (`0x9d00ff`)
  7. `turquesa`: `'Cian Hiper'` (`0x00f0ff`)
  8. `blanco`: `'Blanco Titanio'` (`0xffffff`)

### 3.2 Estado Centralizado ([`js/estado.js`](file:///c:/html_games/js/estado.js))

1. **`estadoCarro`** (L11–67):
   - `idHabitacion`: `'habitacion_andy'`
   - `claseVehiculo`: `'coche'`
   - `modoJuego`: `'taller'` (`'taller' | 'conduccion'`)
   - `modoCamara`: `'tercera'` (`'tercera' | 'cabina'`)
   - `idCarroceria`: `'carroceria_sedan'`
   - `colorHex`: `PALETA_COLORES[0].hex` (`0xff1e27`), `idColor`: `'rojo'`
   - `piezasEnEnganches`: `{ rueda_di: 'rueda_clasica', rueda_dd: 'rueda_clasica', rueda_ti: 'rueda_clasica', rueda_td: 'rueda_clasica', acc_techo: 'acc_aleron' }`
   - `configuracionesPorClase` (presets guardados al alternar de clase):
     - `coche`: `carroceria_sedan`, `'rojo'`, ruedas `rueda_clasica` + `acc_aleron`
     - `moto`: `moto_superbike`, `'azul'`, ruedas `rueda_moto_slick` + `acc_moto_turbina`
     - `barco`: `barco_hidroplano`, `'turquesa'`, `prop_helice_bronce` + `timon_doble_aleta` + `acc_barco_spoiler`
     - `avion`: `avion_acrobatico`, `'rojo'`, `ala_recta_acrobatica` + `motor_helice_bipala` + `cola_clasica`
   - `modoSimetriaEnganches`: `true` (con propiedad getter/setter alias `modoCuatroRuedas`)
   - `engancheSeleccionadoId`: `null`, `engancheHoverId`: `null`

2. **`fisicaCarro`** (L70–90):
   - `x: 0.0`, `y: 0.02`, `z: 0.0`, `altitudVuelo: 0.0`, `velocidad: 0.0`, `velY: 0.0`, `yaw: 0.0`, `anguloMovimiento: 0.0`, `pitch: 0.0`, `roll: 0.0`, `anguloVolante: 0`, `rotacionRodadura: 0`, `enAire: false`, `derrapando: false`, `tiempoDerrape: 0.0`, `tiempoDerrapeActivo: 0.0`, `enfriamientoDerrape: 0.0`, `tiempoTurbo: 0.0`, `tiempoMiniTurbo: 0.0`.

3. **`estadoCronometro`** (L149–160) y `obtenerClaveRecord` (L115–117):
   - `vueltaActiva: false`, `tiempoActual: 0`, `ultimaVuelta: null`, `mejorVuelta: leerRecordLocalStorage(...)`, `checkpointActual: 0`, `totalCheckpoints: 5`, `avisoRecord: 0`, `obtenerClaveRecord`, `leerRecord`, `guardarRecord`.
   - Clave `localStorage`: `` `record_vuelta_${idHabitacion}_${claseVehiculo}` `` con espejo/respaldo `'record_vuelta_pista_3d'` cuando `idHabitacion === 'habitacion_andy' && claseVehiculo === 'coche'`.

4. **Arreglos y mapas globales exportados** (L92–108, L162):
   - `teclasConduccion = {}` (mapa código tecla → boolean)
   - `nodosEnganches = {}` (nodos 3D por `idEnganche` activo)
   - `listaColisionadoresEnganches = []` (mallas invisibles para raycast en Taller)
   - `animacionesActivas = []` (interpolaciones elásticas y de salida al acoplar/desmontar piezas)
   - `chorrosChispasActivos = []` (sistemas temporales de chispas)
   - `mallasSuperficieConducible = []` (mallas con `userData.esPista` y `userData.tipoSuperficie`)
   - `obstaculosHabitacion = []` (colisionadores estáticos `{ x, z, radio }` de muebles/pilares)
   - `plataformasTurbo = []` (Boost Pads suelo/elevados y anillos aéreos `{ pos, radio, margenY, factorImpulso, enfriamiento }`)
   - `obstaculosDinamicos = []` (conos, bloques, boyas, barriles, balizas y muros de atajo derribables con física y respawn en 8s)
   - `obstaculosMoviles = []` (compuertas, drones y barreras oscilantes sinusoidales)
   - `trampasPista = []` (`{ malla, posicion: THREE.Vector3, radio, tipo: 'aceite' | 'espuma' | 'barro' }`)
   - `checkpointsPista = []` (`{ indice, x, y, z, radio, radioVertical, materialesLuz, matIndicador, matCampo }`)

---

## 4. Inventario del Catálogo: 24 Chasis y 49 Piezas (`js/catalogoPiezas.js`)

### 4.1 Fórmulas Base y Compuesta ([`js/catalogoPiezas.js`](file:///c:/html_games/js/catalogoPiezas.js#L381-L390))

1. **`crearAtributosChasis(velocidad, aceleracion, control, agarreDerrape, pesoImpacto)`** (L381–390):
   - `velMax = +((2.5 + velocidad * 0.065) * 1.20 * 1.30).toFixed(3)`
   - `aceleracion = +((1.8 + aceleracion * 0.065) * 1.18 * 1.30).toFixed(3)`
   - `manejo = +(1.1 + control * 0.022).toFixed(3)`

2. **`obtenerAtributosFinalesVehiculo(estado = null)`** (L3695–3761):
   - Agrupa los `enganches` del chasis activo por `eng.grupoSimetria || eng.id` (evitando multiplicar ×4 las ruedas simétricas de un coche o ×2 las de una moto).
   - Para cada enganche consulta la pieza equipada en `estado.piezasEnEnganches[eng.id]`; si está vacío, toma la pieza con `esVacio === true && tipoEnganche === eng.tipo` (que aporta `{ velocidad: 0, aceleracion: 2, control: 0 }` cuando existe).
   - Promedia `modStats` dentro de cada grupo simétrico (`gSum / listaEng.length`), suma todos los grupos y redondea (`bonoStats = { velocidad: Math.round(sumVel), aceleracion: Math.round(sumAcel), control: Math.round(sumCtrl) }`).
   - Recalcula `statsUI = { velocidad: max(5, base + bono), aceleracion: max(5, base + bono), control: max(5, base + bono) }` y deriva:
     - `velMax = +((2.5 + statsUI.velocidad * 0.065) * 1.20 * 1.30).toFixed(3)`
     - `aceleracion = +((1.8 + statsUI.aceleracion * 0.065) * 1.18 * 1.30).toFixed(3)`
     - `manejo = +(1.1 + statsUI.control * 0.022).toFixed(3)`

### 4.2 Tabla de los 24 Chasis en `TABLA_CARROCERIAS` (6 por clase)

| # | `id` | `clase` | `nombre` | `VEL / ACEL / CTRL` | `velMax` | `acel` | `manejo` | `agarreDerrape` | `pesoImpacto` | `vistaCabina` | Enganches (`id` : `tipo` / `rolAnimacion` [simetría]) |
| :-: | :--- | :--- | :--- | :---: | ---: | ---: | ---: | ---: | ---: | :--- | :--- |
| 1 | `carroceria_sedan` | `coche` | Sedán GT Turbo | `60 / 40 / 40` | 9.984 | 6.750 | 1.980 | 0.84 | 1.00 | `[-0.08, 0.435, -0.13]` | `rueda_di, dd, ti, td`: `rueda`/`rueda_motriz` `[ruedas]`; `acc_techo`: `accesorio`/`estatico` |
| 2 | `carroceria_camioneta` | `coche` | Camioneta Raptor Sport | `50 / 48 / 42` | 8.970 | 7.547 | 2.024 | 0.90 | 1.45 | `[0.02, 0.565, -0.15]` | Ídem 4 `rueda` `[ruedas]` + `acc_techo` (`accesorio`/`estatico`) |
| 3 | `carroceria_deportivo` | `coche` | Hiperdeportivo Le Mans | `78 / 36 / 26` | 11.809 | 6.351 | 1.672 | 0.82 | 0.95 | `[-0.08, 0.365, -0.125]` | Ídem 4 `rueda` `[ruedas]` + `acc_techo` (`accesorio`/`estatico`) |
| 4 | `carroceria_formula` | `coche` | Monoplaza Fórmula Apex | `54 / 42 / 44` | 9.376 | 6.949 | 2.068 | 0.94 | 0.80 | `[-0.04, 0.375, 0]` | Ídem 4 `rueda` `[ruedas]` + `acc_techo` (`accesorio`/`estatico`) |
| 5 | `carroceria_muscle` | `coche` | Muscle V8 Drift King | `68 / 44 / 28` | 10.795 | 7.148 | 1.716 | 0.64 | 1.25 | `[-0.1, 0.42, -0.135]` | Ídem 4 `rueda` `[ruedas]` + `acc_techo` (`accesorio`/`estatico`) |
| 6 | `carroceria_buggy` | `coche` | Buggy Dunas Baja | `48 / 38 / 54` | 8.767 | 6.550 | 2.288 | 0.74 | 0.90 | `[-0.04, 0.485, -0.105]` | Ídem 4 `rueda` `[ruedas]` + `acc_techo` (`accesorio`/`estatico`) |
| 7 | `moto_superbike` | `moto` | Superbike Cyber GP | `72 / 46 / 22` | 11.201 | 7.348 | 1.584 | 0.88 | 0.65 | `[-0.04, 0.56, 0]` | `rueda_delantera, rueda_trasera`: `rueda_moto`/`rueda_motriz` `[ruedas_moto]`; `acc_escape`: `accesorio_moto`/`estatico` |
| 8 | `moto_cross` | `moto` | Enduro Dunas XT | `56 / 48 / 36` | 9.578 | 7.547 | 1.892 | 0.78 | 0.75 | `[-0.02, 0.6, 0]` | Ídem `moto_superbike` |
| 9 | `moto_chopper` | `moto` | Chopper V-Twin Custom | `66 / 44 / 30` | 10.592 | 7.148 | 1.760 | 0.80 | 0.90 | `[-0.08, 0.58, 0]` | Ídem `moto_superbike` |
| 10 | `moto_scooter` | `moto` | Scooter Urbano Turbo | `58 / 52 / 30` | 9.781 | 7.946 | 1.760 | 0.86 | 0.62 | `[-0.02, 0.58, 0]` | Ídem `moto_superbike` |
| 11 | `moto_cyber` | `moto` | Cyber-Light Neon GP | `76 / 42 / 22` | 11.606 | 6.949 | 1.584 | 0.90 | 0.72 | `[0, 0.52, 0]` | Ídem `moto_superbike` |
| 12 | `moto_caferacer` | `moto` | Café Racer Vintage 77 | `68 / 42 / 30` | 10.795 | 6.949 | 1.760 | 0.84 | 0.70 | `[-0.04, 0.53, 0]` | Ídem `moto_superbike` |
| 13 | `barco_hidroplano` | `barco` | Hidroplano F1 Nitro | `74 / 42 / 24` | 11.404 | 6.949 | 1.628 | 0.72 | 1.15 | `[-0.06, 0.44, 0]` | `propulsor_popa`: `propulsor_barco`/`helice_z` `[propulsion]`; `timon_popa`: `timon_barco`/`timon_y`; `acc_cubierta`: `accesorio_barco`/`estatico` |
| 14 | `barco_lancha` | `barco` | Lancha Offshore V8 | `62 / 40 / 38` | 10.187 | 6.750 | 1.936 | 0.76 | 1.35 | `[-0.05, 0.48, -0.12]` | Ídem `barco_hidroplano` |
| 15 | `barco_jetski` | `barco` | Jet Ski Wave Runner | `66 / 48 / 26` | 10.592 | 7.547 | 1.672 | 0.82 | 0.85 | `[-0.06, 0.48, 0]` | Ídem `barco_hidroplano` |
| 16 | `barco_hovercraft` | `barco` | Aerodeslizador Vortex | `64 / 42 / 34` | 10.390 | 6.949 | 1.848 | 0.68 | 1.25 | `[0.02, 0.46, 0]` | Ídem `barco_hidroplano` |
| 17 | `barco_galeon` | `barco` | Mini Galeón Pirata Turbo | `58 / 38 / 44` | 9.781 | 6.550 | 2.068 | 0.78 | 1.55 | `[-0.2, 0.54, 0]` | Ídem `barco_hidroplano` |
| 18 | `barco_submarino` | `barco` | Batiscafo Deep Shark | `70 / 38 / 32` | 10.998 | 6.550 | 1.804 | 0.80 | 1.45 | `[0.08, 0.42, 0]` | Ídem `barco_hidroplano` |
| 19 | `avion_acrobatico` | `avion` | Aeroplano Red Baron | `64 / 38 / 38` | 10.390 | 6.550 | 1.936 | 0.86 | 0.85 | `[-0.1, 0.44, 0]` | `alas_principales`: `ala_avion`/`estatico`; `motor_frontal`: `motor_avion`/`helice_z`; `cola_timon`: `cola_avion`/`timon_y` |
| 20 | `avion_jet` | `avion` | Caza Interceptor X | `80 / 40 / 20` | 12.012 | 6.750 | 1.540 | 0.90 | 1.05 | `[0.04, 0.42, 0]` | Ídem `avion_acrobatico` |
| 21 | `avion_steampunk` | `avion` | Biplano Steampunk Brass | `60 / 42 / 38` | 9.984 | 6.949 | 1.936 | 0.84 | 0.95 | `[-0.08, 0.45, 0]` | Ídem `avion_acrobatico` |
| 22 | `avion_stealth` | `avion` | Caza Furtivo Nightwing | `78 / 38 / 24` | 11.809 | 6.550 | 1.628 | 0.88 | 1.00 | `[0.06, 0.4, 0]` | Ídem `avion_acrobatico` |
| 23 | `avion_hidroavion` | `avion` | Hidroavión Explorer | `62 / 40 / 38` | 10.187 | 6.750 | 1.936 | 0.82 | 1.15 | `[0.02, 0.46, 0]` | Ídem `avion_acrobatico` |
| 24 | `avion_espacial` | `avion` | Caza Estelar Nova-X | `82 / 38 / 20` | 12.215 | 6.550 | 1.540 | 0.92 | 1.08 | `[0.06, 0.42, 0]` | Ídem `avion_acrobatico` |

### 4.3 Tabla de las 49 Piezas en `TABLA_PIEZAS` (12 coche, 10 moto, 13 barco, 14 avion)

| # | `id` | Nombre | `categoria` / `tipoEnganche` | `clasesCompatibles` | `esVacio` | `modStats` (`VEL / ACEL / CTRL`) |
| :-: | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `rueda_clasica` | Clásica | `rueda` | `['coche']` | No | `+2 / +2 / +2` |
| 2 | `rueda_todoterreno` | Todoterreno | `rueda` | `['coche']` | No | `-3 / +3 / +6` |
| 3 | `rueda_deportiva` | Deportiva | `rueda` | `['coche']` | No | `+6 / +2 / -3` |
| 4 | `rueda_juguete` | De Juguete | `rueda` | `['coche']` | No | `+1 / +5 / +3` |
| 5 | `rueda_oruga_tank` | Oruga Triangular | `rueda` | `['coche']` | No | `-4 / +5 / +7` |
| 6 | `rueda_dorada_lujo` | Rin Imperial Gold | `rueda` | `['coche']` | No | `+5 / +3 / -2` |
| 7 | `acc_aleron` | Alerón | `accesorio` | `['coche']` | No | `+2 / 0 / +5` |
| 8 | `acc_antena` | Antena | `accesorio` | `['coche']` | No | `+1 / +4 / +2` |
| 9 | `acc_portaequipajes` | Portaequipajes | `accesorio` | `['coche']` | No | `-2 / -1 / +6` |
| 10 | `acc_ninguno` | Ninguno | `accesorio` | `['coche']` | **Sí** | `0 / +2 / 0` |
| 11 | `acc_cohete_techo` | Doble Cohete Nitro | `accesorio` | `['coche']` | No | `+7 / +5 / -4` |
| 12 | `acc_sirena_policia` | Puente Sirena LED | `accesorio` | `['coche']` | No | `+2 / +3 / +3` |
| 13 | `rueda_moto_slick` | Slick GP | `rueda_moto` | `['moto']` | No | `+6 / +2 / -3` |
| 14 | `rueda_moto_tacos` | Tacos Cross | `rueda_moto` | `['moto']` | No | `-3 / +3 / +6` |
| 15 | `rueda_moto_neon` | Aro Neón | `rueda_moto` | `['moto']` | No | `+3 / +4 / +2` |
| 16 | `rueda_moto_radios` | Clásica de Radios | `rueda_moto` | `['moto']` | No | `+2 / +4 / +3` |
| 17 | `rueda_moto_dragster` | Slick Ancha Drag | `rueda_moto` | `['moto']` | No | `+7 / +5 / -5` |
| 18 | `acc_moto_turbina` | Escape Doble | `accesorio_moto` | `['moto']` | No | `+3 / +5 / -1` |
| 19 | `acc_moto_maletin` | Top Case | `accesorio_moto` | `['moto']` | No | `-2 / 0 / +5` |
| 20 | `acc_moto_ninguno` | Ninguno | `accesorio_moto` | `['moto']` | **Sí** | `0 / +2 / 0` |
| 21 | `acc_moto_aleron_gp` | Winglets MotoGP | `accesorio_moto` | `['moto']` | No | `+4 / +2 / +5` |
| 22 | `acc_moto_nitro` | Botellas NOS Duales | `accesorio_moto` | `['moto']` | No | `+6 / +6 / -3` |
| 23 | `prop_helice_bronce` | Hélice Bronce | `propulsor_barco` | `['barco']` | No | `+2 / +3 / +2` |
| 24 | `prop_doble_turbina` | Doble Hidrojet | `propulsor_barco` | `['barco']` | No | `+3 / +5 / +1` |
| 25 | `prop_ventilador_pantano` | Turbina Pantano | `propulsor_barco` | `['barco']` | No | `+6 / -1 / +3` |
| 26 | `prop_reactor_plasma` | Turbina Plasma | `propulsor_barco` | `['barco']` | No | `+8 / +4 / -3` |
| 27 | `prop_rueda_paletas` | Rodillo de Paletas | `propulsor_barco` | `['barco']` | No | `-2 / +6 / +5` |
| 28 | `timon_doble_aleta` | Timón Doble | `timon_barco` | `['barco']` | No | `-1 / +1 / +6` |
| 29 | `timon_competicion` | Timón Carbono | `timon_barco` | `['barco']` | No | `+4 / +2 / +3` |
| 30 | `timon_aleta_tiburon` | Timón Tiburón | `timon_barco` | `['barco']` | No | `+2 / +2 / +6` |
| 31 | `acc_barco_radar` | Arco Radar | `accesorio_barco` | `['barco']` | No | `0 / +2 / +5` |
| 32 | `acc_barco_spoiler` | Alerón Marino | `accesorio_barco` | `['barco']` | No | `+4 / +1 / +3` |
| 33 | `acc_barco_ninguno` | Ninguno | `accesorio_barco` | `['barco']` | **Sí** | `0 / +2 / 0` |
| 34 | `acc_barco_canones` | Batería Pirata | `accesorio_barco` | `['barco']` | No | `+4 / +5 / -2` |
| 35 | `acc_barco_hidrocanon` | Cañón de Agua | `accesorio_barco` | `['barco']` | No | `+3 / +3 / +4` |
| 36 | `ala_recta_acrobatica` | Ala Acrobática | `ala_avion` | `['avion']` | No | `-3 / +3 / +6` |
| 37 | `ala_flecha_jet` | Ala Delta Jet | `ala_avion` | `['avion']` | No | `+6 / +2 / -3` |
| 38 | `ala_biplano_doble` | Ala Biplano | `ala_avion` | `['avion']` | No | `-2 / +4 / +7` |
| 39 | `ala_invertida_x` | Ala Flecha Invertida | `ala_avion` | `['avion']` | No | `+5 / +2 / +6` |
| 40 | `ala_solar_dorada` | Ala Fotovoltaica | `ala_avion` | `['avion']` | No | `+2 / +5 / +5` |
| 41 | `motor_helice_bipala` | Hélice Bipala | `motor_avion` | `['avion']` | No | `+2 / +4 / +2` |
| 42 | `motor_helice_cuatripala` | Hélice Cuatripala | `motor_avion` | `['avion']` | No | `+4 / +3 / +2` |
| 43 | `motor_reactor_postcombustion` | Turbina Reactor | `motor_avion` | `['avion']` | No | `+7 / +5 / -3` |
| 44 | `motor_doble_helice` | Hélice Contrarrotativa | `motor_avion` | `['avion']` | No | `+5 / +6 / +1` |
| 45 | `motor_plasma_ion` | Reactor Iónico | `motor_avion` | `['avion']` | No | `+8 / +5 / -4` |
| 46 | `cola_clasica` | Cola Clásica | `cola_avion` | `['avion']` | No | `+1 / +2 / +4` |
| 47 | `cola_doble_deriva` | Doble Deriva | `cola_avion` | `['avion']` | No | `+3 / +1 / +6` |
| 48 | `cola_v_stealth` | Cola en V Furtiva | `cola_avion` | `['avion']` | No | `+4 / +2 / +4` |
| 49 | `cola_booster_cohete` | Cola con Booster | `cola_avion` | `['avion']` | No | `+6 / +4 / -2` |

---

## 5. Radiografía de los 4 Escenarios y Circuitos (`js/escenario.js` y `js/recursos.js`)

### 5.1 Conteos, Cotas y Topología por Habitación (Inspección en Tiempo de Ejecución)

| Métrica | `habitacion_andy` | `habitacion_acuatica` | `habitacion_atico` | `habitacion_hangar` |
| :--- | :---: | :---: | :---: | :---: |
| **`obstaculosHabitacion`** (muebles/pilares) | 13 | 13 | 11 | 12 |
| **`mallasSuperficieConducible`** (cintas + planos) | 11 (`6` Buffer) | 10 (`6` Buffer) | 10 (`6` Buffer) | 10 (`6` Buffer) |
| **`checkpointsPista`** | 5 (`radioVertical: 0.85`) | 5 (`radioVertical: 0.85`) | 5 (`radioVertical: 0.85`) | 5 (`radioVertical: 11`) |
| **`plataformasTurbo` totales** | **16** (16 suelo/elev., 0 aéreos) | **16** (16 suelo/elev., 0 aéreos) | **16** (16 suelo/elev., 0 aéreos) | **18** (10 suelo/elev., **8 anillos aéreos**) |
| **`obstaculosDinamicos`** | **24** (conos + bloques + muro) | **22** (14 boyas + 8 muro) | **22** (14 barriles + 8 muro) | **22** (14 balizas + 8 muro) |
| **`obstaculosMoviles`** | **10** (barreras en contrafase) | **10** (compuertas oscilantes) | **10** (barreras móviles) | **10** (drones / barreras) |
| **`trampasPista`** | **6** (`aceite`: 6) | **6** (`espuma`: 6) | **6** (`barro`: 6) | **6** (`aceite`: 6) |
| **Vértices de pista (`minY` – `maxY`)** | `0.020 m` – `3.406 m` *(viaducto `Y=2.65`)* | `0.020 m` – `3.440 m` *(acueducto `Y=3.4`)* | `0.020 m` – `4.860 m` *(pasarela `Y=4.2`)* | `0.020 m` – `5.563 m` *(autopista `Y=4.5`, anillos `3.8–13.2`)* |
| **Ancho de calzada (princ. / bifurc. / atajo)** | `4.0 m` / `2.6 m` / `2.8 m` | `4.6 m` / `2.6 m` / `2.8 m` | `4.4 m` / `2.6 m` / `2.8 m` | `5.4 m` / `2.6 m` / `2.8 m` |
| **Peralte máximo** | `0.18 rad` | `0.26 rad` | `0.24 rad` | `0.22 rad` *(alterno ±0.22 en S)* |
| **Bifurcaciones y atajos** | Ruta Alta Norte (`Y=1.85 m`, sin barandas, 2 boosts) + atajo horquilla NO (`crearMuroAtajoDerribable`) + Túnel de Bloques | Canal elevado Oeste (`Y=1.85 m`, sin barandas, 2 boosts) + atajo SE con muro derribable + doble hidro-salto (`Y=1.15 m`) | Pasarela elevada Oeste (`Y=2.1 m`, sin barandas, 2 boosts) + atajo interior Sacacorchos con muro derribable + 4 whoops (`Y=1.15 m`) | Ruta magnética elevada Oeste (`Y=3.2 m`, sin barandas, 2 boosts) + atajo Norte helipuerto con muro derribable + 2 rampas de despegue + 8 anillos zig-zag |

### 5.2 Posición de Checkpoints por Circuito

- **`habitacion_andy`**: `CP0: (24.8, 0.02, -2)` `r=3.4`; `CP1: (8.8, 2.65, -8.8)` `r=3.4`; `CP2: (-27.2, 0.65, -23.2)` `r=3.6`; `CP3: (19.5, 0.02, -31.2)` `r=3.5`; `CP4: (-15.2, 0.02, 4.6)` `r=3.5`.
- **`habitacion_acuatica`**: `CP0: (34, 0.65, 8)` `r=4`; `CP1: (24, 3.4, -16)` `r=4`; `CP2: (-13, 0.12, -31)` `r=4`; `CP3: (-36, 0.4, -7)` `r=4`; `CP4: (-28, 0, 23)` `r=4`.
- **`habitacion_atico`**: `CP0: (35, 4.2, -4)` `r=3.8`; `CP1: (14, 2.3, -23)` `r=3.8`; `CP2: (-17, 1.15, -31)` `r=3.8`; `CP3: (-39, 0.35, -14)` `r=3.8`; `CP4: (-31, 0.05, 22)` `r=3.8`.
- **`habitacion_hangar`**: `CP0: (44, 4.5, 0)` `r=4.6`; `CP1: (4, 2, -24)` `r=4.6`; `CP2: (-24, 2.4, -34)` `r=4.6`; `CP3: (-44, 0.15, -8)` `r=4.6`; `CP4: (-30, 0, 32)` `r=4.6` (todos con `radioVertical: 11`).

### 5.3 Claves de Recursos (`bancoTexturas` y `cacheMiniaturas`)

- **`bancoTexturas` (33 claves)**:
  `maderaDiffuse`, `maderaRoughness`, `maderaBump`, `chispaPolvo`, `discoParticula`, `papelTapiz`, `alfombra`, `asfalto`, `piano`, `meta`, `rodaduraDeportiva`, `rodaduraTodoterreno`, `discoFreno`, `texturaTurboPad`, `posterEspacial`, `posterVaquero`, `posterCarreras`, `posterCorcho`, `cuboA`, `cuboB`, `cuboC`, `pelotaLuxo`, `tablero`, `agua`, `azulejo`, `tierra`, `hangar`, `trampaAceite`, `trampaEspuma`, `trampaBarro`, `postersAcuaticos`, `postersAtico`, `postersHangar`.
- **`cacheMiniaturas` (74 claves pre-renderizadas vía `crearVistaPreviaEscenario` + `Box3`)**:
  - **4 escenarios**: `habitacion_andy`, `habitacion_acuatica`, `habitacion_atico`, `habitacion_hangar`.
  - **24 chasis**: los 24 IDs de `TABLA_CARROCERIAS`.
  - **46 piezas con geometría 3D**: las 49 entradas de `TABLA_PIEZAS` excepto las 3 opciones vacías (`acc_ninguno`, `acc_moto_ninguno`, `acc_barco_ninguno`, que omiten render 3D).

---

## 6. Motor Físico, Controles, Audio e Interfaz (`js/conduccion.js`, `js/audio.js`, `js/partituras.js`, `js/interfaz.js`, `index.html`)

### 6.1 Parámetros de `PERFILES_FISICA` ([`js/conduccion.js`](file:///c:/html_games/js/conduccion.js#L46-L93))

| Clase | `semieje` | `factorRoll` | `factorRollDerrape` | `rollMax` | `superficiesValidas` | `colorChispa` | `bonoWheelieTurbo` | `vuela` (`velDespegue` / `velSustentoMin`) | `flota` |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| `'coche'` | `0.44` | `0.11` | `0.16` | `0.25` | `['pista_asfalto', 'pista_tierra']` | `0xffd166` | `0` | `false` | `false` |
| `'moto'` | `0.36` | `1.15` | `1.35` | `0.48` | `['pista_asfalto', 'pista_tierra']` | `0xffd166` | `0.12` | `false` | `false` |
| `'barco'` | `0.50` | `0.24` | `0.34` | `0.32` | `['agua_navegable', 'pista_asfalto']` | `0x7dd3fc` | `0` | `false` | `true` |
| `'avion'` | `0.46` | `1.88` | `1.9` | `0.68` | `['pista_asfalto', 'agua_navegable']` | `0xe0f2fe` | `0` | `true` (`3.8` / `3.2`) | `false` |

### 6.2 Fórmulas Físicas Activas (`actualizarFisicaConduccion(dt)`, [`js/conduccion.js`](file:///c:/html_games/js/conduccion.js#L406-L865))

- **Velocidad máxima efectiva** (L428, L444–457, L762–774):
  - `velMaxEfectiva = velMaxBase * factorAfinidad * factorPendiente * factorSuperficie * factorTurboVel * factorTrampa`
  - **Turbo / Mini-Turbo**: `factorTurboVel = tiempoTurbo > 0 ? 1.32 : (tiempoMiniTurbo > 0 ? 1.18 : 1.0)`; aceleración multiplicada por `1.35` mientras dura `enTurbo`. Boost Pads fijan `tiempoTurbo = 1.6` e impulsan `velocidad >= velMaxBase * pad.factorImpulso * 0.92`.
  - **Pendiente longitudinal** (`umbral = 0.035 rad` sobre `ultimoPitchTerreno * sentido`): subida `> 0.035` → `factorPendiente = 0.80` (`-20%` velocidad y aceleración); bajada `< -0.035` → `factorPendiente = 1.20` (`+20%` velocidad máxima más empuje gravitatorio `Math.abs(Math.sin(pitch)) * 2.6 * dt`).
  - **Fuera de pista**: cuando `!enAire && !enPistaActual`, `factorSuperficie = 0.70` (`-30%`), `friccion = 2.75` (frente a `1.65` en pista) y `velMaxAtras = -3.432 * factorSuperficiePrev`.
  - **Afinidad de medio (`calcularFactorAfinidadMedio`, L39–44)**: `+6%` (`1.06`) para `barco` sobre `'agua_navegable'` (`!enAire`), `moto` sobre `'pista_tierra'` (`!enAire`), y `avion` volando (`enAire`) dentro de `'habitacion_hangar'`.
- **Trampas de superficie** (L413–423, L452, L579–592, L768):
  - Detectadas cuando `!enAire && distXZ < tr.radio && |y - tr.posicion.y| < 0.85`.
  - `'aceite'` y `'espuma'`: multiplican la alineación lateral de `anguloMovimiento` por `0.42` y perturban guiñada con `yaw += Math.sin(tiempoHidrodinamico * 18.0) * 1.4 * dt` si `|velocidad| > 0.4`.
  - `'barro'`: aplica `factorTrampa = 0.78` (`-22%` a `velMaxAdelante` y `velMaxEfectiva`), **anulado (`1.0`) si `tiempoTurbo > 0 || tiempoMiniTurbo > 0`**.
- **Dirección y Derrape Táctico** (L431, L498–597):
  - Volante máximo `±0.36 rad`; `tasaGiroBase = 3.42`; `duracionMaxDerrape = 0.35 + (stats.control / 60) * 0.55`.
  - Mini-turbo automático al completar `duracionMaxDerrape` (`tiempoMiniTurbo = 0.65`, impulso `velMaxBase * 1.16`) o al soltar con `>= 75%` de carga y `velocidad > 1.5` (`tiempoMiniTurbo = 0.55`, `velMaxBase * 1.12`); enfriamiento post-derrape `0.65s`.
- **Vuelo (`perfil.vuela`, L687–722)**:
  - Con `|velocidad| > 3.8`: ascenso `+4.2 * dt` (`KeyQ` o `ShiftLeft` ya en vuelo), descenso `-4.4 * dt` (`KeyE`, `ControlLeft`, `ControlRight`), tope `altMaxPermitida = max(0.5, limiteTechoY - ySueloObjetivo)`.
  - Por debajo de `velDespegue`, cae a `3.8 * dt` si `|velocidad| < 3.2` (`velSustentoMin`) o planea con caída suave `1.5 * dt`. `fisicaCarro.y = ySueloObjetivo + fisicaCarro.altitudVuelo`.
- **Cronómetro anti-trampas** (`actualizarCronometroYCheckpoints`, L186–274):
  - Exige pasar los 5 checkpoints en orden estricto (`distXZ <= cp.radio && |fisicaCarro.y - cp.y| <= max(cp.radioVertical || 0.85, avion ? 4.5 : 0.85)`) antes de cruzar `meta.xCruce` (`0.0`) avanzando en `+X` dentro de `rangoX * 0.5`.

### 6.3 Mapa Completo de Controles ([`js/interfaz.js`](file:///c:/html_games/js/interfaz.js#L1082-L1228), [`js/conduccion.js`](file:///c:/html_games/js/conduccion.js#L461-L465))

| Entrada | Modo Taller | Modo Conducción |
| :--- | :--- | :--- |
| `W` / `ArrowUp` | (`ArrowUp`) Sube fila activa del menú MK | Acelerar hacia adelante |
| `S` / `ArrowDown` | (`ArrowDown`) Baja fila activa del menú MK | Frenar / Reversa |
| `A` / `ArrowLeft` | (`ArrowLeft`) Opción anterior en ranura MK | Girar izquierda / Alabeo izq. |
| `D` / `ArrowRight` | (`ArrowRight`) Opción siguiente en ranura MK | Girar derecha / Alabeo der. |
| `ShiftLeft` / `ShiftRight` / `Space` | — | Derrapar (`ShiftLeft` también eleva si avión ya está en aire; `Space` previene scroll) |
| `Q` / `E` / `Ctrl` | — | Solo `avion`: `Q` subir altitud, `E`/`Ctrl` descender |
| `T` | Entrar a Modo Conducción | Volver a Modo Taller |
| `V` / `H` | Rotar clase (`coche/moto/barco/avion`) / Habitación | Rotar clase / Habitación |
| `M` / `N` | Silenciar audio / Cambiar pista musical | Silenciar audio / Cambiar pista musical |
| `C` / `R` | — | Alternar cámara 3ª persona↔cabina / Reposicionar en Meta |
| `Escape` | Cerrar modal `#modal-circuitos-mk` | Cerrar modal `#modal-circuitos-mk` |
| Ratón (`pointermove`/`up`, `contextmenu`) | Clic izq. selecciona enganche y abre categoría; clic der. desmonta pieza; arrastre orbita | Cursor libre (sin Pointer Lock) |

### 6.4 DOM Activo en [`index.html`](file:///c:/html_games/index.html#L19-L210) (59 IDs Totales)

- **50 IDs referenciados con `document.getElementById()` en `js/*.js`**:
  - **Barra superior**: `barra-estado`, `btn-habitacion`, `btn-clase-vehiculo`, `btn-audio`, `btn-pista`, `btn-camara`, `btn-alternar-modo`
  - **Lienzo y HUD conducción**: `lienzo-3d`, `hud-conduccion`, `nombre-chasis-hud`, `insignia-estado-hud`, `valor-velocidad`, `altitud-hud`, `tiempo-actual-hud`, `ultima-vuelta-hud`, `mejor-vuelta-hud`, `checkpoints-hud`, `aviso-record-hud`, `guia-vuelo-hud`
  - **Menú Mario Kart izquierdo (`#panel-personalizacion-mk`)**: `selector-clase-mk`, `panel-personalizacion-mk`, `mk-enganche-activo`, `mk-lbl-chasis`, `mk-img-chasis`, `mk-nombre-chasis`, `mk-bono-chasis`, `mk-lbl-primaria`, `mk-img-primaria`, `mk-nombre-primaria`, `mk-bono-primaria`, `mk-lbl-secundaria`, `mk-subranura-tabs`, `mk-img-secundaria`, `mk-nombre-secundaria`, `mk-bono-secundaria`, `mk-grid-colores`, `btn-modo-ruedas`, `btn-quitar`
  - **Panel Estadísticas y Modal de Copas**: `panel-stats-mk`, `nombre-vehiculo-mk`, `insignia-clase-mk`, `barras-stats-mk`, `btn-abrir-copas-mk`, `btn-copas-mk`, `modal-circuitos-mk`, `subtitulo-modal-mk`, `btn-cerrar-modal-mk`, `grid-circuitos-mk`
  - **Bandeja inferior heredada**: `bandeja-inferior`, `contenedor-items`
- **9 IDs adicionales estructurales / de estilo en `index.html`**:
  - `barra-superior`, `controles-modo`, `ranura-mk-chasis`, `ranura-mk-primaria`, `ranura-mk-secundaria`, `ranura-mk-pintura`, `acciones-enganche`, `cabecera-bandeja`, `pestanas`.

### 6.5 Partituras ([`js/partituras.js`](file:///c:/html_games/js/partituras.js)) y Perfiles de Motor ([`js/audio.js`](file:///c:/html_games/js/audio.js))

1. **`CATALOGO_PARTITURAS` (6 temas × 4 canales [`melodia`, `armonia`, `bajo`, `percusion`] × 128 pasos @ subdivisión `4`)**:
   - `taller_juguetes`: *Pit Stop Garage 16-Bit* (`modo: 'taller'`, `118 BPM`)
   - `circuito_kart` *(en `IDS_PISTAS_CONDUCCION`)*: *Grand Prix Juguetes 92* (`modo: 'conduccion'`, `146 BPM`)
   - `autopista_16bit` *(en `IDS_PISTAS_CONDUCCION`)*: *Las Vegas Nitro 16-Bit* (`modo: 'conduccion'`, `150 BPM`)
   - `turbo_apex` *(en `IDS_PISTAS_CONDUCCION`)*: *Super Striker GP* (`modo: 'conduccion'`, `156 BPM`)
   - `ola_snes` *(en `IDS_PISTAS_CONDUCCION`)*: *Wave Splash 16-Bit* (`modo: 'conduccion'`, `148 BPM`)
   - `cielo_snes` *(en `IDS_PISTAS_CONDUCCION`)*: *Star Wing Horizon* (`modo: 'conduccion'`, `154 BPM`)
2. **`PERFILES_MOTOR` (`js/audio.js` L11–120)**:
   - `PERFIL_MOTOR_GRAVE` (`36–92 Hz`, `sawtooth`/`triangle`): `carroceria_muscle`, `carroceria_camioneta`
   - `PERFIL_MOTOR_MEDIO` (`45–120 Hz`, `sawtooth`/`triangle`): `carroceria_sedan`, `carroceria_buggy`, `defecto`
   - `PERFIL_MOTOR_DEPORTIVO` (`58–155 Hz`, `sawtooth`/`triangle`): `carroceria_formula`, `carroceria_deportivo`
   - `PERFIL_MOTOR_MOTO` (`65–195 Hz`, `sawtooth`/`square`, `derrapeFreqBase: 780`, `Q: 3.2`): los 6 chasis `moto_*`
   - `PERFIL_MOTOR_BARCO` (`34–98 Hz`, `modulacionBorboteo: true`, `derrapeFreqBase: 420`): los 6 chasis `barco_*`
   - `PERFIL_MOTOR_AVION` (`48–145 Hz`, `triangle`/`sawtooth`, `derrapeFreqBase: 1050`): los 6 chasis `avion_*`

---

## 7. Resultado de Diagnóstico (`verify_project.mjs`)

### 7.1 Cobertura de Aserciones

- **Sección 1 (L9–45)**: Presencia de 4 CDN de Three.js r128 en `index.html`, ausencia de URLs externas no autorizadas y conteo exacto de 5 URLs GitHub Raw de texturas.
- **Sección 2 (L47–102)**: Validación cruzada de todos los `import`/`export` en los 11 módulos `js/*.js` y detección de ciclos DFS (grafo acíclico).
- **Sección 3 (L104–143)**: Favicon SVG inline, coincidencia en `index.html` de los 50 IDs consultados con `getElementById()` y existencia de los 23 selectores CSS críticos en `css/estilos.css`.
- **Sección 4A–4C (L476–623)**: `camara.near = 0.25`, giro máximo `0.36 rad` / `3.42`, trazado continuo `100% +Y` (`>= 6` mallas top `BufferGeometry`), alineación de los 5 checkpoints, `polygonOffset` en 34 elementos y validación anti-trampas estricta de vuelta/récord en `localStorage`.
- **Sección 4D–4F (L627–803)**: Audio Web API mock (`ctxAudio`, eco SPC700, rotación de 5 pistas), secuencia `CATALOGO_PARTITURAS` (128 pasos), incremento de velocidad base, pendiente `±20%`, penalización `-30%` fuera de pista y nodo `volanteCabina` en interiores 3D.
- **Sección 4G–4I (L806–1265)**: Escalado vertical Fases 1–3 (`CATALOGO_HABITACIONES`, cero fugas GPU en clones `esClonTemporal` al ciclar habitaciones, miniaturas `Box3`, físicas de moto/barco/avión, `+6%` afinidad de medio y anillos aéreos en `habitacion_hangar`).
- **Sección 4J (L1267–1401)**: Parte 1 + Parte 2 (`24` chasis 6×4, `49` piezas con `modStats`, recálculo real en física, UI Mario Kart con `ranura-mk-*`, modal de circuitos y audio de los 24 chasis).
- **Sección 4K (L1403–1560)**: Rediseño integral de las 4 habitaciones (`plataformasTurbo >= 14` o `>= 18` con `>= 8` anillos en Hangar, `obstaculosMoviles >= 10`, `obstaculosDinamicos >= 20`, `trampasPista >= 5`, cota de vértices `maxY >= 2.5 m`, los 5 checkpoints `< 0.75 m` del centro del trazado principal) + pruebas físicas de perturbación lateral en `'aceite'`/`'espuma'` y reducción `0.78x` en `'barro'` anulada bajo turbo.

### 7.2 Salida Textual Verificada de `node generar_mapa.mjs` y `node verify_project.mjs`

```text
MAPA_SIMBOLOS.md generado (11 módulos escaneados).
=== 1. Verificación de archivos, localStorage y URLs externas ===
OK: Three.js r128 en index.html, 5 texturas GitHub Raw autorizadas.
=== 2. Verificación de Exports, Imports y Grafo Acíclico ===
OK: Todas las importaciones/exportaciones coinciden en los 11 módulos y no hay ciclos.
=== 3. Verificación de IDs del DOM, Favicon y Selectores CSS ===
OK: Favicon SVG inline, los 50 IDs getElementById y selectores CSS existen.
=== 4. Verificación funcional: Catálogo, Audio Web API, Geometría Continua, Checkpoints y Cronómetro ===
OK: camara.near = 0.25 y reducción del 20% en dirección (0.36 rad / 3.42) verificados.
OK: Asfalto y pianos continuos (1566 triángulos) 100% +Y y los 5 Checkpoints alineados con el trazado.
OK: 34 elementos de pista tienen polygonOffset (-1, -1) y alturas escalonadas.
OK: Cronómetro anti-trampas OK (ultimaVuelta=00:02.70, HUD CP="CP: 0 / 5", mejorHUD="00:02.70").
OK: js/audio.js (SPC700 echo + 16-bit synth) + js/partituras.js (4x128 pasos @ subdiv=4, rotación: Las Vegas Nitro 16-Bit -> Super Striker GP -> Wave Splash 16-Bit -> Star Wing Horizon -> Grand Prix Juguetes 92) verificados.
OK: 6 chasis (+20% velMax=10.39), interior+volanteCabina, fueraPista=7.27, subida=8.31, bajada=12.47 m/s.
OK: Fase 1 Escalado Vertical (CATALOGO_HABITACIONES, cargarEscenario + GPU cleanup, polimorfismo y rolAnimacion) verificada.
OK: Fase 2 Escalado Vertical (12 chasis, 30 piezas, Miniaturas Box3, Moto/Barco/Avión físicas+audio) verificada.
OK: Fase 3 Escalado Vertical (4 Habitaciones, +6% Afinidad de Medio, Anillos Aéreos y Cero Fugas GPU) verificada.
OK: 4 circuitos rediseñados (cotas >= 2.5m, alta densidad de boosters/obstáculos/móviles y trampas aceite/espuma/barro) verificados.
OK: Parte 1 + Parte 2 (24 chasis 6x4, 49 piezas con modStats, decoración 4 habitaciones y menú Mario Kart) verificadas.
=== VERIFICACIÓN COMPLETA EXITOSA ===
```
