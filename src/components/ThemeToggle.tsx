import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'light', label: 'Modo Claro', icon: Sun },
    { mode: 'dark', label: 'Modo Escuro', icon: Moon },
    { mode: 'system', label: 'Tema do Sistema', icon: Monitor },
  ];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div className="flex items-center">
        {/* Main Quick Toggle Button */}
        <button
          id="btn-navbar-theme-toggle"
          type="button"
          onClick={toggleTheme}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 flex items-center gap-1.5"
          title={
            resolvedTheme === 'dark'
              ? 'Mudar para Modo Claro (Clique para alternar, clique direito para opções)'
              : 'Mudar para Modo Escuro (Clique para alternar, clique direito para opções)'
          }
          aria-label="Alternar tema claro ou escuro"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45 duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 transition-transform hover:-rotate-12 duration-300" />
          )}

          {showLabel && (
            <span className="text-xs font-medium hidden md:inline-block">
              {resolvedTheme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          )}
        </button>

        {/* Small dropdown trigger for explicit system / light / dark selection */}
        <button
          id="btn-navbar-theme-dropdown-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Opções de tema (Claro / Escuro / Sistema)"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="sr-only">Opções de tema</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Aparência
          </div>
          
          {options.map(({ mode, label, icon: Icon }) => {
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                id={`btn-theme-option-${mode}`}
                onClick={() => {
                  setTheme(mode);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
