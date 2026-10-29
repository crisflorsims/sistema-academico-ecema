import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { 
  UserPlus, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  X, 
  Edit, 
  Trash2, 
  GraduationCap, 
  Calendar, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

interface FilaExcelClasificada {
  fila: number;
  grado: string;
  nombre: string;
  apellido: string;
  ci: string;
  cm: string;
  email: string;
  telefono: string;
  promocion: string;
  estadoClasificacion: 'NUEVO' | 'EXISTENTE' | 'YA_MATRICULADO' | 'INVALIDO';
  mensaje: string;
}

export function Inscripciones() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de navegación y filtros de la tabla principal
  const [selectedDiplomadoId, setSelectedDiplomadoId] = useState<string>('TODOS');
  const [selectedEdicionId, setSelectedEdicionId] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  
  // Modales
  const [isModalMatricularOpen, setIsModalMatricularOpen] = useState(false);
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [isModalImportarOpen, setIsModalImportarOpen] = useState(false);
  const [editingInscripcion, setEditingInscripcion] = useState<any>(null);

  // Estados del modal de matriculación estándar
  const [targetEdicionId, setTargetEdicionId] = useState<string>('');
  const [busquedaModal, setBusquedaModal] = useState('');
  const [selectedCursanteIds, setSelectedCursanteIds] = useState<number[]>([]);

  // Estados del modal de Importación Masiva Excel (Flujo 2-en-1)
  const [targetEdicionImportarId, setTargetEdicionImportarId] = useState<string>('');
  const [filasExcel, setFilasExcel] = useState<FilaExcelClasificada[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Paginación de tabla
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // React Hook Form para edición individual
  const { register, handleSubmit, reset, setValue } = useForm();

  // 1. CARGA DE DATOS
  const { data: inscripciones = [], isLoading: loadingInscripciones } = useQuery({
    queryKey: ['inscripciones'],
    queryFn: async () => {
      const res = await api.get('/inscripciones');
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

  const { data: ediciones = [] } = useQuery({
    queryKey: ['ediciones'],
    queryFn: async () => {
      const res = await api.get('/ediciones');
      return res.data;
    }
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-cursantes'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.filter((u: any) => u.rol === 'CURSANTE');
    }
  });

  // Auto-seleccionar primera edición activa al cargar
  useEffect(() => {
    if (!selectedEdicionId && ediciones.length > 0) {
      const activa = ediciones.find((e: any) => e.estado === 'ABIERTO' || e.estado === 'EN_CURSO');
      if (activa) {
        setSelectedEdicionId(activa.id.toString());
      } else {
        setSelectedEdicionId('TODAS');
      }
    }
  }, [ediciones, selectedEdicionId]);

  // Ediciones filtradas por Diplomado seleccionado
  const edicionesDisponibles = useMemo(() => {
    if (selectedDiplomadoId === 'TODOS') return ediciones;
    return ediciones.filter((e: any) => e.diplomado_id.toString() === selectedDiplomadoId || e.diplomado?.id.toString() === selectedDiplomadoId);
  }, [ediciones, selectedDiplomadoId]);

  // Edición actualmente seleccionada en vista principal
  const edicionActual = useMemo(() => {
    if (selectedEdicionId === 'TODAS' || !selectedEdicionId) return null;
    return ediciones.find((e: any) => e.id.toString() === selectedEdicionId) || null;
  }, [ediciones, selectedEdicionId]);

  // Filtrado de la nómina principal
  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((ins: any) => {
      if (selectedDiplomadoId !== 'TODOS') {
        const dipId = (ins.edicion?.diplomado_id || ins.edicion?.diplomado?.id || '').toString();
        if (dipId !== selectedDiplomadoId) return false;
      }

      if (selectedEdicionId !== 'TODAS' && selectedEdicionId) {
        if (ins.edicion_id.toString() !== selectedEdicionId) return false;
      }

      if (filtroEstado && ins.estado !== filtroEstado) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const cur = ins.cursante || {};
        const nomCompleto = `${cur.grado || ''} ${cur.nombre || ''} ${cur.apellido || ''}`.toLowerCase();
        const ci = (cur.ci || '').toLowerCase();
        const cm = (cur.cm || '').toLowerCase();
        const email = (cur.email || '').toLowerCase();

        if (!nomCompleto.includes(q) && !ci.includes(q) && !cm.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [inscripciones, selectedDiplomadoId, selectedEdicionId, filtroEstado, busqueda]);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDiplomadoId, selectedEdicionId, filtroEstado, busqueda]);

  // Paginación
  const totalPages = Math.ceil((inscripcionesFiltradas.length || 0) / itemsPerPage) || 1;
  const paginatedInscripciones = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return inscripcionesFiltradas.slice(start, start + itemsPerPage);
  }, [inscripcionesFiltradas, currentPage, itemsPerPage]);

  // 2. MUTACIONES
  const createInscripcionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/inscripciones', data);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['ediciones'] });
      setIsModalMatricularOpen(false);
      setSelectedCursanteIds([]);
      setBusquedaModal('');
      showSuccess(data.message || 'Matrícula realizada exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al procesar la matrícula');
    }
  });

  const importarNominaMutation = useMutation({
    mutationFn: async (payload: { edicion_id: number; cursantes: any[] }) => {
      const res = await api.post('/inscripciones/importar-nomina', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['ediciones'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-cursantes'] });
      setIsModalImportarOpen(false);
      setFilasExcel([]);
      setNombreArchivo('');
      showSuccess(data.message || 'Nómina importada exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al importar la nómina');
    }
  });

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const res = await api.patch(`/inscripciones/${id}/estado`, { estado });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      showSuccess('Estado de matrícula actualizado');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al actualizar estado');
    }
  });

  const updateInscripcionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/inscripciones/${editingInscripcion.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      setIsModalEditarOpen(false);
      setEditingInscripcion(null);
      reset();
      showSuccess('Matrícula actualizada');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al actualizar matrícula');
    }
  });

  const deleteInscripcionMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inscripciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['ediciones'] });
      showSuccess('Matrícula eliminada exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al eliminar matrícula');
    }
  });

  // Manejo de eliminación
  const handleDelete = async (ins: any) => {
    const curNom = `${ins.cursante?.grado || ''} ${ins.cursante?.nombre || ''} ${ins.cursante?.apellido || ''}`.trim();
    const edicNom = `${ins.edicion?.diplomado?.nombre || 'este diplomado'}`;
    const confirmed = await showConfirmDelete(
      `la matrícula de ${curNom}`,
      `Se eliminará su registro de ${edicNom} y sus calificaciones asociadas.`
    );
    if (confirmed) {
      deleteInscripcionMutation.mutate(ins.id);
    }
  };

  // Abrir modal de matriculación estándar
  const openModalMatricular = () => {
    if (selectedEdicionId && selectedEdicionId !== 'TODAS') {
      setTargetEdicionId(selectedEdicionId);
    } else {
      const activa = ediciones.find((e: any) => e.estado === 'ABIERTO' || e.estado === 'EN_CURSO');
      setTargetEdicionId(activa ? activa.id.toString() : (ediciones[0]?.id?.toString() || ''));
    }
    setSelectedCursanteIds([]);
    setBusquedaModal('');
    setIsModalMatricularOpen(true);
  };

  // Abrir modal de importación masiva Excel
  const openModalImportar = () => {
    if (selectedEdicionId && selectedEdicionId !== 'TODAS') {
      setTargetEdicionImportarId(selectedEdicionId);
    } else {
      const activa = ediciones.find((e: any) => e.estado === 'ABIERTO' || e.estado === 'EN_CURSO');
      setTargetEdicionImportarId(activa ? activa.id.toString() : (ediciones[0]?.id?.toString() || ''));
    }
    setFilasExcel([]);
    setNombreArchivo('');
    setIsModalImportarOpen(true);
  };

  // Abrir modal de edición individual
  const openModalEditar = (ins: any) => {
    setEditingInscripcion(ins);
    setValue('edicion_id', ins.edicion_id);
    setValue('estado', ins.estado);
    setIsModalEditarOpen(true);
  };

  // Cursantes ya inscritos en la edición destino del modal estándar
  const idsCursantesInscritosEnTarget = useMemo(() => {
    if (!targetEdicionId) return new Set<number>();
    return new Set<number>(
      inscripciones
        .filter((ins: any) => ins.edicion_id.toString() === targetEdicionId)
        .map((ins: any) => ins.cursante_id)
    );
  }, [inscripciones, targetEdicionId]);

  // Cursantes disponibles para matricular
  const cursantesDisponiblesParaMatricular = useMemo(() => {
    return usuarios.filter((u: any) => !idsCursantesInscritosEnTarget.has(u.id));
  }, [usuarios, idsCursantesInscritosEnTarget]);

  // Cursantes filtrados en el modal estándar por búsqueda
  const cursantesFiltradosModal = useMemo(() => {
    if (!busquedaModal.trim()) return cursantesDisponiblesParaMatricular;
    const q = busquedaModal.toLowerCase().trim();
    return cursantesDisponiblesParaMatricular.filter((u: any) => {
      const full = `${u.grado || ''} ${u.nombre || ''} ${u.apellido || ''} ${u.ci || ''} ${u.cm || ''} ${u.email || ''}`.toLowerCase();
      return full.includes(q);
    });
  }, [cursantesDisponiblesParaMatricular, busquedaModal]);

  const toggleSelectCursante = (id: number) => {
    setSelectedCursanteIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisibles = () => {
    const visiblesIds = cursantesFiltradosModal.map((u: any) => u.id);
    const todosSeleccionados = visiblesIds.every((id: number) => selectedCursanteIds.includes(id));
    if (todosSeleccionados) {
      setSelectedCursanteIds(prev => prev.filter(id => !visiblesIds.includes(id)));
    } else {
      setSelectedCursanteIds(prev => Array.from(new Set([...prev, ...visiblesIds])));
    }
  };

  const submitMatriculacionLote = () => {
    if (!targetEdicionId) {
      showError('Debe seleccionar una edición de diplomado');
      return;
    }
    if (selectedCursanteIds.length === 0) {
      showError('Debe seleccionar al menos un cursante de la lista');
      return;
    }

    createInscripcionMutation.mutate({
      edicion_id: parseInt(targetEdicionId),
      cursante_ids: selectedCursanteIds
    });
  };

  // -------------------------------------------------------------
  // LÓGICA DE IMPORTACIÓN MASIVA EXCEL (FLUJO 2-EN-1)
  // -------------------------------------------------------------

  // Descargar plantilla Excel oficial
  const descargarPlantillaExcel = () => {
    const datosEjemplo = [
      {
        'GRADO': 'Cap.',
        'NOMBRE': 'Juan Carlos',
        'APELLIDO': 'Pérez Quispe',
        'CI': '4829102',
        'CODIGO_MILITAR': 'CM-48291',
        'EMAIL': 'juan.perez@mil.bo',
        'TELEFONO': '71234567',
        'PROMOCION': '2019'
      },
      {
        'GRADO': 'Tte.',
        'NOMBRE': 'Rodrigo',
        'APELLIDO': 'Vargas Mamani',
        'CI': '5938201',
        'CODIGO_MILITAR': 'CM-59382',
        'EMAIL': 'rodrigo.vargas@mil.bo',
        'TELEFONO': '72345678',
        'PROMOCION': '2021'
      },
      {
        'GRADO': 'My.',
        'NOMBRE': 'Alejandro',
        'APELLIDO': 'Flores Guzmán',
        'CI': '3948201',
        'CODIGO_MILITAR': 'CM-39482',
        'EMAIL': 'alejandro.flores@mil.bo',
        'TELEFONO': '73456789',
        'PROMOCION': '2016'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(datosEjemplo);
    ws['!cols'] = [
      { wch: 10 }, // GRADO
      { wch: 20 }, // NOMBRE
      { wch: 22 }, // APELLIDO
      { wch: 14 }, // CI
      { wch: 16 }, // CODIGO_MILITAR
      { wch: 28 }, // EMAIL
      { wch: 14 }, // TELEFONO
      { wch: 12 }, // PROMOCION
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nomina_Cursantes');
    XLSX.writeFile(wb, 'Plantilla_Nomina_Cursantes.xlsx');
  };

  // Procesamiento y normalización de filas Excel
  const procesarArchivoExcel = (file: File) => {
    setNombreArchivo(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          showError('El archivo Excel está vacío o no contiene filas con datos');
          return;
        }

        // Mapear y clasificar cada fila
        const clasificados: FilaExcelClasificada[] = rawRows.map((row, index) => {
          // Extraer campo buscando múltiples variantes de nombres de columna
          const getVal = (keys: string[]) => {
            for (const k of Object.keys(row)) {
              const cleanKey = k.trim().toUpperCase().replace(/[._-]/g, ' ');
              for (const target of keys) {
                if (cleanKey === target.toUpperCase()) {
                  return (row[k] !== undefined && row[k] !== null) ? String(row[k]).trim() : '';
                }
              }
            }
            return '';
          };

          const grado = getVal(['GRADO']);
          let nombre = getVal(['NOMBRE', 'NOMBRES']);
          let apellido = getVal(['APELLIDO', 'APELLIDOS', 'PATERNO', 'MATERNO']);

          if (!nombre && !apellido) {
            const nomCompleto = getVal(['NOMBRE COMPLETO', 'NOMBRES Y APELLIDOS', 'POSTULANTE', 'CURSANTE']);
            if (nomCompleto) {
              const parts = nomCompleto.split(' ');
              if (parts.length >= 2) {
                nombre = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
                apellido = parts.slice(Math.ceil(parts.length / 2)).join(' ');
              } else {
                nombre = nomCompleto;
              }
            }
          }

          const ci = getVal(['CI', 'C I', 'CARNET', 'CEDULA', 'DOCUMENTO']).replace(/[^0-9a-zA-Z]/g, '');
          const cm = getVal(['CODIGO MILITAR', 'CODIGO_MILITAR', 'CM', 'CODIGO', 'C M']);
          const email = getVal(['EMAIL', 'CORREO', 'CORREO ELECTRONICO', 'E MAIL']).toLowerCase();
          const telefono = getVal(['TELEFONO', 'CELULAR', 'TEL']);
          const promocion = getVal(['PROMOCION', 'PROMOCIÓN', 'AÑO']);

          // Validar si la fila tiene datos mínimos
          if (!nombre && !ci) {
            return {
              fila: index + 2, // Fila en Excel considerando cabecera
              grado, nombre, apellido, ci, cm, email, telefono, promocion,
              estadoClasificacion: 'INVALIDO',
              mensaje: 'Fila incompleta: requiere al menos Nombre o CI'
            };
          }

          // Clasificar contra la base de datos actual
          // 1. ¿Existe el usuario en el sistema?
          const usuarioExistente = usuarios.find((u: any) => 
            (ci && u.ci && u.ci.toString().trim() === ci) ||
            (cm && u.cm && u.cm.toString().trim().toUpperCase() === cm.toUpperCase()) ||
            (email && u.email && u.email.toLowerCase() === email)
          );

          if (usuarioExistente) {
            // 2. ¿Ya está matriculado en la edición destino?
            const yaMatriculado = inscripciones.some((ins: any) => 
              ins.edicion_id.toString() === targetEdicionImportarId &&
              ins.cursante_id === usuarioExistente.id
            );

            if (yaMatriculado) {
              return {
                fila: index + 2,
                grado: usuarioExistente.grado || grado,
                nombre: usuarioExistente.nombre || nombre,
                apellido: usuarioExistente.apellido || apellido,
                ci: usuarioExistente.ci || ci,
                cm: usuarioExistente.cm || cm,
                email: usuarioExistente.email || email,
                telefono: usuarioExistente.telefono || telefono,
                promocion: usuarioExistente.promocion || promocion,
                estadoClasificacion: 'YA_MATRICULADO',
                mensaje: 'Ya matriculado en este diplomado (se omitirá)'
              };
            }

            return {
              fila: index + 2,
              grado: usuarioExistente.grado || grado,
              nombre: usuarioExistente.nombre || nombre,
              apellido: usuarioExistente.apellido || apellido,
              ci: usuarioExistente.ci || ci,
              cm: usuarioExistente.cm || cm,
              email: usuarioExistente.email || email,
              telefono: usuarioExistente.telefono || telefono,
              promocion: usuarioExistente.promocion || promocion,
              estadoClasificacion: 'EXISTENTE',
              mensaje: 'Cursante existente (se matriculará a esta edición)'
            };
          }

          // 3. Es un nuevo cursante
          return {
            fila: index + 2,
            grado, nombre, apellido, ci, cm, email, telefono, promocion,
            estadoClasificacion: 'NUEVO',
            mensaje: 'Nuevo cursante (se creará cuenta y se matriculará)'
          };
        });

        setFilasExcel(clasificados);
      } catch (err) {
        console.error(err);
        showError('No se pudo leer el archivo Excel. Asegúrate de que sea un archivo válido (.xlsx o .xls).');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivoExcel(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivoExcel(file);
    }
  };

  // Re-clasificar cuando el usuario cambia la edición destino en el modal
  useEffect(() => {
    if (filasExcel.length > 0 && targetEdicionImportarId) {
      setFilasExcel(prev => prev.map(fila => {
        if (fila.estadoClasificacion === 'INVALIDO') return fila;

        const usuarioExistente = usuarios.find((u: any) => 
          (fila.ci && u.ci && u.ci.toString().trim() === fila.ci) ||
          (fila.cm && u.cm && u.cm.toString().trim().toUpperCase() === fila.cm.toUpperCase()) ||
          (fila.email && u.email && u.email.toLowerCase() === fila.email)
        );

        if (usuarioExistente) {
          const yaMatriculado = inscripciones.some((ins: any) => 
            ins.edicion_id.toString() === targetEdicionImportarId &&
            ins.cursante_id === usuarioExistente.id
          );

          if (yaMatriculado) {
            return {
              ...fila,
              estadoClasificacion: 'YA_MATRICULADO',
              mensaje: 'Ya matriculado en este diplomado (se omitirá)'
            };
          }

          return {
            ...fila,
            estadoClasificacion: 'EXISTENTE',
            mensaje: 'Cursante existente (se matriculará a esta edición)'
          };
        }

        return {
          ...fila,
          estadoClasificacion: 'NUEVO',
          mensaje: 'Nuevo cursante (se creará cuenta y se matriculará)'
        };
      }));
    }
  }, [targetEdicionImportarId, inscripciones, usuarios]);

  // Conteos de la importación
  const statsExcel = useMemo(() => {
    const total = filasExcel.length;
    const nuevos = filasExcel.filter(f => f.estadoClasificacion === 'NUEVO').length;
    const existentes = filasExcel.filter(f => f.estadoClasificacion === 'EXISTENTE').length;
    const yaMatriculados = filasExcel.filter(f => f.estadoClasificacion === 'YA_MATRICULADO').length;
    const invalidos = filasExcel.filter(f => f.estadoClasificacion === 'INVALIDO').length;
    const listosParaProcesar = nuevos + existentes;

    return { total, nuevos, existentes, yaMatriculados, invalidos, listosParaProcesar };
  }, [filasExcel]);

  const confirmarImportacionExcel = () => {
    if (!targetEdicionImportarId) {
      showError('Debe seleccionar la edición de diplomado destino');
      return;
    }

    const validos = filasExcel.filter(f => f.estadoClasificacion === 'NUEVO' || f.estadoClasificacion === 'EXISTENTE');
    if (validos.length === 0) {
      showError('No hay cursantes válidos o pendientes para matricular en el archivo');
      return;
    }

    importarNominaMutation.mutate({
      edicion_id: parseInt(targetEdicionImportarId),
      cursantes: validos.map(f => ({
        grado: f.grado,
        nombre: f.nombre,
        apellido: f.apellido,
        ci: f.ci,
        cm: f.cm,
        email: f.email,
        telefono: f.telefono,
        promocion: f.promocion
      }))
    });
  };

  const submitEdicionIndividual = (data: any) => {
    updateInscripcionMutation.mutate(data);
  };

  const formatFecha = (dateString: string | null) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • Registro y Admisión
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Control de Matrículas y Nóminas
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
              Académico
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administración de nóminas oficiales por programa académico, matriculación por lote y seguimiento de situación.
          </p>
        </div>

        {/* Acciones Superiores: Matricular Directo o Importar Excel */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={openModalImportar}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Importar Nómina (Excel)</span>
          </button>

          <button 
            onClick={openModalMatricular}
            className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Matricular Cursantes</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE SELECCIÓN DE ÁMBITO (FOCO EN EDICIÓN / DIPLOMADO) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Selectores Superiores de Diplomado y Edición */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Selector de Diplomado */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#0f2942]" />
              <span>Programa de Diplomado</span>
            </label>
            <div className="relative">
              <select
                value={selectedDiplomadoId}
                onChange={(e) => {
                  setSelectedDiplomadoId(e.target.value);
                  setSelectedEdicionId('TODAS');
                }}
                className="w-full pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer appearance-none"
              >
                <option value="TODOS">Todos los Programas de Diplomado</option>
                {diplomados.map((d: any) => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.nombre} ({d.tipo})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Selector de Edición / Periodo */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0f2942]" />
              <span>Gestión / Edición del Curso</span>
            </label>
            <div className="relative">
              <select
                value={selectedEdicionId}
                onChange={(e) => setSelectedEdicionId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer appearance-none"
              >
                <option value="TODAS">Todas las Ediciones / Cursos Registrados</option>
                {edicionesDisponibles.map((e: any) => (
                  <option key={e.id} value={e.id.toString()}>
                    {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(Semestre ${e.periodo.semestre})` : ''} [{e.estado}]
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Contador de Nómina Rápido */}
          <div className="md:col-span-2 flex flex-col justify-end pt-1 md:pt-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-right md:text-left">
              Efectivos en Nómina
            </span>
            <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Inscritos:</span>
              <span className="text-sm font-mono tabular-nums font-bold text-[#0f2942]">
                {inscripcionesFiltradas.length}
              </span>
            </div>
          </div>

        </div>

        {/* Resumen Contextual del Curso Seleccionado */}
        {edicionActual && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                {edicionActual.diplomado?.nombre}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-semibold text-slate-600">
                Gestión {edicionActual.periodo?.gestion} {edicionActual.periodo?.semestre ? `(Sem. ${edicionActual.periodo?.semestre})` : ''}
              </span>
              <span className="text-slate-300">•</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                edicionActual.estado === 'ABIERTO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                edicionActual.estado === 'EN_CURSO' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {edicionActual.estado}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={openModalImportar}
                className="text-slate-700 hover:text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                <span>Importar Excel a este curso</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={openModalMatricular}
                className="text-[#0f2942] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Matricular cursantes</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. FILTROS Y BÚSQUEDA DE LA NÓMINA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Buscador de Cursantes */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, CI o Código Militar (CM)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Estado de Matrícula */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="EGRESADO">EGRESADO</option>
            <option value="ABANDONO">ABANDONO</option>
          </select>

          {(busqueda || filtroEstado) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Restablecer filtros"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* 4. NÓMINA OFICIAL (TABLA INSTITUCIONAL) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loadingInscripciones ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0f2942]" />
            <span className="text-xs font-bold">Cargando nómina oficial de matriculados...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Cursante
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Programa y Gestión
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Asignaturas
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Fecha Matrícula
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Situación
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedInscripciones.map((ins: any) => {
                  const cur = ins.cursante || {};
                  const ed = ins.edicion || {};
                  const dip = ed.diplomado || {};
                  const per = ed.periodo || {};

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Cursante con Grado Militar, CI y CM */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0f2942] font-bold flex items-center justify-center text-xs border border-slate-200">
                            {cur.grado || cur.nombre?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              {cur.grado && (
                                <span className="text-[10px] font-bold text-[#0f2942] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {cur.grado}
                                </span>
                              )}
                              <span>{cur.nombre} {cur.apellido}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono tabular-nums">
                              <span>CI: {cur.ci || 'S/N'}</span>
                              {cur.cm && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>CM: {cur.cm}</span>
                                </>
                              )}
                              {cur.email && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-sans text-slate-400">{cur.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Diplomado y Periodo */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900">
                          {dip.nombre || 'Diplomado sin asignar'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono tabular-nums">
                          <span className="font-semibold text-slate-700">Gestión {per.gestion || '-'}</span>
                          {per.semestre && <span>(Semestre {per.semestre})</span>}
                          {ed.estado && (
                            <span className={`font-sans text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              ed.estado === 'ABIERTO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                              ed.estado === 'EN_CURSO' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {ed.estado}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cantidad de Materias */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          <BookOpen className="w-3 h-3 text-[#0f2942]" />
                          <span>{ins._count?.materias || 0} asig.</span>
                        </span>
                      </td>

                      {/* Fecha de Inscripción */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600 font-mono tabular-nums font-medium">
                        {formatFecha(ins.fecha_inscripcion)}
                      </td>

                      {/* Selector Rápido de Estado */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <select
                          value={ins.estado}
                          onChange={(e) => updateEstadoMutation.mutate({ id: ins.id, estado: e.target.value })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded border outline-none cursor-pointer transition-colors ${
                            ins.estado === 'ACTIVO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                            ins.estado === 'EGRESADO' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="EGRESADO">EGRESADO</option>
                          <option value="ABANDONO">ABANDONO</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModalEditar(ins)}
                            className="p-1.5 text-slate-500 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Matrícula"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ins)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Matrícula"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {paginatedInscripciones.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No se encontraron cursantes</h4>
                        <p className="text-xs text-slate-500 text-center">
                          {selectedEdicionId !== 'TODAS'
                            ? 'Aún no hay cursantes matriculados en esta edición de diplomado.'
                            : 'No hay registros que coincidan con los filtros seleccionados.'}
                        </p>
                        {selectedEdicionId !== 'TODAS' && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={openModalImportar}
                              className="text-xs font-bold text-slate-800 hover:bg-slate-200 bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                              <span>Importar Excel</span>
                            </button>
                            <button
                              onClick={openModalMatricular}
                              className="text-xs font-bold text-white bg-[#0f2942] hover:bg-[#163a5c] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              + Matricular manual
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación Inferior */}
        {!loadingInscripciones && inscripcionesFiltradas.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <span className="font-mono tabular-nums font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-mono tabular-nums font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, inscripcionesFiltradas.length)}
              </span>{' '}
              de <span className="font-mono tabular-nums font-bold text-slate-800">{inscripcionesFiltradas.length}</span> cursantes
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="px-2 text-xs font-mono tabular-nums font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL DE IMPORTACIÓN MASIVA EXCEL (MÉTODO A - FLUJO 2-EN-1) */}
      {isModalImportarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0f2942] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-300 border border-white/15 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-tight">
                      Importar Nómina de Cursantes desde Excel
                    </h3>
                    <span className="bg-white/10 text-amber-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-white/15">
                      Flujo 2-en-1
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Da de alta automáticamente a cursantes nuevos y matricula a la edición seleccionada en un solo paso.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalImportarOpen(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/40">
              
              {/* Fila Superior: Selección de Edición y Botón Descargar Plantilla */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                
                {/* Selector de Edición Destino */}
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0f2942]" />
                    <span>Edición de Diplomado Destino</span>
                  </label>
                  <div className="relative">
                    <select
                      value={targetEdicionImportarId}
                      onChange={(e) => setTargetEdicionImportarId(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Seleccione el diplomado y periodo de destino...</option>
                      {ediciones.map((e: any) => (
                        <option key={e.id} value={e.id.toString()}>
                          {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(Sem. ${e.periodo.semestre})` : ''} [{e.estado}]
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Botón Descargar Plantilla */}
                <div className="md:col-span-4">
                  <button
                    type="button"
                    onClick={descargarPlantillaExcel}
                    className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-teal-700" />
                    <span>Descargar Plantilla Oficial (.xlsx)</span>
                  </button>
                </div>

              </div>

              {/* Zona de Carga / Drag & Drop */}
              {filasExcel.length === 0 ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging 
                      ? 'border-[#0f2942] bg-slate-100/50 scale-[0.99]' 
                      : 'border-slate-300 hover:border-[#0f2942] bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0f2942] flex items-center justify-center shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Arrastre su archivo Excel aquí o haga clic para seleccionarlo
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Formatos compatibles: <span className="font-bold text-slate-700">.xlsx, .xls, .csv</span>. Columnas: GRADO, NOMBRE, APELLIDO, CI, CODIGO_MILITAR, EMAIL, TELEFONO.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#0f2942] bg-slate-100 px-3 py-1 rounded border border-slate-200">
                    Examinar archivo en su equipo
                  </span>
                </div>
              ) : (
                /* Vista Previa y Clasificación de Datos */
                <div className="space-y-3">
                  
                  {/* Resumen del Archivo Cargado */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{nombreArchivo}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {statsExcel.total} filas leídas en el documento
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilasExcel([]);
                          setNombreArchivo('');
                        }}
                        className="text-xs font-bold text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cambiar archivo</span>
                      </button>
                    </div>
                  </div>

                  {/* Píldoras de Estadísticas del Flujo 2-en-1 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    
                    <div className="bg-teal-50/80 border border-teal-200 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Nuevos a Crear</span>
                      <div className="text-lg font-black font-mono tabular-nums text-teal-700 mt-0.5">{statsExcel.nuevos}</div>
                      <span className="text-[10px] text-teal-700 font-medium">Se creará cuenta de cursante</span>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-[#0f2942] uppercase tracking-wider block">Existentes a Matricular</span>
                      <div className="text-lg font-black font-mono tabular-nums text-[#0f2942] mt-0.5">{statsExcel.existentes}</div>
                      <span className="text-[10px] text-slate-600 font-medium">Ya registrados en sistema</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Ya Matriculados</span>
                      <div className="text-lg font-black font-mono tabular-nums text-slate-500 mt-0.5">{statsExcel.yaMatriculados}</div>
                      <span className="text-[10px] text-slate-400 font-medium">Se omitirán automáticamente</span>
                    </div>

                    <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Listos para Procesar</span>
                      <div className="text-lg font-black font-mono tabular-nums text-amber-700 mt-0.5">{statsExcel.listosParaProcesar}</div>
                      <span className="text-[10px] text-amber-700 font-medium">Total que se matricularán</span>
                    </div>

                  </div>

                  {/* Tabla de Vista Previa */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-72 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-3.5 py-2.5 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Fila</th>
                          <th className="px-3.5 py-2.5 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Grado y Cursante</th>
                          <th className="px-3.5 py-2.5 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">CI / CM</th>
                          <th className="px-3.5 py-2.5 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Email</th>
                          <th className="px-3.5 py-2.5 text-center font-bold text-slate-600 uppercase tracking-wider text-[10px]">Acción a Realizar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filasExcel.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-3.5 py-2 text-slate-400 font-mono tabular-nums text-[11px]">#{f.fila}</td>
                            <td className="px-3.5 py-2 font-bold text-slate-900">
                              <span className="text-[#0f2942] bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[10px] mr-1.5">
                                {f.grado || 'S/G'}
                              </span>
                              <span>{f.nombre} {f.apellido}</span>
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 font-mono tabular-nums">
                              <span>{f.ci || 'Sin CI'}</span>
                              {f.cm && <span className="text-slate-400 text-[10px] ml-1">({f.cm})</span>}
                            </td>
                            <td className="px-3.5 py-2 text-slate-500 text-[11px]">
                              {f.email || <span className="italic text-slate-400">Autogenerado por CI</span>}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              {f.estadoClasificacion === 'NUEVO' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                  <UserPlus className="w-3 h-3" />
                                  <span>Crear y Matricular</span>
                                </span>
                              )}
                              {f.estadoClasificacion === 'EXISTENTE' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0f2942] border border-slate-300">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Matricular Directo</span>
                                </span>
                              )}
                              {f.estadoClasificacion === 'YA_MATRICULADO' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                  <CheckCircle2 className="w-3 h-3 text-slate-400" />
                                  <span>Ya Matriculado (Omitir)</span>
                                </span>
                              )}
                              {f.estadoClasificacion === 'INVALIDO' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Incompleto</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Aviso de Contraseña Inicial */}
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-[#0f2942] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#0f2942]">Contraseñas iniciales automáticas:</span> Para los cursantes nuevos que se den de alta, su contraseña de acceso inicial será su número de <span className="font-bold underline">CI</span> (o <span className="font-mono">Cursante.2026</span> si no tiene CI). Podrán cambiarla en su primer inicio de sesión.
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-500">
                {filasExcel.length > 0 ? (
                  <span>
                    Se matricularán <span className="font-bold font-mono tabular-nums text-[#0f2942]">{statsExcel.listosParaProcesar}</span> cursantes en este diplomado.
                  </span>
                ) : (
                  <span>Seleccione el diplomado y suba su archivo Excel para continuar.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalImportarOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                {filasExcel.length > 0 && (
                  <button
                    type="button"
                    onClick={confirmarImportacionExcel}
                    disabled={importarNominaMutation.isPending || statsExcel.listosParaProcesar === 0 || !targetEdicionImportarId}
                    className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {importarNominaMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Procesando nómina...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar e Importar ({statsExcel.listosParaProcesar} Cursantes)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL DE MATRICULACIÓN ESTÁNDAR (POR LISTA DE CURSANTES) */}
      {isModalMatricularOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0f2942] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-300 border border-white/15 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Matricular Cursantes al Diplomado
                  </h3>
                  <p className="text-xs text-slate-300">
                    Seleccione el curso destino y los cursantes que conformarán la nómina oficial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalMatricularOpen(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal con Scroll */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Selección de Edición Destino */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0f2942]" />
                  <span>Edición de Diplomado Destino</span>
                </label>
                <div className="relative">
                  <select
                    value={targetEdicionId}
                    onChange={(e) => {
                      setTargetEdicionId(e.target.value);
                      setSelectedCursanteIds([]);
                    }}
                    className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Seleccione el curso de diplomado...</option>
                    {ediciones.map((e: any) => (
                      <option key={e.id} value={e.id.toString()}>
                        {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(Sem. ${e.periodo.semestre})` : ''} [{e.estado}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Buscador de Cursantes Disponibles */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0f2942]" />
                    <span>Seleccionar Cursantes Disponibles</span>
                    <span className="text-[#0f2942] font-mono tabular-nums font-bold">({cursantesDisponiblesParaMatricular.length})</span>
                  </label>

                  {cursantesFiltradosModal.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllVisibles}
                      className="text-xs font-bold text-[#0f2942] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {cursantesFiltradosModal.every((u: any) => selectedCursanteIds.includes(u.id)) ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Deseleccionar visibles</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Seleccionar todos visibles</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre, grado militar, CI o CM..."
                    value={busquedaModal}
                    onChange={(e) => setBusquedaModal(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all"
                  />
                  {busquedaModal && (
                    <button
                      onClick={() => setBusquedaModal('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista Seleccionable de Cursantes */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white">
                {cursantesFiltradosModal.map((u: any) => {
                  const isSelected = selectedCursanteIds.includes(u.id);

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectCursante(u.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#0f2942] text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckSquare className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {u.grado && (
                              <span className="text-[10px] font-bold text-[#0f2942] bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                {u.grado}
                              </span>
                            )}
                            <span>{u.nombre} {u.apellido}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                            CI: {u.ci || 'S/N'} {u.cm ? `• CM: ${u.cm}` : ''} {u.email ? `• ${u.email}` : ''}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isSelected ? 'text-[#0f2942] bg-white border-slate-300' : 'text-slate-400 border-transparent'
                      }`}>
                        {isSelected ? 'Seleccionado' : 'Disponible'}
                      </span>
                    </div>
                  );
                })}

                {cursantesFiltradosModal.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    {cursantesDisponiblesParaMatricular.length === 0
                      ? 'Todos los cursantes registrados ya están matriculados en esta edición.'
                      : 'No se encontraron cursantes disponibles con ese criterio de búsqueda.'}
                  </div>
                )}
              </div>

              {/* Aviso Automático del Sistema */}
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#0f2942] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#0f2942]">Asignación automática de materias:</span> Al matricular, el sistema creará automáticamente la lista de materias correspondiente al plan de estudios del diplomado.
                </div>
              </div>

            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-500">
                <span className="font-bold font-mono tabular-nums text-[#0f2942]">{selectedCursanteIds.length}</span> cursante(s) seleccionado(s)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalMatricularOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitMatriculacionLote}
                  disabled={createInscripcionMutation.isPending || selectedCursanteIds.length === 0 || !targetEdicionId}
                  className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {createInscripcionMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Matriculando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Matricular ({selectedCursanteIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. MODAL DE EDICIÓN INDIVIDUAL (CORRECCIÓN / CAMBIO DE CURSO) */}
      {isModalEditarOpen && editingInscripcion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0f2942] text-white">
              <div>
                <h3 className="text-sm font-black tracking-tight">Editar Matrícula</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {editingInscripcion.cursante?.grado} {editingInscripcion.cursante?.nombre} {editingInscripcion.cursante?.apellido}
                </p>
              </div>
              <button
                onClick={() => setIsModalEditarOpen(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(submitEdicionIndividual)} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Edición / Diplomado Asignado
                </label>
                <select
                  {...register('edicion_id', { required: true })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] cursor-pointer"
                >
                  {ediciones.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.diplomado?.nombre} - Gestión {e.periodo?.gestion} {e.periodo?.semestre ? `(S${e.periodo.semestre})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estado de Matrícula
                </label>
                <select
                  {...register('estado', { required: true })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] cursor-pointer"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="EGRESADO">EGRESADO</option>
                  <option value="ABANDONO">ABANDONO</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Cambiar la edición no modificará las notas existentes en caso de que ya hayan sido registradas.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalEditarOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateInscripcionMutation.isPending}
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updateInscripcionMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
