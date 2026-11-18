# Mapa de Símbolos (`js/*.js`)

> Generado automáticamente con `node generar_mapa.mjs`. No editar a mano; volver a ejecutar el script tras modificar cualquier módulo.

## Resumen de Módulos

| Módulo | Líneas | Exportaciones clave |
| :--- | ---: | :--- |
| `js/audio.js` | 743 | `inicializarAudioInteractivo` (L410), `alternarSilencio` (L425), `cambiarModoMusical` (L442), `actualizarAudioMotor` (L458), `actualizarAudioDerrape` (L496), `reproducirTurbo` (L521), `reproducirImpacto` (L535), `reproducirCheckpoint` (L577), `reproducirMeta` (L587), `reproducirEncajePieza` (L615), `reproducirQuitarPieza` (L623), `reproducirCambioColor` (L630), `seleccionarPistaMusicalPorId` (L637), `cambiarPistaConduccion` (L652), `actualizarMusicaAmbiental` (L668) |
| `js/catalogoPiezas.js` | 3762 | `crearMaterialPintura` (L12), `crearMaterialCristalCabina` (L27), `agregarDetallesCarroceria` (L43), `crearInteriorDetallado` (L73), `TABLA_CARROCERIAS` (L510), `TABLA_PIEZAS` (L2357), `obtenerAtributosFinalesVehiculo` (L3695) |
| `js/conduccion.js` | 1113 | `PERFILES_FISICA` (L49), `formatearTiempoMMSS` (L101), `actualizarHUDCronometro` (L140), `reiniciarCronometroVuelta` (L175), `obtenerInfoSuperficieEnPunto` (L325), `obtenerAlturaSuperficieEnPunto` (L354), `reposicionarEnMeta` (L361), `actualizarFisicaConduccion` (L428), `actualizarObstaculos` (L977), `actualizarCamaraConduccion` (L1084) |
| `js/config.js` | 29 | `URL_WS_PRODUCCION` (L1), `URL_WS_LOCAL` (L2), `TASA_ENVIO_HZ` (L3), `resolverUrlWebSocket` (L8), `CONFIG_RED` (L20) |
| `js/constantes.js` | 78 | `CLASES_VEHICULO` (L1), `TOPE_STAT_UI` (L2), `IDS_HABITACIONES` (L3), `CATALOGO_HABITACIONES` (L10), `HABITACION_ANCHO` (L54), `HABITACION_LARGO` (L55), `HABITACION_ALTO` (L56), `ALFOMBRA_RADIO` (L57), `CANTIDAD_POLVO` (L58), `URLS_TEXTURAS` (L60), `PALETA_COLORES` (L68) |
| `js/enganches.js` | 406 | `grupoJuguete` (L14), `dispararChispasEnEnganche` (L25), `animarSalidaYLiberar` (L65), `animarEntradaElastica` (L101), `colocarPiezaEnEnganche` (L130), `ensamblarGrupoVehiculo` (L188), `destruirVehiculoRemoto` (L299), `construirOActualizarCarroceria` (L320) |
| `js/escenario.js` | 3328 | `lienzo` (L29), `escena` (L30), `grupoEscenarioActivo` (L33), `camara` (L36), `renderizador` (L44), `controles` (L62), `sistemaPolvo` (L81), `crearIluminacion` (L87), `construirHabitacionExpandida` (L322), `construirPistaDeCarreras` (L1425), `construirEscenarioAcuatico` (L1983), `construirEscenarioAtico` (L2418), `construirEscenarioHangar` (L2813), `crearHazYPolvoVentana` (L3221), `cargarEscenario` (L3273) |
| `js/estado.js` | 189 | `estadoCarro` (L11), `fisicaCarro` (L70), `teclasConduccion` (L92), `nodosEnganches` (L94), `listaColisionadoresEnganches` (L95), `animacionesActivas` (L96), `chorrosChispasActivos` (L97), `mallasSuperficieConducible` (L100), `obstaculosHabitacion` (L102), `plataformasTurbo` (L105), `obstaculosDinamicos` (L106), `obstaculosMoviles` (L107), `trampasPista` (L108), `obtenerClaveRecord` (L115), `estadoCronometro` (L149), `checkpointsPista` (L163), `estadoRed` (L166), `jugadoresRemotos` (L176), `entradaTactil` (L179) |
| `js/interfaz.js` | 1853 | `limpiarEntradasTactiles` (L182), `detectarDispositivoTactil` (L201), `actualizarVisibilidadControlesTactiles` (L217), `alternarControlesTactiles` (L238), `actualizarPanelMultijugador` (L265), `actualizarEtiquetasYLeaderboard` (L328), `generarMiniaturasCatalogo` (L454), `actualizarPanelesMarioKart` (L637), `ciclarOpcionRanuraMK` (L804), `abrirModalCircuitosMK` (L850), `cerrarModalCircuitosMK` (L921), `cambiarClaseVehiculo` (L930), `cambiarHabitacion` (L999), `actualizarTextoEstado` (L1065), `alternarModoTallerConduccion` (L1095), `alternarCamaraConduccion` (L1192), `renderizarBandeja` (L1203), `configurarEventosInteraccion` (L1331) |
| `js/main.js` | 185 | — (punto de entrada) |
| `js/partituras.js` | 508 | `notaAFrecuencia` (L16), `IDS_PISTAS_CONDUCCION` (L41), `CATALOGO_PARTITURAS` (L49) |
| `js/recursos.js` | 1498 | `cargadorTexturas` (L3), `bancoTexturas` (L6), `cacheMiniaturas` (L7), `crearCajaRedondeada` (L13), `liberarObjeto3D` (L57), `crearRespaldoMaderaCanvas` (L76), `crearRespaldoSpriteCanvas` (L116), `cargarTexturaSegura` (L134), `crearTexturaPapelTapiz` (L155), `crearTexturaAlfombra` (L212), `crearTexturaPistaAsfalto` (L250), `crearTexturaPianoCurva` (L287), `crearTexturaMetaCuadros` (L307), `crearTexturaBandaRodadura` (L330), `crearTexturaDiscoFreno` (L415), `crearTexturaTurboPad` (L496), `crearTexturaPosterPared` (L572), `crearTexturaLetraCubo` (L919), `crearTexturaPelotaLuxo` (L953), `crearTexturaTablero` (L981), `crearTexturaAgua` (L1101), `crearTexturaAzulejoPiscina` (L1136), `crearTexturaTierraCompactada` (L1169), `crearTexturaPisoHangar` (L1198), `crearVistaPreviaEscenario` (L1229), `crearTexturaTrampa` (L1353), `inicializarRecursos` (L1414) |
| `js/red.js` | 533 | `obtenerAparienciaLocal` (L265), `crearSalaOnline` (L277), `unirseSalaOnline` (L295), `salirDeSala` (L314), `enviarApariencia` (L337), `notificarCambioHabitacion` (L349), `procesarMensajeRed` (L360), `actualizarRed` (L464) |

