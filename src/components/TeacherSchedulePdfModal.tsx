import React, { useState, useMemo } from 'react';
import { 
  X, Printer, Download, FileText, Calendar, User as UserIcon, 
  Building2, Clock, CheckCircle2, AlertTriangle, FileCheck, 
  Sliders, BookOpen, MapPin, Award
} from 'lucide-react';
import { 
  Teacher, AcademicPeriod, User, ScheduleItem, 
  Subject, ClassGroup, Room, Department 
} from '../types';
import { generateTeacherSchedulePdf } from '../services/teacherSchedulePdfService';

interface TeacherSchedulePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  teachers: Teacher[];
  periods: AcademicPeriod[];
  schedules: ScheduleItem[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  departments: Department[];
  defaultTeacherId?: string;
  defaultPeriodId?: string;
  onNotify?: (title: string, message: string, type: 'success' | 'warning' | 'alert' | 'info') => void;
}

export const TeacherSchedulePdfModal: React.FC<TeacherSchedulePdfModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teachers,
  periods,
  schedules,
  subjects,
  classes,
  rooms,
  departments,
  defaultTeacherId,
  defaultPeriodId,
  onNotify,
}) => {
  // Current active period (defaults to active or first)
  const currentPeriod = useMemo(() => {
    return periods.find(p => p.id === defaultPeriodId) || 
           periods.find(p => p.isCurrent || p.status === 'Ativo') || 
           periods[0];
  }, [periods, defaultPeriodId]);

  // Selected Teacher and Period state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (defaultTeacherId) return defaultTeacherId;
    if (currentUser.role === 'docente' && currentUser.teacherId) return currentUser.teacherId;
    return teachers[0]?.id || '';
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    return currentPeriod?.id || periods[0]?.id || '';
  });

  // PDF Configuration options
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeGrid, setIncludeGrid] = useState(true);
  const [includeTable, setIncludeTable] = useState(true);
  const [includeWorkloadAnalysis, setIncludeWorkloadAnalysis] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [officialNotes, setOfficialNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Synchronize defaults if changed externally
  React.useEffect(() => {
    if (defaultTeacherId) {
      setSelectedTeacherId(defaultTeacherId);
    } else if (currentUser.role === 'docente' && currentUser.teacherId) {
      setSelectedTeacherId(currentUser.teacherId);
    }
  }, [defaultTeacherId, currentUser]);

  React.useEffect(() => {
    if (defaultPeriodId) {
      setSelectedPeriodId(defaultPeriodId);
    }
  }, [defaultPeriodId]);

  if (!isOpen) return null;

  // Selected entities
  const teacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const period = periods.find(p => p.id === selectedPeriodId) || periods[0];
  const department = departments.find(d => d.id === teacher?.departmentId);

  // Filter schedules for preview
  const teacherSchedules = schedules.filter(s => 
    s.teacherId === teacher?.id && 
    (s.academicPeriodId === period?.id || s.periodId === period?.id || !s.academicPeriodId) &&
    s.status !== 'Cancelado'
  );

  // Calculate teacher scheduled hours
  let totalMinutes = 0;
  for (const s of teacherSchedules) {
    const [sh, sm] = (s.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (s.endTime || '10:00').split(':').map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
  }
  const totalWeeklyHours = Number((totalMinutes / 60).toFixed(1));
  const maxWeeklyHours = teacher?.workloadLimit || 16;
  const isOverloaded = totalWeeklyHours > maxWeeklyHours;
  const workloadPercentage = Math.round((totalWeeklyHours / maxWeeklyHours) * 100);

  // Subject and Class helper lookup
  const subjectMap = useMemo(() => new Map<string, Subject>(subjects.map(s => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map<string, ClassGroup>(classes.map(c => [c.id, c])), [classes]);
  const roomMap = useMemo(() => new Map<string, Room>(rooms.map(r => [r.id, r])), [rooms]);

  // Build PDF Document instance
  const buildPdf = () => {
    if (!teacher || !period) return null;
    return generateTeacherSchedulePdf({
      teacher,
      period,
      currentUser,
      schedules,
      subjects,
      classes,
      rooms,
      departments,
      orientation,
      includeGrid,
      includeTable,
      includeWorkloadAnalysis,
      includeSignatures,
      officialNotes: officialNotes.trim() || undefined,
    });
  };

  const handleDownloadPdf = () => {
    try {
      setIsGenerating(true);
      const doc = buildPdf();
      if (!doc) throw new Error('Não foi possível compilar o documento PDF.');

      const cleanTeacherName = teacher.name.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanPeriod = (period.academicYear + '_' + period.semester).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Horario_${cleanTeacherName}_${cleanPeriod}.pdf`;

      doc.save(filename);

      if (onNotify) {
        onNotify(
          'PDF Descarregado com Sucesso',
          `A grade horária de ${teacher.name} para o período ${period.academicYear} (${period.semester}) foi transferida.`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      if (onNotify) {
        onNotify('Erro ao Gerar PDF', err?.message || 'Falha ao processar a grade horária.', 'alert');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      setIsGenerating(true);
      const doc = buildPdf();
      if (!doc) throw new Error('Não foi possível gerar a visualização de impressão.');

      const blobUrl = doc.output('bloburl');
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.focus();
      }

      if (onNotify) {
        onNotify(
          'Documento Enviado para Impressão',
          `Grade horária oficial de ${teacher.name} aberta no visualizador de impressão.`,
          'info'
        );
      }
    } catch (err: any) {
      console.error('Print error:', err);
      if (onNotify) {
        onNotify('Erro ao Imprimir', err?.message || 'Falha ao abrir impressão.', 'alert');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Emissão Oficial de Grade Horária Individual (PDF)
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SGHD Docente
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gere e imprima a folha de serviço e distribuição letiva individual com validação de conformidade RN06
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-sm">
          {/* Top Filter Selection: Docente & Período Académico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* Teacher Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                Docente Selecionado: <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                disabled={currentUser.role === 'docente' && !!currentUser.teacherId}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
              >
                {teachers.map(t => {
                  const dept = departments.find(d => d.id === t.departmentId);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code || t.id}) • {dept?.name || 'Geral'}
                    </option>
                  );
                })}
              </select>
              {currentUser.role === 'docente' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Fixado no seu perfil de docente autenticado.
                </p>
              )}
            </div>

            {/* Academic Period Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Período Académico: <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.academicYear} • {p.semester} ({p.status || (p.isCurrent ? 'Ativo' : 'Histórico')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Summary Card & Workload Status */}
          {teacher && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {teacher.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {teacher.code || teacher.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                    {teacher.category || 'Docente'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {department?.name || 'Departamento Geral'}
                  </span>
                  <span>•</span>
                  <span>Regime: {teacher.contractType || 'Tempo Integral'}</span>
                  <span>•</span>
                  <span>E-mail: {teacher.email || 'N/D'}</span>
                </div>
              </div>

              {/* Workload Metric */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className={`p-2 rounded-lg ${isOverloaded ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'}`}>
                  {isOverloaded ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                    Carga Semanal
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {totalWeeklyHours}h / {maxWeeklyHours}h max
                    <span className={`ml-1.5 text-xs font-semibold ${isOverloaded ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ({workloadPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Preview Quick List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Aulas Atribuídas no Período Selecionado ({teacherSchedules.length})
              </h4>
              <span className="text-xs text-slate-500">
                {period?.academicYear} • {period?.semester}
              </span>
            </div>

            {teacherSchedules.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                Nenhuma aula cadastrada para este docente no período académico selecionado. O documento PDF indicará alocação letiva vazia.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                {teacherSchedules.map(item => {
                  const sub = subjectMap.get(item.subjectId);
                  const cls = classMap.get(item.classId);
                  const rm = roomMap.get(item.roomId);
                  return (
                    <div 
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span className="truncate">{sub?.name || 'Disciplina'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {item.dayOfWeek}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.startTime} - {item.endTime}
                        </span>
                        <span>Turma: {cls?.code || '---'}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Sala: {rm?.code || '---'}</span>
                        <span className="ml-auto text-[10px] text-slate-400 uppercase">({item.lessonType})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PDF Customization Options */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Opções de Composição do Documento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Orientation */}
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Orientação da Página:</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Paisagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Retrato
                  </button>
                </div>
              </div>

              {/* Toggle Grid */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Grade Semanal Visual</span>
              </label>

              {/* Toggle Table */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTable}
                  onChange={(e) => setIncludeTable(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Lista Detalhada de Aulas</span>
              </label>

              {/* Toggle Signatures */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Campos de Assinatura</span>
              </label>
            </div>

            {/* Workload Toggle & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWorkloadAnalysis}
                  onChange={(e) => setIncludeWorkloadAnalysis(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Auditoria RN06 (Conformidade)</span>
              </label>

              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Observações administrativas oficiais para constar no rodapé do documento (opcional)"
                  value={officialNotes}
                  onChange={(e) => setOfficialNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Documento formatado segundo os padrões institucionais da Universidade Tobas</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={isGenerating || !teacher}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Grade</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || !teacher}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>A processar...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descarregar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
