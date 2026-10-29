import { useState, useEffect, useMemo } from 'react';
import { Save, FileText, BookOpen, FileSpreadsheet, RefreshCw, Search, Lock, Keyboard, Info, Eye, Calendar, GraduationCap, Archive } from 'lucide-react';
import api from '../../services/api';
import { showError, showToast } from '../../utils/alerts';
import { useAuthStore } from '../../store/authStore';
import { generarPonderacionPDF, generarPonderacionExcel } from '../../utils/generarPonderacion';
import { ModalDetalleCampoDCEA } from '../../components/evaluador/ModalDetalleCampoDCEA';

const DCEA_COLUMNS = [
  { id: 'doctrinario', name: 'Doctrinario Específico', percent: 28, isAuto: true, campoKey: 'doctrinario' },
  { id: 'militar', name: 'Militar', percent: 17, isAuto: true, campoKey: 'militar' },
  { id: 'seguridad', name: 'Seguridad y Defensa', percent: 8, isAuto: true, campoKey: 'seguridad' },
  { id: 'comando', name: 'Comando y Adm.', percent: 7, isAuto: true, campoKey: 'comando' },
  { id: 'juegos', name: 'Juegos Adm.', percent: 2, isAuto: false },
  { id: 'preoral', name: 'Examen Pre-Oral', percent: 2, isAuto: false },
  { id: 'oral', name: 'Examen Oral', percent: 25, isAuto: false },
  { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1, isAuto: false },
  { id: 'fisico', name: 'Actividades Físicas', percent: 4, isAuto: false },
  { id: 'disciplina', name: 'Disciplina', percent: 3, isAuto: true, campoKey: 'disciplina' },
  { id: 'apreciacion', name: 'Apreciación Planta', percent: 3, isAuto: false },
];

const DCEMA_COLUMNS = [
  { id: 'doctrinario', name: 'Doctrinario Específico', percent: 17.5, isAuto: true, campoKey: 'doctrinario' },
  { id: 'militar', name: 'Militar', percent: 10.5, isAuto: true, campoKey: 'militar' },
  { id: 'seguridad', name: 'Seguridad y Defensa', percent: 5, isAuto: true, campoKey: 'seguridad' },
  { id: 'comando', name: 'Comando y Administración', percent: 4, isAuto: true, campoKey: 'comando' },
  { id: 'ejercicios', name: 'Ejercicios Operativos', percent: 20, isAuto: false },
  { id: 'preoral', name: 'Examen Pre-Oral', percent: 2, isAuto: false },
  { id: 'oral', name: 'Examen Oral', percent: 30, isAuto: false },
  { id: 'trabajos', name: 'Trabajos Aplicativos', percent: 1, isAuto: false },
  { id: 'fisico', name: 'Actividades Físico Deportivas', percent: 4, isAuto: false },
  { id: 'disciplina', name: 'Disciplina', percent: 3, isAuto: true, campoKey: 'disciplina' },
  { id: 'apreciacion', name: 'Apreciación Planta Académica', percent: 3, isAuto: false },
];

