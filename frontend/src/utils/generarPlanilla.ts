import {
  buildMembreteOficialHTML,
  buildPieFirmasYQRHTML,
  buildWatermarkHTML,
  generarHashIntegridad
} from './qrGenerator';

interface CursantePlanilla {
  grado: string;
  nombre: string;
  apellido: string;
  notas: Record<string, number>;
  notaFinal: number | null;
  obsGlobal: string;
}

interface PlanillaData {
  tipoPlanilla?: 'DOCENTE' | 'EVALUADOR';
  docenteNombre: string;
  asignatura: string;
  area: string;
  fecha: string;
  diplomado: string;
  cursantes: any[];
}

const CR = [
  {id:1,n:"PARTICIPACIÓN", e:"Interviene voluntariamente en ≥90% de sesiones...", mb:"Interviene en ≥80%...", b:"Interviene en ≥70%...", r:"Interviene en ≥60%...", i:"Interviene en <60%..."},
  {id:2,n:"CUMPLIMIENTO DE TAREAS", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:3,n:"EXPOSICIONES", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:4,n:"CALIDAD DE RESPUESTAS", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:5,n:"TRABAJO EN EQUIPO", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:6,n:"INTEGRIDAD", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:7,n:"DISCIPLINA", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:8,n:"COMPROMISO", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:9,n:"EXCELENCIA", e:"...", mb:"...", b:"...", r:"...", i:"..."},
  {id:10,n:"VOCACIÓN DE SERVICIO", e:"...", mb:"...", b:"...", r:"...", i:"..."}
];

