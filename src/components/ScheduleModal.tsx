import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, CheckCircle2, Clock, 
  School, Users, BookOpen, Calendar, HelpCircle, Trash2 
} from 'lucide-react';
import { 
  ScheduleItem, Teacher, Subject, ClassGroup, 
  Room, AcademicPeriod, LessonType, DayOfWeek, 
  ScheduleStatus, TeacherAvailability 
} from '../types';
import { checkProspectiveConflicts } from '../services/conflictService';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<ScheduleItem>) => void;
  onDelete?: (id: string) => void;
  editingSchedule?: ScheduleItem | null;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  periods: AcademicPeriod[];
  existingSchedules: ScheduleItem[];
  availabilities: TeacherAvailability[];
  preselectedSlot?: { day: DayOfWeek; time: string } | null;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingSchedule,
  teachers,
  subjects,
  classes,
  rooms,
  periods,
  existingSchedules,
  availabilities,
  preselectedSlot,
}) => {
  const currentPeriod = periods.find(p => p.isCurrent) || periods[0];

  const [periodId, setPeriodId] = useState(currentPeriod?.id || '');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Segunda');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:50');
  const [lessonType, setLessonType] = useState<LessonType>('Teórica');
  const [status, setStatus] = useState<ScheduleStatus>('Rascunho');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (editingSchedule) {
      setPeriodId(editingSchedule.academicPeriodId);
      setTeacherId(editingSchedule.teacherId);
      setSubjectId(editingSchedule.subjectId);
      setClassId(editingSchedule.classId);
      setRoomId(editingSchedule.roomId);
      setDayOfWeek(editingSchedule.dayOfWeek);
      setStartTime(editingSchedule.startTime);
      setEndTime(editingSchedule.endTime);
      setLessonType(editingSchedule.lessonType);
      setStatus(editingSchedule.status);
      setNotes(editingSchedule.notes || '');
      setConfirmDelete(false);
    } else {
      setConfirmDelete(false);
      setPeriodId(currentPeriod?.id || '');
      setTeacherId(teachers[0]?.id || '');
      setSubjectId(subjects[0]?.id || '');
      setClassId(classes[0]?.id || '');
      setRoomId(rooms[0]?.id || '');
      if (preselectedSlot) {
        setDayOfWeek(preselectedSlot.day);
        const [st, et] = preselectedSlot.time.split('-');
        setStartTime(st || '07:00');
        setEndTime(et || '07:50');
      } else {
        setDayOfWeek('Segunda');
        setStartTime('07:00');
        setEndTime('07:50');
      }
      setLessonType('Teórica');
      setStatus('Rascunho');
      setNotes('');
    }
  }, [editingSchedule, isOpen, preselectedSlot]);

  // Run live conflict checking whenever key fields change
  useEffect(() => {
    if (!teacherId || !roomId || !classId || !subjectId) return;

    const issues = checkProspectiveConflicts(
      {
        id: editingSchedule?.id,
        academicPeriodId: periodId,
        teacherId,
        subjectId,
        classId,
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        lessonType,
        status,
        notes,
      },
      existingSchedules,
      teachers,
      rooms,
      classes,
      subjects,
      availabilities
    );
    setConflictWarnings(issues);
  }, [teacherId, roomId, classId, subjectId, dayOfWeek, startTime, endTime, editingSchedule]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingSchedule?.id,
      academicPeriodId: periodId,
      teacherId,
      subjectId,
      classId,
      roomId,
      dayOfWeek,
      startTime,
      endTime,
      lessonType,
      status,
      notes,
    });
    onClose();
  };

  const selectedRoom = rooms.find(r => r.id === roomId);
  const selectedClass = classes.find(c => c.id === classId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {editingSchedule ? 'Editar Aula no Horário' : 'Criar Nova Aula no Horário'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulário oficial de cadastro de aula com validação de conflitos (PDF Seção 16)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Conflicts Alert Banner */}
        {conflictWarnings.length > 0 && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Atenção: Conflito detectado antes de salvar
                </h4>
                <ul className="mt-1 text-xs text-rose-700 list-disc list-inside space-y-0.5">
                  {conflictWarnings.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Período Académico */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Período Académico
              </label>
              <select
                value={periodId}
                onChange={e => setPeriodId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.academicYear} - {p.semester} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Turma */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turma *
              </label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} alunos • {c.shift})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Disciplina */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disciplina *
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.weeklyHours}h/sem)
                  </option>
                ))}
              </select>
            </div>

            {/* Docente */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Docente Atribuído *
              </label>
              <select
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code} • Max {t.workloadLimit}h)
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sala */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sala / Laboratório *
              </label>
              <select
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type} • Cap. {r.capacity})
                  </option>
                ))}
              </select>
              {selectedRoom && selectedClass && selectedClass.studentCount > selectedRoom.capacity && (
                <p className="text-[10px] text-rose-600 mt-1 font-medium">
                  Aviso: {selectedClass.studentCount} alunos ultrapassam a capacidade de {selectedRoom.capacity} da sala!
                </p>
              )}
            </div>

            {/* Tipo de Aula */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Aula
              </label>
              <select
                value={lessonType}
                onChange={e => setLessonType(e.target.value as LessonType)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Teórica">Teórica</option>
                <option value="Prática">Prática</option>
                <option value="Teórico-Prática">Teórico-Prática</option>
                <option value="Laboratório">Laboratório</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Dia da Semana */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia da Semana *
              </label>
              <select
                value={dayOfWeek}
                onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}-feira</option>
                ))}
              </select>
            </div>

            {/* Hora Inicial */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora Inicial *
              </label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                <optgroup label="Turno da Manhã (07:00 - 11:50)">
                  <option value="07:00">07:00 (1.º Tempo)</option>
                  <option value="07:50">07:50 (2.º Tempo)</option>
                  <option value="08:40">08:40 (3.º Tempo)</option>
                  <option value="09:45">09:45 (4.º Tempo • Pós-Intervalo)</option>
                  <option value="10:35">10:35 (5.º Tempo)</option>
                  <option value="11:00">11:00 (6.º Tempo)</option>
                </optgroup>
                <optgroup label="Turno da Tarde (12:00 - 17:50)">
                  <option value="12:00">12:00 (1.º Tempo Tarde)</option>
                  <option value="12:50">12:50 (2.º Tempo Tarde)</option>
                  <option value="13:40">13:40 (3.º Tempo Tarde)</option>
                  <option value="14:45">14:45 (4.º Tempo Tarde • Pós-Intervalo)</option>
                  <option value="15:35">15:35 (5.º Tempo Tarde)</option>
                  <option value="16:25">16:25 (6.º Tempo Tarde)</option>
                  <option value="17:00">17:00 (7.º Tempo Tarde)</option>
                </optgroup>
              </select>
            </div>

            {/* Hora Final */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora Final *
              </label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                <optgroup label="Términos Manhã">
                  <option value="07:50">07:50 (1 Tempo • 50 min)</option>
                  <option value="08:40">08:40 (2 Tempos • 100 min)</option>
                  <option value="09:30">09:30 (3.º Tempo • Início Recreio)</option>
                  <option value="10:35">10:35 (4.º Tempo • 50 min)</option>
                  <option value="11:25">11:25 (5.º Tempo • 50 min)</option>
                  <option value="11:50">11:50 (Término Turno Manhã)</option>
                </optgroup>
                <optgroup label="Términos Tarde">
                  <option value="12:50">12:50 (1 Tempo Tarde • 50 min)</option>
                  <option value="13:40">13:40 (2 Tempos Tarde • 100 min)</option>
                  <option value="14:30">14:30 (3.º Tempo • Início Recreio)</option>
                  <option value="15:35">15:35 (4.º Tempo Tarde • 50 min)</option>
                  <option value="16:25">16:25 (5.º Tempo Tarde • 50 min)</option>
                  <option value="17:15">17:15 (6.º Tempo Tarde • 50 min)</option>
                  <option value="17:50">17:50 (Término Turno Tarde)</option>
                </optgroup>
              </select>
            </div>

          </div>

          {/* Quick Tempos Selector */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Selecção Rápida de Tempos (50 min / Blocos):</span>
              <span className="text-[11px] text-slate-500">Intervalos: 09:30-09:45 e 14:30-14:45</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase self-center mr-1">Manhã:</span>
              <button
                type="button"
                onClick={() => { setStartTime('07:00'); setEndTime('07:50'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '07:00' && endTime === '07:50' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                1.º (07:00-07:50)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('07:50'); setEndTime('08:40'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '07:50' && endTime === '08:40' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                2.º (07:50-08:40)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('08:40'); setEndTime('09:30'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '08:40' && endTime === '09:30' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                3.º (08:40-09:30)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('09:45'); setEndTime('10:35'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '09:45' && endTime === '10:35' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                4.º (09:45-10:35)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('10:35'); setEndTime('11:25'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '10:35' && endTime === '11:25' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                5.º (10:35-11:25)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('11:00'); setEndTime('11:50'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '11:00' && endTime === '11:50' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                6.º (11:00-11:50)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('07:00'); setEndTime('08:40'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '07:00' && endTime === '08:40' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                title="Bloco duplo geminado de 2 tempos de 50 min"
              >
                Bloco 2T (07:00-08:40)
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase self-center mr-1">Tarde:</span>
              <button
                type="button"
                onClick={() => { setStartTime('12:00'); setEndTime('12:50'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '12:00' && endTime === '12:50' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                1.º (12:00-12:50)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('12:50'); setEndTime('13:40'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '12:50' && endTime === '13:40' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                2.º (12:50-13:40)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('13:40'); setEndTime('14:30'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '13:40' && endTime === '14:30' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                3.º (13:40-14:30)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('14:45'); setEndTime('15:35'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '14:45' && endTime === '15:35' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                4.º (14:45-15:35)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('15:35'); setEndTime('16:25'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '15:35' && endTime === '16:25' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                5.º (15:35-16:25)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('16:25'); setEndTime('17:15'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '16:25' && endTime === '17:15' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                6.º (16:25-17:15)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('17:00'); setEndTime('17:50'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '17:00' && endTime === '17:50' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                7.º (17:00-17:50)
              </button>
              <button
                type="button"
                onClick={() => { setStartTime('12:00'); setEndTime('13:40'); }}
                className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${startTime === '12:00' && endTime === '13:40' ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                title="Bloco duplo geminado de 2 tempos de 50 min"
              >
                Bloco 2T (12:00-13:40)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Estado do Horário */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado do Horário (PDF Seção 15)
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ScheduleStatus)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Em validação">Em validação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Publicado">Publicado (Oficial)</option>
                <option value="Suspenso">Suspenso</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Sala de apoio ou projetor extra"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {editingSchedule && onDelete ? (
              <div className="flex items-center gap-2">
                {!confirmDelete ? (
                  <button
                    id="btn-delete-schedule-lesson"
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                    title="Eliminar esta actividade/aula permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Eliminar Actividade</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-800 px-2">Confirmar?</span>
                    <button
                      id="btn-confirm-delete-schedule"
                      type="button"
                      onClick={() => {
                        onDelete(editingSchedule.id);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Sim, Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors min-h-[38px]"
              >
                Cancelar
              </button>
              <button
                id="btn-save-schedule-lesson"
                type="submit"
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors shadow-xs min-h-[38px] cursor-pointer ${
                  conflictWarnings.length > 0 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {conflictWarnings.length > 0 ? 'Salvar Mesmo com Avisos' : 'Guardar Aula'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
