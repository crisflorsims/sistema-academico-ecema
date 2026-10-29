import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ModalRubrica } from '../../components/docente/ModalRubrica';
import type { RubricaData } from '../../components/docente/ModalRubrica';
import { generarPlanillaPDF, generarPlanillaExcel } from '../../utils/generarPlanilla';
import { showToast } from '../../utils/alerts';
import { 
  CheckCircle2, 
  RefreshCw, 
  Keyboard, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  Check, 
  ArrowLeft,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Layers
} from 'lucide-react';

export function GestorCalificaciones() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [selectedMateria, setSelectedMateria] = useState<number | null>(null);
  const [rubricaOpenFor, setRubricaOpenFor] = useState<any | null>(null);

  // Estados para tracking visual en tiempo real y navegación ágil
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [savedCellKey, setSavedCellKey] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [filtroCursante, setFiltroCursante] = useState('');

  // Obtener materias asignadas al docente
  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ['docenteMaterias'],
    queryFn: async () => {
      const res = await api.get('/calificaciones/materias');
      return res.data;
    },
    enabled: user?.rol === 'DOCENTE' || user?.rol === 'EVALUADOR' || user?.rol === 'ADMIN'
  });

  // Agrupar materias para el evaluador
  const groupedMaterias = useMemo(() => {
    if (!materias) return {};
    const grouped: any = {};
    
    materias.forEach((dm: any) => {
      const gestion = dm.edicion?.periodo?.gestion || 'Sin Gestión';
      const semestre = dm.edicion?.periodo?.semestre ? `Sem. ${dm.edicion.periodo.semestre}` : 'Anual';
      const diplomado = dm.materia?.diplomado?.nombre || 'Sin Diplomado';
      const edicionKey = `${diplomado} - Gestión ${gestion} (${semestre})`;
      
      const area = dm.materia?.area?.nombre;
      
      // Si no tiene área asignada (lo que antes era 'Área General'), omitimos esta materia
      if (!area) return;

      if (!grouped[edicionKey]) grouped[edicionKey] = {};
      if (!grouped[edicionKey][area]) grouped[edicionKey][area] = [];
      
      grouped[edicionKey][area].push(dm);
    });
    return grouped;
  }, [materias]);

  // Obtener cursantes de la materia seleccionada
  const { data: cursantes, isLoading: loadingCursantes } = useQuery({
    queryKey: ['cursantesMateria', selectedMateria],
    queryFn: async () => {
      if (!selectedMateria) return [];
      const res = await api.get(`/calificaciones/materias/${selectedMateria}/cursantes`);
      return res.data;
    },
    enabled: !!selectedMateria,
    refetchOnWindowFocus: false, // Previene reseteo de inputs al cambiar de pestaña
    staleTime: 1000 * 60 // 1 minuto de frescura
  });

  // Mutación para guardar nota (con actualización en caché granular no intrusiva)
  const guardarNotaMutation = useMutation({
    mutationFn: async (data: { inscripcion_materia_id: number, evaluacion: string, nota: number, rubrica?: any, observaciones?: string }) => {
      const res = await api.post('/calificaciones/registrar', data);
      return { ...res.data, payload: data };
    },
    onSuccess: (data) => {
      // Actualizar la caché de forma granular sin disparar refetch destructivo de inputs
      queryClient.setQueryData(['cursantesMateria', selectedMateria], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((item: any) => {
          if (item.id === data.payload.inscripcion_materia_id) {
            const existingIdx = item.calificaciones?.findIndex((c: any) => c.evaluacion === data.payload.evaluacion);
            const updatedCal = {
              ...(data.calificacion || {}),
              evaluacion: data.payload.evaluacion,
              nota: data.payload.nota,
              rubrica: data.payload.rubrica,
              observaciones: data.payload.observaciones
            };
            const newCalificaciones = item.calificaciones ? [...item.calificaciones] : [];
            if (existingIdx !== undefined && existingIdx >= 0) {
              newCalificaciones[existingIdx] = updatedCal;
            } else {
              newCalificaciones.push(updatedCal);
            }
            return { ...item, calificaciones: newCalificaciones };
          }
          return item;
        });
      });

      setSavingCellKey(null);
      const cellKey = `${data.payload.inscripcion_materia_id}_${data.payload.evaluacion}`;
      setSavedCellKey(cellKey);
      setSyncStatus('saved');
      setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      showToast(`✓ Nota ${data.payload.evaluacion}: ${data.payload.nota} pts`, 'success', 1200);

      setTimeout(() => {
        setSavedCellKey(prev => prev === cellKey ? null : prev);
      }, 1800);
    },
    onError: (err: any) => {
      setSavingCellKey(null);
      setSyncStatus('error');
      showToast(err.response?.data?.error || 'Error al guardar la nota', 'error', 3000);
    }
  });

  const handleSaveNota = (inscripcion_materia_id: number, evaluacion: string, notaStr: string, currentVal: string | number) => {
    if (notaStr.trim() === '') return;
    const nota = parseFloat(notaStr);
    if (isNaN(nota) || nota < 0 || nota > 100) {
      showToast('Por favor ingrese una nota válida entre 0 y 100', 'warning', 2500);
      return;
    }
    // Si la nota no cambió, evitamos peticiones innecesarias
    if (currentVal !== '' && Number(currentVal) === nota) {
      return;
    }

    const cellKey = `${inscripcion_materia_id}_${evaluacion}`;
    setSavingCellKey(cellKey);
    setSyncStatus('saving');
    guardarNotaMutation.mutate({ inscripcion_materia_id, evaluacion, nota });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    inscId: number,
    evaluacion: string,
    currentVal: string | number,
    maxRows: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const input = e.currentTarget;
      if (input.value !== String(currentVal) && input.value !== '') {
        handleSaveNota(inscId, evaluacion, input.value, currentVal);
      }
      // Saltar inmediatamente a la siguiente fila en la misma columna
      const nextRow = rowIndex + 1;
      if (nextRow < maxRows) {
        const nextInput = document.getElementById(`grade-input-${nextRow}-${colIndex}`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // Si llegó a la última fila, pasar a la primera fila de la siguiente columna
        const nextColInput = document.getElementById(`grade-input-0-${colIndex + 1}`) as HTMLInputElement;
        if (nextColInput) {
          nextColInput.focus();
          nextColInput.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const input = e.currentTarget;
      if (input.value !== String(currentVal) && input.value !== '') {
        handleSaveNota(inscId, evaluacion, input.value, currentVal);
      }
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        const prevInput = document.getElementById(`grade-input-${prevRow}-${colIndex}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  const handleSaveRubrica = (inscripcion_materia_id: number, rubricaData: RubricaData, notaFinal: number) => {
    guardarNotaMutation.mutate({ 
      inscripcion_materia_id, 
      evaluacion: 'Apreciación Docente', 
      nota: notaFinal,
      rubrica: rubricaData.notas,
      observaciones: rubricaData.observaciones
    }, {
      onSuccess: () => {
        setRubricaOpenFor(null);
        queryClient.invalidateQueries({ queryKey: ['cursantesMateria', selectedMateria] });
        showToast('✓ Rúbrica y Apreciación Docente guardadas correctamente', 'success', 1800);
      }
    });
  };

  const getPlanillaData = () => {
    const materiaData = materias?.find((m: any) => m.materia_id === selectedMateria);
    const cursantesData = cursantes?.map((insc: any) => {
      const c = insc.inscripcion.cursante;
      const getNota = (ev: string) => {
        const cal = insc.calificaciones?.find((cal: any) => cal.evaluacion === ev);
        if (!cal || cal.nota === null || cal.nota === undefined) return null;
        return Number(Number(cal.nota).toFixed(2));
      };
      
      const p1 = getNota('1er Parcial');
      const p2 = getNota('2do Parcial');
      const fin = getNota('Examen Final');
      const apr = getNota('Apreciación Docente');
      
      const cal = insc.calificaciones?.find((cal: any) => cal.evaluacion === 'Apreciación Docente');

      return {
        grado: c.grado || '',
        nombre: c.nombre || '',
        apellido: c.apellido || '',
        notas: cal?.rubrica || {}, // Para docente
        p1, p2, fin, apr, // Para evaluador
        notaFinal: cal ? Number(Number(cal.nota).toFixed(2)) : null,
        obsGlobal: cal?.observaciones || ''
      };
    }) || [];

    return {
      tipoPlanilla: (user?.rol === 'DOCENTE' ? 'DOCENTE' : 'EVALUADOR') as 'DOCENTE' | 'EVALUADOR',
      docenteNombre: user ? `${user.nombre} ${user.apellido}` : '',
      asignatura: materiaData?.materia?.nombre || '',
      area: materiaData?.materia?.area?.nombre || '',
      fecha: new Date().toLocaleDateString('es-ES'),
      diplomado: materiaData?.materia?.diplomado?.nombre || 'DCEA',
      cursantes: cursantesData
    };
  };

  const handleExportarPDF = () => {
    generarPlanillaPDF(getPlanillaData());
  };

  const handleExportarExcel = () => {
    generarPlanillaExcel(getPlanillaData());
  };

  const handleImprimirIndividual = (
    inscripcion: any,
    notas: Record<number, number>,
    observaciones: string,
    notaFinal: number
  ) => {
    const materiaData = materias?.find((m: any) => m.materia_id === selectedMateria);
    const c = inscripcion.cursante;
    
    // Convertir Record<number, number> a Record<string, number>
    const notasStringKeys: Record<string, number> = {};
    Object.keys(notas).forEach(k => {
      notasStringKeys[k] = notas[Number(k)];
    });

    const cursanteData = {
      grado: c.grado || '',
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      notas: notasStringKeys,
      notaFinal,
      obsGlobal: observaciones
    };

    const data = {
      docenteNombre: user ? `${user.nombre} ${user.apellido}` : '',
      asignatura: materiaData?.materia?.nombre || '',
      area: materiaData?.materia?.area?.nombre || '',
      fecha: new Date().toLocaleDateString('es-ES'),
      diplomado: materiaData?.materia?.diplomado?.nombre || 'DCEA',
      cursantes: [cursanteData]
    };

    generarPlanillaPDF(data);
  };

  if (loadingMaterias) {
    return (
      <div className="h-52 flex items-center justify-center bg-white rounded-xl border border-slate-200">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#0f2942] border-t-transparent mr-3"></div>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Consultando asignaturas...</span>
      </div>
    );
  }

  const selectedMateriaObj = materias?.find((m: any) => m.materia_id === selectedMateria);

  return (
    <div className="space-y-5 relative pb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#0f2942]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942] block mb-0.5">
            Registro Oficial de Evaluaciones • ECEMA
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {selectedMateriaObj ? selectedMateriaObj.materia?.nombre : 'Planilla de Calificaciones'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {selectedMateriaObj
              ? `${selectedMateriaObj.materia?.diplomado?.nombre || ''} • Área: ${selectedMateriaObj.materia?.area?.nombre || 'General'}`
              : 'Seleccione una asignatura habilitada para gestionar las calificaciones de los cursantes.'}
          </p>
        </div>
        {selectedMateria && (
          <button 
            onClick={() => setSelectedMateria(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cambiar Asignatura
          </button>
        )}
      </div>

      {!selectedMateria ? (
        <div className="space-y-6">
          {materias?.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs font-medium">
              No registra asignaturas asignadas en el periodo vigente.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedMaterias).map(edicionKey => {
                const areasList = Object.keys(groupedMaterias[edicionKey]);
                const totalMateriasEdicion = areasList.reduce(
                  (acc, aKey) => acc + groupedMaterias[edicionKey][aKey].length,
                  0
                );

                // Paleta institucional sobria por índice de área (Naval, Teal, Ámbar, Azul Pizarra)
                const areaPalettes = [
                  {
                    topBorder: 'border-t-[#0f2942]',
                    hoverBorder: 'hover:border-[#0f2942]',
                    headerBg: 'bg-[#0f2942]/5 border-[#0f2942]/15',
                    headerDot: 'bg-[#0f2942]',
                    headerText: 'text-[#0f2942]',
                    iconBox: 'bg-[#0f2942]/10 text-[#0f2942] border-[#0f2942]/20 group-hover:bg-[#0f2942] group-hover:text-amber-300',
                    badge: 'bg-slate-100 text-[#0f2942] border-slate-200',
                    footerHover: 'group-hover:bg-[#0f2942] group-hover:text-white',
                    arrowHover: 'group-hover:text-amber-300',
                  },
                  {
                    topBorder: 'border-t-teal-700',
                    hoverBorder: 'hover:border-teal-700',
                    headerBg: 'bg-teal-50/80 border-teal-200/80',
                    headerDot: 'bg-teal-700',
                    headerText: 'text-teal-900',
                    iconBox: 'bg-teal-50 text-teal-700 border-teal-200 group-hover:bg-teal-700 group-hover:text-white',
                    badge: 'bg-teal-50 text-teal-800 border-teal-200',
                    footerHover: 'group-hover:bg-teal-800 group-hover:text-white',
                    arrowHover: 'group-hover:text-teal-200',
                  },
                  {
                    topBorder: 'border-t-amber-600',
                    hoverBorder: 'hover:border-amber-600',
                    headerBg: 'bg-amber-50/80 border-amber-200/80',
                    headerDot: 'bg-amber-600',
                    headerText: 'text-amber-900',
                    iconBox: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-600 group-hover:text-white',
                    badge: 'bg-amber-50 text-amber-800 border-amber-200',
                    footerHover: 'group-hover:bg-[#0f2942] group-hover:text-white',
                    arrowHover: 'group-hover:text-amber-300',
                  },
                  {
                    topBorder: 'border-t-sky-800',
                    hoverBorder: 'hover:border-sky-800',
                    headerBg: 'bg-sky-50/80 border-sky-200/80',
                    headerDot: 'bg-sky-800',
                    headerText: 'text-sky-900',
                    iconBox: 'bg-sky-50 text-sky-800 border-sky-200 group-hover:bg-sky-800 group-hover:text-white',
                    badge: 'bg-sky-50 text-sky-800 border-sky-200',
                    footerHover: 'group-hover:bg-sky-900 group-hover:text-white',
                    arrowHover: 'group-hover:text-amber-300',
                  },
                ];

                return (
                  <div key={edicionKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {/* Banner Institucional del Diplomado / Edición */}
                    <div className="bg-gradient-to-r from-[#0b192c] via-[#0f2942] to-[#163a5c] px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-widest block">
                            Programa Académico Habilitado
                          </span>
                          <h4 className="font-black text-white text-sm sm:text-base tracking-tight">
                            {edicionKey}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tabular-nums bg-white/10 text-slate-200 border border-white/15">
                          {areasList.length} {areasList.length === 1 ? 'Área' : 'Áreas'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tabular-nums bg-amber-400/15 text-amber-300 border border-amber-400/30">
                          {totalMateriasEdicion} Asignaturas
                        </span>
                      </div>
                    </div>

                    {/* Listado de Áreas y Tarjetas de Asignatura */}
                    <div className="p-5 sm:p-6 space-y-6 bg-slate-50/40">
                      {areasList.map((areaKey, areaIdx) => {
                        const palette = areaPalettes[areaIdx % areaPalettes.length];
                        const materiasArea = groupedMaterias[edicionKey][areaKey];

                        return (
                          <div key={areaKey} className="space-y-3.5">
                            {/* Cabecera del Área con color semántico */}
                            <div className={`px-3.5 py-2 rounded-lg border flex items-center justify-between ${palette.headerBg}`}>
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${palette.headerDot}`}></span>
                                <Layers className={`w-3.5 h-3.5 ${palette.headerText}`} />
                                <h5 className={`text-xs font-black uppercase tracking-wider ${palette.headerText}`}>
                                  {areaKey}
                                </h5>
                              </div>
                              <span className={`text-[11px] font-bold font-mono tabular-nums ${palette.headerText}`}>
                                {materiasArea.length} {materiasArea.length === 1 ? 'materia' : 'materias'}
                              </span>
                            </div>

                            {/* Grid de Tarjetas de Materia */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {materiasArea.map((dm: any, matIdx: number) => {
                                const siglaDiplomado = dm.materia?.diplomado?.nombre?.toUpperCase().includes('DCEMA')
                                  ? 'DCEMA'
                                  : dm.materia?.diplomado?.nombre?.toUpperCase().includes('DCEA')
                                  ? 'DCEA'
                                  : 'ECEMA';
                                const ordenNum = dm.materia?.orden || matIdx + 1;

                                return (
                                  <button
                                    key={dm.id}
                                    onClick={() => setSelectedMateria(dm.materia_id)}
                                    className={`text-left bg-white border border-slate-200/90 border-t-4 ${palette.topBorder} ${palette.hoverBorder} rounded-xl transition-all duration-150 group flex flex-col justify-between h-full shadow-xs hover:shadow-md overflow-hidden cursor-pointer`}
                                  >
                                    <div className="p-4 w-full">
                                      {/* Fila superior: Ícono + Badges de Orden y Sigla */}
                                      <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${palette.iconBox}`}>
                                          <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${palette.badge}`}>
                                            {siglaDiplomado}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tabular-nums bg-slate-100 text-slate-600 border border-slate-200">
                                            #{String(ordenNum).padStart(2, '0')}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Nombre de la Materia */}
                                      <h4 className="font-black text-sm text-slate-900 group-hover:text-[#0f2942] leading-snug line-clamp-2">
                                        {dm.materia.nombre}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                                        {dm.materia?.diplomado?.nombre || 'Asignatura Oficial'}
                                      </p>
                                    </div>

                                    {/* Pie de Acción con Contraste */}
                                    <div className={`w-full px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors ${palette.footerHover}`}>
                                      <span>Abrir planilla de acta</span>
                                      <ArrowRight className={`w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 ${palette.arrowHover}`} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Nómina de Cursantes</h3>
                  
                  {syncStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      Registrando nota...
                    </span>
                  )}
                  {syncStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      Guardado {lastSyncTime ? `(${lastSyncTime})` : ''}
                    </span>
                  )}
                  {syncStatus === 'idle' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-600 border border-slate-200">
                      <Check className="w-3 h-3 text-slate-400" />
                      Sincronización automática
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500">
                    {user?.rol === 'DOCENTE' 
                      ? 'Seleccione "Evaluar Rúbrica" para calificar la Apreciación Docente.'
                      : 'Escala de 0 a 100 puntos. Los cambios se guardan al cambiar de celda.'
                    }
                  </p>
                  {user?.rol !== 'DOCENTE' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Keyboard className="w-3 h-3 text-slate-400" />
                      <kbd className="px-1 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono font-bold">Enter</kbd> / <kbd className="px-1 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono font-bold">↓</kbd> siguiente fila
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={filtroCursante}
                    onChange={(e) => setFiltroCursante(e.target.value)}
                    placeholder="Filtrar cursante o CM..." 
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>

                {(user?.rol === 'DOCENTE' || user?.rol === 'EVALUADOR') && cursantes?.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportarPDF}
                      className="bg-[#0f2942] text-white px-3 py-1.5 text-xs rounded-lg font-semibold hover:bg-[#163a5c] flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF Oficial
                    </button>
                    <button 
                      onClick={handleExportarExcel}
                      className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 text-xs rounded-lg font-semibold hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                      Excel Oficial
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {loadingCursantes ? (
                <div className="flex items-center justify-center p-8 text-slate-500 text-xs font-medium gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0f2942]" />
                  Cargando nómina de cursantes...
                </div>
              ) : cursantes?.length === 0 ? (
                <p className="text-slate-500 p-8 text-center text-xs">No existen cursantes matriculados en esta asignatura.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-bold">Cursante</th>
                      {user?.rol !== 'DOCENTE' && (
                        <>
                          <th className="py-3 px-3 font-bold text-center w-28">1er Parcial <span className="text-slate-400 font-mono">(25%)</span></th>
                          <th className="py-3 px-3 font-bold text-center w-28">2do Parcial <span className="text-slate-400 font-mono">(25%)</span></th>
                          <th className="py-3 px-3 font-bold text-center w-28">Examen Final <span className="text-slate-400 font-mono">(40%)</span></th>
                        </>
                      )}
                      <th className="py-3 px-3 font-bold text-center w-36">Apreciación <span className="text-slate-400 font-mono">(10%)</span></th>
                      {user?.rol !== 'DOCENTE' && (
                        <th className="py-3 px-4 font-bold text-center w-28 bg-slate-200/50">Nota Final</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const lista = cursantes?.filter((insc: any) => {
                        if (!filtroCursante.trim()) return true;
                        const c = insc.inscripcion?.cursante || {};
                        const full = `${c.grado || ''} ${c.nombre || ''} ${c.apellido || ''} ${c.cm || ''}`.toLowerCase();
                        return full.includes(filtroCursante.toLowerCase());
                      }) || [];

                      if (lista.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                              No se encontraron cursantes que coincidan con la búsqueda.
                            </td>
                          </tr>
                        );
                      }

                      return lista.map((insc: any, rowIndex: number) => {
                        const cursante = insc.inscripcion.cursante;
                        const getNota = (evaluacion: string) => {
                          const cal = insc.calificaciones?.find((c: any) => c.evaluacion === evaluacion);
                          return cal ? cal.nota : '';
                        };
                        
                        const formatNotaDisplay = (val: any) => {
                          if (val === '' || val === null || val === undefined) return '';
                          const num = Number(val);
                          if (isNaN(num)) return '';
                          return Number(num.toFixed(2)).toString();
                        };

                        const p1 = formatNotaDisplay(getNota('1er Parcial'));
                        const p2 = formatNotaDisplay(getNota('2do Parcial'));
                        const fin = formatNotaDisplay(getNota('Examen Final'));
                        const apr = formatNotaDisplay(getNota('Apreciación Docente'));
                        
                        const allExist = p1 !== '' && p2 !== '' && fin !== '' && apr !== '';
                        const prom = allExist ? ((Number(p1) * 0.25) + (Number(p2) * 0.25) + (Number(fin) * 0.40) + (Number(apr) * 0.10)).toFixed(2) : '-';

                        const getCellClass = (evaluacion: string) => {
                          const key = `${insc.id}_${evaluacion}`;
                          if (savingCellKey === key) {
                            return 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 text-amber-900 font-bold';
                          }
                          if (savedCellKey === key) {
                            return 'border-teal-600 bg-teal-50 ring-2 ring-teal-200 text-teal-900 font-bold';
                          }
                          return 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#0f2942] focus:ring-2 focus:ring-[#0f2942]/15 text-slate-900 font-semibold';
                        };

                        return (
                          <tr key={insc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-900 text-xs">{cursante.grado ? `${cursante.grado} ` : ''}{cursante.nombre} {cursante.apellido}</div>
                              <div className="text-[10px] text-slate-500 font-mono">CM: {cursante.cm || 'S/N'}</div>
                            </td>
                            {user?.rol !== 'DOCENTE' && (
                              <>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="relative inline-block">
                                    <input 
                                      id={`grade-input-${rowIndex}-0`}
                                      type="number" 
                                      min="0"
                                      max="100"
                                      step="any"
                                      defaultValue={p1}
                                      key={`p1-${insc.id}`}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 0, insc.id, '1er Parcial', p1, lista.length)}
                                      onBlur={(e) => {
                                        if(e.target.value !== String(p1) && e.target.value !== '') {
                                          handleSaveNota(insc.id, '1er Parcial', e.target.value, p1);
                                        }
                                      }}
                                      disabled={user?.rol === 'DOCENTE'}
                                      className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border transition-all outline-none tabular-nums ${getCellClass('1er Parcial')} disabled:bg-slate-100`}
                                      placeholder="—"
                                    />
                                    {savedCellKey === `${insc.id}_1er Parcial` && (
                                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="relative inline-block">
                                    <input 
                                      id={`grade-input-${rowIndex}-1`}
                                      type="number" 
                                      min="0"
                                      max="100"
                                      step="any"
                                      defaultValue={p2}
                                      key={`p2-${insc.id}`}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 1, insc.id, '2do Parcial', p2, lista.length)}
                                      onBlur={(e) => {
                                        if(e.target.value !== String(p2) && e.target.value !== '') {
                                          handleSaveNota(insc.id, '2do Parcial', e.target.value, p2);
                                        }
                                      }}
                                      disabled={user?.rol === 'DOCENTE'}
                                      className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border transition-all outline-none tabular-nums ${getCellClass('2do Parcial')} disabled:bg-slate-100`}
                                      placeholder="—"
                                    />
                                    {savedCellKey === `${insc.id}_2do Parcial` && (
                                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="relative inline-block">
                                    <input 
                                      id={`grade-input-${rowIndex}-2`}
                                      type="number" 
                                      min="0"
                                      max="100"
                                      step="any"
                                      defaultValue={fin}
                                      key={`fin-${insc.id}`}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 2, insc.id, 'Examen Final', fin, lista.length)}
                                      onBlur={(e) => {
                                        if(e.target.value !== String(fin) && e.target.value !== '') {
                                          handleSaveNota(insc.id, 'Examen Final', e.target.value, fin);
                                        }
                                      }}
                                      disabled={user?.rol === 'DOCENTE'}
                                      className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border transition-all outline-none tabular-nums ${getCellClass('Examen Final')} disabled:bg-slate-100`}
                                      placeholder="—"
                                    />
                                    {savedCellKey === `${insc.id}_Examen Final` && (
                                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="py-2.5 px-3 text-center">
                              {user?.rol === 'DOCENTE' ? (
                                <button 
                                  onClick={() => setRubricaOpenFor(insc)}
                                  className={`text-xs px-3 py-1 rounded border font-semibold transition-colors ${apr !== '' ? 'bg-[#0f2942]/10 border-[#0f2942]/20 text-[#0f2942] hover:bg-[#0f2942]/15' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                >
                                  {apr !== '' ? `Editar Rúbrica (${apr})` : 'Evaluar Rúbrica'}
                                </button>
                              ) : (
                                <div className="relative inline-block">
                                  <input 
                                    id={`grade-input-${rowIndex}-3`}
                                    type="number" 
                                    step="any"
                                    defaultValue={apr}
                                    key={`apr-${insc.id}-${apr}`}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 3, insc.id, 'Apreciación Docente', apr, lista.length)}
                                    onBlur={(e) => {
                                      if(e.target.value !== String(apr) && e.target.value !== '') {
                                        handleSaveNota(insc.id, 'Apreciación Docente', e.target.value, apr);
                                      }
                                    }}
                                    disabled={user?.rol === 'EVALUADOR'}
                                    title={user?.rol === 'EVALUADOR' ? 'La apreciación docente es asignada mediante rúbrica por el Docente' : ''}
                                    className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border transition-all outline-none tabular-nums ${getCellClass('Apreciación Docente')} disabled:bg-slate-100 disabled:text-slate-600 font-semibold`}
                                    placeholder="—"
                                  />
                                </div>
                              )}
                            </td>
                            {user?.rol !== 'DOCENTE' && (
                              <td className="py-2.5 px-4 text-center font-mono font-bold bg-slate-50/60 tabular-nums">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  prom !== '-' && parseFloat(prom) >= 60 
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                                    : prom !== '-' 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'text-slate-400'
                                }`}>
                                  {prom}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {rubricaOpenFor && (
        (() => {
            const inscripcion = rubricaOpenFor;
            const calAnterior = inscripcion?.calificaciones?.find((c: any) => c.evaluacion === 'Apreciación Docente');
            
            let parsedRubrica = calAnterior?.rubrica;
            if (typeof parsedRubrica === 'string') {
              try { parsedRubrica = JSON.parse(parsedRubrica); } catch { /* ignore error */ }
            }

            return (
              <ModalRubrica
                isOpen={true}
                onClose={() => setRubricaOpenFor(null)}
                cursanteNombre={`${inscripcion?.inscripcion?.cursante?.apellido} ${inscripcion?.inscripcion?.cursante?.nombre}`}
                inscripcion_materia_id={inscripcion.id}
                rubricaAnterior={parsedRubrica}
                observacionesAnteriores={calAnterior?.observaciones}
                onSave={handleSaveRubrica}
                onImprimirOficial={(notas, observaciones, total) => 
                  handleImprimirIndividual(inscripcion.inscripcion, notas, observaciones, total)
                }
              />
            );
        })()
      )}
    </div>
  );
}
