import React from 'react';
import { 
  LayoutDashboard, Calendar, AlertTriangle, Users, Building2, 
  GraduationCap, BookOpen, UserCheck, School, Clock, 
  CalendarClock, GitPullRequest, Bell, FileBarChart, 
  History, Settings, ChevronRight, ShieldCheck, X
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'schedules'
  | 'conflicts'
  | 'teachers'
  | 'departments'
  | 'courses'
  | 'subjects'
  | 'classes'
  | 'rooms'
  | 'periods'
  | 'availability'
  | 'change_requests'
  | 'notifications'
  | 'reports'
  | 'audit'
  | 'audit_logs'
  | 'admin_panel';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  userRole: UserRole;
  conflictCount?: number;
  conflictsCount?: number;
  pendingRequestsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onResetData?: () => void;
}

interface MenuItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: number;
  badgeColor?: string;
  category?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  conflictCount,
  conflictsCount,
  pendingRequestsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  onResetData,
}) => {
  const effectiveConflictCount = conflictCount !== undefined ? conflictCount : (conflictsCount ?? 0);
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: userRole === 'docente' ? 'Meu Painel' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'gestor', 'coordenador', 'docente', 'estudante'],
    },
    {
      id: 'schedules',
      label: userRole === 'docente' ? 'Meu Horário' : userRole === 'estudante' ? 'Horário da Turma' : 'Gestão de Horários',
      icon: Calendar,
      roles: ['admin', 'gestor', 'coordenador', 'docente', 'estudante'],
    },
    {
      id: 'conflicts',
      label: 'Validação de Conflitos',
      icon: AlertTriangle,
      roles: ['admin', 'gestor', 'coordenador'],
      badge: effectiveConflictCount,
      badgeColor: effectiveConflictCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    {
      id: 'availability',
      label: userRole === 'docente' ? 'Minha Disponibilidade' : 'Disponibilidade Docente',
      icon: CalendarClock,
      roles: ['admin', 'gestor', 'coordenador', 'docente'],
    },
    {
      id: 'change_requests',
      label: 'Solicitações de Alteração',
      icon: GitPullRequest,
      roles: ['admin', 'gestor', 'coordenador', 'docente'],
      badge: pendingRequestsCount,
      badgeColor: pendingRequestsCount > 0 ? 'bg-amber-500 text-white' : undefined,
    },
    {
      id: 'teachers',
      label: 'Docentes',
      icon: Users,
      roles: ['admin', 'gestor', 'coordenador'],
      category: 'Estrutura Académica',
    },
    {
      id: 'departments',
      label: 'Departamentos',
      icon: Building2,
      roles: ['admin', 'gestor', 'coordenador'],
    },
    {
      id: 'courses',
      label: 'Cursos',
      icon: GraduationCap,
      roles: ['admin', 'gestor', 'coordenador'],
    },
    {
      id: 'subjects',
      label: 'Disciplinas',
      icon: BookOpen,
      roles: ['admin', 'gestor', 'coordenador', 'docente', 'estudante'],
    },
    {
      id: 'classes',
      label: 'Turmas',
      icon: UserCheck,
      roles: ['admin', 'gestor', 'coordenador', 'docente'],
    },
    {
      id: 'rooms',
      label: 'Salas e Laboratórios',
      icon: School,
      roles: ['admin', 'gestor', 'coordenador', 'docente', 'estudante'],
    },
    {
      id: 'periods',
      label: 'Períodos Lectivos',
      icon: Clock,
      roles: ['admin', 'gestor'],
    },
    {
      id: 'reports',
      label: 'Relatórios & Exportação',
      icon: FileBarChart,
      roles: ['admin', 'gestor', 'coordenador'],
      category: 'Relatórios & Auditoria',
    },
    {
      id: 'audit_logs',
      label: 'Auditoria de Ações',
      icon: History,
      roles: ['admin', 'gestor'],
    },
    {
      id: 'admin_panel',
      label: 'Painel de Administração',
      icon: ShieldCheck,
      roles: ['admin', 'gestor'],
      category: 'Administração & Sistema',
    },
  ];

  const allowedItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      
      {/* Institution header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            UT
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">Universidade Tobas</h2>
            <p className="text-[10px] text-slate-400">Campus Central • Gestão SGHD</p>
          </div>
        </div>

        {/* Close Button on Mobile */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden min-h-[36px] min-w-[36px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu list */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {allowedItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'audit_logs' && currentTab === 'audit');

          return (
            <React.Fragment key={item.id}>
              {item.category && idx > 0 && (
                <div className="pt-4 pb-1.5 px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {item.category}
                </div>
              )}
              <button
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between text-[10px]">
          <span>Período Ativo:</span>
          <span className="font-semibold text-emerald-400">2026/1º Semestre</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação da Universidade Tobas"
        >
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={() => onCloseMobile?.()}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