---
## `js/audio.js` (743 líneas)

### Imports
- **L3** desde `./partituras.js`: notaAFrecuencia, CATALOGO_PARTITURAS, IDS_PISTAS_CONDUCCION

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 410 | `function` | `inicializarAudioInteractivo` | `inicializarAudioInteractivo()` |
| 425 | `function` | `alternarSilencio` | `alternarSilencio()` |
| 442 | `function` | `cambiarModoMusical` | `cambiarModoMusical(modo)` |
| 458 | `function` | `actualizarAudioMotor` | `actualizarAudioMotor(velocidad, velMax, idCarroceria, enAire)` |
| 496 | `function` | `actualizarAudioDerrape` | `actualizarAudioDerrape(enDerrape, ratioVelocidad, idCarroceria = '')` |
| 521 | `function` | `reproducirTurbo` | `reproducirTurbo(esPlataforma = false)` |
| 535 | `function` | `reproducirImpacto` | `reproducirImpacto(intensidad = 0.6, tipo = 'obstaculo')` |
| 577 | `function` | `reproducirCheckpoint` | `reproducirCheckpoint(indice)` |
| 587 | `function` | `reproducirMeta` | `reproducirMeta(esRecord = false)` |
| 615 | `function` | `reproducirEncajePieza` | `reproducirEncajePieza()` |
| 623 | `function` | `reproducirQuitarPieza` | `reproducirQuitarPieza()` |
| 630 | `function` | `reproducirCambioColor` | `reproducirCambioColor()` |
| 637 | `function` | `seleccionarPistaMusicalPorId` | `seleccionarPistaMusicalPorId(idPista)` |
| 652 | `function` | `cambiarPistaConduccion` | `cambiarPistaConduccion()` |
| 668 | `function` | `actualizarMusicaAmbiental` | `actualizarMusicaAmbiental(dt, modoJuego, enTurboBoost = false)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 9 | `const` | `GANANCIA_MAESTRA` | `GANANCIA_MAESTRA` |
| 11 | `const` | `PERFIL_MOTOR_GRAVE` | `PERFIL_MOTOR_GRAVE` |
| 23 | `const` | `PERFIL_MOTOR_MEDIO` | `PERFIL_MOTOR_MEDIO` |
| 35 | `const` | `PERFIL_MOTOR_DEPORTIVO` | `PERFIL_MOTOR_DEPORTIVO` |
| 47 | `const` | `PERFIL_MOTOR_MOTO` | `PERFIL_MOTOR_MOTO` |
| 63 | `const` | `PERFIL_MOTOR_BARCO` | `PERFIL_MOTOR_BARCO` |
| 79 | `const` | `PERFIL_MOTOR_AVION` | `PERFIL_MOTOR_AVION` |
| 94 | `const` | `PERFILES_MOTOR` | `PERFILES_MOTOR` |
| 123 | `const` | `NOTAS_CHECKPOINTS` | `NOTAS_CHECKPOINTS` |
| 125 | `let` | `ctxAudio` | `ctxAudio` |
| 126 | `let` | `gainMaestro` | `gainMaestro` |
| 127 | `let` | `bufferRuidoBlanco` | `bufferRuidoBlanco` |
| 128 | `let` | `delayMusica` | `delayMusica` |
| 129 | `let` | `feedbackEco` | `feedbackEco` |
| 130 | `let` | `filtroEco` | `filtroEco` |
| 131 | `let` | `envioEcoMusica` | `envioEcoMusica` |
| 134 | `let` | `oscMotor1` | `oscMotor1` |
| 135 | `let` | `oscMotor2` | `oscMotor2` |
| 136 | `let` | `filtroMotor` | `filtroMotor` |
| 137 | `let` | `gainMotor` | `gainMotor` |
| 139 | `let` | `fuenteDerrape` | `fuenteDerrape` |
| 140 | `let` | `filtroDerrape` | `filtroDerrape` |
| 141 | `let` | `gainDerrape` | `gainDerrape` |
| 143 | `let` | `silenciado` | `silenciado` |
| 144 | `let` | `modoMusicaActual` | `modoMusicaActual` |
| 145 | `let` | `indicePistaConduccion` | `indicePistaConduccion` |
| 146 | `let` | `acumuladorSecuencia` | `acumuladorSecuencia` |
| 147 | `let` | `pasoSecuencia` | `pasoSecuencia` |
| 148 | `let` | `ultimoImpactoTs` | `ultimoImpactoTs` |
| 149 | `let` | `ultimoChasisMotor` | `ultimoChasisMotor` |
| 150 | `let` | `listenersRegistrados` | `listenersRegistrados` |
| 155 | `function` | `crearBufferRuido` | `crearBufferRuido(ctx)` |
| 168 | `function` | `desbloquearAudio` | `desbloquearAudio()` |
| 248 | `function` | `audioDisponible` | `audioDisponible()` |
| 353 | `function` | `dispararRuidoPercusion` | `dispararRuidoPercusion(tipoFiltro, freq, Q, duracion, volumen, t0)` |
| 379 | `function` | `reproducirPercusionSecuenciador` | `reproducirPercusionSecuenciador(simbolo)` |

---
## `js/catalogoPiezas.js` (3762 líneas)

### Imports
- **L1** desde `./recursos.js`: crearCajaRedondeada, crearTexturaBandaRodadura, crearTexturaDiscoFreno, crearTexturaTablero

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 12 | `function` | `crearMaterialPintura` | `crearMaterialPintura(colorHex)` |
| 27 | `function` | `crearMaterialCristalCabina` | `crearMaterialCristalCabina()` |
| 43 | `function` | `agregarDetallesCarroceria` | `agregarDetallesCarroceria(grupo, largoX, altoY, anchoZ)` |
| 73 | `function` | `crearInteriorDetallado` | `crearInteriorDetallado(config)` |
| 510 | `const` | `TABLA_CARROCERIAS` | `TABLA_CARROCERIAS` |
| 2357 | `const` | `TABLA_PIEZAS` | `TABLA_PIEZAS` |
| 3695 | `function` | `obtenerAtributosFinalesVehiculo` | `obtenerAtributosFinalesVehiculo(estado = null)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 334 | `function` | `agregarDiscoYMordaza` | `agregarDiscoYMordaza(grupo, radioDisco = 0.088)` |
| 366 | `function` | `crearMaterialCaucho` | `crearMaterialCaucho(estilo = 'deportiva', colorHex = 0x1a1e26)` |
| 381 | `function` | `crearAtributosChasis` | `crearAtributosChasis(velocidad, aceleracion, control, agarreDerrape, pesoImpacto)` |
| 395 | `function` | `crearConsolaMandoVehiculo` | `crearConsolaMandoVehiculo(tipo, posMando, colorHex = 0xff1e27)` |
| 462 | `function` | `crearMallaRuedaMoto` | `crearMallaRuedaMoto(radio, grosor, estiloCaucho, colorRin, conNeon = false)` |

