import React, { useState } from 'react';
import { 
  History, Search, Download, Filter, Clock, 
  User as UserIcon, ShieldAlert, CheckCircle2, ArrowRight, Trash2, X 
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogsViewProps {
  logs?: any[];
  userRole?: string;
  onDeleteLog?: (id: string) => void;
  onClearLogs?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ 
  logs = [], 
  userRole,
  onDeleteLog,
  onClearLogs 
}) => {
  const isAdmin = userRole === 'admin';
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [logToDelete, setLogToDelete] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = safeLogs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const userName = (log.userName || '').toLowerCase();
      const entityType = (log.entityType || log.entity || '').toLowerCase();
      const details = (log.details || log.newData || '').toLowerCase();
      return (
        userName.includes(q) ||
        entityType.includes(q) ||
        details.includes(q)
      );
    }
    return true;
  });

  const exportLogsCSV = () => {
    const headers = ['Data/Hora', 'Utilizador', 'Papel', 'Ação', 'Entidade', 'Detalhes'];
    const rows = filtered.map(l => [
      new Date(l.timestamp).toLocaleString('pt-PT'),
      l.userName || '',
      l.userRole || '',
      l.action || '',
      l.entityType || l.entity || '',
      `"${(l.details || l.newData || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_sghd_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PUBLISH':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AUTO_GENERATE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Módulo 20 & 33 (PDF Seção 20, 33)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {filtered.length} eventos registados
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Trilhas de Auditoria e Histórico
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreabilidade institucional de todas as alterações, autorias e transições de estado na grade.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onClearLogs && (
              <button
                id="btn-clear-all-audit-logs"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Limpar todo o registo de actividades"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Limpar Actividades</span>
              </button>
            )}
            <button
              onClick={exportLogsCSV}
              className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Trilhas (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por utilizador ou detalhe..."
              className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-500 font-medium shrink-0">Ação:</span>
            {['all', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'AUTO_GENERATE'].map(act => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                  filterAction === act ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {act === 'all' ? 'Todas' : act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Utilizador Responsável</th>
              <th className="py-3 px-4">Operação</th>
              <th className="py-3 px-4">Entidade</th>
              <th className="py-3 px-4">Detalhes e Valores Anteriores/Novos</th>
              {isAdmin && onDeleteLog && (
                <th className="py-3 px-4 text-right">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin && onDeleteLog ? 6 : 5} className="py-8 text-center text-slate-500">
                  Nenhum registo de auditoria encontrado.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-PT')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {log.entityType || log.entity || '---'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">
                    <div>{log.details || log.newData || '---'}</div>
                    {(log.previousValues || log.newValues) && (
                      <div className="mt-1 text-[10px] text-slate-400 font-mono">
                        {log.previousValues && <span className="line-through mr-2">Antigo: {JSON.stringify(log.previousValues)}</span>}
                        {log.newValues && <span className="text-indigo-600">Novo: {JSON.stringify(log.newValues)}</span>}
                      </div>
                    )}
                  </td>
                  {isAdmin && onDeleteLog && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        id={`btn-delete-log-${log.id}`}
                        onClick={() => setLogToDelete(log)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Eliminar este registo de auditoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Single Log Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm text-white">Eliminar Registo de Atividade</h3>
              </div>
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tem a certeza de que deseja remover permanentemente este registo de auditoria do sistema?
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{logToDelete.action} • {logToDelete.entityType || logToDelete.entity}</div>
                <div className="text-slate-500 mt-1">{logToDelete.details || logToDelete.newData}</div>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(logToDelete.timestamp).toLocaleString('pt-PT')} por {logToDelete.userName}</div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLogToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteLog && logToDelete) {
                      onDeleteLog(logToDelete.id);
                      setLogToDelete(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Eliminar Registo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Logs Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm text-white">Limpar Todo o Histórico de Atividades</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tem a certeza de que deseja apagar todos os <strong>{logs.length} registos</strong> do histórico de atividades de auditoria?
              </p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                Esta ação esvaziará permanentemente a trilha de auditoria armazenada.
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearLogs) {
                      onClearLogs();
                      setShowClearConfirm(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirmar Limpeza Total
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
