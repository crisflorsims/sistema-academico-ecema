import {
  buildMembreteOficialHTML,
  buildPieFirmasYQRHTML,
  buildWatermarkHTML,
  generarHashIntegridad
} from './qrGenerator';

export function generarHistorialAcademico(user: any, inscripciones: any[]) {
  const primeraInsc = inscripciones && inscripciones.length > 0 ? inscripciones[0] : null;
  const diplomadoNombre = primeraInsc?.edicion?.diplomado?.nombre || '';
  const diplomadoCorto: 'DCEA' | 'DCEMA' = diplomadoNombre.toUpperCase().includes('DCEMA') || diplomadoNombre.toUpperCase().includes('ESTADO MAYOR')
    ? 'DCEMA'
    : 'DCEA';

  const fechaEmision = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const totalMaterias = (inscripciones || []).reduce((acc, i) => acc + (i.materias?.length || 0), 0);
  const cadenaIntegridad = `HIST|${user?.ci || ''}|${user?.apellido || ''}|${diplomadoCorto}|${totalMaterias}|${fechaEmision}`;
  const hashDoc = generarHashIntegridad(cadenaIntegridad);
  const folioDoc = `ECEMA-${diplomadoCorto}-HIST-${new Date().getFullYear()}-${hashDoc.slice(0, 4)}`;

  const textoQR = [
    `ECEMA-FAB | VERIFICACION OFICIAL`,
    `DOC: HISTORIAL ACADEMICO OFICIAL`,
    `PROG: ${diplomadoCorto}`,
    `CURSANTE: ${user?.grado || ''} ${user?.apellido || ''} ${user?.nombre || ''}`.trim().slice(0, 38),
    `CI: ${user?.ci || '-'}`,
    `FOLIO: ${folioDoc}`,
    `HASH: ${hashDoc}`,
    `FECHA: ${fechaEmision}`,
  ].join('\n');

  const membrete = buildMembreteOficialHTML({
    diplomadoCorto,
    tituloDocumento: 'HISTORIAL ACADÉMICO OFICIAL',
    subtituloDerecha: 'ESCUADRÓN EVALUACIÓN',
    folioCodigo: folioDoc,
    isExcel: false,
  });

  const cabecera = `
  ${membrete}
  <table style="margin-bottom:15px;border-collapse:collapse;width:100%">
    <tr>
      <td style="width:15%;font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">GRADO:</td>
      <td style="width:20%;font-size:8.5pt;padding:4px 6px;border:1pt solid #000">${user.grado || ''}</td>
      <td style="width:20%;font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">NOMBRE COMPLETO:</td>
      <td style="width:45%;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;font-weight:700">${user.nombre} ${user.apellido}</td>
    </tr>
    <tr>
      <td style="font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">C.I.:</td>
      <td style="font-size:8.5pt;padding:4px 6px;border:1pt solid #000">${user.ci || '-'}</td>
      <td style="font-weight:700;font-size:8.5pt;padding:4px 6px;border:1pt solid #000;background:#f8fafc">C.M.:</td>
      <td style="font-size:8.5pt;padding:4px 6px;border:1pt solid #000">${user.cm || '-'}</td>
    </tr>
  </table>`;

  const firmas = buildPieFirmasYQRHTML({
    diplomadoCorto,
    folioCodigo: folioDoc,
    hashIntegridad: hashDoc,
    fechaEmision,
    textoQR,
    isExcel: false,
  });

  let bodyHtml = '';

  if (!inscripciones || inscripciones.length === 0) {
    bodyHtml = `<p style="text-align:center;font-size:10pt;font-family:Arial,sans-serif;margin-top:20px;">El cursante no tiene registros académicos.</p>`;
  } else {
    inscripciones.forEach((insc, idx) => {
      const materiasPorArea = insc.materias?.reduce((acc: any, im: any) => {
        const areaNombre = im.materia?.area?.nombre || 'PLAN GENERAL DE ESTUDIOS';
        if (!acc[areaNombre]) acc[areaNombre] = [];
        acc[areaNombre].push(im);
        return acc;
      }, {});

      bodyHtml += `
      <div style="${idx > 0 ? 'page-break-before:always;' : ''}">
        <div style="background-color:#f3f4f6;padding:8px;border:1pt solid #000;margin-bottom:10px;text-align:center;">
          <h3 style="margin:0;font-size:10pt;font-family:Arial,sans-serif;text-transform:uppercase;">
            DIPLOMADO DE ${insc.edicion.diplomado.nombre}
          </h3>
          <p style="margin:4px 0 0 0;font-size:8.5pt;font-family:Arial,sans-serif;">
            Gestión: ${insc.edicion.periodo.gestion} ${insc.edicion.periodo.semestre ? `- Semestre ${insc.edicion.periodo.semestre}` : ''} | Estado: <b>${insc.estado}</b>
          </p>
        </div>`;

      if (!insc.materias || insc.materias.length === 0) {
        bodyHtml += `<p style="text-align:center;font-size:9pt;font-family:Arial,sans-serif;">Sin materias registradas en este diplomado.</p>`;
      } else {
        Object.entries(materiasPorArea).forEach(([areaName, materiasList]: any) => {
          bodyHtml += `
          <div style="margin-bottom:10px;">
            <div style="background-color:#e5e7eb;padding:4px 8px;border:1pt solid #000;border-bottom:none;">
              <h4 style="margin:0;font-size:8pt;font-family:Arial,sans-serif;text-transform:uppercase;">ÁREA: ${areaName}</h4>
            </div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">
              <thead style="background-color:#f9fafb;">
                <tr>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:left;">Materia</th>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:center;width:12%;">1er Parcial</th>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:center;width:12%;">2do Parcial</th>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:center;width:12%;">Ex. Final</th>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:center;width:12%;">Apreciación</th>
                  <th style="border:1pt solid #000;padding:4px;font-size:7.5pt;text-align:center;width:14%;">Promedio Final</th>
                </tr>
              </thead>
              <tbody>`;

          materiasList.sort((a: any, b: any) => a.materia.orden - b.materia.orden).forEach((im: any) => {
            const getNota = (ev: string) => im.calificaciones.find((c: any) => c.evaluacion === ev)?.nota;
            const p1 = getNota('1er Parcial');
            const p2 = getNota('2do Parcial');
            const fin = getNota('Examen Final');
            const apr = getNota('Apreciación Docente');
            
            const allExist = p1 !== undefined && p2 !== undefined && fin !== undefined && apr !== undefined;
            const prom = allExist ? ((p1 * 0.25) + (p2 * 0.25) + (fin * 0.40) + (apr * 0.10)).toFixed(2) : '-';

            bodyHtml += `
                <tr>
                  <td style="border:1pt solid #000;padding:4px;font-size:8pt;text-transform:uppercase;">${im.materia.nombre}</td>
                  <td style="border:1pt solid #000;padding:4px;font-size:8pt;text-align:center;">${p1 !== undefined ? p1.toFixed(2) : '-'}</td>
                  <td style="border:1pt solid #000;padding:4px;font-size:8pt;text-align:center;">${p2 !== undefined ? p2.toFixed(2) : '-'}</td>
                  <td style="border:1pt solid #000;padding:4px;font-size:8pt;text-align:center;">${fin !== undefined ? fin.toFixed(2) : '-'}</td>
                  <td style="border:1pt solid #000;padding:4px;font-size:8pt;text-align:center;">${apr !== undefined ? apr.toFixed(2) : '-'}</td>
                  <td style="border:1pt solid #000;padding:4px;font-size:8.5pt;font-weight:bold;text-align:center;">${prom}</td>
                </tr>`;
          });
          bodyHtml += `</tbody></table></div>`;
        });
      }
      bodyHtml += `</div>`;
    });
  }

  const htmlPDF = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Historial Académico - ${user?.grado ? `${user.grado} ` : ''}${user?.nombre || ''} ${user?.apellido || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 216mm; font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: letter portrait; margin: 15mm 15mm; }
  </style>
</head>
<body id="pdf-content" style="padding:10px;position:relative;">
  ${buildWatermarkHTML(diplomadoCorto)}
  <div style="position:relative;z-index:1;">
    ${cabecera}
    ${bodyHtml}
    ${firmas}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function(){ window.print(); }, 500);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert("El navegador bloqueó la ventana emergente.");
    return;
  }
  win.document.open();
  win.document.write(htmlPDF);
  win.document.close();
}
