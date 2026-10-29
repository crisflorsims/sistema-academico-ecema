import React from 'react';
import { 
  X, 
  Award, 
  UserCheck, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

export const CRITERIOS_RUBRICA = [
  { id: 1, nombre: "PARTICIPACIÓN", desc: "Intervenciones voluntarias y sustento doctrinario y normativo." },
  { id: 2, nombre: "CUMPLIMIENTO DE TAREAS", desc: "Puntualidad en entregas y cumplimiento del formato doctrinario." },
  { id: 3, nombre: "EXPOSICIONES", desc: "Secuencia lógica militar, terminología y uso del tiempo asignado." },
  { id: 4, nombre: "CALIDAD DE RESPUESTAS", desc: "Precisión conceptual y fundamentos reglamentarios sólidos." },
  { id: 5, nombre: "TRABAJO EN EQUIPO", desc: "Liderazgo, cooperación grupal y cohesión para la misión común." },
  { id: 6, nombre: "INTEGRIDAD", desc: "Conducta ética, respeto a normas académicas y propiedad intelectual." },
  { id: 7, nombre: "DISCIPLINA", desc: "Puntualidad militar, porte reglamentario y normas de aula." },
  { id: 8, nombre: "COMPROMISO", desc: "Actitud institucional y ejecución de tareas con rigor militar." },
  { id: 9, nombre: "EXCELENCIA", desc: "Estándar superior de calidad y rigurosidad técnica profesional." },
  { id: 10, nombre: "VOCACIÓN DE SERVICIO", desc: "Espíritu de cuerpo militar, actitud proactiva y compañerismo." }
];

export interface CalificacionDetalle {
  id?: number;
  evaluacion: string;
  nota: number;
  rubrica?: any;
  observaciones?: string | null;
  fecha?: string;
  docente?: {
    id: number;
    nombre: string;
    apellido: string;
    grado?: string;
  } | null;
  auditorias?: Array<{
    id: number;
    nota_anterior: number;
    nota_nueva: number;
    fecha: string;
  }>;
}

interface ModalDetalleNotaCursanteProps {
  isOpen: boolean;
  onClose: () => void;
  materiaNombre: string;
  calificacion: CalificacionDetalle | null;
}

export function ModalDetalleNotaCursante({
  isOpen,
  onClose,
  materiaNombre,
  calificacion
}: ModalDetalleNotaCursanteProps) {
  if (!isOpen || !calificacion) return null;

  // Extraer rúbrica parseada si viene como string JSON
  let rubricaData: Record<number, number> | null = null;
  if (calificacion.rubrica) {
    if (typeof calificacion.rubrica === 'string') {
      try {
        rubricaData = JSON.parse(calificacion.rubrica);
      } catch {
        rubricaData = null;
      }
    } else if (typeof calificacion.rubrica === 'object') {
      rubricaData = calificacion.rubrica?.notas || calificacion.rubrica;
    }
  }

  // Peso de la evaluación según reglamento
  const getPonderacionInfo = (tipo: string) => {
    switch (tipo) {
      case '1er Parcial':
        return { peso: '25%', desc: 'Primer Parcial de Materia' };
      case '2do Parcial':
        return { peso: '25%', desc: 'Segundo Parcial de Materia' };
      case 'Examen Final':
        return { peso: '40%', desc: 'Evaluación Final Comprensiva' };
      case 'Apreciación Docente':
        return { peso: '10%', desc: 'Rúbrica de Desempeño y Aptitud Militar' };
      default:
        return { peso: '-', desc: 'Evaluación Académica' };
    }
  };

  const pondInfo = getPonderacionInfo(calificacion.evaluacion);
  const notaNum = Number(calificacion.nota);

  const getRangoBadge = (nota: number) => {
    if (nota >= 90) return { label: 'Sobresaliente', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
    if (nota >= 75) return { label: 'Bueno', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    if (nota >= 60) return { label: 'Aprobado', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { label: 'Insuficiente', bg: 'bg-red-50 text-red-700 border-red-200' };
  };

  const rango = getRangoBadge(notaNum);

  const getNivelCriterio = (val: number) => {
    if (val >= 9.5) return { label: 'Excelente (E)', cls: 'text-teal-800 bg-teal-50 border-teal-200' };
    if (val >= 9.0) return { label: 'Muy Bueno (MB)', cls: 'text-slate-800 bg-slate-100 border-slate-300' };
    if (val >= 8.5) return { label: 'Bueno (B)', cls: 'text-slate-700 bg-slate-50 border-slate-200' };
    if (val >= 7.5) return { label: 'Regular (R)', cls: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { label: 'Insuficiente (I)', cls: 'text-red-700 bg-red-50 border-red-200' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera Modal */}
        <div className="px-6 py-4 bg-[#0f2942] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 mb-1 tracking-wider uppercase">
              {pondInfo.desc} ({pondInfo.peso})
            </span>
            <h3 className="text-lg font-bold tracking-tight">{materiaNombre}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Acta de calificación e informe de rúbrica de evaluación
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Tarjeta de Nota Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="sm:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Calificación Asentada
              </span>
              <div className="text-3xl font-mono tabular-nums font-bold text-slate-900 tracking-tight">
                {notaNum.toFixed(2)}
                <span className="text-xs font-normal text-slate-400"> / 100</span>
              </div>
              <span className={`inline-block mt-2 px-2.5 py-0.5 text-[11px] font-bold rounded border ${rango.bg}`}>
                {rango.label}
              </span>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Docente / Evaluador Responsable</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="p-1.5 rounded bg-[#0f2942]/10 text-[#0f2942]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    {calificacion.docente 
                      ? `${calificacion.docente.grado ? `${calificacion.docente.grado} ` : ''}${calificacion.docente.nombre} ${calificacion.docente.apellido}`
                      : 'Planta Docente / Evaluador Asignado'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#0f2942]" />
                  <span>Peso Reglamentario: <b className="font-mono tabular-nums">{pondInfo.peso}</b></span>
                </div>
                {calificacion.fecha && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha de Asiento: <b className="font-mono tabular-nums">{new Date(calificacion.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Observaciones o Justificación del Docente */}
          <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0f2942]" />
              <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                Observaciones y Retroalimentación del Evaluador
              </h4>
            </div>

            {calificacion.observaciones ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {calificacion.observaciones}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Sin observaciones adicionales registradas en el acta para esta evaluación.
              </p>
            )}
          </div>

          {/* Desglose de Rúbrica (para Apreciación Docente o si existe rubrica) */}
          {rubricaData && Object.keys(rubricaData).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    Desglose de Rúbrica (10 Criterios Doctrinarios)
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-slate-600">Total: {notaNum.toFixed(2)} pts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CRITERIOS_RUBRICA.map(c => {
                  const pts = rubricaData ? rubricaData[c.id] : undefined;
                  const nivel = pts !== undefined ? getNivelCriterio(pts) : null;

                  return (
                    <div 
                      key={c.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={c.desc}>
                          <span className="font-mono">{c.id}.</span> {c.nombre}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{c.desc}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        {pts !== undefined ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-mono tabular-nums font-bold text-slate-900">{pts.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ 10</span></span>
                            {nivel && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${nivel.cls}`}>
                                {nivel.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-300">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial de Auditorías / Rectificaciones */}
          {calificacion.auditorias && calificacion.auditorias.length > 0 && (
            <div className="rounded-xl border border-amber-200 p-4 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900">
                <Clock className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold tracking-wider uppercase">
                  Registro de Rectificación en Acta ({calificacion.auditorias.length})
                </h4>
              </div>

              <div className="space-y-1.5">
                {calificacion.auditorias.map(aud => (
                  <div key={aud.id} className="text-xs p-2.5 rounded-lg bg-white border border-amber-200 flex items-center justify-between text-slate-700 font-mono tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-slate-500">Rectificación:</span>
                      <span className="line-through text-red-600 font-bold">{aud.nota_anterior} pts</span>
                      <span>→</span>
                      <span className="text-teal-800 font-bold">{aud.nota_nueva} pts</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(aud.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5c] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
}
