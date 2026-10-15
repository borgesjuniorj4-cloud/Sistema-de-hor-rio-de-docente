import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Download, Upload, Database, HardDrive, FileJson, 
  CheckCircle2, AlertTriangle, RotateCcw, RefreshCw, Layers, 
  Users, Calendar, School, BookOpen, Clock, FileText, 
  Check, Copy, Eye, ArrowRight, Sparkles, Building2, HelpCircle,
  Award, GraduationCap, UserCheck, Trash2, Edit3, X, UserPlus, Lock,
  ShieldCheck, LogIn
} from 'lucide-react';
import { 
  User, Teacher, Department, Course, Subject, 
  ClassGroup, Room, AcademicPeriod, TeacherAvailability, 
  ScheduleItem, ChangeRequest, NotificationItem, AuditLog 
} from '../types';
import { StorageService } from '../services/storageService';

interface AdminViewProps {
  currentUser: User;
  users: User[];
  teachers: Teacher[];
  departments: Department[];
  courses: Course[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  periods: AcademicPeriod[];
  availabilities: TeacherAvailability[];
  schedules: ScheduleItem[];
  changeRequests: ChangeRequest[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  onRestoreState: (restoredData: any) => void;
  onResetToDefaults: () => void;
  onLogAudit: (action: string, entity: string, entityId: string, details: string) => void;
  onNotify: (title: string, message: string, type: 'success' | 'warning' | 'alert' | 'info') => void;
  onAppointDirector?: (
    departmentId: string, 
    directorName: string, 
    directorEmail?: string, 
    teacherId?: string,
    customPassword?: string,
    teacherCategory?: string
  ) => { user: User; teacher: Teacher; password: string } | null | void;
  onAppointCoordinator?: (
    courseId: string, 
    coordinatorName: string, 
    coordinatorEmail?: string, 
    teacherId?: string,
    customPassword?: string,
    teacherCategory?: string
  ) => { user: User; teacher: Teacher; password: string } | null | void;
  onRevokeDirector?: (departmentId: string) => void;
  onRevokeCoordinator?: (courseId: string) => void;
  onSwitchUser?: (user: User) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  users,
  teachers,
  departments,
  courses,
  subjects,
  classes,
  rooms,
  periods,
  availabilities,
  schedules,
  changeRequests,
  auditLogs,
  notifications,
  onRestoreState,
  onResetToDefaults,
  onLogAudit,
  onNotify,
  onAppointDirector,
  onAppointCoordinator,
  onRevokeDirector,
  onRevokeCoordinator,
  onSwitchUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'leadership' | 'backup_restore' | 'storage_inspector' | 'system_info'>('leadership');
  
  // Leadership appointment modal states
  const [directorModalDept, setDirectorModalDept] = useState<Department | null>(null);
  const [coordinatorModalCourse, setCoordinatorModalCourse] = useState<Course | null>(null);
  const [appointeeName, setAppointeeName] = useState('');
  const [appointeeEmail, setAppointeeEmail] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [appointeePassword, setAppointeePassword] = useState('diretor123');
  const [appointeeCategory, setAppointeeCategory] = useState('Professor Catedrático');
  const [newCredentialsModal, setNewCredentialsModal] = useState<{
    role: 'diretor' | 'coordenador';
    roleTitle: string;
    targetName: string;
    teacherName: string;
    email: string;
    password: string;
    user?: User;
  } | null>(null);
  const [copiedAppointeeCredentials, setCopiedAppointeeCredentials] = useState(false);
  
  // Storage statistics
  const [storageStats, setStorageStats] = useState(() => StorageService.getStorageStatistics());
  
  // Refresh stats helper
  const refreshStats = () => {
    setStorageStats(StorageService.getStorageStatistics());
  };

  useEffect(() => {
    refreshStats();
  }, [users, teachers, schedules, rooms, classes, subjects]);

  // Export state
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [previewExportJson, setPreviewExportJson] = useState<string>('');
  const [copiedExport, setCopiedExport] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessModal, setRestoreSuccessModal] = useState<{ open: boolean; counts?: Record<string, number> }>({ open: false });

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Handle Export
  const handleExportBackup = (download = true) => {
    try {
      const backupPayload = StorageService.exportFullStorageBackup(currentUser, download);
      const timestampStr = new Date().toLocaleString('pt-PT');
      setLastExportedAt(timestampStr);
      setExportSuccessMessage(`Backup exportado com sucesso (${backupPayload.metadata.totalStorageKeys} chaves do localStorage).`);
      
      onLogAudit(
        'BACKUP',
        'Sistema',
        'localstorage-backup',
        `Exportação completa do estado do localStorage efetuada por ${currentUser.name}. Ficheiro JSON gerado.`
      );

      onNotify(
        'Backup Exportado com Sucesso',
        'O ficheiro JSON com o estado completo do localStorage foi transferido para o seu computador.',
        'success'
      );

      refreshStats();
    } catch (err: any) {
      console.error('Export error:', err);
      onNotify('Erro ao Exportar', 'Ocorreu um erro ao gerar o ficheiro de backup.', 'alert');
    }
  };

  const handleOpenExportPreview = () => {
    const backupPayload = StorageService.exportFullStorageBackup(currentUser, false);
    setPreviewExportJson(JSON.stringify(backupPayload, null, 2));
    setShowExportPreview(true);
  };

  const handleCopyPreviewJson = () => {
    if (previewExportJson) {
      navigator.clipboard.writeText(previewExportJson);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    }
  };

  // Handle file selection
  const processJsonFile = (file: File) => {
    setImportError(null);
    setSelectedFile(file);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportError('Por favor selecione um ficheiro com extensão .json válido.');
      setParsedBackupData(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Conteúdo do ficheiro não é um objeto JSON válido.');
        }

        const hasState = !!parsed.state;
        const hasRaw = !!parsed.rawLocalStorage;
        const hasDirectEntities = Array.isArray(parsed.teachers) || Array.isArray(parsed.schedules);

        if (!hasState && !hasRaw && !hasDirectEntities) {
          throw new Error('O ficheiro JSON não contém uma estrutura de dados de backup reconhecível do SGHD.');
        }

        setParsedBackupData(parsed);
      } catch (err: any) {
        console.error('Error parsing JSON backup:', err);
        setImportError(`Erro ao processar ficheiro: ${err?.message || 'JSON inválido ou corrompido.'}`);
        setParsedBackupData(null);
      }
    };
    reader.onerror = () => {
      setImportError('Falha ao ler o ficheiro local.');
      setParsedBackupData(null);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processJsonFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processJsonFile(e.dataTransfer.files[0]);
    }
  };

  // Execute restore
  const handleExecuteRestore = () => {
    if (!parsedBackupData) return;

    setIsRestoring(true);
    setTimeout(() => {
      try {
        const result = StorageService.importFullStorageBackup(parsedBackupData);

        if (!result.success || !result.restoredData) {
          setImportError(result.message);
          setIsRestoring(false);
          return;
        }

        // Propagate restored data to App.tsx react state
        onRestoreState(result.restoredData);

        onLogAudit(
          'RESTORE',
          'Sistema',
          'localstorage-restore',
          `Restauração completa do estado da aplicação executada a partir de ficheiro ${selectedFile?.name || 'JSON'}.`
        );

        onNotify(
          'Estado Restaurado com Sucesso',
          'Todos os dados e o localStorage da aplicação foram atualizados com o backup.',
          'success'
        );

        setRestoreSuccessModal({ open: true, counts: result.counts });
        setSelectedFile(null);
        setParsedBackupData(null);
        refreshStats();
      } catch (err: any) {
        console.error('Error in restore execution:', err);
        setImportError(`Erro durante a restauração: ${err?.message || 'Falha desconhecida.'}`);
      } finally {
        setIsRestoring(false);
      }
    }, 400);
  };

  // Cancel selection
  const handleCancelImport = () => {
    setSelectedFile(null);
    setParsedBackupData(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Inspect storage keys
  const getLocalStorageEntries = () => {
    const list: { key: string; size: number; isSghd: boolean; preview: string }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          list.push({
            key,
            size: (key.length + val.length) * 2,
            isSghd: key.startsWith('sghd_'),
            preview: val.length > 100 ? val.substring(0, 100) + '...' : val,
          });
        }
      }
    } catch {
      // ignore
    }
    return list.sort((a, b) => b.size - a.size);
  };

  const storageEntries = getLocalStorageEntries();

  // Summary counts extracted from parsed file
  const getBackupSummaryCounts = () => {
    if (!parsedBackupData) return null;
    const metadataSummary = parsedBackupData.metadata?.summary;
    if (metadataSummary) return metadataSummary;

    const state = parsedBackupData.state || parsedBackupData;
    return {
      teachers: Array.isArray(state.teachers) ? state.teachers.length : 0,
      schedules: Array.isArray(state.schedules) ? state.schedules.length : 0,
      classes: Array.isArray(state.classes) ? state.classes.length : 0,
      rooms: Array.isArray(state.rooms) ? state.rooms.length : 0,
      subjects: Array.isArray(state.subjects) ? state.subjects.length : 0,
      departments: Array.isArray(state.departments) ? state.departments.length : 0,
      courses: Array.isArray(state.courses) ? state.courses.length : 0,
      users: Array.isArray(state.users) ? state.users.length : 0,
      auditLogs: Array.isArray(state.auditLogs) ? state.auditLogs.length : 0,
    };
  };

  const fileSummary = getBackupSummaryCounts();

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Painel de Administração do Sistema
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Operacional
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Gestão de persistência, exportação integral do estado do <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-mono text-xs">localStorage</code> para ficheiro JSON e restauração de cópias de segurança.
            </p>
          </div>
        </div>

        {/* Quick Export CTA in header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-admin-quick-export"
            onClick={() => handleExportBackup(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Storage KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Armazenamento Local</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {storageStats.estimatedSizeKB} KB
            </span>
            <span className="text-xs text-slate-500">utilizados</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Quota total disponível: ~5 000 KB (LocalStorage do navegador)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chaves no LocalStorage</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {storageStats.sghdKeys}
            </span>
            <span className="text-xs text-slate-500">chaves ativas SGHD</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {storageStats.totalKeys} chaves totais no browser
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Horários / Aulas</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {storageStats.counts.schedules}
            </span>
            <span className="text-xs text-slate-500">sessões letivas</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {storageStats.counts.teachers} docentes • {storageStats.counts.classes} turmas
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Última Exportação</span>
            <FileJson className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {lastExportedAt || 'Nenhum nesta sessão'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Formato: JSON 2.0 com integridade completa
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button
          id="tab-admin-leadership"
          onClick={() => setActiveSubTab('leadership')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'leadership'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-300" />
          <span>Diretores & Coordenadores (Exclusivo Admin)</span>
        </button>
        <button
          id="tab-admin-backup-restore"
          onClick={() => setActiveSubTab('backup_restore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'backup_restore'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Exportar & Restaurar Backup JSON</span>
        </button>
        <button
          id="tab-admin-storage-inspector"
          onClick={() => setActiveSubTab('storage_inspector')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'storage_inspector'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Inspecionar LocalStorage ({storageEntries.length})</span>
        </button>
        <button
          id="tab-admin-system-info"
          onClick={() => setActiveSubTab('system_info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'system_info'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Informações do Sistema</span>
        </button>
      </div>

      {/* TAB: LEADERSHIP (DIRETORES & COORDENADORES - EXCLUSIVO ADMIN) */}
      {activeSubTab === 'leadership' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Statutory Policy Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 rounded-2xl border border-indigo-800/60 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">Nomeação de Diretores de Departamento e Coordenadores de Curso</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      Competência Exclusiva do Administrador
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Em conformidade com as regras institucionais da Universidade Tobas, a adição, nomeação e destituição dos 
                    <strong> Diretores de Departamento</strong> e <strong>Coordenadores de Curso</strong> é efetuada exclusivamente 
                    pela conta de Administrador. A nomeação atribui as permissões estatutárias de gestão académica e credenciais institucionais.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-admin-appoint-director-quick"
                  onClick={() => {
                    const first = departments.find(d => !d.director && !d.manager) || departments[0];
                    if (first) {
                      setDirectorModalDept(first);
                      setAppointeeName('');
                      setAppointeeEmail('');
                      setSelectedTeacherId('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nomear Diretor</span>
                </button>
                <button
                  id="btn-admin-appoint-coord-quick"
                  onClick={() => {
                    const first = courses.find(c => !c.coordinator) || courses[0];
                    if (first) {
                      setCoordinatorModalCourse(first);
                      setAppointeeName('');
                      setAppointeeEmail('');
                      setSelectedTeacherId('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Nomear Coordenador</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Diretores de Departamento */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Diretores de Departamento</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {departments.filter(d => Boolean(d.director || d.manager)).length} de {departments.length} departamentos com diretor nomeado
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Diretor em Funções</th>
                    <th className="py-2.5 px-3">E-mail Institucional</th>
                    <th className="py-2.5 px-3">Nomeação</th>
                    <th className="py-2.5 px-3 text-right">Ações do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {departments.map(dept => {
                    const currentDirector = dept.director || dept.manager;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{dept.code}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{dept.name}</td>
                        <td className="py-3 px-3">
                          {currentDirector ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                                <Shield className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{currentDirector}</span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                              Vago (Pendente)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {dept.directorEmail || `${dept.code.toLowerCase()}@instituicao.edu`}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {dept.appointedBy ? (
                            <span>{dept.appointedBy}</span>
                          ) : (
                            <span className="text-slate-400">Padrão institucional</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-appoint-dir-${dept.id}`}
                              onClick={() => {
                                setDirectorModalDept(dept);
                                setAppointeeName(currentDirector || '');
                                setAppointeeEmail(dept.directorEmail || '');
                                setSelectedTeacherId(dept.directorId || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              title="Nomear ou substituir o Diretor"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{currentDirector ? 'Alterar' : 'Nomear'}</span>
                            </button>
                            {currentDirector && onRevokeDirector && (
                              <button
                                id={`btn-revoke-dir-${dept.id}`}
                                onClick={() => onRevokeDirector(dept.id)}
                                className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Revogar o cargo de Diretor"
                              >
                                Revogar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Coordenadores de Curso */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Coordenadores de Curso</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {courses.filter(c => Boolean(c.coordinator)).length} de {courses.length} cursos com coordenador nomeado
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Curso & Grau</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Coordenador em Funções</th>
                    <th className="py-2.5 px-3">E-mail Institucional</th>
                    <th className="py-2.5 px-3">Nomeação</th>
                    <th className="py-2.5 px-3 text-right">Ações do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {courses.map(course => {
                    const dept = departments.find(d => d.id === course.departmentId);
                    return (
                      <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{course.code}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          <div>{course.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{course.degree} • {course.duration}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{dept?.name || '—'}</td>
                        <td className="py-3 px-3">
                          {course.coordinator ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                                <Award className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{course.coordinator}</span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                              Vago (Pendente)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {course.coordinatorEmail || `${course.code.toLowerCase()}@instituicao.edu`}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {course.appointedBy ? (
                            <span>{course.appointedBy}</span>
                          ) : (
                            <span className="text-slate-400">Padrão institucional</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-appoint-coord-${course.id}`}
                              onClick={() => {
                                setCoordinatorModalCourse(course);
                                setAppointeeName(course.coordinator || '');
                                setAppointeeEmail(course.coordinatorEmail || '');
                                setSelectedTeacherId(course.coordinatorId || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                              title="Nomear ou substituir o Coordenador"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{course.coordinator ? 'Alterar' : 'Nomear'}</span>
                            </button>
                            {course.coordinator && onRevokeCoordinator && (
                              <button
                                id={`btn-revoke-coord-${course.id}`}
                                onClick={() => onRevokeCoordinator(course.id)}
                                className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Revogar o cargo de Coordenador"
                              >
                                Revogar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: BACKUP & RESTORE */}
      {activeSubTab === 'backup_restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* EXPORT SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Exportar Estado do LocalStorage
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gere uma cópia completa em ficheiro JSON local
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  .JSON
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Esta operação cria um ficheiro JSON estruturado contendo a totalidade das chaves e registos do <strong className="font-semibold text-slate-900 dark:text-white">localStorage</strong> do navegador:
                </p>

                {/* What is exported summary checklist */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Conteúdo incluído no ficheiro de exportação:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-400 pl-5 text-[11px]">
                    <div>• Docentes ({storageStats.counts.teachers})</div>
                    <div>• Horários ({storageStats.counts.schedules})</div>
                    <div>• Turmas ({storageStats.counts.classes})</div>
                    <div>• Salas & Labs ({storageStats.counts.rooms})</div>
                    <div>• Disciplinas ({storageStats.counts.subjects})</div>
                    <div>• Cursos ({storageStats.counts.courses})</div>
                    <div>• Departamentos ({storageStats.counts.departments})</div>
                    <div>• Períodos ({storageStats.counts.periods})</div>
                    <div>• Disponibilidades ({storageStats.counts.availabilities})</div>
                    <div>• Solicitações ({storageStats.counts.changeRequests})</div>
                    <div>• Utilizadores ({storageStats.counts.users})</div>
                    <div>• Logs de Auditoria ({storageStats.counts.auditLogs})</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Captura integral do mapa bruto <code className="font-mono text-indigo-600 dark:text-indigo-400">rawLocalStorage</code> para fidelidade total.</span>
                  </div>
                </div>

                {exportSuccessMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-admin-export-json"
                onClick={() => handleExportBackup(true)}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar Ficheiro JSON Local</span>
              </button>

              <button
                id="btn-admin-preview-json"
                onClick={handleOpenExportPreview}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                title="Visualizar a estrutura do JSON antes de descarregar"
              >
                <Eye className="w-4 h-4" />
                <span>Previsualizar</span>
              </button>
            </div>
          </div>

          {/* IMPORT & RESTORE SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Importar & Restaurar Estado
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Restaure a aplicação a partir de um ficheiro JSON
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  Restauração
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Carregue um ficheiro JSON exportado anteriormente para substituir o estado atual do sistema pelo estado contido na cópia de segurança:
                </p>

                {/* Dropzone / Upload area */}
                {!selectedFile && (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-900/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                      id="input-file-backup-json"
                    />
                    <FileJson className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Clique para escolher o ficheiro JSON ou arraste-o para aqui
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Aceita ficheiros de backup SGHD (<code className="font-mono">.json</code>)
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {importError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="font-semibold block">Erro na validação do ficheiro:</strong>
                      <span className="text-[11px] mt-0.5 block">{importError}</span>
                    </div>
                  </div>
                )}

                {/* File Inspection Preview when selected */}
                {selectedFile && parsedBackupData && (
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileJson className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={handleCancelImport}
                        className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Trocar ficheiro
                      </button>
                    </div>

                    {parsedBackupData.metadata && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                        <div>Exportado em: <strong className="text-slate-700 dark:text-slate-300">{new Date(parsedBackupData.metadata.exportedAt || '').toLocaleString('pt-PT')}</strong></div>
                        <div>Criado por: <strong className="text-slate-700 dark:text-slate-300">{parsedBackupData.metadata.exportedBy || 'Administrador'}</strong></div>
                      </div>
                    )}

                    {/* Breakdown of items to be restored */}
                    {fileSummary && (
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Registos detetados no backup:
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Horários</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.schedules}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Docentes</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.teachers}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Turmas</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.classes}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Salas</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.rooms}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Disciplinas</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.subjects}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 block text-[10px]">Utilizadores</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fileSummary.users}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>A restauração substituirá os dados atuais do localStorage pelos dados deste ficheiro.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
              {selectedFile && parsedBackupData ? (
                <>
                  <button
                    id="btn-admin-cancel-restore"
                    onClick={handleCancelImport}
                    disabled={isRestoring}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    id="btn-admin-confirm-restore"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>A restaurar estado...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar & Restaurar Aplicação</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  id="btn-admin-choose-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Ficheiro JSON</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: STORAGE INSPECTOR */}
      {activeSubTab === 'storage_inspector' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Inspecionar Chaves Armazenadas no LocalStorage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualização técnica de todas as chaves, respetivos tamanhos em bytes e pré-visualização dos dados guardados.
              </p>
            </div>
            <button
              onClick={refreshStats}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Leituras</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-2.5 px-3">Chave no LocalStorage</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Tamanho Estimado</th>
                  <th className="py-2.5 px-3">Amostra do Valor JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {storageEntries.map((entry) => (
                  <tr key={entry.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {entry.key}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.isSghd ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                          SGHD Core
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Geral
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {(entry.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {entry.preview}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM INFO & DANGEROUS ACTIONS */}
      {activeSubTab === 'system_info' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Parâmetros Globais do Sistema • Universidade Tobas (SGHD)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ambiente de Execução:</span>
                <p className="text-slate-500 dark:text-slate-400">Navegador Cliente com Armazenamento Persistente Offline-First.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ano Académico Ativo:</span>
                <p className="text-slate-500 dark:text-slate-400">2026 • 1º Semestre Letivo</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Política de Bloqueio por Inatividade:</span>
                <p className="text-slate-500 dark:text-slate-400">30 minutos com preservação de estado seguro.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Motor de Validação de Conflitos:</span>
                <p className="text-slate-500 dark:text-slate-400">RN01 a RN07 (Docentes, Salas, Turmas, Carga Horária, Janelas, Limites Diários).</p>
              </div>
            </div>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Zona Crítica • Repor Dados Iniciais de Demonstração
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-xl">
                  Esta ação limpa as alterações efetuadas e repõe os dados de exemplo pré-carregados (docentes, disciplinas, salas, turmas e horários de teste). Recomenda-se exportar um backup antes de prosseguir.
                </p>
              </div>
              <button
                id="btn-admin-open-reset-modal"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                Repor Dados de Exemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW EXPORT JSON */}
      {showExportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Pré-visualização do Ficheiro JSON de Backup
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPreviewJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedExport ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={() => setShowExportPreview(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950 rounded-b-xl text-slate-200 font-mono text-xs">
              <pre className="whitespace-pre">{previewExportJson}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-500">
                Tamanho aproximado: {(previewExportJson.length / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={() => {
                  setShowExportPreview(false);
                  handleExportBackup(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar Este JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESTORE SUCCESS */}
      {restoreSuccessModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Estado Restaurado com Sucesso!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Todas as chaves do localStorage e estruturas da aplicação foram restauradas a partir do ficheiro de backup.
            </p>

            {restoreSuccessModal.counts && (
              <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>• Horários: <strong>{restoreSuccessModal.counts.schedules}</strong></div>
                <div>• Docentes: <strong>{restoreSuccessModal.counts.teachers}</strong></div>
                <div>• Turmas: <strong>{restoreSuccessModal.counts.classes}</strong></div>
                <div>• Salas: <strong>{restoreSuccessModal.counts.rooms}</strong></div>
                <div>• Disciplinas: <strong>{restoreSuccessModal.counts.subjects}</strong></div>
                <div>• Utilizadores: <strong>{restoreSuccessModal.counts.users}</strong></div>
              </div>
            )}

            <button
              onClick={() => setRestoreSuccessModal({ open: false })}
              className="w-full mt-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Concluir & Continuar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Repor Dados Iniciais de Demonstração?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Esta ação reiniciará todos os dados armazenados no navegador para o conjunto padrão inicial do SGHD.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  onResetToDefaults();
                  refreshStats();
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Sim, Repor Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOMEAR / ALTERAR DIRETOR DE DEPARTAMENTO (EXCLUSIVO ADMIN) */}
      {directorModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200 dark:border-indigo-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Nomear Diretor de Departamento
                  </h3>
                  <p className="text-[11px] text-purple-600 font-medium">Competência Exclusiva do Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setDirectorModalDept(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs">
              <div className="font-semibold text-indigo-950 dark:text-indigo-200">{directorModalDept.name} ({directorModalDept.code})</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Diretor Atual: <strong>{directorModalDept.director || directorModalDept.manager || 'Nenhum nomeado'}</strong>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (onAppointDirector && directorModalDept) {
                  const res = onAppointDirector(
                    directorModalDept.id,
                    appointeeName.trim(),
                    appointeeEmail.trim(),
                    selectedTeacherId || undefined,
                    appointeePassword.trim() || undefined,
                    appointeeCategory
                  );
                  setDirectorModalDept(null);
                  if (res && typeof res === 'object') {
                    setNewCredentialsModal({
                      role: 'diretor',
                      roleTitle: `Diretor do ${directorModalDept.name}`,
                      targetName: directorModalDept.name,
                      teacherName: res.teacher?.name || appointeeName,
                      email: res.user?.email || appointeeEmail,
                      password: res.password,
                      user: res.user,
                    });
                  }
                } else {
                  setDirectorModalDept(null);
                }
              }}
              className="mt-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Vincular a Docente/Professor Existente:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={e => {
                    const tId = e.target.value;
                    setSelectedTeacherId(tId);
                    const t = teachers.find(item => item.id === tId);
                    if (t) {
                      setAppointeeName(t.name);
                      setAppointeeEmail(t.email);
                      setAppointeeCategory(t.category);
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Registar Novo Professor / Docente --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} • {departments.find(d => d.id === t.departmentId)?.code || 'UT'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nome Completo do Professor / Diretor: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex.: Prof. Dr. Manuel Cardoso"
                  value={appointeeName}
                  onChange={e => setAppointeeName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    E-mail Institucional (Login):
                  </label>
                  <input
                    type="email"
                    placeholder="ex.: diretor.inf@instituicao.edu"
                    value={appointeeEmail}
                    onChange={e => setAppointeeEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Categoria do Docente:
                  </label>
                  <select
                    value={appointeeCategory}
                    onChange={e => setAppointeeCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Professor Catedrático">Professor Catedrático</option>
                    <option value="Professor Associado">Professor Associado</option>
                    <option value="Professor Auxiliar">Professor Auxiliar</option>
                    <option value="Professor Convidado">Professor Convidado</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-800 dark:text-slate-200">
                    Palavra-passe de Acesso Inicial:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
                      let code = '';
                      for (let i = 0; i < 6; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                      setAppointeePassword(`Dir#${code}`);
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                  >
                    Gerar Senha Segura
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="ex.: diretor123"
                  value={appointeePassword}
                  onChange={e => setAppointeePassword(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Requisitos Estatutários Obrigatórios:</span>
                </div>
                <div>
                  • O Diretor de Departamento é obrigatoriamente integrado como <strong>Professor/Docente</strong> no sistema.
                </div>
                <div>
                  • Recebe credenciais ativas e a prerrogativa de <strong>validar e homologar os horários</strong> departamentais.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDirectorModalDept(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!appointeeName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Nomeação de Diretor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOMEAR / ALTERAR COORDENADOR DE CURSO (EXCLUSIVO ADMIN) */}
      {coordinatorModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Nomear Coordenador de Curso
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-medium">Competência Exclusiva do Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setCoordinatorModalCourse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs">
              <div className="font-semibold text-emerald-950 dark:text-emerald-200">
                {coordinatorModalCourse.name} ({coordinatorModalCourse.code} • {coordinatorModalCourse.degree})
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Coordenador Atual: <strong>{coordinatorModalCourse.coordinator || 'Nenhum nomeado'}</strong>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (onAppointCoordinator && coordinatorModalCourse) {
                  const res = onAppointCoordinator(
                    coordinatorModalCourse.id,
                    appointeeName.trim(),
                    appointeeEmail.trim(),
                    selectedTeacherId || undefined,
                    appointeePassword.trim() || undefined,
                    appointeeCategory
                  );
                  setCoordinatorModalCourse(null);
                  if (res && typeof res === 'object') {
                    setNewCredentialsModal({
                      role: 'coordenador',
                      roleTitle: `Coordenador de ${coordinatorModalCourse.name}`,
                      targetName: coordinatorModalCourse.name,
                      teacherName: res.teacher?.name || appointeeName,
                      email: res.user?.email || appointeeEmail,
                      password: res.password,
                      user: res.user,
                    });
                  }
                } else {
                  setCoordinatorModalCourse(null);
                }
              }}
              className="mt-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Vincular a Docente/Professor Existente:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={e => {
                    const tId = e.target.value;
                    setSelectedTeacherId(tId);
                    const t = teachers.find(item => item.id === tId);
                    if (t) {
                      setAppointeeName(t.name);
                      setAppointeeEmail(t.email);
                      setAppointeeCategory(t.category);
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Registar Novo Professor / Docente --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} • {departments.find(d => d.id === t.departmentId)?.code || 'UT'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nome Completo do Professor / Coordenador: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex.: Prof. Dr. Fernando Ramos"
                  value={appointeeName}
                  onChange={e => setAppointeeName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    E-mail Institucional (Login):
                  </label>
                  <input
                    type="email"
                    placeholder="ex.: coordenador.inf@instituicao.edu"
                    value={appointeeEmail}
                    onChange={e => setAppointeeEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Categoria do Docente:
                  </label>
                  <select
                    value={appointeeCategory}
                    onChange={e => setAppointeeCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Professor Associado">Professor Associado</option>
                    <option value="Professor Auxiliar">Professor Auxiliar</option>
                    <option value="Professor Catedrático">Professor Catedrático</option>
                    <option value="Professor Convidado">Professor Convidado</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-800 dark:text-slate-200">
                    Palavra-passe de Acesso Inicial:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
                      let code = '';
                      for (let i = 0; i < 6; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                      setAppointeePassword(`Crd#${code}`);
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    Gerar Senha Segura
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="ex.: coord123"
                  value={appointeePassword}
                  onChange={e => setAppointeePassword(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Requisitos Estatutários Obrigatórios:</span>
                </div>
                <div>
                  • O Coordenador de Curso é obrigatoriamente cadastrado como <strong>Professor/Docente</strong> no sistema.
                </div>
                <div>
                  • Recebe credenciais de acesso para <strong>criar e organizar horários</strong> e <strong>adicionar docentes</strong> ao curso.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCoordinatorModalCourse(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!appointeeName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Nomeação de Coordenador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENCIAIS DE ACESSO DO DIRETOR / COORDENADOR NOMEADO */}
      {newCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Credenciais de Acesso Atribuídas
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Conta Ativa
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  A nomeação foi registada e a conta de acesso ao sistema foi provisionada com sucesso.
                </p>
              </div>
              <button
                onClick={() => setNewCredentialsModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Cargo Institucional:</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">{newCredentialsModal.roleTitle}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Professor Titular:</span>
                <span className="font-bold text-slate-900 dark:text-white">{newCredentialsModal.teacherName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">E-mail (Login):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white select-all">{newCredentialsModal.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Palavra-passe:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 select-all">{newCredentialsModal.password}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-300">
              {newCredentialsModal.role === 'diretor' ? (
                <span>O Diretor pode agora aceder ao sistema para <strong>validar e homologar os horários</strong> deste departamento.</span>
              ) : (
                <span>O Coordenador pode agora aceder ao sistema para <strong>criar os horários</strong> e <strong>adicionar docentes</strong> ao curso.</span>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => {
                  const text = `Credenciais SGHD Universidade Tobas\nCargo: ${newCredentialsModal.roleTitle}\nDocente: ${newCredentialsModal.teacherName}\nLogin: ${newCredentialsModal.email}\nSenha: ${newCredentialsModal.password}`;
                  navigator.clipboard.writeText(text);
                  setCopiedAppointeeCredentials(true);
                  setTimeout(() => setCopiedAppointeeCredentials(false), 2500);
                }}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedAppointeeCredentials ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Credenciais</span>
                  </>
                )}
              </button>

              {onSwitchUser && newCredentialsModal.user && (
                <button
                  onClick={() => {
                    const u = newCredentialsModal.user!;
                    setNewCredentialsModal(null);
                    onSwitchUser(u);
                  }}
                  className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Testar Acesso Imediato</span>
                </button>
              )}

              <button
                onClick={() => setNewCredentialsModal(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
