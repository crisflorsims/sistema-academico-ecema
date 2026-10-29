import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import api from './services/api';
import { useAuthStore } from './store/authStore';
import { GestorCalificaciones } from './pages/docente/GestorCalificaciones';
import { Dashboard } from './pages/admin/Dashboard';
import { Usuarios } from './pages/admin/Usuarios';
import { Diplomas } from './pages/admin/Diplomas';
import { PeriodosEdiciones } from './pages/admin/PeriodosEdiciones';
import { Inscripciones } from './pages/admin/Inscripciones';
import { AsignacionesDocentes } from './pages/admin/AsignacionesDocentes';
import { AsignacionesEvaluadores } from './pages/admin/AsignacionesEvaluadores';
import { Reportes } from './pages/admin/Reportes';
import PonderacionFinal from './pages/evaluador/PonderacionFinal';
import { MisNotas } from './pages/estudiante/MisNotas';
import { Perfil } from './pages/estudiante/Perfil';
import { Eventos } from './pages/admin/Eventos';
import { DisciplinaDashboard } from './pages/admin/DisciplinaDashboard';
import { MiDisciplina } from './pages/estudiante/MiDisciplina';
import { MiPonderacionFinal } from './pages/estudiante/MiPonderacionFinal';
import { 
  LayoutDashboard, Users, GraduationCap, CalendarDays, UserPlus, 
  BookOpen, ClipboardCheck, BarChart2, Calendar, ShieldAlert, UserCircle, LogOut, Menu, ChevronDown,
  Mail, Lock, ArrowRight, ShieldCheck, Award
} from 'lucide-react';

