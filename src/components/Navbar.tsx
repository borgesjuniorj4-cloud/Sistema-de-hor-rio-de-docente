import React, { useState } from 'react';
import { 
  Calendar, Bell, Shield, UserCheck, AlertTriangle, 
  RotateCcw, Check, CheckCircle2, ChevronDown, Lock, Clock, LogOut,
  Mail, Menu, X
} from 'lucide-react';
import { User, NotificationItem, ScheduleConflict, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentUser: User;
  users?: User[];
  onSelectUser?: (user: User) => void;
  onSwitchRole?: (role: UserRole) => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  conflicts?: ScheduleConflict[];
  activeConflictsCount?: number;
  onNavigateToConflicts?: () => void;
  onNavigate?: (tab: string) => void;
  onResetData?: () => void;
  pendingRequestsCount?: number;
  onLockSession?: () => void;
  onLogout?: () => void;
  onOpenSimulatedEmails?: () => void;
  simulatedEmailsCount?: number;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users = INITIAL_USERS,
  onSelectUser,
  onSwitchRole,
  notifications = [],
  onMarkNotificationRead,
  onMarkNotificationAsRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  conflicts = [],
  activeConflictsCount,
  onNavigateToConflicts,
  onNavigate,
  onResetData,
  pendingRequestsCount = 0,
  onLockSession,
  onLogout,
  onOpenSimulatedEmails,
  simulatedEmailsCount = 0,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
  const safeUsers = Array.isArray(users) && users.length > 0 ? users : INITIAL_USERS;

  const unreadCount = safeNotifications.filter(n => !n.read).length;
  const highSeverityConflicts = safeConflicts.filter(c => c.severity === 'high');
  const totalConflictsCount = activeConflictsCount !== undefined ? activeConflictsCount : safeConflicts.length;

  const handleNavigateConflicts = () => {
    if (onNavigateToConflicts) {
      onNavigateToConflicts();
    } else if (onNavigate) {
      onNavigate('conflicts');
    }
  };

  const handleMarkRead = (id: string) => {
    if (onMarkNotificationRead) onMarkNotificationRead(id);
    else if (onMarkNotificationAsRead) onMarkNotificationAsRead(id);
  };

  const handleClearAll = () => {
    if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
    else if (onClearNotifications) onClearNotifications();
  };

  const handleUserSelect = (u: User) => {
    if (onSelectUser) onSelectUser(u);
    if (onSwitchRole) onSwitchRole(u.role);
    setShowRoleMenu(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gestor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coordenador': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'docente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'estudante': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Academic Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Hamburger Toggle */}
            {onToggleMobileMenu && (
              <button
                id="btn-navbar-mobile-menu"
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de consultas e opções"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-800 dark:text-slate-100" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-800 dark:text-slate-100" />
                )}
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">Universidade Tobas</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800 hidden sm:inline-block">
                  SGHD • 2026/1º Semestre
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate max-w-[170px] sm:max-w-md">
                Sistema de Gestão de Horários
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Live Conflicts Warning Alert */}
            {totalConflictsCount > 0 && (
              <button
                id="btn-navbar-conflicts"
                onClick={handleNavigateConflicts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-colors"
                title={`${totalConflictsCount} conflitos detectados`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                <span className="hidden sm:inline">
                  {totalConflictsCount} {totalConflictsCount === 1 ? 'Conflito' : 'Conflitos'}
                </span>
                <span className="sm:hidden font-bold">{totalConflictsCount}</span>
                {highSeverityConflicts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                )}
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative">
              <button
                id="btn-navbar-notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowRoleMenu(false);
                }}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Notificações Internas"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                    {safeNotifications.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">Nenhuma notificação</p>
                    ) : (
                      safeNotifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleMarkRead(notif.id)}
                          className={`p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-left ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-950/40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Institutional Emails Button (Universidade Tobas) */}
            {onOpenSimulatedEmails && (
              <button
                id="btn-navbar-emails"
                onClick={onOpenSimulatedEmails}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="E-mails aos Docentes (Serviço Simulado da Universidade Tobas)"
              >
                <Mail className="w-5 h-5" />
                {simulatedEmailsCount > 0 && (
                  <span className="absolute top-1 right-1 px-1 min-w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {simulatedEmailsCount > 99 ? '99+' : simulatedEmailsCount}
                  </span>
                )}
              </button>
            )}

            {/* Theme Toggle Button (Light/Dark/System) */}
            <ThemeToggle />

            {/* Quick Lock Session Button */}
            {onLockSession && (
              <button
                id="btn-navbar-lock-screen"
                onClick={onLockSession}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors hidden sm:flex items-center"
                title="Bloquear Sessão Agora (Inatividade automática: 30 minutos)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                id="btn-navbar-quick-logout"
                onClick={onLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors hidden sm:flex items-center"
                title="Terminar Sessão (Sair do Sistema)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Reset Demo Data Button */}
            {onResetData && (
              <button
                id="btn-navbar-reset"
                onClick={onResetData}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden md:flex items-center"
                title="Restaurar Dados de Exemplo do SGHD"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* Interactive User & Role Switcher (RBAC Showcase) */}
            <div className="relative">
              <button
                id="btn-navbar-user-switcher"
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase border border-indigo-200 dark:border-indigo-700">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {currentUser?.name || 'Utilizador'}
                  </div>
                  <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser?.role || 'docente')}`}>
                    {(currentUser?.role || 'docente').toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Current Authenticated User Information */}
                  <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {currentUser?.name || 'Utilizador'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {currentUser?.email || ''}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${getRoleBadgeColor(currentUser?.role || 'docente')}`}>
                          {currentUser?.roleTitle || (currentUser?.role || '').toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="py-2.5 px-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Sessão autenticada individual. Para mudar de conta, termine a sessão atual.
                    </div>
                  </div>

                  {/* Session actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {(currentUser.role === 'admin' || currentUser.role === 'gestor') && onNavigate && (
                      <button
                        id="btn-navbar-menu-admin-panel"
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onNavigate('admin_panel');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Painel de Administração</span>
                        </div>
                        <span className="text-[10px] text-indigo-500 font-normal">Backup</span>
                      </button>
                    )}

                    {onLockSession && (
                      <button
                        id="btn-navbar-menu-lock"
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLockSession();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloquear Ecrã</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">30m</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        id="btn-navbar-menu-logout"
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Terminar Sessão</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Sair</span>
                      </button>
                    )}

                    <div className="px-2 pt-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Proteção ativa: 30m sem atividade</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );

};
