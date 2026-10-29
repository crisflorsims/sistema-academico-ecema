import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { 
  CalendarDays, 
  GraduationCap, 
  Clock, 
  AlertTriangle, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Layers
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

type TabType = 'periodos' | 'ediciones';

export function PeriodosEdiciones() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('ediciones');
  
  // Modals & Editing
  const [isModalPeriodoOpen, setIsModalPeriodoOpen] = useState(false);
  const [isModalEdicionOpen, setIsModalEdicionOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<any>(null);
  const [editingEdicion, setEditingEdicion] = useState<any>(null);

  // Filters & Search
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstadoEdicion, setFiltroEstadoEdicion] = useState('');
  const [filtroDiplomado, setFiltroDiplomado] = useState('');

  // Forms
  const { register: regPer, handleSubmit: handlePerSubmit, reset: resetPer } = useForm();
  const { register: regEdi, handleSubmit: handleEdiSubmit, reset: resetEdi, setValue: setEdiValue } = useForm();

  // Queries
  const { data: periodos = [], isLoading: loadingPeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: async () => {
      const res = await api.get('/periodos');
      return res.data;
    }
  });

  const { data: ediciones = [], isLoading: loadingEdiciones } = useQuery({
    queryKey: ['ediciones'],
    queryFn: async () => {
      const res = await api.get('/ediciones');
      return res.data;
    }
  });

  const { data: diplomados = [] } = useQuery({
    queryKey: ['diplomados-list'],
    queryFn: async () => {
      const res = await api.get('/diplomas');
      return res.data;
    }
  });

  // Filtered Ediciones
  const edicionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ediciones.filter((e: any) => {
      if (filtroEstadoEdicion && e.estado !== filtroEstadoEdicion) return false;
      if (filtroDiplomado && !e.diplomado?.nombre?.toUpperCase().includes(filtroDiplomado.toUpperCase())) return false;
      if (q) {
        const nomDip = (e.diplomado?.nombre || '').toLowerCase();
        const ges = (e.periodo?.gestion || '').toString().toLowerCase();
        const sem = (e.periodo?.semestre || '').toString().toLowerCase();
        if (!nomDip.includes(q) && !ges.includes(q) && !sem.includes(q)) return false;
      }
      return true;
    });
  }, [ediciones, filtroEstadoEdicion, filtroDiplomado, busqueda]);

  // Filtered Periodos
  const periodosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return periodos.filter((p: any) => {
      if (q) {
        const ges = (p.gestion || '').toString().toLowerCase();
        const sem = (p.semestre || '').toString().toLowerCase();
        if (!ges.includes(q) && !sem.includes(q)) return false;
      }
      return true;
    });
  }, [periodos, busqueda]);

  // Mutations
  const createPeriodo = useMutation({
    mutationFn: async (data: any) => {
      if (editingPeriodo) {
        const res = await api.put(`/periodos/${editingPeriodo.id}`, data);
        return res.data;
      }
      const res = await api.post('/periodos', data);
      return res.data;
    },
    onSuccess: () => {
      showSuccess('Periodo académico guardado exitosamente');
      queryClient.invalidateQueries();
      setIsModalPeriodoOpen(false);
      setEditingPeriodo(null);
      resetPer();
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar periodo')
  });

  const deletePeriodo = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/periodos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess('Periodo eliminado exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al eliminar periodo')
  });

  const createEdicion = useMutation({
    mutationFn: async (data: any) => {
      if (editingEdicion) {
        const res = await api.put(`/ediciones/${editingEdicion.id}`, data);
        return res.data;
      }
      const res = await api.post('/ediciones', data);
      return res.data;
    },
    onSuccess: () => {
      showSuccess('Edición de diplomado guardada exitosamente');
      queryClient.invalidateQueries();
      setIsModalEdicionOpen(false);
      setEditingEdicion(null);
      resetEdi();
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar edición')
  });

  const deleteEdicion = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/ediciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess('Edición eliminada exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al eliminar edición')
  });

  const updateEstadoEdicion = useMutation({
    mutationFn: async ({ id, estado }: { id: number, estado: string }) => {
      const res = await api.patch(`/ediciones/${id}/estado`, { estado });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess('Estado de la edición actualizado');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al cambiar estado')
  });

  const handleDeletePeriodo = async (p: any) => {
    const isConfirmed = await showConfirmDelete(`la Gestión ${p.gestion} ${p.semestre ? 'Semestre ' + p.semestre : 'Anual'}`);
    if (isConfirmed) deletePeriodo.mutate(p.id);
  };

  const handleDeleteEdicion = async (e: any) => {
    const isConfirmed = await showConfirmDelete(`la Edición de ${e.diplomado?.nombre || 'Diplomado'}`);
    if (isConfirmed) deleteEdicion.mutate(e.id);
  };

  const onSubmitPeriodo = (data: any) => createPeriodo.mutate(data);
  const onSubmitEdicion = (data: any) => createEdicion.mutate(data);

  const formatSemestre = (val: string | null | undefined) => {
    if (!val) return 'ANUAL';
    if (val.toString() === '1') return '1ER SEMESTRE';
    if (val.toString() === '2') return '2DO SEMESTRE';
    return val;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  // Determinar vigencia de periodo
  const getEstadoVigencia = (inicio: string | null, fin: string | null) => {
    if (!inicio || !fin) return { label: 'Programado', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    const now = new Date();
    const dInicio = new Date(inicio);
    const dFin = new Date(fin);
    if (now < dInicio) return { label: 'Próximo', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (now >= dInicio && now <= dFin) return { label: 'En Curso', color: 'bg-teal-50 text-teal-800 border-teal-200' };
    return { label: 'Concluido', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • Calendario Académico
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestiones y Ediciones de Diplomados
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
              Académico
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apertura de promociones, periodos lectivos oficiales y control de vigencia de matrículas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'periodos' ? (
            <button 
              onClick={() => {
                setEditingPeriodo(null);
                resetPer({});
                setIsModalPeriodoOpen(true);
              }}
              className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Periodo</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                setEditingEdicion(null);
                resetEdi({});
                setIsModalEdicionOpen(true);
              }}
              className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Aperturar Edición</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. BARRA DE HERRAMIENTAS, PESTAÑAS Y BUSCADOR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Pestañas Principales */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('ediciones')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'ediciones' 
                  ? 'bg-[#0f2942] text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Ediciones de Diplomados (<span className="font-mono tabular-nums">{ediciones.length}</span>)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('periodos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'periodos' 
                  ? 'bg-[#0f2942] text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Gestiones y Periodos (<span className="font-mono tabular-nums">{periodos.length}</span>)</span>
            </button>
          </div>

          {/* Filtros específicos para Ediciones */}
          {activeTab === 'ediciones' && (
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Filtro Diplomado */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroDiplomado('')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    !filtroDiplomado ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroDiplomado('DCEMA')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    filtroDiplomado === 'DCEMA' ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DCEMA
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroDiplomado('DCEA')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    filtroDiplomado === 'DCEA' ? 'bg-[#0f2942] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DCEA
                </button>
              </div>

              {/* Filtro Estado */}
              <select
                value={filtroEstadoEdicion}
                onChange={(e) => setFiltroEstadoEdicion(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="ABIERTO">Abiertos (Matrícula)</option>
                <option value="EN_CURSO">En Curso (Activos)</option>
                <option value="CERRADO">Cerrados (Concluidos)</option>
              </select>
            </div>
          )}
        </div>

        {/* Buscador en Vivo */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              activeTab === 'ediciones' 
                ? "Buscar por diplomado, año de gestión o semestre..." 
                : "Buscar gestión o semestre..."
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

      {/* 4. CONTENIDO DE LAS PESTAÑAS */}

      {/* ========================================================= */}
      {/* PESTAÑA: EDICIONES DE DIPLOMADOS                          */}
      {/* ========================================================= */}
      {activeTab === 'ediciones' && (
        <div>
          {loadingEdiciones ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
              <div className="w-8 h-8 border-4 border-[#0f2942] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Cargando ediciones aperturadas...</p>
            </div>
          ) : edicionesFiltradas.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700 text-sm">No se encontraron ediciones</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay ediciones de diplomados registradas con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {edicionesFiltradas.map((e: any) => {
                const isDCEMA = e.diplomado?.nombre?.includes('DCEMA');
                const inscritos = e._count?.inscripciones || 0;

                return (
                  <div 
                    key={e.id} 
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Barra Superior con Estado */}
                    <div className={`h-1.5 w-full ${
                      e.estado === 'ABIERTO' 
                        ? 'bg-teal-600' 
                        : e.estado === 'EN_CURSO' 
                          ? 'bg-[#0f2942]' 
                          : 'bg-slate-400'
                    }`}></div>

                    {/* Cabecera de la Tarjeta */}
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isDCEMA ? 'bg-[#0f2942]/10 text-[#0f2942] border-[#0f2942]/20' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isDCEMA ? 'DCEMA' : 'DCEA'}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 ${
                          e.estado === 'ABIERTO' 
                            ? 'bg-teal-50 text-teal-800 border-teal-200' 
                            : e.estado === 'EN_CURSO' 
                              ? 'bg-slate-100 text-[#0f2942] border-slate-300' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            e.estado === 'ABIERTO' ? 'bg-teal-600' : e.estado === 'EN_CURSO' ? 'bg-[#0f2942]' : 'bg-slate-400'
                          }`}></span>
                          {e.estado}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {e.diplomado?.nombre}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono font-medium mt-1 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span>Gestión {e.periodo?.gestion} • {formatSemestre(e.periodo?.semestre)}</span>
                        </p>
                      </div>

                      {/* Fechas de Clases */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between font-mono tabular-nums">
                        <div>
                          <span className="font-sans text-[10px] text-slate-400 font-bold uppercase block">Inicio Clases</span>
                          <span className="font-semibold text-slate-800">{formatDate(e.fecha_inicio)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-[10px] text-slate-400 font-bold uppercase block">Fin Clases</span>
                          <span className="font-semibold text-slate-800">{formatDate(e.fecha_fin)}</span>
                        </div>
                      </div>

                      {/* Contador de Inscritos */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Efectivos Inscritos:</span>
                        </span>
                        <span className="font-mono tabular-nums font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                          {inscritos} cursantes
                        </span>
                      </div>
                    </div>

                    {/* Pie de la Tarjeta: Selector Rápido de Estado y Acciones */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">Estado:</span>
                        <select 
                          value={e.estado}
                          onChange={(ev) => updateEstadoEdicion.mutate({ id: e.id, estado: ev.target.value })}
                          className="text-[11px] font-bold px-2 py-1 rounded border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] cursor-pointer"
                        >
                          <option value="ABIERTO">ABIERTO</option>
                          <option value="EN_CURSO">EN_CURSO</option>
                          <option value="CERRADO">CERRADO</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingEdicion(e);
                            setEdiValue('diplomado_id', e.diplomado_id);
                            setEdiValue('periodo_id', e.periodo_id);
                            setEdiValue('fecha_inicio', e.fecha_inicio ? e.fecha_inicio.split('T')[0] : '');
                            setEdiValue('fecha_fin', e.fecha_fin ? e.fecha_fin.split('T')[0] : '');
                            setEdiValue('estado', e.estado);
                            setIsModalEdicionOpen(true);
                          }}
                          className="text-slate-500 hover:text-[#0f2942] p-1.5 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
                          title="Editar Edición"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEdicion(e)}
                          className="text-slate-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar Edición"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA: PERIODOS ACADÉMICOS / GESTIONES                  */}
      {/* ========================================================= */}
      {activeTab === 'periodos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loadingPeriodos ? (
            <div className="p-12 text-center text-slate-500">Cargando periodos...</div>
          ) : periodosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No se encontraron periodos registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">Gestión</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">Régimen / Semestre</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">Calendario Lectivo (Inicio - Fin)</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">Vigencia</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-xs">
                  {periodosFiltrados.map((p: any) => {
                    const vigencia = getEstadoVigencia(p.fecha_inicio, p.fecha_fin);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap font-mono tabular-nums font-bold text-slate-900 text-sm">
                          Gestión {p.gestion}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-[10px] uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {formatSemestre(p.semestre)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-mono tabular-nums font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(p.fecha_inicio)} — {formatDate(p.fecha_fin)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${vigencia.color}`}>
                            {vigencia.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => {
                                setEditingPeriodo(p);
                                resetPer({ 
                                  gestion: p.gestion, 
                                  semestre: p.semestre || '', 
                                  fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '', 
                                  fecha_fin: p.fecha_fin ? p.fecha_fin.split('T')[0] : '' 
                                });
                                setIsModalPeriodoOpen(true);
                              }}
                              className="text-slate-500 hover:text-[#0f2942] p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Editar Periodo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeletePeriodo(p)}
                              className="text-slate-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar Periodo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL PERIODO ACADÉMICO */}
      {isModalPeriodoOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">
                  {editingPeriodo ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Defina el año lectivo y calendario oficial</p>
              </div>
              <button 
                onClick={() => { setIsModalPeriodoOpen(false); setEditingPeriodo(null); resetPer({}); }} 
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePerSubmit(onSubmitPeriodo)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gestión / Año <span className="text-red-600">*</span>
                </label>
                <input 
                  type="number"
                  placeholder="Ej: 2026"
                  {...regPer('gestion', { required: true })} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Semestre (Opcional)
                </label>
                <select 
                  {...regPer('semestre')} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                >
                  <option value="">Anual (Sin Semestre)</option>
                  <option value="1">1er Semestre</option>
                  <option value="2">2do Semestre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha Inicio</label>
                  <input 
                    type="date" 
                    {...regPer('fecha_inicio')} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha Fin</label>
                  <input 
                    type="date" 
                    {...regPer('fecha_fin')} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]" 
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => { setIsModalPeriodoOpen(false); setEditingPeriodo(null); resetPer({}); }} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={createPeriodo.isPending} 
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createPeriodo.isPending ? 'Guardando...' : 'Guardar Periodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL EDICIÓN DE DIPLOMADO */}
      {isModalEdicionOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">
                  {editingEdicion ? 'Editar Edición' : 'Aperturar Edición de Diplomado'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Vincule el programa académico a un periodo lectivo</p>
              </div>
              <button 
                onClick={() => { setIsModalEdicionOpen(false); setEditingEdicion(null); resetEdi({}); }} 
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEdiSubmit(onSubmitEdicion)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Programa Académico / Diplomado <span className="text-red-600">*</span>
                </label>
                <select 
                  {...regEdi('diplomado_id', { required: true })} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                >
                  <option value="">Seleccione un diplomado...</option>
                  {diplomados.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Periodo Académico Oficial <span className="text-red-600">*</span>
                </label>
                <select 
                  {...regEdi('periodo_id', { required: true })} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                >
                  <option value="">Seleccione un periodo...</option>
                  {periodos.map((p: any) => (
                    <option key={p.id} value={p.id}>Gestión {p.gestion} — {formatSemestre(p.semestre)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Inicio de Clases</label>
                  <input 
                    type="date" 
                    {...regEdi('fecha_inicio')} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fin de Clases</label>
                  <input 
                    type="date" 
                    {...regEdi('fecha_fin')} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]" 
                  />
                </div>
              </div>

              {editingEdicion && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estado de la Edición</label>
                  <select 
                    {...regEdi('estado')} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white cursor-pointer"
                  >
                    <option value="ABIERTO">ABIERTO (Matrícula)</option>
                    <option value="EN_CURSO">EN_CURSO (Clases activas)</option>
                    <option value="CERRADO">CERRADO (Concluido)</option>
                  </select>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => { setIsModalEdicionOpen(false); setEditingEdicion(null); resetEdi({}); }} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={createEdicion.isPending} 
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createEdicion.isPending ? 'Guardando...' : editingEdicion ? 'Guardar Cambios' : 'Aperturar Edición'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
