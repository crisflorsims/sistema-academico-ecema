const pptxgen = require("pptxgenjs");
const fs = require('fs');

const pptx = new pptxgen();
pptx.author = 'Sistema ECEMA';
pptx.company = 'Fuerza Aérea Boliviana';
pptx.title = 'Presentación del Sistema';

// Master Slide for consistent styling
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'FFFFFF' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: '0f172a' } } },
    { text: { text: 'SISTEMA ACADÉMICO ECEMA', options: { x: 0.3, y: 0.1, w: 5, h: 0.5, color: 'FFFFFF', fontSize: 16, bold: true, fontFace: 'Arial' } } },
    { text: { text: 'FUERZA AÉREA BOLIVIANA', options: { x: 7, y: 0.1, w: 2.5, h: 0.5, color: 'FFFFFF', fontSize: 12, align: 'right', fontFace: 'Arial' } } }
  ],
  slideNumber: { x: 9, y: 5.2, color: '64748b' }
});

// SLIDE 1: PORTADA
let slide1 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 2, w: '100%', h: 1.5, fill: { color: 'f8fafc' } });
slide1.addText('SISTEMA INTEGRAL DE GESTIÓN ACADÉMICA', {
  x: 0, y: 2.2, w: '100%', h: 0.8,
  align: 'center', fontSize: 32, bold: true, color: '0f172a', fontFace: 'Arial'
});
slide1.addText('Plataforma Tecnológica para el DCEA y DCEMA', {
  x: 0, y: 3, w: '100%', h: 0.5,
  align: 'center', fontSize: 18, color: '475569', fontFace: 'Arial'
});
slide1.addText('Exposición de Arquitectura y Tecnologías', {
  x: 0, y: 4.5, w: '100%', h: 0.5,
  align: 'center', fontSize: 14, color: '64748b', italic: true
});

// SLIDE 2: OBJETIVOS
let slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide2.addText('OBJETIVOS DEL SISTEMA', { x: 0.5, y: 1, w: 8, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });
slide2.addText([
  { text: '1. Digitalización Absoluta:', options: { bold: true, breakLine: true } },
  { text: '   - Transición de planillas físicas a una plataforma web segura y auditada.\n', options: { fontSize: 14 } },
  { text: '2. Centralización de Datos:', options: { bold: true, breakLine: true } },
  { text: '   - Un único sistema para Administradores, Docentes, Evaluadores y Estudiantes.\n', options: { fontSize: 14 } },
  { text: '3. Adaptabilidad Institucional:', options: { bold: true, breakLine: true } },
  { text: '   - Soporte para diferentes diplomados (DCEA, DCEMA) con lógicas de ponderación independientes y escalables.', options: { fontSize: 14 } }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155', bullet: true, fontFace: 'Arial' });

// SLIDE 3: TECNOLOGÍAS
let slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide3.addText('STACK TECNOLÓGICO (MERN / PERN)', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });

// Frontend Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.8, w: 4.2, h: 3, fill: { color: 'f1f5f9' }, line: { color: 'cbd5e1', width: 1 } });
slide3.addText('FRONTEND (Interfaz de Usuario)', { x: 0.5, y: 2, w: 4.2, h: 0.4, align: 'center', bold: true, fontSize: 16, color: '0f172a' });
slide3.addText('• React.js (Librería UI)\n• Vite (Empaquetador Ultra Rápido)\n• Tailwind CSS (Estilos Modernos)\n• Lucide Icons (Iconografía)', { x: 0.8, y: 2.5, w: 3.8, h: 2, fontSize: 14, color: '334155' });

// Backend Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 1.8, w: 4.2, h: 3, fill: { color: 'f1f5f9' }, line: { color: 'cbd5e1', width: 1 } });
slide3.addText('BACKEND (Lógica y Servidor)', { x: 5.2, y: 2, w: 4.2, h: 0.4, align: 'center', bold: true, fontSize: 16, color: '0f172a' });
slide3.addText('• Node.js & Express (Servidor API)\n• Prisma ORM (Manejo de Base de Datos)\n• PostgreSQL / SQLite (Almacenamiento)\n• JWT (Autenticación Segura)', { x: 5.5, y: 2.5, w: 3.8, h: 2, fontSize: 14, color: '334155' });

// SLIDE 4: ARQUITECTURA
let slide4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide4.addText('ARQUITECTURA DE SOFTWARE', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });
slide4.addText([
  { text: 'Arquitectura Cliente-Servidor Desacoplada:', options: { bold: true, breakLine: true } },
  { text: 'El frontend y el backend operan como proyectos separados que se comunican vía API REST. Esto garantiza que la plataforma sea escalable (ej. crear una App Móvil a futuro conectada a la misma API).\n', options: { fontSize: 14 } },
  { text: 'Flexibilidad de Datos (JSON en SQL):', options: { bold: true, breakLine: true } },
  { text: 'Las "Ponderaciones Finales" utilizan una columna híbrida (JSON) que permite que el DCEMA y el DCEA tengan distintas matrices de calificación (11 criterios vs 10) sin modificar las tablas estructurales de la base de datos.', options: { fontSize: 14 } }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 16, color: '334155', fontFace: 'Arial' });

