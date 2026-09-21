import React, { useState } from 'react';
import { 
  Users, BookOpen, UserCheck, School, Calendar, AlertTriangle, 
  Clock, GitPullRequest, ArrowRight, CheckCircle2, AlertCircle,
  TrendingUp, CalendarCheck, ShieldAlert, Sparkles, ExternalLink,
  FileDown, Mail
} from 'lucide-react';
import { 
  User, UserRole, Teacher, Department, Course, Subject, ClassGroup, 
  Room, AcademicPeriod, ScheduleItem, ScheduleConflict, ChangeRequest 
} from '../types';
import { NavTab } from './Sidebar';
import { DashboardExportModal } from './DashboardExportModal';

interface DashboardProps {
  currentUser: User;
  userRole?: UserRole;
  currentTeacherId?: string;
  currentClassId?: string;
  teachers?: Teacher[];
  subjects?: Subject[];
  classes?: ClassGroup[];
  rooms?: Room[];
  schedules?: ScheduleItem[];
  conflicts?: ScheduleConflict[];
  changeRequests?: ChangeRequest[];
  periods?: AcademicPeriod[];
  onNavigate: (tab: any) => void;
  onSelectScheduleFilter?: (type: 'teacher' | 'class' | 'room', id: string) => void;
  onOpenAddSchedule?: () => void;
  onOpenAutoScheduler?: () => void;
  onPublishSchedule?: () => void;
  onExportPdfSuccess?: () => void;
  onOpenEmails?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  userRole,
  currentTeacherId,
  currentClassId,
  teachers = [],
  subjects = [],
  classes = [],
  rooms = [],
  schedules = [],
  conflicts = [],
  changeRequests = [],
  periods = [],
  onNavigate,
  onSelectScheduleFilter,
  onOpenAddSchedule,
  onOpenAutoScheduler,
  onPublishSchedule,
  onExportPdfSuccess,
  onOpenEmails,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
  const safeChangeRequests = Array.isArray(changeRequests) ? changeRequests : [];
  const safePeriods = Array.isArray(periods) ? periods : [];

  const activeTeachers = safeTeachers.filter(t => t.status === 'Ativo');
  const activeSubjects = safeSubjects.filter(s => s.status === 'Ativo');
  const activeClasses = safeClasses.filter(c => c.status === 'Ativo');
  const activeRooms = safeRooms.filter(r => r.status === 'Disponível');
  const scheduledLessons = safeSchedules.filter(s => s.status !== 'Cancelado');
  const publishedSchedules = safeSchedules.filter(s => s.status === 'Publicado');
  const pendingRequests = safeChangeRequests.filter(r => r.status === 'Pendente');
  const currentPeriod = safePeriods.find(p => p.isCurrent) || safePeriods[0];

  // Role detection
  const role = currentUser?.role || userRole || 'gestor';
  const isAcademicManager = ['gestor', 'admin', 'coordenador'].includes(role);
  const effectiveTeacherId = currentTeacherId || currentUser?.teacherId;

  // Specific Teacher Dashboard logic (PDF page 37)
  const isTeacherView = role === 'docente';
  const currentTeacher = isTeacherView ? (safeTeachers.find(t => t.id === effectiveTeacherId || (currentUser?.id && t.userId === currentUser.id)) || safeTeachers[0] || null) : null;
  const teacherSchedules = currentTeacher ? safeSchedules.filter(s => s.teacherId === currentTeacher.id && s.status !== 'Cancelado') : [];
  const teacherPendingRequests = currentTeacher ? safeChangeRequests.filter(r => r.teacherId === currentTeacher.id && r.status === 'Pendente') : [];

  // Teacher today lessons (simulating Monday / current day)
  const todayDay = 'Segunda';
  const teacherTodayLessons = teacherSchedules.filter(s => s.dayOfWeek === todayDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextLesson = teacherTodayLessons[0];

  // Calculate room utilization
  const roomUsageMap = new Map<string, number>();
  for (const s of scheduledLessons) {
    roomUsageMap.set(s.roomId, (roomUsageMap.get(s.roomId) || 0) + 1);
  }
  const topRooms = [...safeRooms].map(r => ({
    room: r,
    count: roomUsageMap.get(r.id) || 0,
    percentage: Math.min(100, Math.round(((roomUsageMap.get(r.id) || 0) / 15) * 100)), // based on max theoretical slots
  })).sort((a, b) => b.count - a.count).slice(0, 4);

  // Calculate teacher workloads
  const teacherWorkloadList = safeTeachers.map(t => {
    const tSchedules = safeSchedules.filter(s => s.teacherId === t.id && s.status !== 'Cancelado');
    let totalMinutes = 0;
    for (const sch of tSchedules) {
      const [sh, sm] = sch.startTime.split(':').map(Number);
      const [eh, em] = sch.endTime.split(':').map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    }
    const currentHours = Math.round(totalMinutes / 60);
    return {
      teacher: t,
      currentHours,
      maxHours: t.workloadLimit,
      percentage: Math.min(100, Math.round((currentHours / t.workloadLimit) * 100)),
      isOver: currentHours > t.workloadLimit,
    };
  }).sort((a, b) => b.currentHours - a.currentHours).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {currentUser.roleTitle}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Período: {currentPeriod?.academicYear} • {currentPeriod?.semester}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Olá, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {isTeacherView 
              ? 'Consulte as suas aulas de hoje, disciplinas atribuídas e solicitações de ajuste de horário na Universidade Tobas.'
              : 'Bem-vindo ao Sistema de Gestão de Horários de Docentes da Universidade Tobas.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAcademicManager && (
            <button
              id="btn-export-dashboard-pdf"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs hover:border-indigo-400 hover:text-indigo-700"
              title="Exportar Relatório Consolidado do Dashboard em PDF"
            >
              <FileDown className="w-4 h-4 text-indigo-600" />
              <span>Exportar Relatório PDF</span>
            </button>
          )}

