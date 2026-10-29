import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { generarPonderacionPDF } from '../../utils/generarPonderacion';
import { 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  BookOpen, 
  Target, 
  HelpCircle,
  Clock,
  Lock,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

const DCEA_COLUMNS = [
  { id: 'doctrinario', name: 'Doctrinario Específico', percent: 28, areaKeywords: ['DOCTRINARIO', 'ESPECIFICO', 'DOCTRINA'] },
  { id: 'militar', name: 'Militar', percent: 17, areaKeywords: ['MILITAR'] },
  { id: 'seguridad', name: 'Seguridad y Defensa', percent: 8, areaKeywords: ['SEGURIDAD', 'DEFENSA'] },
  { id: 'comando', name: 'Comando y Adm.', percent: 7, areaKeywords: ['COMANDO', 'ADMINISTRACION', 'ADMINISTRATIVA'] },
  { id: 'juegos', name: 'Juegos Administrativos', percent: 2, areaKeywords: ['JUEGOS'] },
  { id: 'preoral', name: 'Examen Pre-Oral', percent: 2, areaKeywords: [] },
  { id: 'oral', name: 'Examen Oral', percent: 25, areaKeywords: [] },
  { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1, areaKeywords: ['TRABAJOS'] },
  { id: 'fisico', name: 'Actividades Físicas', percent: 4, areaKeywords: ['FISICO', 'FISICA'] },
  { id: 'disciplina', name: 'Disciplina Militar', percent: 3, isDisciplina: true, areaKeywords: [] },
  { id: 'apreciacion', name: 'Apreciación de Planta', percent: 3, areaKeywords: [] },
];

const DCEMA_COLUMNS = [
  { id: 'doctrinario', name: 'Doctrinario Específico', percent: 17.5, areaKeywords: ['DOCTRINARIO', 'ESPECIFICO', 'DOCTRINA'] },
  { id: 'militar', name: 'Militar', percent: 10.5, areaKeywords: ['MILITAR'] },
  { id: 'seguridad', name: 'Seguridad y Defensa', percent: 5, areaKeywords: ['SEGURIDAD', 'DEFENSA'] },
  { id: 'comando', name: 'Comando y Administración', percent: 4, areaKeywords: ['COMANDO', 'ADMINISTRACION', 'ADMINISTRATIVA'] },
  { id: 'ejercicios', name: 'Ejercicios Operativos', percent: 20, areaKeywords: ['EJERCICIOS', 'OPERATIVOS'] },
  { id: 'preoral', name: 'Examen Pre-Oral', percent: 2, areaKeywords: [] },
  { id: 'oral', name: 'Examen Oral', percent: 30, areaKeywords: [] },
  { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1, areaKeywords: ['TRABAJOS'] },
  { id: 'fisico', name: 'Actividades Físico Deportivas', percent: 4, areaKeywords: ['FISICO', 'FISICA', 'DEPORTIVAS'] },
  { id: 'disciplina', name: 'Disciplina Militar', percent: 3, isDisciplina: true, areaKeywords: [] },
  { id: 'apreciacion', name: 'Apreciación Planta Académica', percent: 3, areaKeywords: [] },
];

export function MiPonderacionFinal() {
  const { user } = useAuthStore();
  const [selectedInscId, setSelectedInscId] = useState<number | null>(null);
  const [vistaDCEA, setVistaDCEA] = useState<'CAMPOS' | 'AREAS' | 'TARJETAS'>('CAMPOS');

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['mis-inscripciones-ponderacion'],
    queryFn: async () => {
      const res = await api.get('/inscripciones/mis-inscripciones');
      return res.data;
    },
    enabled: user?.rol === 'CURSANTE' || user?.rol === 'ESTUDIANTE'
  });

  // Inscripción seleccionada activa
  const inscripcion = useMemo(() => {
    if (!inscripciones || inscripciones.length === 0) return null;
    if (selectedInscId) {
      return inscripciones.find((i: any) => i.id === selectedInscId) || inscripciones[0];
    }
    const activa = inscripciones.find((i: any) => i.estado === 'ACTIVO');
    return activa || inscripciones[0];
  }, [inscripciones, selectedInscId]);

  // Determinar diplomado (DCEA vs DCEMA)
  const isDCEMA = useMemo(() => {
    const nombre = inscripcion?.edicion?.diplomado?.nombre?.toUpperCase() || '';
    return nombre.includes('DCEMA');
  }, [inscripcion]);

  const activeColumns = isDCEMA ? DCEMA_COLUMNS : DCEA_COLUMNS;

  // Promedio de materias por área si no hay nota manual asentada
  const promediosMateriasPorArea = useMemo(() => {
    if (!inscripcion?.materias) return {};

    const sumas: Record<string, { total: number; count: number }> = {};

    inscripcion.materias.forEach((im: any) => {
      const area = im.materia?.area?.nombre?.toUpperCase() || '';
      const getNota = (ev: string) => im.calificaciones?.find((c: any) => c.evaluacion === ev)?.nota;
      const p1 = getNota('1er Parcial');
      const p2 = getNota('2do Parcial');
      const fin = getNota('Examen Final');
      const apr = getNota('Apreciación Docente');

      if (p1 !== undefined && p2 !== undefined && fin !== undefined && apr !== undefined) {
        const prom = (p1 * 0.25) + (p2 * 0.25) + (fin * 0.40) + (apr * 0.10);
        
        if (!sumas[area]) sumas[area] = { total: 0, count: 0 };
        sumas[area].total += prom;
        sumas[area].count += 1;
      }
    });

    const resultado: Record<string, number> = {};
    Object.keys(sumas).forEach(k => {
      resultado[k] = sumas[k].total / sumas[k].count;
    });
    return resultado;
  }, [inscripcion]);

  // Calcular desglose de cada columna
  const desglose = useMemo(() => {
    if (!inscripcion) return [];
    const rawNotas = (inscripcion.ponderaciones as Record<string, any>) || {};

    return activeColumns.map(col => {
      let notaBase: number | null = null;
      let fuente: 'OFICIAL' | 'CALCULADO' | 'PENDIENTE' = 'PENDIENTE';

      // 1. Revisar si hay nota oficial en ponderaciones
      if (rawNotas[col.id] !== undefined && rawNotas[col.id] !== '' && !isNaN(Number(rawNotas[col.id]))) {
        notaBase = Number(rawNotas[col.id]);
        fuente = 'OFICIAL';
      } 
      // 2. Si no hay nota y es un área de materias, estimar con el promedio real de materias cursadas
      else if (col.areaKeywords && col.areaKeywords.length > 0) {
        for (const [areaName, prom] of Object.entries(promediosMateriasPorArea)) {
          if (col.areaKeywords.some(kw => areaName.includes(kw))) {
            notaBase = Number(prom);
            fuente = 'CALCULADO';
            break;
          }
        }
      }

      const puntosPonderados = notaBase !== null 
        ? parseFloat(((notaBase * col.percent) / 100).toFixed(2)) 
        : null;

      return {
        ...col,
        notaBase,
        puntosPonderados,
        fuente
      };
    });
  }, [inscripcion, activeColumns, promediosMateriasPorArea]);

  // Resumen global
  const metricas = useMemo(() => {
    let puntosAcumulados = 0;
    let porcentajeEvaluado = 0;
    let rubrosCompletados = 0;

    desglose.forEach(item => {
      if (item.puntosPonderados !== null) {
        puntosAcumulados += item.puntosPonderados;
        porcentajeEvaluado += item.percent;
        rubrosCompletados++;
      }
    });

    const proyeccionFinal = porcentajeEvaluado > 0 
      ? (puntosAcumulados / porcentajeEvaluado) * 100 
      : 0;

    return {
      puntosAcumulados: puntosAcumulados.toFixed(2),
      porcentajeEvaluado: porcentajeEvaluado.toFixed(1),
      proyeccionFinal: proyeccionFinal.toFixed(2),
      rubrosCompletados,
      totalRubros: desglose.length
    };
  }, [desglose]);

  const handleExportPDF = () => {
    if (!inscripcion || !user) return;

    // Adaptar formato esperado por generarPonderacionPDF
    const notasEnPorcentaje: Record<string, number | ''> = {};
    desglose.forEach(col => {
      if (col.puntosPonderados !== null) {
        notasEnPorcentaje[col.id] = col.puntosPonderados;
      }
    });

    const cursanteData = [{
      id: inscripcion.id,
      grado: user.grado,
      nombre: user.nombre,
      apellido: user.apellido,
      cm: user.cm,
      notas: notasEnPorcentaje
    }];

    generarPonderacionPDF({
      diplomado: isDCEMA 
        ? 'Diplomado de Comando y Estado Mayor Aéreo (DCEMA)' 
        : 'Diplomado de Comando de Escuadrón Aéreo (DCEA)',
      cursantes: cursanteData,
      columns: activeColumns
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f2942] border-t-transparent"></div>
      </div>
    );
  }

  if (!inscripcion) {
    return (
      <div className="bg-white rounded-xl p-10 text-center max-w-xl mx-auto border border-slate-200 shadow-xs">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Sin Diplomado Activo</h3>
        <p className="text-slate-500 mt-1 text-xs">
          No registra ninguna inscripción activa en el periodo vigente.
        </p>
      </div>
    );
  }

  // Datos DCEA detallados
  const detallesDCEA = inscripcion?.detallesDCEA;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Encabezado Institucional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs border-l-4 border-l-[#0f2942]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#0f2942]/10 text-[#0f2942] border border-[#0f2942]/20">
                {isDCEMA ? 'DCEMA' : 'DCEA (Actual-2025)'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-600">
                Gestión {inscripcion.edicion?.periodo?.gestion}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-teal-700">
                Estado: {inscripcion.estado}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cuadro de Ponderación Final de Graduación
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Consolidado oficial de los rubros evaluados hacia el egreso reglamentario de la ECEMA.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5c] text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Planilla Oficial (PDF)</span>
          </button>
        </div>

        {/* Selector de diplomados si tiene varios */}
        {inscripciones && inscripciones.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Programa:</span>
            <div className="flex flex-wrap gap-2">
              {inscripciones.map((ins: any) => (
                <button
                  key={ins.id}
                  onClick={() => setSelectedInscId(ins.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    ins.id === inscripcion.id
                      ? 'bg-[#0f2942] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ins.edicion?.diplomado?.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Puntos Acumulados */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Puntaje Acumulado</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {metricas.puntosAcumulados}
              <span className="text-xs font-sans font-normal text-slate-400"> / 100</span>
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Avance Evaluativo */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subtotal Académico</p>
            <p className="text-2xl font-mono font-bold text-[#0f2942] tabular-nums">
              {detallesDCEA ? detallesDCEA.subtotalAcademicoPuntos.toFixed(2) : '—'}
              <span className="text-xs font-sans font-normal text-slate-400 ml-1">/ 60.00</span>
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Proyección Final */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Proyección de Egreso</p>
            <p className="text-2xl font-mono font-bold text-teal-700 tabular-nums">
              {metricas.proyeccionFinal}
              <span className="text-xs font-sans font-normal text-slate-400"> / 100</span>
            </p>
          </div>
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200/60">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Disciplina */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Disciplina (3%)</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {inscripcion.ponderaciones?.disciplina !== undefined ? Number(inscripcion.ponderaciones.disciplina).toFixed(1) : '100.0'}
              <span className="text-xs font-sans font-normal text-slate-400"> pts</span>
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 text-[#0f2942] rounded-lg border border-slate-200/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Selector de Vistas para DCEA */}
      {!isDCEMA && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0f2942]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Estructura Curricular DCEA:</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setVistaDCEA('CAMPOS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                vistaDCEA === 'CAMPOS'
                  ? 'bg-[#0f2942] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Campos (60% Académico + 40% Especial)
            </button>
            <button
              onClick={() => setVistaDCEA('AREAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                vistaDCEA === 'AREAS'
                  ? 'bg-[#0f2942] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Áreas I, II, III, IV
            </button>
            <button
              onClick={() => setVistaDCEA('TARJETAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                vistaDCEA === 'TARJETAS'
                  ? 'bg-[#0f2942] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumen de Rubros
            </button>
          </div>
        </div>
      )}

      {/* VISTA 1: POR CAMPOS OFICIALES DCEA */}
      {!isDCEMA && vistaDCEA === 'CAMPOS' && detallesDCEA && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-5 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Planilla Desglosada por Campos Académicos (60.00%)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Las 20 asignaturas curriculares se consolidan automáticamente en los 4 campos reglamentarios.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 text-slate-900 px-3.5 py-2 rounded-lg text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Subtotal Académico</span>
              <span className="text-sm font-mono font-bold text-[#0f2942] tabular-nums">{detallesDCEA.subtotalAcademicoPuntos.toFixed(2)} / 60.00 pts</span>
            </div>
          </div>

          {/* Recorrer los 4 campos */}
          {[
            { key: 'doctrinario', titulo: 'CAMPO DOCTRINARIO ESPECÍFICO', peso: 28 },
            { key: 'militar', titulo: 'CAMPO MILITAR', peso: 17 },
            { key: 'seguridad', titulo: 'CAMPO DE SEGURIDAD Y DEFENSA', peso: 8 },
            { key: 'comando', titulo: 'CAMPO COMANDO Y ADMINISTRACIÓN', peso: 7 }
          ].map(campoConf => {
            const campoData = detallesDCEA.campos[campoConf.key];
            if (!campoData) return null;

            return (
              <div key={campoConf.key} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#0f2942] text-white tabular-nums">
                      {campoConf.peso}.00%
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
                      {campoConf.titulo}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Promedio Base: </span>
                      <span className="font-mono font-bold text-slate-800 tabular-nums">{campoData.notaBase.toFixed(2)} / 100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Puntos Ponderados: </span>
                      <span className="font-mono font-bold text-[#0f2942] tabular-nums">{campoData.puntos.toFixed(2)} / {campoConf.peso}.00 pts</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">N°</th>
                        <th className="py-2 px-3">Asignatura</th>
                        <th className="py-2 px-3 text-center w-24">Área</th>
                        <th className="py-2 px-2 text-right w-20">1er P. (25%)</th>
                        <th className="py-2 px-2 text-right w-20">2do P. (25%)</th>
                        <th className="py-2 px-2 text-right w-20">Final (40%)</th>
                        <th className="py-2 px-2 text-right w-20">Apr. (10%)</th>
                        <th className="py-2 px-3 text-right w-24">Nota (100)</th>
                        <th className="py-2 px-3 text-right w-28">Puntos DCEA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campoData.materias.map((m: any, idx: number) => {
                        const d = m.desglose;
                        const formatVal = (v: number | null) => v !== null && v !== undefined ? v.toFixed(1) : '—';
                        return (
                          <tr key={m.materia_id || idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800">{m.nombreOficial}</span>
                              {m.nombreRegistrado !== m.nombreOficial && (
                                <span className="text-[10px] text-slate-400 ml-2">({m.nombreRegistrado})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                                {m.area}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.p1)}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.p2)}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.fin)}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600 tabular-nums">{formatVal(d?.apr)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                              {m.notaFinal !== null ? m.notaFinal.toFixed(2) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#0f2942] bg-slate-50/60 tabular-nums">
                              {m.puntosAportados.toFixed(2)} <span className="text-[10px] font-sans font-normal text-slate-400">({m.peso}%)</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Evaluaciones Especiales (40%) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#0f2942] text-white tabular-nums">
                  40.00%
                </span>
                <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
                  Evaluaciones Especiales y Disciplina Militar
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Comisión Evaluadora</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Rubro de Evaluación</th>
                    <th className="py-2 px-3 text-right w-28">Peso Oficial</th>
                    <th className="py-2 px-3 text-right w-32">Nota Base (0-100)</th>
                    <th className="py-2 px-3 text-right w-36">Puntos Aportados</th>
                    <th className="py-2 px-3 text-center w-36">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: 'preoral', nombre: 'Examen Pre-oral', peso: 2 },
                    { id: 'oral', nombre: 'Examen Oral', peso: 25 },
                    { id: 'juegos', nombre: 'Juegos Jaga / Intr. FÉNIX / EEM I', peso: 2 },
                    { id: 'trabajos', nombre: 'Trabajos Aplicativos', peso: 1 },
                    { id: 'fisico', nombre: 'Actividades Físico Deportivas', peso: 4 },
                    { id: 'disciplina', nombre: 'Comportamiento y Disciplina', peso: 3, isAuto: true },
                    { id: 'apreciacion', nombre: 'Apreciación Planta Académica', peso: 3 },
                  ].map(esp => {
                    const rawVal = inscripcion.ponderaciones?.[esp.id];
                    const hasVal = rawVal !== undefined && rawVal !== null && rawVal !== '';
                    const notaBase = hasVal ? Number(rawVal) : null;
                    const puntos = notaBase !== null ? ((notaBase * esp.peso) / 100).toFixed(2) : '—';

                    return (
                      <tr key={esp.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{esp.nombre}</span>
                          {esp.isAuto && (
                            <span className="ml-2 text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">
                              Sincronizado (Instrucción)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-600 tabular-nums">{esp.peso}.00%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {notaBase !== null ? notaBase.toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0f2942] tabular-nums">
                          {puntos} <span className="text-[10px] font-sans font-normal text-slate-400">/ {esp.peso}.00</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {hasVal ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Asentado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: POR ÁREAS TRANSVERSALES I, II, III, IV */}
      {!isDCEMA && vistaDCEA === 'AREAS' && detallesDCEA && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Desglose Transversal por Áreas Curriculares
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribución de las asignaturas académicas según las cuatro áreas operativas y doctrinales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'AREA I', titulo: 'ÁREA I (17.25%)', peso: 17.25 },
              { key: 'AREA II', titulo: 'ÁREA II (14.00%)', peso: 14.00 },
              { key: 'AREA III', titulo: 'ÁREA III (14.00%)', peso: 14.00 },
              { key: 'AREA IV', titulo: 'ÁREA IV (14.75%)', peso: 14.75 }
            ].map(areaConf => {
              const areaData = detallesDCEA.areas[areaConf.key];
              if (!areaData) return null;

              return (
                <div key={areaConf.key} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{areaConf.titulo}</h3>
                    <span className="text-xs font-mono font-bold text-[#0f2942] bg-white px-2.5 py-0.5 rounded border border-slate-200 tabular-nums">
                      {areaData.puntos.toFixed(2)} / {areaConf.peso.toFixed(2)} pts
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Asignatura</th>
                        <th className="py-2 px-2 text-center w-16">Campo</th>
                        <th className="py-2 px-2 text-right w-16">Nota</th>
                        <th className="py-2 px-3 text-right w-24">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {areaData.materias.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{m.nombreOficial}</td>
                          <td className="py-2 px-2 text-center uppercase text-[10px] text-slate-500 font-semibold">
                            {m.campo}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {m.notaFinal !== null ? m.notaFinal.toFixed(1) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#0f2942] tabular-nums">
                            {m.puntosAportados.toFixed(2)} <span className="text-[9px] font-sans text-slate-400">({m.peso}%)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3 (DEFAULT O TARJETAS): TARJETAS DE RUBROS */}
      {(isDCEMA || vistaDCEA === 'TARJETAS') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Desglose de Rubros Ponderados ({isDCEMA ? 'DCEMA' : 'DCEA'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Porcentajes asignados conforme a la reglamentación académica vigente.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-teal-700"></span> Oficial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#0f2942]"></span> Promedio de asignaturas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-300"></span> Pendiente
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {desglose.map(item => {
              const hasScore = item.notaBase !== null;
              const aporteAprox = item.puntosPonderados !== null ? item.puntosPonderados.toFixed(2) : '—';

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                        Peso: {item.percent}%
                      </span>

                      {item.fuente === 'OFICIAL' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <CheckCircle2 className="w-3 h-3" /> Asentado
                        </span>
                      ) : item.fuente === 'CALCULADO' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0f2942] bg-[#0f2942]/10 px-2 py-0.5 rounded border border-[#0f2942]/20" title="Calculado del promedio de asignaturas del área">
                          <TrendingUp className="w-3 h-3" /> Asignaturas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">
                      {item.name}
                    </h3>
                    
                    {item.isDisciplina && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Sincronizado con Sección Instrucción
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100">
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nota Base</p>
                        <p className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                          {hasScore ? item.notaBase?.toFixed(2) : '—'}
                          <span className="text-xs font-sans font-normal text-slate-400"> / 100</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Puntos Ponderados</p>
                        <p className="text-lg font-mono font-bold text-[#0f2942] tabular-nums">
                          {aporteAprox}
                          <span className="text-xs font-sans font-normal text-slate-400"> / {item.percent}</span>
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.fuente === 'OFICIAL' ? 'bg-teal-700' :
                          item.fuente === 'CALCULADO' ? 'bg-[#0f2942]' : 'bg-slate-200'
                        }`}
                        style={{ width: `${hasScore ? Math.min(100, Math.max(0, item.notaBase || 0)) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
