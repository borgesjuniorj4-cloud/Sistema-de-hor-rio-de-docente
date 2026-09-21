import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, X, Search, Filter, Trash2, CheckCircle2, Clock, 
  ExternalLink, Calendar, User as UserIcon, BookOpen, AlertCircle,
  Copy, RefreshCw, Send, Check
} from 'lucide-react';
import { 
  SimulatedEmail, 
  getStoredSimulatedEmails, 
  markSimulatedEmailAsRead, 
  markAllSimulatedEmailsAsRead,
  deleteSimulatedEmail, 
  clearAllSimulatedEmails 
} from '../services/emailNotificationService';

interface SimulatedEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: SimulatedEmail | null;
  teacherFilterId?: string;
}

export const SimulatedEmailsModal: React.FC<SimulatedEmailsModalProps> = ({
  isOpen,
  onClose,
  initialEmail,
  teacherFilterId,
}) => {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'NEW_LESSON' | 'UPDATED_LESSON' | 'REQUEST_APPROVED' | 'REMOVED_LESSON'>('ALL');
  const [copied, setCopied] = useState(false);

  // Load emails
  const loadEmails = () => {
    const list = getStoredSimulatedEmails();
    setEmails(list);
    if (initialEmail) {
      const match = list.find(e => e.id === initialEmail.id) || initialEmail;
      setSelectedEmail(match);
      markSimulatedEmailAsRead(match.id);
    } else if (list.length > 0 && !selectedEmail) {
      setSelectedEmail(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    const handleUpdate = () => {
      loadEmails();
    };
    window.addEventListener('sghd:simulated_emails_updated', handleUpdate);
    return () => window.removeEventListener('sghd:simulated_emails_updated', handleUpdate);
  }, []);

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (teacherFilterId && email.recipientTeacherId !== teacherFilterId) {
        return false;
      }
      if (typeFilter !== 'ALL' && email.type !== typeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDoc = email.recipientTeacherName.toLowerCase().includes(term);
        const matchesEmail = email.recipientEmail.toLowerCase().includes(term);
        const matchesSubject = email.subject.toLowerCase().includes(term);
        const matchesDiscipline = email.metadata.subjectName.toLowerCase().includes(term);
        const matchesClass = email.metadata.className.toLowerCase().includes(term);
        if (!matchesDoc && !matchesEmail && !matchesSubject && !matchesDiscipline && !matchesClass) {
          return false;
        }
      }
      return true;
    });
  }, [emails, teacherFilterId, typeFilter, searchTerm]);

  if (!isOpen) return null;

  const handleSelectEmail = (email: SimulatedEmail) => {
    setSelectedEmail(email);
    if (!email.read) {
      markSimulatedEmailAsRead(email.id);
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  };

  const handleDeleteCurrent = (id: string) => {
    deleteSimulatedEmail(id);
    setEmails(prev => prev.filter(e => e.id !== id));
    if (selectedEmail?.id === id) {
      const remaining = emails.filter(e => e.id !== id);
      setSelectedEmail(remaining[0] || null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tem a certeza que deseja limpar todo o histórico de e-mails simulados?')) {
      clearAllSimulatedEmails();
      setEmails([]);
      setSelectedEmail(null);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'NEW_LESSON':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Nova Aula</span>;
      case 'UPDATED_LESSON':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Horário Alterado</span>;
      case 'REQUEST_APPROVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Ajuste Aprovado</span>;
      case 'REMOVED_LESSON':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Aula Desatribuída</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Notificação</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[820px] overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notificações por E-mail aos Docentes
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  Serviço Simulado Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registo de mensagens de correio institucional enviadas pela Universidade Tobas ao atribuir ou alterar horários.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {emails.length > 0 && (
              <button
                id="btn-clear-all-simulated-emails"
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Limpar histórico"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Histórico</span>
              </button>
            )}
            <button
              id="btn-close-simulated-emails-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Column (List) + Right Column (Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: List & Filters */}
          <div className="w-full md:w-2/5 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
            {/* Search and Filters Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-search-simulated-emails"
                  type="text"
                  placeholder="Pesquisar por docente, disciplina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    typeFilter === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Todas ({emails.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('NEW_LESSON')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    typeFilter === 'NEW_LESSON'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Novas
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('UPDATED_LESSON')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    typeFilter === 'UPDATED_LESSON'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Alteradas
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('REQUEST_APPROVED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    typeFilter === 'REQUEST_APPROVED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Aprovadas
                </button>
              </div>
            </div>

            {/* Email List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum e-mail registado</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Ao criar ou editar aulas na grade de horários, os e-mails de notificação serão emitidos e arquivados aqui automaticamente.
                  </p>
                </div>
              ) : (
                filteredEmails.map(email => {
                  const isSelected = selectedEmail?.id === email.id;
                  const dateStr = new Intl.DateTimeFormat('pt-PT', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date(email.sentAt));

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-3.5 cursor-pointer transition-colors relative ${
                        isSelected 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {email.recipientTeacherName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {dateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        {getTypeBadge(email.type)}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {email.metadata.className} • {email.metadata.dayOfWeek} {email.metadata.timeSlot}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                        {email.subject}
                      </p>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                        {email.previewSnippet}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full Email View */}
          <div className="w-full md:w-3/5 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
            {selectedEmail ? (
              <div className="p-4 sm:p-6 flex flex-col h-full space-y-4">
                {/* Email Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(selectedEmail.type)}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Intl.DateTimeFormat('pt-PT', {
                          dateStyle: 'full',
                          timeStyle: 'medium'
                        }).format(new Date(selectedEmail.sentAt))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedEmail.bodyText)}
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Copiar texto da notificação"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCurrent(selectedEmail.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="Eliminar este e-mail do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 w-16 shrink-0">De:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono">
                        {selectedEmail.sender}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 w-16 shrink-0">Para:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {selectedEmail.recipientTeacherName} <span className="font-mono text-slate-500 font-normal">&lt;{selectedEmail.recipientEmail}&gt;</span>
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 w-16 shrink-0">Assunto:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-sm">
                        {selectedEmail.subject}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email HTML Render Container */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
                  <iframe
                    title="Visualização de E-mail"
                    srcDoc={selectedEmail.bodyHtml}
                    className="w-full h-[460px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-3">
                  <Mail className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Selecione uma mensagem para ler
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Clique numa notificação na lista à esquerda para consultar a versão oficial enviada por e-mail ao docente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Universidade Tobas • Notificador Automático de Grade Horária</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