### Entradas de Catálogo
| Línea | Tabla | ID | Nombre |
| ---: | :--- | :--- | :--- |
| 512 | `TABLA_CARROCERIAS` | `carroceria_sedan` | Sedán GT Turbo |
| 614 | `TABLA_CARROCERIAS` | `carroceria_camioneta` | Camioneta Raptor Sport |
| 741 | `TABLA_CARROCERIAS` | `carroceria_deportivo` | Hiperdeportivo Le Mans |
| 856 | `TABLA_CARROCERIAS` | `carroceria_formula` | Monoplaza Fórmula Apex |
| 1003 | `TABLA_CARROCERIAS` | `carroceria_muscle` | Muscle V8 Drift King |
| 1120 | `TABLA_CARROCERIAS` | `carroceria_buggy` | Buggy Dunas Baja |
| 1239 | `TABLA_CARROCERIAS` | `moto_superbike` | Superbike Cyber GP |
| 1311 | `TABLA_CARROCERIAS` | `moto_cross` | Enduro Dunas XT |
| 1377 | `TABLA_CARROCERIAS` | `moto_chopper` | Chopper V-Twin Custom |
| 1447 | `TABLA_CARROCERIAS` | `moto_scooter` | Scooter Urbano Turbo |
| 1513 | `TABLA_CARROCERIAS` | `moto_cyber` | Cyber-Light Neon GP |
| 1567 | `TABLA_CARROCERIAS` | `moto_caferacer` | Café Racer Vintage 77 |
| 1635 | `TABLA_CARROCERIAS` | `barco_hidroplano` | Hidroplano F1 Nitro |
| 1698 | `TABLA_CARROCERIAS` | `barco_lancha` | Lancha Offshore V8 |
| 1753 | `TABLA_CARROCERIAS` | `barco_jetski` | Jet Ski Wave Runner |
| 1810 | `TABLA_CARROCERIAS` | `barco_hovercraft` | Aerodeslizador Vortex |
| 1867 | `TABLA_CARROCERIAS` | `barco_galeon` | Mini Galeón Pirata Turbo |
| 1927 | `TABLA_CARROCERIAS` | `barco_submarino` | Batiscafo Deep Shark |
| 1986 | `TABLA_CARROCERIAS` | `avion_acrobatico` | Aeroplano Red Baron |
| 2049 | `TABLA_CARROCERIAS` | `avion_jet` | Caza Interceptor X |
| 2110 | `TABLA_CARROCERIAS` | `avion_steampunk` | Biplano Steampunk Brass |
| 2182 | `TABLA_CARROCERIAS` | `avion_stealth` | Caza Furtivo Nightwing |
| 2241 | `TABLA_CARROCERIAS` | `avion_hidroavion` | Hidroavión Explorer |
| 2299 | `TABLA_CARROCERIAS` | `avion_espacial` | Caza Estelar Nova-X |
| 2359 | `TABLA_PIEZAS` | `rueda_clasica` | Clásica |
| 2415 | `TABLA_PIEZAS` | `rueda_todoterreno` | Todoterreno |
| 2484 | `TABLA_PIEZAS` | `rueda_deportiva` | Deportiva |
| 2536 | `TABLA_PIEZAS` | `rueda_juguete` | De Juguete |
| 2591 | `TABLA_PIEZAS` | `acc_aleron` | Alerón |
| 2625 | `TABLA_PIEZAS` | `acc_antena` | Antena |
| 2654 | `TABLA_PIEZAS` | `acc_portaequipajes` | Portaequipajes |
| 2687 | `TABLA_PIEZAS` | `acc_ninguno` | Ninguno |
| 2699 | `TABLA_PIEZAS` | `rueda_oruga_tank` | Oruga Triangular |
| 2743 | `TABLA_PIEZAS` | `rueda_dorada_lujo` | Rin Imperial Gold |
| 2784 | `TABLA_PIEZAS` | `acc_cohete_techo` | Doble Cohete Nitro |
| 2821 | `TABLA_PIEZAS` | `acc_sirena_policia` | Puente Sirena LED |
| 2848 | `TABLA_PIEZAS` | `rueda_moto_slick` | Slick GP |
| 2859 | `TABLA_PIEZAS` | `rueda_moto_tacos` | Tacos Cross |
| 2880 | `TABLA_PIEZAS` | `rueda_moto_neon` | Aro Neón |
| 2891 | `TABLA_PIEZAS` | `acc_moto_turbina` | Escape Doble |
| 2914 | `TABLA_PIEZAS` | `acc_moto_maletin` | Top Case |
| 2934 | `TABLA_PIEZAS` | `acc_moto_ninguno` | Ninguno |
| 2946 | `TABLA_PIEZAS` | `rueda_moto_radios` | Clásica de Radios |
| 2981 | `TABLA_PIEZAS` | `rueda_moto_dragster` | Slick Ancha Drag |
| 3015 | `TABLA_PIEZAS` | `acc_moto_aleron_gp` | Winglets MotoGP |
| 3043 | `TABLA_PIEZAS` | `acc_moto_nitro` | Botellas NOS Duales |
| 3071 | `TABLA_PIEZAS` | `prop_helice_bronce` | Hélice Bronce |
| 3095 | `TABLA_PIEZAS` | `prop_doble_turbina` | Doble Hidrojet |
| 3118 | `TABLA_PIEZAS` | `prop_ventilador_pantano` | Turbina Pantano |
| 3142 | `TABLA_PIEZAS` | `timon_doble_aleta` | Timón Doble |
| 3162 | `TABLA_PIEZAS` | `timon_competicion` | Timón Carbono |
| 3181 | `TABLA_PIEZAS` | `acc_barco_radar` | Arco Radar |
| 3205 | `TABLA_PIEZAS` | `acc_barco_spoiler` | Alerón Marino |
| 3228 | `TABLA_PIEZAS` | `acc_barco_ninguno` | Ninguno |
| 3240 | `TABLA_PIEZAS` | `prop_reactor_plasma` | Turbina Plasma |
| 3264 | `TABLA_PIEZAS` | `prop_rueda_paletas` | Rodillo de Paletas |
| 3294 | `TABLA_PIEZAS` | `timon_aleta_tiburon` | Timón Tiburón |
| 3315 | `TABLA_PIEZAS` | `acc_barco_canones` | Batería Pirata |
| 3341 | `TABLA_PIEZAS` | `acc_barco_hidrocanon` | Cañón de Agua |
| 3367 | `TABLA_PIEZAS` | `ala_recta_acrobatica` | Ala Acrobática |
| 3389 | `TABLA_PIEZAS` | `ala_flecha_jet` | Ala Delta Jet |
| 3413 | `TABLA_PIEZAS` | `ala_biplano_doble` | Ala Biplano |
| 3438 | `TABLA_PIEZAS` | `motor_helice_bipala` | Hélice Bipala |
| 3457 | `TABLA_PIEZAS` | `motor_helice_cuatripala` | Hélice Cuatripala |
| 3476 | `TABLA_PIEZAS` | `motor_reactor_postcombustion` | Turbina Reactor |
| 3500 | `TABLA_PIEZAS` | `cola_clasica` | Cola Clásica |
| 3519 | `TABLA_PIEZAS` | `cola_doble_deriva` | Doble Deriva |
| 3542 | `TABLA_PIEZAS` | `ala_invertida_x` | Ala Flecha Invertida |
| 3565 | `TABLA_PIEZAS` | `ala_solar_dorada` | Ala Fotovoltaica |
| 3587 | `TABLA_PIEZAS` | `motor_doble_helice` | Hélice Contrarrotativa |
| 3619 | `TABLA_PIEZAS` | `motor_plasma_ion` | Reactor Iónico |
| 3640 | `TABLA_PIEZAS` | `cola_v_stealth` | Cola en V Furtiva |
| 3664 | `TABLA_PIEZAS` | `cola_booster_cohete` | Cola con Booster |

