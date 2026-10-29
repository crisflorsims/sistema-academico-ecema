import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, GraduationCap, Award, TrendingUp, ChevronRight, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export function DashboardCursante() {
  const { user } = useAuthStore();

  const { data: inscripciones, isLoading: isLoadingNotas } = useQuery({
    queryKey: ['mis-notas-dashboard'],
    queryFn: async () => {
      const res = await api.get('/estudiantes/mis-notas');
      return res.data;
    },
    enabled: user?.rol === 'CURSANTE' || user?.rol === 'ESTUDIANTE'
  });

  const { data: misInscripciones } = useQuery({
    queryKey: ['mis-inscripciones-dashboard'],
    queryFn: async () => {
      const res = await api.get('/inscripciones/mis-inscripciones');
      return res.data;
    },
    enabled: user?.rol === 'CURSANTE' || user?.rol === 'ESTUDIANTE'
  });

  const activeInscripcionId = useMemo(() => {
    return misInscripciones?.find((i: any) => i.estado === 'ACTIVO')?.id;
  }, [misInscripciones]);

  const { data: disciplinaData, isLoading: isLoadingDisciplina } = useQuery({
    queryKey: ['mi-disciplina-dashboard', activeInscripcionId],
    queryFn: async () => {
      if (!activeInscripcionId) return null;
      const res = await api.get(`/disciplina/inscripcion/${activeInscripcionId}`);
      return res.data;
    },
    enabled: !!activeInscripcionId
  });

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!inscripciones) return { activos: 0, egresados: 0, promedioGeneral: 0, totalMateriasAprobadas: 0 };
    
    let activos = 0;
    let egresados = 0;
    let sumPromedios = 0;
    let countPromedios = 0;
    let materiasAprobadas = 0;

    inscripciones.forEach((insc: any) => {
      if (insc.estado === 'ACTIVO') activos++;
      if (insc.estado === 'EGRESADO') egresados++;

      insc.materias?.forEach((im: any) => {
        const getNota = (ev: string) => im.calificaciones?.find((c: any) => c.evaluacion === ev)?.nota;
        const p1 = getNota('1er Parcial');
        const p2 = getNota('2do Parcial');
        const fin = getNota('Examen Final');
        const apr = getNota('Apreciación Docente');

        if (p1 !== undefined && p2 !== undefined && fin !== undefined && apr !== undefined) {
          const prom = (p1 * 0.25) + (p2 * 0.25) + (fin * 0.40) + (apr * 0.10);
          sumPromedios += prom;
          countPromedios++;
          if (prom >= 60) materiasAprobadas++; // Assuming 60 is passing grade
        }
      });
    });

    return {
      activos,
      egresados,
      promedioGeneral: countPromedios > 0 ? (sumPromedios / countPromedios).toFixed(2) : 0,
      totalMateriasAprobadas: materiasAprobadas
    };
  }, [inscripciones]);

  if (isLoadingNotas) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f2942] border-t-transparent"></div>
      </div>
    );
  }

  const estadoDisciplina = disciplinaData?.estadisticas;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Encabezado Institucional del Cursante */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#0f2942]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942]">
              Expediente Académico • ECEMA
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">
              Cursante Activo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {user?.grado ? `${user.grado} ` : ''}{user?.nombre}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Seguimiento de calificaciones modulares, ponderación curricular y registro disciplinario.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/mis-notas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Kardex de Notas
          </Link>
          <Link
            to="/dashboard/mi-ponderacion"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            Ponderación Final
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna Izquierda: KPIs Académicos */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Programas Activos</p>
              <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.activos}</p>
            </div>
            <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Promedio Académico</p>
              <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.promedioGeneral}</p>
            </div>
            <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Asignaturas Aprobadas</p>
              <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{stats.totalMateriasAprobadas}</p>
            </div>
            <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
              <GraduationCap size={20} />
            </div>
          </div>
        </div>

        {/* Columna Derecha: KPI Disciplina */}
        <div className="lg:col-span-1">
          <div className={`h-full p-5 rounded-xl shadow-xs border ${
            estadoDisciplina?.riesgoSeparacion ? 'bg-red-50/70 border-red-200' :
            estadoDisciplina?.notificacion ? 'bg-amber-50/70 border-amber-200' :
            estadoDisciplina?.alerta ? 'bg-yellow-50/70 border-yellow-200' :
            'bg-white border-slate-200'
          } flex flex-col justify-between`}>
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-slate-500">Coeficiente de Disciplina</p>
                {isLoadingDisciplina ? (
                  <div className="h-7 w-24 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  <h3 className={`text-2xl font-mono font-bold tabular-nums ${
                    estadoDisciplina?.riesgoSeparacion ? 'text-red-700' :
                    estadoDisciplina?.notificacion ? 'text-amber-700' :
                    estadoDisciplina?.alerta ? 'text-yellow-700' :
                    'text-slate-900'
                  }`}>
                    {estadoDisciplina ? estadoDisciplina.puntosDisciplina.toFixed(1) : '0.0'} 
                    <span className="text-xs font-sans font-medium text-slate-500"> / {estadoDisciplina?.maxPuntos || 50} pts</span>
                  </h3>
                )}
              </div>
              <div className={`p-2.5 rounded-lg border ${
                estadoDisciplina?.riesgoSeparacion ? 'bg-red-100 border-red-200 text-red-700' :
                estadoDisciplina?.notificacion ? 'bg-amber-100 border-amber-200 text-amber-700' :
                estadoDisciplina?.alerta ? 'bg-yellow-100 border-yellow-200 text-yellow-700' :
                'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                {estadoDisciplina?.riesgoSeparacion || estadoDisciplina?.notificacion || estadoDisciplina?.alerta ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {!isLoadingDisciplina && estadoDisciplina ? (
                <span className="text-xs font-medium text-slate-600">
                  {estadoDisciplina.riesgoSeparacion ? 'Límite reglamentario alcanzado' :
                   estadoDisciplina.notificacion ? 'Observación disciplinaria activa' :
                   estadoDisciplina.alerta ? 'Con deméritos registrados' :
                   'Sin observaciones críticas'}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Registro de sección instrucción</span>
              )}
              
              <Link to="/dashboard/mi-disciplina" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f2942] hover:underline">
                Ver foja <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Active Diplomas List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Programas Matriculados</h2>
          <Link to="/dashboard/mis-notas" className="text-xs font-semibold text-[#0f2942] hover:underline flex items-center gap-1">
            Detalle completo de notas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!inscripciones || inscripciones.length === 0) ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">Sin matrícula registrada</h3>
            <p className="text-xs text-slate-500">No registra inscripción activa en el periodo vigente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inscripciones.map((insc: any) => (
              <div key={insc.id} className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          insc.estado === 'ACTIVO' ? 'bg-[#0f2942]/10 text-[#0f2942] border-[#0f2942]/20' :
                          insc.estado === 'EGRESADO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {insc.estado}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Gestión {insc.edicion.periodo.gestion} {insc.edicion.periodo.semestre ? `• Semestre ${insc.edicion.periodo.semestre}` : ''}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {insc.edicion.diplomado.nombre}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                    <Link to="/dashboard/mis-notas" className="flex-1 inline-flex justify-center items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs">
                      Kardex de Calificaciones <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <Link to="/dashboard/mi-ponderacion" className="inline-flex justify-center items-center gap-1.5 px-3.5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white font-semibold rounded-lg transition-colors text-xs">
                      <Award className="w-3.5 h-3.5" /> Ponderación Final
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