export function buildPlanillaHTML(data: PlanillaData, isExcel: boolean = false): string {
  const { tipoPlanilla, docenteNombre, asignatura, area, fecha, diplomado, cursantes } = data;
  const asigArea = area ? `${asignatura} — ${area}` : asignatura;
  
  const diplomadoCorto: 'DCEA' | 'DCEMA' = diplomado?.toUpperCase().includes('DCEMA') ? 'DCEMA' : 'DCEA';

  if (tipoPlanilla === 'EVALUADOR') {
    return buildActaEvaluadorHTML(data, isExcel);
  }

  const curEvaluados = cursantes.filter(c => c.notaFinal !== null && c.notaFinal > 0);
  let sg = 0, cg = 0;
  const huellaParts: string[] = [diplomadoCorto, asignatura || '', String(cursantes.length)];
  curEvaluados.forEach(c => {
    if (c.notaFinal !== null) {
      sg += c.notaFinal;
      cg++;
      huellaParts.push(`${c.apellido || ''}:${c.notaFinal.toFixed(2)}`);
    }
  });
  const pg = cg > 0 ? (sg / cg).toFixed(2) : '';
  const hashIntegridad = generarHashIntegridad(huellaParts.join('|'));
  const folioCodigo = `${diplomadoCorto}-${new Date().getFullYear()}-AD-${hashIntegridad.slice(0, 4)}`;

  const cabecera =
    buildMembreteOficialHTML({
      diplomadoCorto,
      tituloDocumento: `PLANILLA DE CALIFICACIÓN DOCENTE — ${diplomadoCorto}`,
      subtituloDocumento: asigArea,
      folioCodigo
    }) +
    `<table style="margin-bottom:3px;border-collapse:collapse;width:100%">
      <tr>
        <td style="width:20%;font-weight:700;font-size:8.5pt;padding:3px 6px;border:1pt solid #000">DOCENTE / CATEDRÁTICO:</td>
        <td style="width:40%;font-size:8.5pt;padding:3px 6px;border:1pt solid #000">${docenteNombre}</td>
        <td style="width:13%;font-weight:700;font-size:8.5pt;padding:3px 6px;border:1pt solid #000">ASIGNATURA / ÁREA:</td>
        <td style="width:18%;font-size:8.5pt;padding:3px 6px;border:1pt solid #000">${asigArea}</td>
        <td style="width:4%;font-weight:700;font-size:8.5pt;padding:3px 6px;border:1pt solid #000">FECHA:</td>
        <td style="font-size:8.5pt;padding:3px 6px;border:1pt solid #000">${fecha}</td>
      </tr>
    </table>`;

  const escala=`
  <table style="margin-bottom:3px;border-collapse:collapse;width:100%">
    <tr>
      <td colspan="5" style="font-weight:700;font-size:8pt;padding:3px 5px;border:1pt solid #000">ESCALA DE VALORACIÓN — ${diplomadoCorto} (Art. 31, Reglamento de Evaluación Académica ECEMA)</td>
    </tr>
    <tr>
      <td style="text-align:center;font-size:8pt;font-weight:700;padding:3px;border:1pt solid #000">EXCELENTE: 95.00 – 100</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;padding:3px;border:1pt solid #000">MUY BUENO: 90.00 – 94.99</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;padding:3px;border:1pt solid #000">BUENO: 85.00 – 89.99</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;padding:3px;border:1pt solid #000">REGULAR: 75.00 – 84.99</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;padding:3px;border:1pt solid #000">INSUFICIENTE: 10.00 – 74.99</td>
    </tr>
  </table>`;

  const firmas =
    buildPieFirmasYQRHTML({
      diplomadoCorto,
      tipoDocumento: 'APRECIACION_DOCENTE',
      folioCodigo,
      hashIntegridad,
      totalCursantes: cursantes.length,
      promedioGeneral: pg || 'S/P',
      extraInfo: (asignatura || '').slice(0, 35)
    }) +
    `<p style="font-size:6.5pt;font-style:italic;margin-top:3px;text-align:left">NOTA REGLAMENTARIA: Planilla de Apreciación Docente — 10% de la nota final de asignatura (Art. 16 Reglamento de Evaluación ECEMA).</p>`;

  function makeTablaRow(c: CursantePlanilla, numFila: number){
    const celdas = CR.map(cr => {
      const v = c.notas[cr.id];
      const vFormat = v !== undefined && v !== null ? Number(v).toFixed(2) : '';
      return `<td style="text-align:center;font-size:7pt;font-weight:700;border:1pt solid #000">${vFormat}</td>`;
    }).join('');
    
    const notaFinal = `<td style="text-align:center;font-size:7.5pt;font-weight:900;border:1pt solid #000">${c.notaFinal ? c.notaFinal.toFixed(2) : '—'}</td>`;
    
    return `<tr>
      <td style="text-align:center;font-size:7pt;font-weight:700;border:1pt solid #000;padding:1px 2px">${numFila}</td>
      <td style="font-size:7pt;border:1pt solid #000;padding:1px 3px">${c.grado || ''}</td>
      <td style="font-size:7pt;border:1pt solid #000;padding:1px 3px">${c.apellido} ${c.nombre}</td>
      ${celdas}${notaFinal}</tr>`;
  }

  // Promedios
  const pC = CR.map(cr => {
    let s = 0, cn = 0;
    curEvaluados.forEach(c => {
      if (c.notas[cr.id] !== undefined && c.notas[cr.id] !== null) {
        s += c.notas[cr.id];
        cn++;
      }
    });
    return `<td style="text-align:center;font-size:7pt;font-weight:700;border:1pt solid #000">${cn > 0 ? (s/cn).toFixed(2) : ''}</td>`;
  }).join('');

  const encTablaHdr=`
  <table style="border-collapse:collapse;width:100%;margin-bottom:1px">
    <thead>
      <tr>
        <td colspan="13" style="text-align:center;font-size:7.5pt;font-weight:700;padding:2px;border:1pt solid #000">
          CRITERIOS DE EVALUACIÓN INTEGRAL DEL CURSANTE (10 pts c/u) — EXCELENTE (9.5-10) / MUY BUENO (9.0-9.4) / BUENO (8.5-8.9) / REGULAR (7.5-8.4) / INSUFICIENTE (1–7.4)
        </td>
        <td style="text-align:center;font-size:7pt;font-weight:700;padding:2px;border:1pt solid #000">NOTA FINAL/100</td>
      </tr>
      <tr>
        <td style="text-align:center;font-size:6.5pt;font-weight:700;width:3%;border:1pt solid #000;padding:2px">N°</td>
        <td style="text-align:center;font-size:6.5pt;font-weight:700;width:8%;border:1pt solid #000;padding:2px">GRADO</td>
        <td style="text-align:center;font-size:6.5pt;font-weight:700;width:19%;border:1pt solid #000;padding:2px">APELLIDO Y NOMBRE</td>
        ${CR.map(cr=>`<td style="text-align:center;font-size:5.5pt;font-weight:700;border:1pt solid #000;padding:1px">${cr.n.split(' ').join('<br>')}<br>/10</td>`).join('')}
        <td style="text-align:center;font-size:6.5pt;font-weight:700;border:1pt solid #000;padding:2px">SUMA<br>TOTAL</td>
      </tr>
    </thead><tbody>`;

  const encTablaClose=`
      <tr>
        <td colspan="3" style="font-weight:700;font-size:7pt;text-align:right;padding:2px 4px;border:1pt solid #000">PROMEDIO DEL GRUPO:</td>
        ${pC}
        <td style="text-align:center;font-size:7.5pt;font-weight:900;border:1pt solid #000">${pg}</td>
      </tr>
    </tbody></table>`;

  const todasObs = curEvaluados
    .filter(c => c.obsGlobal && c.obsGlobal.trim() !== '')
    .map(c => `${c.grado || ''} ${c.apellido} ${c.nombre}: ${c.obsGlobal}`)
    .filter(Boolean);

  const obsTextoFinal = todasObs.length > 0 ? todasObs.join('<br>') : '&nbsp;';

  const obsTabla=`
  <table style="margin-top:3px;margin-bottom:2px;border-collapse:collapse;width:100%">
    <tr><td style="font-size:7pt;font-weight:700;padding:2px 4px;border:1pt solid #000">OBSERVACIONES — Justificar obligatoriamente toda nota superior a 95 pts. o inferior a 75 pts. (Art. 25 Reglamento de Evaluación DCEA):</td></tr>
    <tr><td style="font-size:7pt;padding:4px;border:1pt solid #000;white-space:pre-line;min-height:28px">${obsTextoFinal}</td></tr>
  </table>`;

  const POR_PAG = 20; // Ajustado a 20 para optimizar el espacio sin rúbrica inicial
  const totalFilas = cursantes.length;
  const paginas = [];
  for(let i=0; i<totalFilas; i+=POR_PAG){
    paginas.push(cursantes.slice(i, i+POR_PAG));
  }
  if(paginas.length===0) paginas.push([]);

  const totalPags = paginas.length;
  const lastIdx = paginas.length - 1;

  function numPag(n: number, total: number){
    return `<div class="num-pag"><b>${n} - ${total}</b></div>`;
  }

  const paginasHTML = paginas.map((grupo, pi)=>{
    const esFinal = pi === lastIdx;
    const numPagActual = pi + 1;
    const filas = grupo.map((c, fi) => makeTablaRow(c, pi * POR_PAG + fi + 1)).join('');
    
    const cierre = esFinal
      ? encTablaClose + obsTabla + firmas
      : `<tr><td colspan="14" style="text-align:center;font-size:7pt;padding:2px;border:1pt solid #000;font-style:italic">— continúa —</td></tr></tbody></table>`;
      
    return `<div class="${pi === 0 ? 'page-container' : 'page-container pb'}" style="position:relative">
      ${isExcel ? '' : buildWatermarkHTML(diplomadoCorto)}
      <div class="content-wrapper" style="position:relative;z-index:1">
        ${cabecera}${escala}${encTablaHdr}${filas}${cierre}
      </div>
      ${numPag(numPagActual, totalPags)}
    </div>`;
  }).join('\n');

  const htmlPDF=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Planilla Oficial ${diplomadoCorto}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:279mm;font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:279mm 216mm;margin:8mm 10mm 14mm 10mm}
    table{border-collapse:collapse;width:100%}
    td,th{border:1pt solid #000;padding:1px 3px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif}
    .page-container { display: flex; flex-direction: column; min-height: 90vh; }
    .content-wrapper { flex-grow: 1; }
    .pb{page-break-before:always; padding-top:10px}
    .num-pag{text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12pt;font-weight:700;color:#000;margin-top:15px;padding-bottom:5px}
    @media print{
      .page-container { min-height: auto; height: 100%; display: block; }
      .content-wrapper { display: block; }
      .num-pag { margin-top: 20px; }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head><body id="pdf-content">
  ${paginasHTML}
  <script>
    window.onload=function(){
      window.focus();
      const element = document.getElementById('pdf-content');
      const opt = {
        margin:       [0.3, 0.4, 0.5, 0.4],
        filename:     'Planilla_Apreciacion_Docente_${diplomadoCorto}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      // Auto-descarga y luego muestra la ventana de impresión
      html2pdf().set(opt).from(element).save().then(() => {
        setTimeout(function(){window.print();}, 500);
      });
    };
  </script>
  </body></html>`;

  const htmlExcel=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8"><style>
    table{border-collapse:collapse;}
    td,th{border:1pt solid #000;padding:2px 4px;font-family:Arial,sans-serif;font-size:8pt;}
  </style></head><body>${paginasHTML}</body></html>`;

  return isExcel ? htmlExcel : htmlPDF;
}

export function generarPlanillaPDF(data: PlanillaData) {
  const html = buildPlanillaHTML(data, false);
  const win = window.open('', '_blank');
  if(!win){
    alert('El navegador bloqueó la ventana emergente. Por favor permítela e intenta de nuevo.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function generarPlanillaExcel(data: PlanillaData) {
  const htmlStr = buildPlanillaHTML(data, true);
  try {
    const diplomadoCorto = data.diplomado?.toUpperCase().includes('DCEMA') ? 'DCEMA' : 'DCEA';
    const filename = `Planilla_Oficial_${diplomadoCorto}_${new Date().toISOString().split('T')[0]}.xls`;
    
    // Crear un blob de tipo Excel con la codificación correcta
    const blob = new Blob(['\uFEFF' + htmlStr], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error al exportar a Excel:", err);
    alert("Hubo un error al generar el archivo Excel.");
  }
}

// NUEVA FUNCIÓN PARA EL EVALUADOR (ACTA CENTRALIZADORA)
function buildActaEvaluadorHTML(data: PlanillaData, isExcel: boolean = false): string {
  const { asignatura, area, fecha, diplomado, cursantes } = data;
  const asigArea = area ? `${asignatura} — ${area}` : asignatura;
  
  const diplomadoCorto = diplomado?.toUpperCase().includes('DCEMA') ? 'DCEMA' : 'DCEA';
  const fechaEmision = fecha || new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const cadenaIntegridad = `ACTA|${diplomadoCorto}|${asigArea}|${fechaEmision}|` +
    cursantes.map(c => `${c.apellido || ''}:${c.p1 ?? ''}:${c.p2 ?? ''}:${c.fin ?? ''}:${c.apr ?? ''}`).join(';');
  const hashDoc = generarHashIntegridad(cadenaIntegridad);
  const folioDoc = `ECEMA-${diplomadoCorto}-ACTA-${new Date().getFullYear()}-${hashDoc.slice(0, 4)}`;

  const textoQR = [
    `ECEMA-FAB | VERIFICACION OFICIAL`,
    `DOC: PLANILLA CENTRALIZADORA DE NOTAS`,
    `PROG: ${diplomadoCorto}`,
    `MATERIA: ${asignatura.slice(0, 38)}`,
    `CURSANTES: ${cursantes.length}`,
    `FOLIO: ${folioDoc}`,
    `HASH: ${hashDoc}`,
    `FECHA: ${fechaEmision}`,
  ].join('\n');

  const membrete = buildMembreteOficialHTML({
    diplomadoCorto,
    tituloDocumento: `PLANILLA CENTRALIZADORA DE NOTAS — ${diplomadoCorto}`,
    subtituloDerecha: 'ESCUADRÓN EVALUACIÓN',
    folioCodigo: folioDoc,
    isExcel,
  });

  const cabecera = `
  ${membrete}
  <table style="margin-bottom:10px;border-collapse:collapse;width:100%">
    <tr>
      <td style="width:20%;font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">ASIGNATURA / ÁREA:</td>
      <td style="width:50%;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;font-weight:700">${asigArea}</td>
      <td style="width:10%;font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">FECHA:</td>
      <td style="width:20%;font-size:8.5pt;padding:4px 6px;border:1pt solid #000">${fechaEmision}</td>
    </tr>
  </table>`;

  const firmas = buildPieFirmasYQRHTML({
    diplomadoCorto,
    folioCodigo: folioDoc,
    hashIntegridad: hashDoc,
    fechaEmision,
    textoQR,
    isExcel,
  });

  function makeTablaRow(c: any, numFila: number){
    const p1 = c.p1 !== '' && c.p1 !== null ? Number(c.p1).toFixed(2) : '-';
    const p2 = c.p2 !== '' && c.p2 !== null ? Number(c.p2).toFixed(2) : '-';
    const fin = c.fin !== '' && c.fin !== null ? Number(c.fin).toFixed(2) : '-';
    const apr = c.apr !== '' && c.apr !== null ? Number(c.apr).toFixed(2) : '-';

    let prom: number | string = '-';
    if (p1 !== '-' && p2 !== '-' && fin !== '-' && apr !== '-') {
      prom = ((p1 as number) * 0.25) + ((p2 as number) * 0.25) + ((fin as number) * 0.40) + ((apr as number) * 0.10);
      prom = prom.toFixed(2);
    }

    return `<tr>
      <td style="text-align:center;font-size:8pt;font-weight:700;border:1pt solid #000;padding:3px">${numFila}</td>
      <td style="font-size:8pt;border:1pt solid #000;padding:3px">${c.grado || ''}</td>
      <td style="font-size:8pt;border:1pt solid #000;padding:3px">${c.apellido} ${c.nombre}</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;border:1pt solid #000">${p1}</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;border:1pt solid #000">${p2}</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;border:1pt solid #000">${fin}</td>
      <td style="text-align:center;font-size:8pt;font-weight:700;border:1pt solid #000">${apr}</td>
      <td style="text-align:center;font-size:8.5pt;font-weight:900;border:1pt solid #000">${prom}</td>
    </tr>`;
  }

  const encTablaHdr=`
  <table style="border-collapse:collapse;width:100%;margin-bottom:10px">
    <thead>
      <tr style="background-color:#f3f4f6">
        <td style="text-align:center;font-size:7.5pt;font-weight:700;width:4%;border:1pt solid #000;padding:4px">N°</td>
        <td style="text-align:center;font-size:7.5pt;font-weight:700;width:10%;border:1pt solid #000;padding:4px">GRADO</td>
        <td style="text-align:center;font-size:7.5pt;font-weight:700;width:30%;border:1pt solid #000;padding:4px">APELLIDO Y NOMBRE</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:11%;border:1pt solid #000;padding:4px">1ER PARCIAL<br>(25%)</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:11%;border:1pt solid #000;padding:4px">2DO PARCIAL<br>(25%)</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:11%;border:1pt solid #000;padding:4px">EXAMEN FINAL<br>(40%)</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:11%;border:1pt solid #000;padding:4px">APRECIACIÓN<br>(10%)</td>
        <td style="text-align:center;font-size:7.5pt;font-weight:900;width:12%;border:1pt solid #000;padding:4px">NOTA FINAL</td>
      </tr>
    </thead><tbody>`;

  let filas = '';
  cursantes.forEach((c, idx) => {
    filas += makeTablaRow(c, idx + 1);
  });

  const htmlExcel=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8"><style>
    table{border-collapse:collapse;}
    td,th{border:1pt solid #000;padding:2px 4px;font-family:Arial,sans-serif;font-size:8pt;}
  </style></head><body>
  <div style="font-family:Arial,sans-serif;color:#000;">
    ${cabecera}${encTablaHdr}${filas}</tbody></table>
  </div>
  </body></html>`;

  const htmlPDF=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Planilla Centralizadora ${diplomadoCorto}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:279mm;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:279mm 216mm;margin:10mm 15mm}
    table{border-collapse:collapse;width:100%}
    td,th{border:1pt solid #000;padding:1px 3px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif}
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head><body id="pdf-content">
  <div style="padding:10px;position:relative">
    ${buildWatermarkHTML(diplomadoCorto)}
    <div style="position:relative;z-index:1">
      ${cabecera}${encTablaHdr}${filas}</tbody></table>
      ${firmas}
    </div>
  </div>
  <script>
    window.onload=function(){
      window.focus();
      const element = document.getElementById('pdf-content');
      const opt = {
        margin:       [0.4, 0.5, 0.4, 0.5],
        filename:     'Planilla_Centralizadora_${diplomadoCorto}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        setTimeout(function(){window.print();}, 500);
      });
    };
  </script>
  </body></html>`;

  return isExcel ? htmlExcel : htmlPDF;
}