---
## `js/conduccion.js` (1113 líneas)

### Imports
- **L1** desde `./constantes.js`: CATALOGO_HABITACIONES
- **L2** desde `./estado.js`: estadoCarro, fisicaCarro, teclasConduccion, mallasSuperficieConducible, obstaculosHabitacion, nodosEnganches, plataformasTurbo, obstaculosDinamicos, obstaculosMoviles, trampasPista, estadoCronometro, checkpointsPista, obtenerClaveRecord, estadoRed, jugadoresRemotos, entradaTactil
- **L20** desde `./escenario.js`: camara, controles
- **L21** desde `./catalogoPiezas.js`: TABLA_CARROCERIAS, obtenerAtributosFinalesVehiculo
- **L22** desde `./enganches.js`: grupoJuguete, dispararChispasEnEnganche
- **L23** desde `./audio.js`: actualizarAudioMotor, actualizarAudioDerrape, reproducirTurbo, reproducirImpacto, reproducirCheckpoint, reproducirMeta

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 49 | `const` | `PERFILES_FISICA` | `PERFILES_FISICA` |
| 101 | `function` | `formatearTiempoMMSS` | `formatearTiempoMMSS(segundos)` |
| 140 | `function` | `actualizarHUDCronometro` | `actualizarHUDCronometro()` |
| 175 | `function` | `reiniciarCronometroVuelta` | `reiniciarCronometroVuelta(activar = false)` |
| 325 | `function` | `obtenerInfoSuperficieEnPunto` | `obtenerInfoSuperficieEnPunto(x, z, alturaReferencia)` |
| 354 | `function` | `obtenerAlturaSuperficieEnPunto` | `obtenerAlturaSuperficieEnPunto(x, z, alturaReferencia)` |
| 361 | `function` | `reposicionarEnMeta` | `reposicionarEnMeta()` |
| 428 | `function` | `actualizarFisicaConduccion` | `actualizarFisicaConduccion(dt)` |
| 977 | `function` | `actualizarObstaculos` | `actualizarObstaculos(dt, tiempoTotal)` |
| 1084 | `function` | `actualizarCamaraConduccion` | `actualizarCamaraConduccion(dt)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 32 | `const` | `raycasterSuelo` | `raycasterSuelo` |
| 33 | `const` | `vectorAbajo` | `vectorAbajo` |
| 34 | `let` | `acumuladorChispasDerrape` | `acumuladorChispasDerrape` |
| 35 | `let` | `enPistaActual` | `enPistaActual` |
| 36 | `let` | `tipoSuperficieActual` | `tipoSuperficieActual` |
| 37 | `let` | `temporizadorVibracionAudio` | `temporizadorVibracionAudio` |
| 38 | `let` | `ultimoPitchTerreno` | `ultimoPitchTerreno` |
| 39 | `let` | `tiempoHidrodinamico` | `tiempoHidrodinamico` |
| 40 | `let` | `tipoTrampaActiva` | `tipoTrampaActiva` |
| 42 | `function` | `calcularFactorAfinidadMedio` | `calcularFactorAfinidadMedio(claseVehiculo, tipoSuperficie, enAire, idHabitacion)` |
| 121 | `function` | `reiniciarLucesCheckpoints` | `reiniciarLucesCheckpoints()` |
| 189 | `function` | `actualizarCronometroYCheckpoints` | `actualizarCronometroYCheckpoints(dt, xAnterior)` |
| 283 | `function` | `diferenciaAngular` | `diferenciaAngular(objetivo, actual)` |
| 290 | `function` | `actualizarInsigniaEstadoHUD` | `actualizarInsigniaEstadoHUD()` |
| 312 | `function` | `cancelarDerrapePorChoque` | `cancelarDerrapePorChoque()` |

---
## `js/config.js` (29 líneas)

### Imports
- Sin imports locales.

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 1 | `const` | `URL_WS_PRODUCCION` | `URL_WS_PRODUCCION` |
| 2 | `const` | `URL_WS_LOCAL` | `URL_WS_LOCAL` |
| 3 | `const` | `TASA_ENVIO_HZ` | `TASA_ENVIO_HZ` |
| 8 | `function` | `resolverUrlWebSocket` | `resolverUrlWebSocket(hostname)` |
| 20 | `const` | `CONFIG_RED` | `CONFIG_RED` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 16 | `const` | `esEntornoLocalInicial` | `esEntornoLocalInicial` |

---
## `js/constantes.js` (78 líneas)

### Imports
- Sin imports locales.

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 1 | `const` | `CLASES_VEHICULO` | `CLASES_VEHICULO` |
| 2 | `const` | `TOPE_STAT_UI` | `TOPE_STAT_UI` |
| 3 | `const` | `IDS_HABITACIONES` | `IDS_HABITACIONES` |
| 10 | `const` | `CATALOGO_HABITACIONES` | `CATALOGO_HABITACIONES` |
| 54 | `const` | `HABITACION_ANCHO` | `HABITACION_ANCHO` |
| 55 | `const` | `HABITACION_LARGO` | `HABITACION_LARGO` |
| 56 | `const` | `HABITACION_ALTO` | `HABITACION_ALTO` |
| 57 | `const` | `ALFOMBRA_RADIO` | `ALFOMBRA_RADIO` |
| 58 | `const` | `CANTIDAD_POLVO` | `CANTIDAD_POLVO` |
| 60 | `const` | `URLS_TEXTURAS` | `URLS_TEXTURAS` |
| 68 | `const` | `PALETA_COLORES` | `PALETA_COLORES` |

---
## `js/enganches.js` (406 líneas)

### Imports
- **L1** desde `./recursos.js`: bancoTexturas, liberarObjeto3D
- **L2** desde `./escenario.js`: escena
- **L3** desde `./catalogoPiezas.js`: TABLA_CARROCERIAS, TABLA_PIEZAS
- **L4** desde `./estado.js`: estadoCarro, nodosEnganches, listaColisionadoresEnganches, animacionesActivas, chorrosChispasActivos, jugadoresRemotos
- **L12** desde `./audio.js`: reproducirEncajePieza, reproducirQuitarPieza

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 14 | `const` | `grupoJuguete` | `grupoJuguete` |
| 25 | `function` | `dispararChispasEnEnganche` | `dispararChispasEnEnganche(posicionMundo, colorHex = 0xffd166)` |
| 65 | `function` | `animarSalidaYLiberar` | `animarSalidaYLiberar(mallaSaliente, grupoPadre)` |
| 101 | `function` | `animarEntradaElastica` | `animarEntradaElastica(objeto, escalaObjetivo)` |
| 130 | `function` | `colocarPiezaEnEnganche` | `colocarPiezaEnEnganche(idEnganche, idPieza, conEfectos = true)` |
| 188 | `function` | `ensamblarGrupoVehiculo` | `ensamblarGrupoVehiculo(config = {})` |
| 299 | `function` | `destruirVehiculoRemoto` | `destruirVehiculoRemoto(id)` |
| 320 | `function` | `construirOActualizarCarroceria` | `construirOActualizarCarroceria(idNuevaCarroceria, conEfectos = true, esCambioColor = false)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 19 | `let` | `mallaCarroceriaActual` | `mallaCarroceriaActual` |
| 114 | `function` | `sincronizarConfiguracionClase` | `sincronizarConfiguracionClase()` |

