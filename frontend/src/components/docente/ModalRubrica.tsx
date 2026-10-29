import React, { useState, useEffect } from 'react';
import { showError } from '../../utils/alerts';

const CRITERIOS = [
  {id:1, n:"PARTICIPACIÓN", e:"Interviene voluntariamente en ≥90% de sesiones y sus aportes se sustentan en doctrina y normativa vigente.", mb:"Interviene en ≥80% y aporta criterios técnicos pertinentes.", b:"Interviene en ≥70% y sus aportes son básicos alineados al tema.", r:"Interviene en ≥60% y sus aportes carecen de sustento doctrinario.", i:"Interviene en <60% y no evidencia conocimiento doctrinario."},
  {id:2, n:"CUMPLIMIENTO DE TAREAS", e:"Entrega 100% en plazo y cumple formato doctrinario establecido.", mb:"Entrega ≥90% y presenta observaciones menores.", b:"Entrega ≥80% y cumple parcialmente la normativa.", r:"Entrega ≥70% y evidencia deficiencias metodológicas.", i:"Entrega <70% e incumple instrucciones académicas."},
  {id:3, n:"EXPOSICIONES", e:"Expone respetando tiempo asignado y emplea terminología doctrinaria correcta.", mb:"Expone dentro del tiempo y mantiene secuencia lógica militar.", b:"Expone dentro del límite del tiempo y terminología básica.", r:"Exposición no respeta el tiempo, desorganizada y lectura reiterada.", i:"No logra exponer y no emplea terminología técnica."},
  {id:4, n:"CALIDAD DE RESPUESTAS", e:"Responde correctamente en ≥90% y fundamenta en reglamentos.", mb:"Responde en ≥80% y aplica razonamiento doctrinario.", b:"Responde en ≥70% y con fundamentos básicos.", r:"Responde parcialmente y con imprecisiones conceptuales.", i:"No responde y evidencia desconocimiento doctrinario."},
  {id:5, n:"TRABAJO EN EQUIPO", e:"Asume liderazgo en ≥90% de actividades grupales y organiza tareas orientadas al cumplimiento de la misión común.", mb:"Asume liderazgo en ≥80% de actividades y coordina funciones manteniendo cohesión del equipo.", b:"Asume liderazgo cuando se le designa y distribuye tareas básicas para cumplir el objetivo.", r:"Lidera ocasionalmente (<60%) y la coordinación del equipo es limitada o incompleta.", i:"No asume liderazgo y no orienta al grupo hacia el cumplimiento de la misión."},
  {id:6, n:"INTEGRIDAD", e:"Cumple normas académicas en todo momento y respeta propiedad intelectual.", mb:"Cumple normas y corrige observaciones inmediatamente.", b:"Respeta normas básicas y requiere recordatorios.", r:"Omite normas y evidencia descuidos administrativos.", i:"Incumple disciplinario y muestra conducta inadecuada."},
  {id:7, n:"DISCIPLINA", e:"Puntualidad en ≥95% y mantiene porte militar reglamentario.", mb:"Puntualidad en ≥85% y cumple normas de aula.", b:"Presenta faltas leves y corrige conducta.", r:"Requiere llamados de atención y descuida normas.", i:"Indisciplina manifiesta; falta de respeto a la autoridad o negligencia en el servicio."},
  {id:8, n:"COMPROMISO", e:"Cumple normas institucionales en ≥90% de sesiones y ejecuta voluntariamente tareas orientadas a la misión académica.", mb:"Cumple normas en ≥80% y ejecuta tareas con mínima supervisión.", b:"Cumple normas básicas y realiza tareas asignadas.", r:"Cumple parcialmente normas y requiere recordatorios para ejecutar tareas.", i:"Incumple normas institucionales y no ejecuta tareas de la misión académica."},
  {id:9, n:"EXCELENCIA", e:"Supera los estándares previstos; sus trabajos son modelo para futuras gestiones académicas.", mb:"Mantiene un estándar de calidad superior en la ejecución de todas sus tareas académicas.", b:"Logra los estándares de calidad definidos en los objetivos de la materia.", r:"Calidad de trabajo irregular; cumple los requisitos mínimos de suficiencia.", i:"Desempeño por debajo del estándar militar aceptable; falta de rigor profesional."},
  {id:10, n:"VOCACIÓN DE SERVICIO", e:"Antepone el servicio a intereses personales; espíritu de sacrificio y abnegación constante.", mb:"Actitud proactiva ante las necesidades del curso y sus camaradas.", b:"Colabora correctamente en las tareas de apoyo asignadas por la superioridad.", r:"Colabora parcialmente y requiere supervisión.", i:"No colabora y evidencia actitud individualista."},
];

