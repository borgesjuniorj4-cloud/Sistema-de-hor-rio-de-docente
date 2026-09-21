import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, ShieldAlert, Clock, ChevronDown, 
  Eye, EyeOff, User as UserIcon, Check, ArrowRight,
  LogOut, AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface LockScreenProps {
  currentUser: User;
  users: User[];
  onUnlock: () => void;
  onSwitchUser: (user: User) => void;
  onLogout?: () => void;
  idleDurationMinutes?: number;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  currentUser,
  users = [],
  onUnlock,
  onSwitchUser,
  onLogout,
  idleDurationMinutes = 30,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep digital clock active
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Por favor, introduza a palavra-passe. Sem senha não é permitido desbloquear a sessão.');
      return;
    }

    const expectedPassword = currentUser.password || 'admin123';
    if (password !== expectedPassword) {
      setErrorMessage('Palavra-passe incorreta! Sem a senha correta não é permitido aceder ao sistema.');
      return;
    }

    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
      setIsUnlocking(false);
    }, 300);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'gestor': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'coordenador': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'docente': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'estudante': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('pt-PT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div 
      id="screen-lock-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto transition-all animate-in fade-in duration-300"
    >
      {/* Top Bar with Branding & Theme Switcher */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shadow-md">
            UT
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Universidade Tobas</div>
            <div className="text-[10px] text-slate-400">SGHD • Sistema de Gestão de Horários</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-1">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Lock Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-8">
        
        {/* Header Ribbon / Status */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <span className="p-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <span>Sessão Bloqueada</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{idleDurationMinutes}m inatividade</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          
          {/* Live Digital Clock */}
          <div className="text-center mb-6">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
              {timeString}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1">
              {dateString}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {currentUser?.name || 'Utilizador'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email || 'utilizador@instituicao.edu'}
                </p>
                <div className="mt-1">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getRoleBadgeColor(currentUser?.role || 'docente')}`}>
                    {currentUser?.roleTitle || (currentUser?.role || '').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Locked security indicator */}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" title="Sessão Bloqueada">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div 
              id="lock-error-alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 flex items-start gap-2 text-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Unlock Form */}
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="lock-screen-password" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Palavra-passe da Conta: <span className="text-rose-500">*</span>
                </label>
                {currentUser?.password && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(currentUser.password!);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Preencher senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="lock-screen-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Introduza a sua senha para desbloquear"
                  autoFocus
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                    errorMessage 
                      ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' 
                      : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                  title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Senha necessária: introduza a palavra-passe do perfil para aceder.</span>
              </p>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                id="btn-lockscreen-unlock"
                type="submit"
                disabled={isUnlocking}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-75 cursor-pointer"
              >
                {isUnlocking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>A verificar e desbloquear...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Desbloquear Sessão</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>

              {onLogout && (
                <button
                  id="btn-lockscreen-logout"
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta / Ecrã de Login</span>
                </button>
              )}
            </div>
          </form>

        </div>

        {/* Informative Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/40 px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Proteção de Sessão Ativa • Bloqueio automático aos 30 minutos de inatividade
          </p>
        </div>

      </div>
    </div>
  );
};