---
## `js/escenario.js` (3328 líneas)

### Imports
- **L1** desde `./constantes.js`: HABITACION_ANCHO, HABITACION_LARGO, HABITACION_ALTO, ALFOMBRA_RADIO, CANTIDAD_POLVO, CATALOGO_HABITACIONES
- **L9** desde `./recursos.js`: bancoTexturas, liberarObjeto3D, crearCajaRedondeada, crearTexturaPosterPared, crearTexturaLetraCubo, crearTexturaPelotaLuxo
- **L17** desde `./estado.js`: estadoCarro, estadoCronometro, mallasSuperficieConducible, obstaculosHabitacion, plataformasTurbo, obstaculosDinamicos, obstaculosMoviles, trampasPista, checkpointsPista

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 29 | `const` | `lienzo` | `lienzo` |
| 30 | `const` | `escena` | `escena` |
| 33 | `const` | `grupoEscenarioActivo` | `grupoEscenarioActivo` |
| 36 | `const` | `camara` | `camara` |
| 44 | `const` | `renderizador` | `renderizador` |
| 62 | `const` | `controles` | `controles` |
| 81 | `let` | `sistemaPolvo` | `sistemaPolvo` |
| 87 | `function` | `crearIluminacion` | `crearIluminacion(contenedor = grupoEscenarioActivo, hab = CATALOGO_HABITACIONES.habitacion_andy)` |
| 322 | `function` | `construirHabitacionExpandida` | `construirHabitacionExpandida(contenedor = grupoEscenarioActivo)` |
| 1425 | `function` | `construirPistaDeCarreras` | `construirPistaDeCarreras(contenedor = grupoEscenarioActivo)` |
| 1983 | `function` | `construirEscenarioAcuatico` | `construirEscenarioAcuatico(contenedor = grupoEscenarioActivo)` |
| 2418 | `function` | `construirEscenarioAtico` | `construirEscenarioAtico(contenedor = grupoEscenarioActivo)` |
| 2813 | `function` | `construirEscenarioHangar` | `construirEscenarioHangar(contenedor = grupoEscenarioActivo)` |
| 3221 | `function` | `crearHazYPolvoVentana` | `crearHazYPolvoVentana(contenedor = grupoEscenarioActivo, hab = CATALOGO_HABITACIONES.habitacion_andy)` |
| 3273 | `function` | `cargarEscenario` | `cargarEscenario(idHabitacion = estadoCarro.idHabitacion)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 131 | `function` | `crearMaterialClonTextura` | `crearMaterialClonTextura(texBase, opciones = {}, repX = 1, repY = 1)` |
| 139 | `function` | `interpolarSegmentoCatmull` | `interpolarSegmentoCatmull(p0, p1, p2, p3, pasos)` |
| 163 | `function` | `subdividirCurvaSuave` | `subdividirCurvaSuave(puntos, guiaAntes, guiaDespues, pasosPorTramo = 6)` |
| 176 | `function` | `crearArcoCheckpointEnGrupo` | `crearArcoCheckpointEnGrupo(grupoPista, defCP, anchoPorDefecto = 4.0)` |
| 272 | `function` | `crearBoostPadsEnGrupo` | `crearBoostPadsEnGrupo(grupoPista, defsTurbo)` |
| 699 | `function` | `crearCintaPistaDesdeNodos` | `crearCintaPistaDesdeNodos(grupoPista, nodos, config)` |
| 1046 | `function` | `crearRecintoHabitacionBase` | `crearRecintoHabitacionBase(grupoHab, hab, opts)` |
| 1213 | `function` | `crearMetaYEnlaceTallerEnGrupo` | `crearMetaYEnlaceTallerEnGrupo(grupoPista, metaZ, anchoPista, tipoSuperficie, colorPoste, matEnlace)` |
| 1266 | `function` | `registrarObstaculoDinamico` | `registrarObstaculoDinamico(grupoPista, malla, x, y, z, radio = 0.34)` |
| 1281 | `function` | `crearBarreraMovilTematica` | `crearBarreraMovilTematica(grupoPista, x, y, z, ejeX, ejeZ, fase, color1 = 0xff1e27, color2 = 0xf8fafc)` |
| 1311 | `function` | `crearTramoBifurcacionElevada` | `crearTramoBifurcacionElevada(grupoPista, puntosControl, config)` |
| 1361 | `function` | `crearTrampasEnGrupo` | `crearTrampasEnGrupo(grupoPista, defsTrampas)` |
| 1398 | `function` | `crearMuroAtajoDerribable` | `crearMuroAtajoDerribable(grupoPista, cx, baseY, cz, perpX, perpZ, colores = [0xff1e27, 0xffdd00, 0x00f0ff, 0x22c55e])` |
| 1952 | `function` | `generarNodosCircuitoCerrado` | `generarNodosCircuitoCerrado(tramosCtrl, anchoDefecto, opcionesPorTramo = null)` |

---
## `js/estado.js` (189 líneas)

### Imports
- **L1** desde `./constantes.js`: PALETA_COLORES

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 11 | `const` | `estadoCarro` | `estadoCarro` |
| 70 | `const` | `fisicaCarro` | `fisicaCarro` |
| 92 | `const` | `teclasConduccion` | `teclasConduccion` |
| 94 | `const` | `nodosEnganches` | `nodosEnganches` |
| 95 | `const` | `listaColisionadoresEnganches` | `listaColisionadoresEnganches` |
| 96 | `const` | `animacionesActivas` | `animacionesActivas` |
| 97 | `const` | `chorrosChispasActivos` | `chorrosChispasActivos` |
| 100 | `const` | `mallasSuperficieConducible` | `mallasSuperficieConducible` |
| 102 | `const` | `obstaculosHabitacion` | `obstaculosHabitacion` |
| 105 | `const` | `plataformasTurbo` | `plataformasTurbo` |
| 106 | `const` | `obstaculosDinamicos` | `obstaculosDinamicos` |
| 107 | `const` | `obstaculosMoviles` | `obstaculosMoviles` |
| 108 | `const` | `trampasPista` | `trampasPista` |
| 115 | `function` | `obtenerClaveRecord` | `obtenerClaveRecord(idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo)` |
| 149 | `const` | `estadoCronometro` | `estadoCronometro` |
| 163 | `const` | `checkpointsPista` | `checkpointsPista` |
| 166 | `const` | `estadoRed` | `estadoRed` |
| 176 | `const` | `jugadoresRemotos` | `jugadoresRemotos` |
| 179 | `const` | `entradaTactil` | `entradaTactil` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 3 | `const` | `PIEZAS_COCHE_INICIAL` | `PIEZAS_COCHE_INICIAL` |
| 110 | `const` | `CLAVE_RECORD_LEGACY` | `CLAVE_RECORD_LEGACY` |
| 119 | `function` | `leerRecordLocalStorage` | `leerRecordLocalStorage(idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo)` |
| 136 | `function` | `guardarRecordLocalStorage` | `guardarRecordLocalStorage(tiempo, idHabitacion = estadoCarro.idHabitacion, claseVehiculo = estadoCarro.claseVehiculo)` |

---
## `js/interfaz.js` (1853 líneas)

### Imports
- **L1** desde `./constantes.js`: PALETA_COLORES, TOPE_STAT_UI, CLASES_VEHICULO, IDS_HABITACIONES, CATALOGO_HABITACIONES
- **L2** desde `./estado.js`: estadoCarro, fisicaCarro, teclasConduccion, nodosEnganches, listaColisionadoresEnganches, estadoCronometro, estadoRed, jugadoresRemotos, entradaTactil
- **L13** desde `./recursos.js`: cacheMiniaturas, liberarObjeto3D, crearVistaPreviaEscenario
- **L14** desde `./escenario.js`: lienzo, camara, renderizador, controles, cargarEscenario
- **L15** desde `./catalogoPiezas.js`: TABLA_CARROCERIAS, TABLA_PIEZAS, obtenerAtributosFinalesVehiculo
- **L16** desde `./enganches.js`: grupoJuguete, colocarPiezaEnEnganche, construirOActualizarCarroceria, dispararChispasEnEnganche
- **L22** desde `./conduccion.js`: reposicionarEnMeta, reiniciarCronometroVuelta, actualizarHUDCronometro, formatearTiempoMMSS
- **L28** desde `./audio.js`: alternarSilencio, cambiarModoMusical, cambiarPistaConduccion, seleccionarPistaMusicalPorId, reproducirCambioColor, inicializarAudioInteractivo
- **L36** desde `./red.js`: crearSalaOnline, unirseSalaOnline, salirDeSala, enviarApariencia, notificarCambioHabitacion

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 182 | `function` | `limpiarEntradasTactiles` | `limpiarEntradasTactiles()` |
| 201 | `function` | `detectarDispositivoTactil` | `detectarDispositivoTactil()` |
| 217 | `function` | `actualizarVisibilidadControlesTactiles` | `actualizarVisibilidadControlesTactiles()` |
| 238 | `function` | `alternarControlesTactiles` | `alternarControlesTactiles(forzar = null)` |
| 265 | `function` | `actualizarPanelMultijugador` | `actualizarPanelMultijugador()` |
| 328 | `function` | `actualizarEtiquetasYLeaderboard` | `actualizarEtiquetasYLeaderboard()` |
| 454 | `function` | `generarMiniaturasCatalogo` | `generarMiniaturasCatalogo()` |
| 637 | `function` | `actualizarPanelesMarioKart` | `actualizarPanelesMarioKart()` |
| 804 | `function` | `ciclarOpcionRanuraMK` | `ciclarOpcionRanuraMK(ranuraId, direccion = 1)` |
| 850 | `function` | `abrirModalCircuitosMK` | `abrirModalCircuitosMK()` |
| 921 | `function` | `cerrarModalCircuitosMK` | `cerrarModalCircuitosMK()` |
| 930 | `function` | `cambiarClaseVehiculo` | `cambiarClaseVehiculo(claseDestino = null)` |
| 999 | `function` | `cambiarHabitacion` | `cambiarHabitacion(idOpcional = null, origenRed = false)` |
| 1065 | `function` | `actualizarTextoEstado` | `actualizarTextoEstado()` |
| 1095 | `function` | `alternarModoTallerConduccion` | `alternarModoTallerConduccion()` |
| 1192 | `function` | `alternarCamaraConduccion` | `alternarCamaraConduccion()` |
| 1203 | `function` | `renderizarBandeja` | `renderizarBandeja(categoria)` |
| 1331 | `function` | `configurarEventosInteraccion` | `configurarEventosInteraccion()` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 44 | `const` | `ETIQUETAS_CLASE` | `ETIQUETAS_CLASE` |
| 51 | `const` | `PESTANAS_POR_CLASE` | `PESTANAS_POR_CLASE` |
| 78 | `const` | `CATEGORIAS_AGRUPADAS` | `CATEGORIAS_AGRUPADAS` |
| 83 | `const` | `RANURAS_MK_POR_CLASE` | `RANURAS_MK_POR_CLASE` |
| 112 | `const` | `DESCRIPCIONES_SUPERFICIE_HAB` | `DESCRIPCIONES_SUPERFICIE_HAB` |
| 119 | `let` | `categoriaActiva` | `categoriaActiva` |
| 120 | `let` | `ranuraMKActiva` | `ranuraMKActiva` |
| 121 | `let` | `subRanuraSecundariaIdx` | `subRanuraSecundariaIdx` |
| 123 | `const` | `barraEstado` | `barraEstado` |
| 124 | `const` | `contenedorItems` | `contenedorItems` |
| 125 | `const` | `bandejaInferior` | `bandejaInferior` |
| 126 | `const` | `hudConduccion` | `hudConduccion` |
| 127 | `const` | `btnModoRuedas` | `btnModoRuedas` |
| 128 | `const` | `btnQuitar` | `btnQuitar` |
| 129 | `const` | `btnAlternarModo` | `btnAlternarModo` |
| 130 | `const` | `btnCamara` | `btnCamara` |
| 131 | `const` | `btnAudio` | `btnAudio` |
| 132 | `const` | `btnPista` | `btnPista` |
| 133 | `const` | `btnClaseVehiculo` | `btnClaseVehiculo` |
| 134 | `const` | `btnHabitacion` | `btnHabitacion` |
| 135 | `const` | `altitudHud` | `altitudHud` |
| 136 | `const` | `guiaVueloHud` | `guiaVueloHud` |
| 139 | `const` | `selectorClaseMK` | `selectorClaseMK` |
| 140 | `const` | `panelPersonalizacionMK` | `panelPersonalizacionMK` |
| 141 | `const` | `panelStatsMK` | `panelStatsMK` |
| 142 | `const` | `modalCircuitosMK` | `modalCircuitosMK` |
| 143 | `const` | `gridCircuitosMK` | `gridCircuitosMK` |
| 144 | `const` | `btnAbrirCopasMK` | `btnAbrirCopasMK` |
| 145 | `const` | `btnCopasMK` | `btnCopasMK` |
| 146 | `const` | `btnCerrarModalMK` | `btnCerrarModalMK` |
| 149 | `const` | `CLAVE_APODO_LOCAL` | `CLAVE_APODO_LOCAL` |
| 150 | `const` | `panelMultijugador` | `panelMultijugador` |
| 151 | `const` | `badgeModoRed` | `badgeModoRed` |
| 152 | `const` | `inputApodoRed` | `inputApodoRed` |
| 153 | `const` | `vistaRedLobby` | `vistaRedLobby` |
| 154 | `const` | `btnCrearSala` | `btnCrearSala` |
| 155 | `const` | `inputCodigoSala` | `inputCodigoSala` |
| 156 | `const` | `btnUnirseSala` | `btnUnirseSala` |
| 157 | `const` | `vistaRedActiva` | `vistaRedActiva` |
| 158 | `const` | `codigoSalaActivo` | `codigoSalaActivo` |
| 159 | `const` | `rolSalaActivo` | `rolSalaActivo` |
| 160 | `const` | `listaJugadoresSala` | `listaJugadoresSala` |
| 161 | `const` | `btnSalirSala` | `btnSalirSala` |
| 162 | `const` | `avisoRed` | `avisoRed` |
| 163 | `const` | `capaEtiquetas3D` | `capaEtiquetas3D` |
| 164 | `const` | `hudLeaderboard` | `hudLeaderboard` |
| 165 | `const` | `listaLeaderboardHud` | `listaLeaderboardHud` |
| 166 | `const` | `btnReubicarMeta` | `btnReubicarMeta` |
| 167 | `const` | `btnControlesTactiles` | `btnControlesTactiles` |
| 168 | `const` | `btnColapsarTallerMK` | `btnColapsarTallerMK` |
| 169 | `const` | `controlesTactiles` | `controlesTactiles` |
| 170 | `const` | `joystickBase` | `joystickBase` |
| 171 | `const` | `joystickPomo` | `joystickPomo` |
| 172 | `const` | `grupoVueloTactil` | `grupoVueloTactil` |
| 173 | `const` | `btnTactilGas` | `btnTactilGas` |
| 174 | `const` | `btnTactilFreno` | `btnTactilFreno` |
| 175 | `const` | `btnTactilDerrape` | `btnTactilDerrape` |
| 176 | `const` | `btnTactilSubir` | `btnTactilSubir` |
| 177 | `const` | `btnTactilBajar` | `btnTactilBajar` |
| 245 | `const` | `etiquetasDomPorId` | `etiquetasDomPorId` |
| 246 | `let` | `timerAvisoRed` | `timerAvisoRed` |
| 247 | `let` | `ultimoHtmlLeaderboard` | `ultimoHtmlLeaderboard` |
| 249 | `function` | `mostrarAvisoRed` | `mostrarAvisoRed(mensaje, esError = false)` |
| 514 | `function` | `actualizarBotonesClaseYHUD` | `actualizarBotonesClaseYHUD()` |
| 555 | `function` | `actualizarNombreChasisHUD` | `actualizarNombreChasisHUD()` |
| 562 | `function` | `formatearBonoPieza` | `formatearBonoPieza(mod)` |
| 571 | `function` | `obtenerListaYActivaPorCategoria` | `obtenerListaYActivaPorCategoria(categoria)` |
| 591 | `function` | `aplicarSeleccionItemTaller` | `aplicarSeleccionItemTaller(pieza)` |
| 988 | `function` | `actualizarTextoBtnHabitacion` | `actualizarTextoBtnHabitacion()` |

---
## `js/main.js` (185 líneas)

### Imports
- **L1** desde `./constantes.js`: CATALOGO_HABITACIONES
- **L2** desde `./estado.js`: estadoCarro, fisicaCarro, nodosEnganches, animacionesActivas, chorrosChispasActivos
- **L9** desde `./recursos.js`: inicializarRecursos, liberarObjeto3D, bancoTexturas
- **L10** desde `./escenario.js`: escena, camara, renderizador, controles, sistemaPolvo, cargarEscenario
- **L18** desde `./enganches.js`: construirOActualizarCarroceria
- **L19** desde `./conduccion.js`: actualizarFisicaConduccion, actualizarCamaraConduccion, actualizarObstaculos
- **L20** desde `./interfaz.js`: generarMiniaturasCatalogo, configurarEventosInteraccion, renderizarBandeja, actualizarEtiquetasYLeaderboard
- **L26** desde `./audio.js`: actualizarMusicaAmbiental, actualizarAudioMotor
- **L27** desde `./red.js`: actualizarRed

### Exports
- Sin exports (módulo de arranque).

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 29 | `let` | `tiempoAnterior` | `tiempoAnterior` |
| 36 | `function` | `actualizarEscena` | `actualizarEscena(dt, tiempoTotal)` |
| 168 | `function` | `buclePrincipal` | `buclePrincipal(ahora)` |

---
## `js/partituras.js` (508 líneas)

### Imports
- Sin imports locales.

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 16 | `function` | `notaAFrecuencia` | `notaAFrecuencia(nota)` |
| 41 | `const` | `IDS_PISTAS_CONDUCCION` | `IDS_PISTAS_CONDUCCION` |
| 49 | `const` | `CATALOGO_PARTITURAS` | `CATALOGO_PARTITURAS` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 3 | `const` | `SEMITONOS_BASE` | `SEMITONOS_BASE` |
| 39 | `const` | `pasos` | `pasos` |

---
## `js/recursos.js` (1498 líneas)

### Imports
- **L1** desde `./constantes.js`: URLS_TEXTURAS

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 3 | `const` | `cargadorTexturas` | `cargadorTexturas` |
| 6 | `const` | `bancoTexturas` | `bancoTexturas` |
| 7 | `const` | `cacheMiniaturas` | `cacheMiniaturas` |
| 13 | `function` | `crearCajaRedondeada` | `crearCajaRedondeada(ancho, alto, profundo, segmentos, radio)` |
| 57 | `function` | `liberarObjeto3D` | `liberarObjeto3D(objeto)` |
| 76 | `function` | `crearRespaldoMaderaCanvas` | `crearRespaldoMaderaCanvas(modo)` |
| 116 | `function` | `crearRespaldoSpriteCanvas` | `crearRespaldoSpriteCanvas(suave)` |
| 134 | `function` | `cargarTexturaSegura` | `cargarTexturaSegura(url, texRespaldo, configurar)` |
| 155 | `function` | `crearTexturaPapelTapiz` | `crearTexturaPapelTapiz()` |
| 212 | `function` | `crearTexturaAlfombra` | `crearTexturaAlfombra()` |
| 250 | `function` | `crearTexturaPistaAsfalto` | `crearTexturaPistaAsfalto()` |
| 287 | `function` | `crearTexturaPianoCurva` | `crearTexturaPianoCurva()` |
| 307 | `function` | `crearTexturaMetaCuadros` | `crearTexturaMetaCuadros()` |
| 330 | `function` | `crearTexturaBandaRodadura` | `crearTexturaBandaRodadura(estilo = 'deportiva')` |
| 415 | `function` | `crearTexturaDiscoFreno` | `crearTexturaDiscoFreno()` |
| 496 | `function` | `crearTexturaTurboPad` | `crearTexturaTurboPad()` |
| 572 | `function` | `crearTexturaPosterPared` | `crearTexturaPosterPared(tipo)` |
| 919 | `function` | `crearTexturaLetraCubo` | `crearTexturaLetraCubo(letra, colorBorde)` |
| 953 | `function` | `crearTexturaPelotaLuxo` | `crearTexturaPelotaLuxo()` |
| 981 | `function` | `crearTexturaTablero` | `crearTexturaTablero()` |
| 1101 | `function` | `crearTexturaAgua` | `crearTexturaAgua()` |
| 1136 | `function` | `crearTexturaAzulejoPiscina` | `crearTexturaAzulejoPiscina()` |
| 1169 | `function` | `crearTexturaTierraCompactada` | `crearTexturaTierraCompactada()` |
| 1198 | `function` | `crearTexturaPisoHangar` | `crearTexturaPisoHangar()` |
| 1229 | `function` | `crearVistaPreviaEscenario` | `crearVistaPreviaEscenario(idHabitacion)` |
| 1353 | `function` | `crearTexturaTrampa` | `crearTexturaTrampa(tipo = 'aceite')` |
| 1414 | `function` | `inicializarRecursos` | `inicializarRecursos()` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 20 | `const` | `SLOTS_TEXTURA_MATERIAL` | `SLOTS_TEXTURA_MATERIAL` |
| 32 | `function` | `liberarMaterialYClones` | `liberarMaterialYClones(mat, texturasLiberadas)` |
| 553 | `function` | `dibujarEstrella2D` | `dibujarEstrella2D(ctx, cx, cy, radioExt, radioInt, color)` |
| 1085 | `function` | `crearCanvasTexturaRepetible` | `crearCanvasTexturaRepetible(tam, dibujar)` |

---
## `js/red.js` (533 líneas)

### Imports
- **L1** desde `./config.js`: CONFIG_RED
- **L2** desde `./estado.js`: estadoCarro, fisicaCarro, estadoCronometro, estadoRed, jugadoresRemotos
- **L9** desde `./enganches.js`: grupoJuguete, ensamblarGrupoVehiculo, destruirVehiculoRemoto
- **L14** desde `./recursos.js`: liberarObjeto3D

### Exports
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 265 | `function` | `obtenerAparienciaLocal` | `obtenerAparienciaLocal()` |
| 277 | `function` | `crearSalaOnline` | `crearSalaOnline(apodo = estadoRed.apodo, habitacionId = estadoCarro.idHabitacion, urlOpcional = null)` |
| 295 | `function` | `unirseSalaOnline` | `unirseSalaOnline(codigoSala, apodo = estadoRed.apodo, urlOpcional = null)` |
| 314 | `function` | `salirDeSala` | `salirDeSala()` |
| 337 | `function` | `enviarApariencia` | `enviarApariencia(enPista = estadoCarro.modoJuego === 'conduccion')` |
| 349 | `function` | `notificarCambioHabitacion` | `notificarCambioHabitacion(habitacionId = estadoCarro.idHabitacion)` |
| 360 | `function` | `procesarMensajeRed` | `procesarMensajeRed(msg)` |
| 464 | `function` | `actualizarRed` | `actualizarRed(dt, transportPersonalizado = null)` |

### Símbolos Internos (Nivel Superior)
| Línea | Tipo | Símbolo | Firma |
| ---: | :--- | :--- | :--- |
| 16 | `const` | `WS_OPEN` | `WS_OPEN` |
| 17 | `const` | `TIMEOUT_CONEXION_MS` | `TIMEOUT_CONEXION_MS` |
| 19 | `let` | `socketActivo` | `socketActivo` |
| 20 | `let` | `acumuladorEnvio` | `acumuladorEnvio` |
| 22 | `function` | `obtenerEscenaRaiz` | `obtenerEscenaRaiz()` |
| 26 | `function` | `emitirEventoRed` | `emitirEventoRed(nombre, detail = {})` |
| 36 | `function` | `enviarMensaje` | `enviarMensaje(payload)` |
| 46 | `function` | `deltaAngularCorto` | `deltaAngularCorto(objetivo, actual)` |
| 53 | `function` | `construirRemotoDesdeDatos` | `construirRemotoDesdeDatos(datos)` |
| 98 | `function` | `registrarOActualizarRemoto` | `registrarOActualizarRemoto(datos)` |
| 153 | `function` | `conectarYEnviarInicial` | `conectarYEnviarInicial(mensajeInicial, urlPersonalizada = null)` |
| 245 | `function` | `limpiarEstadoYSalaLocal` | `limpiarEstadoYSalaLocal()` |