function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenu = [
    { category: 'Principal' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reportes y Est.', path: '/dashboard/reportes', icon: BarChart2 },
    
    { category: 'Gestión Académica' },
    { name: 'Diplomados', path: '/dashboard/diplomados', icon: GraduationCap },
    { name: 'Gestiones y Edic.', path: '/dashboard/periodos', icon: CalendarDays },
    { name: 'Matricular', path: '/dashboard/inscripciones', icon: UserPlus },
    
    { category: 'Personal y Roles' },
    { name: 'Usuarios', path: '/dashboard/usuarios', icon: Users },
    { 
      name: 'Docentes', 
      path: '/dashboard/docentes',
      icon: BookOpen,
      subItems: [
        { name: 'DCEMA', path: '/dashboard/docentes?filtro=DCEMA' },
        { name: 'DCEA', path: '/dashboard/docentes?filtro=DCEA' },
      ]
    },
    { 
      name: 'Evaluadores', 
      path: '/dashboard/evaluadores',
      icon: ClipboardCheck,
      subItems: [
        { name: 'DCEMA', path: '/dashboard/evaluadores?filtro=DCEMA' },
        { name: 'DCEA', path: '/dashboard/evaluadores?filtro=DCEA' },
      ]
    },
    
    { category: 'Sistema' },
    { name: 'Registro de Eventos', path: '/dashboard/eventos', icon: Calendar },
    { name: 'Reg. Disciplina', path: '/dashboard/disciplina', icon: ShieldAlert },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: UserCircle },
  ];

  const docenteMenu = [
    { category: 'Principal' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calificaciones', path: '/dashboard/calificaciones', icon: BookOpen },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: UserCircle },
  ];

  const cursanteMenu = [
    { category: 'Principal' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mis Notas', path: '/dashboard/mis-notas', icon: BookOpen },
    { name: 'Ponderación Final', path: '/dashboard/mi-ponderacion', icon: Award },
    { name: 'Mi Disciplina', path: '/dashboard/mi-disciplina', icon: ShieldAlert },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: UserCircle },
  ];

  const instruccionMenu = [
    { category: 'Principal' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Disciplina', path: '/dashboard/disciplina', icon: ShieldAlert },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: UserCircle },
  ];

  const evaluadorMenu = [
    { category: 'Principal' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calificaciones', path: '/dashboard/calificaciones', icon: BookOpen },
    { name: 'Ponderación Final', path: '/dashboard/ponderacion-final', icon: ClipboardCheck },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: UserCircle },
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Docentes': location.pathname.includes('/docentes'),
    'Evaluadores': location.pathname.includes('/evaluadores')
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return <Navigate to="/login" />;

  const toggleMenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  let menu = user?.rol === 'ADMIN' ? adminMenu : 
             user?.rol === 'EVALUADOR' ? evaluadorMenu :
             user?.rol === 'INSTRUCCION' ? instruccionMenu :
             user?.rol === 'DOCENTE' ? docenteMenu : cursanteMenu;

  const routeTitles: Record<string, { section: string; title: string; icon: any }> = {
    '/dashboard': { section: 'Portal Ejecutivo', title: 'Resumen Académico', icon: LayoutDashboard },
    '/dashboard/reportes': { section: 'Dirección de Posgrado', title: 'Reportes y Estadísticas', icon: BarChart2 },
    '/dashboard/diplomados': { section: 'Gestión Académica', title: 'Programas y Diplomados', icon: GraduationCap },
    '/dashboard/periodos': { section: 'Gestión Académica', title: 'Gestiones y Ediciones', icon: CalendarDays },
    '/dashboard/inscripciones': { section: 'Gestión Académica', title: 'Matriculación de Cursantes', icon: UserPlus },
    '/dashboard/usuarios': { section: 'Personal y Roles', title: 'Directorio de Usuarios', icon: Users },
    '/dashboard/docentes': { section: 'Personal y Roles', title: 'Asignación de Docentes', icon: BookOpen },
    '/dashboard/evaluadores': { section: 'Personal y Roles', title: 'Comisión de Evaluadores', icon: ClipboardCheck },
    '/dashboard/eventos': { section: 'Inspectoría y Sistema', title: 'Bitácora de Eventos', icon: Calendar },
    '/dashboard/disciplina': { section: 'Sección Instrucción', title: 'Control Disciplinario', icon: ShieldAlert },
    '/dashboard/calificaciones': { section: 'Registro Académico', title: 'Planilla de Calificaciones', icon: BookOpen },
    '/dashboard/ponderacion-final': { section: 'Comisión Evaluadora', title: 'Cuadro de Ponderación Final', icon: ClipboardCheck },
    '/dashboard/mis-notas': { section: 'Seguimiento Académico', title: 'Kárdex de Calificaciones', icon: GraduationCap },
    '/dashboard/mi-ponderacion': { section: 'Seguimiento Académico', title: 'Ponderación Final', icon: Award },
    '/dashboard/mi-disciplina': { section: 'Sección Instrucción', title: 'Foja de Disciplina', icon: ShieldAlert },
    '/dashboard/perfil': { section: 'Cuenta Institucional', title: 'Ficha de Usuario', icon: UserCircle },
  };

  const currentRouteMeta = routeTitles[location.pathname] || {
    section: 'Portal Académico',
    title: 'Módulo Institucional',
    icon: LayoutDashboard,
  };
  const ActiveHeaderIcon = currentRouteMeta.icon;

  const filtroParam = new URLSearchParams(location.search).get('filtro');
  const fechaActual = new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex font-sans relative overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#081526] via-[#0b1c33] to-[#07111e] text-slate-300 z-50 transform transition-transform duration-200 border-r border-slate-800/90 shadow-xl lg:translate-x-0 lg:static lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Cabecera Institucional de la Barra */}
        <div className="p-3 bg-[#07111e]/90 border-b border-slate-800/90 relative">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-br from-[#0f243c] via-[#0b1b2e] to-[#081322] border border-white/10 shadow-inner">
            <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 ring-2 ring-amber-400/30 shadow-md">
              <img src="/logo-ecema.png" alt="Escudo ECEMA" className="w-full h-full object-contain" />
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-amber-400/30 to-transparent shrink-0"></div>

            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-[0.08em] block leading-none">
                Fuerza Aérea Boliviana
              </span>
              <h1 className="text-[17px] font-black text-white tracking-[0.14em] leading-none mt-1.5 mb-1">
                ECEMA
              </h1>
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.12em] block leading-none">
                Sistema Académico
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent"></div>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {menu.map((item: any, idx: number) => {
              if (item.category) {
                return (
                  <li key={`cat-${idx}`} className={`${idx === 0 ? 'pt-2' : 'pt-4'} pb-1.5 px-2`}>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400/60 shrink-0"></span>
                      <p className="text-[10px] font-extrabold text-slate-400/80 uppercase tracking-[0.15em] shrink-0">
                        {item.category}
                      </p>
                      <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                    </div>
                  </li>
                );
              }

              const hasSubItems = !!item.subItems;
              const hasActiveChild = hasSubItems && item.subItems.some((sub: any) => location.pathname + location.search === sub.path);
              const isExpanded = openMenus[item.name] || hasActiveChild;
              const isActive = location.pathname === item.path && !location.search;
              const Icon = item.icon;

              return (
                <li key={item.path || idx}>
                  {hasSubItems ? (
                    <button 
                      onClick={(e) => toggleMenu(item.name, e)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer group ${
                        hasActiveChild
                          ? 'text-white bg-white/[0.06] border border-white/10 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            hasActiveChild
                              ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                              : 'bg-white/[0.03] text-slate-400 border border-white/[0.05] group-hover:text-slate-200 group-hover:bg-white/[0.07]'
                          }`}>
                            <Icon size={15} />
                          </div>
                        )}
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${hasActiveChild ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link 
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all group relative ${
                        isActive 
                          ? 'text-white bg-gradient-to-r from-[#163a5c] to-[#0f2942]/80 font-bold border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.25)]' 
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.04] font-medium border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isActive 
                              ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' 
                              : 'bg-white/[0.03] text-slate-400 border border-white/[0.05] group-hover:text-slate-200 group-hover:bg-white/[0.07]'
                          }`}>
                            <Icon size={15} />
                          </div>
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mr-1"></span>
                      )}
                    </Link>
                  )}

                  {hasSubItems && (
                    <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                      <ul className="space-y-0.5 ml-5 pl-3 border-l border-slate-700/70 py-0.5">
                        {item.subItems.map((sub: any) => {
                          const isSubActive = location.pathname + location.search === sub.path;
                          return (
                            <li key={sub.path}>
                              <Link
                                to={sub.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-md transition-all ${
                                  isSubActive 
                                    ? 'text-amber-300 font-bold bg-[#163a5c]/70 border border-white/10' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] font-medium'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative z-10">
        <header className="h-16 bg-white border-b border-slate-200/90 border-t-2 border-t-[#0f2942] shadow-[0_1px_3px_rgba(15,41,66,0.04)] flex items-center justify-between px-4 sm:px-6 z-30 shrink-0">
          {/* Izquierda: Ícono Dinámico + Ruta en 2 Niveles */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button 
              className="lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none p-2 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-[#0f2942] text-amber-300 items-center justify-center shrink-0 shadow-xs border border-[#163a5c]">
              <ActiveHeaderIcon size={17} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>ECEMA</span>
                <span className="text-amber-500">›</span>
                <span className="text-slate-500 truncate">{currentRouteMeta.section}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                  {currentRouteMeta.title}
                </h2>
                {filtroParam && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {filtroParam}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Derecha: Cápsula de Estado/Fecha + Tarjeta de Perfil Unificada */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Cápsula Unificada de Estado Operativo y Fecha */}
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 gap-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                <span className="text-[11px] font-bold text-slate-600">En Línea</span>
              </div>
              <div className="h-3.5 w-px bg-slate-200"></div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Calendar size={13} className="text-[#0f2942]" />
                <span className="text-[11px] font-bold font-mono tabular-nums uppercase tracking-wide">
                  {fechaActual}
                </span>
              </div>
            </div>

            {/* Selector de Cuenta Ejecutivo (Sin duplicar rol suelto) */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-50/90 hover:bg-slate-100 transition-all border border-slate-200/90 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0f2942] border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs font-black shadow-2xs shrink-0">
                  {user?.grado && user.grado.toUpperCase() !== user?.rol?.toUpperCase()
                    ? user.grado.slice(0, 3).toUpperCase()
                    : user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.grado && user.grado.toUpperCase() !== user?.rol?.toUpperCase() ? `${user.grado} ` : ''}{user?.nombre}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0f2942] bg-[#0f2942]/10 px-1.5 py-0.2 rounded">
                      {user?.rol}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden lg:inline truncate max-w-[130px]">
                      {user?.email || 'usuario@ecema.edu'}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${isProfileOpen ? 'rotate-180 text-[#0f2942]' : ''}`} />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 bg-[#0f2942] text-white border-b border-slate-800">
                      <p className="text-xs font-bold truncate">
                        {user?.grado && user.grado.toUpperCase() !== user?.rol?.toUpperCase() ? `${user.grado} ` : ''}{user?.nombre} {user?.apellido || ''}
                      </p>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{user?.email || 'usuario@ecema.edu'}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link 
                        to="/dashboard/perfil" 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#0f2942] rounded-lg transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCircle size={15} className="text-[#0f2942]" />
                        <span>Mi Ficha Institucional</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('admin@ecema.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setError('Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión.');
    }
  }, [location.search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081220] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Elementos Decorativos de Fondo (Paleta Institucional Sobria) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#0f2942]/50 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-slate-800/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] border border-slate-700/50 overflow-hidden relative z-10">
        
        {/* Lado Izquierdo: Branding / Hero */}
        <div className="hidden md:flex flex-col p-12 bg-gradient-to-br from-[#0f2942]/95 to-[#0b192c]/98 relative border-r border-slate-800/80">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          {/* Top Anchor Institucional */}
          <div className="relative z-10 flex items-center justify-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-extrabold text-amber-300 tracking-[0.2em] uppercase">
              Fuerza Aérea Boliviana • Posgrado
            </span>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center py-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug mb-3 uppercase">
              Escuela de Comando y <br /> Estado Mayor Aéreo
            </h1>
            <div className="w-12 h-0.5 bg-amber-400/70 rounded-full mb-4"></div>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xs mx-auto leading-relaxed">
              Sistema Integrado de Gestión Académica.
            </p>
          </div>
          
          <div className="relative z-10 bg-[#081220]/70 p-4 rounded-xl border border-white/10 border-l-4 border-l-amber-400 shadow-lg">
            <p className="text-xs sm:text-sm font-semibold text-slate-200 italic leading-relaxed text-center">
              "El don de mando de la Fuerza Aérea <br /> deriva del don de mando intelectual."
            </p>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Login */}
        <div className="p-8 sm:p-12 md:p-14 flex flex-col justify-center relative bg-white">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="p-3.5 bg-slate-50 rounded-2xl shadow-xs border border-slate-200">
                <img 
                  src="/logo-ecema.png" 
                  alt="ECEMA Logo" 
                  className="w-20 h-20 object-contain mix-blend-multiply" 
                />
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-[0.2em] block mb-1">
              Portal Oficial — ECEMA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Acceso al Sistema Académico
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Ingrese sus credenciales institucionales para iniciar sesión
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-700 text-red-800 p-3.5 rounded-lg text-xs font-bold animate-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Correo Institucional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0f2942] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-semibold font-mono placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] outline-none transition-all"
                  placeholder="usuario@ecema.edu"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Contraseña de Acceso
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0f2942] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0f2942]/20 focus:border-[#0f2942] outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full group bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs sm:text-sm font-bold uppercase tracking-wider py-3 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-amber-300" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono tabular-nums">
              ECEMA © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="diplomados" element={<Diplomas />} />
          <Route path="periodos" element={<PeriodosEdiciones />} />
          <Route path="inscripciones" element={<Inscripciones />} />
          <Route path="docentes" element={<AsignacionesDocentes />} />
          <Route path="evaluadores" element={<AsignacionesEvaluadores />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="calificaciones" element={<GestorCalificaciones />} />
          <Route path="mis-notas" element={<MisNotas />} />
          <Route path="mi-disciplina" element={<MiDisciplina />} />
          <Route path="disciplina" element={<DisciplinaDashboard />} />
          <Route path="ponderacion-final" element={<PonderacionFinal />} />
          <Route path="mi-ponderacion" element={<MiPonderacionFinal />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="*" element={<div className="p-4 bg-white rounded-xl shadow-sm border text-gray-600">Módulo en construcción...</div>} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
