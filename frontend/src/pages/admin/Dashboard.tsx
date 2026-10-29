import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { GraduationCap, Users, BookOpen, ShieldCheck, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { DashboardDocente } from '../docente/DashboardDocente';
import { DashboardCursante } from '../estudiante/DashboardCursante';
import { DashboardInstruccion } from './DashboardInstruccion';

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, diplomas: 0, inscripciones: 0 });
  const [rendimiento, setRendimiento] = useState<{ diplomados: any[], areas: any[] }>({ diplomados: [], areas: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.rol !== 'ADMIN') return;
    const fetchStats = async () => {
      try {
        const [resGlobal, resRendimiento] = await Promise.all([
          api.get('/reportes/global'),
          api.get('/reportes/rendimiento')
        ]);
        
        setStats({
          users: resGlobal.data.usuarios.total,
          diplomas: resGlobal.data.academicos.diplomados,
          inscripciones: resGlobal.data.inscripciones.total
        });

        setRendimiento(resRendimiento.data);
      } catch (error) {
        console.error("Error al obtener estadísticas", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.rol]);

  if (user?.rol === 'DOCENTE' || user?.rol === 'EVALUADOR') {
    return <DashboardDocente />;
  }

  if (user?.rol === 'CURSANTE' || user?.rol === 'ESTUDIANTE') {
    return <DashboardCursante />;
  }

  if (user?.rol === 'INSTRUCCION') {
    return <DashboardInstruccion />;
  }

  const COLORS = ['#0f766e', '#be123c']; // Verde institucional aprobado, Rojo sobrio reprobado

  const StatCard = ({ item }: { item: any }) => {
    const data = [
      { name: 'Aprobados', value: item.aprobados },
      { name: 'Reprobados', value: item.reprobados }
    ];

    const total = item.aprobados + item.reprobados;
    const aprobadoPct = total > 0 ? Math.round((item.aprobados / total) * 100) : 0;

    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="border-b border-slate-100 pb-3.5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded border border-slate-200">
              <Calendar className="w-3 h-3 text-slate-500" /> Gestión {item.gestion}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
              N = {total}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.nombre}</h4>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="w-28 h-28 relative shrink-0">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={44}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">Sin registros</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 pl-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-700"></span>
                <span className="text-xs font-medium text-slate-600">Aprobados</span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">{item.aprobados}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-700"></span>
                <span className="text-xs font-medium text-slate-600">Observados</span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">{item.reprobados}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-medium text-slate-500">Índice de Aprobación</span>
            <span className="text-xs font-mono font-bold text-teal-700 tabular-nums">{aprobadoPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-teal-700 h-1.5 rounded-full transition-all duration-500" style={{ width: `${aprobadoPct}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  const Calendar = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Encabezado Ejecutivo Institucional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#0f2942]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942]">
              Dirección Académica • ECEMA
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Sistema Activo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Resumen General de Gestión Académica
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Consolidado estadístico de programas, matrícula activa y tasas de aprobación institucional.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200/80 shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#0f2942]" />
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsable en Sesión</p>
            <p className="text-xs font-bold text-slate-800">{user?.grado ? `${user.grado} ` : ''}{user?.nombre}</p>
          </div>
        </div>
      </div>
      
      {/* Tarjetas de Indicadores Globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Personal y Usuarios</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.users}</p>
            <p className="text-[11px] text-slate-400 mt-1">Registros habilitados en plataforma</p>
          </div>
          <div className="p-3 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Programas Académicos</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.diplomas}</p>
            <p className="text-[11px] text-slate-400 mt-1">Diplomados vigentes (DCEMA / DCEA)</p>
          </div>
          <div className="p-3 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Matrícula Total</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.inscripciones}</p>
            <p className="text-[11px] text-slate-400 mt-1">Inscripciones activas e históricas</p>
          </div>
          <div className="p-3 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <BookOpen size={22} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-52 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-2 border-[#0f2942] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Consultando registros académicos...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Diplomados Grid */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#0f2942]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rendimiento por Programa de Diplomado</h3>
                  <p className="text-xs text-slate-500">Relación de cursantes aprobados y observados según actas registradas.</p>
                </div>
              </div>
            </div>
            
            {rendimiento.diplomados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rendimiento.diplomados.map((item, idx) => (
                  <StatCard key={`dip-${idx}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-slate-600 text-xs font-medium">No existen registros de calificaciones consolidadas para mostrar.</p>
              </div>
            )}
          </div>

          {/* Areas Grid */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#0f2942]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rendimiento por Área Curricular</h3>
                  <p className="text-xs text-slate-500">Desglose de desempeño académico según áreas de formación.</p>
                </div>
              </div>
            </div>
            
            {rendimiento.areas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rendimiento.areas.map((item, idx) => (
                  <StatCard key={`area-${idx}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-slate-600 text-xs font-medium">No existen datos de rendimiento por área curricular.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