export default function PonderacionFinal() {
  const { user } = useAuthStore();
  const [allInscripciones, setAllInscripciones] = useState<any[]>([]);
  const [allEdiciones, setAllEdiciones] = useState<any[]>([]);
  const [assignedDiplomados, setAssignedDiplomados] = useState<{ DCEA: boolean; DCEMA: boolean }>({ DCEA: false, DCEMA: false });
  const [cursantes, setCursantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tipoDiplomado, setTipoDiplomado] = useState<'DCEA' | 'DCEMA'>('DCEA');
  const [selectedEdicionId, setSelectedEdicionId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para ver desglose de materias de un campo DCEA / DCEMA
  const [detalleModal, setDetalleModal] = useState<{
    isOpen: boolean;
    cursanteNombre: string;
    cursanteGrado?: string;
    cursanteCm?: string;
    campoKey: string;
    campoTitulo: string;
    campoMaxPeso: number;
    campoPuntos: number;
    campoNotaBase: number;
    materias: any[];
  }>({
    isOpen: false,
    cursanteNombre: '',
    campoKey: '',
    campoTitulo: '',
    campoMaxPeso: 0,
    campoPuntos: 0,
    campoNotaBase: 0,
    materias: []
  });

  const activeColumns = tipoDiplomado === 'DCEMA' ? DCEMA_COLUMNS : DCEA_COLUMNS;

  // Ediciones disponibles para el diplomado seleccionado (ordenadas de la más reciente a la más antigua)
  const edicionesDiplomado = useMemo(() => {
    const mapEdiciones = new Map<number, any>();

    // 1. Incluir desde /ediciones
    for (const ed of allEdiciones) {
      const dipNombre = ed.diplomado?.nombre?.toUpperCase() || '';
      const match = tipoDiplomado === 'DCEMA' ? dipNombre.includes('DCEMA') : dipNombre.includes('DCEA');
      if (match) {
        mapEdiciones.set(ed.id, ed);
      }
    }

    // 2. Asegurar cualquier edición presente en /inscripciones
    for (const insc of allInscripciones) {
      const ed = insc.edicion;
      if (!ed) continue;
      const dipNombre = ed.diplomado?.nombre?.toUpperCase() || '';
      const match = tipoDiplomado === 'DCEMA' ? dipNombre.includes('DCEMA') : dipNombre.includes('DCEA');
      if (match && !mapEdiciones.has(ed.id)) {
        mapEdiciones.set(ed.id, ed);
      }
    }

    return Array.from(mapEdiciones.values()).sort((a, b) => {
      const gA = parseInt(a.periodo?.gestion || '0', 10);
      const gB = parseInt(b.periodo?.gestion || '0', 10);
      if (gB !== gA) return gB - gA;
      const sA = parseInt(a.periodo?.semestre || '0', 10);
      const sB = parseInt(b.periodo?.semestre || '0', 10);
      if (sB !== sA) return sB - sA;
      return b.id - a.id;
    });
  }, [allEdiciones, allInscripciones, tipoDiplomado]);

  const edicionActualObj = useMemo(() => {
    if (selectedEdicionId === 'ALL') return null;
    return edicionesDiplomado.find(e => e.id === selectedEdicionId) || null;
  }, [edicionesDiplomado, selectedEdicionId]);

  const isEdicionCerrada = edicionActualObj?.estado === 'CERRADO';
  const canAccessDCEA = user?.rol === 'ADMIN' || assignedDiplomados.DCEA;
  const canAccessDCEMA = user?.rol === 'ADMIN' || assignedDiplomados.DCEMA;
  const hasAnyJurisdiction = canAccessDCEA || canAccessDCEMA;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [asigRes, inscRes, edicRes] = await Promise.all([
        user?.id ? api.get('/evaluadores/asignaciones').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        api.get('/inscripciones'),
        api.get('/ediciones').catch(() => ({ data: [] }))
      ]);

      const misAsignaciones = (asigRes.data || []).filter((a: any) => a.evaluador_id === user?.id);
      const diplomadoNombres = misAsignaciones.map((a: any) => a.materia?.diplomado?.nombre?.toUpperCase() || '');
      const hasDCEA = diplomadoNombres.some((n: string) => n.includes('DCEA'));
      const hasDCEMA = diplomadoNombres.some((n: string) => n.includes('DCEMA'));
      setAssignedDiplomados({ DCEA: hasDCEA, DCEMA: hasDCEMA });

      // Determinar diplomado inicial según jurisdicción habilitada
      const initialDip: 'DCEA' | 'DCEMA' = hasDCEMA && !hasDCEA ? 'DCEMA' : 'DCEA';
      setTipoDiplomado(initialDip);

      const inscData = inscRes.data || [];
      const edicData = edicRes.data || [];
      setAllInscripciones(inscData);
      setAllEdiciones(edicData);

      // Seleccionar por defecto la edición activa más reciente del diplomado inicial
      seleccionarEdicionPorDefecto(initialDip, edicData, inscData, misAsignaciones);
    } catch (error) {
      console.error("Error al cargar datos de ponderación:", error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarEdicionPorDefecto = (
    dip: 'DCEA' | 'DCEMA',
    edicData: any[],
    inscData: any[],
    misAsignaciones: any[] = []
  ) => {
    const candidatas = edicData.filter((ed: any) => {
      const nom = ed.diplomado?.nombre?.toUpperCase() || '';
      return dip === 'DCEMA' ? nom.includes('DCEMA') : nom.includes('DCEA');
    });

    // Prioridad 1: Edición activa donde el evaluador esté asignado
    const asignadaActiva = candidatas.find(
      (ed: any) =>
        (ed.estado === 'EN_CURSO' || ed.estado === 'ABIERTO') &&
        misAsignaciones.some((a: any) => a.edicion_id === ed.id)
    );
    if (asignadaActiva) {
      setSelectedEdicionId(asignadaActiva.id);
      return;
    }

    // Prioridad 2: Cualquier edición activa con inscritos
    const activaConInscritos = candidatas.find(
      (ed: any) =>
        (ed.estado === 'EN_CURSO' || ed.estado === 'ABIERTO') &&
        inscData.some((i: any) => i.edicion_id === ed.id)
    );
    if (activaConInscritos) {
      setSelectedEdicionId(activaConInscritos.id);
      return;
    }

    // Prioridad 3: Primera edición disponible
    if (candidatas.length > 0) {
      setSelectedEdicionId(candidatas[0].id);
    } else {
      setSelectedEdicionId('ALL');
    }
  };

  // Cambiar entre DCEA y DCEMA respetando bloqueo de jurisdicción
  const handleSelectDiplomado = (nuevoDip: 'DCEA' | 'DCEMA') => {
    if (nuevoDip === tipoDiplomado) return;
    if (nuevoDip === 'DCEA' && !canAccessDCEA) return;
    if (nuevoDip === 'DCEMA' && !canAccessDCEMA) return;
    setTipoDiplomado(nuevoDip);
    seleccionarEdicionPorDefecto(nuevoDip, allEdiciones, allInscripciones);
  };

  // Reconstruir filas de la tabla cuando cambia el diplomado, la edición seleccionada o las inscripciones
  useEffect(() => {
    const authorized = tipoDiplomado === 'DCEMA' ? canAccessDCEMA : canAccessDCEA;
    if (!authorized) {
      setCursantes([]);
      return;
    }

    const activeCols = tipoDiplomado === 'DCEMA' ? DCEMA_COLUMNS : DCEA_COLUMNS;

    const inscripcionesFiltradas = allInscripciones.filter((insc: any) => {
      const nombreDip = insc.edicion?.diplomado?.nombre?.toUpperCase() || '';
      const matchDiplomado = tipoDiplomado === 'DCEMA' ? nombreDip.includes('DCEMA') : nombreDip.includes('DCEA');
      if (!matchDiplomado) return false;

      if (selectedEdicionId !== 'ALL') {
        return insc.edicion_id === selectedEdicionId && insc.estado !== 'ABANDONO';
      }

      return (insc.edicion?.estado === 'ABIERTO' || insc.edicion?.estado === 'EN_CURSO') && insc.estado !== 'ABANDONO';
    });

    const cursantesMapeados = inscripcionesFiltradas.map((insc: any) => {
      const rawNotas = (insc.ponderaciones as Record<string, number | ''>) || {};
      const notasEnPorcentaje: Record<string, number | ''> = {};

      for (const col of activeCols) {
        if (rawNotas[col.id] !== undefined && rawNotas[col.id] !== '') {
          notasEnPorcentaje[col.id] = parseFloat((Number(rawNotas[col.id]) * (col.percent / 100)).toFixed(2));
        }
      }

      return {
        id: insc.id,
        edicion_id: insc.edicion_id,
        estadoInscripcion: insc.estado,
        grado: insc.cursante.grado,
        nombre: insc.cursante.nombre,
        apellido: insc.cursante.apellido,
        cm: insc.cursante.cm,
        notas: notasEnPorcentaje,
        detallesDCEA: insc.detallesDCEA
      };
    });

    setCursantes(cursantesMapeados);
  }, [allInscripciones, tipoDiplomado, selectedEdicionId, canAccessDCEA, canAccessDCEMA]);

  const handleNotaChange = (cursanteId: number, colId: string, value: string) => {
    if (isEdicionCerrada) return;
    setCursantes(prev => prev.map(c => {
      if (c.id === cursanteId) {
        return {
          ...c,
          notas: {
            ...c.notas,
            [colId]: value === '' ? '' : Number(value)
          }
        };
      }
      return c;
    }));
  };

  const calcularPromedio = (notas: Record<string, number | ''>) => {
    let total = 0;
    let todasLlenas = true;
    for (const col of activeColumns) {
      if (notas[col.id] === undefined || notas[col.id] === '') {
        todasLlenas = false;
        break;
      }
      total += Number(notas[col.id]);
    }
    return todasLlenas ? total.toFixed(2) : '-';
  };

  const handleOpenDetalleCampo = (cursante: any, col: any) => {
    if (!cursante.detallesDCEA?.campos || !col.campoKey || col.id === 'disciplina') return;
    const campoInfo = cursante.detallesDCEA.campos[col.campoKey];
    if (!campoInfo) return;

    setDetalleModal({
      isOpen: true,
      cursanteNombre: `${cursante.nombre} ${cursante.apellido}`,
      cursanteGrado: cursante.grado,
      cursanteCm: cursante.cm,
      campoKey: col.campoKey,
      campoTitulo: col.name,
      campoMaxPeso: campoInfo.maxPeso,
      campoPuntos: campoInfo.puntos,
      campoNotaBase: campoInfo.notaBase,
      materias: campoInfo.materias || []
    });
  };

  const handleSave = async () => {
    if (isEdicionCerrada) return;
    try {
      setIsSaving(true);
      const promesas = cursantes.map(c => {
        const rawNotas = { ...c.notas };
        const payload: Record<string, any> = {};
        for (const col of activeColumns) {
          // Solo enviar campos manuales (no calculados automáticamente)
          const isAuto = (col as any).isAuto || col.id === 'disciplina';
          if (!isAuto && rawNotas[col.id] !== undefined && rawNotas[col.id] !== '' && !isNaN(Number(rawNotas[col.id]))) {
            payload[col.id] = parseFloat((Number(rawNotas[col.id]) / (col.percent / 100)).toFixed(2));
          }
        }
        return api.put(`/inscripciones/${c.id}/ponderaciones`, { ponderaciones: payload });
      });
      await Promise.all(promesas);
      // Refrescar inscripciones en segundo plano para mantener sincronizadas todas las ediciones
      const inscRes = await api.get('/inscripciones');
      setAllInscripciones(inscRes.data || []);
      showToast('✓ Ponderaciones guardadas correctamente', 'success', 2200);
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Hubo un error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const cursantesFiltrados = cursantes.filter(c => {
    if (!searchQuery.trim()) return true;
    const full = `${c.grado || ''} ${c.nombre || ''} ${c.apellido || ''} ${c.cm || ''}`.toLowerCase();
    return full.includes(searchQuery.toLowerCase());
  });

  // Etiqueta descriptiva de la gestión seleccionada (para cabecera y exportación PDF/Excel)
  const etiquetaPeriodoSeleccionado = useMemo(() => {
    if (!edicionActualObj) return `Gestión ${new Date().getFullYear()}`;
    const gestion = edicionActualObj.periodo?.gestion || new Date().getFullYear();
    const sem = edicionActualObj.periodo?.semestre ? `Semestre ${edicionActualObj.periodo.semestre}` : 'Anual';
    return `Gestión ${gestion} (${sem})`;
  }, [edicionActualObj]);

  const tituloExportacion = useMemo(() => {
    const base = tipoDiplomado === 'DCEMA'
      ? 'Diplomado de Comando y Estado Mayor Aéreo (DCEMA)'
      : 'Diplomado de Comando de Escuadrón Aéreo (DCEA)';
    return `${base} — ${etiquetaPeriodoSeleccionado}`;
  }, [tipoDiplomado, etiquetaPeriodoSeleccionado]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">
      
      {/* Cabecera Institucional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4 border-l-4 border-l-[#0f2942]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#0f2942]/10 text-[#0f2942] border border-[#0f2942]/20">
                {tipoDiplomado}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {etiquetaPeriodoSeleccionado}
              </span>
              {edicionActualObj && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  edicionActualObj.estado === 'CERRADO'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {edicionActualObj.estado === 'CERRADO' ? 'Histórico / Cerrado' : 'Edición Vigente'}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              Cuadro Centralizador de Ponderación Final
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Consolidado de calificaciones por campos curriculares — Diplomado de Comando {tipoDiplomado === 'DCEMA' ? 'y Estado Mayor Aéreo' : 'de Escuadrón Aéreo'}.
            </p>
          </div>
            
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button 
              onClick={() => generarPonderacionPDF({ 
                diplomado: tituloExportacion, 
                cursantes,
                columns: activeColumns
              })}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Exportar PDF
            </button>
            <button 
              onClick={() => generarPonderacionExcel({ 
                diplomado: tituloExportacion, 
                cursantes,
                columns: activeColumns
              })}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
              Exportar Excel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || isEdicionCerrada}
              title={isEdicionCerrada ? 'Esta gestión se encuentra cerrada (modo consulta e impresión)' : 'Guardar calificaciones manuales'}
              className={`bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs ${(isSaving || isEdicionCerrada) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isEdicionCerrada ? (
                <>
                  <Archive className="w-3.5 h-3.5" /> Gestión Cerrada
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Selección de Diplomado (DCEA / DCEMA) y Gestión / Edición */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mr-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0f2942]" />
              Programa:
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 gap-1">
              <button
                type="button"
                disabled={!canAccessDCEA}
                onClick={() => handleSelectDiplomado('DCEA')}
                title={!canAccessDCEA ? 'Acceso bloqueado — Solo tienes habilitado el diplomado asignado por el Administrador' : 'Ver Ponderación Final DCEA'}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !canAccessDCEA
                    ? 'text-slate-400 bg-slate-100/80 cursor-not-allowed opacity-70'
                    : tipoDiplomado === 'DCEA'
                      ? 'bg-[#0f2942] text-white shadow-2xs cursor-pointer'
                      : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                }`}
              >
                {!canAccessDCEA ? (
                  <Lock className="w-3 h-3 text-slate-400" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${tipoDiplomado === 'DCEA' ? 'bg-amber-400' : 'bg-teal-600'}`} />
                )}
                <span>DCEA (Escuadrón Aéreo)</span>
                {!canAccessDCEA && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-500 font-bold">
                    Bloqueado
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={!canAccessDCEMA}
                onClick={() => handleSelectDiplomado('DCEMA')}
                title={!canAccessDCEMA ? 'Acceso bloqueado — Solo tienes habilitado el diplomado asignado por el Administrador' : 'Ver Ponderación Final DCEMA'}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !canAccessDCEMA
                    ? 'text-slate-400 bg-slate-100/80 cursor-not-allowed opacity-70'
                    : tipoDiplomado === 'DCEMA'
                      ? 'bg-[#0f2942] text-white shadow-2xs cursor-pointer'
                      : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                }`}
              >
                {!canAccessDCEMA ? (
                  <Lock className="w-3 h-3 text-slate-400" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${tipoDiplomado === 'DCEMA' ? 'bg-amber-400' : 'bg-teal-600'}`} />
                )}
                <span>DCEMA (Comando y Estado Mayor)</span>
                {!canAccessDCEMA && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-500 font-bold">
                    Bloqueado
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="select-edicion-ponderacion" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#0f2942]" />
              Gestión / Edición:
            </label>
            <select
              id="select-edicion-ponderacion"
              disabled={!hasAnyJurisdiction}
              value={selectedEdicionId}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedEdicionId(v === 'ALL' ? 'ALL' : Number(v));
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {edicionesDiplomado.length === 0 ? (
                <option value="ALL">Edición Vigente</option>
              ) : (
                edicionesDiplomado.map((ed: any) => {
                  const g = ed.periodo?.gestion || 'S/G';
                  const s = ed.periodo?.semestre ? `Semestre ${ed.periodo.semestre}` : 'Anual';
                  const estadoLabel = ed.estado === 'CERRADO' ? 'CERRADO / HISTÓRICO' : ed.estado === 'EN_CURSO' ? 'EN CURSO' : 'ABIERTO';
                  return (
                    <option key={ed.id} value={ed.id}>
                      Gestión {g} ({s}) — [{estadoLabel}]
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Toolbar de la tabla */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por grado, apellido o CM..." 
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] bg-white"
              />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono font-bold">Enter</kbd> / <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono font-bold">↓</kbd> avanza fila
            </span>
          </div>
          
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2 font-mono tabular-nums">
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0f2942]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            )}
            Registros: {cursantesFiltrados.length} / {cursantes.length}
          </div>
        </div>

        {/* Tabla Deslizable */}
        <div className="overflow-auto max-h-[65vh] relative">
          <table className="w-full text-left text-xs min-w-max">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 top-0 bg-slate-100 z-30 px-4 py-3 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 w-64">
                  Cursante
                </th>
                {activeColumns.map(col => {
                  const isAuto = Boolean((col as any).isAuto || col.id === 'disciplina');
                  return (
                    <th key={col.id} className="px-2.5 py-2.5 text-center font-semibold w-24 min-w-[92px] align-bottom border-l border-slate-200/70">
                      <div className="flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[10px] leading-tight text-slate-600 font-semibold h-8 flex items-end justify-center text-center gap-1">
                          {isAuto && (
                            <span title={col.id === 'disciplina' ? "Calculado automáticamente por Deméritos" : "Calculado automáticamente por actas de materias (Clic para desglose)"}>
                              <Lock className="w-3 h-3 text-[#0f2942]" />
                            </span>
                          )}
                          {col.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isAuto ? 'bg-[#0f2942]/10 text-[#0f2942] border border-[#0f2942]/20' : 'bg-slate-200/80 text-slate-700'}`}>
                          {col.percent}%
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-2.5 text-center font-bold text-slate-900 border-l border-slate-200 bg-slate-200/60 w-28">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] tracking-wider uppercase">Nota Final</span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">100.00%</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!hasAnyJurisdiction && !loading ? (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-12 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                      <Lock className="w-6 h-6 text-slate-400" />
                      <span className="font-bold text-slate-800 text-sm">Sin Jurisdicción de Diplomado Habilitada</span>
                      <span className="text-slate-500">
                        Su cuenta de Evaluador aún no tiene asignado el diplomado DCEA ni DCEMA. Solicite al Administrador la habilitación correspondiente en el módulo de Designación de Evaluadores.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : cursantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron cursantes con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                cursantesFiltrados.map((c, rowIndex) => {
                  const prom = calcularPromedio(c.notas);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-4 py-2.5 border-r border-slate-200 min-w-[200px]">
                        <div className="font-semibold text-slate-900 text-xs">{c.grado ? `${c.grado} ` : ''}{c.nombre} {c.apellido}</div>
                        <div className="text-[10px] font-mono text-slate-500">CM: {c.cm || 'S/N'}</div>
                      </td>
                      
                      {activeColumns.map((col, colIndex) => {
                        const isAcademicCampo = Boolean((col as any).campoKey && col.id !== 'disciplina');
                        const isDisciplina = col.id === 'disciplina';
                        const val = c.notas[col.id];
                        const valFormatted = val !== undefined && val !== '' ? Number(val).toFixed(2) : '—';

                        if (isAcademicCampo) {
                          return (
                            <td key={col.id} className="px-2 py-2.5 border-l border-slate-100 bg-slate-50/50 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenDetalleCampo(c, col)}
                                title={`Ver desglose de asignaturas de ${col.name}`}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[#0f2942] font-mono font-bold text-xs hover:bg-[#0f2942] hover:text-white hover:border-[#0f2942] transition-colors cursor-pointer tabular-nums"
                              >
                                <span>{valFormatted}</span>
                                <Eye className="w-3 h-3 opacity-60" />
                              </button>
                            </td>
                          );
                        }

                        if (isDisciplina) {
                          return (
                            <td key={col.id} className="px-2 py-2.5 border-l border-slate-100 bg-slate-50/50 text-center">
                              <div
                                title="Nota calculada según Coeficiente de Disciplina"
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs tabular-nums"
                              >
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{valFormatted}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={col.id} className="px-2 py-2.5 border-l border-slate-100 bg-white text-center">
                            <input
                              id={`ponder-input-${rowIndex}-${colIndex}`}
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              disabled={isEdicionCerrada}
                              value={c.notas[col.id] !== undefined ? c.notas[col.id] : ''}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  const next = document.getElementById(`ponder-input-${rowIndex + 1}-${colIndex}`) as HTMLInputElement;
                                  if (next) { next.focus(); next.select(); }
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  const prev = document.getElementById(`ponder-input-${rowIndex - 1}-${colIndex}`) as HTMLInputElement;
                                  if (prev) { prev.focus(); prev.select(); }
                                }
                              }}
                              onChange={(e) => handleNotaChange(c.id, col.id, e.target.value)}
                              placeholder="—"
                              className={`w-20 px-2 py-1 text-center font-mono font-semibold text-xs border border-slate-200 rounded-md outline-none transition-colors mx-auto block tabular-nums ${
                                isEdicionCerrada
                                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                                  : 'text-slate-900 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]'
                              }`}
                            />
                          </td>
                        );
                      })}

                      <td className="px-4 py-2.5 text-center font-mono font-bold border-l border-slate-200 bg-slate-50/70 tabular-nums">
                        <span className={`${prom !== '-' && parseFloat(prom) >= 60 ? 'text-teal-800' : prom !== '-' ? 'text-red-700' : 'text-slate-400'}`}>
                          {prom}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[#0f2942] font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
              <Lock className="w-3 h-3" /> Campos Curriculares ({tipoDiplomado === 'DCEMA' ? '37%' : '60%'}) y Disciplina (3%)
            </span>
            <span>se sincronizan automáticamente desde las planillas docentes y de instrucción.</span>
          </div>
          <p className="font-semibold text-slate-700">Escala centesimal ponderada (100.00 pts).</p>
        </div>

      </div>

      {/* Modal Desglose Campo DCEA / DCEMA */}
      <ModalDetalleCampoDCEA
        isOpen={detalleModal.isOpen}
        onClose={() => setDetalleModal(prev => ({ ...prev, isOpen: false }))}
        diplomadoCodigo={tipoDiplomado}
        cursanteNombre={detalleModal.cursanteNombre}
        cursanteGrado={detalleModal.cursanteGrado}
        cursanteCm={detalleModal.cursanteCm}
        campoKey={detalleModal.campoKey}
        campoTitulo={detalleModal.campoTitulo}
        campoMaxPeso={detalleModal.campoMaxPeso}
        campoPuntos={detalleModal.campoPuntos}
        campoNotaBase={detalleModal.campoNotaBase}
        materias={detalleModal.materias}
      />
    </div>
  );
}