          <button
            id="btn-dash-open-schedules"
            onClick={() => onNavigate('schedules')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>{isTeacherView ? 'Ver Meu Horário' : 'Consultar Grade Completa'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXECUTIVE BANNER FOR ACADEMIC MANAGERS */}
      {isAcademicManager && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Relatório Oficial de Gestão Académica (PDF)</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Exclusivo Gestores
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Exporte o documento oficial com consolidação de indicadores (KPIs), auditoria de regras RN01 a RN07, monitorização de carga horária docente (RN06) e taxa de ocupação de espaços físicos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="btn-banner-export-pdf"
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Configurar & Gerar PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* TEACHER PERSONALIZED VIEW (PDF page 37) */}
      {isTeacherView && currentTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Classes Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">Aulas de Hoje ({todayDay}-feira)</h2>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {teacherTodayLessons.length} aulas agendadas
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {teacherTodayLessons.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Sem aulas agendadas para hoje. Aproveite o período para preparação e atendimento!
                </div>
              ) : (
                teacherTodayLessons.map(lesson => {
                  const subject = subjects.find(s => s.id === lesson.subjectId);
                  const classGroup = classes.find(c => c.id === lesson.classId);
                  const room = rooms.find(r => r.id === lesson.roomId);

                  return (
                    <div key={lesson.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs font-bold shrink-0">
                          {lesson.startTime} - {lesson.endTime}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{subject?.name}</h4>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Turma: <strong className="text-slate-700">{classGroup?.name}</strong></span>
                            <span>•</span>
                            <span>Sala: <strong className="text-slate-700">{room?.name}</strong></span>
                            <span>•</span>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{lesson.lessonType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          lesson.status === 'Publicado' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {nextLesson && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Próxima aula: <strong className="text-indigo-600 font-semibold">{nextLesson.startTime}</strong> ({subjects.find(s => s.id === nextLesson.subjectId)?.name})
                </span>
                <span className="text-slate-500 text-[11px]">
                  Solicitações pendentes: <strong>{teacherPendingRequests.length}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions & Teacher Profile Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Minha Carga Horária</h3>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {teacherSchedules.length * 2}h <span className="text-xs font-normal text-slate-500">atribuídas</span>
                </span>
                <span className="text-xs text-slate-500">Limite: {currentTeacher.workloadLimit}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((teacherSchedules.length * 2) / currentTeacher.workloadLimit) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {teacherSchedules.length} aulas ativas distribuídas na semana.
              </p>

              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-dash-teacher-availability"
                  onClick={() => onNavigate('availability')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors"
                >
                  <span>Indicar Minha Disponibilidade</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  id="btn-dash-teacher-request"
                  onClick={() => onNavigate('change_requests')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Solicitar Ajuste de Horário</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {onOpenEmails && (
                  <button
                    id="btn-dash-teacher-emails"
                    onClick={onOpenEmails}
                    className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer border border-indigo-100"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Notificações por E-mail</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* INSTITUTIONAL KPI STATS (Matching PDF page 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        
        {/* Docentes Ativos */}
        <div 
          onClick={() => onNavigate('teachers')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Docentes</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{activeTeachers.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ativos no semestre</div>
        </div>

        {/* Disciplinas */}
        <div 
          onClick={() => onNavigate('subjects')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Disciplinas</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{activeSubjects.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cadastradas</div>
        </div>

        {/* Turmas */}
        <div 
          onClick={() => onNavigate('classes')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Turmas</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{activeClasses.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Em atividade</div>
        </div>

        {/* Salas */}
        <div 
          onClick={() => onNavigate('rooms')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Salas/Labs</span>
            <School className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{activeRooms.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disponíveis</div>
        </div>

        {/* Aulas Programadas */}
        <div 
          onClick={() => onNavigate('schedules')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Aulas</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{scheduledLessons.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{publishedSchedules.length} publicadas</div>
        </div>

        {/* Conflitos */}
        <div 
          onClick={() => onNavigate('conflicts')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            conflicts.length > 0 
              ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${conflicts.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Conflitos
            </span>
            <AlertTriangle className={`w-4 h-4 ${conflicts.length > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-500'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold ${conflicts.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {conflicts.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${conflicts.length > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
            {conflicts.length > 0 ? 'Ação requerida' : 'Nenhum conflito'}
          </div>
        </div>

        {/* Solicitações */}
        <div 
          onClick={() => onNavigate('change_requests')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Solicitações</span>
            <GitPullRequest className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{pendingRequests.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pendentes de aprovação</div>
        </div>

      </div>

      {/* ACTIVE CONFLICTS CALLOUT (If any detected) */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">
                  {conflicts.length} Conflito(s) Detectado(s) pelo Algoritmo de Validação
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Conflitos de docente, sala ou capacidade violam regras de negócio (RN01-RN07) e devem ser corrigidos antes da publicação definitiva.
                </p>
                <div className="mt-3 space-y-1.5">
                  {conflicts.slice(0, 2).map(c => (
                    <div key={c.id} className="text-xs bg-white/80 rounded-md p-2 border border-rose-200/60 text-rose-800 flex items-center justify-between">
                      <span className="font-medium">
                        <strong>{c.code}:</strong> {c.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('conflicts')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shrink-0 shadow-2xs transition-colors"
            >
              Resolver no Validador
            </button>
          </div>
        </div>
      )}

      {/* TWO COLUMN SUMMARY: ROOM USAGE & TEACHER WORKLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Salas Mais Utilizadas (PDF p. 24) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Salas Mais Utilizadas</h3>
              <p className="text-xs text-slate-500">Ocupação semanal por espaço físico</p>
            </div>
            <button
              onClick={() => onNavigate('rooms')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              Ver todas as salas <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {topRooms.map(item => (
              <div key={item.room.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium text-slate-800">
                    {item.room.name} <span className="text-slate-400">({item.room.building} • Cap. {item.room.capacity})</span>
                  </div>
                  <span className="font-bold text-slate-700">{item.count} aulas/sem</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Docentes com Maior Carga Horária (PDF p. 24) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Carga Horária Semanal dos Docentes</h3>
              <p className="text-xs text-slate-500">Monitorização dos limites contratuais (RN06)</p>
            </div>
            <button
              onClick={() => onNavigate('teachers')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              Ver docentes <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {teacherWorkloadList.map(item => (
              <div key={item.teacher.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium text-slate-800">
                    {item.teacher.name} <span className="text-slate-400">({item.teacher.category})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${item.isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                      {item.currentHours}h / {item.maxHours}h
                    </span>
                    {item.isOver && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded font-bold">
                        Excedeu
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* QUICK STATUS WORKFLOW HIGHLIGHT */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ciclo de Aprovação e Publicação de Horários (PDF Seção 15)
          </h4>
          <span className="text-xs text-indigo-600 font-medium">Fluxo Institucional SGHD</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-mono">1. Passo</span>
            <div className="text-xs font-semibold text-slate-800 mt-1">Rascunho</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Elaboração inicial pelo gestor</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-[10px] text-amber-600 font-mono">2. Passo</span>
            <div className="text-xs font-semibold text-amber-900 mt-1">Em Validação</div>
            <p className="text-[10px] text-amber-700 mt-0.5">Verificação de conflitos RN01-RN07</p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-[10px] text-blue-600 font-mono">3. Passo</span>
            <div className="text-xs font-semibold text-blue-900 mt-1">Aprovado</div>
            <p className="text-[10px] text-blue-700 mt-0.5">Homologado pelo coordenador</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] text-emerald-600 font-mono">4. Passo</span>
            <div className="text-xs font-semibold text-emerald-900 mt-1">Publicado</div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Oficial para docentes e alunos</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-mono">5. Passo</span>
            <div className="text-xs font-semibold text-slate-800 mt-1">Alteração / Histórico</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Solicitações com auditoria</p>
          </div>
        </div>
      </div>

      {/* DASHBOARD EXPORT MODAL FOR ACADEMIC MANAGERS */}
      <DashboardExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentUser={currentUser}
        teachers={safeTeachers}
        subjects={safeSubjects}
        classes={safeClasses}
        rooms={safeRooms}
        schedules={safeSchedules}
        conflicts={safeConflicts}
        changeRequests={safeChangeRequests}
        periods={safePeriods}
        onExportSuccess={() => {
          if (onExportPdfSuccess) onExportPdfSuccess();
        }}
      />

    </div>
  );
};

function ChevronRightIcon(props: { className?: string }) {
  return <ArrowRight className={props.className} />;
}
