import React from 'react';
import { LayoutDashboard, Calendar, Users, School, Menu } from 'lucide-react';
import { NavTab } from './Sidebar';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
  userRole: UserRole;
  conflictsCount?: number;
  pendingRequestsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  userRole,
  conflictsCount = 0,
  pendingRequestsCount = 0,
}) => {
  const isTabActive = (tab: string) => currentTab === tab;

  return (
    <nav 
      id="mobile-bottom-navigation"
      aria-label="Navegação móvel inferior"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg safe-bottom transition-colors"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        
        {/* 1. Dashboard / Início */}
        <button
          id="btn-mobile-nav-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 transition-colors relative ${
            isTabActive('dashboard')
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${isTabActive('dashboard') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] truncate max-w-full leading-tight">Início</span>
          {isTabActive('dashboard') && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>

        {/* 2. Horários */}
        <button
          id="btn-mobile-nav-schedules"
          onClick={() => onSelectTab('schedules')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 transition-colors relative ${
            isTabActive('schedules')
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className={`w-5 h-5 mb-0.5 ${isTabActive('schedules') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] truncate max-w-full leading-tight">Horários</span>
          {isTabActive('schedules') && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>

        {/* 3. Docentes */}
        <button
          id="btn-mobile-nav-teachers"
          onClick={() => onSelectTab('teachers')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 transition-colors relative ${
            isTabActive('teachers')
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${isTabActive('teachers') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] truncate max-w-full leading-tight">Docentes</span>
          {isTabActive('teachers') && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>

        {/* 4. Salas e Laboratórios */}
        <button
          id="btn-mobile-nav-rooms"
          onClick={() => onSelectTab('rooms')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 transition-colors relative ${
            isTabActive('rooms')
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <School className={`w-5 h-5 mb-0.5 ${isTabActive('rooms') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] truncate max-w-full leading-tight">Salas</span>
          {isTabActive('rooms') && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>

        {/* 5. Menu Completo (Abre Drawer com Turmas, Disciplinas, Relatórios, etc.) */}
        <button
          id="btn-mobile-nav-menu"
          onClick={onOpenMobileMenu}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 transition-colors relative ${
            !['dashboard', 'schedules', 'teachers', 'rooms'].includes(currentTab)
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Menu className="w-5 h-5 mb-0.5 stroke-2" />
            {(conflictsCount > 0 || pendingRequestsCount > 0) && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] truncate max-w-full leading-tight">Mais</span>
          {!['dashboard', 'schedules', 'teachers', 'rooms'].includes(currentTab) && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>

      </div>
    </nav>
  );
};
