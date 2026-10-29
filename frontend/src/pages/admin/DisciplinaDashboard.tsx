import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Edit, 
  Trash2, 
  FileText, 
  ClipboardList, 
  GraduationCap, 
  AlertTriangle, 
  Users, 
  Search, 
  Plus, 
  Printer, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Filter, 
  X,
  ExternalLink
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

const getNowDateTimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const CATEGORIAS_FALTAS = [
  {
    grupo: 'LEVE_3',
    label: 'Faltas Leves - Grupo 1 (3 pts)',
    pts: 3,
    faltas: [
      { id: '1', desc: 'No cumplir las instrucciones durante las actividades académicas.' },
      { id: '2', desc: 'Atrasos injustificados.' },
      { id: '3', desc: 'Salir del aula sin autorización.' },
      { id: '4', desc: 'Ocupar en el aula una mesa de trabajo distinta a la asignada.' },
      { id: '5', desc: 'No devolver los libros a la biblioteca en el plazo previsto.' },
      { id: '6', desc: 'Falta de cooperación en los trabajos de grupo.' },
      { id: '7', desc: 'Falta de espíritu deportivo.' },
      { id: '8', desc: 'Descuidado con el uniforme.' },
      { id: '9', desc: 'Varones: Tipo militar, empleándose como máximo la máquina Nº 1,5 por los costados y la parte de atrás, y gradualmente más largo hacia adelante y arriba, no sobrepasando los 3 cm., con patillas al nivel medio de la oreja, sin barba, bigote de corte recto que no sobrepase la comisura de los labios.' },
      { id: '10', desc: 'Damas: Peinado sobrio "no melenas debajo del cuello del uniforme", tinte de color natural, sujetadores permitidos, redes de color natural sin adornos para moños.' },
      { id: '11', desc: 'Retraso en la entrega de la documentación requerida.' },
      { id: '12', desc: 'Para las damas: Utilizar aretes sobrios, pintado de uñas con colores enteros y homogéneos.' },
      { id: '13', desc: 'Falta de prolijidad en la presentación de exámenes y trabajos de investigación.' },
      { id: '14', desc: 'Utilizar documentos o material de consulta ajenos a la materia que se está desarrollando.' },
      { id: '15', desc: 'Incumplimiento de funciones como Jefe de Grupo de Trabajo.' },
      { id: '16', desc: 'Mala conservación del material de Instrucción entregado por la ECEMA.' },
      { id: '17', desc: 'No respetar la opinión del camarada durante el desarrollo de clases.' },
      { id: '18', desc: 'Ocultar pertenencias del camarada durante el desarrollo de clases y fuera de las mismas.' },
      { id: '19', desc: 'Falta de camaradería.' },
      { id: '20', desc: 'No llevar el marbete de identificación.' },
      { id: '21', desc: 'Ingresar a áreas restringidas, sin la autorización correspondiente.' },
      { id: '22', desc: 'No colocar correctamente los datos requeridos en los exámenes.' },
      { id: '23', desc: 'No contar con la documentación actualizada (Carnet Militar, COSSMIL, C. I., Brevet, SOAT, etc.)' },
      { id: '24', desc: 'Consumir alimentos en lugares no establecidos (excepto Casino).' },
      { id: '25', desc: 'Fumar en lugares no autorizados.' },
      { id: '26', desc: 'Estacionar su vehículo en espacio no autorizado.' }
    ]
  },
  {
    grupo: 'LEVE_5',
    label: 'Faltas Leves - Grupo 1 (5 pts)',
    pts: 5,
    faltas: [
      { id: '1', desc: 'Hacer observaciones infundadas a los docentes.' },
      { id: '2', desc: 'Murmurar contra el Régimen Interno o cualquier otro aspecto.' },
      { id: '3', desc: 'Reclamar calificaciones sin fundamento.' },
      { id: '4', desc: 'Presentar durante los exámenes, bolígrafos y otros no autorizados.' },
      { id: '5', desc: 'Pedir prórroga para la entrega de trabajos o cancelación de exámenes.' },
      { id: '6', desc: 'Propagar rumores.' },
      { id: '7', desc: 'Dormitar durante el desarrollo de clases.' },
      { id: '8', desc: 'Ingresar a lugares no autorizados para los Cursantes.' },
      { id: '9', desc: 'Incumplimiento de funciones como encargado de curso u oficial de servicio.' },
      { id: '10', desc: 'Inasistencia injustificada a clases (por cada periodo académico).' },
      { id: '11', desc: 'No asistir a las actividades programadas.' },
      { id: '12', desc: 'Promover desordenes en cualquier tarea asignada.' },
      { id: '13', desc: 'Expresarse con lenguaje o realizar movimientos o gestos obscenos.' },
      { id: '14', desc: 'Emplear sin autorización, al personal de Servicio o de Guardia en asuntos particulares o personales.' },
      { id: '15', desc: 'Falta de consideración con el personal de Planta y Docente.' },
      { id: '16', desc: 'Uso de teléfono celular en clases u otras actividades programadas.' },
      { id: '17', desc: 'Uso indebido de las computadoras asignadas.' },
      { id: '18', desc: 'Agredir verbalmente a un camarada.' },
      { id: '19', desc: 'Asistir a la ECEMA fuera de horario, con el vestuario inadecuado (Pantalón corto, chinelas).' }
    ]
  },
  {
    grupo: 'GRAVE_10',
    label: 'Faltas Graves - Grupo 2 (10 pts)',
    pts: 10,
    faltas: [
      { id: '1', desc: 'Abandono, destrucción o deterioro premeditado de prendas, útiles o materiales del instituto.' },
      { id: '2', desc: 'Fingir enfermedades como excusa.' },
      { id: '3', desc: 'No cancelar en plazo prudente sus obligaciones económicas.' },
      { id: '4', desc: 'Ser cómplice o encubridor de plagios en la presentación de tareas asignadas.' },
      { id: '5', desc: 'Formular reclamos de exámenes verbalmente al Docente y no presentar su reclamo por escrito.' },
      { id: '6', desc: 'Tratar de sorprender y abusar de la buena fe de un superior, realizando reclamos infundados.' },
      { id: '7', desc: 'Interferir el Plan de Llamadas, obstaculizando su flujo, no llamando a quienes le corresponda hacerlo.' },
      { id: '8', desc: 'Descuidado con el material y documentación clasificada.' }
    ]
  },
  {
    grupo: 'GRAVE_15',
    label: 'Faltas Graves - Grupo 2 (15 pts)',
    pts: 15,
    faltas: [
      { id: '1', desc: 'Dar información falsa o incompleta, respecto a su domicilio, teléfonos y otros.' },
      { id: '2', desc: 'Acceder a la documentación e información magnética del Docente, sin la autorización respectiva.' },
      { id: '3', desc: 'No presentarse oportunamente a acuartelamientos o llamadas de emergencia.' },
      { id: '4', desc: 'Sobrepasar su licencia, vacación o permiso sin causal justificada.' },
      { id: '5', desc: 'Realizar intervenciones airadas en clase.' },
      { id: '6', desc: 'Falta de respeto con el personal de Planta y Docente.' }
    ]
  },
  {
    grupo: 'GRAVE_20',
    label: 'Faltas Graves - Grupo 2 (20 pts)',
    pts: 20,
    faltas: [
      { id: '1', desc: 'Insinuar que el docente proporcione preguntas de evaluación.' },
      { id: '2', desc: 'Realizar llamadas telefónicas al personal docente y de planta sin autorización.' },
      { id: '3', desc: 'Efectuar representaciones mal intencionadas, tratando de buscar confrontación entre Docentes, Planta Académica, Jefe de Estudio o Comandante.' },
      { id: '4', desc: 'No cumplir con las normas de convivencia y buena conducta en las viviendas funcionales o particulares, debidamente comprobado con informes pertinentes.' },
      { id: '5', desc: 'Efectuar comentarios con particulares o personal militar ajeno al Instituto, que denigre o permita realizar conjeturas o especulaciones negativas, que afecten al prestigio e imagen de la Institución de la ECEMA o de su personal.' }
    ]
  },
  {
    grupo: 'GRAVE_25',
    label: 'Faltas Graves - Grupo 2 (25 pts)',
    pts: 25,
    faltas: [
      { id: '1', desc: 'No conducirse con pulcritud y decoro en actos públicos, dando lugar a críticas y reproches contra la institución.' },
      { id: '2', desc: 'Realizar visitas en el domicilio u oficina al personal docente, sin justificación y autorización.' },
      { id: '3', desc: 'Atentar o infringir contra la seguridad y reserva de la documentación de la ECEMA.' }
    ]
  },
  {
    grupo: 'CONSEJO_ACADEMICO',
    label: 'Faltas a Consejo Académico - Grupo 3 (0 pts)',
    pts: 0,
    faltas: [
      { id: '1', desc: 'Por exceder el límite de asignaturas reprobadas (Separación del Curso).' },
      { id: '2', desc: 'Por la reprobación en la calificación de las actividades físico-deportivas.' },
      { id: '3', desc: 'Por confraternizar y relacionarse con personal de planta, cursantes y administrativo de la Unidad.' },
      { id: '4', desc: 'Por fraude o intento de fraude en controles y exámenes.' },
      { id: '5', desc: 'Por efectuar plagio comprobado en los trabajos asignados.' },
      { id: '6', desc: 'Por la reprobación en exámenes de segunda instancia.' },
      { id: '7', desc: 'Por la reprobación en segunda instancia, en las apreciaciones o exposiciones de los Ejercicios Operativos y Trabajos Aplicativos.' }
    ]
  }
];

