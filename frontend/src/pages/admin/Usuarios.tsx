import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { UserNotasModal } from '../../components/UserNotasModal';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Download, 
  X, 
  RefreshCw, 
  GraduationCap, 
  BookOpen, 
  Shield, 
  ClipboardCheck, 
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Key,
  Unlock,
  UserX,
  UserCheck,
  ShieldAlert,
  Check
} from 'lucide-react';
import { showSuccess, showError, showConfirmDelete } from '../../utils/alerts';

interface FilaUsuarioExcel {
  fila: number;
  grado: string;
  nombre: string;
  apellido: string;
  ci: string;
  cm: string;
  email: string;
  telefono: string;
  promocion: string;
  rol: string;
  estadoClasificacion: 'NUEVO' | 'EXISTENTE' | 'INVALIDO';
  mensaje: string;
}

export function Usuarios() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingNotasForUser, setViewingNotasForUser] = useState<any>(null);
  const [isModalImportarOpen, setIsModalImportarOpen] = useState(false);

  // Estados de importación Excel
  const [filasExcel, setFilasExcel] = useState<FilaUsuarioExcel[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [filtroAcademico, setFiltroAcademico] = useState(''); // 'TODOS', 'MATRICULADOS', 'SIN_MATRICULA'
  const [estadoFilter, setEstadoFilter] = useState(''); // '', 'ACTIVOS', 'BAJAS', 'BLOQUEADOS'

  // Seguridad y Bajas Institucionales
  const [modalBajaUser, setModalBajaUser] = useState<any>(null);
  const [motivoBaja, setMotivoBaja] = useState('Baja administrativa');
  const [passwordCopiada, setPasswordCopiada] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, filtroAcademico, estadoFilter]);

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const generarContrasenaSegura = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const pass = `Ecema.${new Date().getFullYear()}.${rand}`;
    setValue('password', pass);
    navigator.clipboard.writeText(pass);
    setPasswordCopiada(true);
    setTimeout(() => setPasswordCopiada(false), 3000);
    showSuccess(`Contraseña segura generada: ${pass}`);
  };

  // Carga de usuarios con relaciones (información cruzada)
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  // Watchers para validación en tiempo real de duplicados
  const watchCi = watch('ci');
  const watchEmail = watch('email');
  const watchCm = watch('cm');

  // Detección preventiva de duplicados en tiempo real
  const duplicateCiUser = useMemo(() => {
    if (!watchCi || !watchCi.trim()) return null;
    const clean = watchCi.toString().trim();
    return users?.find((u: any) => u.ci && u.ci.toString().trim() === clean && (!editingUser || u.id !== editingUser.id)) || null;
  }, [watchCi, users, editingUser]);

  const duplicateEmailUser = useMemo(() => {
    if (!watchEmail || !watchEmail.trim()) return null;
    const clean = watchEmail.trim().toLowerCase();
    return users?.find((u: any) => u.email && u.email.toLowerCase() === clean && (!editingUser || u.id !== editingUser.id)) || null;
  }, [watchEmail, users, editingUser]);

  const duplicateCmUser = useMemo(() => {
    if (!watchCm || !watchCm.trim()) return null;
    const clean = watchCm.trim().toUpperCase();
    return users?.find((u: any) => u.cm && u.cm.toString().trim().toUpperCase() === clean && (!editingUser || u.id !== editingUser.id)) || null;
  }, [watchCm, users, editingUser]);

  // Mutaciones
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-cursantes'] });
      closeForm();
      showSuccess('Usuario creado exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al crear usuario');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/users/${editingUser.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-cursantes'] });
      closeForm();
      showSuccess('Usuario actualizado exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al actualizar usuario');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, activo, motivo }: { id: number; activo: boolean; motivo?: string }) => {
      const res = await api.patch(`/users/${id}/status`, { activo, motivo_inactivacion: motivo });
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalBajaUser(null);
      showSuccess(data.activo ? 'Cuenta reactivada exitosamente' : 'Baja Institucional aplicada correctamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al cambiar estado de la cuenta');
    }
  });

  const desbloquearMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/users/${id}/desbloquear`);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess(data.message || 'Cuenta desbloqueada exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al desbloquear la cuenta');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-cursantes'] });
      if (data?.softDeleted) {
        showSuccess(data.message || 'Se aplicó Baja Institucional preventiva para proteger el historial académico.');
      } else {
        showSuccess('Usuario eliminado exitosamente');
      }
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al procesar la baja del usuario');
    }
  });

  const importarUsuariosMutation = useMutation({
    mutationFn: async (payload: { usuarios: any[] }) => {
      const res = await api.post('/users/importar-usuarios', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-cursantes'] });
      setIsModalImportarOpen(false);
      setFilasExcel([]);
      setNombreArchivo('');
      showSuccess(data.message || 'Usuarios importados exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al importar usuarios');
    }
  });

  const handleDelete = async (u: any) => {
    const isConfirmed = await showConfirmDelete(`${u.grado ? u.grado + ' ' : ''}${u.nombre} ${u.apellido}`);
    if (isConfirmed) {
      deleteUserMutation.mutate(u.id);
    }
  };

  const onSubmit = (data: any) => {
    if (duplicateCiUser) {
      showError(`El CI ingresado ya pertenece a ${duplicateCiUser.nombre} ${duplicateCiUser.apellido}`);
      return;
    }
    if (duplicateEmailUser) {
      showError(`El correo ingresado ya está en uso`);
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate(data);
    } else {
      createUserMutation.mutate(data);
    }
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    reset({
      grado: u.grado || '',
      nombre: u.nombre,
      apellido: u.apellido,
      ci: u.ci || '',
      cm: u.cm || '',
      promocion: u.promocion || '',
      email: u.email,
      rol: u.rol,
      telefono: u.telefono || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset({
      grado: '',
      nombre: '',
      apellido: '',
      ci: '',
      cm: '',
      promocion: '',
      email: '',
      rol: 'CURSANTE',
      telefono: '',
      password: ''
    });
  };

  // -------------------------------------------------------------
  // LÓGICA DE IMPORTACIÓN MASIVA GENERAL EN USUARIOS
  // -------------------------------------------------------------
  const descargarPlantillaUsuarios = () => {
    const datosEjemplo = [
      {
        'GRADO': 'Cap.',
        'NOMBRE': 'Juan Carlos',
        'APELLIDO': 'Pérez Quispe',
        'CI': '4829102',
        'CODIGO_MILITAR': 'CM-48291',
        'EMAIL': 'juan.perez@mil.bo',
        'TELEFONO': '71234567',
        'PROMOCION': '2019',
        'ROL': 'CURSANTE'
      },
      {
        'GRADO': 'My.',
        'NOMBRE': 'Fernando',
        'APELLIDO': 'Gutiérrez Morales',
        'CI': '3948102',
        'CODIGO_MILITAR': 'CM-39481',
        'EMAIL': 'fernando.gutierrez@mil.bo',
        'TELEFONO': '72345678',
        'PROMOCION': '2015',
        'ROL': 'DOCENTE'
      },
      {
        'GRADO': 'Tte.',
        'NOMBRE': 'Carla',
        'APELLIDO': 'Rojas Salazar',
        'CI': '5839201',
        'CODIGO_MILITAR': 'CM-58392',
        'EMAIL': 'carla.rojas@mil.bo',
        'TELEFONO': '73456789',
        'PROMOCION': '2022',
        'ROL': 'EVALUADOR'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(datosEjemplo);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'Plantilla_Usuarios_General.xlsx');
  };

  const procesarArchivoExcelUsuarios = (file: File) => {
    setNombreArchivo(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          showError('El archivo Excel está vacío');
          return;
        }

        const clasificados: FilaUsuarioExcel[] = rawRows.map((row, index) => {
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
          const ci = getVal(['CI', 'C I', 'CARNET', 'CEDULA', 'DOCUMENTO']).replace(/[^0-9a-zA-Z]/g, '');
          const cm = getVal(['CODIGO MILITAR', 'CODIGO_MILITAR', 'CM', 'CODIGO']);
          const email = getVal(['EMAIL', 'CORREO', 'CORREO ELECTRONICO', 'E MAIL']).toLowerCase();
          const telefono = getVal(['TELEFONO', 'CELULAR', 'TEL']);
          const promocion = getVal(['PROMOCION', 'PROMOCIÓN', 'AÑO']);
          const rol = getVal(['ROL', 'TIPO_USUARIO', 'CARGO']).toUpperCase() || 'CURSANTE';

          if (!nombre && !ci) {
            return {
              fila: index + 2,
              grado, nombre, apellido, ci, cm, email, telefono, promocion, rol,
              estadoClasificacion: 'INVALIDO',
              mensaje: 'Falta Nombre o CI'
            };
          }

          // Verificar si ya existe en la base de datos
          const yaExiste = users.find((u: any) => 
            (ci && u.ci && u.ci.toString().trim() === ci) ||
            (cm && u.cm && u.cm.toString().trim().toUpperCase() === cm.toUpperCase()) ||
            (email && u.email && u.email.toLowerCase() === email)
          );

          if (yaExiste) {
            return {
              fila: index + 2,
              grado: yaExiste.grado || grado,
              nombre: yaExiste.nombre || nombre,
              apellido: yaExiste.apellido || apellido,
              ci: yaExiste.ci || ci,
              cm: yaExiste.cm || cm,
              email: yaExiste.email || email,
              telefono: yaExiste.telefono || telefono,
              promocion: yaExiste.promocion || promocion,
              rol: yaExiste.rol,
              estadoClasificacion: 'EXISTENTE',
              mensaje: `Ya registrado (${yaExiste.rol}) - se omitirá`
            };
          }

          return {
            fila: index + 2,
            grado, nombre, apellido, ci, cm, email, telefono, promocion, rol,
            estadoClasificacion: 'NUEVO',
            mensaje: 'Nuevo usuario a registrar'
          };
        });

        setFilasExcel(clasificados);
      } catch (err) {
        showError('Error al leer el archivo Excel');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Filtrado de usuarios con lógica cruzada
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      // 1. Filtro por Rol
      if (roleFilter && u.rol !== roleFilter) return false;

      // 2. Filtro por Estado Institucional (Seguridad / Bajas / Bloqueos)
      if (estadoFilter === 'ACTIVOS' && !u.activo) return false;
      if (estadoFilter === 'BAJAS' && u.activo) return false;
      if (estadoFilter === 'BLOQUEADOS') {
        const isBlocked = u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date();
        if (!isBlocked) return false;
      }

      // 3. Filtro Académico (Cursantes Matriculados vs Disponibles)
      if (filtroAcademico) {
        const tieneMatriculaActiva = u.inscripciones?.some((ins: any) => ins.estado === 'ACTIVO');
        if (filtroAcademico === 'MATRICULADOS' && !tieneMatriculaActiva) return false;
        if (filtroAcademico === 'SIN_MATRICULA' && tieneMatriculaActiva) return false;
      }

      // 4. Filtro por Búsqueda (Nombre, Apellido, CI, CM, Email, Grado)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchString = `${u.grado || ''} ${u.nombre} ${u.apellido} ${u.email} ${u.ci || ''} ${u.cm || ''}`.toLowerCase();
        if (!searchString.includes(q)) return false;
      }

      return true;
    });
  }, [users, roleFilter, estadoFilter, filtroAcademico, searchQuery]);

  const totalPages = Math.ceil((filteredUsers.length || 0) / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Comando y Administración • Recursos Humanos
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Directorio de Personal y Usuarios
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
              Seguridad y Accesos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de cuentas institucionales, asignación de roles y seguimiento de situación académica.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button 
            onClick={() => {
              setFilasExcel([]);
              setNombreArchivo('');
              setIsModalImportarOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Importar Nómina (Excel)</span>
          </button>

          <button 
            onClick={() => {
              setEditingUser(null);
              reset({ grado: '', nombre: '', apellido: '', ci: '', cm: '', promocion: '', email: '', rol: 'CURSANTE', telefono: '', password: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Usuario</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y FILTROS CRUZADOS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido, CI, Código Militar o correo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all"
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

        {/* Filtro por Rol */}
        <div className="w-full md:w-48">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer"
          >
            <option value="">Todos los roles</option>
            <option value="CURSANTE">Cursantes</option>
            <option value="DOCENTE">Docentes</option>
            <option value="EVALUADOR">Evaluadores</option>
            <option value="INSTRUCCION">Instrucción (Disciplina)</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>

        {/* Filtro por Estado Institucional */}
        <div className="w-full md:w-52">
          <select 
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer"
          >
            <option value="">Estado: Todos</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="BAJAS">Bajas Institucionales</option>
            <option value="BLOQUEADOS">Bloqueados por Seguridad</option>
          </select>
        </div>

        {/* Filtro Académico Cruzado (Para cursantes) */}
        {(!roleFilter || roleFilter === 'CURSANTE') && (
          <div className="w-full md:w-56">
            <select
              value={filtroAcademico}
              onChange={(e) => setFiltroAcademico(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] transition-all cursor-pointer"
            >
              <option value="">Estado Académico: Todos</option>
              <option value="MATRICULADOS">Matriculados Activos (En Curso)</option>
              <option value="SIN_MATRICULA">Sin Matrícula (Disponibles)</option>
            </select>
          </div>
        )}

        {(searchQuery || roleFilter || filtroAcademico || estadoFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('');
              setFiltroAcademico('');
              setEstadoFilter('');
            }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Restablecer filtros"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

      </div>

      {/* 3. TABLA DE USUARIOS CON INFORMACIÓN CRUZADA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0f2942]" />
            <span className="text-xs font-bold">Cargando directorio de personal...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Efectivo / Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Identificación Militar
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Rol Institucional
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Asignación / Situación Académica
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedUsers.map((u: any) => {
                  const ultimaInsc = u.inscripciones?.[0];
                  const tieneMatriculaActiva = u.inscripciones?.some((i: any) => i.estado === 'ACTIVO');

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Usuario con Grado y Foto */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setViewingUser(u)}
                          title="Ver ficha institucional completa"
                        >
                          <div className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center text-xs border transition-colors ${
                            !u.activo ? 'bg-red-50 text-red-700 border-red-200' :
                            (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-[#0f2942] border-slate-200 group-hover:bg-[#0f2942] group-hover:text-white'
                          }`}>
                            {u.foto_url ? (
                              <img src={u.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <>{u.grado || u.nombre?.[0] || 'U'}</>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#0f2942] transition-colors flex items-center gap-1.5">
                              {u.grado && (
                                <span className="text-[10px] font-bold text-[#0f2942] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {u.grado}
                                </span>
                              )}
                              <span>{u.nombre} {u.apellido}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {u.email}
                            </div>
                            {!u.activo && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                  <UserX className="w-2.5 h-2.5" />
                                  <span>Baja Institucional</span>
                                </span>
                                {u.motivo_inactivacion && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={u.motivo_inactivacion}>
                                    ({u.motivo_inactivacion})
                                  </span>
                                )}
                              </div>
                            )}
                            {u.activo && u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date() && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Bloqueado (Fuerza Bruta)</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Documentos (CI / CM) */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono tabular-nums">
                        <div className="font-bold text-slate-800">
                          CI: <span className="font-medium text-slate-600">{u.ci || 'S/N'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          CM: <span className="font-medium text-slate-600">{u.cm || '-'}</span>
                          {u.promocion && <span className="ml-2 text-slate-400">({u.promocion})</span>}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          u.rol === 'ADMIN' ? 'bg-[#0f2942] text-white border-[#0f2942]' :
                          u.rol === 'DOCENTE' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                          u.rol === 'EVALUADOR' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          u.rol === 'INSTRUCCION' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-teal-50 text-teal-800 border-teal-200'
                        }`}>
                          {u.rol}
                        </span>
                      </td>

                      {/* INFORMACIÓN CRUZADA: Asignación Académica en tiempo real */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                        {u.rol === 'CURSANTE' ? (
                          tieneMatriculaActiva && ultimaInsc ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                              <div>
                                <div className="font-bold text-slate-900">
                                  {ultimaInsc.edicion?.diplomado?.nombre || 'Diplomado Activo'}
                                </div>
                                <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 font-mono tabular-nums">
                                  <span>Gestión {ultimaInsc.edicion?.periodo?.gestion}</span>
                                  {ultimaInsc.edicion?.periodo?.semestre && <span>(S{ultimaInsc.edicion.periodo.semestre})</span>}
                                  <span className="text-[10px] font-sans bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-bold ml-1">
                                    {ultimaInsc.estado}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                <span>Sin Matrícula Activa</span>
                              </span>
                              <button
                                onClick={() => navigate('/dashboard/inscripciones')}
                                className="text-[11px] font-bold text-[#0f2942] hover:underline cursor-pointer flex items-center gap-0.5"
                                title="Ir a matricular cursante"
                              >
                                <span>+ Matricular</span>
                              </button>
                            </div>
                          )
                        ) : u.rol === 'DOCENTE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold font-mono tabular-nums">
                            <BookOpen className="w-3.5 h-3.5 text-[#0f2942]" />
                            <span>{u.materias_asignadas?.length || 0} asignatura(s)</span>
                          </span>
                        ) : u.rol === 'EVALUADOR' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold font-mono tabular-nums">
                            <ClipboardCheck className="w-3.5 h-3.5 text-[#0f2942]" />
                            <span>{u.materias_evaluadas?.length || 0} asignatura(s)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Comando y Administración
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {/* Desbloqueo de fuerza bruta si aplica */}
                          {u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date() && (
                            <button
                              onClick={() => desbloquearMutation.mutate(u.id)}
                              disabled={desbloquearMutation.isPending}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Desbloquear cuenta bloqueada por seguridad"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Baja Institucional / Reactivación */}
                          {u.activo ? (
                            <button
                              onClick={() => {
                                setModalBajaUser(u);
                                setMotivoBaja('Baja administrativa institucional');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Dar de Baja Institucional (Inactivar cuenta)"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: u.id, activo: true })}
                              disabled={updateStatusMutation.isPending}
                              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Reactivar Cuenta Institucional"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {u.rol === 'CURSANTE' && (
                            <button
                              onClick={() => setViewingNotasForUser(u)}
                              className="p-1.5 text-[#0f2942] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Ver Kardex / Resumen de Notas"
                            >
                              <GraduationCap className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha y Historial"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-[#0f2942] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar / Baja Institucional"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <Users className="w-8 h-8 text-slate-300" />
                        <h4 className="text-sm font-bold text-slate-800">No se encontraron usuarios</h4>
                        <p className="text-xs text-slate-400">
                          No existen registros que coincidan con los filtros seleccionados.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación Inferior */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <span className="font-mono tabular-nums font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-mono tabular-nums font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span>{' '}
              de <span className="font-mono tabular-nums font-bold text-slate-800">{filteredUsers.length}</span> usuarios
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

      {/* 4. MODAL CREAR / EDITAR USUARIO (CON VALIDACIÓN PREVENTIVA DE DUPLICADOS) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            
            <div className="px-6 py-4 bg-[#0f2942] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center font-bold border border-white/15">
                  {editingUser ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? 'Editar Cuenta de Usuario' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Complete los datos de identificación del personal institucional.
                  </p>
                </div>
              </div>
              <button onClick={closeForm} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Alerta Preventiva si el CI ya existe */}
              {duplicateCiUser && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Conflicto de CI detectado:</span> El número de CI <span className="underline font-mono font-bold">{watchCi}</span> ya está registrado a nombre de:
                    <div className="font-bold text-red-900 mt-0.5">
                      {duplicateCiUser.grado ? duplicateCiUser.grado + ' ' : ''}{duplicateCiUser.nombre} {duplicateCiUser.apellido} (Rol: {duplicateCiUser.rol})
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta Preventiva si el Email ya existe */}
              {duplicateEmailUser && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Correo electrónico en uso:</span> El email <span className="underline font-bold">{watchEmail}</span> ya pertenece a otro usuario en el sistema.
                  </div>
                </div>
              )}

              {/* Grado y Rol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Grado Militar
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cap., Tte., My., Sof."
                    {...register('grado')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Rol Institucional
                  </label>
                  <select 
                    {...register('rol', { required: true })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] cursor-pointer"
                  >
                    <option value="CURSANTE">CURSANTE</option>
                    <option value="DOCENTE">DOCENTE</option>
                    <option value="EVALUADOR">EVALUADOR</option>
                    <option value="INSTRUCCION">INSTRUCCIÓN (DISCIPLINA)</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nombres oficiales"
                    {...register('nombre', { required: true })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Apellidos *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Apellidos oficiales"
                    {...register('apellido', { required: true })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>
              </div>

              {/* CI y Código Militar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Cédula de Identidad (CI) *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 4829102"
                    {...register('ci', { required: true })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono font-medium focus:outline-none transition-all ${
                      duplicateCiUser ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Código Militar (CM)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: CM-48291"
                    {...register('cm')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>
              </div>

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Correo Electrónico (Login) *
                  </label>
                  <input 
                    type="email" 
                    placeholder="correo@ejemplo.com"
                    {...register('email', { required: true })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-medium focus:outline-none transition-all ${
                      duplicateEmailUser ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Teléfono / Celular
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 71234567"
                    {...register('telefono')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>
              </div>

              {/* Promoción y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Promoción
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 2019"
                    {...register('promocion')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña de Acceso *'}
                    </label>
                    <button
                      type="button"
                      onClick={generarContrasenaSegura}
                      className="text-[11px] font-bold text-[#0f2942] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Generar contraseña institucional segura y copiar al portapapeles"
                    >
                      {passwordCopiada ? <Check className="w-3 h-3 text-teal-700" /> : <Key className="w-3 h-3" />}
                      <span className={passwordCopiada ? 'text-teal-700' : ''}>
                        {passwordCopiada ? '¡Copiada!' : 'Generar Segura'}
                      </span>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder={editingUser ? 'Dejar en blanco para mantener' : 'Ej: Ecema.2026.K8x'}
                    {...register('password', { required: !editingUser })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Mínimo 6 caracteres. Puede generar una clave institucional y compartirla con el efectivo.</p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending || !!duplicateCiUser || !!duplicateEmailUser}
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {createUserMutation.isPending || updateUserMutation.isPending ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BAJA INSTITUCIONAL */}
      {modalBajaUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-800/80 rounded-lg border border-red-700">
                  <ShieldAlert className="w-5 h-5 text-red-200" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Baja Institucional</h3>
                  <p className="text-xs text-red-200 font-medium">Inactivación segura de cuenta</p>
                </div>
              </div>
              <button
                onClick={() => setModalBajaUser(null)}
                className="text-red-300 hover:text-white p-1 rounded-lg hover:bg-red-800/60 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-xs text-red-900 space-y-1">
                <p className="font-bold">
                  ¿Está seguro de dar de baja a {modalBajaUser.grado ? modalBajaUser.grado + ' ' : ''}{modalBajaUser.nombre} {modalBajaUser.apellido}?
                </p>
                <p className="text-[11px] text-red-700">
                  Esta acción bloqueará de inmediato el acceso al sistema, pero resguardará todo su historial de calificaciones, asignaciones y matrículas sin eliminar actas históricas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Baja Institucional *
                </label>
                <select
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="Baja administrativa institucional">Baja administrativa institucional</option>
                  <option value="Retiro voluntario">Retiro voluntario</option>
                  <option value="Baja académica por reprobación">Baja académica por reprobación</option>
                  <option value="Sanción disciplinaria">Sanción disciplinaria</option>
                  <option value="Traslado de destino militar">Traslado de destino militar</option>
                  <option value="Término de funciones docentes/evaluadoras">Término de funciones</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBajaUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => updateStatusMutation.mutate({ id: modalBajaUser.id, activo: false, motivo: motivoBaja })}
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  <span>{updateStatusMutation.isPending ? 'Procesando...' : 'Confirmar Baja'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL VER PERFIL E HISTORIAL ACADÉMICO CRUZADO */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Cabecera del Perfil */}
            <div className="p-5 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center text-base font-black border border-white/15">
                  {viewingUser.grado || viewingUser.nombre?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {viewingUser.grado && <span className="text-amber-300 mr-1.5">{viewingUser.grado}</span>}
                    {viewingUser.nombre} {viewingUser.apellido}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-amber-300 border border-white/15">
                      {viewingUser.rol}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-300">{viewingUser.email}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Datos Personales y Militares */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-50/50">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CI</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-800 mt-0.5 block">{viewingUser.ci || 'No registrado'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código Militar</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-800 mt-0.5 block">{viewingUser.cm || 'No registrado'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Promoción</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-800 mt-0.5 block">{viewingUser.promocion || 'Sin dato'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teléfono</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-800 mt-0.5 block">{viewingUser.telefono || 'Sin dato'}</span>
                </div>
              </div>

              {/* SECCIÓN INFORMACIÓN CRUZADA: HISTORIAL ACADÉMICO */}
              {viewingUser.rol === 'CURSANTE' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#0f2942]" />
                      <span>Historial de Diplomados e Inscripciones</span>
                    </h4>
                    <span className="text-xs font-bold font-mono tabular-nums text-[#0f2942] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {viewingUser.inscripciones?.length || 0} registro(s)
                    </span>
                  </div>

                  {viewingUser.inscripciones && viewingUser.inscripciones.length > 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
                      {viewingUser.inscripciones.map((ins: any) => (
                        <div key={ins.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60">
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {ins.edicion?.diplomado?.nombre}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                              Gestión {ins.edicion?.periodo?.gestion} {ins.edicion?.periodo?.semestre ? `(Semestre ${ins.edicion?.periodo?.semestre})` : ''} • Inscrito: {ins.fecha_inscripcion ? new Date(ins.fecha_inscripcion).toLocaleDateString() : '-'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              ins.estado === 'ACTIVO' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                              ins.estado === 'EGRESADO' ? 'bg-slate-100 text-[#0f2942] border-slate-300' :
                              'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {ins.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-lg border border-slate-200 text-center">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Este cursante no cuenta con matrículas registradas</p>
                      <button
                        onClick={() => {
                          setViewingUser(null);
                          navigate('/dashboard/inscripciones');
                        }}
                        className="mt-2 text-xs font-bold text-[#0f2942] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ir a Matricular Cursantes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botones del Modal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                {viewingUser.rol === 'CURSANTE' && (
                  <button
                    onClick={() => {
                      const u = viewingUser;
                      setViewingUser(null);
                      setViewingNotasForUser(u);
                    }}
                    className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 mr-auto cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                    <span>Ver Resumen de Notas</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    openEdit(u);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f2942] font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-[#0f2942]" />
                  <span>Editar Usuario</span>
                </button>

                <button
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL IMPORTACIÓN MASIVA DE USUARIOS (EXCEL) */}
      {isModalImportarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0f2942] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-300 border border-white/15 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Alta Masiva de Usuarios desde Excel
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Importe listas completas de cursantes, docentes o evaluadores con validación automática de duplicados.
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

            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/40">
              
              <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Plantilla Excel Oficial de Usuarios</span>
                  <span className="text-[11px] text-slate-500">Incluye columnas: GRADO, NOMBRE, APELLIDO, CI, CODIGO_MILITAR, EMAIL, TELEFONO, PROMOCION, ROL</span>
                </div>
                <button
                  type="button"
                  onClick={descargarPlantillaUsuarios}
                  className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-teal-700" />
                  <span>Descargar Plantilla (.xlsx)</span>
                </button>
              </div>

              {filasExcel.length === 0 ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) procesarArchivoExcelUsuarios(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging 
                      ? 'border-[#0f2942] bg-slate-100/50' 
                      : 'border-slate-300 hover:border-[#0f2942] bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) procesarArchivoExcelUsuarios(file);
                    }}
                  />
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0f2942] flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Arrastre su archivo Excel aquí o haga clic para seleccionarlo</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Soporta formatos .xlsx, .xls y .csv</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-xs font-bold text-slate-900">
                      Archivo: <span className="text-[#0f2942]">{nombreArchivo}</span> (<span className="font-mono tabular-nums">{filasExcel.length}</span> filas detectadas)
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFilasExcel([]); setNombreArchivo(''); }}
                      className="text-xs font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-3.5 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Fila</th>
                          <th className="px-3.5 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Usuario</th>
                          <th className="px-3.5 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">CI / CM</th>
                          <th className="px-3.5 py-2 text-center font-bold text-slate-600 uppercase tracking-wider text-[10px]">Rol</th>
                          <th className="px-3.5 py-2 text-center font-bold text-slate-600 uppercase tracking-wider text-[10px]">Estado Detección</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filasExcel.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="px-3.5 py-2 text-slate-400 font-mono tabular-nums text-[11px]">#{f.fila}</td>
                            <td className="px-3.5 py-2 font-bold text-slate-900">
                              {f.grado && <span className="text-[#0f2942] bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[10px] mr-1">{f.grado}</span>}
                              <span>{f.nombre} {f.apellido}</span>
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 font-mono tabular-nums">CI: {f.ci || 'S/N'}</td>
                            <td className="px-3.5 py-2 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {f.rol}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-center">
                              {f.estadoClasificacion === 'NUEVO' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                  Nuevo (Se creará)
                                </span>
                              )}
                              {f.estadoClasificacion === 'EXISTENTE' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                  Ya registrado (Se omitirá)
                                </span>
                              )}
                              {f.estadoClasificacion === 'INVALIDO' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                                  Incompleto
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                <strong className="font-mono tabular-nums text-slate-700">{filasExcel.filter(f => f.estadoClasificacion === 'NUEVO').length}</strong> nuevos usuarios listos para dar de alta.
              </span>
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
                    onClick={() => {
                      const validos = filasExcel.filter(f => f.estadoClasificacion === 'NUEVO');
                      if (validos.length === 0) {
                        showError('No hay usuarios nuevos para registrar en el archivo');
                        return;
                      }
                      importarUsuariosMutation.mutate({ usuarios: validos });
                    }}
                    disabled={importarUsuariosMutation.isPending || filasExcel.filter(f => f.estadoClasificacion === 'NUEVO').length === 0}
                    className="flex items-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {importarUsuariosMutation.isPending ? 'Procesando...' : `Confirmar Alta (${filasExcel.filter(f => f.estadoClasificacion === 'NUEVO').length})`}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Ver Notas del Cursante */}
      {viewingNotasForUser && (
        <UserNotasModal 
          user={viewingNotasForUser} 
          onClose={() => setViewingNotasForUser(null)} 
        />
      )}

    </div>
  );
}
