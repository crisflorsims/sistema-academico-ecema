const fs = require('fs');
const path = 'c:\\Users\\crist\\OneDrive\\Desktop\\ANTI PRO\\frontend\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

const loginIndex = content.indexOf('function Login() {');
const restOfApp = content.substring(loginIndex);

const newTop = `import { useState } from 'react';
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
import { 
  LayoutDashboard, Users, GraduationCap, CalendarDays, UserPlus, 
  BookOpen, ClipboardCheck, BarChart2, Calendar, ShieldAlert, UserCircle, LogOut, Menu, ChevronDown, Bell
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
    { name: 'Calendario Event.', path: '/dashboard/eventos', icon: Calendar },
    { name: 'Reg. Disciplina', path: '/dashboard/disciplina', icon: ShieldAlert },
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={\`fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-slate-300 z-50 transform transition-transform duration-300 shadow-2xl lg:translate-x-0 lg:static lg:block \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col\`}>
        <div className="h-16 flex items-center px-6 bg-[#0b1121] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold tracking-wider">
              EC
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ECEMA</h1>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Portal Académico</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1.5 px-3">
            {menu.map((item: any, idx: number) => {
              if (item.category) {
                return (
                  <li key={\`cat-\${idx}\`} className="pt-4 pb-1 px-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.category}</p>
                  </li>
                );
              }

              const hasSubItems = !!item.subItems;
              const isExpanded = openMenus[item.name];
              const isActive = location.pathname === item.path && !location.search;
              const Icon = item.icon;

              return (
                <li key={item.path || idx}>
                  {hasSubItems ? (
                    <button 
                      onClick={(e) => toggleMenu(item.name, e)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:bg-slate-800/80 text-slate-300 hover:text-white group"
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon size={18} className="text-slate-400 group-hover:text-blue-400 transition-colors" />}
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronDown size={16} className={\`text-slate-500 transition-transform duration-200 \${isExpanded ? 'rotate-180' : ''}\`} />
                    </button>
                  ) : (
                    <Link 
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden \${isActive ? 'text-white bg-blue-600/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}\`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                      {Icon && <Icon size={18} className={\`\${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'} transition-colors\`} />}
                      {item.name}
                    </Link>
                  )}

                  {hasSubItems && (
                    <div className={\`overflow-hidden transition-all duration-300 ease-in-out \${isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}\`}>
                      <ul className="space-y-1 ml-9 pl-3 border-l border-slate-700/50">
                        {item.subItems.map((sub: any) => {
                          const isSubActive = location.pathname + location.search === sub.path;
                          return (
                            <li key={sub.path}>
                              <Link
                                to={sub.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={\`block px-3 py-2 text-[13px] rounded-lg transition-colors \${isSubActive ? 'text-white font-medium bg-slate-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}\`}
                              >
                                {sub.name}
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="h-16 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-blue-600 focus:outline-none p-2 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
                Panel de Control
              </h2>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{user?.rol}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 focus:outline-none"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.nombre}</p>
                  <p className="text-[11px] font-medium text-slate-500">{user?.email || 'usuario@ecema.edu'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 transform origin-top-right transition-all">
                    <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                      <p className="text-sm font-semibold text-slate-700">{user?.nombre}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'usuario@ecema.edu'}</p>
                    </div>
                    <Link 
                      to="/dashboard/perfil" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircle size={16} />
                      Mi Perfil
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

`;

fs.writeFileSync(path, newTop + restOfApp, 'utf8');
console.log("Success rewriting layout!");
