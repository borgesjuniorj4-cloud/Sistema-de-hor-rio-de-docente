import React, { useState, useMemo } from 'react';
import { 
  Calendar, Plus, Filter, Search, Sparkles, Printer, 
  AlertTriangle, CheckCircle2, ChevronRight, Edit3, Trash2, 
  Clock, School, User as UserIcon, Users, BookOpen, Layers, Check, 
  RotateCcw, Download, X
} from 'lucide-react';
import { 
  ScheduleItem, Teacher, Subject, ClassGroup, 
  Room, AcademicPeriod, DayOfWeek, UserRole, 
  ScheduleConflict, ScheduleStatus 
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import { ScheduleModal } from './ScheduleModal';
import { AutoGenerateModal } from './AutoGenerateModal';

interface SchedulesViewProps {
  schedules: ScheduleItem[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  periods: AcademicPeriod[];
  conflicts: ScheduleConflict[];
  userRole: UserRole;
  currentUserId: string;
  currentTeacherId?: string;
  currentClassId?: string;
  onSaveSchedule: (schedule: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
  onBulkDeleteSchedules?: (ids: string[], reason?: string) => void;
  onBulkUpdateStatus: (targetStatus: ScheduleStatus, ids?: string[]) => void;
  onApplyGeneratedSchedules: (newItems: ScheduleItem[]) => void;
  availabilities: any[];
  onRequestChange?: (schedule: ScheduleItem) => void;
}

type ViewMode = 'all' | 'teacher' | 'class' | 'room' | 'subject';

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules = [],
  teachers = [],
  subjects = [],
  classes = [],
  rooms = [],
  periods = [],
  conflicts = [],
  userRole,
  currentUserId,
  currentTeacherId,
  currentClassId,
  onSaveSchedule,
  onDeleteSchedule,
  onBulkDeleteSchedules,
  onBulkUpdateStatus,
  onApplyGeneratedSchedules,
  availabilities = [],
  onRequestChange,
}) => {
  const isDocente = userRole === 'docente';
  const isEstudante = userRole === 'estudante';
  const canEdit = ['admin', 'gestor'].includes(userRole);
  const canApprove = ['admin', 'gestor', 'coordenador'].includes(userRole);

  // Determine initial view filter based on role
  const [viewMode, setViewMode] = useState<ViewMode>(
    isDocente ? 'teacher' : isEstudante ? 'class' : 'all'
  );

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentTeacherId || teachers[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentClassId || classes[0]?.id || ''
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayType, setDisplayType] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [preselectedSlot, setPreselectedSlot] = useState<{ day: DayOfWeek; time: string } | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

  // Deletion confirmation and bulk clearing states
  const [activityToDelete, setActivityToDelete] = useState<ScheduleItem | null>(null);
  const [isClearActivitiesModalOpen, setIsClearActivitiesModalOpen] = useState(false);
  const [clearActivitiesTarget, setClearActivitiesTarget] = useState<'filtered' | 'draft' | 'all'>('filtered');

  // Fast maps
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
  const roomMap = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms]);

  // Set of schedule IDs with active conflicts
  const conflictedScheduleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      for (const id of c.scheduleItemIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [conflicts]);

  // Filter schedules based on selected view mode & controls
  const filteredSchedules = useMemo(() => {
    return schedules.filter(item => {
      if (item.status === 'Cancelado') return false;

      // Role isolation: if teacher, only their lessons (or only published if not own)
      if (isDocente && currentTeacherId) {
        if (item.teacherId !== currentTeacherId) return false;
      }
      // If student, only their class lessons and only published!
      if (isEstudante && currentClassId) {
        if (item.classId !== currentClassId) return false;
        if (item.status !== 'Publicado') return false;
      }

      // View mode filters
      if (viewMode === 'teacher' && selectedTeacherId && item.teacherId !== selectedTeacherId) {
        return false;
      }
      if (viewMode === 'class' && selectedClassId && item.classId !== selectedClassId) {
        return false;
      }
      if (viewMode === 'room' && selectedRoomId && item.roomId !== selectedRoomId) {
        return false;
      }
      if (viewMode === 'subject' && selectedSubjectId && item.subjectId !== selectedSubjectId) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const teacher = teacherMap.get(item.teacherId);
        const subject = subjectMap.get(item.subjectId);
        const classGroup = classMap.get(item.classId);
        const room = roomMap.get(item.roomId);

        const match = 
          teacher?.name.toLowerCase().includes(query) ||
          teacher?.code.toLowerCase().includes(query) ||
          subject?.name.toLowerCase().includes(query) ||
          subject?.code.toLowerCase().includes(query) ||
          classGroup?.name.toLowerCase().includes(query) ||
          room?.name.toLowerCase().includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [
    schedules, viewMode, selectedTeacherId, selectedClassId, 
    selectedRoomId, selectedSubjectId, statusFilter, searchQuery, 
    isDocente, isEstudante, currentTeacherId, currentClassId,
    teacherMap, subjectMap, classMap, roomMap
  ]);

  const handleOpenAdd = (day?: DayOfWeek, time?: string) => {
    setEditingItem(null);
    if (day && time) {
      setPreselectedSlot({ day, time });
    } else {
      setPreselectedSlot(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setPreselectedSlot(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'Publicado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Aprovado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em validação':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rascunho':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Módulo Principal (PDF Seções 12, 18, 19)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {filteredSchedules.length} aulas exibidas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {isDocente ? 'Meu Horário Semanal' : isEstudante ? 'Horário das Aulas da Turma' : 'Gestão e Consulta de Horários'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Grade horária interativa com validação instantânea de conflitos e fluxos de aprovação.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Print / Export to PDF button (PDF page 22) */}
            <button
              id="btn-print-schedule"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors"
              title="Imprimir ou exportar grade em PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Coordinator/Manager Publish & Approve Actions */}
            {canApprove && (
              <button
                id="btn-publish-all-schedules"
                onClick={() => onBulkUpdateStatus('Publicado')}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                title="Publicar todas as aulas aprovadas como horário oficial"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publicar Horário Oficial</span>
              </button>
            )}

            {/* Smart Auto Generator Button (PDF Section 17) */}
            {canEdit && (
              <button
                id="btn-open-auto-scheduler"
                onClick={() => setIsAutoModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Otimizador Automático</span>
              </button>
            )}

            {/* Clear / Delete Activities button for Admin/Manager */}
            {canEdit && (
              <button
                id="btn-open-clear-activities"
                onClick={() => setIsClearActivitiesModalOpen(true)}
                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Eliminar ou limpar actividades e aulas do horário"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Eliminar Actividades</span>
              </button>
            )}

            {/* Add Class Session Button (PDF Section 16) */}
            {canEdit && (
              <button
                id="btn-add-schedule-lesson"
                onClick={() => handleOpenAdd()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Aula</span>
              </button>
            )}

          </div>
        </div>

        {/* View Mode Tabs (PDF page 18-19) */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Consultar:</span>
            
            {!isDocente && !isEstudante && (
              <button
                id="btn-schedule-view-all"
                onClick={() => setViewMode('all')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                  viewMode === 'all' 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Geral</span>
              </button>
            )}

            {!isEstudante && (
              <button
                id="btn-schedule-view-teacher"
                onClick={() => setViewMode('teacher')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                  viewMode === 'teacher' 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Docente</span>
              </button>
            )}

            <button
              id="btn-schedule-view-class"
              onClick={() => setViewMode('class')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                viewMode === 'class' 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Turma</span>
            </button>

            {!isEstudante && (
              <>
                <button
                  id="btn-schedule-view-room"
                  onClick={() => setViewMode('room')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                    viewMode === 'room' 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Sala / Lab</span>
                </button>

                <button
                  id="btn-schedule-view-subject"
                  onClick={() => setViewMode('subject')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                    viewMode === 'subject' 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Disciplina</span>
                </button>
              </>
            )}
          </div>

          {/* Toggle Grid / Table */}
          <div className="flex items-center gap-1 self-end md:self-auto shrink-0 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setDisplayType('grid')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                displayType === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grade Semanal
            </button>
            <button
              onClick={() => setDisplayType('table')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                displayType === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista Tabular
            </button>
          </div>

        </div>

        {/* Dynamic Filters depending on viewMode */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Context Selector */}
          {viewMode === 'teacher' && !isDocente && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Docente Consultado:</span>
              </label>
              <select
                id="select-schedule-teacher"
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'class' && !isEstudante && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Turma Consultada:</span>
              </label>
              <select
                id="select-schedule-class"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'room' && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sala ou Laboratório:</span>
              </label>
              <select
                id="select-schedule-room"
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.building}, {r.capacity} lugares)</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'subject' && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Disciplina Consultada:</span>
              </label>
              <select
                id="select-schedule-subject"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Estado do Horário */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Estado:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
            >
              <option value="all">Todos os Estados</option>
              <option value="Publicado">Publicado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Em validação">Em validação</option>
              <option value="Rascunho">Rascunho</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pesquisar:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por docente, código, disciplina, turma ou sala..."
                className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* TIMETABLE WEEKLY GRID (PDF Page 18-19) */}
      {displayType === 'grid' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-3 px-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28 border-r border-slate-200">
                    Horário
                  </th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="py-3 px-3 text-left text-xs font-bold text-slate-800 border-r border-slate-200 last:border-r-0">
                      {day}-feira
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TIME_SLOTS.map(slot => {
                  const [slotStart, slotEnd] = slot.split('-');

                  return (
                    <tr key={slot} className="hover:bg-slate-50/30 transition-colors">
                      {/* Slot Header */}
                      <td className="py-3 px-3 text-xs font-mono font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 align-top">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{slot}</span>
                        </div>
                      </td>

                      {/* Day cells */}
                      {DAYS_OF_WEEK.map(day => {
                        // Find lessons in this day & slot
                        const cellLessons = filteredSchedules.filter(
                          s => s.dayOfWeek === day && s.startTime === slotStart
                        );

                        return (
                          <td 
                            key={`${day}-${slot}`} 
                            className="p-2 border-r border-slate-200 last:border-r-0 align-top min-h-[95px] relative group"
                          >
                            {cellLessons.length > 0 ? (
                              <div className="space-y-2">
                                {cellLessons.map(lesson => {
                                  const teacher = teacherMap.get(lesson.teacherId);
                                  const subject = subjectMap.get(lesson.subjectId);
                                  const classGroup = classMap.get(lesson.classId);
                                  const room = roomMap.get(lesson.roomId);
                                  const isConflicted = conflictedScheduleIds.has(lesson.id);

                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                                        isConflicted
                                          ? 'bg-rose-50/90 border-rose-300 text-rose-900 shadow-xs ring-1 ring-rose-400'
                                          : lesson.status === 'Publicado'
                                          ? 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                                          : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                                      }`}
                                    >
                                      {/* Header with subject & status */}
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="font-bold text-slate-900 line-clamp-1">
                                          {subject?.name || 'Disciplina'}
                                        </span>
                                        {isConflicted ? (
                                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-600 text-white shrink-0 flex items-center gap-0.5">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Conflito
                                          </span>
                                        ) : (
                                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium border ${getStatusBadge(lesson.status)}`}>
                                            {lesson.status}
                                          </span>
                                        )}
                                      </div>

                                      {/* Details */}
                                      <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                                        <div className="flex items-center gap-1 truncate text-slate-700 font-medium">
                                          <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{teacher?.name || 'Docente'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-500">
                                          <span className="font-semibold text-slate-800">{classGroup?.name}</span>
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                            {room?.name}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Hover Actions */}
                                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {lesson.lessonType}
                                        </span>

                                        <div className="flex items-center gap-1">
                                          {canEdit && (
                                            <>
                                              <button
                                                onClick={() => handleOpenEdit(lesson)}
                                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                                                title="Editar aula"
                                              >
                                                <Edit3 className="w-3 h-3" />
                                              </button>
                                              <button
                                                id={`btn-delete-lesson-${lesson.id}`}
                                                onClick={() => setActivityToDelete(lesson)}
                                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                                title="Eliminar aula do horário"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </>
                                          )}

                                          {/* Teacher request change shortcut */}
                                          {isDocente && onRequestChange && (
                                            <button
                                              onClick={() => onRequestChange(lesson)}
                                              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
                                              title="Solicitar alteração de horário"
                                            >
                                              Solicitar Ajuste
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              // Empty slot (allows click to add for managers)
                              canEdit ? (
                                <button
                                  onClick={() => handleOpenAdd(day, slot)}
                                  className="w-full h-full min-h-[60px] rounded-lg border border-dashed border-transparent hover:border-indigo-300 hover:bg-indigo-50/40 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                                  title={`Adicionar aula em ${day} às ${slot}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="h-full min-h-[60px]"></div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Tabular list representation
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Dia / Horário</th>
                <th className="py-3 px-4">Disciplina</th>
                <th className="py-3 px-4">Docente</th>
                <th className="py-3 px-4">Turma</th>
                <th className="py-3 px-4">Sala</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma aula encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(lesson => {
                  const teacher = teacherMap.get(lesson.teacherId);
                  const subject = subjectMap.get(lesson.subjectId);
                  const classGroup = classMap.get(lesson.classId);
                  const room = roomMap.get(lesson.roomId);
                  const isConflicted = conflictedScheduleIds.has(lesson.id);

                  return (
                    <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {lesson.dayOfWeek}-feira, {lesson.startTime} - {lesson.endTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {subject?.name} <span className="text-slate-400 font-normal">({subject?.code})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {teacher?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {classGroup?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {room?.name} ({room?.type})
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                          {lesson.lessonType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isConflicted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Conflito
                          </span>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(lesson.status)}`}>
                            {lesson.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(lesson)}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-table-lesson-${lesson.id}`}
                                onClick={() => setActivityToDelete(lesson)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Eliminar aula"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {isDocente && onRequestChange && (
                            <button
                              onClick={() => onRequestChange(lesson)}
                              className="text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
                            >
                              Solicitar Ajuste
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveSchedule}
        onDelete={onDeleteSchedule}
        editingSchedule={editingItem}
        teachers={teachers}
        subjects={subjects}
        classes={classes}
        rooms={rooms}
        periods={periods}
        existingSchedules={schedules}
        availabilities={availabilities}
        preselectedSlot={preselectedSlot}
      />

      <AutoGenerateModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        onApplyGenerated={onApplyGeneratedSchedules}
        subjects={subjects}
        teachers={teachers}
        classes={classes}
        rooms={rooms}
        availabilities={availabilities}
        existingSchedules={schedules}
        periodId={periods[0]?.id || ''}
      />

      {/* Single Activity Deletion Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Eliminar Actividade da Grade</h3>
                  <p className="text-[11px] text-rose-200">Confirmação administrativa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {subjectMap.get(activityToDelete.subjectId)?.name || 'Disciplina'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Turma: <strong className="text-slate-800 dark:text-slate-100">{classMap.get(activityToDelete.classId)?.name}</strong>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Docente: <strong className="text-slate-800 dark:text-slate-100">{teacherMap.get(activityToDelete.teacherId)?.name}</strong>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Espaço: <strong className="text-slate-800 dark:text-slate-100">{roomMap.get(activityToDelete.roomId)?.name}</strong>
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                  {activityToDelete.dayOfWeek}-feira • {activityToDelete.startTime} às {activityToDelete.endTime} ({activityToDelete.lessonType})
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                Tem a certeza de que deseja eliminar esta aula? O horário será liberado imediatamente para o docente, turma e sala.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActivityToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px]"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-delete-activity-single"
                  type="button"
                  onClick={() => {
                    onDeleteSchedule(activityToDelete.id);
                    setActivityToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs min-h-[36px] flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sim, Eliminar Aula</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Activities Modal */}
      {isClearActivitiesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Eliminar Actividades da Grade</h3>
                  <p className="text-xs text-rose-200">Gestão de limpeza e exclusão em lote</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearActivitiesModalOpen(false)}
                className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selecione o escopo das actividades/aulas que deseja eliminar da grade institucional:
              </p>

              <div className="space-y-2 text-xs">
                {/* Option 1: Filtered */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  clearActivitiesTarget === 'filtered' 
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-slate-900 dark:text-white' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}>
                  <input
                    type="radio"
                    name="clearScope"
                    value="filtered"
                    checked={clearActivitiesTarget === 'filtered'}
                    onChange={() => setClearActivitiesTarget('filtered')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold">
                      Apenas as actividades visíveis no filtro atual ({filteredSchedules.length} aulas)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Elimina somente as aulas correspondentes ao filtro ativo ({viewMode === 'all' ? 'Todas' : viewMode}: {searchQuery ? `"${searchQuery}"` : 'filtro selecionado'}).
                    </p>
                  </div>
                </label>

                {/* Option 2: Drafts only */}
                {(() => {
                  const draftCount = schedules.filter(s => s.status === 'Rascunho').length;
                  return (
                    <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      clearActivitiesTarget === 'draft' 
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-slate-900 dark:text-white' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}>
                      <input
                        type="radio"
                        name="clearScope"
                        value="draft"
                        checked={clearActivitiesTarget === 'draft'}
                        onChange={() => setClearActivitiesTarget('draft')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <span className="font-bold">
                          Todas as actividades em Rascunho ({draftCount} aulas)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Remove todas as aulas ainda não aprovadas ou publicadas, mantendo o horário oficial intacto.
                        </p>
                      </div>
                    </label>
                  );
                })()}

                {/* Option 3: All in semester */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  clearActivitiesTarget === 'all' 
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-slate-900 dark:text-white' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}>
                  <input
                    type="radio"
                    name="clearScope"
                    value="all"
                    checked={clearActivitiesTarget === 'all'}
                    onChange={() => setClearActivitiesTarget('all')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      Todas as actividades da grade ({schedules.length} aulas)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Limpeza completa da grade de horários para reconfiguração geral.
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Esta operação requer privilégios de Administrador/Gestor e será registada na trilha de auditoria.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsClearActivitiesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-bulk-clear-activities"
                  type="button"
                  onClick={() => {
                    let idsToRemove: string[] = [];
                    let reason = '';
                    if (clearActivitiesTarget === 'filtered') {
                      idsToRemove = filteredSchedules.map(s => s.id);
                      reason = `Eliminação das ${idsToRemove.length} actividades filtradas (${viewMode})`;
                    } else if (clearActivitiesTarget === 'draft') {
                      idsToRemove = schedules.filter(s => s.status === 'Rascunho').map(s => s.id);
                      reason = `Eliminação em lote de ${idsToRemove.length} actividades em Rascunho`;
                    } else {
                      idsToRemove = schedules.map(s => s.id);
                      reason = `Limpeza geral de todas as ${idsToRemove.length} actividades do horário`;
                    }

                    if (idsToRemove.length > 0) {
                      if (onBulkDeleteSchedules) {
                        onBulkDeleteSchedules(idsToRemove, reason);
                      } else {
                        idsToRemove.forEach(id => onDeleteSchedule(id));
                      }
                    }
                    setIsClearActivitiesModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Eliminação Selecionada</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
