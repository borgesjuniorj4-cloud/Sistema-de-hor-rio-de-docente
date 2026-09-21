import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, Search, Filter, Download, Edit3, 
  Trash2, Mail, Phone, Building2, Clock, CheckCircle2, 
  AlertTriangle, X, Eye, EyeOff, FileText, ChevronRight,
  Key, ShieldCheck, Copy, Check, RefreshCw, Lock, Sparkles
} from 'lucide-react';
import { 
  Teacher, Department, ScheduleItem, TeacherStatus, 
  ContractType, UserRole, User 
} from '../types';

interface TeachersViewProps {
  teachers: Teacher[];
  departments: Department[];
  schedules: ScheduleItem[];
  userRole: UserRole;
  users?: User[];
  currentUserId?: string;
  currentTeacherId?: string;
  onSaveTeacher: (teacher: Partial<Teacher>) => { teacher: Teacher; user?: User; generatedPassword?: string } | void;
  onDeleteTeacher: (id: string, options?: { deleteSchedules?: boolean; deleteUserAccount?: boolean }) => void;
  onResetTeacherPassword?: (teacherId: string) => string | null;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers = [],
  departments = [],
  schedules = [],
  userRole,
  users = [],
  currentUserId,
  currentTeacherId,
  onSaveTeacher,
  onDeleteTeacher,
  onResetTeacherPassword,
}) => {
  const canEdit = ['admin', 'gestor'].includes(userRole);
  const isAdmin = userRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Administrator Credential Management states
  const [newlyCreatedCredentials, setNewlyCreatedCredentials] = useState<{
    teacher: Teacher;
    user: User;
    password: string;
  } | null>(null);
  const [credentialViewTeacher, setCredentialViewTeacher] = useState<Teacher | null>(null);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Teacher deletion confirmation state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleteSchedulesOption, setDeleteSchedulesOption] = useState(true);
  const [deleteAccountOption, setDeleteAccountOption] = useState(true);

  // Form states
  const [formData, setFormData] = useState<Partial<Teacher>>({
    code: '',
    name: '',
    gender: 'Masculino',
    birthDate: '1985-01-01',
    email: '',
    phone: '',
    departmentId: departments[0]?.id || '',
    category: 'Professor Auxiliar',
    specialization: '',
    contractType: 'Tempo Integral',
    workloadLimit: 16,
    status: 'Ativo',
    entryDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);

  // Calculate actual current workloads from active schedules
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of schedules) {
      if (s.status === 'Cancelado') continue;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      map.set(s.teacherId, (map.get(s.teacherId) || 0) + hours);
    }
    return map;
  }, [schedules]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (selectedDept !== 'all' && t.departmentId !== selectedDept) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (t.name || '').toLowerCase().includes(q) ||
          (t.code || '').toLowerCase().includes(q) ||
          (t.email || '').toLowerCase().includes(q) ||
          (t.specialization || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teachers, selectedDept, selectedStatus, searchQuery]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      code: `DOC${String(teachers.length + 1).padStart(3, '0')}`,
      name: '',
      gender: 'Masculino',
      birthDate: '1985-01-01',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      category: 'Professor Auxiliar',
      specialization: '',
      contractType: 'Tempo Integral',
      workloadLimit: 16,
      status: 'Ativo',
      entryDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacher);
    setIsModalOpen(true);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2500);
  };

  const handleResetPassword = (teacherId: string) => {
    if (!onResetTeacherPassword) return;
    const newPass = onResetTeacherPassword(teacherId);
    if (newPass) {
      setResetSuccessMessage(`Nova palavra-passe gerada com sucesso: ${newPass}`);
      setShowPasswordInModal(true);
      setTimeout(() => {
        setResetSuccessMessage(null);
      }, 6000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingTeacher?.id;
    const res = onSaveTeacher({
      ...formData,
      id: editingTeacher?.id,
    });
    setIsModalOpen(false);

    // If new teacher was created with automatic user and password, show credentials modal to admin
    if (isNew && res && typeof res === 'object' && 'generatedPassword' in res && res.generatedPassword && res.user) {
      setNewlyCreatedCredentials({
        teacher: res.teacher,
        user: res.user,
        password: res.generatedPassword,
      });
      setShowPasswordInModal(true);
    }
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Nome', 'Email', 'Telefone', 'Departamento', 'Categoria', 'Carga Máx', 'Carga Atual', 'Estado'];
    const rows = filteredTeachers.map(t => [
      t.code,
      t.name,
      t.email,
      t.phone,
      deptMap.get(t.departmentId) || '',
      t.category,
      `${t.workloadLimit}h`,
      `${teacherWorkloadMap.get(t.id) || 0}h`,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'relatorio_docentes_sghd.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TeacherStatus) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inativo':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Suspenso':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Em licença':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Módulo 5 (PDF Páginas 6-8)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {filteredTeachers.length} de {teachers.length} docentes listados
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Gestão de Docentes
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastro, contratos, especializações e monitorização de limites de carga horária semanal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-export-teachers"
              onClick={exportToCSV}
              className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar CSV</span>
            </button>

            {canEdit && (
              <button
                id="btn-new-teacher"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Docente</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, código ou especialização..."
              className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Departamentos</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Em licença">Em licença</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(teacher => {
          const currentHours = teacherWorkloadMap.get(teacher.id) || 0;
          const isOver = currentHours > teacher.workloadLimit;
          const percentage = Math.min(100, Math.round((currentHours / teacher.workloadLimit) * 100));

          return (
            <div 
              key={teacher.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{teacher.name}</h3>
                      <div className="text-[11px] text-slate-500 font-mono">{teacher.code} • {teacher.category}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(teacher.status)}`}>
                    {teacher.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{deptMap.get(teacher.departmentId) || 'Sem departamento'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-500">{teacher.email}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Especialização: <strong className="text-slate-700">{teacher.specialization}</strong>
                  </div>
                </div>

                {/* Workload bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Carga Horária Semanal:</span>
                    <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                      {currentHours}h / {teacher.workloadLimit}h ({teacher.contractType})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isOver ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  {isOver && (
                    <p className="text-[10px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Limite institucional excedido (RN06)
                    </p>
                  )}
                </div>
              </div>

              {/* Actions & Credential Authority */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* Credentials button: strictly accessible by Administrator or the specific Teacher */}
                {(isAdmin || (currentUserId && (teacher.userId === currentUserId || teacher.id === currentTeacherId))) ? (
                  <button
                    id={`btn-view-credentials-${teacher.id}`}
                    type="button"
                    onClick={() => {
                      setCredentialViewTeacher(teacher);
                      setShowPasswordInModal(false);
                      setCopiedNotification(null);
                      setResetSuccessMessage(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Autoridade Exclusiva: Ver e gerir credenciais de acesso do docente"
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Credenciais</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <Lock className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                    <span>Acesso reservado ao Admin</span>
                  </div>
                )}

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-edit-teacher-${teacher.id}`}
                      onClick={() => handleOpenEdit(teacher)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      id={`btn-delete-teacher-${teacher.id}`}
                      onClick={() => {
                        setTeacherToDelete(teacher);
                        setDeleteSchedulesOption(true);
                        setDeleteAccountOption(true);
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/80 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar docente do sistema"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Teacher Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTeacher ? 'Editar Docente' : 'Cadastrar Novo Docente'}
                </h3>
                <p className="text-xs text-slate-500">Dados cadastrais completos (PDF Seção 5)</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingTeacher && (
                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                      <span>Autoridade do Administrador: Criação Automática de Credenciais</span>
                      <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                        Acesso Restrito
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                      Ao cadastrar este docente, o sistema criará automaticamente uma conta de utilizador com palavra-passe gerada de forma segura. 
                      Por regras de confidencialidade, <strong>somente o Administrador e o novo docente</strong> terão acesso a estas credenciais.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Institucional *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento *</label>
                  <select
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria Profissional</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="Professor Catedrático">Professor Catedrático</option>
                    <option value="Professora Associada">Professora Associada</option>
                    <option value="Professor Associado">Professor Associado</option>
                    <option value="Professor Auxiliar">Professor Auxiliar</option>
                    <option value="Professor Convidado">Professor Convidado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contrato</label>
                  <select
                    value={formData.contractType}
                    onChange={e => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="Tempo Integral">Tempo Integral</option>
                    <option value="Tempo Parcial">Tempo Parcial</option>
                    <option value="Horista">Horista</option>
                    <option value="Dedicado">Dedicado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Limite Horas/Semana</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={formData.workloadLimit}
                    onChange={e => setFormData({ ...formData, workloadLimit: Number(e.target.value) })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as TeacherStatus })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Em licença">Em licença</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Área de Especialização</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="Ex: Engenharia de Software, Algoritmos Avançados"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {editingTeacher && canEdit ? (
                  <button
                    id="btn-delete-teacher-from-modal"
                    type="button"
                    onClick={() => {
                      const t = editingTeacher;
                      setIsModalOpen(false);
                      setTeacherToDelete(t);
                      setDeleteSchedulesOption(true);
                      setDeleteAccountOption(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Eliminar Docente</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingTeacher ? 'Salvar Alterações' : 'Criar Docente'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Newly Created Teacher Credentials Modal (Automatic Generation by Admin Authority) */}
      {newlyCreatedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/80 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Credenciais Criadas Automaticamente</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono font-medium">
                      Ativo
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200">Autoridade de Administração • Acesso Exclusivo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewlyCreatedCredentials(null);
                  setShowPasswordInModal(false);
                }}
                className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Conta de utilizador e senha geradas com sucesso!
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                    O docente já pode aceder ao sistema utilizando o e-mail cadastrado e a palavra-passe gerada abaixo.
                  </p>
                </div>
              </div>

              {/* Credentials Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Docente
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{newlyCreatedCredentials.teacher.name}</span>
                    <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {newlyCreatedCredentials.teacher.code}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Utilizador / E-mail de Login
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                      {newlyCreatedCredentials.user.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(newlyCreatedCredentials.user.email, 'email')}
                      className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Copiar e-mail"
                    >
                      {copiedNotification === 'email' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Palavra-passe Gerada
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {showPasswordInModal ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mostrar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/60">
                    <span className="font-mono text-sm font-bold tracking-wider text-indigo-700 dark:text-indigo-300 select-all">
                      {showPasswordInModal ? newlyCreatedCredentials.password : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(newlyCreatedCredentials.password, 'password')}
                      className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Copiar palavra-passe"
                    >
                      {copiedNotification === 'password' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confidentiality Warning */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  <strong>Aviso de Segurança e Confidencialidade:</strong> Somente o Administrador do Sistema e o próprio docente novo possuem acesso a estas credenciais. Nenhum outro utilizador (gestor, coordenador ou estudante) tem permissão de visualização.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const fullText = `UNIVERSIDADE TOBAS - SGHD - CREDENCIAIS DE ACESSO INSTITUCIONAL\nDocente: ${newlyCreatedCredentials.teacher.name}\nUtilizador / Email: ${newlyCreatedCredentials.user.email}\nPalavra-passe: ${newlyCreatedCredentials.password}\nPerfil: Docente\n\nPor motivos de segurança, guarde estas credenciais com confidencialidade.`;
                    handleCopyText(fullText, 'all');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedNotification === 'all' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Credenciais Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Todas as Credenciais</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewlyCreatedCredentials(null);
                    setShowPasswordInModal(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Existing Teacher Credentials View & Reset Modal (Admin Authority Only) */}
      {credentialViewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Credenciais de Acesso Institucional</span>
                  </h3>
                  <p className="text-xs text-slate-400">Docente: {credentialViewTeacher.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCredentialViewTeacher(null);
                  setShowPasswordInModal(false);
                  setResetSuccessMessage(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{resetSuccessMessage}</span>
                </div>
              )}

              {(() => {
                const userForTeacher = users.find(u => 
                  u.teacherId === credentialViewTeacher.id || 
                  (credentialViewTeacher.userId && u.id === credentialViewTeacher.userId) ||
                  u.email.toLowerCase() === credentialViewTeacher.email.toLowerCase()
                );

                const currentEmail = userForTeacher?.email || credentialViewTeacher.email;
                const currentPassword = userForTeacher?.password || 'Doc#Padrao2025';

                return (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Docente Registado
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {credentialViewTeacher.name}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {credentialViewTeacher.code}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        Utilizador / E-mail de Login
                      </span>
                      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                          {currentEmail}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentEmail, 'view-email')}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          title="Copiar e-mail"
                        >
                          {copiedNotification === 'view-email' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Palavra-passe de Acesso
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          {showPasswordInModal ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Ocultar</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Mostrar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-mono text-sm font-bold tracking-wider text-indigo-700 dark:text-indigo-300 select-all">
                          {showPasswordInModal ? currentPassword : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentPassword, 'view-password')}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          title="Copiar palavra-passe"
                        >
                          {copiedNotification === 'view-password' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Admin Action: Reset Password Automatically */}
                    {isAdmin && onResetTeacherPassword && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Esqueceu ou precisa de nova senha?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(credentialViewTeacher.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Redefinir Senha Automática</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Confidentiality Seal */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Controlo de Acesso Estrito:</strong> As credenciais deste docente estão visíveis apenas para a Administração do Sistema e para o próprio docente titular quando autenticado.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const userForTeacher = users.find(u => 
                      u.teacherId === credentialViewTeacher.id || 
                      (credentialViewTeacher.userId && u.id === credentialViewTeacher.userId) ||
                      u.email.toLowerCase() === credentialViewTeacher.email.toLowerCase()
                    );
                    const currentEmail = userForTeacher?.email || credentialViewTeacher.email;
                    const currentPassword = userForTeacher?.password || 'Doc#Padrao2025';

                    const fullText = `UNIVERSIDADE TOBAS - SGHD - CREDENCIAIS DE ACESSO INSTITUCIONAL\nDocente: ${credentialViewTeacher.name}\nUtilizador / Email: ${currentEmail}\nPalavra-passe: ${currentPassword}\nPerfil: Docente`;
                    handleCopyText(fullText, 'view-all');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedNotification === 'view-all' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Credenciais Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Credenciais</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCredentialViewTeacher(null);
                    setShowPasswordInModal(false);
                    setResetSuccessMessage(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/80 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <Trash2 className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Eliminar Docente do Sistema</h3>
                  <p className="text-xs text-rose-200">Ação administrativa institucional permanente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {teacherToDelete.name}
                  </span>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md font-bold">
                    {teacherToDelete.code}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Categoria: <strong className="text-slate-700 dark:text-slate-200">{teacherToDelete.category}</strong></div>
                  <div>Departamento: <strong className="text-slate-700 dark:text-slate-200">{deptMap.get(teacherToDelete.departmentId) || 'Não especificado'}</strong></div>
                  <div>E-mail institucional: <strong className="text-slate-700 dark:text-slate-200">{teacherToDelete.email}</strong></div>
                </div>
              </div>

              {/* Impact summary */}
              {(() => {
                const linkedSchedules = schedules.filter(s => s.teacherId === teacherToDelete.id);
                const linkedUser = users.find(u => u.id === teacherToDelete.userId || u.email === teacherToDelete.email);

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Verificação de Impacto Institucional:</p>
                        <p className="mt-0.5">
                          Este docente tem <strong>{linkedSchedules.length} actividades/aulas</strong> associadas na grade de horários.
                          {linkedUser && <> Conta de acesso: <strong>{linkedUser.email}</strong>.</>}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deleteSchedulesOption}
                          onChange={e => setDeleteSchedulesOption(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Desvincular e eliminar todas as aulas deste docente ({linkedSchedules.length} aulas)
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Evita conflitos de horário com docente inexistente na grade académica.
                          </p>
                        </div>
                      </label>

                      {linkedUser && (
                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteAccountOption}
                            onChange={e => setDeleteAccountOption(e.target.checked)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Eliminar também a conta de utilizador associada ({linkedUser.email})
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Revoga o acesso e as credenciais de login no sistema.
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300">
                Esta ação será registada permanentemente na trilha de auditoria do sistema.
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTeacherToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-delete-teacher-permanent"
                  type="button"
                  onClick={() => {
                    if (teacherToDelete) {
                      onDeleteTeacher(teacherToDelete.id, {
                        deleteSchedules: deleteSchedulesOption,
                        deleteUserAccount: deleteAccountOption,
                      });
                      setTeacherToDelete(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Eliminação do Docente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
