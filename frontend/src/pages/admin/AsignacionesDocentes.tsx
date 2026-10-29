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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Sparkles
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

type VistaType = 'docentes' | 'materias';

export function AsignacionesDocentes() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroUrl = searchParams.get('filtro'); // 'DCEMA' o 'DCEA'

  // Control State
  const [vistaActual, setVistaActual] = useState<VistaType>('docentes');
  const [filtroDiplomado, setFiltroDiplomado] = useState<string>(filtroUrl || '');
  const [filtroGestion, setFiltroGestion] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [docentesExpandidos, setDocentesExpandidos] = useState<Set<number>>(new Set());

  const toggleDocenteExpandido = (docenteId: number) => {
    setDocentesExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(docenteId)) {
        next.delete(docenteId);
      } else {
        next.add(docenteId);
      }
      return next;
    });
  };

  const expandirTodos = () => {
    setDocentesExpandidos(new Set(docentesAgrupados.map((d: any) => d.id)));
  };

  const colapsarTodos = () => {
    setDocentesExpandidos(new Set());
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchDocenteModal, setSearchDocenteModal] = useState('');
  const [isDropdownDocenteOpen, setIsDropdownDocenteOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const selectedDiplomado = watch('diplomado_id');
  const selectedArea = watch('area_id');
  const selectedEdicion = watch('edicion_id');
  const selectedDocenteId = watch('docente_id');

  // Sync URL param with state
  useEffect(() => {
    if (filtroUrl) {
      setFiltroDiplomado(filtroUrl);
    }
  }, [filtroUrl]);

  // Queries
  const { data: asignaciones = [], isLoading: isLoadingAsignaciones, isError: isErrorAsignaciones, refetch: refetchAsignaciones } = useQuery({
    queryKey: ['asignaciones-docentes'],
    queryFn: async () => {
      const res = await api.get('/docentes/asignaciones');
      return res.data;
    }
  });

  const { data: docentes = [], isLoading: isLoadingDocentes, isError: isErrorDocentes, refetch: refetchDocentes } = useQuery({
    queryKey: ['usuarios-docentes'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.filter((u: any) => u.rol === 'DOCENTE');
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

  // Filtered docentes for modal autocomplete
  const filteredDocentesModal = useMemo(() => {
    return docentes.filter((d: any) => 
      `${d.nombre} ${d.apellido} ${d.email} ${d.ci || ''}`.toLowerCase().includes(searchDocenteModal.toLowerCase())
    );
  }, [docentes, searchDocenteModal]);

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

  // Agrupación de Docentes con sus Asignaciones
  const docentesAgrupados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return docentes.map((doc: any) => {
      const materiasDelDocente = asignacionesFiltradas.filter((a: any) => a.docente_id === doc.id || a.docente?.id === doc.id);
      return {
        ...doc,
        asignaciones: materiasDelDocente
      };
    }).filter((doc: any) => {
      if (!q) return true;
      const matchDoc = `${doc.nombre} ${doc.apellido} ${doc.email} ${doc.ci || ''}`.toLowerCase().includes(q);
      const matchMateria = doc.asignaciones.some((a: any) => 
        a.materia?.nombre?.toLowerCase().includes(q) || 
        a.materia?.area?.nombre?.toLowerCase().includes(q)
      );
      return matchDoc || matchMateria;
    });
  }, [docentes, asignacionesFiltradas, busqueda]);

  // Agrupación de Malla Curricular (Diplomados -> Áreas -> Materias)
  const mallaAgrupada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    // Diplomados que coinciden con filtro
    const dips = diplomados.filter((d: any) => {
      if (!filtroDiplomado) return true;
      return d.nombre.toUpperCase().includes(filtroDiplomado.toUpperCase());
    });

    return dips.map((dip: any) => {
      // Map all materias of this diplomado
      const materiasWithAsig = (dip.materias || []).map((mat: any) => {
        // Encontrar asignación para los filtros activos
        const asig = asignaciones.find((a: any) => {
          if (a.materia_id !== mat.id && a.materia?.id !== mat.id) return false;
          if (filtroGestion && a.edicion?.periodo?.gestion?.toString() !== filtroGestion) return false;
          return true;
        });

        // Encontrar el nombre del área si existe
        const areaObj = dip.areas?.find((ar: any) => ar.id === mat.area_id);

        return {
          ...mat,
          areaNombre: areaObj?.nombre || 'General / Troncal',
          asignacion: asig || null
        };
      }).filter((mat: any) => {
        if (!q) return true;
        const matchMat = mat.nombre.toLowerCase().includes(q) || mat.areaNombre.toLowerCase().includes(q);
        const matchDoc = mat.asignacion && `${mat.asignacion.docente?.nombre} ${mat.asignacion.docente?.apellido}`.toLowerCase().includes(q);
        return matchMat || matchDoc;
      });

      // Agrupar por áreas
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
    const totalDocentes = docentes.length;
    const docentesConCarga = docentesAgrupados.filter((d: any) => d.asignaciones.length > 0).length;
    const totalAsignaciones = asignacionesFiltradas.length;

    // Calcular materias totales del ámbito filtrado
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
      totalDocentes,
      docentesConCarga,
      docentesDisponibles: Math.max(0, totalDocentes - docentesConCarga),
      totalAsignaciones,
      totalMateriasAmbito,
      materiasCubiertasAmbito,
      materiasPendientes,
      porcentajeCobertura
    };
  }, [docentes, docentesAgrupados, asignacionesFiltradas, mallaAgrupada]);

  // Mutations
  const createAsignacion = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/docentes/asignaciones', {
        docente_id: parseInt(data.docente_id),
        materia_id: parseInt(data.materia_id),
        edicion_id: parseInt(data.edicion_id)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-docentes'] });
      setIsModalOpen(false);
      reset();
      showSuccess('Docente asignado exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al asignar docente')
  });

  const deleteAsignacion = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/docentes/asignaciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones-docentes'] });
      showSuccess('Asignación removida');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al remover asignación')
  });

  // Modal Handlers
  const handleAbrirModalGeneral = () => {
    reset();
    setSearchDocenteModal('');
    if (filtroDiplomado) {
      const dip = diplomados.find((d: any) => d.nombre.toUpperCase().includes(filtroDiplomado.toUpperCase()));
      if (dip) setValue('diplomado_id', dip.id.toString());
    }
    setIsModalOpen(true);
  };

  const handleAbrirModalParaDocente = (docente: any) => {
    reset();
    setValue('docente_id', docente.id);
    setSearchDocenteModal(`${docente.nombre} ${docente.apellido}`);
    if (filtroDiplomado) {
      const dip = diplomados.find((d: any) => d.nombre.toUpperCase().includes(filtroDiplomado.toUpperCase()));
      if (dip) setValue('diplomado_id', dip.id.toString());
    }
    setIsModalOpen(true);
  };

  const handleAbrirModalParaMateria = (materia: any, diplomadoId: number, areaId?: number) => {
    reset();
    setSearchDocenteModal('');
    setValue('diplomado_id', diplomadoId.toString());
    if (areaId) setValue('area_id', areaId.toString());
    setValue('materia_id', materia.id.toString());
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => createAsignacion.mutate(data);

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • Planta Docente
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Designación de Docentes y Carga Horaria
            </h2>
            {filtroDiplomado && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#0f2942] border border-slate-200 tracking-wider">
                {filtroDiplomado}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Planificación académica, control de carga horaria docente y cobertura de asignaturas curriculares.
          </p>
        </div>

        <button 
          onClick={handleAbrirModalGeneral}
          className="flex items-center justify-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Designar Docente</span>
        </button>
      </div>

      {/* 2. TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Plantel Docente */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Plantel Docente</span>
            <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1">{kpis.totalDocentes}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
              <span className="text-teal-700 font-bold">{kpis.docentesConCarga} activos</span> • {kpis.docentesDisponibles} sin carga
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#0f2942]/10 text-[#0f2942] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Materias Asignadas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Designaciones Activas</span>
            <div className="text-2xl font-mono tabular-nums font-bold text-[#0f2942] mt-1">{kpis.totalAsignaciones}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Asignaturas con titular designado
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Materias Pendientes */}
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
              {kpis.materiasPendientes === 0 ? '100% de la malla cubierta' : 'Requieren designación titular'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
            kpis.materiasPendientes > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Cobertura Curricular */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cobertura Curricular</span>
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
              {kpis.materiasCubiertasAmbito} de {kpis.totalMateriasAmbito} asignaturas cubiertas
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
              onClick={() => setVistaActual('docentes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                vistaActual === 'docentes' 
                  ? 'bg-[#0f2942] text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Docentes (<span className="font-mono tabular-nums">{docentesAgrupados.length}</span>)</span>
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
              vistaActual === 'docentes' 
                ? "Buscar por nombre de docente, correo, CI o asignatura..." 
                : "Buscar asignatura, área de conocimiento o docente titular..."
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
      {isErrorAsignaciones || isErrorDocentes ? (
        <div className="bg-white p-10 rounded-xl border border-red-200 text-center text-slate-600 space-y-3 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No se pudo cargar la información</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ocurrió un problema de conexión al obtener el plantel docente o sus asignaciones.
          </p>
          <button 
            onClick={() => { refetchAsignaciones(); refetchDocentes(); }}
            className="px-4 py-2 bg-[#0f2942] text-white rounded-lg text-xs font-bold hover:bg-[#163a5c] transition-colors"
          >
            Reintentar carga
          </button>
        </div>
      ) : isLoadingAsignaciones || isLoadingDocentes ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-4 border-[#0f2942] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Cargando plantel docente y asignaciones...</p>
        </div>
      ) : vistaActual === 'docentes' ? (
        
        /* ========================================================= */
        /* VISTA 1: POR DOCENTE (Tarjetas de Carga Docente Uniforme) */
        /* ========================================================= */
        <div className="space-y-3">
          
          {/* Barra de control para Expandir/Colapsar */}
          {docentesAgrupados.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span className="font-medium">
                Mostrando <strong className="font-mono tabular-nums text-slate-800">{docentesAgrupados.length}</strong> docentes
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

          {docentesAgrupados.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <UserX className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700 text-sm">No se encontraron docentes</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay docentes que coincidan con los filtros seleccionados o el término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {docentesAgrupados.map((doc: any) => {
                const totalMateriasDoc = doc.asignaciones.length;
                const initials = `${doc.nombre?.charAt(0) || ''}${doc.apellido?.charAt(0) || ''}`.toUpperCase();
                const isExpanded = docentesExpandidos.has(doc.id);

                return (
                  <div 
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors overflow-hidden flex flex-col justify-between"
                  >
                    {/* Fila Principal / Cabecera Uniforme */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      
                      {/* Avatar y Datos del Docente */}
                      <div 
                        className={`flex items-center gap-3 min-w-0 flex-1 select-none ${
                          totalMateriasDoc > 0 ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (totalMateriasDoc > 0) {
                            toggleDocenteExpandido(doc.id);
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                          {initials || 'DOC'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {doc.grado ? `${doc.grado} ` : ''}{doc.nombre} {doc.apellido}
                            </h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold uppercase shrink-0 border ${
                              totalMateriasDoc > 0 
                                ? 'bg-teal-50 text-teal-800 border-teal-200' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {totalMateriasDoc > 0 ? (
                                <>
                                  <BookOpen className="w-3 h-3" />
                                  <span>{totalMateriasDoc} {totalMateriasDoc === 1 ? 'asignatura' : 'asignaturas'}</span>
                                </>
                              ) : (
                                <span className="font-sans">Disponible</span>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5 font-mono tabular-nums">
                            <span className="font-sans">{doc.email}</span> {doc.ci ? `• CI: ${doc.ci}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirModalParaDocente(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#0f2942] text-slate-800 hover:text-white border border-slate-200 hover:border-[#0f2942] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Designar asignatura a este docente"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar</span>
                        </button>

                        {totalMateriasDoc > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleDocenteExpandido(doc.id)}
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

                    {/* Desplegable de Materias Asignadas (Acordeón) */}
                    {isExpanded && totalMateriasDoc > 0 && (
                      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-2 border-t border-slate-200 bg-slate-50 space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Asignaturas designadas a este docente:
                        </div>
                        <div className="space-y-1.5">
                          {doc.asignaciones.map((asig: any) => (
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
                                  const isConfirmed = await showConfirmDelete(`la asignación de ${doc.nombre} a ${asig.materia?.nombre}`);
                                  if (isConfirmed) {
                                    deleteAsignacion.mutate(asig.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                title="Remover esta asignatura"
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
                      Pénsum académico oficial y cobertura de docentes titulares
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono tabular-nums font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded border border-teal-200">
                    {dip.materiasCubiertas} de {dip.totalMaterias} asignaturas cubiertas
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
                        const tieneDocente = Boolean(asig);

                        return (
                          <div
                            key={mat.id}
                            className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                              tieneDocente 
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
                                tieneDocente ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {tieneDocente ? 'Asignada' : 'Sin Docente'}
                              </span>
                            </div>

                            {/* Detalle del Docente Asignado o Botón de Asignación */}
                            {tieneDocente ? (
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded bg-[#0f2942] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {asig.docente?.nombre?.charAt(0)}{asig.docente?.apellido?.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate leading-tight">
                                      {asig.docente?.nombre} {asig.docente?.apellido}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {asig.docente?.email}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const isConfirmed = await showConfirmDelete(`la designación de ${asig.docente?.nombre} en ${mat.nombre}`);
                                    if (isConfirmed) {
                                      deleteAsignacion.mutate(asig.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                  title="Remover docente"
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
                                  <span>Designar Docente Titular</span>
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

      {/* 5. MODAL DE ASIGNACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Designar Docente a Asignatura</h3>
                <p className="text-xs text-slate-300 mt-0.5">Vincule a un docente titular con una asignatura y gestión específica</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              
              {/* Campo Docente con Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Docente Titular <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Escriba nombre, apellido, CI o correo..." 
                    value={searchDocenteModal} 
                    onChange={(e) => { 
                      setSearchDocenteModal(e.target.value); 
                      setIsDropdownDocenteOpen(true);
                      setValue('docente_id', '');
                    }}
                    onFocus={() => setIsDropdownDocenteOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownDocenteOpen(false), 250)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white" 
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <input type="hidden" {...register('docente_id', { required: true })} />
                
                {!selectedDocenteId && (
                  <span className="text-[11px] text-red-600 mt-1 block font-medium">
                    Debe seleccionar un docente del listado.
                  </span>
                )}

                {isDropdownDocenteOpen && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredDocentesModal.map((d: any) => (
                      <li 
                        key={d.id} 
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => {
                          setValue('docente_id', d.id);
                          setSearchDocenteModal(`${d.nombre} ${d.apellido}`);
                          setIsDropdownDocenteOpen(false);
                        }}
                      >
                        <div className="font-bold text-xs text-slate-900">{d.nombre} {d.apellido}</div>
                        <div className="text-[11px] font-mono text-slate-500">CI: {d.ci || 'S/N'} • <span className="font-sans">{d.email}</span></div>
                      </li>
                    ))}
                    {filteredDocentesModal.length === 0 && (
                      <li className="px-4 py-3 text-xs text-slate-400 text-center">
                        No se encontraron docentes coincidentes.
                      </li>
                    )}
                  </ul>
                )}
              </div>
              
              {/* Selector de Diplomado */}
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

              {/* Selector de Edición / Periodo */}
              {selectedDiplomado && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Periodo / Gestión Académica <span className="text-red-600">*</span>
                  </label>
                  <select 
                    {...register('edicion_id', { required: true })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                  >
                    <option value="">Seleccione un periodo o edición...</option>
                    {ediciones.filter((e: any) => e.diplomado_id === parseInt(selectedDiplomado)).map((e: any) => (
                      <option key={e.id} value={e.id}>
                        Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `- Semestre ${e.periodo.semestre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Áreas */}
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
                    <option value="">Todas las áreas del programa...</option>
                    {areasDisponibles.map((area: any) => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Materia */}
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
                {selectedDiplomado && materiasDisponibles.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    {selectedArea ? 'No hay asignaturas registradas en esta área.' : 'Este diplomado no tiene asignaturas creadas.'}
                  </p>
                )}
              </div>

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
                  disabled={createAsignacion.isPending || !selectedDocenteId} 
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createAsignacion.isPending ? 'Guardando...' : 'Confirmar Designación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
