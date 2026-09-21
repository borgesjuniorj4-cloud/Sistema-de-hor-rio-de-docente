import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, X, ArrowRight, ExternalLink } from 'lucide-react';
import { SimulatedEmail } from '../services/emailNotificationService';

interface SimulatedEmailToastProps {
  onOpenEmailPreview: (email: SimulatedEmail) => void;
}

export const SimulatedEmailToast: React.FC<SimulatedEmailToastProps> = ({ onOpenEmailPreview }) => {
  const [activeToast, setActiveToast] = useState<SimulatedEmail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleEmailSent = (event: Event) => {
      const customEvent = event as CustomEvent<SimulatedEmail>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
        setIsVisible(true);
      }
    };

    window.addEventListener('sghd:email_notification_sent', handleEmailSent);
    return () => {
      window.removeEventListener('sghd:email_notification_sent', handleEmailSent);
    };
  }, []);

  useEffect(() => {
    if (!activeToast) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setActiveToast(null), 300);
    }, 8500);

    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-md w-full transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-indigo-500/30 p-4 relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>

        <div className="flex items-start gap-3.5">
          {/* Avatar icon */}
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                E-mail Institucional Simulado
              </span>
              <button
                id="btn-close-email-toast"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => setActiveToast(null), 200);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-semibold text-white mt-1 leading-snug truncate">
              {activeToast.subject}
            </h4>

            <p className="text-xs text-slate-300 mt-1">
              Enviado para <strong className="text-white">{activeToast.recipientTeacherName}</strong> ({activeToast.recipientEmail})
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                id="btn-preview-email-toast"
                onClick={() => {
                  onOpenEmailPreview(activeToast);
                  setIsVisible(false);
                  setTimeout(() => setActiveToast(null), 200);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <span>Visualizar E-mail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400">Universidade Tobas • SGHD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
