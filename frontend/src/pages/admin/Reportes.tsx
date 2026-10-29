import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { showError } from '../../utils/alerts';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { generarPonderacionPDF, generarPonderacionExcel } from '../../utils/generarPonderacion';

export function Reportes() {
  const [selectedEdicion, setSelectedEdicion] = useState<string>('');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reportes-dashboard'],
    queryFn: async () => {
      const res = await api.get('/reportes/global');
      return res.data;
    }
  });

  const { data: ediciones } = useQuery({
    queryKey: ['ediciones-todas'],
    queryFn: async () => {
      const res = await api.get('/ediciones');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
      Cargando métricas y centro de reportes...
    </div>
  );

  // Calculos para progress bars
  const totalUsuarios = stats?.usuarios?.total || 1;
  const pAdmin = (stats?.usuarios?.ADMIN / totalUsuarios) * 100 || 0;
  const pDocente = (stats?.usuarios?.DOCENTE / totalUsuarios) * 100 || 0;
  const pEvaluador = (stats?.usuarios?.EVALUADOR / totalUsuarios) * 100 || 0;
  const pCursante = (stats?.usuarios?.CURSANTE / totalUsuarios) * 100 || 0;

  const totalInsc = stats?.inscripciones?.total || 1;
  const pActivo = (stats?.inscripciones?.ACTIVO / totalInsc) * 100;
  const pEgresado = (stats?.inscripciones?.EGRESADO / totalInsc) * 100;
  const pAbandono = (stats?.inscripciones?.ABANDONO / totalInsc) * 100;

  // Funciones de Exportación
  const exportUsersToPDF = async () => {
    try {
      const res = await api.get('/users');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      
      // Título estilo DCEMA/DCEA
      doc.setFillColor(15, 41, 66); // Azul institucional #0f2942
      doc.rect(14, 15, doc.internal.pageSize.width - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("LISTA GENERAL DE USUARIOS REGISTRADOS", doc.internal.pageSize.width / 2, 21, { align: 'center' });

      const tableData = res.data.map((u: any, index: number) => [
        (index + 1).toString(),
        (u.grado || 'S/N').toUpperCase(),
        `${u.nombre || ''} ${u.apellido || ''}`.trim().toUpperCase(),
        (u.rol || '').toUpperCase(),
        (u.email || '').toUpperCase(),
        u.activo ? 'ACTIVO' : 'INACTIVO'
      ]);

      const head = [[
        { content: 'Nº', styles: { halign: 'center' } },
        { content: 'GRADO', styles: { halign: 'center' } },
        { content: 'NOMBRE COMPLETO', styles: { halign: 'center' } },
        { content: 'ROL', styles: { halign: 'center' } },
        { content: 'CORREO', styles: { halign: 'center' } },
        { content: 'ACTIVIDAD', styles: { halign: 'center' } }
      ]];

      autoTable(doc, {
        startY: 23,
        head: head,
        body: tableData,
        theme: 'grid',
        tableWidth: 'auto',
        margin: { left: 14, right: 14 },
        headStyles: { font: 'helvetica', halign: 'center', fillColor: [241, 245, 249], textColor: 20, lineColor: [148, 163, 184], lineWidth: 0.1, fontSize: 7, cellPadding: 1 },
        bodyStyles: { font: 'helvetica', halign: 'center', textColor: 20, lineColor: [148, 163, 184], lineWidth: 0.1, fontSize: 7, cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'left' } }, // Nombres a la izquierda
        styles: { overflow: 'linebreak' }
      });

      doc.save('Usuarios_Registrados.pdf');
    } catch (e) {
      console.error(e);
      showError('Error al exportar usuarios a PDF');
    }
  };

  const exportUsersToExcel = async () => {
    try {
      const res = await api.get('/users');
      const ws = XLSX.utils.json_to_sheet(res.data.map((u:any, index: number) => ({
        'Nº': index + 1,
        'GRADO': (u.grado || 'S/N').toUpperCase(),
        'NOMBRE COMPLETO': `${u.nombre || ''} ${u.apellido || ''}`.trim().toUpperCase(),
        'ROL': (u.rol || '').toUpperCase(),
        'CORREO': (u.email || '').toUpperCase(),
        'ACTIVIDAD': u.activo ? 'ACTIVO' : 'INACTIVO'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
      XLSX.writeFile(wb, "Usuarios_Registrados.xlsx");
    } catch (e) {
      console.error(e);
      showError('Error al exportar usuarios a Excel');
    }
  };

  
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

      const cursantes = inscripcionesFiltradas.map((insc: any) => {
        const rawNotas = (insc.ponderaciones) || {};
        const notasEnPorcentaje: Record<string, number | ''> = {};
        for (const col of activeColumns) {
          if (rawNotas[col.id] !== undefined && rawNotas[col.id] !== '') {
            notasEnPorcentaje[col.id] = parseFloat((Number(rawNotas[col.id]) * (col.percent / 100)).toFixed(2));
          }
        }
        return {
          id: insc.id,
          grado: insc.cursante.grado,
          nombre: insc.cursante.nombre,
          apellido: insc.cursante.apellido,
          cm: insc.cursante.cm,
          notas: notasEnPorcentaje
        };
      });

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
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs border-l-4 border-l-[#0f2942] flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
            Dirección de Posgrado — Documentación Oficial
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Centro de Reportes y Estadísticas
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Emisión de planillas oficiales de ponderación final, nómina general de personal y métricas institucionales.
          </p>
        </div>
      </div>

      {/* SECCIÓN DE EXPORTACIÓN */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-xs border border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <svg className="w-4 h-4 text-[#0f2942]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Emisión de Reportes y Actas Oficiales
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Tarjeta: Lista de Usuarios */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Personal y Cuentas</span>
              <h4 className="font-black text-slate-900 text-sm mb-1">Nómina General de Usuarios</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Exporta la relación oficial de administradores, docentes, evaluadores y cursantes registrados en el sistema.
              </p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200/80">
              <button onClick={exportUsersToPDF} className="flex-1 bg-white hover:bg-red-50 text-red-700 border border-slate-300 hover:border-red-200 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                <span>Exportar PDF</span>
              </button>
              <button onClick={exportUsersToExcel} className="flex-1 bg-white hover:bg-teal-50 text-teal-800 border border-slate-300 hover:border-teal-200 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Tarjeta: Cuadro de Calificaciones */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 col-span-1 sm:col-span-2 lg:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-0.5">Actas Académicas (DCEMA / DCEA)</span>
              <h4 className="font-black text-slate-900 text-sm mb-1">Planilla Oficial de Ponderación Final y Orden de Mérito</h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Emite el cuadro consolidado de ponderación final con los coeficientes reglamentarios por área. Seleccione la edición académica correspondiente.
              </p>
              
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seleccionar Edición a Exportar:</label>
                <select 
                  value={selectedEdicion} 
                  onChange={(e) => setSelectedEdicion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] outline-none text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Seleccione un diplomado y periodo --</option>
                  {ediciones?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(Sem. ${e.periodo.semestre})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-200/80">
              <button 
                onClick={exportGradesToPDF} 
                disabled={!selectedEdicion}
                className="flex-1 bg-[#0f2942] hover:bg-[#163a5c] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Generar Acta PDF (Orden de Mérito)
              </button>
              <button 
                onClick={exportGradesToExcel} 
                disabled={!selectedEdicion}
                className="flex-1 bg-teal-50 hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed text-teal-800 border border-teal-200 py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Generar Planilla Excel (.xlsx)
              </button>
            </div>
          </div>
          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Distribución de Usuarios */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-[#0f2942]">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Comunidad Académica</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900">{stats?.usuarios?.total || 0}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios Totales</span>
          </div>
          
          {/* Stacked Progress Bar */}
          <div className="h-3 w-full flex rounded-full overflow-hidden mt-4 bg-slate-100">
            <div style={{ width: `${pAdmin}%` }} className="bg-amber-600 transition-all duration-500"></div>
            <div style={{ width: `${pDocente}%` }} className="bg-[#0f2942] transition-all duration-500"></div>
            <div style={{ width: `${pEvaluador}%` }} className="bg-slate-500 transition-all duration-500"></div>
            <div style={{ width: `${pCursante}%` }} className="bg-teal-600 transition-all duration-500"></div>
          </div>
          
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs pt-3 border-t border-slate-100">
            <div>
              <div className="text-amber-700 font-black font-mono tabular-nums text-sm">{stats?.usuarios?.ADMIN || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Admins</div>
            </div>
            <div>
              <div className="text-[#0f2942] font-black font-mono tabular-nums text-sm">{stats?.usuarios?.DOCENTE || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Docentes</div>
            </div>
            <div>
              <div className="text-slate-700 font-black font-mono tabular-nums text-sm">{stats?.usuarios?.EVALUADOR || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Evaluadores</div>
            </div>
            <div>
              <div className="text-teal-700 font-black font-mono tabular-nums text-sm">{stats?.usuarios?.CURSANTE || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Cursantes</div>
            </div>
          </div>
        </div>

        {/* Estado de Inscripciones */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-teal-700">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Estado de Matrículas</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900">{stats?.inscripciones?.total || 0}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inscripciones</span>
          </div>
          
          {/* Stacked Progress Bar */}
          <div className="h-3 w-full flex rounded-full overflow-hidden mt-4 bg-slate-100">
            <div style={{ width: `${pActivo}%` }} className="bg-teal-600 transition-all duration-500"></div>
            <div style={{ width: `${pEgresado}%` }} className="bg-[#0f2942] transition-all duration-500"></div>
            <div style={{ width: `${pAbandono}%` }} className="bg-red-600 transition-all duration-500"></div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100">
            <div>
              <div className="text-teal-700 font-black font-mono tabular-nums text-sm">{stats?.inscripciones?.ACTIVO || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Activos</div>
            </div>
            <div>
              <div className="text-[#0f2942] font-black font-mono tabular-nums text-sm">{stats?.inscripciones?.EGRESADO || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Egresados</div>
            </div>
            <div>
              <div className="text-red-700 font-black font-mono tabular-nums text-sm">{stats?.inscripciones?.ABANDONO || 0}</div>
              <div className="text-slate-500 text-[11px] font-medium">Abandonos</div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Métricas de Oferta Académica -> ECEMA */}
        <div className="col-span-1 bg-[#0f2942] p-6 rounded-xl shadow-xs border border-slate-800 text-white flex flex-col items-center justify-between text-center">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Fuerza Aérea Boliviana</span>
            <h3 className="font-black text-xs tracking-wider leading-snug text-white">ESCUELA DE COMANDO Y ESTADO MAYOR AÉREO</h3>
          </div>
          <div className="my-4 p-3 rounded-xl bg-white/95 shadow-sm">
            <img src="/logo-ecema.png" alt="Escudo ECEMA" className="w-24 h-24 object-contain" />
          </div>
          
          <div className="space-y-3 w-full text-left mt-2">
            <div className="flex justify-between items-center border-b border-white/15 pb-2">
              <span className="text-xs text-slate-300 font-medium">Programas de Diplomado</span>
              <span className="text-xl font-black font-mono tabular-nums text-amber-300">{stats?.academicos?.diplomados || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/15 pb-2">
              <span className="text-xs text-slate-300 font-medium">Materias en Malla</span>
              <span className="text-xl font-black font-mono tabular-nums text-white">{stats?.academicos?.materias || 0}</span>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-100">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Últimas Matrículas Registradas</h3>
          </div>
          <div className="p-0 flex-1">
            {stats?.actividadReciente?.length === 0 ? (
              <p className="p-8 text-slate-400 text-xs font-medium text-center">No hay actividad reciente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats?.actividadReciente?.map((act: any) => (
                  <li key={act.id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors flex justify-between items-center gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {act.cursante.grado ? <span className="text-[#0f2942] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] mr-1.5">{act.cursante.grado}</span> : null}
                        {act.cursante.nombre} {act.cursante.apellido}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Matriculado en <span className="font-semibold text-slate-700">{act.edicion.diplomado.nombre}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono tabular-nums font-bold rounded">
                        {new Date(act.fecha_inscripcion).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
