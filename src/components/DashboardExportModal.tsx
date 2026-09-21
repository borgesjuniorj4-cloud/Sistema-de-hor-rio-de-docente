import React, { useState } from 'react';
import { 
  X, FileDown, Printer, CheckCircle2, AlertTriangle, 
  Settings2, Eye, ShieldCheck, Calendar, School, Users, 
  BookOpen, Sparkles, Building2, Check 
} from 'lucide-react';
import { 
  Teacher, Room, ScheduleItem, Subject, ClassGroup, 
  AcademicPeriod, ScheduleConflict, ChangeRequest, User 
} from '../types';
import { downloadDashboardPdf, generateDashboardPdf, DashboardPdfOptions } from '../services/dashboardPdfService';

interface DashboardExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  schedules: ScheduleItem[];
  conflicts: ScheduleConflict[];
  changeRequests: ChangeRequest[];
  periods: AcademicPeriod[];
  onExportSuccess?: () => void;
}

export const DashboardExportModal: React.FC<DashboardExportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teachers = [],
  subjects = [],
  classes = [],
  rooms = [],
  schedules = [],
  conflicts = [],
  changeRequests = [],
  periods = [],
  onExportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    periods.find(p => p.isCurrent)?.id || periods[0]?.id || ''
  );

  // Configuration options
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [includeTeachers, setIncludeTeachers] = useState(true);
  const [filterOnlyOverloaded, setFilterOnlyOverloaded] = useState(false);
  const [includeRooms, setIncludeRooms] = useState(true);
  const [includeWorkflow, setIncludeWorkflow] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [managerNotes, setManagerNotes] = useState<string>(
    'Relatório consolidado de ocupação de espaços e alocação horária docente para validação da Direção Académica e Conselho Pedagógico.'
  );

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPeriod = periods.find(p => p.id === selectedPeriodId) || periods[0];
  const activeTeachers = teachers.filter(t => t.status === 'Ativo');
  const activeRooms = rooms.filter(r => r.status === 'Disponível');
  const scheduledLessons = schedules.filter(s => s.status !== 'Cancelado');
  const publishedCount = schedules.filter(s => s.status === 'Publicado').length;

  const handleDownload = () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const options: DashboardPdfOptions = {
        period: currentPeriod,
        currentUser,
        includeKpis,
        includeConflicts,
        includeTeachers,
        includeRooms,
        includeWorkflow,
        includeSignatures,
        managerNotes,
        filterOnlyOverloaded,
      };

      downloadDashboardPdf(
        {
          teachers,
          subjects,
          classes,
          rooms,
          schedules,
          conflicts,
          changeRequests,
          periods,
        },
        options
      );

      setDownloadSuccess(true);
      if (onExportSuccess) {
        onExportSuccess();
      }

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      const options: DashboardPdfOptions = {
        period: currentPeriod,
        currentUser,
        includeKpis,
        includeConflicts,
        includeTeachers,
        includeRooms,
        includeWorkflow,
        includeSignatures,
        managerNotes,
        filterOnlyOverloaded,
      };

      const doc = generateDashboardPdf(
        {
          teachers,
          subjects,
          classes,
          rooms,
          schedules,
          conflicts,
          changeRequests,
          periods,
        },
        options
      );

      const blobUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl.toString();
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      };

      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (e) {
      console.error('Print preview failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Exportar Relatório do Dashboard em PDF
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Módulo de Gestão Académica
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gere um documento executivo oficial consolidado para prestação de contas, Conselho Pedagógico ou arquivo.
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tabs inside modal */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-white">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Configurações do Relatório</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Pré-visualização do Documento</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'config' ? (
            <div className="space-y-6">
              
              {/* Period selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Período Académico de Referência
                  </label>
                  <select
                    id="select-export-period"
                    value={selectedPeriodId}
                    onChange={e => setSelectedPeriodId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.academicYear} • {p.semester} {p.isCurrent ? '(Atual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gestor Emissor Responsável
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (${currentUser.roleTitle})`}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              {/* Sections to include */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Secções a Incluir no Documento PDF
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* KPIs */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeKpis}
                      onChange={e => setIncludeKpis(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">1. Indicadores Globais (KPIs)</div>
                      <div className="text-[11px] text-slate-500">Docentes, disciplinas, turmas, salas e aulas alocadas.</div>
                    </div>
                  </label>

                  {/* Conflicts */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeConflicts}
                      onChange={e => setIncludeConflicts(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">2. Conflitos de Regras (RN01-RN07)</div>
                      <div className="text-[11px] text-slate-500">Relatório de violações pedagógicas ou atestado de conformidade total.</div>
                    </div>
                  </label>

                  {/* Teachers workload */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeTeachers}
                      onChange={e => setIncludeTeachers(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">3. Carga Horária Docente (RN06)</div>
                      <div className="text-[11px] text-slate-500">Horas alocadas, limites contratuais e identificação de sobrecarga.</div>
                    </div>
                  </label>

                  {/* Rooms occupancy */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeRooms}
                      onChange={e => setIncludeRooms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">4. Ocupação de Salas & Laboratórios</div>
                      <div className="text-[11px] text-slate-500">Taxas de ocupação semanal e aproveitamento dos espaços físicos.</div>
                    </div>
                  </label>

                  {/* Workflow */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeWorkflow}
                      onChange={e => setIncludeWorkflow(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">5. Ciclo de Aprovação e Publicação</div>
                      <div className="text-[11px] text-slate-500">Distribuição percentual: Rascunho, Validação, Aprovado, Publicado.</div>
                    </div>
                  </label>

                  {/* Signatures */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={e => setIncludeSignatures(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">6. Assinaturas e Carimbo Oficial</div>
                      <div className="text-[11px] text-slate-500">Campos de validação para Gestor Académico e Direção.</div>
                    </div>
                  </label>

                </div>
              </div>

              {/* Sub-options */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-700">Filtros e Refinamentos</div>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnlyOverloaded}
                    onChange={e => setFilterOnlyOverloaded(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Na secção de docentes, filtrar <strong>apenas aqueles que ultrapassaram o limite contratual</strong> (RN06)</span>
                </label>
              </div>

              {/* Manager notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Despacho / Observações do Gestor Académico
                </label>
                <textarea
                  rows={3}
                  value={managerNotes}
                  onChange={e => setManagerNotes(e.target.value)}
                  placeholder="Insira notas institucionais, justificativas ou recomendações que constarão no cabeçalho executivo..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Este texto será incorporado com destaque oficial na primeira página do relatório PDF.
                </p>
              </div>

            </div>
          ) : (
            /* Document Preview Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-800">
                <span>Esta é uma simulação fiel da estrutura e formatação das páginas do PDF gerado.</span>
                <span className="font-semibold">Formato A4 Oficial</span>
              </div>

              {/* Paper mockup */}
              <div className="bg-white border-2 border-slate-200 shadow-md rounded-xl p-6 max-w-2xl mx-auto space-y-5 text-slate-900 font-sans">
                
                {/* PDF Header block */}
                <div className="bg-slate-900 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold tracking-wide">UNIVERSIDADE TOBAS - CAMPUS CENTRAL</h4>
                      <p className="text-[11px] text-slate-300">SGHD • Sistema de Gestão de Horários e Alocação Docente</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-300">
                      <div>Relatório Executivo</div>
                      <div>{new Date().toLocaleDateString('pt-PT')}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-indigo-200">
                    Emitido por: {currentUser.name} ({currentUser.roleTitle}) • Período: {currentPeriod?.academicYear} ({currentPeriod?.semester})
                  </div>
                </div>

                {/* Manager Notes callout */}
                {managerNotes && (
                  <div className="p-3 bg-slate-50 border-l-4 border-indigo-600 rounded-r text-xs text-slate-700">
                    <span className="font-bold block text-slate-900 text-[11px]">Despacho da Gestão Académica:</span>
                    <p className="italic text-[11px] mt-0.5">{managerNotes}</p>
                  </div>
                )}

                {/* KPI Preview */}
                {includeKpis && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>1. Indicadores Globais do Semestre (KPIs)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Consolidado</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <div className="text-slate-500 text-[10px]">Docentes Ativos</div>
                        <div className="text-base font-bold text-indigo-700">{activeTeachers.length}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <div className="text-slate-500 text-[10px]">Turmas Ativas</div>
                        <div className="text-base font-bold text-slate-800">{classes.length}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <div className="text-slate-500 text-[10px]">Aulas Agendadas</div>
                        <div className="text-base font-bold text-emerald-700">{scheduledLessons.length}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conflicts Preview */}
                {includeConflicts && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                      2. Auditoria e Validação de Conflitos (RN01-RN07)
                    </div>
                    {conflicts.length === 0 ? (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Conformidade Total: Nenhuma violação das regras RN01 a RN07 detetada.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-rose-50 text-rose-800 rounded border border-rose-200 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{conflicts.length} conflito(s) em análise pelo motor de auditoria.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Signatures block preview */}
                {includeSignatures && (
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
                    <div>
                      <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-semibold text-slate-800">
                        {currentUser.name}
                      </div>
                      <div>{currentUser.roleTitle}</div>
                    </div>
                    <div>
                      <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-semibold text-slate-800">
                        Conselho Pedagógico
                      </div>
                      <div>Homologação Institucional</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {downloadSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> PDF descarregado com sucesso!
              </span>
            )}
            {!downloadSuccess && (
              <span>Documento em PDF vetorial A4 pronto para download imediato.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-print-dashboard"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-confirm-download-pdf"
              disabled={isExporting}
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'A gerar PDF...' : 'Descarregar Relatório PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
