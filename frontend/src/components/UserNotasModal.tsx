import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { generarHistorialAcademico } from '../utils/generarHistorialAcademico';

interface UserNotasModalProps {
  user: {
    id: number;
    nombre: string;
    apellido: string;
    grado?: string;
    cm?: string;
  };
  onClose: () => void;
}

export function UserNotasModal({ user, onClose }: UserNotasModalProps) {
  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['user-notas', user.id],
    queryFn: async () => {
      const res = await api.get(`/users/${user.id}/notas`);
      return res.data;
    },
    enabled: !!user.id
  });


  const userNameFull = `${user.nombre} ${user.apellido}`;

  const handleExportClick = () => {
    api.post('/eventos', {
      accion: 'EXPORTAR',
      entidad: 'REPORTE',
      detalles: `Exportó el historial académico (PDF) del cursante ${user.nombre} ${user.apellido}`
    }).catch(console.error);
    
    if (inscripciones) {
      generarHistorialAcademico(user, inscripciones);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-[#0f2942] px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-0.5">
              Kárdex Académico Oficial — ECEMA
            </span>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">Historial de Calificaciones por Materia</h3>
            <p className="text-slate-300 text-xs mt-0.5">
              Cursante: <strong className="text-white">{user.grado ? `${user.grado} ` : ''}{userNameFull}</strong>
              {user.cm ? <span className="font-mono tabular-nums ml-2 text-amber-300">• CM: {user.cm}</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportClick} 
              disabled={isLoading || !inscripciones || inscripciones.length === 0}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-xs border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Exportar Kárdex PDF
            </button>
            <button onClick={onClose} className="text-slate-300 hover:text-white text-base w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer">✕</button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/70 space-y-6 print:p-8 print:bg-white print:text-black font-sans">
          <style type="text/css" media="print">
            {`
              @page { size: auto; margin: 20mm; }
              @media print {
                body { 
                  font-family: Arial, Helvetica, sans-serif !important; 
                  color: black !important;
                }
                * {
                  font-family: Arial, Helvetica, sans-serif !important;
                }
                .print-border-black { border-color: black !important; }
              }
            `}
          </style>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-xs font-bold uppercase tracking-wider print:hidden">Cargando historial académico...</div>
          ) : inscripciones?.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs text-center print:hidden">
              <p className="text-slate-500 text-xs font-bold">Este cursante no registra matrículas en ningún diplomado.</p>
            </div>
          ) : (
            inscripciones?.map((insc: any, index: number) => {
              const materiasPorArea = insc.materias?.reduce((acc: any, im: any) => {
                if (!im.materia.area?.nombre) return acc;
                const areaNombre = im.materia.area.nombre;
                if (!acc[areaNombre]) acc[areaNombre] = [];
                acc[areaNombre].push(im);
                return acc;
              }, {});

              return (
                <div key={insc.id} className={`bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-none print:shadow-none print:bg-transparent ${index > 0 ? 'print:break-before-page' : ''}`}>
                  {/* CABECERA DE IMPRESIÓN (MEMBRETE Y DATOS) */}
                  <div className="hidden print:block mb-8 text-black font-bold">
                    <div className="text-center mb-8">
                      <h2 className="font-bold text-lg underline underline-offset-4 uppercase">
                        DIPLOMADO DE {insc.edicion.diplomado.nombre.toUpperCase()}
                        {insc.edicion.periodo.semestre ? ` - SEMESTRE ${insc.edicion.periodo.semestre}` : ''}
                      </h2>
                    </div>

                    <div className="mb-8 flex justify-center">
                      <table className="w-full max-w-2xl border-collapse border border-black text-sm text-left">
                        <tbody>
                          <tr>
                            <th className="border border-black p-2 w-1/3 uppercase font-bold">GRADO</th>
                            <td className="border border-black p-2 uppercase">{user.grado || ''}</td>
                          </tr>
                          <tr>
                            <th className="border border-black p-2 uppercase font-bold">NOMBRE Y<br/>APELLIDOS</th>
                            <td className="border border-black p-2 uppercase">{user.nombre} {user.apellido}</td>
                          </tr>
                          <tr>
                            <th className="border border-black p-2 uppercase font-bold">CM</th>
                            <td className="border border-black p-2 uppercase">{user.cm || ''}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-100 print:hidden">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{insc.edicion.diplomado.nombre}</h4>
                      <p className="text-slate-500 text-xs font-mono tabular-nums mt-0.5">Gestión {insc.edicion.periodo.gestion} {insc.edicion.periodo.semestre ? `• Semestre ${insc.edicion.periodo.semestre}` : ''}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      insc.estado === 'ACTIVO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                      insc.estado === 'EGRESADO' ? 'bg-slate-200 text-[#0f2942] border-slate-300' :
                      'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {insc.estado}
                    </span>
                  </div>

                  <div className="p-4 space-y-5 print:p-0 print:space-y-4">
                    {(!insc.materias || insc.materias.length === 0) ? (
                      <p className="text-center text-slate-500 text-xs p-4 print:text-black">Este diplomado no tiene materias asignadas.</p>
                    ) : (
                      Object.entries(materiasPorArea).map(([areaName, materiasList]: any) => (
                        <div key={areaName} className="border border-slate-200 rounded-lg overflow-hidden print-border-black print:mb-4">
                          <div className="bg-[#0f2942] px-4 py-2 border-b border-slate-200 print-border-black print:bg-transparent">
                            <h5 className="font-bold text-white text-xs tracking-wider print:text-black print:text-base uppercase">{areaName}</h5>
                          </div>
                          <div className="overflow-x-auto print:overflow-visible">
                            <table className="w-full text-left text-xs print:text-sm border-collapse">
                              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 print:bg-transparent print-border-black print:text-black">
                                <tr>
                                  <th className="px-4 py-2.5 font-bold text-[10px] tracking-wider print:font-bold print:border print:border-black print:p-2 uppercase">Materia</th>
                                  <th className="px-2 py-2.5 font-bold text-[10px] tracking-wider text-center w-24 print:font-bold print:border print:border-black print:p-2 uppercase">1er Parcial<br/><span className="font-mono text-[9px] text-slate-400 print:text-black">(25%)</span></th>
                                  <th className="px-2 py-2.5 font-bold text-[10px] tracking-wider text-center w-24 print:font-bold print:border print:border-black print:p-2 uppercase">2do Parcial<br/><span className="font-mono text-[9px] text-slate-400 print:text-black">(25%)</span></th>
                                  <th className="px-2 py-2.5 font-bold text-[10px] tracking-wider text-center w-24 print:font-bold print:border print:border-black print:p-2 uppercase">Ex. Final<br/><span className="font-mono text-[9px] text-slate-400 print:text-black">(40%)</span></th>
                                  <th className="px-2 py-2.5 font-bold text-[10px] tracking-wider text-center w-24 print:font-bold print:border print:border-black print:p-2 uppercase">Apreciación<br/><span className="font-mono text-[9px] text-slate-400 print:text-black">(10%)</span></th>
                                  <th className="px-2 py-2.5 font-bold text-[10px] tracking-wider text-center w-24 print:font-bold print:border print:border-black print:p-2 uppercase">Promedio</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 print:divide-black">
                                {materiasList.sort((a: any, b: any) => a.materia.orden - b.materia.orden).map((im: any) => {
                                  const getNota = (ev: string) => im.calificaciones.find((c: any) => c.evaluacion === ev)?.nota;
                                  const p1 = getNota('1er Parcial');
                                  const p2 = getNota('2do Parcial');
                                  const fin = getNota('Examen Final');
                                  const apr = getNota('Apreciación Docente');
                                  
                                  const allExist = p1 !== undefined && p2 !== undefined && fin !== undefined && apr !== undefined;
                                  const prom = allExist ? ((p1 * 0.25) + (p2 * 0.25) + (fin * 0.40) + (apr * 0.10)).toFixed(2) : '-';

                                  const formatNota = (val: any) => {
                                    if (val === undefined || val === null || val === '') return '-';
                                    const num = Number(val);
                                    if (isNaN(num)) return '-';
                                    return Number(num.toFixed(2)).toString();
                                  };

                                  return (
                                    <tr key={im.id} className="hover:bg-slate-50/80 print:hover:bg-transparent">
                                      <td className="px-4 py-2.5 font-bold text-slate-800 print:text-black print:border print:border-black print:p-2">{im.materia.nombre}</td>
                                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-slate-700 print:text-black print:border print:border-black print:p-2">{formatNota(p1)}</td>
                                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-slate-700 print:text-black print:border print:border-black print:p-2">{formatNota(p2)}</td>
                                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-slate-700 print:text-black print:border print:border-black print:p-2">{formatNota(fin)}</td>
                                      <td className="px-2 py-2.5 text-center font-mono tabular-nums text-slate-700 print:text-black print:border print:border-black print:p-2">{formatNota(apr)}</td>
                                      <td className="px-2 py-2.5 text-center print:border print:border-black print:p-2">
                                        <span className={`px-2 py-0.5 rounded font-bold font-mono tabular-nums border ${prom !== '-' && parseFloat(prom) >= 75 ? 'bg-teal-50 text-teal-800 border-teal-200 print:bg-transparent print:text-black print:border-none' : prom !== '-' ? 'bg-red-50 text-red-800 border-red-200 print:bg-transparent print:text-black print:border-none' : 'text-slate-400 border-transparent print:text-black'}`}>
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
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
