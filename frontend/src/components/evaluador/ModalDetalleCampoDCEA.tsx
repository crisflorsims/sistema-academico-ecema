import React from 'react';
import { X, BookOpen, CheckCircle, Clock, ShieldCheck, Award } from 'lucide-react';

interface MateriaDetalle {
  materia_id: number;
  nombreOficial: string;
  nombreRegistrado: string;
  area: string;
  campo: string;
  peso: number;
  notaFinal: number | null;
  puntosAportados: number;
  desglose: {
    p1: number | null;
    p2: number | null;
    fin: number | null;
    apr: number | null;
    parcial?: boolean;
  };
}

interface ModalDetalleCampoDCEAProps {
  isOpen: boolean;
  onClose: () => void;
  diplomadoCodigo?: 'DCEA' | 'DCEMA';
  cursanteNombre: string;
  cursanteGrado?: string;
  cursanteCm?: string;
  campoKey: string;
  campoTitulo: string;
  campoMaxPeso: number;
  campoPuntos: number;
  campoNotaBase: number;
  materias: MateriaDetalle[];
}

export const ModalDetalleCampoDCEA: React.FC<ModalDetalleCampoDCEAProps> = ({
  isOpen,
  onClose,
  diplomadoCodigo = 'DCEA',
  cursanteNombre,
  cursanteGrado,
  cursanteCm,
  campoTitulo,
  campoMaxPeso,
  campoPuntos,
  campoNotaBase,
  materias
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#0f2942] px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg border border-white/15">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-0.5">
                {diplomadoCodigo} • Desglose de Campo Académico
              </span>
              <h2 className="text-base font-bold leading-snug">{campoTitulo}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {cursanteGrado ? `${cursanteGrado} ` : ''}{cursanteNombre} {cursanteCm ? `• CM: ${cursanteCm}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de Puntaje */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/70">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Puntos Ponderados</div>
              <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {campoPuntos.toFixed(2)} <span className="text-xs font-sans font-medium text-slate-400">/ {campoMaxPeso.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200/70">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Promedio Base (0-100)</div>
              <div className="text-lg font-mono font-bold text-teal-800 tabular-nums">
                {campoNotaBase.toFixed(2)} <span className="text-xs font-sans font-medium text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/70">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asignaturas del Campo</div>
              <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {materias.length} <span className="text-xs font-sans font-medium text-slate-400">registradas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Materias */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">N°</th>
                  <th className="py-2.5 px-3">Asignatura</th>
                  <th className="py-2.5 px-3 text-center w-20">Área</th>
                  <th className="py-2.5 px-2 text-right w-16">1er P. (25%)</th>
                  <th className="py-2.5 px-2 text-right w-16">2do P. (25%)</th>
                  <th className="py-2.5 px-2 text-right w-16">Final (40%)</th>
                  <th className="py-2.5 px-2 text-right w-16">Apr. (10%)</th>
                  <th className="py-2.5 px-3 text-right w-20">Nota (100)</th>
                  <th className="py-2.5 px-3 text-right w-28">Puntos ({campoMaxPeso}%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materias.map((m, idx) => {
                  const d = m.desglose;
                  const formatVal = (v: number | null) => v !== null && v !== undefined ? v.toFixed(1) : '—';
                  return (
                    <tr key={m.materia_id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{m.nombreOficial}</div>
                        {m.nombreRegistrado !== m.nombreOficial && (
                          <div className="text-[10px] text-slate-400">Reg: {m.nombreRegistrado}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold text-[10px]">
                          {m.area}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.p1)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.p2)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.fin)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.apr)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {m.notaFinal !== null ? m.notaFinal.toFixed(2) : (
                          <span className="text-slate-400 font-sans font-normal text-[11px]">Pendiente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0f2942] bg-slate-50/80 tabular-nums">
                        {m.puntosAportados.toFixed(2)} <span className="text-[10px] font-sans font-normal text-slate-400">({m.peso}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/80 border-t border-slate-200 font-bold text-slate-800">
                <tr>
                  <td colSpan={7} className="py-2.5 px-4 text-right uppercase text-[10px] tracking-wider text-slate-600">
                    Subtotal Puntos Aportados al Campo:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-teal-800 font-bold tabular-nums">
                    {campoNotaBase.toFixed(2)} pts
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#0f2942] font-bold tabular-nums">
                    {campoPuntos.toFixed(2)} / {campoMaxPeso.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Cálculo sincronizado con las actas de calificaciones registradas.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0f2942] hover:bg-[#163a5c] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
