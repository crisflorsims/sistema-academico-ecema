import {
  buildMembreteOficialHTML,
  buildPieFirmasYQRHTML,
  buildWatermarkHTML,
  generarHashIntegridad
} from './qrGenerator';

interface PonderacionData {
  diplomado: string;
  cursantes: any[];
  columns?: any[];
}

const DCEA_COLUMNS = [
  { id: 'doctrinario', name: 'Doctrinario Específico', percent: 28 },
  { id: 'militar', name: 'Militar', percent: 17 },
  { id: 'seguridad', name: 'Seguridad y Defensa', percent: 8 },
  { id: 'comando', name: 'Comando y Adm.', percent: 7 },
  { id: 'preoral', name: 'Examen Pre-oral', percent: 2 },
  { id: 'oral', name: 'Examen Oral', percent: 25 },
  { id: 'juegos', name: 'Juegos Jaga / Intr. FÉNIX / EEM I', percent: 2 },
  { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1 },
  { id: 'fisico', name: 'Actividades Físico Deportivas', percent: 4 },
  { id: 'disciplina', name: 'Comportamiento y Disciplina', percent: 3 },
  { id: 'apreciacion', name: 'Apreciación Planta Académica', percent: 3 },
];

function buildPonderacionHTML(data: PonderacionData, isExcel: boolean = false): string {
  const { cursantes, diplomado, columns } = data;
  const activeColumns = columns || DCEA_COLUMNS;
  const diplomadoCorto: 'DCEA' | 'DCEMA' = diplomado?.toUpperCase().includes('DCEMA') ? 'DCEMA' : 'DCEA';

  function calcularPromedio(notas: any) {
    let total = 0;
    let todasLlenas = true;
    for (const col of activeColumns) {
      if (notas[col.id] === undefined || notas[col.id] === '') {
        todasLlenas = false;
        break;
      }
      total += Number(notas[col.id]);
    }
    return todasLlenas ? total.toFixed(2) : '-';
  }

  // Calcular promedio general e integridad del acta
  let sumaPromedios = 0;
  let conteoPromedios = 0;
  const huellaRawParts: string[] = [diplomadoCorto, String(cursantes.length)];
  cursantes.forEach((c: any) => {
    const p = calcularPromedio(c.notas || {});
    huellaRawParts.push(`${c.apellido || ''}:${p}`);
    if (p !== '-') {
      sumaPromedios += parseFloat(p);
      conteoPromedios++;
    }
  });
  const promedioGeneralStr = conteoPromedios > 0 ? (sumaPromedios / conteoPromedios).toFixed(2) : 'S/P';
  const hashIntegridad = generarHashIntegridad(huellaRawParts.join('|'));
  const folioCodigo = `${diplomadoCorto}-${new Date().getFullYear()}-PF-${hashIntegridad.slice(0, 4)}`;

  const cabecera = buildMembreteOficialHTML({
    diplomadoCorto,
    tituloDocumento: `PLANILLA DE PONDERACIÓN FINAL — ${diplomadoCorto}`,
    subtituloDocumento: diplomado,
    folioCodigo
  });

  const firmas = buildPieFirmasYQRHTML({
    diplomadoCorto,
    tipoDocumento: 'PONDERACION_FINAL',
    folioCodigo,
    hashIntegridad,
    totalCursantes: cursantes.length,
    promedioGeneral: promedioGeneralStr,
    extraInfo: diplomado.slice(0, 40)
  });
  const watermark = isExcel ? '' : buildWatermarkHTML(diplomadoCorto);

  function makeTablaRow(c: any, numFila: number){
    const prom = calcularPromedio(c.notas);
    
    const celdas = activeColumns.map(col => {
      const v = c.notas[col.id];
      const vFormat = v !== undefined && v !== null && v !== '' ? Number(v).toFixed(2) : '-';
      return `<td style="text-align:center;font-size:7pt;font-weight:700;border:1pt solid #000">${vFormat}</td>`;
    }).join('');

    return `<tr>
      <td style="text-align:center;font-size:7pt;font-weight:700;border:1pt solid #000;padding:2px">${numFila}</td>
      <td style="font-size:7pt;border:1pt solid #000;padding:2px">${c.grado || ''}</td>
      <td style="font-size:7pt;border:1pt solid #000;padding:2px">${c.apellido} ${c.nombre}</td>
      ${celdas}
      <td style="text-align:center;font-size:7.5pt;font-weight:900;border:1pt solid #000">${prom}</td>
    </tr>`;
  }

  const ths = activeColumns.map(col => 
    `<td style="text-align:center;font-size:6pt;font-weight:700;width:5%;border:1pt solid #000;padding:2px">${col.name}<br>(${col.percent}%)</td>`
  ).join('');

  const encTablaHdr=`
  <table style="border-collapse:collapse;width:100%;margin-bottom:10px">
    <thead>
      <tr style="background-color:#f3f4f6">
        <td style="text-align:center;font-size:7pt;font-weight:700;width:3%;border:1pt solid #000;padding:2px">N°</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:7%;border:1pt solid #000;padding:2px">GRADO</td>
        <td style="text-align:center;font-size:7pt;font-weight:700;width:20%;border:1pt solid #000;padding:2px">APELLIDO Y NOMBRE</td>
        ${ths}
        <td style="text-align:center;font-size:7pt;font-weight:900;width:6%;border:1pt solid #000;padding:2px">P. FINAL</td>
      </tr>
    </thead><tbody>`;

  let filas = '';
  cursantes.forEach((c, idx) => {
    filas += makeTablaRow(c, idx + 1);
  });

  const htmlExcel = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body>
  <div style="font-family:Arial,sans-serif">
    ${cabecera}${encTablaHdr}${filas}</tbody></table>
  </div>
  </body></html>`;

  const htmlPDF=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Ponderación Final ${diplomadoCorto}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:297mm;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:297mm 210mm;margin:10mm 15mm} /* Orientación Horizontal */
    table{border-collapse:collapse;width:100%}
    td,th{border:1pt solid #000;padding:1px 2px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif}
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head><body id="pdf-content">
  <div style="padding:10px;position:relative;">
    ${watermark}
    ${cabecera}${encTablaHdr}${filas}</tbody></table>
    ${firmas}
  </div>
  <script>
    window.onload=function(){
      window.focus();
      const element = document.getElementById('pdf-content');
      const opt = {
        margin:       [0.35, 0.35, 0.35, 0.35],
        filename:     'Ponderacion_Final_${diplomadoCorto}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        setTimeout(function(){window.print();}, 500);
      });
    };
  </script>
  </body></html>`;

  return isExcel ? htmlExcel : htmlPDF;
}

export function generarPonderacionPDF(data: PonderacionData) {
  const htmlStr = buildPonderacionHTML(data, false);
  const win = window.open('', '', 'width=900,height=700');
  if (!win) {
    alert("El navegador bloqueó la ventana emergente.");
    return;
  }
  win.document.open();
  win.document.write(htmlStr);
  win.document.close();
}

export function generarPonderacionExcel(data: PonderacionData) {
  const htmlStr = buildPonderacionHTML(data, true);
  try {
    const diplomadoCorto = data.diplomado?.toUpperCase().includes('DCEMA') ? 'DCEMA' : 'DCEA';
    const filename = `Ponderacion_Final_${diplomadoCorto}_${new Date().toISOString().split('T')[0]}.xls`;
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
