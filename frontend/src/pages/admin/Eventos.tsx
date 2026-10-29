import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  Clock, 
  Laptop, 
  Globe, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  X,
  FileText,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/alerts';

interface EventoAudit {
  id: number;
  fecha: string;
  accion: string;
  entidad: string;
  mensaje: string;
  detalles_raw?: string;
  severidad: 'CRITICA' | 'MEDIA' | 'BAJA';
  ip?: string | null;
  dispositivo?: string | null;
  objeto_afectado?: string | null;
  valor_anterior?: any;
  valor_nuevo?: any;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
    grado?: string | null;
    ci?: string | null;
    cm?: string | null;
  } | null;
}

export function Eventos() {
  // Query de eventos de auditoría
  const { data: eventos = [], isLoading, isRefetching, refetch } = useQuery<EventoAudit[]>({
    queryKey: ['eventos'],
    queryFn: async () => {
      const res = await api.get('/eventos');
      return res.data;
    }
  });

  // Filtros y búsqueda forense
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState(''); // '', 'HOY', '7_DIAS', '30_DIAS'

  // Modal de Detalle Forense
  const [selectedEvento, setSelectedEvento] = useState<EventoAudit | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtrado de eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      // 1. Filtro por Módulo / Entidad
      if (filtroEntidad && ev.entidad.toUpperCase() !== filtroEntidad.toUpperCase()) return false;

      // 2. Filtro por Acción
      if (filtroAccion && ev.accion.toUpperCase() !== filtroAccion.toUpperCase()) return false;

      // 3. Filtro por Severidad
      if (filtroSeveridad && ev.severidad !== filtroSeveridad) return false;

      // 4. Filtro por Tiempo
      if (filtroTiempo) {
        const fechaEvento = new Date(ev.fecha).getTime();
        const ahora = new Date().getTime();
        const diffHoras = (ahora - fechaEvento) / (1000 * 60 * 60);

        if (filtroTiempo === 'HOY' && diffHoras > 24) return false;
        if (filtroTiempo === '7_DIAS' && diffHoras > 24 * 7) return false;
        if (filtroTiempo === '30_DIAS' && diffHoras > 24 * 30) return false;
      }

      // 5. Búsqueda en vivo (por mensaje, responsable, objeto afectado, CI, IP)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const u = ev.usuario || {};
        const nomResp = `${u.grado || ''} ${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
        const ciResp = (u.ci || '').toLowerCase();
        const msj = (ev.mensaje || '').toLowerCase();
        const objAfectado = (ev.objeto_afectado || '').toLowerCase();
        const ip = (ev.ip || '').toLowerCase();
        const accion = (ev.accion || '').toLowerCase();
        const entidad = (ev.entidad || '').toLowerCase();

        if (
          !nomResp.includes(q) &&
          !ciResp.includes(q) &&
          !msj.includes(q) &&
          !objAfectado.includes(q) &&
          !ip.includes(q) &&
          !accion.includes(q) &&
          !entidad.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [eventos, filtroEntidad, filtroAccion, filtroSeveridad, filtroTiempo, searchQuery]);

  // Conteos de severidad
  const conteoSeveridad = useMemo(() => {
    const criticos = eventos.filter(e => e.severidad === 'CRITICA').length;
    const medios = eventos.filter(e => e.severidad === 'MEDIA').length;
    const bajos = eventos.filter(e => e.severidad === 'BAJA').length;
    return { criticos, medios, bajos, total: eventos.length };
  }, [eventos]);

  // Paginación
  const totalPages = Math.ceil((eventosFiltrados.length || 0) / itemsPerPage) || 1;
  const paginatedEventos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return eventosFiltrados.slice(start, start + itemsPerPage);
  }, [eventosFiltrados, currentPage, itemsPerPage]);

  // Exportar Auditoría a Excel
  const exportarAuditoriaExcel = () => {
    try {
      const dataParaExcel = eventosFiltrados.map((ev, index) => {
        const u = ev.usuario || {};
        const fechaFormateada = ev.fecha 
          ? format(new Date(ev.fecha), "yyyy-MM-dd HH:mm:ss") 
          : '-';

        return {
          'Nº': index + 1,
          'FECHA Y HORA': fechaFormateada,
          'SEVERIDAD': ev.severidad,
          'ACCIÓN': ev.accion,
          'MÓDULO': ev.entidad,
          'RESPONSABLE': `${u.grado ? u.grado + ' ' : ''}${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sistema',
          'CI RESPONSABLE': u.ci || 'S/N',
          'ROL': u.rol || 'SISTEMA',
          'OBJETO / CURSANTE AFECTADO': ev.objeto_afectado || 'N/A',
          'VALOR ANTERIOR': ev.valor_anterior !== null && ev.valor_anterior !== undefined ? String(ev.valor_anterior) : '-',
          'VALOR MODIFICADO': ev.valor_nuevo !== null && ev.valor_nuevo !== undefined ? String(ev.valor_nuevo) : '-',
          'DETALLES': ev.mensaje,
          'DIRECCIÓN IP': ev.ip || 'No capturada',
          'DISPOSITIVO': ev.dispositivo || 'N/A'
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataParaExcel);
      ws['!cols'] = [
        { wch: 6 },  // Nº
        { wch: 20 }, // Fecha
        { wch: 12 }, // Severidad
        { wch: 12 }, // Acción
        { wch: 14 }, // Módulo
        { wch: 26 }, // Responsable
        { wch: 14 }, // CI
        { wch: 14 }, // Rol
        { wch: 26 }, // Objeto afectado
        { wch: 18 }, // Valor anterior
        { wch: 18 }, // Valor nuevo
        { wch: 45 }, // Detalles
        { wch: 16 }, // IP
        { wch: 26 }, // Dispositivo
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Eventos");
      XLSX.writeFile(wb, `Libro_Auditoria_Eventos_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      showSuccess('Libro de auditoría exportado exitosamente');
    } catch (e) {
      console.error(e);
      showError('Error al exportar libro de auditoría');
    }
  };

  const getSeveridadBadge = (sev: 'CRITICA' | 'MEDIA' | 'BAJA') => {
    switch (sev) {
      case 'CRITICA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>Crítica</span>
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Media</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Informativa</span>
          </span>
        );
    }
  };

  const getAccionBadge = (accion: string) => {
    const acc = (accion || '').toUpperCase();
    if (acc === 'ELIMINAR') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">ELIMINAR</span>;
    }
    if (acc === 'EDITAR' || acc === 'ACTUALIZAR') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">MODIFICAR</span>;
    }
    if (acc === 'CREAR') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">CREAR</span>;
    }
    if (acc === 'LOGIN') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#0f2942] border border-slate-300">ACCESO</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{acc}</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL CON ACCIONES DE SEGURIDAD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
            Inspectoría Académica — Trazabilidad de Sistemas
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Registro de Eventos y Auditoría
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-800 border border-red-200 tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
              <span>Bitácora Inmutable</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro cronológico de actividades, modificaciones de calificaciones, sanciones disciplinarias y accesos al sistema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title="Actualizar registro"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={exportarAuditoriaExcel}
            className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>Exportar Libro de Auditoría (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE SEVERIDADES EN TIEMPO REAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setFiltroSeveridad(filtroSeveridad === 'CRITICA' ? '' : 'CRITICA')}
          className={`p-4 rounded-xl border border-t-4 border-t-red-700 transition-all cursor-pointer ${
            filtroSeveridad === 'CRITICA' 
              ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/20' 
              : 'bg-white border-slate-200 hover:border-red-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Críticos / Modificaciones</span>
            <ShieldAlert className="w-4 h-4 text-red-700" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-red-700 mt-1">{conteoSeveridad.criticos}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Notas modificadas, sanciones y borrados</p>
        </div>

        <div 
          onClick={() => setFiltroSeveridad(filtroSeveridad === 'MEDIA' ? '' : 'MEDIA')}
          className={`p-4 rounded-xl border border-t-4 border-t-amber-600 transition-all cursor-pointer ${
            filtroSeveridad === 'MEDIA' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' 
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Riesgo Medio</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-700 mt-1">{conteoSeveridad.medios}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Edición de usuarios e importaciones</p>
        </div>

        <div 
          onClick={() => setFiltroSeveridad(filtroSeveridad === 'BAJA' ? '' : 'BAJA')}
          className={`p-4 rounded-xl border border-t-4 border-t-slate-500 transition-all cursor-pointer ${
            filtroSeveridad === 'BAJA' 
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Informativos</span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-700 mt-1">{conteoSeveridad.bajos}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Inicios de sesión y registros iniciales</p>
        </div>

        <div 
          onClick={() => {
            setFiltroSeveridad('');
            setFiltroEntidad('');
            setFiltroAccion('');
            setFiltroTiempo('');
            setSearchQuery('');
          }}
          className="p-4 rounded-xl border border-t-4 border-t-[#0f2942] bg-white border-slate-200 hover:border-[#0f2942]/40 shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Auditado</span>
            <Clock className="w-4 h-4 text-[#0f2942]" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">{conteoSeveridad.total}</div>
          <p className="text-[10px] text-[#0f2942] font-bold mt-0.5">Ver todo el historial completo</p>
        </div>

      </div>

      {/* 3. BARRA DE FILTROS FORENSES AVANZADOS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          
          {/* Buscador inteligente */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por funcionario responsable, cursante afectado, IP, CI o detalle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Módulo / Entidad */}
          <div className="w-full md:w-44">
            <select
              value={filtroEntidad}
              onChange={(e) => setFiltroEntidad(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all cursor-pointer"
            >
              <option value="">Todos los Módulos</option>
              <option value="NOTA">Notas / Calificaciones</option>
              <option value="DISCIPLINA">Disciplina / Sanciones</option>
              <option value="USUARIO">Usuarios / Personal</option>
              <option value="INSCRIPCION">Matrículas</option>
              <option value="ACCESO">Accesos / Login</option>
              <option value="DIPLOMADO">Diplomados</option>
            </select>
          </div>

          {/* Filtro por Acción */}
          <div className="w-full md:w-40">
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all cursor-pointer"
            >
              <option value="">Todas las Acciones</option>
              <option value="CREAR">CREAR</option>
              <option value="EDITAR">MODIFICAR</option>
              <option value="ELIMINAR">ELIMINAR</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          {/* Filtro por Tiempo */}
          <div className="w-full md:w-36">
            <select
              value={filtroTiempo}
              onChange={(e) => setFiltroTiempo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] transition-all cursor-pointer"
            >
              <option value="">Cualquier fecha</option>
              <option value="HOY">Últimas 24 horas</option>
              <option value="7_DIAS">Últimos 7 días</option>
              <option value="30_DIAS">Últimos 30 días</option>
            </select>
          </div>

          {(searchQuery || filtroEntidad || filtroAccion || filtroSeveridad || filtroTiempo) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFiltroEntidad('');
                setFiltroAccion('');
                setFiltroSeveridad('');
                setFiltroTiempo('');
              }}
              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
              title="Restablecer filtros"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

        </div>
      </div>

      {/* 4. TABLA DE AUDITORÍA FORENSE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0f2942]" />
            <span className="text-xs font-bold">Cargando registros forenses de auditoría...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Severidad / Fecha y Hora
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Funcionario Responsable
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Acción y Módulo
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Detalle del Evento / Modificación
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Trazabilidad (IP / Equipo)
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Ficha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs">
                {paginatedEventos.map((ev) => {
                  const u = ev.usuario;
                  const fechaObj = new Date(ev.fecha);
                  const tieneDiff = (ev.valor_anterior !== null && ev.valor_anterior !== undefined) || (ev.valor_nuevo !== null && ev.valor_nuevo !== undefined);

                  return (
                    <tr 
                      key={ev.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        ev.severidad === 'CRITICA' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Severidad y Fecha/Hora exacta */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getSeveridadBadge(ev.severidad)}
                          <span className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                            {format(fechaObj, "dd/MM/yyyy HH:mm:ss")}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {format(fechaObj, "EEEE", { locale: es })}
                          </span>
                        </div>
                      </td>

                      {/* Funcionario Responsable */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {u ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.grado && (
                                <span className="text-[10px] font-bold text-[#0f2942] bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                  {u.grado}
                                </span>
                              )}
                              <span>{u.nombre} {u.apellido}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="font-bold text-[#0f2942]">{u.rol}</span>
                              {u.ci && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono tabular-nums">CI: {u.ci}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">
                            <span>Sistema Automático</span>
                          </div>
                        )}
                      </td>

                      {/* Acción y Módulo */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getAccionBadge(ev.accion)}
                          <span className="text-[11px] font-bold text-slate-700 mt-0.5">
                            {ev.entidad}
                          </span>
                        </div>
                      </td>

                      {/* Detalle y Comparativa Diff (Antes / Después) */}
                      <td className="px-5 py-3.5 max-w-md">
                        <div className="font-medium text-slate-800 leading-snug">
                          {ev.mensaje}
                        </div>

                        {/* Si hubo cambio de valores (Diff) */}
                        {tieneDiff && (
                          <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-[11px] font-mono tabular-nums flex-wrap">
                            <span className="font-bold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Antes: {String(ev.valor_anterior ?? 'N/A')}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                              Ahora: {String(ev.valor_nuevo ?? 'N/A')}
                            </span>
                          </div>
                        )}

                        {ev.objeto_afectado && !tieneDiff && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Afectado: {ev.objeto_afectado}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* IP y Dispositivo */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums font-bold text-slate-700">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.ip || '127.0.0.1'}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5 flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{ev.dispositivo || 'PC Institucional'}</span>
                        </div>
                      </td>

                      {/* Botón Ver Ficha Forense */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedEvento(ev)}
                          className="p-1.5 text-slate-500 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Ver ficha forense completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}

                {eventosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <ShieldCheck className="w-8 h-8 text-slate-300" />
                        <h4 className="text-sm font-bold text-slate-800">No se encontraron eventos auditados</h4>
                        <p className="text-xs text-slate-400">
                          No existen registros que coincidan con los criterios de filtrado seleccionados.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && eventosFiltrados.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <span className="font-bold font-mono tabular-nums text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-bold font-mono tabular-nums text-slate-800">
                {Math.min(currentPage * itemsPerPage, eventosFiltrados.length)}
              </span>{' '}
              de <span className="font-bold font-mono tabular-nums text-slate-800">{eventosFiltrados.length}</span> eventos auditados
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                Anterior
              </button>
              <span className="px-2 text-xs font-bold font-mono tabular-nums text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL DE DETALLE FORENSE DEL EVENTO */}
      {selectedEvento && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header del Modal Forense */}
            <div className={`p-5 text-white flex items-center justify-between ${
              selectedEvento.severidad === 'CRITICA' 
                ? 'bg-red-950 border-b border-red-900' 
                : 'bg-[#0f2942] border-b border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-tight">Ficha de Auditoría Forense</h3>
                    {getSeveridadBadge(selectedEvento.severidad)}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-mono tabular-nums">
                    ID de Registro: #{selectedEvento.id} • {selectedEvento.entidad} • {selectedEvento.accion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvento(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Modal Forense */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50/50 text-xs">
              
              {/* Bloque 1: Responsable del Evento */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Funcionario Responsable de la Acción
                </span>
                {selectedEvento.usuario ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        {selectedEvento.usuario.grado && (
                          <span className="text-xs bg-slate-100 text-[#0f2942] border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                            {selectedEvento.usuario.grado}
                          </span>
                        )}
                        <span>{selectedEvento.usuario.nombre} {selectedEvento.usuario.apellido}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Rol: <span className="font-bold text-[#0f2942]">{selectedEvento.usuario.rol}</span> • CI: <span className="font-mono tabular-nums">{selectedEvento.usuario.ci || 'S/N'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono tabular-nums text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                      UID: #{selectedEvento.usuario.id}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Acción ejecutada automáticamente por el sistema</span>
                )}
              </div>

              {/* Bloque 2: Trazabilidad Técnica (IP y Dispositivo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Dirección IP de Conexión</span>
                  </span>
                  <span className="font-mono tabular-nums text-sm font-bold text-slate-800 mt-1 block">
                    {selectedEvento.ip || '127.0.0.1 (Localhost / Red Interna)'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Laptop className="w-3 h-3 text-slate-400" />
                    <span>Dispositivo / Sistema</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">
                    {selectedEvento.dispositivo || 'PC Institucional / Navegador Web'}
                  </span>
                </div>
              </div>

              {/* Bloque 3: Comparativa Diff de Modificación (Si hubo cambio) */}
              {((selectedEvento.valor_anterior !== null && selectedEvento.valor_anterior !== undefined) || 
                (selectedEvento.valor_nuevo !== null && selectedEvento.valor_nuevo !== undefined)) && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auditoría de Valores Modificados (Antes vs Después)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                      <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Valor Anterior</span>
                      <div className="text-sm font-black font-mono tabular-nums text-red-900 mt-1">
                        {String(selectedEvento.valor_anterior ?? 'Sin valor previo')}
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Valor Nuevo Registrado</span>
                      <div className="text-sm font-black font-mono tabular-nums text-teal-900 mt-1">
                        {String(selectedEvento.valor_nuevo ?? 'Modificado')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloque 4: Objeto / Cursante Afectado */}
              {selectedEvento.objeto_afectado && (
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cursante u Objeto Afectado
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {selectedEvento.objeto_afectado}
                  </span>
                </div>
              )}

              {/* Bloque 5: Detalles Completos del Evento */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Descripción Oficial del Evento
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedEvento.mensaje}
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Marca de tiempo ISO: <span className="font-mono tabular-nums">{selectedEvento.fecha}</span>
                </div>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Registro inmutable garantizado por base de datos
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvento(null)}
                className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
