import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { BookOpen, Users, CheckCircle, Clock, BookMarked, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function DashboardDocente() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    materiasTotales: 0,
    estudiantesTotales: 0,
    calificacionesCompletadas: 0,
    calificacionesPendientes: 0
  });

  // 1. Obtener materias asignadas
  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ['docenteMateriasDashboard'],
    queryFn: async () => {
      const res = await api.get('/calificaciones/materias');
      return res.data;
    }
  });

  // 2. Cargar cursantes de todas las materias para obtener métricas reales
  useEffect(() => {
    const fetchEstudiantesYNotas = async () => {
      if (!materias || materias.length === 0) return;
      
      try {
        let totalEstudiantes = 0;
        let completadas = 0;
        let pendientes = 0;

        const cursantesPromises = materias.map((m: any) => 
          api.get(`/calificaciones/materias/${m.materia_id}/cursantes`)
        );
        
        const cursantesResponses = await Promise.all(cursantesPromises);
        
        cursantesResponses.forEach(res => {
          const inscripciones = res.data;
          totalEstudiantes += inscripciones.length;

          // Calcular progreso de calificación (asumiendo que si tiene alguna calificación, cuenta como progreso)
          inscripciones.forEach((insc: any) => {
            let tieneNota = false;
            
            if (user?.rol === 'EVALUADOR') {
              // El evaluador se encarga de Parciales y Examen Final
              tieneNota = insc.calificaciones?.some((c: any) => 
                ['1er Parcial', '2do Parcial', 'Examen Final'].includes(c.evaluacion) && c.nota !== null
              );
            } else {
              // El docente se encarga de Apreciación Docente
              tieneNota = insc.calificaciones?.some((c: any) => 
                c.evaluacion === 'Apreciación Docente' && c.nota !== null
              );
            }

            if (tieneNota) {
              completadas++;
            } else {
              pendientes++;
            }
          });
        });

        setStats({
          materiasTotales: materias.length,
          estudiantesTotales: totalEstudiantes,
          calificacionesCompletadas: completadas,
          calificacionesPendientes: pendientes
        });

      } catch (error) {
        console.error("Error al cargar métricas de estudiantes", error);
      }
    };

    if (materias) {
      fetchEstudiantesYNotas();
    }
  }, [materias]);

  const COLORS = ['#0f766e', '#d97706']; // Verde institucional calificadas, Ámbar pendientes

  if (loadingMaterias) return (
    <div className="flex justify-center items-center h-full min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f2942] border-t-transparent"></div>
    </div>
  );

  const chartData = [
    { name: 'Calificadas', value: stats.calificacionesCompletadas },
    { name: 'Pendientes', value: stats.calificacionesPendientes }
  ];

  const progresoPorcentaje = stats.estudiantesTotales > 0 
    ? Math.round((stats.calificacionesCompletadas / stats.estudiantesTotales) * 100) 
    : 0;

  const isEvaluador = user?.rol === 'EVALUADOR';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      
      {/* Encabezado Ejecutivo Docente / Evaluador */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#0f2942]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942]">
              {isEvaluador ? 'Comisión Evaluadora • ECEMA' : 'Cuerpo Docente • ECEMA'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">
              {stats.materiasTotales} {stats.materiasTotales === 1 ? 'asignatura a cargo' : 'asignaturas a cargo'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {user?.grado ? `${user.grado} ` : ''}{user?.nombre}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isEvaluador
              ? 'Control de actas de 1er Parcial, 2do Parcial, Examen Final y Ponderación Curricular.'
              : 'Gestión de calificaciones de Apreciación Docente y seguimiento de cursantes asignados.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/calificaciones"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Abrir Planilla de Calificaciones
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Asignaturas</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.materiasTotales}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#0f2942] border border-slate-200/60 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cursantes</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.estudiantesTotales}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#0f2942] border border-slate-200/60 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avance de Registro</p>
            <p className="text-2xl font-mono font-bold text-teal-700 tabular-nums">{progresoPorcentaje}%</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 border border-teal-200/60 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Registros Pendientes</p>
            <p className="text-2xl font-mono font-bold text-amber-700 tabular-nums">{stats.calificacionesPendientes}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid Principal de Contenido */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Columna Izquierda: Mis Materias Activas */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#0f2942]" /> Asignaturas Habilitadas
            </h2>
          </div>
          
          {materias && materias.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materias.map((m: any) => {
                const nombreDiplomado = m.materia?.diplomado?.nombre?.toUpperCase() || '';
                const isDCEMA = nombreDiplomado.includes('DCEMA');
                const isDCEA = nombreDiplomado.includes('DCEA');
                
                const badgeStyle = isDCEMA 
                  ? 'bg-[#0f2942]/10 border-[#0f2942]/20 text-[#0f2942]'
                  : isDCEA
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700';

                return (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors flex flex-col h-full shadow-xs">
                    <div className="flex-1">
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded border ${badgeStyle}`}>
                          {m.edicion?.periodo?.gestion} • {m.materia?.diplomado?.nombre || 'General'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
                        {m.materia?.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Área: <span className="font-medium text-slate-700">{m.materia?.area?.nombre || 'General'}</span>
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-slate-100">
                      <Link
                        to="/dashboard/calificaciones"
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-[#0f2942] text-slate-700 hover:text-white text-xs font-semibold rounded-lg border border-slate-200/80 hover:border-[#0f2942] transition-colors"
                      >
                        <span>Registrar Calificaciones</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs font-medium">
              No registra asignaturas habilitadas en el periodo actual.
            </div>
          )}
        </div>

        {/* Columna Derecha: Gráfico de Estado */}
        <div className="w-full xl:w-72 shrink-0 space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Estado de Actas</h2>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center min-h-[260px] shadow-xs">
            {stats.estudiantesTotales > 0 ? (
              <>
                <div className="h-40 w-full mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-xs bg-teal-700"></div>
                      <span className="text-xs font-medium text-slate-700">Con calificación</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">{stats.calificacionesCompletadas}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-xs bg-amber-600"></div>
                      <span className="text-xs font-medium text-slate-700">Sin registro</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">{stats.calificacionesPendientes}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">
                <p className="text-xs font-medium">Sin cursantes matriculados<br/>para calcular avance.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
