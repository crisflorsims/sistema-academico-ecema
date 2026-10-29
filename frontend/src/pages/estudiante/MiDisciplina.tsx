import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Info, Calendar, Activity, RefreshCw } from 'lucide-react';

export function MiDisciplina() {
  const { user } = useAuthStore();
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inscripcionId, setInscripcionId] = useState<string>('');

  useEffect(() => {
    const fetchInscripcion = async () => {
      try {
        const res = await api.get('/inscripciones/mis-inscripciones');
        const activa = res.data.find((i: any) => i.estado === 'ACTIVO');
        if (activa) {
          setInscripcionId(activa.id.toString());
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchInscripcion();
  }, [user]);

  useEffect(() => {
    if (!inscripcionId) return;

    const fetchDisciplina = async () => {
      try {
        const res = await api.get(`/disciplina/inscripcion/${inscripcionId}`);
        setDatos(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisciplina();
  }, [inscripcionId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3">
      <div className="w-10 h-10 border-4 border-[#0f2942] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 text-sm font-medium">Consultando registro disciplinario...</p>
    </div>
  );
  
  if (!inscripcionId) return (
    <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-slate-800">Sin Inscripción Activa</h3>
      <p className="text-slate-500 text-sm mt-1">No registra inscripción activa para consultar foja disciplinaria.</p>
    </div>
  );
  
  if (!datos) return <div className="p-8 text-center text-red-600 font-semibold">Error al cargar el expediente disciplinario.</div>;

  const { estadisticas, demeritos } = datos;
  
  // Calcular porcentaje para el anillo de progreso
  const porcentajeRestante = Math.max(0, 100 - (estadisticas.puntosDisciplina / estadisticas.maxPuntos) * 100);
  const strokeDashoffset = 283 - (283 * porcentajeRestante) / 100; // 283 is approx 2 * pi * 45 (radius)

  // Color del anillo y estado
  const isDanger = estadisticas.puntosDisciplina >= estadisticas.maxPuntos * 0.8;
  const isWarning = estadisticas.puntosDisciplina > 0 && !isDanger;
  const ringColor = isDanger ? 'text-red-700' : isWarning ? 'text-amber-600' : 'text-teal-700';
  const bgRingColor = isDanger ? 'text-red-100' : isWarning ? 'text-amber-100' : 'text-teal-100';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Cabecera Ejecutiva Institucional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs border-l-4 border-l-[#0f2942] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-lg border shrink-0 ${
            isDanger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-[#0f2942]/5 border-[#0f2942]/15 text-[#0f2942]'
          }`}>
            {isDanger ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
              Jefatura de Cuerpo • Sección Disciplina
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Foja de Disciplina y Conducta Militar
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Control de coeficiente disciplinario, boletas de sanción y estado reglamentario del cursante.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Institucionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Gráfico Radial */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deméritos Acumulados</span>
            <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className={`text-3xl font-bold ${isDanger ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-teal-700'}`}>
                {estadisticas.puntosDisciplina.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400 font-semibold">/ {estadisticas.maxPuntos} pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Margen reglamentario disponible</p>
          </div>
          
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" className={bgRingColor} />
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${ringColor} transition-all duration-700 ease-out`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-mono tabular-nums font-bold ${ringColor}`}>{porcentajeRestante.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* KPI 2: Multiplicador */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unidades de Sanción (Base)</span>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className="text-3xl font-bold text-slate-900">
              {estadisticas.puntosPerdidosTotal}
            </span>
            <span className="text-sm text-slate-500 font-semibold">unidades</span>
          </div>
          <span className="text-xs font-medium text-slate-600 mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0f2942]" /> Coeficiente por unidad: <strong className="font-mono tabular-nums">{estadisticas.valorUnidad}</strong>
          </span>
        </div>

        {/* KPI 3: Estado Actual */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Situación Disciplinaria</span>
          <div className="flex items-center">
            {estadisticas.riesgoSeparacion ? (
               <div className="flex items-center gap-2.5 w-full bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-lg">
                 <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0"></span>
                 <span className="font-bold text-xs text-red-800 uppercase tracking-wide">Riesgo de Separación (Límite)</span>
               </div>
            ) : estadisticas.notificacion ? (
               <div className="flex items-center gap-2.5 w-full bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-lg">
                 <span className="h-2.5 w-2.5 rounded-full bg-amber-600 shrink-0"></span>
                 <span className="font-bold text-xs text-amber-800 uppercase tracking-wide">Observación Crítica (Notificado)</span>
               </div>
            ) : estadisticas.alerta ? (
               <div className="flex items-center gap-2.5 w-full bg-amber-50/70 border border-amber-200 px-3.5 py-2.5 rounded-lg">
                 <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"></span>
                 <span className="font-bold text-xs text-amber-800 uppercase tracking-wide">Alerta Preventiva</span>
               </div>
            ) : (
               <div className="flex items-center gap-2.5 w-full bg-teal-50 border border-teal-200 px-3.5 py-2.5 rounded-lg">
                 <span className="h-2.5 w-2.5 rounded-full bg-teal-600 shrink-0"></span>
                 <span className="font-bold text-xs text-teal-800 uppercase tracking-wide">Conducta Reglamentaria Normal</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Deméritos */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Registro Histórico de Boletas y Sanciones</h3>
            <p className="text-xs text-slate-500 mt-0.5">Asientos oficiales emitidos por la Jefatura de Cuerpo e Instrucción.</p>
          </div>
          <div className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        
        <div className="p-6">
          {demeritos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-teal-700 mb-3" />
              <h4 className="text-base font-bold text-slate-800">Sin Sanciones Registradas</h4>
              <p className="text-slate-500 text-xs mt-1">El cursante mantiene su foja disciplinaria sin deméritos en la presente gestión.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demeritos.map((d: any) => {
                const isGrave = d.tipo.includes('GRAVE');
                return (
                  <div key={d.id} className={`relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-white border border-slate-200 border-l-4 ${
                    isGrave ? 'border-l-red-700' : 'border-l-amber-600'
                  } hover:bg-slate-50/60 transition-colors`}>
                    
                    {/* Info Fecha e Icono */}
                    <div className="flex items-start gap-3 sm:w-1/4 shrink-0">
                      <div className={`p-2.5 rounded-lg border shrink-0 ${isGrave ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        {isGrave ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {d.fecha_falta ? 'Fecha de Falta' : 'Fecha de Registro'}
                        </p>
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-800 mt-0.5">
                          {new Date(d.fecha_falta || d.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {d.numero_boleta && (
                          <span className="inline-block mt-1 text-[11px] font-mono tabular-nums font-bold text-[#0f2942] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Boleta N° {d.numero_boleta}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Motivo de Infracción */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isGrave ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {d.tipo.replace('_', ' ')}
                        </span>
                        {(d.es_reincidencia || d.nivel_reincidencia > 1) && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Reincidencia x{d.nivel_reincidencia || 2}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{d.motivo}</p>
                      {d.sancionador && (
                        <p className="text-xs text-slate-500 mt-1.5">
                          Oficial Sancionador: <span className="text-slate-800 font-semibold">{d.sancionador}</span>
                        </p>
                      )}
                    </div>

                    {/* Impacto */}
                    <div className="sm:w-48 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Demérito Aplicado</p>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-red-50 text-red-700 font-mono tabular-nums font-bold text-sm border border-red-200">
                          -{d.puntos_totales_descontados} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Asentado por: {d.reportador ? `${d.reportador.nombre} ${d.reportador.apellido}` : 'Sistema'}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
