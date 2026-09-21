import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, 
  LogIn, ArrowRight, School
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User, rememberMe: boolean) => void;
  defaultUser?: User;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Strict validation: identifier required
    if (!cleanIdentifier) {
      setErrorMessage('Por favor, introduza o seu e-mail institucional ou nome de utilizador.');
      return;
    }

    // Strict validation: password required
    if (!cleanPassword) {
      setErrorMessage('Por favor, introduza a sua palavra-passe.');
      return;
    }

    // Find matching user strictly by email, username or ID
    const matchedUser = users.find(u => 
      u.email.toLowerCase() === cleanIdentifier || 
      u.name.toLowerCase() === cleanIdentifier ||
      u.id.toLowerCase() === cleanIdentifier
    );

    // Verify user existence and password accuracy
    if (!matchedUser || matchedUser.password !== cleanPassword) {
      setErrorMessage('Credenciais incorretas! Verifique o e-mail/utilizador e a palavra-passe.');
      return;
    }

    // Successful authentication
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess(matchedUser, rememberMe);
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div 
      id="login-screen-wrapper"
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-base">
            UT
          </div>
          <div>
            <div className="font-bold text-base text-white tracking-tight flex items-center gap-2">
              Universidade Tobas
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                SGHD v2.4
              </span>
            </div>
            <div className="text-xs text-slate-400">Sistema de Gestão de Horários e Alocação Docente</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8 flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        
        {/* Institutional Information Panel */}
        <div className="lg:w-5/12 bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Acesso Restrito & Protegido</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-3">
              Universidade Tobas
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Portal de autenticação e gestão de horários da Universidade Tobas. Introduza as suas credenciais para aceder aos módulos de gestão académica, turmas e carga letiva.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Autenticação Individual Obrigatória</div>
                  <div className="text-slate-400 mt-0.5">Cada utilizador tem acesso estrito apenas com as suas credenciais individuais.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <School className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Privacidade de Contas</div>
                  <div className="text-slate-400 mt-0.5">Nenhum outro utilizador ou perfil fica acessível sem fornecimento das respetivas credenciais.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-700/60 text-xs text-slate-400">
            Dúvidas ou recuperação de palavra-passe? Contacte o secretariado académico ou o suporte técnico.
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="lg:w-7/12 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between text-slate-900 dark:text-white">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Iniciar Sessão
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Introduza o seu e-mail institucional e a sua palavra-passe para prosseguir.
              </p>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div 
                id="login-error-alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Acesso Negado</div>
                  <div className="mt-0.5 leading-relaxed">{errorMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input (Email or Username) */}
              <div>
                <label 
                  htmlFor="login-identifier-input" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  E-mail Institucional ou Utilizador: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="ex: utilizador@instituicao.edu"
                    autoFocus
                    required
                    autoComplete="username"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      errorMessage 
                        ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' 
                        : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password Input (Required) */}
              <div>
                <label 
                  htmlFor="login-password-input" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Palavra-passe: <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Introduza a sua palavra-passe"
                    required
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      errorMessage 
                        ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' 
                        : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                    title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Session */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="login-remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Manter sessão ativa
                  </span>
                </label>

                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Proteção: 30 min inativo
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>A validar credenciais...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ambiente Académico Seguro • Todos os direitos reservados © Universidade Tobas
            </p>
          </div>
        </div>

      </main>

      {/* Footer System Status */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 py-2 border-t border-slate-800/60 gap-2">
        <div>Universidade Tobas • SGHD - Sistema de Gestão de Horários e Alocação Docente</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Servidores Académicos Online
          </span>
          <span>•</span>
          <span>Sessão Encriptada TLS</span>
        </div>
      </footer>
    </div>
  );
};