const NIV_VAL: any = { e: 9.75, mb: 9.2, b: 8.7, r: 8.0, i: 5.0 };

export interface RubricaData {
  notas: Record<number, number>;
  observaciones: string;
}

interface ModalRubricaProps {
  isOpen: boolean;
  onClose: () => void;
  cursanteNombre: string;
  inscripcion_materia_id: number;
  rubricaAnterior?: Record<number, number>;
  observacionesAnteriores?: string;
  onSave: (inscripcion_materia_id: number, data: RubricaData, notaFinal: number) => void;
  onImprimirOficial?: (notas: Record<number, number>, observaciones: string, notaFinal: number) => void;
}

export function ModalRubrica({ 
  isOpen, 
  onClose, 
  cursanteNombre, 
  inscripcion_materia_id,
  rubricaAnterior, 
  observacionesAnteriores, 
  onSave, 
  onImprimirOficial 
}: ModalRubricaProps) {
  const [notas, setNotas] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (rubricaAnterior) {
        setNotas(rubricaAnterior);
        setObservaciones(observacionesAnteriores || '');
      } else {
        setNotas({});
        setObservaciones('');
      }
    }
  }, [isOpen, rubricaAnterior, observacionesAnteriores]);

  if (!isOpen) return null;

  const total = Object.values(notas).reduce((acc, curr) => acc + curr, 0);
  const isComplete = Object.keys(notas).length === CRITERIOS.length;
  const requiresObs = isComplete && (total < 75 || total > 95);

  const handleSelect = (id: number, nivel: string) => {
    setNotas(prev => ({ ...prev, [id]: NIV_VAL[nivel] }));
  };

  const handleManualInput = (id: number, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setNotas(prev => ({ ...prev, [id]: num }));
    } else if (val === '') {
      setNotas(prev => {
        const newNotas = { ...prev };
        delete newNotas[id];
        return newNotas;
      });
    }
  };

  const getNivelForValue = (val: number) => {
    if (val >= 9.5) return 'e';
    if (val >= 9.0) return 'mb';
    if (val >= 8.5) return 'b';
    if (val >= 7.5) return 'r';
    return 'i';
  };

  const getBadgeClass = (val: number) => {
    if (val >= 9.5) return 'bg-teal-100 text-teal-900 border-teal-300';
    if (val >= 9.0) return 'bg-teal-50 text-teal-800 border-teal-200';
    if (val >= 8.5) return 'bg-slate-100 text-slate-800 border-slate-300';
    if (val >= 7.5) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  const handleSave = () => {
    if (!isComplete) {
      showError("Debe calificar los 10 criterios antes de guardar.", "Aviso");
      return;
    }
    if (requiresObs && !observaciones.trim()) {
      showError("La nota final es menor a 75 o mayor a 95. Es obligatorio ingresar observaciones.", "Aviso");
      return;
    }
    const roundedTotal = Math.round(total * 100) / 100;
    onSave(inscripcion_materia_id, { notas, observaciones }, roundedTotal);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div id="printable-rubrica" className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0f2942] px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-0.5">
              Evaluación Doctrinaria y Conceptual (10%)
            </span>
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">Rúbrica de Apreciación Docente</h2>
            <p className="text-slate-300 text-xs mt-0.5">Cursante: <strong className="text-white">{cursanteNombre}</strong></p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer no-print">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/70">
          <div className="mb-4 text-xs text-slate-700 bg-white border border-slate-200 border-l-4 border-l-[#0f2942] p-3.5 rounded-lg flex items-start gap-2.5 shadow-2xs no-print">
            <span className="font-bold text-[#0f2942] uppercase tracking-wider shrink-0">Instrucción:</span>
            <p>Seleccione el descriptor del nivel correspondiente o ingrese la nota manualmente (<span className="font-mono font-bold">0.0 – 10.0</span>) en la columna derecha. Las calificaciones totales <span className="font-mono font-bold">&lt; 75.00</span> o <span className="font-mono font-bold">&gt; 95.00</span> requieren observación fundamentada (Art. 25 ECEMA).</p>
          </div>

          <table className="w-full text-left text-xs bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <thead className="bg-[#0f2942] text-white text-center">
              <tr>
                <th className="py-2.5 px-2 border-r border-white/15 w-8 font-bold text-[10px] uppercase tracking-wider">N°</th>
                <th className="py-2.5 px-3 border-r border-white/15 w-36 font-bold text-[10px] uppercase tracking-wider text-left">Criterio</th>
                <th className="py-2.5 px-2 border-r border-white/15 w-40 font-bold text-[10px] uppercase tracking-wider">Excelente<br/><span className="text-[9px] text-amber-300 font-mono font-normal">(9.5–10)</span></th>
                <th className="py-2.5 px-2 border-r border-white/15 w-40 font-bold text-[10px] uppercase tracking-wider">Muy Bueno<br/><span className="text-[9px] text-slate-300 font-mono font-normal">(9.0–9.4)</span></th>
                <th className="py-2.5 px-2 border-r border-white/15 w-40 font-bold text-[10px] uppercase tracking-wider">Bueno<br/><span className="text-[9px] text-slate-300 font-mono font-normal">(8.5–8.9)</span></th>
                <th className="py-2.5 px-2 border-r border-white/15 w-40 font-bold text-[10px] uppercase tracking-wider">Regular<br/><span className="text-[9px] text-slate-300 font-mono font-normal">(7.5–8.4)</span></th>
                <th className="py-2.5 px-2 border-r border-white/15 w-40 font-bold text-[10px] uppercase tracking-wider">Insuficiente<br/><span className="text-[9px] text-slate-300 font-mono font-normal">(1.0–7.4)</span></th>
                <th className="py-2.5 px-2 w-20 font-bold text-[10px] uppercase tracking-wider">Nota /10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {CRITERIOS.map(cr => {
                const val = notas[cr.id];
                const activeNivel = val !== undefined ? getNivelForValue(val) : null;
                
                return (
                  <tr key={cr.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-2 text-center text-slate-400 font-mono tabular-nums font-bold">{cr.id}</td>
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200 text-[11px]">{cr.n}</td>
                    
                    {['e', 'mb', 'b', 'r', 'i'].map((nivel) => {
                      const desc = cr[nivel as keyof typeof cr] as string;
                      const isActive = activeNivel === nivel;
                      let activeClass = '';
                      if (isActive) {
                        if(nivel==='e') activeClass='bg-teal-50 border-teal-500 text-teal-950 font-semibold ring-1 ring-teal-500/30';
                        if(nivel==='mb') activeClass='bg-teal-50/60 border-teal-400 text-teal-900 font-semibold';
                        if(nivel==='b') activeClass='bg-slate-100 border-slate-400 text-slate-900 font-semibold';
                        if(nivel==='r') activeClass='bg-amber-50 border-amber-400 text-amber-900 font-semibold';
                        if(nivel==='i') activeClass='bg-red-50 border-red-400 text-red-900 font-semibold';
                      }

                      return (
                        <td key={nivel} className="p-1.5 border-r border-slate-200">
                          <div 
                            onClick={() => handleSelect(cr.id, nivel)}
                            className={`p-2 rounded-md h-full cursor-pointer transition-all border border-transparent hover:border-slate-300 text-[11px] leading-snug ${activeClass} ${!isActive && 'text-slate-600 hover:bg-slate-100/70'}`}
                          >
                            {desc}
                          </div>
                        </td>
                      );
                    })}
                    
                    <td className="p-2 text-center align-middle">
                      <input 
                        type="number" 
                        min="0" max="10" step="0.1"
                        value={val !== undefined ? val : ''}
                        onChange={(e) => handleManualInput(cr.id, e.target.value)}
                        className={`w-16 px-2 py-1.5 text-center border rounded-md font-bold font-mono tabular-nums outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] ${val !== undefined ? getBadgeClass(val) : 'border-slate-300 bg-slate-50'} print:border-none print:bg-transparent`}
                        placeholder="-"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {requiresObs && (
            <div className="mt-5 bg-red-50 border border-red-200 border-l-4 border-l-red-700 rounded-lg p-4">
              <h4 className="font-bold text-red-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Observaciones Obligatorias (Art. 25 ECEMA)
              </h4>
              <p className="text-red-700 text-xs mb-2.5">La calificación final requiere justificación docente documentada al ser menor a 75.00 o superior a 95.00 puntos.</p>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-white border border-red-300 rounded-lg p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none"
                rows={3}
                placeholder="Justifique con evidencias concretas de desempeño observado en el cursante..."
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Calificación Total:</div>
            <div className={`text-xl font-black font-mono tabular-nums px-3 py-1 rounded-lg border ${total >= 75 ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {total.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={() => {
                if (onImprimirOficial) {
                  onImprimirOficial(notas, observaciones, total);
                } else {
                  window.print();
                }
              }} 
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#0f2942]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir Acta
            </button>
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={!isComplete}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${isComplete ? 'bg-[#0f2942] text-white hover:bg-[#163a5c] shadow-xs' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              Guardar Apreciación
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