type TabType = 'boletas' | 'kardex' | 'alertas' | 'sancionadores';

export function DisciplinaDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('boletas');

  // Core Data
  const [alertas, setAlertas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [sancionadoresList, setSancionadoresList] = useState<any[]>([]);

  // Search and Filters for Tab 1 (Boletas)
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroDiplomadoHistorial, setFiltroDiplomadoHistorial] = useState('');

  // Kardex Tab State
  const [selectedKardexInscripcionId, setSelectedKardexInscripcionId] = useState<string>('');
  const [kardexSearchText, setKardexSearchText] = useState('');
  const [filtroGestionKardex, setFiltroGestionKardex] = useState<string>('');
  const [filtroDiplomadoKardex, setFiltroDiplomadoKardex] = useState<string>('');
  const [kardexData, setKardexData] = useState<any>(null);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Sancionador Form State (Inline in Tab 4)
  const [sancionadorFormData, setSancionadorFormData] = useState<{ id: number | null; grado: string; nombre: string; apellido: string }>({ 
    id: null, 
    grado: '', 
    nombre: '', 
    apellido: '' 
  });

  // Modal State for Registering / Editing Sanción
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filters inside modal
  const [filtroGestionModal, setFiltroGestionModal] = useState('');
  const [filtroDiplomadoModal, setFiltroDiplomadoModal] = useState('');
  const [filtroSemestreModal, setFiltroSemestreModal] = useState('');

  // Form Fields inside modal
  const [selectedInscripcion, setSelectedInscripcion] = useState('');
  const [selectedInscripcionName, setSelectedInscripcionName] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState('LEVE_3');
  const [selectedFaltaId, setSelectedFaltaId] = useState('');
  const [selectedFaltaEspec, setSelectedFaltaEspec] = useState('');
  const [motivoExtra, setMotivoExtra] = useState('');
  const [sancionador, setSancionador] = useState('');
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [fechaFalta, setFechaFalta] = useState('');
  const [antecedentes, setAntecedentes] = useState<any[]>([]);
  const [esReincidencia, setEsReincidencia] = useState(false);
  const [loadingAntecedentes, setLoadingAntecedentes] = useState(false);

  // Fetch functions
  const fetchAlertas = async () => {
    try {
      const res = await api.get('/disciplina/alertas');
      setAlertas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInscripciones = async () => {
    try {
      const res = await api.get('/inscripciones');
      setInscripciones(res.data.filter((i: any) => i.estado === 'ACTIVO'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistorial = async () => {
    try {
      const res = await api.get('/disciplina/historial');
      setHistorial(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSancionadores = async () => {
    try {
      const res = await api.get('/sancionadores');
      setSancionadoresList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch individual Kardex when selected
  const fetchKardexDetalle = async (inscripcionId: string) => {
    if (!inscripcionId) {
      setKardexData(null);
      return;
    }
    setLoadingKardex(true);
    try {
      const res = await api.get(`/disciplina/inscripcion/${inscripcionId}`);
      setKardexData(res.data);
    } catch (err) {
      console.error('Error al cargar kardex:', err);
      showError('No se pudo cargar el Kardex del cursante seleccionado');
    } finally {
      setLoadingKardex(false);
    }
  };

  const abrirKardexDeCursante = (inscripcionId: number | string) => {
    const idStr = inscripcionId.toString();
    setSelectedKardexInscripcionId(idStr);
    const cursanteObj = inscripciones.find(i => i.id.toString() === idStr);
    if (cursanteObj) {
      setKardexSearchText(`${cursanteObj.cursante.grado} ${cursanteObj.cursante.nombre} ${cursanteObj.cursante.apellido} (${cursanteObj.edicion.diplomado.nombre})`);
      if (cursanteObj.edicion?.periodo?.gestion) {
        setFiltroGestionKardex(cursanteObj.edicion.periodo.gestion);
      }
      if (cursanteObj.edicion?.diplomado?.nombre?.includes('DCEMA')) {
        setFiltroDiplomadoKardex('DCEMA');
      } else if (cursanteObj.edicion?.diplomado?.nombre?.includes('DCEA')) {
        setFiltroDiplomadoKardex('DCEA');
      } else {
        setFiltroDiplomadoKardex('');
      }
    }
    setActiveTab('kardex');
    fetchKardexDetalle(idStr);
  };

  const cursantesKardexDisponibles = inscripciones.filter(i => {
    let matches = true;
    if (filtroGestionKardex && i.edicion?.periodo?.gestion !== filtroGestionKardex) matches = false;
    if (filtroDiplomadoKardex === 'DCEMA' && !i.edicion?.diplomado?.nombre?.includes('DCEMA')) matches = false;
    if (filtroDiplomadoKardex === 'DCEA' && !i.edicion?.diplomado?.nombre?.includes('DCEA')) matches = false;
    return matches;
  });

  // Sancionador Save/Edit
  const handleGuardarSancionador = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (sancionadorFormData.id) {
        await api.put(`/sancionadores/${sancionadorFormData.id}`, sancionadorFormData);
        showSuccess('Sancionador actualizado correctamente');
      } else {
        await api.post('/sancionadores', sancionadorFormData);
        showSuccess('Sancionador registrado');
      }
      setSancionadorFormData({ id: null, grado: '', nombre: '', apellido: '' });
      fetchSancionadores();
    } catch (err) {
      showError('Error al guardar sancionador');
    }
  };

  const handleEliminarSancionador = async (id: number) => {
    const isConfirmed = await showConfirmDelete('este sancionador', 'Ya no aparecerá en la lista al registrar sanciones.');
    if (!isConfirmed) return;
    try {
      await api.delete(`/sancionadores/${id}`);
      showSuccess('Sancionador eliminado');
      fetchSancionadores();
    } catch (err) {
      showError('Error al eliminar sancionador');
    }
  };

  const handleEdit = (h: any) => {
    setEditingId(h.id);
    setSelectedGrupo(h.tipo);
    setSelectedInscripcion(h.inscripcion_id.toString());
    setSelectedInscripcionName(h.cursante + ' - ' + h.diplomado);
    
    const dotIndex = h.motivo.indexOf('.');
    if (dotIndex > 0 && dotIndex < 5) {
      const id = h.motivo.substring(0, dotIndex);
      setSelectedFaltaId(id);
      
      const dashIndex = h.motivo.indexOf(' - ', dotIndex);
      if (dashIndex > 0) {
        setMotivoExtra(h.motivo.substring(dashIndex + 3));
      } else {
        setMotivoExtra('');
      }
    } else {
      setMotivoExtra(h.motivo);
    }
    
    setSancionador(h.sancionador || '');
    setNumeroBoleta(h.numero_boleta || '');
    setEsReincidencia(Boolean(h.es_reincidencia || h.reincidencia > 1));
    if (h.fecha_falta) {
      const d = new Date(h.fecha_falta);
      const offset = d.getTimezoneOffset() * 60000;
      setFechaFalta(new Date(d.getTime() - offset).toISOString().slice(0, 16));
    } else if (h.fecha) {
      const d = new Date(h.fecha);
      const offset = d.getTimezoneOffset() * 60000;
      setFechaFalta(new Date(d.getTime() - offset).toISOString().slice(0, 16));
    } else {
      setFechaFalta(getNowDateTimeLocal());
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await showConfirmDelete('esta falta', 'Esta acción afectará el puntaje del cursante.');
    if (!isConfirmed) return;
    try {
      await api.delete(`/disciplina/demerito/${id}`);
      fetchAlertas();
      fetchHistorial();
      if (selectedKardexInscripcionId) {
        fetchKardexDetalle(selectedKardexInscripcionId);
      }
      showSuccess('Falta eliminada correctamente');
    } catch (err) {
      console.error(err);
      showError('Error al eliminar');
    }
  };

  useEffect(() => {
    fetchAlertas();
    fetchInscripciones();
    fetchHistorial();
    fetchSancionadores();
  }, []);

  // Update specific faults when group changes
  useEffect(() => {
    const cat = CATEGORIAS_FALTAS.find(c => c.grupo === selectedGrupo);
    if (cat && cat.faltas.length > 0) {
      setSelectedFaltaId(cat.faltas[0].id);
      setSelectedFaltaEspec(cat.faltas[0].desc);
    }
  }, [selectedGrupo]);

  // Update specific fault description when ID changes
  useEffect(() => {
    const cat = CATEGORIAS_FALTAS.find(c => c.grupo === selectedGrupo);
    if (cat) {
      const falta = cat.faltas.find(f => f.id === selectedFaltaId);
      if (falta) {
        setSelectedFaltaEspec(falta.desc);
      }
    }
  }, [selectedFaltaId, selectedGrupo]);

  // Antecedentes check
  useEffect(() => {
    const checkAntecedentes = async () => {
      if (!selectedInscripcion || !selectedGrupo || !selectedFaltaId) {
        setAntecedentes([]);
        if (!editingId) setEsReincidencia(false);
        return;
      }
      try {
        setLoadingAntecedentes(true);
        const res = await api.get('/disciplina/verificar-antecedente', {
          params: {
            inscripcion_id: selectedInscripcion,
            tipo: selectedGrupo,
            codigo_falta: selectedFaltaId,
            fecha_referencia: fechaFalta || new Date().toISOString()
          }
        });
        const previas = res.data.antecedentes || [];
        const filtradas = editingId ? previas.filter((p: any) => p.id !== editingId) : previas;
        setAntecedentes(filtradas);
        if (!editingId && filtradas.length === 0) {
          setEsReincidencia(false);
        }
      } catch (err) {
        console.error('Error al verificar antecedentes:', err);
      } finally {
        setLoadingAntecedentes(false);
      }
    };

    checkAntecedentes();
  }, [selectedInscripcion, selectedGrupo, selectedFaltaId, fechaFalta, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cat = CATEGORIAS_FALTAS.find(f => f.grupo === selectedGrupo);
      const pts = cat?.pts || 0;
      
      const motivoFinal = motivoExtra.trim() !== '' 
        ? `${selectedFaltaId}. ${selectedFaltaEspec} - ${motivoExtra}`
        : `${selectedFaltaId}. ${selectedFaltaEspec}`;

      const payload = {
        inscripcion_id: selectedInscripcion,
        tipo: selectedGrupo,
        codigo_falta: selectedFaltaId,
        es_reincidencia: esReincidencia,
        puntos_base: pts,
        motivo: motivoFinal,
        sancionador: sancionador.trim(),
        numero_boleta: numeroBoleta.trim(),
        fecha_falta: fechaFalta ? new Date(fechaFalta).toISOString() : null
      };

      if (editingId) {
        await api.put(`/disciplina/demerito/${editingId}`, payload);
        showSuccess('Falta actualizada correctamente.');
      } else {
        await api.post('/disciplina/demerito', payload);
        showSuccess('Demérito registrado correctamente.');
      }
      
      setShowModal(false);
      setEditingId(null);
      setMotivoExtra('');
      setSancionador('');
      setNumeroBoleta('');
      setFechaFalta('');
      setAntecedentes([]);
      setEsReincidencia(false);
      setSelectedInscripcion('');
      setSelectedInscripcionName('');
      
      fetchAlertas();
      fetchHistorial();
      if (selectedKardexInscripcionId) {
        fetchKardexDetalle(selectedKardexInscripcionId);
      }
    } catch (err) {
      console.error(err);
      showError('Error al registrar demérito');
    }
  };

  // Filtered lists
  const gestiones = Array.from(new Set(inscripciones.map(i => i.edicion.periodo?.gestion).filter(Boolean))).sort().reverse();

  const inscripcionesModalFiltradas = inscripciones.filter(i => {
    let matches = true;
    if (filtroGestionModal && i.edicion.periodo?.gestion !== filtroGestionModal) matches = false;
    if (filtroDiplomadoModal === 'DCEMA' && !i.edicion.diplomado.nombre.includes('DCEMA')) matches = false;
    if (filtroDiplomadoModal === 'DCEA' && !i.edicion.diplomado.nombre.includes('DCEA')) matches = false;
    if (filtroDiplomadoModal === 'DCEA' && filtroSemestreModal) {
      if (i.edicion.periodo?.semestre !== filtroSemestreModal) matches = false;
    }
    return matches;
  });

  const historialFiltrado = historial.filter(h => {
    let matches = true;
    if (filtroDiplomadoHistorial) {
      if (!h.diplomado.includes(filtroDiplomadoHistorial)) matches = false;
    }
    if (busquedaHistorial.trim() !== '') {
      const q = busquedaHistorial.toLowerCase();
      const matchBoleta = h.numero_boleta?.toLowerCase().includes(q);
      const matchCursante = h.cursante?.toLowerCase().includes(q);
      const matchMotivo = h.motivo?.toLowerCase().includes(q);
      const matchSancionador = h.sancionador?.toLowerCase().includes(q);
      if (!matchBoleta && !matchCursante && !matchMotivo && !matchSancionador) {
        matches = false;
      }
    }
    return matches;
  });

  // KPI Calculations
  const totalCriticos = alertas.filter(a => a.estado === 'CRITICO').length;
  const totalAlertas = alertas.filter(a => a.estado === 'ALERTA').length;

  return (
    <div className="space-y-5 pb-8">
      
      {/* Header General */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-[#0f2942]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942] block mb-0.5">
            Sección Instrucción y Régimen Interno • ECEMA
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control Disciplinario y Kardex Militar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro de boletas de sanción, cómputo de deméritos y emisión de fojas de conducta.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button 
            onClick={() => {
              setEditingId(null);
              setSelectedInscripcion('');
              setSelectedInscripcionName('');
              setMotivoExtra('');
              setSancionador('');
              setNumeroBoleta('');
              setFechaFalta(getNowDateTimeLocal());
              setAntecedentes([]);
              setEsReincidencia(false);
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Boleta de Sanción</span>
          </button>
        </div>
      </div>

      {/* Barra de Pestañas / Tabs Principales */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-1.5 flex flex-wrap gap-1.5">
        
        {/* Tab 1: Registro y Boletas */}
        <button
          onClick={() => setActiveTab('boletas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors ${
            activeTab === 'boletas'
              ? 'bg-[#0f2942] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Libro de Sanciones</span>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
            activeTab === 'boletas' ? 'bg-white/15 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {historial.length}
          </span>
        </button>

        {/* Tab 2: Kardex por Cursante */}
        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors ${
            activeTab === 'kardex'
              ? 'bg-[#0f2942] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Kardex Individual</span>
          {selectedKardexInscripcionId && (
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          )}
        </button>

        {/* Tab 3: Alertas y Cursantes en Riesgo */}
        <button
          onClick={() => setActiveTab('alertas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors ${
            activeTab === 'alertas'
              ? 'bg-[#0f2942] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Cursantes Observados</span>
          {alertas.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
              activeTab === 'alertas' ? 'bg-amber-500 text-slate-950' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {alertas.length}
            </span>
          )}
        </button>

        {/* Tab 4: Directorio de Sancionadores */}
        <button
          onClick={() => setActiveTab('sancionadores')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors ${
            activeTab === 'sancionadores'
              ? 'bg-[#0f2942] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Personal Sancionador</span>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
            activeTab === 'sancionadores' ? 'bg-white/15 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {sancionadoresList.length}
          </span>
        </button>

      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: REGISTRO Y BOLETAS (Historial y Búsqueda Rápida) */}
      {/* ========================================================= */}
      {activeTab === 'boletas' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Filtrar por N° de boleta, cursante o motivo..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
              />
              {busquedaHistorial && (
                <button 
                  onClick={() => setBusquedaHistorial('')} 
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Programa:</span>
              </div>
              <select
                value={filtroDiplomadoHistorial}
                onChange={(e) => setFiltroDiplomadoHistorial(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none"
              >
                <option value="">Todos los programas</option>
                <option value="DCEMA">DCEMA</option>
                <option value="DCEA">DCEA</option>
              </select>
            </div>
          </div>

          {/* Tabla de Historial */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Libro de Sanciones y Boletas</h3>
                <p className="text-[11px] text-slate-500">Registro cronológico de partes y deméritos aplicados</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 tabular-nums">
                {historialFiltrado.length} registros
              </span>
            </div>

            {historialFiltrado.length === 0 ? (
              <div className="p-10 text-center text-slate-500 space-y-1.5">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-xs text-slate-700">No se registran boletas con los criterios seleccionados.</p>
                <p className="text-xs text-slate-400">Utilice el botón "Registrar Boleta de Sanción" para asentar un nuevo parte.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">N° Boleta</th>
                      <th className="px-4 py-3 text-left font-bold">Fecha / Hora</th>
                      <th className="px-4 py-3 text-left font-bold">Cursante</th>
                      <th className="px-4 py-3 text-left font-bold">Tipificación y Motivo</th>
                      <th className="px-4 py-3 text-right font-bold">Demérito</th>
                      <th className="px-4 py-3 text-left font-bold">Sancionador</th>
                      <th className="px-4 py-3 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {historialFiltrado.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Boleta */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {h.numero_boleta ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                              #{h.numero_boleta}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">S/N</span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-600 tabular-nums">
                          <div className="font-semibold text-slate-900">
                            {h.fecha_falta 
                              ? `${new Date(h.fecha_falta).toLocaleDateString()} ${new Date(h.fecha_falta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                              : `${new Date(h.fecha).toLocaleDateString()} ${new Date(h.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                          </div>
                          {h.fecha_falta && (
                            <div className="text-[10px] text-slate-400">
                              Reg: {new Date(h.fecha).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Cursante */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 text-xs">{h.cursante}</div>
                          <div className="text-[11px] text-slate-500">{h.diplomado}</div>
                        </td>

                        {/* Motivo */}
                        <td className="px-4 py-3 text-xs max-w-sm">
                          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-0.5">{h.tipo.replace('_', ' ')}</div>
                          <div className="text-slate-600 line-clamp-2">{h.motivo}</div>
                          {h.es_reincidencia && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Reincidencia (x{h.reincidencia})
                            </span>
                          )}
                        </td>

                        {/* Pts Descontados */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-50 text-red-700 border border-red-200 tabular-nums">
                            -{h.total_descontado} pts
                          </span>
                        </td>

                        {/* Sancionador */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          <div className="font-medium text-slate-800">{h.sancionador || '—'}</div>
                          <div className="text-[10px] text-slate-400">Reg: {h.reportador}</div>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => abrirKardexDeCursante(h.inscripcion_id)}
                              className="p-1.5 rounded text-[#0f2942] hover:bg-slate-100 transition-colors"
                              title="Ver Kardex del cursante"
                            >
                              <GraduationCap className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEdit(h)}
                              className="p-1.5 rounded text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 transition-colors"
                              title="Editar boleta"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(h.id)}
                              className="p-1.5 rounded text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar boleta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: KARDEX POR CURSANTE (Vista Imprimible y Oficial) */}
      {/* ========================================================= */}
      {activeTab === 'kardex' && (
        <div className="space-y-5">
          
          {/* Selector de Cursante (No se imprime) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Consulta de Kardex Individual</h3>
                <p className="text-xs text-slate-500">Seleccione un cursante para revisar su foja de conducta e imprimir el reporte oficial.</p>
              </div>
              {selectedKardexInscripcionId && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-[#0f2942] hover:bg-[#163a5c] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Kardex Oficial</span>
                </button>
              )}
            </div>

            {/* 2 Desplegables: Gestión y Diplomado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gestión</label>
                <select
                  value={filtroGestionKardex}
                  onChange={(e) => {
                    setFiltroGestionKardex(e.target.value);
                    setKardexSearchText('');
                    setSelectedKardexInscripcionId('');
                    setKardexData(null);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-medium cursor-pointer"
                >
                  <option value="">Todas las gestiones</option>
                  {gestiones.map((g: any) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Diplomado</label>
                <select
                  value={filtroDiplomadoKardex}
                  onChange={(e) => {
                    setFiltroDiplomadoKardex(e.target.value);
                    setKardexSearchText('');
                    setSelectedKardexInscripcionId('');
                    setKardexData(null);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-medium cursor-pointer"
                >
                  <option value="">Todos los Diplomados</option>
                  <option value="DCEMA">DCEMA (Comando y Estado Mayor)</option>
                  <option value="DCEA">DCEA (Escuadrón Aéreo)</option>
                </select>
              </div>
            </div>

            {/* Cuadro de Búsqueda anterior con datalist */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cursante ({cursantesKardexDisponibles.length})
              </label>
              <div className="relative">
                <input 
                  list="kardex-cursantes-list"
                  type="text"
                  placeholder="Escriba el nombre, apellido o grado militar del cursante..."
                  value={kardexSearchText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setKardexSearchText(val);
                    const found = cursantesKardexDisponibles.find(i => 
                      `${i.cursante.grado} ${i.cursante.nombre} ${i.cursante.apellido} (${i.edicion.diplomado.nombre})` === val ||
                      `${i.cursante.grado} ${i.cursante.nombre} ${i.cursante.apellido}`.toLowerCase().includes(val.toLowerCase()) ||
                      `${i.cursante.nombre} ${i.cursante.apellido}`.toLowerCase().includes(val.toLowerCase())
                    );
                    if (found) {
                      setSelectedKardexInscripcionId(found.id.toString());
                      fetchKardexDetalle(found.id.toString());
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
                <datalist id="kardex-cursantes-list">
                  {cursantesKardexDisponibles.map(i => (
                    <option 
                      key={i.id} 
                      value={`${i.cursante.grado} ${i.cursante.nombre} ${i.cursante.apellido} (${i.edicion.diplomado.nombre})`} 
                    />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Estado de Carga */}
          {loadingKardex && (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Cargando Kardex Militar...</p>
            </div>
          )}

          {/* Sin selección */}
          {!loadingKardex && !kardexData && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-300" />
              <div className="font-semibold text-gray-600 text-base">Ningún cursante seleccionado</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Seleccione un cursante en la barra superior o haga clic en el ícono de birrete en la tabla de sanciones para ver su registro individual.
              </p>
            </div>
          )}

          {/* KARDEX COMPLETO IMPRIMIBLE */}
          {!loadingKardex && kardexData && (
            <div id="printable-kardex" className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              
              {/* Encabezado Militar Oficial */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Fuerza Aérea Boliviana</h4>
                  <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                    Escuela de Comando y Estado Mayor Aéreo
                  </h2>
                </div>
                <div className="sm:text-right border sm:border-0 p-2 sm:p-0 rounded-lg bg-slate-50 sm:bg-transparent">
                  <div className="text-xs font-extrabold uppercase px-3 py-1 bg-slate-900 text-white rounded">
                    Kardex Disciplinario
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    Gestión: {kardexData.inscripcion?.edicion?.periodo?.gestion || new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Ficha del Cursante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Cursante:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {kardexData.inscripcion?.cursante?.grado} {kardexData.inscripcion?.cursante?.nombre} {kardexData.inscripcion?.cursante?.apellido}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Carnet Militar (CM):</span>
                  <span className="font-bold text-slate-800">{kardexData.inscripcion?.cursante?.cm || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Programa Académico:</span>
                  <span className="font-bold text-slate-800">{kardexData.inscripcion?.edicion?.diplomado?.nombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Régimen:</span>
                  <span className="font-bold text-slate-800">
                    Base sobre {kardexData.estadisticas.maxPuntos} pts
                  </span>
                </div>
              </div>

              {/* Resumen de Calificación y Estado de Conducta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs font-bold text-slate-500 uppercase">Puntaje Base</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {kardexData.estadisticas.maxPuntos} <span className="text-xs font-normal text-slate-400">pts</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                  <span className="text-xs font-bold text-red-600 uppercase">Deméritos Acumulados</span>
                  <div className="text-2xl font-black text-red-700 mt-1">
                    -{kardexData.estadisticas.puntosDisciplina.toFixed(1)} <span className="text-xs font-normal text-red-500">pts</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Nota Disciplinaria Actual</span>
                  <div className="text-2xl font-black text-emerald-800 mt-1">
                    {(kardexData.estadisticas.maxPuntos - kardexData.estadisticas.puntosDisciplina).toFixed(1)}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ {kardexData.estadisticas.maxPuntos}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de Deméritos Registrados */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Detalle de Sanciones y Faltas Registradas ({kardexData.demeritos.length})
                </h5>

                {kardexData.demeritos.length === 0 ? (
                  <div className="p-6 text-center text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 font-semibold text-xs">
                    ✓ Sin antecedentes disciplinarios. Cursante con conducta ejemplar (100% de puntaje).
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-slate-700 uppercase">Boleta</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-700 uppercase">Fecha Falta</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-700 uppercase">Nivel / Cód.</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-700 uppercase">Motivo y Observación</th>
                          <th className="px-3 py-2 text-center font-bold text-slate-700 uppercase">Puntos</th>
                          <th className="px-3 py-2 text-left font-bold text-slate-700 uppercase">Sancionador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {kardexData.demeritos.map((d: any) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2.5 font-bold text-slate-800">
                              {d.numero_boleta ? `#${d.numero_boleta}` : 'S/N'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {d.fecha_falta 
                                ? new Date(d.fecha_falta).toLocaleDateString() + ' ' + new Date(d.fecha_falta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : new Date(d.fecha).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2.5 text-red-700 font-bold">
                              {d.tipo} {d.codigo_falta ? `(N° ${d.codigo_falta})` : ''}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {d.motivo}
                              {d.es_reincidencia && (
                                <span className="ml-2 font-bold text-amber-700">⚠️ Reincidencia x{d.nivel_reincidencia}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-extrabold text-red-600">
                              -{d.puntos_totales_descontados} pts
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {d.sancionador || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bloque de Firmas Militares para Impresión */}
              <div className="pt-16 pb-4 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-900 uppercase">Jefe de Instrucción</p>
                  <p className="text-[11px] text-slate-500">ECEMA</p>
                </div>
                <div>
                  <div className="border-t border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-900 uppercase">Cursante Notificado</p>
                  <p className="text-[11px] text-slate-500">Firma y Grado</p>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: CURSANTES EN RIESGO (Alertas de Instrucción)   */}
      {/* ========================================================= */}
      {activeTab === 'alertas' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Métricas Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-red-600 tracking-wider">Estado Crítico (&gt;50 pts)</span>
                <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-red-700 mt-2">{totalCriticos}</div>
              <p className="text-xs text-gray-500 mt-1">Riesgo inminente de Consejo de Disciplina o Separación</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">En Observación (&gt;30 pts)</span>
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-amber-800 mt-2">{totalAlertas}</div>
              <p className="text-xs text-gray-500 mt-1">Acumulación moderada de sanciones leves y graves</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Cursantes Aptos</span>
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-800 mt-2">
                {Math.max(0, inscripciones.length - alertas.length)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Dentro del umbral disciplinario reglamentario</p>
            </div>

          </div>

          {/* Tabla de Alertas */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Cursantes con Registro Disciplinario Observado</h3>
                <p className="text-xs text-gray-500">Monitoreo continuo para la toma de decisiones por el Comando</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">Cargando alertas...</div>
            ) : alertas.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-emerald-700">Sin cursantes en riesgo disciplinario</p>
                <p className="text-xs text-gray-400">Todos los cursantes mantienen un puntaje superior al límite de observación.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cursante</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Diplomado</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Puntos Perdidos</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nota Actual</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                      <tr key={alerta.inscripcion_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">
                            {alerta.cursante.grado} {alerta.cursante.nombre} {alerta.cursante.apellido}
                          </div>
                          <div className="text-xs text-gray-500">CM: {alerta.cursante.cm}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {alerta.diplomado}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-extrabold text-red-600">
                          -{alerta.puntosPerdidosTotal} pts
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                          {alerta.calificacionFinal.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ min {alerta.minRequerido}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {alerta.estado === 'CRITICO' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              Crítico (&gt;50 pts)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Observado (&gt;30 pts)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => abrirKardexDeCursante(alerta.inscripcion_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs transition-colors"
                          >
                            <span>Ver Kardex</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 4: DIRECTORIO DE SANCIONADORES (CRUD Integrado)  */}
      {/* ========================================================= */}
      {activeTab === 'sancionadores' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Formulario de Alta / Edición (1 columna) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {sancionadorFormData.id ? 'Modificar Sancionador' : 'Registrar Nuevo Sancionador'}
              </h3>
              <p className="text-xs text-gray-500">
                Oficiales o autoridades facultadas para emitir órdenes y boletas de sanción
              </p>
            </div>

            <form onSubmit={handleGuardarSancionador} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grado Militar *</label>
                <input 
                  required
                  placeholder="Ej. Cnl., Tcnl., My., Cap., Sof."
                  value={sancionadorFormData.grado}
                  onChange={(e) => setSancionadorFormData({...sancionadorFormData, grado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombres *</label>
                <input 
                  required
                  placeholder="Ej. Juan Carlos"
                  value={sancionadorFormData.nombre}
                  onChange={(e) => setSancionadorFormData({...sancionadorFormData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Apellidos *</label>
                <input 
                  required
                  placeholder="Ej. Pérez Fernández"
                  value={sancionadorFormData.apellido}
                  onChange={(e) => setSancionadorFormData({...sancionadorFormData, apellido: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  {sancionadorFormData.id ? 'Guardar Modificación' : 'Añadir al Directorio'}
                </button>
                {sancionadorFormData.id && (
                  <button
                    type="button"
                    onClick={() => setSancionadorFormData({ id: null, grado: '', nombre: '', apellido: '' })}
                    className="px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Directorio de Sancionadores Registrados (2 columnas) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Lista de Autoridades Sancionadoras</h3>
                <p className="text-xs text-gray-500">Disponibles en el menú desplegable al registrar boletas</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-gray-600">
                {sancionadoresList.length} registrados
              </span>
            </div>

            {sancionadoresList.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                No hay sancionadores registrados en el sistema. Registre uno con el formulario de la izquierda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50/70">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase">Grado</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase">Nombre Completo</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sancionadoresList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{s.grado}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{s.nombre} {s.apellido}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSancionadorFormData(s)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Modificar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarSancionador(s.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PARA REGISTRAR O EDITAR SANCIÓN (Boleta)            */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingId ? 'Editar Sanción Registrada' : 'Registrar Sanción / Demérito'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingId ? 'Modifique los datos de la sanción.' : 'Complete los datos según la boleta física o la orden verbal recibida.'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="demeritoForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Datos de la Boleta Física y Fecha */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    1. Datos de la Boleta Física y Orden Verbal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        N° de Boleta de Sanción <span className="text-gray-400 font-normal">(Opcional)</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Ej. 045 o B-12/26"
                        value={numeroBoleta}
                        onChange={(e) => setNumeroBoleta(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white font-semibold text-gray-800"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Número registrado en la boleta manual de papel.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha y Hora de la Falta / Orden Verbal *
                      </label>
                      <input 
                        type="datetime-local"
                        required
                        value={fechaFalta}
                        onChange={(e) => setFechaFalta(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white font-medium text-gray-800"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Momento en que se cometió u ordenó la sanción.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Cursante Infractor */}
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    2. Cursante Infractor
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Gestión</label>
                      <select 
                        value={filtroGestionModal}
                        onChange={(e) => {
                          setFiltroGestionModal(e.target.value);
                          setSelectedInscripcion('');
                          setSelectedInscripcionName('');
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-medium"
                      >
                        <option value="">Todas las gestiones</option>
                        {gestiones.map((g: any) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Diplomado</label>
                      <select 
                        value={filtroDiplomadoModal}
                        onChange={(e) => {
                          setFiltroDiplomadoModal(e.target.value);
                          setSelectedInscripcion('');
                          setSelectedInscripcionName('');
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-medium"
                      >
                        <option value="">Todos los Diplomados</option>
                        <option value="DCEMA">DCEMA (Comando y Estado Mayor)</option>
                        <option value="DCEA">DCEA (Escuadrón Aéreo)</option>
                      </select>
                    </div>

                    {filtroDiplomadoModal === 'DCEA' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Semestre</label>
                        <select 
                          value={filtroSemestreModal}
                          onChange={(e) => {
                            setFiltroSemestreModal(e.target.value);
                            setSelectedInscripcion('');
                            setSelectedInscripcionName('');
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white font-medium"
                        >
                          <option value="">Ambos semestres</option>
                          <option value="1">1er Semestre</option>
                          <option value="2">2do Semestre</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Seleccione el Cursante *</label>
                    <input 
                      required
                      disabled={!!editingId}
                      list="modal-cursantes-list"
                      placeholder="Escriba el nombre, apellido o grado militar..."
                      value={selectedInscripcionName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedInscripcionName(val);
                        
                        const selected = inscripcionesModalFiltradas.find(i => 
                          `${i.cursante.grado} ${i.cursante.nombre} ${i.cursante.apellido} - ${i.edicion.diplomado.nombre} ${i.edicion.periodo?.semestre ? `(Sem. ${i.edicion.periodo.semestre})` : ''}` === val
                        );
                        
                        if (selected) {
                          setSelectedInscripcion(selected.id.toString());
                        } else {
                          setSelectedInscripcion('');
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <datalist id="modal-cursantes-list">
                      {inscripcionesModalFiltradas.map(i => (
                        <option key={i.id} value={`${i.cursante.grado} ${i.cursante.nombre} ${i.cursante.apellido} - ${i.edicion.diplomado.nombre} ${i.edicion.periodo?.semestre ? `(Sem. ${i.edicion.periodo.semestre})` : ''}`} />
                      ))}
                    </datalist>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {selectedInscripcion ? '✓ Cursante seleccionado correctamente' : `Mostrando ${inscripcionesModalFiltradas.length} cursantes disponibles.`}
                    </p>
                  </div>
                </div>

                {/* 3. Tipificación según Reglamento */}
                <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 space-y-4">
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                    3. Tipificación según Reglamento de Faltas
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Grupo o Nivel de Falta *</label>
                    <select 
                      required
                      value={selectedGrupo}
                      onChange={(e) => setSelectedGrupo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white font-bold text-red-700"
                    >
                      {CATEGORIAS_FALTAS.map(cat => (
                        <option key={cat.grupo} value={cat.grupo}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Código (Nº) *</label>
                      <select 
                        required
                        value={selectedFaltaId}
                        onChange={(e) => setSelectedFaltaId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white font-extrabold text-slate-800"
                      >
                        {CATEGORIAS_FALTAS.find(c => c.grupo === selectedGrupo)?.faltas.map(f => (
                          <option key={f.id} value={f.id}>N° {f.id}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Descripción de la Falta</label>
                      <textarea 
                        readOnly
                        value={selectedFaltaEspec}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 text-xs outline-none resize-none min-h-[4.5rem]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones / Causa Específica (Opcional)</label>
                    <input 
                      type="text"
                      value={motivoExtra}
                      onChange={(e) => setMotivoExtra(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
                      placeholder="Ej. Mal lustrado de botas durante la formación de las 07:30..."
                    />
                  </div>

                  {/* Panel de Antecedentes y Confirmación de Reincidencia */}
                  {antecedentes.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Falta previa encontrada en los últimos 30 días (Código N° {selectedFaltaId})
                          </h5>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Este cursante registra {antecedentes.length} {antecedentes.length === 1 ? 'antecedente previo' : 'antecedentes previos'} con este mismo código:
                          </p>
                        </div>
                      </div>

                      {/* Lista de antecedentes */}
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {antecedentes.map((ant: any) => (
                          <div key={ant.id} className="text-xs bg-white p-2.5 rounded-lg border border-amber-200 text-slate-700 shadow-2xs">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>
                                {ant.numero_boleta ? `Boleta #${ant.numero_boleta}` : 'Boleta S/N'}
                                <span className="font-normal text-slate-500 ml-2">
                                  ({new Date(ant.fecha_falta || ant.fecha).toLocaleDateString()} {new Date(ant.fecha_falta || ant.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                                </span>
                              </span>
                              <span className="text-red-600 font-bold">-{ant.puntos_descontados} pts</span>
                            </div>
                            <p className="text-[12px] text-slate-600 mt-1 italic">
                              "{ant.motivo}"
                            </p>
                            {ant.sancionador && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Sancionador: {ant.sancionador}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Casilla de confirmación para la secretaria */}
                      <div className="pt-2 border-t border-amber-200">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={esReincidencia}
                            onChange={(e) => setEsReincidencia(e.target.checked)}
                            className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-amber-950">
                              ¿Es reincidencia por el mismo motivo o hecho?
                            </span>
                            <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                              Marque esta casilla únicamente si la boleta actual fue por la misma causa específica que la anterior.
                            </p>
                            {esReincidencia ? (
                              <span className="inline-block mt-1.5 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                                ➜ Aplicando sanción doble: -{Number(CATEGORIAS_FALTAS.find(f => f.grupo === selectedGrupo)?.pts || 0) * (antecedentes.length + 1)} pts
                              </span>
                            ) : (
                              <span className="inline-block mt-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Sanción normal (1ª vez): -{CATEGORIAS_FALTAS.find(f => f.grupo === selectedGrupo)?.pts || 0} pts
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Sancionador */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    4. Autoridad Sancionadora
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">FALTA IMPUESTA POR:</label>
                    <select 
                      value={sancionador}
                      onChange={(e) => setSancionador(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-800 outline-none text-sm bg-white font-medium"
                    >
                      <option value="">Seleccione una autoridad sancionadora o deje en blanco...</option>
                      {sancionadoresList.map(s => {
                        const name = `${s.grado ? s.grado + ' ' : ''}${s.nombre} ${s.apellido}`;
                        return (
                          <option key={s.id} value={name}>{name}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="demeritoForm"
                disabled={!selectedInscripcion}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar Sanción'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
