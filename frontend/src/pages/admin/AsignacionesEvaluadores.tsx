import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { 
  Trash2, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Calendar, 
  Filter, 
  X, 
  Layers, 
  GraduationCap, 
  UserCheck, 
  UserX,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ClipboardCheck,
  Zap,
  Sparkles,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

type VistaType = 'evaluadores' | 'materias';

export function AsignacionesEvaluadores() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroUrl = searchParams.get('filtro'); // 'DCEMA' o 'DCEA'

  // Control State
  const [vistaActual, setVistaActual] = useState<VistaType>('evaluadores');
  const [filtroDiplomado, setFiltroDiplomado] = useState<string>(filtroUrl || '');
  const [filtroGestion, setFiltroGestion] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [evaluadoresExpandidos, setEvaluadoresExpandidos] = useState<Set<number>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'masivo' | 'individual'>('masivo');
  const [searchEvaluadorModal, setSearchEvaluadorModal] = useState('');
  const [isDropdownEvaluadorOpen, setIsDropdownEvaluadorOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const selectedDiplomado = watch('diplomado_id');
  const selectedArea = watch('area_id');
  const selectedEdicion = watch('edicion_id');
  const selectedEvaluadorId = watch('evaluador_id');

  // Toggle Accordion per evaluator
  const toggleEvaluadorExpandido = (evaluadorId: number) => {
    setEvaluadoresExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(evaluadorId)) {
        next.delete(evaluadorId);
      } else {
        next.add(evaluadorId);
      }
      return next;
    });
  };

  const expandirTodos = () => {
    setEvaluadoresExpandidos(new Set(evaluadoresAgrupados.map((e: any) => e.id)));
  };

  const colapsarTodos = () => {
    setEvaluadoresExpandidos(new Set());
  };

  // Sync URL param with state
  useEffect(() => {
    if (filtroUrl) {
      setFiltroDiplomado(filtroUrl);
    }
  }, [filtroUrl]);

  // Queries
  const { data: asignaciones = [], isLoading: isLoadingAsignaciones, isError: isErrorAsignaciones, refetch: refetchAsignaciones } = useQuery({
    queryKey: ['asignaciones-evaluadores'],
    queryFn: async () => {
      const res = await api.get('/evaluadores/asignaciones');
      return res.data;
    }
  });

  const { data: evaluadores = [], isLoading: isLoadingEvaluadores, isError: isErrorEvaluadores, refetch: refetchEvaluadores } = useQuery({
    queryKey: ['usuarios-evaluadores'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.filter((u: any) => u.rol === 'EVALUADOR');
    }
  });

  const { data: diplomados = [] } = useQuery({
    queryKey: ['diplomados-materias'],
    queryFn: async () => {
      const res = await api.get('/diplomas');
      return res.data;
    }
  });

  const { data: ediciones = [] } = useQuery({
    queryKey: ['ediciones-abiertas'],
    queryFn: async () => {
      const res = await api.get('/ediciones');
      return res.data.filter((e: any) => e.estado === 'ABIERTO' || e.estado === 'EN_CURSO');
    }
  });

  // Gestiones únicas disponibles
  const gestionesDisponibles = useMemo(() => {
    const gSet = new Set<string>();
    ediciones.forEach((e: any) => {
      if (e.periodo?.gestion) gSet.add(e.periodo.gestion.toString());
    });
    asignaciones.forEach((a: any) => {
      if (a.edicion?.periodo?.gestion) gSet.add(a.edicion.periodo.gestion.toString());
    });
    return Array.from(gSet).sort().reverse();
  }, [ediciones, asignaciones]);

  // Derived state for areas based on selected diplomado in modal
  const areasDisponibles = useMemo(() => {
    if (!selectedDiplomado || !diplomados) return [];
    const diplomado = diplomados.find((d: any) => d.id === parseInt(selectedDiplomado));
    return diplomado?.areas || [];
  }, [selectedDiplomado, diplomados]);

  // Derived state for materias based on selected diplomado and area in modal
  const materiasDisponibles = useMemo(() => {
    if (!selectedDiplomado || !diplomados) return [];
    const diplomado = diplomados.find((d: any) => d.id === parseInt(selectedDiplomado));
    let materias = diplomado?.materias || [];
    if (selectedArea) {
      materias = materias.filter((m: any) => m.area_id === parseInt(selectedArea));
    }
    return materias;
  }, [selectedDiplomado, selectedArea, diplomados]);

  // Filtered evaluadores for modal autocomplete
  const filteredEvaluadoresModal = useMemo(() => {
    return evaluadores.filter((e: any) => 
      `${e.nombre} ${e.apellido} ${e.email} ${e.ci || ''}`.toLowerCase().includes(searchEvaluadorModal.toLowerCase())
    );
  }, [evaluadores, searchEvaluadorModal]);

  // Filtered Asignaciones Base
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter((asig: any) => {
      if (filtroDiplomado) {
        const nomDip = asig.materia?.diplomado?.nombre || '';
        if (!nomDip.toUpperCase().includes(filtroDiplomado.toUpperCase())) return false;
      }
      if (filtroGestion) {
        const g = asig.edicion?.periodo?.gestion?.toString();
        if (g !== filtroGestion) return false;
      }
      return true;
    });
  }, [asignaciones, filtroDiplomado, filtroGestion]);

  // Agrupación de Evaluadores con sus Asignaciones y Jurisdicciones
  const evaluadoresAgrupados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return evaluadores.map((eva: any) => {
      const todasAsignacionesEva = asignaciones.filter((a: any) => a.evaluador_id === eva.id || a.evaluador?.id === eva.id);
      const materiasDelEvaluador = asignacionesFiltradas.filter((a: any) => a.evaluador_id === eva.id || a.evaluador?.id === eva.id);
      const tieneDCEA = todasAsignacionesEva.some((a: any) => (a.materia?.diplomado?.nombre || '').toUpperCase().includes('DCEA'));
      const tieneDCEMA = todasAsignacionesEva.some((a: any) => (a.materia?.diplomado?.nombre || '').toUpperCase().includes('DCEMA'));

      return {
        ...eva,
        asignaciones: materiasDelEvaluador,
        tieneDCEA,
        tieneDCEMA
      };
    }).filter((eva: any) => {
      if (!q) return true;
      const matchEva = `${eva.nombre} ${eva.apellido} ${eva.email} ${eva.ci || ''}`.toLowerCase().includes(q);
      const matchMateria = eva.asignaciones.some((a: any) => 
        a.materia?.nombre?.toLowerCase().includes(q) || 
        a.materia?.area?.nombre?.toLowerCase().includes(q)
      );
      return matchEva || matchMateria;
    });
  }, [evaluadores, asignaciones, asignacionesFiltradas, busqueda]);

  // Agrupación de Malla Curricular (Diplomados -> Áreas -> Materias)
  const mallaAgrupada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    const dips = diplomados.filter((d: any) => {
      if (!filtroDiplomado) return true;
      return d.nombre.toUpperCase().includes(filtroDiplomado.toUpperCase());
    });

    return dips.map((dip: any) => {
      const materiasWithAsig = (dip.materias || []).map((mat: any) => {
        const asig = asignaciones.find((a: any) => {
          if (a.materia_id !== mat.id && a.materia?.id !== mat.id) return false;
          if (filtroGestion && a.edicion?.periodo?.gestion?.toString() !== filtroGestion) return false;
          return true;
        });

        const areaObj = dip.areas?.find((ar: any) => ar.id === mat.area_id);

        return {
          ...mat,
          areaNombre: areaObj?.nombre || 'General / Troncal',
          asignacion: asig || null
        };
      }).filter((mat: any) => {
        if (!q) return true;
        const matchMat = mat.nombre.toLowerCase().includes(q) || mat.areaNombre.toLowerCase().includes(q);
        const matchEva = mat.asignacion && `${mat.asignacion.evaluador?.nombre} ${mat.asignacion.evaluador?.apellido}`.toLowerCase().includes(q);
        return matchMat || matchEva;
      });

      const areasMap = new Map<string, any[]>();
      materiasWithAsig.forEach((m: any) => {
        const areaKey = m.areaNombre;
        if (!areasMap.has(areaKey)) {
          areasMap.set(areaKey, []);
        }
        areasMap.get(areaKey)!.push(m);
      });

      return {
        ...dip,
        areasAgrupadas: Array.from(areasMap.entries()).map(([areaNombre, materias]) => ({
          areaNombre,
          materias
        })),
        totalMaterias: dip.materias?.length || 0,
        materiasCubiertas: (dip.materias || []).filter((mat: any) => 
          asignaciones.some((a: any) => a.materia_id === mat.id && (!filtroGestion || a.edicion?.periodo?.gestion?.toString() === filtroGestion))
        ).length
      };
    });
  }, [diplomados, asignaciones, filtroDiplomado, filtroGestion, busqueda]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const totalEvaluadores = evaluadores.length;
    const evaluadoresConCarga = evaluadoresAgrupados.filter((e: any) => e.asignaciones.length > 0).length;
    const totalAsignaciones = asignacionesFiltradas.length;

    let totalMateriasAmbito = 0;
    let materiasCubiertasAmbito = 0;

    mallaAgrupada.forEach((dip: any) => {
      totalMateriasAmbito += dip.totalMaterias;
      materiasCubiertasAmbito += dip.materiasCubiertas;
    });

    const materiasPendientes = Math.max(0, totalMateriasAmbito - materiasCubiertasAmbito);
    const porcentajeCobertura = totalMateriasAmbito > 0 
      ? Math.round((materiasCubiertasAmbito / totalMateriasAmbito) * 100) 
      : 100;

    return {
      totalEvaluadores,
      evaluadoresConCarga,
      evaluadoresDisponibles: Math.max(0, totalEvaluadores - evaluadoresConCarga),
      totalAsignaciones,
      totalMateriasAmbito,
      materiasCubiertasAmbito,
      materiasPendientes,
      porcentajeCobertura
    };
  }, [evaluadores, evaluadoresAgrupados, asignacionesFiltradas, mallaAgrupada]);

  // Mutations
  const createAsignacionMasiva = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/evaluadores/asignaciones/masivo', {
        evaluador_id: parseInt(data.evaluador_id),
        edicion_id: parseInt(data.edicion_id)
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-evaluadores'] });
      setIsModalOpen(false);
      reset();
      showSuccess(data.message || 'Asignación masiva exitosa');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al asignar evaluador')
  });

  const createAsignacionIndividual = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/evaluadores/asignaciones', {
        evaluador_id: parseInt(data.evaluador_id),
        materia_id: parseInt(data.materia_id),
        edicion_id: parseInt(data.edicion_id)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-evaluadores'] });
      setIsModalOpen(false);
      reset();
      showSuccess('Evaluador asignado a la materia exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al asignar evaluador')
  });

  const deleteAsignacion = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/evaluadores/asignaciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-evaluadores'] });
      showSuccess('Asignación removida exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al remover asignación')
  });

  const toggleJurisdiccion = useMutation({
    mutationFn: async (params: { evaluador_id: number; codigo_diplomado: 'DCEA' | 'DCEMA'; habilitar: boolean }) => {
      const res = await api.post('/evaluadores/jurisdiccion', params);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-evaluadores'] });
      showSuccess(data.message || 'Jurisdicción actualizada correctamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al cambiar jurisdicción del evaluador')
  });

  // Modal Handlers
  const handleAbrirModalMasivo = () => {
    reset();
    setModalTipo('masivo');
    setSearchEvaluadorModal('');
    setIsModalOpen(true);
  };

  const handleAbrirModalParaEvaluador = (evaluador: any) => {
    reset();
    setValue('evaluador_id', evaluador.id);
    setSearchEvaluadorModal(`${evaluador.nombre} ${evaluador.apellido}`);
    setModalTipo('masivo');
    setIsModalOpen(true);
  };

  const handleAbrirModalParaMateria = (materia: any, diplomadoId: number, areaId?: number) => {
    reset();
    setModalTipo('individual');
    setSearchEvaluadorModal('');
    setValue('diplomado_id', diplomadoId.toString());
    if (areaId) setValue('area_id', areaId.toString());
    setValue('materia_id', materia.id.toString());
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    if (modalTipo === 'masivo') {
      createAsignacionMasiva.mutate(data);
    } else {
      createAsignacionIndividual.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • División de Evaluación
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Designación de Evaluadores y Supervisión
            </h2>
            {filtroDiplomado && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#0f2942] border border-slate-200 tracking-wider">
                {filtroDiplomado}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervisión académica, acreditación de tribunales evaluadores y cobertura de defensas curriculares.
          </p>
        </div>

        <button 
          onClick={handleAbrirModalMasivo}
          className="flex items-center justify-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Designar Evaluador</span>
        </button>
      </div>

      {/* 2. TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Comité Evaluador */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Comité Evaluador</span>
            <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1">{kpis.totalEvaluadores}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
              <span className="text-teal-700 font-bold">{kpis.evaluadoresConCarga} activos</span> • {kpis.evaluadoresDisponibles} disponibles
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#0f2942]/10 text-[#0f2942] flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Materias Asignadas a Evaluador */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Asignaturas Supervisadas</span>
            <div className="text-2xl font-mono tabular-nums font-bold text-[#0f2942] mt-1">{kpis.totalAsignaciones}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supervisiones activas
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Materias Sin Evaluador */}
        <div className={`p-5 rounded-xl border shadow-xs flex items-center justify-between ${
          kpis.materiasPendientes > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              kpis.materiasPendientes > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Asignaturas Pendientes
            </span>
            <div className={`text-2xl font-mono tabular-nums font-bold mt-1 ${
              kpis.materiasPendientes > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {kpis.materiasPendientes}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {kpis.materiasPendientes === 0 ? '100% de asignaturas cubiertas' : 'Requieren tribunal evaluador'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
            kpis.materiasPendientes > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Cobertura de Evaluación */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cobertura de Evaluación</span>
            <span className="text-xs font-mono tabular-nums font-bold text-[#0f2942] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              {kpis.porcentajeCobertura}%
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#0f2942] h-full rounded-full transition-all duration-500" 
                style={{ width: `${kpis.porcentajeCobertura}%` }}
              ></div>
            </div>
            <p className="text-[11px] font-mono tabular-nums text-slate-500 mt-1.5 font-medium">
              {kpis.materiasCubiertasAmbito} de {kpis.totalMateriasAmbito} asignaturas supervisadas
            </p>
          </div>
        </div>

      </div>

      {/* 3. BARRA DE CONTROL Y FILTROS INTERACTIVOS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Selector de Vista */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start border border-slate-200">
            <button
              type="button"
              onClick={() => setVistaActual('evaluadores')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                vistaActual === 'evaluadores' 
                  ? 'bg-[#0f2942] text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Evaluadores (<span className="font-mono tabular-nums">{evaluadoresAgrupados.length}</span>)</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('materias')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                vistaActual === 'materias' 
                  ? 'bg-[#0f2942] text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Malla Curricular</span>
            </button>
          </div>

          {/* Filtros de Diplomado y Gestión */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Filtro Diplomado */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFiltroDiplomado('');
                  setSearchParams({});
                }}
                className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                  !filtroDiplomado ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroDiplomado('DCEMA');
                  setSearchParams({ filtro: 'DCEMA' });
                }}
                className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                  filtroDiplomado === 'DCEMA' ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DCEMA
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroDiplomado('DCEA');
                  setSearchParams({ filtro: 'DCEA' });
                }}
                className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                  filtroDiplomado === 'DCEA' ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DCEA
              </button>
            </div>

            {/* Filtro Gestión */}
            <div className="flex items-center gap-1.5">
              <select
                value={filtroGestion}
                onChange={(e) => setFiltroGestion(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] cursor-pointer"
              >
                <option value="">Todas las Gestiones</option>
                {gestionesDisponibles.map((g) => (
                  <option key={g} value={g}>Gestión {g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buscador en Vivo */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              vistaActual === 'evaluadores' 
                ? "Buscar por nombre de evaluador, correo, CI o asignatura..." 
                : "Buscar asignatura, área o tribunal evaluador..."
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENIDO DE LAS VISTAS */}
      {isErrorAsignaciones || isErrorEvaluadores ? (
        <div className="bg-white p-10 rounded-xl border border-red-200 text-center text-slate-600 space-y-3 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No se pudo cargar la información</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ocurrió un problema de conexión al obtener el comité evaluador o sus asignaciones.
          </p>
          <button 
            onClick={() => { refetchAsignaciones(); refetchEvaluadores(); }}
            className="px-4 py-2 bg-[#0f2942] text-white rounded-lg text-xs font-bold hover:bg-[#163a5c] transition-colors"
          >
            Reintentar carga
          </button>
        </div>
      ) : isLoadingAsignaciones || isLoadingEvaluadores ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-4 border-[#0f2942] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Cargando comité evaluador y asignaciones...</p>
        </div>
      ) : vistaActual === 'evaluadores' ? (
        
        /* ========================================================= */
        /* VISTA 1: POR EVALUADOR (Tarjetas Uniformes y Desplegables) */
        /* ========================================================= */
        <div className="space-y-3">
          
          {/* Barra de control para Expandir/Colapsar */}
          {evaluadoresAgrupados.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span className="font-medium">
                Mostrando <strong className="font-mono tabular-nums text-slate-800">{evaluadoresAgrupados.length}</strong> evaluadores registrados
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandirTodos}
                  className="px-2.5 py-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#0f2942]" />
                  <span>Expandir Todos</span>
                </button>
                <button
                  type="button"
                  onClick={colapsarTodos}
                  className="px-2.5 py-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors font-semibold cursor-pointer"
                >
                  <span>Colapsar Todos</span>
                </button>
              </div>
            </div>
          )}

          {evaluadoresAgrupados.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <UserX className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700 text-sm">No se encontraron evaluadores</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay evaluadores que coincidan con los filtros seleccionados o el término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {evaluadoresAgrupados.map((eva: any) => {
                const totalMateriasEva = eva.asignaciones.length;
                const initials = `${eva.nombre?.charAt(0) || ''}${eva.apellido?.charAt(0) || ''}`.toUpperCase();
                const isExpanded = evaluadoresExpandidos.has(eva.id);

                return (
                  <div 
                    key={eva.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors overflow-hidden flex flex-col justify-between"
                  >
                    {/* Fila Principal / Cabecera Uniforme */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      
                      {/* Avatar y Datos del Evaluador */}
                      <div 
                        className={`flex items-center gap-3 min-w-0 flex-1 select-none ${
                          totalMateriasEva > 0 ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (totalMateriasEva > 0) {
                            toggleEvaluadorExpandido(eva.id);
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                          {initials || 'EVA'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {eva.grado ? `${eva.grado} ` : ''}{eva.nombre} {eva.apellido}
                            </h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold uppercase shrink-0 border ${
                              totalMateriasEva > 0 
                                ? 'bg-teal-50 text-teal-800 border-teal-200' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {totalMateriasEva > 0 ? (
                                <>
                                  <BookOpen className="w-3 h-3" />
                                  <span>{totalMateriasEva} {totalMateriasEva === 1 ? 'asignatura' : 'asignaturas'}</span>
                                </>
                              ) : (
                                <span className="font-sans">Disponible</span>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5 font-mono tabular-nums">
                            <span className="font-sans">{eva.email}</span> {eva.ci ? `• CI: ${eva.ci}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirModalParaEvaluador(eva)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#0f2942] text-slate-800 hover:text-white border border-slate-200 hover:border-[#0f2942] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Asignar asignaturas a este evaluador"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar</span>
                        </button>

                        {totalMateriasEva > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleEvaluadorExpandido(eva.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isExpanded ? "Ocultar asignaturas" : "Ver asignaturas asignadas"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        ) : (
                          <div className="w-7"></div>
                        )}
                      </div>
                    </div>

                    {/* Barra Rápida de Jurisdicción por Diplomado (Habilitar / Bloquear DCEA y DCEMA) */}
                    <div className="px-3.5 py-2.5 sm:px-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0f2942]" />
                        Jurisdicción Ponderación:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={toggleJurisdiccion.isPending}
                          onClick={async () => {
                            if (eva.tieneDCEA) {
                              const ok = await showConfirmDelete(`el acceso a DCEA del evaluador ${eva.nombre} ${eva.apellido}`);
                              if (!ok) return;
                            }
                            toggleJurisdiccion.mutate({
                              evaluador_id: eva.id,
                              codigo_diplomado: 'DCEA',
                              habilitar: !eva.tieneDCEA
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                            eva.tieneDCEA
                              ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                          }`}
                          title={eva.tieneDCEA ? 'Clic para bloquear/revocar DCEA a este evaluador' : 'Clic para habilitar DCEA a este evaluador'}
                        >
                          {eva.tieneDCEA ? (
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>DCEA: {eva.tieneDCEA ? 'Habilitado' : 'Bloqueado'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={toggleJurisdiccion.isPending}
                          onClick={async () => {
                            if (eva.tieneDCEMA) {
                              const ok = await showConfirmDelete(`el acceso a DCEMA del evaluador ${eva.nombre} ${eva.apellido}`);
                              if (!ok) return;
                            }
                            toggleJurisdiccion.mutate({
                              evaluador_id: eva.id,
                              codigo_diplomado: 'DCEMA',
                              habilitar: !eva.tieneDCEMA
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                            eva.tieneDCEMA
                              ? 'bg-[#0f2942] text-white border-[#0f2942] hover:bg-[#163a5c]'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                          }`}
                          title={eva.tieneDCEMA ? 'Clic para bloquear/revocar DCEMA a este evaluador' : 'Clic para habilitar DCEMA a este evaluador'}
                        >
                          {eva.tieneDCEMA ? (
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>DCEMA: {eva.tieneDCEMA ? 'Habilitado' : 'Bloqueado'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Desplegable de Materias Asignadas (Acordeón) */}
                    {isExpanded && totalMateriasEva > 0 && (
                      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-2 border-t border-slate-200 bg-slate-50 space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Asignaturas supervisadas por este evaluador:
                        </div>
                        <div className="space-y-1.5">
                          {eva.asignaciones.map((asig: any) => (
                            <div 
                              key={asig.id}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors text-xs"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                    asig.materia?.diplomado?.nombre?.includes('DCEMA') 
                                      ? 'bg-[#0f2942]/10 text-[#0f2942] border-[#0f2942]/20' 
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {asig.materia?.diplomado?.nombre?.includes('DCEMA') ? 'DCEMA' : 'DCEA'}
                                  </span>
                                  <span className="font-bold text-slate-900 truncate">
                                    {asig.materia?.nombre}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                  <span>{asig.materia?.area?.nombre || 'Troncal'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono tabular-nums text-slate-600">
                                    Gestión {asig.edicion?.periodo?.gestion} {asig.edicion?.periodo?.semestre ? `Sem ${asig.edicion.periodo.semestre}` : ''}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={async () => {
                                  const isConfirmed = await showConfirmDelete(`la asignación del evaluador ${eva.nombre} en ${asig.materia?.nombre}`);
                                  if (isConfirmed) {
                                    deleteAsignacion.mutate(asig.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                title="Remover supervisión"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        /* ========================================================= */
        /* VISTA 2: POR MALLA CURRICULAR / MATERIAS                  */
        /* ========================================================= */
        <div className="space-y-6">
          {mallaAgrupada.map((dip: any) => (
            <div key={dip.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
              
              {/* Encabezado del Diplomado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{dip.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pénsum académico y designación de tribunales evaluadores
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono tabular-nums font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded border border-teal-200">
                    {dip.materiasCubiertas} de {dip.totalMaterias} asignaturas con evaluador
                  </span>
                </div>
              </div>

              {/* Secciones por Área */}
              <div className="space-y-4">
                {dip.areasAgrupadas.map((grupo: any) => (
                  <div key={grupo.areaNombre} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3.5 py-2 rounded-lg border border-slate-200">
                      <Layers className="w-3.5 h-3.5 text-[#0f2942]" />
                      <span>{grupo.areaNombre} (<span className="font-mono tabular-nums">{grupo.materias.length}</span> asignaturas)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {grupo.materias.map((mat: any) => {
                        const asig = mat.asignacion;
                        const tieneEvaluador = Boolean(asig);

                        return (
                          <div
                            key={mat.id}
                            className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                              tieneEvaluador 
                                ? 'bg-white border-slate-200 hover:border-slate-300' 
                                : 'bg-amber-50/30 border-dashed border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {mat.nombre}
                                </h5>
                                <span className="text-[11px] font-mono tabular-nums text-slate-500 font-medium">
                                  {mat.creditos ? `${mat.creditos} Créditos Académicos` : 'Asignatura Curricular'}
                                </span>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                                tieneEvaluador ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {tieneEvaluador ? 'Supervisada' : 'Sin Evaluador'}
                              </span>
                            </div>

                            {/* Detalle del Evaluador Asignado o Botón de Asignación */}
                            {tieneEvaluador ? (
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded bg-[#0f2942] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {asig.evaluador?.nombre?.charAt(0)}{asig.evaluador?.apellido?.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate leading-tight">
                                      {asig.evaluador?.nombre} {asig.evaluador?.apellido}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {asig.evaluador?.email}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const isConfirmed = await showConfirmDelete(`la supervisión de ${asig.evaluador?.nombre} en ${mat.nombre}`);
                                    if (isConfirmed) {
                                      deleteAsignacion.mutate(asig.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                  title="Remover evaluador"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirModalParaMateria(mat, dip.id, mat.area_id)}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#0f2942] hover:bg-[#163a5c] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Designar Evaluador</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. MODAL DE ASIGNACIÓN (Soporta Asignación Masiva e Individual) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">
                  {modalTipo === 'masivo' ? 'Designación Masiva de Evaluador' : 'Designar Evaluador a Asignatura'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {modalTipo === 'masivo' 
                    ? 'Asigna un evaluador a todas las asignaturas de una edición académica' 
                    : 'Designa un evaluador para una asignatura curricular específica'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Masivo vs Individual dentro del modal */}
            <div className="px-6 pt-4 pb-1">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalTipo('masivo')}
                  className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                    modalTipo === 'masivo' ? 'bg-[#0f2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Asignación Masiva (Todo el curso)
                </button>
                <button
                  type="button"
                  onClick={() => setModalTipo('individual')}
                  className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                    modalTipo === 'individual' ? 'bg-[#0f2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Asignatura Individual
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-3 space-y-4">
              
              {/* Campo Evaluador con Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Evaluador Titular <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Escriba nombre, apellido, CI o correo..." 
                    value={searchEvaluadorModal} 
                    onChange={(e) => { 
                      setSearchEvaluadorModal(e.target.value); 
                      setIsDropdownEvaluadorOpen(true);
                      setValue('evaluador_id', '');
                    }}
                    onFocus={() => setIsDropdownEvaluadorOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownEvaluadorOpen(false), 250)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white" 
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <input type="hidden" {...register('evaluador_id', { required: true })} />
                
                {!selectedEvaluadorId && (
                  <span className="text-[11px] text-red-600 mt-1 block font-medium">
                    Debe seleccionar un evaluador del desplegable.
                  </span>
                )}

                {isDropdownEvaluadorOpen && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredEvaluadoresModal.map((e: any) => (
                      <li 
                        key={e.id} 
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(ev) => ev.preventDefault()} 
                        onClick={() => {
                          setValue('evaluador_id', e.id);
                          setSearchEvaluadorModal(`${e.nombre} ${e.apellido}`);
                          setIsDropdownEvaluadorOpen(false);
                        }}
                      >
                        <div className="font-bold text-xs text-slate-900">{e.nombre} {e.apellido}</div>
                        <div className="text-[11px] font-mono text-slate-500">CI: {e.ci || 'S/N'} • <span className="font-sans">{e.email}</span></div>
                      </li>
                    ))}
                    {filteredEvaluadoresModal.length === 0 && (
                      <li className="px-4 py-3 text-xs text-slate-400 text-center">
                        No se encontraron evaluadores coincidentes.
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Selector de Edición / Periodo (Para Asignación Masiva) */}
              {modalTipo === 'masivo' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Periodo Académico (Diplomado) <span className="text-red-600">*</span>
                  </label>
                  <select 
                    {...register('edicion_id', { required: true })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                  >
                    <option value="">Seleccione una edición abierta...</option>
                    {ediciones.filter((e: any) => !filtroDiplomado || e.diplomado?.nombre.toUpperCase().includes(filtroDiplomado.toUpperCase())).map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(Sem. ${e.periodo.semestre})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-700 bg-slate-100 p-2.5 rounded-lg border border-slate-200 mt-2">
                    Al guardar, el evaluador quedará vinculado a <strong>todas las asignaturas</strong> de este diplomado en la gestión seleccionada.
                  </p>
                </div>
              ) : (
                /* Controles de Asignación Individual */
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      2. Programa Académico / Diplomado <span className="text-red-600">*</span>
                    </label>
                    <select 
                      {...register('diplomado_id', { required: true })} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                      onChange={(e) => {
                        setValue('diplomado_id', e.target.value);
                        setValue('area_id', '');
                        setValue('materia_id', '');
                      }}
                    >
                      <option value="">Seleccione el diplomado...</option>
                      {diplomados.map((dip: any) => (
                        <option key={dip.id} value={dip.id}>{dip.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {selectedDiplomado && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        3. Periodo / Gestión Académica <span className="text-red-600">*</span>
                      </label>
                      <select 
                        {...register('edicion_id', { required: true })} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                      >
                        <option value="">Seleccione una edición...</option>
                        {ediciones.filter((e: any) => e.diplomado_id === parseInt(selectedDiplomado)).map((e: any) => (
                          <option key={e.id} value={e.id}>
                            Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `- Semestre ${e.periodo.semestre}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {areasDisponibles.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        4. Área de Conocimiento (Opcional)
                      </label>
                      <select 
                        {...register('area_id')} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                        onChange={(e) => {
                          setValue('area_id', e.target.value);
                          setValue('materia_id', '');
                        }}
                      >
                        <option value="">Todas las áreas...</option>
                        {areasDisponibles.map((area: any) => (
                          <option key={area.id} value={area.id}>{area.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      5. Asignatura Curricular <span className="text-red-600">*</span>
                    </label>
                    <select 
                      {...register('materia_id', { required: true })} 
                      disabled={!selectedEdicion || materiasDisponibles.length === 0}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    >
                      <option value="">Seleccione una asignatura...</option>
                      {materiasDisponibles.map((mat: any) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.nombre} {mat.creditos ? `(${mat.creditos} CR)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Botones del Modal */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={
                    (modalTipo === 'masivo' && createAsignacionMasiva.isPending) ||
                    (modalTipo === 'individual' && createAsignacionIndividual.isPending) ||
                    !selectedEvaluadorId
                  } 
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createAsignacionMasiva.isPending || createAsignacionIndividual.isPending 
                    ? 'Guardando...' 
                    : modalTipo === 'masivo' 
                      ? 'Confirmar Designación Masiva' 
                      : 'Confirmar Designación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
