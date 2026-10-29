import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { generarHistorialAcademico } from '../../utils/generarHistorialAcademico';
import { FileDown, Printer, BookOpen, Info, MessageSquare, Award } from 'lucide-react';
import { ModalDetalleNotaCursante } from '../../components/estudiante/ModalDetalleNotaCursante';

export function MisNotas() {
  const user = useAuthStore(state => state.user);
  const [selectedNota, setSelectedNota] = useState<{
    materiaNombre: string;
    calificacion: any;
  } | null>(null);

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['mis-notas'],
    queryFn: async () => {
      const res = await api.get('/estudiantes/mis-notas');
      return res.data;
    },
    enabled: user?.rol === 'CURSANTE' || user?.rol === 'ESTUDIANTE'
  });

  const handleDescargarHistorial = (especificoInsc?: any) => {
    if (!user) return;
    
    // Registrar auditoría de exportación
    api.post('/eventos', {
      accion: 'EXPORTAR',
      entidad: 'REPORTE',
      detalles: `El cursante ${user.grado ? `${user.grado} ` : ''}${user.nombre} ${user.apellido} descargó su ${especificoInsc ? `Boletín de ${especificoInsc.edicion?.diplomado?.nombre || 'Diplomado'}` : 'Historial Académico Oficial'} en PDF`
    }).catch(console.error);

    const dataToExport = especificoInsc ? [especificoInsc] : inscripciones;
    if (dataToExport && dataToExport.length > 0) {
      generarHistorialAcademico(user, dataToExport);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0f2942] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-[#0f2942] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • Registro Académico
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#0f2942]" />
            Boletín de Calificaciones
          </h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Consulta de calificaciones parciales, finales, apreciación docente y emisión de historial académico oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/dashboard/mi-ponderacion"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors shrink-0 cursor-pointer"
            title="Consultar planilla de ponderación final hacia el egreso militar"
          >
            <Award className="w-4 h-4 text-[#0f2942]" />
            <span>Ponderación Final</span>
          </Link>

          <button
            onClick={() => handleDescargarHistorial()}
            disabled={!inscripciones || inscripciones.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f2942] hover:bg-[#163a5c] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Descargar el Historial Académico Oficial consolidado con todas tus materias y firmas"
          >
            <FileDown className="w-4 h-4" />
            <span>Descargar Historial Académico (PDF)</span>
          </button>
        </div>
      </div>

      {(!inscripciones || inscripciones.length === 0) ? (
        <div className="bg-white p-10 rounded-xl border border-slate-200 shadow-xs text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Sin inscripciones activas</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Actualmente no registra inscripción activa en ningún programa académico o no tiene asignaturas habilitadas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {inscripciones?.map((insc: any) => {
            // Agrupar materias por Área
            const materiasPorArea = insc.materias?.reduce((acc: any, im: any) => {
              const areaNombre = im.materia.area?.nombre || 'PLAN GENERAL DE ESTUDIOS';
              if (!acc[areaNombre]) acc[areaNombre] = [];
              acc[areaNombre].push(im);
              return acc;
            }, {});

            return (
              <div key={insc.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
                
                {/* Diplomado Header */}
                <div className="px-6 py-5 bg-[#0f2942] text-white border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${
                        insc.estado === 'ACTIVO' ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
                        insc.estado === 'EGRESADO' ? 'bg-teal-400/15 text-teal-300 border-teal-400/30' :
                        'bg-red-400/15 text-red-300 border-red-400/30'
                      }`}>
                        {insc.estado}
                      </span>
                      <span className="bg-white/10 px-2.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-200 border border-white/10">
                        Gestión {insc.edicion.periodo.gestion}
                      </span>
                      {insc.edicion.periodo.semestre && (
                        <span className="bg-white/10 px-2.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-200 border border-white/10">
                          Semestre {insc.edicion.periodo.semestre}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl tracking-tight leading-snug">{insc.edicion.diplomado.nombre}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDescargarHistorial(insc)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer"
                      title="Descargar o imprimir únicamente el boletín de notas de este diplomado"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Boletín</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
                  {(!insc.materias || insc.materias.length === 0) ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <p className="text-slate-500 text-sm">Este programa académico no tiene asignaturas habilitadas aún.</p>
                    </div>
                  ) : (
                    <>
                      {/* Hint interactivo */}
                      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg">
                        <Info className="w-4 h-4 text-[#0f2942] shrink-0" />
                        <span>Seleccione cualquier calificación numérica para consultar el desglose de rúbrica, observaciones del docente y fecha de asiento en acta.</span>
                      </div>

                      {Object.entries(materiasPorArea).map(([areaName, materiasList]: any) => (
                        <div key={areaName} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          
                          {/* Area Header */}
                          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-[#0f2942] rounded-xs"></span>
                              {areaName}
                            </h4>
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded uppercase">
                              {materiasList.length} asignaturas
                            </span>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                <tr>
                                  <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">Asignatura</th>
                                  <th className="px-3 py-3 font-bold text-[11px] text-right w-28 uppercase tracking-wider">1er Parcial<br/><span className="text-[10px] text-slate-500 font-mono font-normal">(25%)</span></th>
                                  <th className="px-3 py-3 font-bold text-[11px] text-right w-28 uppercase tracking-wider">2do Parcial<br/><span className="text-[10px] text-slate-500 font-mono font-normal">(25%)</span></th>
                                  <th className="px-3 py-3 font-bold text-[11px] text-right w-28 uppercase tracking-wider">Examen Final<br/><span className="text-[10px] text-slate-500 font-mono font-normal">(40%)</span></th>
                                  <th className="px-3 py-3 font-bold text-[11px] text-right w-28 uppercase tracking-wider">Apreciación<br/><span className="text-[10px] text-slate-500 font-mono font-normal">(10%)</span></th>
                                  <th className="px-5 py-3 font-bold text-[11px] text-right w-32 uppercase tracking-wider text-slate-800 bg-slate-200/50">Nota Final<br/><span className="text-[10px] text-slate-500 font-mono font-normal">(100%)</span></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {materiasList.sort((a: any, b: any) => a.materia.orden - b.materia.orden).map((im: any) => {
                                  const getCal = (ev: string) => im.calificaciones.find((c: any) => c.evaluacion === ev);
                                  const calP1 = getCal('1er Parcial');
                                  const calP2 = getCal('2do Parcial');
                                  const calFin = getCal('Examen Final');
                                  const calApr = getCal('Apreciación Docente');

                                  const p1 = calP1?.nota;
                                  const p2 = calP2?.nota;
                                  const fin = calFin?.nota;
                                  const apr = calApr?.nota;
                                  
                                  const allExist = p1 !== undefined && p2 !== undefined && fin !== undefined && apr !== undefined;
                                  const prom = allExist ? ((p1 * 0.25) + (p2 * 0.25) + (fin * 0.40) + (apr * 0.10)).toFixed(2) : '-';

                                  const renderNotaBtn = (cal: any, label: string) => {
                                    if (!cal || cal.nota === undefined) {
                                      return <span className="text-slate-300 font-mono tabular-nums">-</span>;
                                    }
                                    const tieneObs = !!cal.observaciones;
                                    const tieneAud = cal.auditorias && cal.auditorias.length > 0;
                                    const tieneRubrica = !!cal.rubrica;

                                    return (
                                      <button
                                        onClick={() => setSelectedNota({ materiaNombre: im.materia.nombre, calificacion: cal })}
                                        className="relative inline-flex items-center justify-end min-w-[3.25rem] px-2.5 h-7 rounded bg-slate-50 text-slate-800 hover:bg-[#0f2942] hover:text-white border border-slate-200 hover:border-[#0f2942] font-mono tabular-nums font-semibold text-xs transition-colors cursor-pointer"
                                        title={`Ver detalle de ${label} - ${Number(cal.nota).toFixed(2)}${tieneObs ? ' (Contiene observaciones)' : ''}${tieneRubrica ? ' (Rúbrica disponible)' : ''}`}
                                      >
                                        <span>{Number(cal.nota).toFixed(2)}</span>
                                        {(tieneObs || tieneAud || tieneRubrica) && (
                                          <span 
                                            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                                              tieneRubrica ? 'bg-amber-500' : tieneObs ? 'bg-[#0f2942]' : 'bg-teal-600'
                                            }`} 
                                          />
                                        )}
                                      </button>
                                    );
                                  };

                                  return (
                                    <tr key={im.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                                        {im.materia.nombre}
                                      </td>
                                      <td className="px-3 py-3.5 text-right">
                                        {renderNotaBtn(calP1, '1er Parcial')}
                                      </td>
                                      <td className="px-3 py-3.5 text-right">
                                        {renderNotaBtn(calP2, '2do Parcial')}
                                      </td>
                                      <td className="px-3 py-3.5 text-right">
                                        {renderNotaBtn(calFin, 'Examen Final')}
                                      </td>
                                      <td className="px-3 py-3.5 text-right">
                                        {renderNotaBtn(calApr, 'Apreciación Docente')}
                                      </td>
                                      <td className="px-5 py-3.5 text-right bg-slate-50/70">
                                        <span className={`inline-flex items-center justify-end min-w-[3.75rem] px-2.5 py-1 rounded font-mono tabular-nums font-bold text-xs border ${
                                          prom !== '-' && parseFloat(prom) >= 60 ? 'bg-teal-50 text-teal-800 border-teal-200' : 
                                          prom !== '-' ? 'bg-red-50 text-red-700 border-red-200' : 
                                          'bg-slate-100 text-slate-400 border-slate-200'
                                        }`}>
                                          {prom}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle de Calificación, Rúbrica y Observaciones */}
      <ModalDetalleNotaCursante
        isOpen={!!selectedNota}
        onClose={() => setSelectedNota(null)}
        materiaNombre={selectedNota?.materiaNombre || ''}
        calificacion={selectedNota?.calificacion || null}
      />
    </div>
  );
}

