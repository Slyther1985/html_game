import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.join(__dirname, 'js');
const salidaPath = path.join(__dirname, 'MAPA_SIMBOLOS.md');

/**
 * Escanea sentencias import (de una o varias líneas) preservando la línea de inicio.
 */
function extraerImports(lineas) {
  const imports = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];
    if (/^import\b/.test(linea)) {
      const lineaInicio = i + 1;
      let bloque = linea.trim();
      while (!bloque.includes(';') && i + 1 < lineas.length) {
        i++;
        bloque += ' ' + lineas[i].trim();
      }
      const match = bloque.match(/^import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const crudo = match[1]
          .replace(/[{}]/g, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', ');
        imports.push({ linea: lineaInicio, simbolos: crudo, origen: match[2] });
      }
    }
    i++;
  }

  return imports;
}

/**
 * Extrae símbolos exportados, declaraciones internas de nivel superior
 * y entradas de catálogo (TABLA_CARROCERIAS / TABLA_PIEZAS).
 */
function analizarModulo(archivo) {
  const ruta = path.join(jsDir, archivo);
  const contenido = fs.readFileSync(ruta, 'utf8');
  const lineas = contenido.split(/\r?\n/);

  const imports = extraerImports(lineas);
  const exportsList = [];
  const internos = [];
  const catalogo = [];
  let tablaActual = null;

  for (let idx = 0; idx < lineas.length; idx++) {
    const numLinea = idx + 1;
    const raw = lineas[idx];
    const trim = raw.trim();

    if (!trim || trim.startsWith('//') || trim.startsWith('/*') || trim.startsWith('*')) {
      continue;
    }

    // Declaraciones exportadas en nivel superior
    const mExpFunc = raw.match(/^export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/);
    if (mExpFunc) {
      exportsList.push({
        linea: numLinea,
        tipo: mExpFunc[1] ? 'async function' : 'function',
        nombre: mExpFunc[2],
        firma: `${mExpFunc[2]}(${mExpFunc[3].trim()})`
      });
      continue;
    }

    const mExpVar = raw.match(/^export\s+(const|let|var|class)\s+([A-Za-z0-9_$]+)/);
    if (mExpVar) {
      const nombre = mExpVar[2];
      if (nombre === 'TABLA_CARROCERIAS' || nombre === 'TABLA_PIEZAS') {
        tablaActual = nombre;
      }
      exportsList.push({
        linea: numLinea,
        tipo: mExpVar[1],
        nombre,
        firma: nombre
      });
      continue;
    }

    const mExpList = raw.match(/^export\s*\{([^}]+)\}/);
    if (mExpList) {
      const nombres = mExpList[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const n of nombres) {
        exportsList.push({ linea: numLinea, tipo: 'export', nombre: n, firma: n });
      }
      continue;
    }

    // Declaraciones internas en columna 0 (nivel de módulo)
    const mIntFunc = raw.match(/^(async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/);
    if (mIntFunc) {
      internos.push({
        linea: numLinea,
        tipo: mIntFunc[1] ? 'async function' : 'function',
        nombre: mIntFunc[2],
        firma: `${mIntFunc[2]}(${mIntFunc[3].trim()})`
      });
      continue;
    }

    const mIntVar = raw.match(/^(const|let|var|class)\s+([A-Za-z0-9_$]+)/);
    if (mIntVar) {
      internos.push({
        linea: numLinea,
        tipo: mIntVar[1],
        nombre: mIntVar[2],
        firma: mIntVar[2]
      });
      continue;
    }

    // Ítems dentro de TABLA_CARROCERIAS / TABLA_PIEZAS en catalogoPiezas.js
    if (tablaActual) {
      const mId = raw.match(/^\s{4}id:\s*'([^']+)'/);
      if (mId) {
        let nombreItem = '';
        for (let j = idx + 1; j < Math.min(idx + 6, lineas.length); j++) {
          const mNom = lineas[j].match(/^\s{4}nombre:\s*'([^']+)'/);
          if (mNom) {
            nombreItem = mNom[1];
            break;
          }
        }
        catalogo.push({
          linea: numLinea,
          tabla: tablaActual,
          id: mId[1],
          nombre: nombreItem
        });
      }
    }
  }

  return {
    archivo,
    totalLineas: lineas.length,
    imports,
    exportsList,
    internos,
    catalogo
  };
}

function generarMarkdown(modulos) {
  const out = [];
  out.push('# Mapa de Símbolos (`js/*.js`)');
  out.push('');
  out.push('> Generado automáticamente con `node generar_mapa.mjs`. No editar a mano; volver a ejecutar el script tras modificar cualquier módulo.');
  out.push('');
  out.push('## Resumen de Módulos');
  out.push('');
  out.push('| Módulo | Líneas | Exportaciones clave |');
  out.push('| :--- | ---: | :--- |');
  for (const mod of modulos) {
    const expNames = mod.exportsList.map((e) => `\`${e.nombre}\` (L${e.linea})`).join(', ') || '— (punto de entrada)';
    out.push(`| \`js/${mod.archivo}\` | ${mod.totalLineas} | ${expNames} |`);
  }
  out.push('');

  for (const mod of modulos) {
    out.push(`---`);
    out.push(`## \`js/${mod.archivo}\` (${mod.totalLineas} líneas)`);
    out.push('');

    out.push('### Imports');
    if (mod.imports.length === 0) {
      out.push('- Sin imports locales.');
    } else {
      for (const imp of mod.imports) {
        out.push(`- **L${imp.linea}** desde \`${imp.origen}\`: ${imp.simbolos}`);
      }
    }
    out.push('');

    out.push('### Exports');
    if (mod.exportsList.length === 0) {
      out.push('- Sin exports (módulo de arranque).');
    } else {
      out.push('| Línea | Tipo | Símbolo | Firma |');
      out.push('| ---: | :--- | :--- | :--- |');
      for (const exp of mod.exportsList) {
        out.push(`| ${exp.linea} | \`${exp.tipo}\` | \`${exp.nombre}\` | \`${exp.firma}\` |`);
      }
    }
    out.push('');

    if (mod.internos.length > 0) {
      out.push('### Símbolos Internos (Nivel Superior)');
      out.push('| Línea | Tipo | Símbolo | Firma |');
      out.push('| ---: | :--- | :--- | :--- |');
      for (const intr of mod.internos) {
        out.push(`| ${intr.linea} | \`${intr.tipo}\` | \`${intr.nombre}\` | \`${intr.firma}\` |`);
      }
      out.push('');
    }

    if (mod.catalogo.length > 0) {
      out.push('### Entradas de Catálogo');
      out.push('| Línea | Tabla | ID | Nombre |');
      out.push('| ---: | :--- | :--- | :--- |');
      for (const item of mod.catalogo) {
        out.push(`| ${item.linea} | \`${item.tabla}\` | \`${item.id}\` | ${item.nombre} |`);
      }
      out.push('');
    }
  }

  return out.join('\n');
}

const archivos = fs
  .readdirSync(jsDir)
  .filter((f) => f.endsWith('.js'))
  .sort((a, b) => a.localeCompare(b));

const modulosAnalizados = archivos.map(analizarModulo);
const markdown = generarMarkdown(modulosAnalizados);
fs.writeFileSync(salidaPath, markdown, 'utf8');

console.log(`MAPA_SIMBOLOS.md generado (${modulosAnalizados.length} módulos escaneados).`);
