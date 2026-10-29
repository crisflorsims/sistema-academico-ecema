const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.author = 'Sistema ECEMA';
pptx.company = 'Fuerza Aérea Boliviana';
pptx.title = 'Presentación del Sistema - Versión Visual';

// MASTER SLIDE
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'FFFFFF' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: '0f172a' } } },
    { text: { text: 'SISTEMA ACADÉMICO ECEMA', options: { x: 0.3, y: 0.1, w: 5, h: 0.5, color: 'FFFFFF', fontSize: 16, bold: true, fontFace: 'Arial' } } },
    { text: { text: 'FUERZA AÉREA BOLIVIANA', options: { x: 7, y: 0.1, w: 2.5, h: 0.5, color: 'FFFFFF', fontSize: 12, align: 'right', fontFace: 'Arial' } } }
  ],
  slideNumber: { x: 9.5, y: 5.2, color: '64748b' }
});

// SLIDE 1: PORTADA
let slide1 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 2, w: '100%', h: 1.5, fill: { color: 'f8fafc' } });
slide1.addText('SISTEMA INTEGRAL DE GESTIÓN ACADÉMICA', { x: 0, y: 2.2, w: '100%', h: 0.8, align: 'center', fontSize: 32, bold: true, color: '0f172a', fontFace: 'Arial' });
slide1.addText('Arquitectura, Tecnologías y Base de Datos', { x: 0, y: 3, w: '100%', h: 0.5, align: 'center', fontSize: 18, color: '475569', fontFace: 'Arial' });
slide1.addText('DCEA / DCEMA', { x: 0, y: 4.5, w: '100%', h: 0.5, align: 'center', fontSize: 16, color: '2563eb', bold: true });

// SLIDE 2: STACK TECNOLÓGICO CON IMÁGENES
let slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide2.addText('STACK TECNOLÓGICO', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });

// Frontend Section
slide2.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.8, w: 4.2, h: 3.2, fill: { color: 'f1f5f9' }, line: { color: 'cbd5e1', width: 1 } });
slide2.addText('FRONTEND', { x: 0.5, y: 2, w: 4.2, h: 0.4, align: 'center', bold: true, fontSize: 16, color: '0f172a' });
slide2.addImage({ path: 'react.png', x: 0.8, y: 2.6, w: 0.8, h: 0.8 });
slide2.addText('React.js (Librería UI Principal)', { x: 1.8, y: 2.6, w: 2.8, h: 0.8, fontSize: 14, color: '334155' });
slide2.addImage({ path: 'tailwind.png', x: 0.8, y: 3.6, w: 0.8, h: 0.8 });
slide2.addText('Tailwind CSS (Estilos Modernos)', { x: 1.8, y: 3.5, w: 2.8, h: 0.8, fontSize: 14, color: '334155' });

// Backend Section
slide2.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 1.8, w: 4.2, h: 3.2, fill: { color: 'f1f5f9' }, line: { color: 'cbd5e1', width: 1 } });
slide2.addText('BACKEND & DB', { x: 5.2, y: 2, w: 4.2, h: 0.4, align: 'center', bold: true, fontSize: 16, color: '0f172a' });
slide2.addImage({ path: 'node.png', x: 5.5, y: 2.6, w: 0.8, h: 0.8 });
slide2.addText('Node.js & Express (API)', { x: 6.7, y: 2.6, w: 2.6, h: 0.8, fontSize: 14, color: '334155' });
slide2.addImage({ path: 'postgres.png', x: 5.6, y: 3.5, w: 0.8, h: 0.8 });
slide2.addText('PostgreSQL (Base de Datos)', { x: 6.7, y: 3.5, w: 2.6, h: 0.8, fontSize: 14, color: '334155' });


// SLIDE 3: ESQUEMA DE BASE DE DATOS (ERD)
let slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide3.addText('ESQUEMA GRÁFICO DE LA BASE DE DATOS', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });

// Usuario Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.8, w: 2.5, h: 1.2, fill: { color: 'dbeafe' }, line: { color: '2563eb', width: 2 } });
slide3.addText('👤 USUARIOS\n(Admin, Docente, Evaluador, Estudiante)', { x: 0.5, y: 1.8, w: 2.5, h: 1.2, align: 'center', fontSize: 12, bold: true, color: '1e40af' });

// Diplomado / Edicion Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 4.0, y: 1.8, w: 2.5, h: 1.2, fill: { color: 'fef3c7' }, line: { color: 'd97706', width: 2 } });
slide3.addText('📚 DIPLOMADOS\n(DCEA / DCEMA)\nPeriodos y Ediciones', { x: 4.0, y: 1.8, w: 2.5, h: 1.2, align: 'center', fontSize: 12, bold: true, color: '92400e' });

