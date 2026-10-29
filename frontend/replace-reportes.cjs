const fs = require('fs');
const path = 'c:\\Users\\crist\\OneDrive\\Desktop\\ANTI PRO\\frontend\\src\\pages\\admin\\Reportes.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Import
content = content.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx';\nimport { generarPonderacionPDF, generarPonderacionExcel } from '../../utils/generarPonderacion';");

// 2. Replace exportGradesToPDF and exportGradesToExcel
const newLogic = `
  const DCEA_COLUMNS = [
    { id: 'doctrinario', name: 'Doctrinario Específico', percent: 28 },
    { id: 'militar', name: 'Militar', percent: 17 },
    { id: 'seguridad', name: 'Seguridad y Defensa', percent: 8 },
    { id: 'comando', name: 'Comando y Adm.', percent: 7 },
    { id: 'juegos', name: 'Juegos Adm.', percent: 2 },
    { id: 'preoral', name: 'Examen Pre-Oral', percent: 2 },
    { id: 'oral', name: 'Examen Oral', percent: 25 },
    { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1 },
    { id: 'fisico', name: 'Actividades Físicas', percent: 4 },
    { id: 'disciplina', name: 'Disciplina', percent: 3 },
    { id: 'apreciacion', name: 'Apreciación Planta', percent: 3 },
  ];

  const DCEMA_COLUMNS = [
    { id: 'doctrinario', name: 'Doctrinario Especifico', percent: 17.5 },
    { id: 'militar', name: 'Militar', percent: 10.5 },
    { id: 'seguridad', name: 'Seguridad y Defensa', percent: 5 },
    { id: 'comando', name: 'Comando y Administración', percent: 4 },
    { id: 'ejercicios', name: 'Ejercicios Operativos', percent: 20 },
    { id: 'preoral', name: 'Examen Pre-Oral', percent: 2 },
    { id: 'oral', name: 'Examen Oral', percent: 30 },
    { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1 },
    { id: 'fisico', name: 'Actividades Físico Deportivas', percent: 4 },
    { id: 'disciplina', name: 'Disciplina', percent: 3 },
    { id: 'apreciacion', name: 'Apreciación Planta Académica', percent: 3 },
  ];

  const fetchPonderacionData = async () => {
    if (!selectedEdicion) {
      showError("Por favor seleccione un Diplomado/Gestión.", "Aviso");
      return null;
    }
    try {
      const selected = ediciones?.find((e: any) => e.id.toString() === selectedEdicion.toString());
      if (!selected) return null;
      
      const isDCEMA = selected.diplomado?.nombre?.toUpperCase().includes('DCEMA');
      const activeColumns = isDCEMA ? DCEMA_COLUMNS : DCEA_COLUMNS;
      const diplomadoNombre = isDCEMA ? 'Diplomado de Comando y Estado Mayor Aéreo (DCEMA)' : 'Diplomado de Comando de Escuadrón Aéreo (DCEA)';

      const res = await api.get('/inscripciones');
      const inscripcionesFiltradas = res.data.filter((insc: any) => insc.edicion_id.toString() === selectedEdicion.toString() && insc.estado === 'ACTIVO');
      
      if (inscripcionesFiltradas.length === 0) {
        showError("No hay cursantes activos en esta edición.", "Aviso");
        return null;
      }

      const cursantes = inscripcionesFiltradas.map((insc: any) => ({
        id: insc.id,
        grado: insc.cursante.grado,
        nombre: insc.cursante.nombre,
        apellido: insc.cursante.apellido,
        cm: insc.cursante.cm,
        notas: (insc.ponderaciones) || {}
      }));

      return { diplomado: diplomadoNombre, cursantes, columns: activeColumns };
    } catch (e) {
      console.error(e);
      showError("Error al obtener datos");
      return null;
    }
  };

  const exportGradesToPDF = async () => {
    const data = await fetchPonderacionData();
    if (data) generarPonderacionPDF(data);
  };

  const exportGradesToExcel = async () => {
    const data = await fetchPonderacionData();
    if (data) generarPonderacionExcel(data);
  };`;

const startIndex = content.indexOf('const exportGradesToPDF = async () => {');
const endIndexStr = "exportGradesToExcel = async () => {";
const excelStartIndex = content.indexOf(endIndexStr);
let tmp = content.substring(excelStartIndex);
const finalEndIndex = excelStartIndex + tmp.indexOf('};', tmp.indexOf('} catch (e) {')) + 2;

content = content.substring(0, startIndex) + newLogic + content.substring(finalEndIndex);
content = content.replace("Cuadro de Calificaciones (Orden de Mérito)", "Ponderación Final (Oficial)");
content = content.replace("Exporta el reporte transversal de notas ordenado por promedio", "Exporta la planilla de ponderación final con los porcentajes establecidos");
fs.writeFileSync(path, content, 'utf8');
console.log("Success");
