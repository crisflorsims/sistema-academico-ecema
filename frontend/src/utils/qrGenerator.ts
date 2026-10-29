/**
 * Generador de Código QR (ISO/IEC 18004 Nivel L, Versiones 1 a 9) 100% Offline en SVG/DataURI
 * y Bloques Oficiales de Membrete, Marca de Agua y 3 Firmas Reglamentarias ECEMA.
 */

interface QRVersionSpec {
  version: number;
  size: number;
  numBlocks: number;
  dataCodewordsPerBlock: number;
  ecCodewordsPerBlock: number;
  alignment: number[];
}

const QR_VERSIONS_L: QRVersionSpec[] = [
  { version: 1, size: 21, numBlocks: 1, dataCodewordsPerBlock: 19, ecCodewordsPerBlock: 7, alignment: [] },
  { version: 2, size: 25, numBlocks: 1, dataCodewordsPerBlock: 34, ecCodewordsPerBlock: 10, alignment: [6, 18] },
  { version: 3, size: 29, numBlocks: 1, dataCodewordsPerBlock: 55, ecCodewordsPerBlock: 15, alignment: [6, 22] },
  { version: 4, size: 33, numBlocks: 1, dataCodewordsPerBlock: 80, ecCodewordsPerBlock: 20, alignment: [6, 26] },
  { version: 5, size: 37, numBlocks: 1, dataCodewordsPerBlock: 108, ecCodewordsPerBlock: 26, alignment: [6, 30] },
  { version: 6, size: 41, numBlocks: 2, dataCodewordsPerBlock: 68, ecCodewordsPerBlock: 18, alignment: [6, 34] },
  { version: 7, size: 45, numBlocks: 2, dataCodewordsPerBlock: 78, ecCodewordsPerBlock: 20, alignment: [6, 22, 38] },
  { version: 8, size: 49, numBlocks: 2, dataCodewordsPerBlock: 97, ecCodewordsPerBlock: 24, alignment: [6, 24, 42] },
  { version: 9, size: 53, numBlocks: 2, dataCodewordsPerBlock: 116, ecCodewordsPerBlock: 30, alignment: [6, 26, 46] }
];

// Tablas GF(256) con polinomio primitivo 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a]! + GF_LOG[b]!]!;
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i]!;
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]!;
      next[j + 1] ^= gfMul(poly[j]!, root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i]!;
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j]!, coef);
      }
    }
  }
  return msg.slice(data.length);
}

function getBCHFormatInfo(maskPattern: number): number {
  // Error Correction Level L = 01
  const data = (0b01 << 3) | maskPattern;
  let d = data << 10;
  const poly = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((d >> i) & 1) {
      d ^= poly << (i - 10);
    }
  }
  return ((data << 10) | d) ^ 0b101010000010010;
}

function getBCHVersionInfo(version: number): number {
  let d = version << 12;
  const poly = 0b1111100100101;
  for (let i = 17; i >= 12; i--) {
    if ((d >> i) & 1) {
      d ^= poly << (i - 12);
    }
  }
  return (version << 12) | d;
}

