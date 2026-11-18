// Activos musicales multipista 16-bit (semicorcheas, ligaduras '~', acordes '/' y batería de 5 voces).

const SEMITONOS_BASE = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

/**
 * Convierte notación científica ('C2'..'C7', sostenidos '#', bemoles 'b', silencio '_' o ligadura '~') a Hz.
 */
export function notaAFrecuencia(nota) {
  if (!nota || nota === '_' || nota === '~' || nota === '.' || nota === '-') {
    return 0;
  }
  const match = String(nota).trim().match(/^([A-Ga-g])([#b]?)(-?\d)$/);
  if (!match) return 0;

  const letra = match[1].toUpperCase();
  const alteracion = match[2];
  const octava = parseInt(match[3], 10);
  if (!(letra in SEMITONOS_BASE) || Number.isNaN(octava)) return 0;

  let semitono = SEMITONOS_BASE[letra];
  if (alteracion === '#') semitono += 1;
  if (alteracion === 'b') semitono -= 1;

  const midi = (octava + 1) * 12 + semitono;
  return +(440 * Math.pow(2, (midi - 69) / 12)).toFixed(2);
}

/**
 * Helper compacto para convertir compases escritos con espacios en arreglos planos de semicorcheas.
 */
const pasos = (...compases) => compases.join(' ').trim().split(/\s+/);

export const IDS_PISTAS_CONDUCCION = [
  'circuito_kart',
  'autopista_16bit',
  'turbo_apex',
  'ola_snes',
  'cielo_snes'
];

export const CATALOGO_PARTITURAS = {
  // 1. Modo Taller: estilo pantalla de selección de vehículo en Top Gear (118 BPM, 128 semicorcheas)
  taller_juguetes: {
    id: 'taller_juguetes',
    titulo: 'Pit Stop Garage 16-Bit',
    modo: 'taller',
    bpm: 118,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'sawtooth',
        duracion: 0.14,
        volumen: 0.042,
        filtro: 2300,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'triangle',
        duracion: 0.13,
        volumen: 0.032,
        filtro: 2000
      },
      bajo: {
        tipo: 'sawtooth',
        duracion: 0.11,
        volumen: 0.052,
        filtro: 640,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        // Sección A (Synth-funk en Do -> Lam -> Fa -> Sol7)
        'E5 ~ _ G5 A5 ~ G5 _ E5 _ D5 C5 D5 ~ E5 ~',
        'C5 ~ _ E5 G5 ~ E5 C5 A4 ~ _ C5 D5 E5 G5 ~',
        'F5 ~ A5 ~ G5 ~ F5 ~ E5 ~ D5 C5 A4 ~ C5 D5',
        'E5 ~ D5 C5 B4 ~ D5 ~ G5 ~ _ F5 E5 D5 C5 B4',
        // Sección B (Puente brillante en Fa -> Mi7 -> Lam -> Sol)
        'A5 ~ _ F5 ~ D5 ~ F5 A5 ~ G5 F5 E5 ~ C5 ~',
        'G5 ~ _ E5 ~ C5 ~ E5 G5 ~ F5 E5 D5 ~ B4 ~',
        'C5 E5 G5 A5 ~ G5 E5 C5 D5 F5 A5 G5 ~ F5 E5 D5',
        'E5 ~ G5 ~ C6 ~ _ B5 A5 G5 E5 D5 C5 ~ ~ _'
      ),
      armonia: pasos(
        'C4/E4/G4 ~ _ C4/E4/G4 ~ _ _ C4/E4/G4 _ _ _ _ C4/E4/G4 _ E4 G4',
        'A3/C4/E4 ~ _ A3/C4/E4 ~ _ _ A3/C4/E4 _ _ _ _ A3/C4/E4 _ C4 E4',
        'F3/A3/C4 ~ _ F3/A3/C4 ~ _ _ F3/A3/C4 _ _ _ _ F3/A3/C4 _ A3 C4',
        'G3/B3/D4 ~ _ G3/B3/D4 ~ _ _ G3/B3/D4 _ _ _ _ G3/B3/D4 _ B3 D4',
        'F3/A3/C4 ~ A4 C5 F4 ~ A4 C5 F4 ~ _ F3/A3/C4 ~ _ C4 A3',
        'E3/G#3/B3 ~ G#4 B4 E4 ~ G#4 B4 E4 ~ _ E3/G#3/B3 ~ _ B3 G#3',
        'A3/C4/E4 ~ C5 A4 F3/A3/C4 ~ A4 F4 G3/B3/D4 ~ B4 G4 E4/G4/B4 ~ G4 E4',
        'C4/E4/G4 ~ _ _ C4/E4/G4 ~ G4 E4 G3/B3/D4 ~ _ _ C4/E4/G4 ~ ~ _'
      ),
      bajo: pasos(
        'C3 _ C3 C4 _ G2 _ C3 _ C3 E3 _ G2 _ A2 B2',
        'A2 _ A2 A3 _ E2 _ A2 _ A2 C3 _ E2 _ G2 _',
        'F2 _ F2 F3 _ C3 _ F2 _ F2 A2 _ C3 _ D3 _',
        'G2 _ G2 G3 _ D3 _ G2 _ B2 D3 G2 F2 E2 D2 _',
        'F2 _ F3 F2 _ C3 _ F2 A2 C3 F3 _ C3 _ A2 F2',
        'E2 _ E3 E2 _ B2 _ E2 G#2 B2 E3 _ B2 _ G#2 E2',
        'A2 _ A3 A2 F2 _ F3 F2 G2 _ G3 G2 E2 _ E3 E2',
        'F2 G2 A2 B2 C3 G2 E2 G2 G2 A2 B2 D3 C3 ~ G2 _'
      ),
      percusion: pasos(
        'K . H . S . H K . K H . S . H O',
        'K . H . S . H K . K H H S . T T',
        'K . H . S . H K . K H . S . H O',
        'K . H . S . H K . K S H T T S .',
        'K H H . S H K H K . H O S H T H',
        'K H H . S H K H K . H O S H T T',
        'K H S H K H S H K H S H K S T T',
        'K . H O S . H K K . H . S T S K'
      )
    }
  },

  // 2. Conducción 1: alegre y enérgica estilo Super Mario Kart / OutRun (146 BPM, 128 semicorcheas)
  circuito_kart: {
    id: 'circuito_kart',
    titulo: 'Grand Prix Juguetes 92',
    modo: 'conduccion',
    bpm: 146,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'square',
        duracion: 0.13,
        volumen: 0.044,
        filtro: 2600,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'triangle',
        duracion: 0.12,
        volumen: 0.036,
        filtro: 2400
      },
      bajo: {
        tipo: 'triangle',
        duracion: 0.11,
        volumen: 0.056,
        filtro: 850,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        // Sección A (DoM -> Sol -> Fa -> Sib/Sol)
        'C5 ~ E5 ~ G5 ~ _ A5 ~ G5 E5 C5 D5 ~ E5 ~',
        'D5 ~ F#5 ~ G5 ~ _ B5 ~ G5 D5 ~ B4 D5 G5 ~',
        'A5 ~ _ F5 ~ D5 ~ F5 G5 ~ _ E5 ~ C5 ~ E5',
        'D5 ~ D5 F5 E5 ~ D5 C5 B4 ~ D5 ~ G5 ~ ~ _',
        // Sección B (Modulación brillante Lab -> Sib -> Fa/Sol -> Do)
        'Ab5 ~ _ Eb5 ~ C5 ~ Eb5 Ab5 ~ G5 Eb5 C5 ~ Eb5 Ab5',
        'Bb5 ~ _ F5 ~ D5 ~ F5 Bb5 ~ A5 F5 D5 ~ F5 Bb5',
        'C6 ~ A5 F5 A5 C6 A5 F5 B5 ~ D6 B5 G5 B5 D6 B5',
        'C6 ~ ~ _ G5 ~ E5 ~ C5 G4 C5 E5 G5 ~ C6 ~'
      ),
      armonia: pasos(
        'C4/E4/G4 ~ _ _ C4/E4/G4 ~ _ C4/E4/G4 ~ _ _ _ E4 G4 C5 G4',
        'G3/B3/D4 ~ _ _ G3/B3/D4 ~ _ G3/B3/D4 ~ _ _ _ B4 G4 D4 B3',
        'F4/A4/C5 ~ _ _ F4/A4/C5 ~ _ C4/E4/G4 ~ _ _ _ G4 E4 C4 G3',
        'Bb3/D4/F4 ~ _ Bb3/D4/F4 ~ _ _ _ G3/B3/D4 ~ _ G3/B3/D4 D4 B3 G3 _',
        'Eb4 Ab4 C5 Ab4 Eb4 Ab4 C5 Ab4 Eb4 Ab4 C5 Ab4 C5 Ab4 Eb4 C4',
        'F4 Bb4 D5 Bb4 F4 Bb4 D5 Bb4 F4 Bb4 D5 Bb4 D5 Bb4 F4 D4',
        'F4/A4/C5 ~ _ F4/A4/C5 ~ _ F4/A4/C5 _ G4/B4/D5 ~ _ G4/B4/D5 ~ _ D5 B4',
        'E4 G4 C5 G4 C5 G4 E4 C4 C4/E4/G4 ~ _ _ C5 G4 E4 C4'
      ),
      bajo: pasos(
        'C3 C4 C3 G2 C3 C4 C3 G2 C3 E3 G3 E3 C3 G2 A2 B2',
        'G2 G3 G2 D3 G2 G3 G2 D3 G2 B2 D3 B2 G2 A2 B2 G2',
        'F2 F3 F2 C3 F2 A2 C3 F3 C3 C4 G2 G3 C3 G2 E2 G2',
        'Bb2 Bb3 F2 Bb2 D3 Bb2 F2 D2 G2 G3 D3 G2 B2 D3 G3 D3',
        'Ab2 Ab3 Eb3 Ab2 Ab2 Ab3 Eb3 Ab2 Ab2 C3 Eb3 Ab3 Eb3 C3 Ab2 Eb2',
        'Bb2 Bb3 F3 Bb2 Bb2 Bb3 F3 Bb2 Bb2 D3 F3 Bb3 F3 D3 Bb2 F2',
        'F2 F3 C3 F2 A2 C3 F3 C3 G2 G3 D3 G2 B2 D3 G3 D3',
        'C3 C4 G3 E3 C3 G2 C3 E3 C3 C4 G2 G3 C3 ~ G2 _'
      ),
      percusion: pasos(
        'K H H H S H K H K K H O S H H H',
        'K H H H S H K H K K H O S H T T',
        'K H H H S H K H K K H O S H H H',
        'K H S H K K S H K S K S T T T K',
        'K H H H S H K H K K H O S H H H',
        'K H H H S H K H K K H O S H T T',
        'K H S H K K S H K H S H K K S T',
        'K H S H K K S H K S T T S T S K'
      )
    }
  },

  // 3. Conducción 2: Las Vegas Nitro 16-Bit inspirada en Top Gear SNES (150 BPM, 128 semicorcheas)
  autopista_16bit: {
    id: 'autopista_16bit',
    titulo: 'Las Vegas Nitro 16-Bit',
    modo: 'conduccion',
    bpm: 150,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'sawtooth',
        duracion: 0.14,
        volumen: 0.048,
        filtro: 2800,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'sawtooth',
        duracion: 0.13,
        volumen: 0.032,
        filtro: 2200,
        unison: true
      },
      bajo: {
        tipo: 'sawtooth',
        duracion: 0.10,
        volumen: 0.054,
        filtro: 680,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        // Sección A (Frases épicas en Lam -> Fa -> Sol -> Mi7 con unison y vibrato)
        'E5 ~ ~ ~ ~ ~ A5 G5 E5 ~ D5 C5 D5 ~ E5 ~',
        'F5 ~ ~ ~ ~ ~ A5 G5 F5 ~ E5 D5 C5 ~ D5 E5',
        'G5 ~ ~ ~ B5 ~ A5 ~ G5 ~ F5 E5 D5 ~ G5 ~',
        'E5 ~ ~ ~ ~ ~ G#5 B5 E6 ~ D6 B5 G#5 E5 F5 G#5',
        // Sección B (Subida heroica Rem -> Sol -> Do/Lam -> Mi7)
        'A5 ~ ~ ~ F5 ~ D5 ~ F5 ~ A5 ~ D6 ~ C6 A5',
        'B5 ~ ~ ~ G5 ~ D5 ~ G5 A5 B5 ~ D6 ~ C6 B5',
        'C6 ~ ~ ~ G5 ~ E5 ~ A5 ~ ~ ~ E5 C5 E5 A5',
        'B5 ~ G#5 ~ E5 G#5 B5 D6 C6 B5 A5 G#5 A5 ~ ~ ~'
      ),
      armonia: pasos(
        'A3/C4/E4 ~ _ _ A3/C4/E4 ~ _ A3/C4/E4 ~ _ _ _ A3/C4/E4 _ E4 C4',
        'F3/A3/C4 ~ _ _ F3/A3/C4 ~ _ F3/A3/C4 ~ _ _ _ F3/A3/C4 _ C4 A3',
        'G3/B3/D4 ~ _ _ G3/B3/D4 ~ _ G3/B3/D4 ~ _ _ _ G3/B3/D4 _ D4 B3',
        'E3/G#3/B3 ~ _ _ E3/G#3/B3 ~ _ E3/G#3/B3 ~ _ _ _ E4 B3 G#3 E3',
        'D4 F4 A4 D5 D4 F4 A4 D5 D4 F4 A4 F4 D4 F4 A4 F4',
        'D4 G4 B4 D5 D4 G4 B4 D5 D4 G4 B4 G4 D4 G4 B4 G4',
        'E4 G4 C5 E5 E4 G4 C5 E5 C4 E4 A4 C5 C4 E4 A4 E4',
        'E4 G#4 B4 E5 E4 G#4 B4 D5 C4/E4/A4 ~ _ _ A3/C4/E4 ~ ~ _'
      ),
      bajo: pasos(
        'A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 G2 A2',
        'F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 E2 F2',
        'G2 G3 G2 G3 G2 G3 G2 G3 G2 G3 G2 G3 G2 G3 F#2 G2',
        'E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 G#2 B2 E3',
        'D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 F2 A2 D3',
        'G2 G3 G2 G3 G2 G3 G2 G3 G2 G3 G2 G3 G2 B2 D3 G3',
        'C3 C4 C3 C4 C3 B2 A2 G2 A2 A3 A2 A3 A2 A3 E2 G2',
        'E2 E3 E2 E3 E2 G#2 B2 E3 A2 A3 A2 A3 A2 E2 G2 A2'
      ),
      percusion: pasos(
        'K H H H S H K H K K H O S H H H',
        'K H H H S H K H K K H O S H T H',
        'K H H H S H K H K K H O S H H H',
        'K H H H S H K H K S T T S T T K',
        'K H H H S H K H K K H O S H H H',
        'K H H H S H K H K K H O S H T T',
        'K H H H S H K H K K H O S H H H',
        'K H S H K K S H K S T T S T S K'
      )
    }
  },

  // 4. Conducción 3: Super Striker GP inspirada en Captain Tsubasa 2 NES/16-bit (156 BPM, 128 semicorcheas)
  turbo_apex: {
    id: 'turbo_apex',
    titulo: 'Super Striker GP',
    modo: 'conduccion',
    bpm: 156,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'square',
        duracion: 0.13,
        volumen: 0.046,
        filtro: 3000,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'triangle',
        duracion: 0.11,
        volumen: 0.038,
        filtro: 2600
      },
      bajo: {
        tipo: 'sawtooth',
        duracion: 0.10,
        volumen: 0.055,
        filtro: 720,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        // Sección A (Dramática y veloz en Mim -> Do -> Re -> Si7)
        'E5 ~ ~ ~ ~ ~ G5 A5 B5 ~ ~ ~ ~ ~ E5 G5',
        'C6 ~ ~ ~ B5 A5 G5 F#5 E5 ~ G5 ~ A5 G5 F#5 E5',
        'D5 ~ ~ ~ F#5 A5 D6 ~ C6 ~ B5 ~ A5 ~ F#5 D5',
        'B4 D#5 F#5 A5 B5 ~ ~ ~ A5 G5 F#5 D#5 B4 ~ ~ ~',
        // Sección B (Clímax heroico Mim agudo -> Lam -> Do/Re -> Si7)
        'E6 ~ ~ ~ D6 C6 B5 A5 G5 ~ B5 ~ E6 ~ D6 B5',
        'C6 ~ ~ ~ A5 E5 A5 C6 B5 ~ A5 G5 F#5 ~ E5 D5',
        'C5 E5 G5 C6 B5 ~ G5 ~ D5 F#5 A5 D6 F#6 ~ D6 A5',
        'D#6 ~ B5 ~ F#5 ~ D#5 ~ E5 ~ ~ ~ E5 F#5 G5 B5'
      ),
      armonia: pasos(
        'G4 B4 E5 B4 G4 B4 E5 B4 G4 B4 E5 G5 B5 G5 E5 B4',
        'E4 G4 C5 G4 E4 G4 C5 E5 G4 C5 E5 G5 E5 C5 G4 E4',
        'F#4 A4 D5 A4 F#4 A4 D5 F#5 A4 D5 F#5 A5 F#5 D5 A4 F#4',
        'D#4 F#4 B4 F#4 D#4 F#4 A4 B4 F#4 A4 B4 D#5 B4 A4 F#4 D#4',
        'B4 E5 G5 E5 B4 G5 E5 B4 B4 E5 G5 E5 B4 G5 B5 G5',
        'E4 A4 C5 A4 C5 E5 C5 A4 E4 G4 B4 G4 D4 F#4 A4 F#4',
        'E4/G4/C5 ~ _ E4/G4/C5 ~ _ G4 E4 F#4/A4/D5 ~ _ F#4/A4/D5 ~ _ A4 F#4',
        'F#4 A4 B4 D#5 B4 A4 F#4 D#4 E4/G4/B4 ~ ~ ~ _ B4 G4 E4'
      ),
      bajo: pasos(
        'E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 B2 E3 E2 F#2 G2 B2',
        'C2 C3 C2 C3 C2 C3 C2 C3 C2 G2 C3 G2 C3 C#3 D3 D#3',
        'D2 D3 D2 D3 D2 D3 D2 D3 D2 A2 D3 A2 D3 C3 B2 A2',
        'B2 F#3 B2 F#3 B2 A2 F#2 D#2 B2 B3 F#2 D#2 B2 C#3 D#3 F#3',
        'E2 E3 E2 E3 E2 B2 E3 B2 E2 E3 G2 B2 E3 D3 B2 G2',
        'A2 A3 A2 A3 A2 E2 A2 C3 G2 G3 D2 G2 D2 F#2 A2 D3',
        'C3 C4 C3 C4 C3 G2 C3 G2 D3 D4 D3 D4 D3 A2 D3 A2',
        'B2 F#3 B2 F#3 B2 D#3 F#3 B3 E2 E3 E2 B2 E2 F#2 G2 B2'
      ),
      percusion: pasos(
        'K H H H S H K H K K H O S T T H',
        'K H H H S H K H K H O H S T T S',
        'K H H H S H K H K K H O S H T T',
        'K S K S H O T T S T S T K . T T',
        'K H H H S H K H K K H O S T T H',
        'K H H H S H K H K K H O S H T T',
        'K H S H K K S H K H S H K S T T',
        'K S K S T T T T K . S H K T T S'
      )
    }
  },
  // 5. Bahía Acuática: estilo Wave Race / Top Gear veraniego (148 BPM, 128 semicorcheas)
  ola_snes: {
    id: 'ola_snes',
    titulo: 'Wave Splash 16-Bit',
    modo: 'conduccion',
    bpm: 148,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'sawtooth',
        duracion: 0.14,
        volumen: 0.044,
        filtro: 2900,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'triangle',
        duracion: 0.12,
        volumen: 0.036,
        filtro: 2500
      },
      bajo: {
        tipo: 'sawtooth',
        duracion: 0.11,
        volumen: 0.052,
        filtro: 780,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        'G5 ~ E5 ~ C5 ~ G5 ~ A5 ~ G5 ~ E5 ~ D5 ~',
        'E5 ~ C5 ~ A4 ~ E5 ~ G5 ~ F5 ~ E5 ~ D5 ~',
        'C5 ~ F5 ~ A5 ~ C6 ~ Bb5 ~ A5 ~ G5 ~ F5 ~',
        'D5 ~ G5 ~ B5 ~ D6 ~ C6 ~ B5 ~ A5 ~ G5 ~',
        'E6 ~ ~ ~ D6 ~ C6 ~ G5 ~ A5 ~ C6 ~ E6 ~',
        'A5 ~ C6 ~ E6 ~ C6 ~ B5 ~ A5 ~ G5 ~ E5 ~',
        'F5 ~ A5 ~ C6 ~ F6 ~ E6 ~ D6 ~ C6 ~ A5 ~',
        'G5 ~ B5 ~ D6 ~ F6 ~ E6 ~ D6 ~ C6 ~ ~ ~'
      ),
      armonia: pasos(
        'E4 G4 C5 E5 C5 G4 E4 G4 E4 G4 C5 E5 G5 E5 C5 G4',
        'C4 E4 A4 C5 A4 E4 C4 E4 C4 E4 A4 C5 E5 C5 A4 E4',
        'F4 A4 C5 F5 C5 A4 F4 A4 F4 A4 C5 F5 C5 A4 F4 A4',
        'G4 B4 D5 G5 D5 B4 G4 B4 G4 B4 D5 F5 D5 B4 G4 B4',
        'E4/G4/C5 ~ _ E4/G4/C5 ~ _ G4 C5 E4/G4/C5 ~ _ G4 E5 C5 G4 E4',
        'C4/E4/A4 ~ _ C4/E4/A4 ~ _ E4 A4 C4/E4/A4 ~ _ E4 C5 A4 E4 C4',
        'F4/A4/C5 ~ _ F4/A4/C5 ~ _ A4 F4 D4/F#4/A4 ~ _ D4/F#4/A4 ~ _ A4 F#4',
        'G4/B4/D5 ~ _ G4/B4/F5 ~ _ D5 B4 C5/E5/G5 ~ ~ ~ _ G4 E4 C4'
      ),
      bajo: pasos(
        'C2 C3 G2 C3 C2 C3 G2 E2 C2 C3 G2 C3 B2 A2 G2 E2',
        'A2 A3 E2 A2 A2 A3 E2 G2 A2 A3 E2 A2 G2 F2 E2 D2',
        'F2 F3 C2 F2 F2 F3 C2 E2 F2 F3 C2 F2 G2 A2 Bb2 B2',
        'G2 G3 D2 G2 G2 G3 D2 F2 G2 G3 D2 G2 F2 D2 B2 G2',
        'C2 C3 C2 C3 G2 C3 E2 G2 C2 C3 C2 C3 G2 C3 B2 G2',
        'A2 A3 A2 A3 E2 A2 C3 E2 A2 A3 A2 A3 G2 F2 E2 D2',
        'F2 F3 F2 C3 F2 F3 C3 A2 D2 D3 D2 A2 D2 F#2 A2 D3',
        'G2 G3 D2 G2 G2 A2 B2 D3 C2 C3 G2 C3 C2 E2 G2 B2'
      ),
      percusion: pasos(
        'K H H H S H K H K K H O S H H T',
        'K H H H S H K H K H O H S T T H',
        'K H H H S H K H K K H O S H K T',
        'K S H H S H K T K S T T K O S H',
        'K H O H S H K H K K H O S H T T',
        'K H O H S H K H K K H O S T S T',
        'K H H H S H K H K H H H S T T K',
        'K S H K S T T T K . S H K T T S'
      )
    }
  },
  // 6. Domo Aéreo: estilo Star Fox / Captain Tsubasa espacial (154 BPM, 128 semicorcheas)
  cielo_snes: {
    id: 'cielo_snes',
    titulo: 'Star Wing Horizon',
    modo: 'conduccion',
    bpm: 154,
    subdivision: 4,
    instrumentos: {
      melodia: {
        tipo: 'square',
        duracion: 0.14,
        volumen: 0.046,
        filtro: 3100,
        unison: true,
        vibrato: true,
        slideEntrada: true
      },
      armonia: {
        tipo: 'sawtooth',
        duracion: 0.12,
        volumen: 0.032,
        filtro: 2100,
        unison: true
      },
      bajo: {
        tipo: 'sawtooth',
        duracion: 0.10,
        volumen: 0.054,
        filtro: 720,
        envolventeFiltro: true
      }
    },
    canales: {
      melodia: pasos(
        'D5 ~ ~ ~ A5 ~ F5 ~ D5 ~ E5 F5 G5 ~ F5 E5',
        'F5 ~ ~ ~ D6 ~ Bb5 ~ F5 ~ G5 A5 Bb5 ~ A5 G5',
        'G5 ~ ~ ~ E6 ~ C6 ~ G5 ~ A5 Bb5 C6 ~ Bb5 A5',
        'A5 ~ C#6 ~ E6 ~ ~ ~ G6 ~ F6 E6 C#6 ~ A5 ~',
        'D6 ~ ~ ~ A5 ~ F5 ~ D6 ~ E6 F6 G6 ~ F6 E6',
        'F6 ~ ~ ~ D6 ~ Bb5 ~ G5 ~ A5 Bb5 D6 ~ C6 Bb5',
        'A5 ~ C6 ~ F6 ~ E6 D6 C#6 ~ A5 ~ E6 ~ G6 F6',
        'E6 ~ C#6 ~ A5 ~ G5 E5 D5 ~ ~ ~ A5 ~ F5 ~'
      ),
      armonia: pasos(
        'D4/F4/A4 ~ ~ ~ _ D4 F4 A4 D4/F4/A4 ~ ~ ~ _ A4 F4 D4',
        'D4/F4/Bb4 ~ ~ ~ _ F4 Bb4 D5 D4/F4/Bb4 ~ ~ ~ _ D5 Bb4 F4',
        'E4/G4/C5 ~ ~ ~ _ G4 C5 E5 E4/G4/C5 ~ ~ ~ _ C5 A4 E4',
        'C#4/E4/A4 ~ ~ ~ _ E4 A4 C#5 C#4/E4/A4 ~ _ E4/G4/C#5 ~ ~ A4 E4',
        'F4/A4/D5 ~ _ F4/A4/D5 ~ _ A4 F4 E4/G4/C5 ~ _ E4/G4/C5 ~ _ G4 E4',
        'F4/Bb4/D5 ~ _ F4/Bb4/D5 ~ _ Bb4 F4 D4/G4/Bb4 ~ _ D4/G4/Bb4 ~ _ Bb4 G4',
        'F4/A4/D5 ~ _ A4 F4 D4/G4/Bb4 ~ _ E4/A4/C#5 ~ ~ ~ _ A4 C#5 E5',
        'G4/C#5/E5 ~ _ E4 C#4 A4 ~ _ D4/F4/A4 ~ ~ ~ _ A4 F4 D4'
      ),
      bajo: pasos(
        'D2 D3 D2 D3 D2 A2 D3 A2 D2 D3 D2 D3 C3 A2 F2 D2',
        'Bb2 Bb3 Bb2 Bb3 Bb2 F2 Bb2 D3 Bb2 Bb3 F2 Bb2 A2 G2 F2 D2',
        'C2 C3 C2 C3 C2 G2 C3 G2 A2 A3 E2 A2 G2 F2 E2 C2',
        'A2 A3 E2 A2 A2 E2 A2 C#3 A2 A3 G2 E2 C#3 B2 A2 G2',
        'D2 D3 D2 D3 D2 A2 D3 A2 C2 C3 C2 C3 C2 G2 C3 G2',
        'Bb2 Bb3 Bb2 Bb3 Bb2 F2 Bb2 F2 G2 G3 G2 G3 G2 D2 G2 Bb2',
        'D2 D3 A2 D3 G2 G3 D2 G2 A2 A3 E2 A2 A2 C#3 E3 A3',
        'A2 E2 A2 C#3 E3 C#3 A2 E2 D2 D3 A2 D3 D2 F2 A2 C3'
      ),
      percusion: pasos(
        'K H K H S H K T K K H O S T T H',
        'K H K H S H K T K K H O S T S T',
        'K H H H S H K H K K H O S T T S',
        'K S K S T T T T K S K S T T K .',
        'K H O H S H K K K H O H S T T H',
        'K H O H S H K K K K H O S T T S',
        'K H S H K K S H K S T T K S T T',
        'K S K S T T T T K . S H K T T S'
      )
    }
  }
};