// Inscripcion Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 2.2, y: 4.0, w: 2.5, h: 1.2, fill: { color: 'd1fae5' }, line: { color: '059669', width: 2 } });
slide3.addText('📝 INSCRIPCIÓN\nUne al Estudiante con el Diplomado. Guarda "Ponderaciones Finales" en JSON', { x: 2.2, y: 4.0, w: 2.5, h: 1.2, align: 'center', fontSize: 11, bold: true, color: '065f46' });

// Materia Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 7.5, y: 1.8, w: 2.5, h: 1.2, fill: { color: 'fee2e2' }, line: { color: 'dc2626', width: 2 } });
slide3.addText('📘 MATERIAS\nAsignadas a Docentes y Evaluadores', { x: 7.5, y: 1.8, w: 2.5, h: 1.2, align: 'center', fontSize: 12, bold: true, color: '991b1b' });

// Calificaciones Box
slide3.addShape(pptx.ShapeType.roundRect, { x: 6.0, y: 4.0, w: 2.5, h: 1.2, fill: { color: 'e0e7ff' }, line: { color: '4f46e5', width: 2 } });
slide3.addText('📊 CALIFICACIONES\n(1er Parcial, 2do Parcial, Final, Apreciación)', { x: 6.0, y: 4.0, w: 2.5, h: 1.2, align: 'center', fontSize: 11, bold: true, color: '3730a3' });

// Connecting Lines
slide3.addShape(pptx.ShapeType.line, { x: 3.0, y: 2.4, w: 1, h: 0, line: { color: '64748b', width: 2, dashType: 'dash' } }); // Usuario - Diplomado
slide3.addShape(pptx.ShapeType.line, { x: 1.75, y: 3.0, w: 0.5, h: 1.0, line: { color: '64748b', width: 2, beginArrowType: 'triangle' } }); // Usuario -> Inscripcion
slide3.addShape(pptx.ShapeType.line, { x: 5.25, y: 3.0, w: -1.8, h: 1.0, line: { color: '64748b', width: 2, beginArrowType: 'triangle' } }); // Diplomado -> Inscripcion
slide3.addShape(pptx.ShapeType.line, { x: 6.5, y: 2.4, w: 1, h: 0, line: { color: '64748b', width: 2 } }); // Diplomado -> Materias
slide3.addShape(pptx.ShapeType.line, { x: 4.7, y: 4.6, w: 1.3, h: 0, line: { color: '64748b', width: 2, endArrowType: 'triangle' } }); // Inscripcion -> Calificaciones
slide3.addShape(pptx.ShapeType.line, { x: 8.75, y: 3.0, w: -1.5, h: 1.0, line: { color: '64748b', width: 2, endArrowType: 'triangle' } }); // Materias -> Calificaciones


// SLIDE 4: FLUJO DE FUNCIONAMIENTO (DIAGRAMA)
let slide4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide4.addText('FLUJO DE FUNCIONAMIENTO DEL SISTEMA', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 24, bold: true, color: '1e293b' });

// Admin -> Docente -> Evaluador -> Estudiante
const flowColor = '10b981';
slide4.addShape(pptx.ShapeType.rightArrow, { x: 1, y: 2.5, w: 1.8, h: 1, fill: { color: flowColor } });
slide4.addText('1. ADMIN\n(Crea y Asigna)', { x: 1, y: 2.5, w: 1.8, h: 1, align: 'center', fontSize: 12, bold: true, color: 'FFFFFF' });

slide4.addShape(pptx.ShapeType.rightArrow, { x: 3.2, y: 2.5, w: 1.8, h: 1, fill: { color: flowColor } });
slide4.addText('2. DOCENTE\n(Sube Notas)', { x: 3.2, y: 2.5, w: 1.8, h: 1, align: 'center', fontSize: 12, bold: true, color: 'FFFFFF' });

slide4.addShape(pptx.ShapeType.rightArrow, { x: 5.4, y: 2.5, w: 2.0, h: 1, fill: { color: flowColor } });
slide4.addText('3. EVALUADOR\n(Centraliza DCEMA)', { x: 5.4, y: 2.5, w: 1.8, h: 1, align: 'center', fontSize: 12, bold: true, color: 'FFFFFF' });

slide4.addShape(pptx.ShapeType.roundRect, { x: 7.8, y: 2.5, w: 1.8, h: 1, fill: { color: '0f172a' } });
slide4.addText('4. ESTUDIANTE\n(Revisa Libreta)', { x: 7.8, y: 2.5, w: 1.8, h: 1, align: 'center', fontSize: 12, bold: true, color: 'FFFFFF' });

slide4.addText('El flujo está garantizado por un control de roles estricto (RBAC) y JWT para seguridad.', { x: 1, y: 4.2, w: 8, h: 0.5, align: 'center', fontSize: 14, italic: true, color: '475569' });

const outputDir = 'c:\\Users\\crist\\OneDrive\\Desktop';
const filePath = outputDir + '\\Presentacion_Sistema_Visual.pptx';

pptx.writeFile({ fileName: filePath }).then(fileName => {
  console.log('Created visual presentation: ' + fileName);
});