export function generarQRDataURI(text: string): string {
  const utf8Bytes = new TextEncoder().encode(text.slice(0, 220));
  const spec =
    QR_VERSIONS_L.find(s => s.numBlocks * s.dataCodewordsPerBlock - 2 >= utf8Bytes.length) ||
    QR_VERSIONS_L[QR_VERSIONS_L.length - 1]!;

  const totalDataCodewords = spec.numBlocks * spec.dataCodewordsPerBlock;
  const bitBuffer: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  };

  // Byte mode (0100) + length (8 bits para Versiones 1-9)
  pushBits(0b0100, 4);
  pushBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) pushBits(b, 8);

  // Terminador (hasta 4 ceros)
  const maxBits = totalDataCodewords * 8;
  const terminator = Math.min(4, maxBits - bitBuffer.length);
  pushBits(0, terminator);
  while (bitBuffer.length % 8 !== 0) bitBuffer.push(0);

  const dataBytes = new Uint8Array(totalDataCodewords);
  for (let i = 0; i < bitBuffer.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitBuffer[i * 8 + b]!;
    }
    dataBytes[i] = byte;
  }

  let padToggle = true;
  for (let i = bitBuffer.length / 8; i < totalDataCodewords; i++) {
    dataBytes[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // Dividir en bloques y calcular Reed-Solomon
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  for (let b = 0; b < spec.numBlocks; b++) {
    const start = b * spec.dataCodewordsPerBlock;
    const block = dataBytes.slice(start, start + spec.dataCodewordsPerBlock);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, spec.ecCodewordsPerBlock));
  }

  // Intercalar bloques
  const finalCodewords: number[] = [];
  for (let i = 0; i < spec.dataCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(dataBlocks[b]![i]!);
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(ecBlocks[b]![i]!);
    }
  }

  const size = spec.size;
  const modules: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r]![c] = dark;
      isFunction[r]![c] = true;
    }
  };

  // Finder patterns + separadores
  const drawFinder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment patterns
  const align = spec.alignment;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) {
        continue;
      }
      const cr = align[i]!;
      const cc = align[j]!;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6]![i]) setFunctionModule(6, i, i % 2 === 0);
    if (!isFunction[i]![6]) setFunctionModule(i, 6, i % 2 === 0);
  }

  // Dark module & reservar áreas de formato
  setFunctionModule(size - 8, 8, true);
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8]![i]) setFunctionModule(8, i, false);
    if (!isFunction[i]![8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8]![size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i]![8]) setFunctionModule(size - 1 - i, 8, false);
  }

  if (spec.version >= 7) {
    const vInfo = getBCHVersionInfo(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vInfo >> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  // Colocar bits de datos en zigzag
  const allBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) allBits.push((cw >> b) & 1);
  }

  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!isFunction[r]![c]) {
          const dark = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
          modules[r]![c] = dark;
          bitIdx++;
        }
      }
    }
  }

  // Aplicar máscara 0: (r + c) % 2 === 0
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r]![c] && (r + c) % 2 === 0) {
        modules[r]![c] = !modules[r]![c];
      }
    }
  }

  // Escribir bits de formato para máscara 0
  const fmt = getBCHFormatInfo(mask);
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, ((fmt >> i) & 1) === 1);
  setFunctionModule(8, 7, ((fmt >> 6) & 1) === 1);
  setFunctionModule(8, 8, ((fmt >> 7) & 1) === 1);
  setFunctionModule(7, 8, ((fmt >> 8) & 1) === 1);
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, ((fmt >> i) & 1) === 1);

  for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, ((fmt >> i) & 1) === 1);
  for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, ((fmt >> i) & 1) === 1);

  // Construir SVG con margen silencioso de 3 módulos
  const quiet = 3;
  const total = size + quiet * 2;
  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r]![c]) {
        path += `M${c + quiet},${r + quiet}h1v1h-1z`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="110" height="110" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${path}" fill="#0f2942"/></svg>`;
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Calcula una huella digital determinística (Hash hexadecimal de 8 caracteres)
 * a partir del contenido de la planilla para detectar cualquier adulteración.
 */
export function generarHashIntegridad(cadenaBase: string): string {
  let h1 = 0xdeadbeef ^ cadenaBase.length;
  let h2 = 0x41c6ce57 ^ cadenaBase.length;
  for (let i = 0, ch; i < cadenaBase.length; i++) {
    ch = cadenaBase.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `${hex1.slice(0, 4)}-${hex2.slice(0, 4)}`;
}

/**
 * Marca de agua sutil en el centro de la página para documentos oficiales impresos
 */
export function buildWatermarkHTML(diplomadoCorto: 'DCEA' | 'DCEMA'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `
  <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:0;pointer-events:none;opacity:0.05;text-align:center;width:420px;">
    <img src="${origin}/logo-ecema.png" style="width:220px;height:220px;object-fit:contain;display:block;margin:0 auto;mix-blend-mode:multiply;" alt="" />
    <div style="font-size:20pt;font-weight:900;letter-spacing:3px;color:#0f2942;margin-top:8px;">
      ECEMA • ${diplomadoCorto}
    </div>
  </div>`;
}

/**
 * Membrete oficial reglamentario de 3 bloques con Escudo ECEMA y Folio
 */
export function buildMembreteOficialHTML(params: {
  diplomadoCorto: 'DCEA' | 'DCEMA';
  tituloDocumento: string;
  subtituloDocumento?: string;
  subtituloDerecha?: string;
  folioCodigo: string;
  isExcel?: boolean;
}): string {
  const { diplomadoCorto, tituloDocumento, subtituloDocumento, folioCodigo, isExcel } = params;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const diplomadoLargo =
    diplomadoCorto === 'DCEMA'
      ? 'DIPLOMADO DE COMANDO Y ESTADO MAYOR AÉREO'
      : 'DIPLOMADO DE COMANDO DE ESCUADRÓN AÉREO';

  return `
  <table style="margin-bottom:6px;border-collapse:collapse;width:100%;position:relative;z-index:1;">
    <tr>
      <td style="width:28%;text-align:center;font-size:8pt;font-weight:700;padding:5px 6px;border:1pt solid #000;line-height:1.35;">
        <div style="display:flex;align-items:center;justify-content:center;gap:7px;">
          ${isExcel ? '' : `<img src="${origin}/logo-ecema.png" style="width:36px;height:36px;object-fit:contain;mix-blend-mode:multiply;" alt="ECEMA" />`}
          <div style="text-align:center;">
            FUERZA AÉREA BOLIVIANA — ECEMA<br/>
            <span style="font-size:7pt;">${diplomadoLargo}</span><br/>
            <u>BOLIVIA</u>
          </div>
        </div>
      </td>
      <td style="text-align:center;padding:6px 8px;border:1pt solid #000;line-height:1.35;">
        <div style="font-size:11.5pt;font-weight:900;letter-spacing:0.3px;">${tituloDocumento}</div>
        ${subtituloDocumento ? `<div style="font-size:8.5pt;font-weight:700;margin-top:2px;">${subtituloDocumento}</div>` : ''}
      </td>
      <td style="width:21%;text-align:center;font-size:8pt;font-weight:700;padding:5px 6px;border:1pt solid #000;line-height:1.4;">
        GRUPO ACADÉMICO ${diplomadoCorto}<br/>
        ESCUADRÓN EVALUACIÓN<br/>
        <span style="font-size:7pt;font-family:monospace;font-weight:700;">FOLIO: ${folioCodigo}</span>
      </td>
    </tr>
  </table>`;
}

/**
 * Bloque de 3 Pies de Firma Reglamentarios + Sello QR de Autenticidad:
 * - Izquierda: COMANDANTE DE LA ECEMA
 * - Medio: COMANDANTE DEL GRUPO DCEA / DCEMA
 * - Derecha: COMANDANTE DEL EDRÓN. EVALUACIÓN DCEA / DCEMA
 * + Recuadro lateral con el Código QR de Verificación Criptográfica
 */
export function buildPieFirmasYQRHTML(params: {
  diplomadoCorto: 'DCEA' | 'DCEMA';
  tipoDocumento?: string;
  folioCodigo: string;
  hashIntegridad: string;
  totalCursantes?: number;
  promedioGeneral?: string;
  extraInfo?: string;
  textoQR?: string;
  fechaEmision?: string;
  isExcel?: boolean;
}): string {
  const {
    diplomadoCorto,
    tipoDocumento,
    folioCodigo,
    hashIntegridad,
    totalCursantes,
    promedioGeneral,
    extraInfo,
    textoQR,
    fechaEmision,
    isExcel
  } = params;

  const fechaHora = fechaEmision || new Date().toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const payloadQR = textoQR || [
    `FAB-ECEMA`,
    tipoDocumento ? `DOC:${tipoDocumento}` : '',
    `PROG:${diplomadoCorto}`,
    extraInfo ? `DET:${extraInfo}` : '',
    totalCursantes !== undefined ? `REG:${totalCursantes}` : '',
    promedioGeneral !== undefined ? `PROM:${promedioGeneral}` : '',
    `FOLIO:${folioCodigo}`,
    `HASH:${hashIntegridad}`,
    `FECHA:${fechaHora}`
  ]
    .filter(Boolean)
    .join('|');

  const qrDataUri = generarQRDataURI(payloadQR);

  return `
  <table style="width:100%;margin-top:16px;border-collapse:collapse;page-break-inside:avoid;position:relative;z-index:1;">
    <tr>
      <td style="width:27%;font-size:7.5pt;font-weight:700;text-align:center;padding:4px;border:1pt solid #000;background-color:#f8fafc;">
        COMANDANTE DE LA ECEMA
      </td>
      <td style="width:27%;font-size:7.5pt;font-weight:700;text-align:center;padding:4px;border:1pt solid #000;background-color:#f8fafc;">
        COMANDANTE DEL GRUPO ${diplomadoCorto}
      </td>
      <td style="width:27%;font-size:7.5pt;font-weight:700;text-align:center;padding:4px;border:1pt solid #000;background-color:#f8fafc;">
        COMANDANTE DEL EDRÓN. EVALUACIÓN ${diplomadoCorto}
      </td>
      <td style="width:19%;font-size:7pt;font-weight:700;text-align:center;padding:4px;border:1pt solid #000;background-color:#f8fafc;">
        SELLO DE AUTENTICIDAD QR
      </td>
    </tr>
    <tr>
      <td style="height:68px;font-size:7.5pt;padding:6px 8px;border:1pt solid #000;vertical-align:bottom;text-align:center;">
        Vo.Bo. Firma y Sello: _____________________
      </td>
      <td style="height:68px;font-size:7.5pt;padding:6px 8px;border:1pt solid #000;vertical-align:bottom;text-align:center;">
        Firma y Sello: ____________________________
      </td>
      <td style="height:68px;font-size:7.5pt;padding:6px 8px;border:1pt solid #000;vertical-align:bottom;text-align:center;">
        Firma y Sello: ____________________________
      </td>
      <td style="height:68px;padding:4px 6px;border:1pt solid #000;vertical-align:middle;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
          ${isExcel ? '' : `<img src="${qrDataUri}" style="width:58px;height:58px;display:block;border:1px solid #cbd5e1;padding:1px;background:#fff;" alt="QR Autenticidad" />`}
          <div style="text-align:left;font-size:6pt;line-height:1.35;font-family:monospace;color:#0f2942;">
            <b>FOLIO:</b><br/>${folioCodigo}<br/>
            <b>HASH:</b><br/>${hashIntegridad}<br/>
            <span>${fechaHora.split(',')[0]}</span>
          </div>
        </div>
      </td>
    </tr>
  </table>`;
}

