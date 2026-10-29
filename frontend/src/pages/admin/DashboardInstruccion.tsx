import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, UserX, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import api from '../../services/api';

export function DashboardInstruccion() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAlertas, resHistorial] = await Promise.all([
          api.get('/disciplina/alertas'),
          api.get('/disciplina/historial')
        ]);
        setAlertas(resAlertas.data);
        setHistorial(resHistorial.data);
      } catch (error) {
        console.error("Error fetching instruccion data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const criticosCount = alertas.filter(a => a.estado === 'CRITICO').length;
  const alertasCount = alertas.filter(a => a.estado === 'ALERTA').length;
  const separacionCount = alertas.filter(a => a.estado === 'SEPARACION').length;
  
  const faltasRecientes = historial.slice(0, 5);

  const kpis = [
    {
      title: "Estado Crítico",
      value: criticosCount,
      icon: <AlertTriangle className="text-red-700" size={20} />,
      bgIcon: "bg-red-50 border-red-200",
      description: "Pérdida mayor al 50% de puntos",
    },
    {
      title: "En Alerta",
      value: alertasCount,
      icon: <ShieldAlert className="text-amber-700" size={20} />,
      bgIcon: "bg-amber-50 border-amber-200",
      description: "Pérdida mayor al 30% de puntos",
    },
    {
      title: "Riesgo de Separación",
      value: separacionCount,
      icon: <UserX className="text-rose-800" size={20} />,
      bgIcon: "bg-rose-50 border-rose-200",
      description: "Límite reglamentario alcanzado",
    },
    {
      title: "Faltas Registradas",
      value: historial.length,
      icon: <TrendingUp className="text-[#0f2942]" size={20} />,
      bgIcon: "bg-slate-100 border-slate-200",
      description: "Acumulado histórico de la gestión",
    }
  ];

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f2942] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs border-l-4 border-l-[#0f2942]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942]">
            Sección Instrucción y Disciplina • ECEMA
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Control Disciplinario y Deméritos
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Seguimiento de partes de sanción, alertas tempranas y cómputo de coeficiente disciplinario.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{kpi.value}</h3>
              </div>
              <div className={`p-2.5 rounded-lg border ${kpi.bgIcon}`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">{kpi.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0f2942]" /> Cursantes con Observación Disciplinaria
              </h3>
            </div>
            {alertas.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <ShieldCheck className="mx-auto text-teal-600 mb-2" size={28} />
                <p className="text-slate-600 text-xs font-medium">No se registran cursantes en situación de alerta disciplinaria.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alertas.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs
                        ${a.estado === 'CRITICO' ? 'bg-red-700' : a.estado === 'SEPARACION' ? 'bg-rose-900' : 'bg-amber-600'}
                      `}>
                        {a.cursante.nombre[0]}{a.cursante.apellido[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{a.cursante.grado} {a.cursante.nombre} {a.cursante.apellido}</h4>
                        <p className="text-[11px] text-slate-500">{a.diplomado}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-red-700 tabular-nums">-{a.puntosPerdidosTotal} pts</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded border uppercase
                        ${a.estado === 'CRITICO' ? 'bg-red-50 text-red-700 border-red-200' : a.estado === 'SEPARACION' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                      `}>
                        {a.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3.5">
              <Clock className="w-4 h-4 text-[#0f2942]" />
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Últimos Partes Registrados</h3>
            </div>
            
            <div className="space-y-3.5">
              {faltasRecientes.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No existen registros recientes.</p>
              ) : (
                faltasRecientes.map((f, i) => (
                  <div key={i} className="relative pl-3.5 border-l-2 border-slate-300 pb-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(f.fecha).toLocaleDateString()} {new Date(f.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="font-mono font-bold text-red-700 tabular-nums">-{f.total_descontado} pts</span>
                    </div>
                    <p className="text-xs font-bold mt-0.5 text-slate-800">{f.cursante}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2" title={f.motivo}>{f.motivo}</p>
                    {f.sancionador && (
                      <p className="text-[10px] text-slate-400 mt-1">Sanciona: {f.sancionador}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