// SLIDE 5: ROLES Y FUNCIONAMIENTO
let slide5 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide5.addText('FLUJO Y ROLES (RBAC)', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });
slide5.addText([
  { text: 'Administrador:', options: { bold: true, breakLine: true } },
  { text: 'Gestión total: Usuarios, Diplomados, Asignación de Materias a Docentes y Evaluadores.\n', options: { fontSize: 14 } },
  { text: 'Docente:', options: { bold: true, breakLine: true } },
  { text: 'Ingreso de notas parciales, exámenes finales y apreciación académica.\n', options: { fontSize: 14 } },
  { text: 'Evaluador:', options: { bold: true, breakLine: true } },
  { text: 'Centralización de promedios. Interfaz inteligente que adapta los porcentajes según el diplomado (DCEA vs DCEMA).\n', options: { fontSize: 14 } },
  { text: 'Estudiante:', options: { bold: true, breakLine: true } },
  { text: 'Visualización de avance académico (libreta digital).', options: { fontSize: 14 } }
], { x: 0.5, y: 1.8, w: 9, h: 3.2, fontSize: 16, color: '334155', bullet: true, fontFace: 'Arial' });

// SLIDE 6: CONCLUSIÓN Y REPORTES
let slide6 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide6.addText('VENTAJAS EN PRODUCCIÓN Y REPORTES', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });
slide6.addText([
  { text: 'Exportación Instantánea:', options: { bold: true, breakLine: true } },
  { text: 'Generación nativa en el navegador de PDFs y Excel oficiales con logotipos institucionales (ECEMA/FAB), sin costo de procesamiento en el servidor.\n', options: { fontSize: 14 } },
  { text: 'UI / UX Premium:', options: { bold: true, breakLine: true } },
  { text: 'Interfaces modernas con diseño "Glassmorphism", totalmente responsivas para ser operadas desde tablets, móviles o PCs.\n', options: { fontSize: 14 } },
  { text: 'Viabilidad de Producción:', options: { bold: true, breakLine: true } },
  { text: 'El sistema MVP (Producto Mínimo Viable) es altamente productivo, listo para ser desplegado y operado por el personal de la institución.', options: { fontSize: 14 } }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 16, color: '334155', fontFace: 'Arial' });

const outputDir = 'c:\\Users\\crist\\OneDrive\\Desktop';
const filePath = outputDir + '\\Presentacion_Sistema_ECEMA.pptx';

pptx.writeFile({ fileName: filePath }).then(fileName => {
  console.log('Created presentation: ' + fileName);
});
