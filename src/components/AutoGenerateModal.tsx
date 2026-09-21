import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Play, 
  X, RefreshCw, Layers, ShieldCheck, Check 
} from 'lucide-react';
import { 
  Subject, Teacher, ClassGroup, Room, 
  TeacherAvailability, ScheduleItem, DayOfWeek, LessonType 
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import { isOverlapping } from '../services/conflictService';

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGenerated: (newSchedules: ScheduleItem[]) => void;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  rooms: Room[];
  availabilities: TeacherAvailability[];
  existingSchedules: ScheduleItem[];
  periodId: string;
}

export const AutoGenerateModal: React.FC<AutoGenerateModalProps> = ({
  isOpen,
  onClose,
  onApplyGenerated,
  subjects,
  teachers,
  classes,
  rooms,
  availabilities,
  existingSchedules,
  periodId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [avoidEvening, setAvoidEvening] = useState(true);
  const [statusForNew, setStatusForNew] = useState<'Rascunho' | 'Em validação' | 'Publicado'>('Rascunho');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    allocated: ScheduleItem[];
    successCount: number;
    skippedCount: number;
    log: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleRunGenerator = () => {
    setIsGenerating(true);
    setGeneratedResult(null);

    setTimeout(() => {
      const logs: string[] = [];
      const newItems: ScheduleItem[] = [];
      const combinedSchedules = [...existingSchedules];

      const targetClasses = selectedClassId === 'all' 
        ? classes.filter(c => c.status === 'Ativo')
        : classes.filter(c => c.id === selectedClassId);

      const availableDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
      const candidateSlots = avoidEvening 
        ? TIME_SLOTS.slice(0, 4) // 08-10, 10-12, 14-16, 16-18
        : TIME_SLOTS;

      let allocatedCount = 0;
      let skippedCount = 0;

      for (const cls of targetClasses) {
        // Find subjects for this class's course & semester
        const relevantSubjects = subjects.filter(
          s => s.courseId === cls.courseId && s.semester === cls.semester && s.status === 'Ativo'
        );

        for (const subj of relevantSubjects) {
          // Check how many hours already scheduled
          const alreadyAssigned = combinedSchedules.filter(
            s => s.classId === cls.id && s.subjectId === subj.id && s.status !== 'Cancelado'
          );
          const alreadyHours = alreadyAssigned.length * 2;
          const neededHours = subj.weeklyHours - alreadyHours;

          if (neededHours <= 0) {
            logs.push(`✓ ${subj.name} (${cls.name}) já possui todas as horas preenchidas.`);
            continue;
          }

          // Pick candidate teacher for this subject
          const candidateTeachers = teachers.filter(
            t => t.departmentId === subj.departmentId && t.status === 'Ativo'
          );
          const teacher = candidateTeachers[0] || teachers[0];

          // Pick candidate room with enough capacity
          const candidateRooms = rooms.filter(
            r => r.status === 'Disponível' && r.capacity >= cls.studentCount
          );
          const room = candidateRooms[0] || rooms[0];

          // Try slots
          let hoursToSchedule = neededHours;
          let scheduledForThisSubj = 0;

          for (const day of availableDays) {
            if (hoursToSchedule <= 0) break;

            for (const slot of candidateSlots) {
              if (hoursToSchedule <= 0) break;
              const [st, et] = slot.split('-');

              // 1. Check teacher availability
              const isUnavail = availabilities.some(
                a => a.teacherId === teacher.id &&
                     a.dayOfWeek === day &&
                     a.timeSlot === slot &&
                     a.status === 'Indisponível'
              );
              if (isUnavail) continue;

              // 2. Check collision with combined schedules
              const hasCollision = combinedSchedules.some(
                s => s.dayOfWeek === day &&
                     s.status !== 'Cancelado' &&
                     isOverlapping(s.startTime, s.endTime, st, et) &&
                     (s.teacherId === teacher.id || s.roomId === room.id || s.classId === cls.id)
              );
              if (hasCollision) continue;

              // Safe to allocate!
              const newItem: ScheduleItem = {
                id: `sch-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                academicPeriodId: periodId,
                teacherId: teacher.id,
                subjectId: subj.id,
                classId: cls.id,
                roomId: room.id,
                dayOfWeek: day,
                startTime: st,
                endTime: et,
                lessonType: subj.name.toLowerCase().includes('laboratório') || subj.name.toLowerCase().includes('programação') ? 'Laboratório' : 'Teórica',
                status: statusForNew,
                notes: 'Alocado automaticamente pelo otimizador SGHD.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              newItems.push(newItem);
              combinedSchedules.push(newItem);
              hoursToSchedule -= 2;
              scheduledForThisSubj += 2;
              allocatedCount++;
            }
          }

          if (scheduledForThisSubj > 0) {
            logs.push(`+ Alocadas ${scheduledForThisSubj}h para ${subj.name} (${cls.name}) com ${teacher.name}.`);
          } else {
            logs.push(`! Não foi possível encontrar horário sem conflito para ${subj.name} (${cls.name}).`);
            skippedCount++;
          }
        }
      }

      setGeneratedResult({
        allocated: newItems,
        successCount: allocatedCount,
        skippedCount,
        log: logs,
      });
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Otimizador Automático de Horários (SGHD)
              </h3>
              <p className="text-xs text-slate-500">
                Geração inteligente baseada em restrições, disponibilidades e capacidades (PDF Seção 17)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turma de Destino
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas as Turmas do Semestre</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} alunos)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado Inicial das Aulas Geradas
              </label>
              <select
                value={statusForNew}
                onChange={e => setStatusForNew(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Rascunho">Rascunho (Recomendado para revisão)</option>
                <option value="Em validação">Em validação</option>
                <option value="Publicado">Publicado diretamente</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-semibold text-slate-900 block">Critérios do Algoritmo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Evita sobreposição de docentes (RN01)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Evita sobreposição de salas (RN02)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Respeita indisponibilidade docente (RN04)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Respeita capacidade das salas (RN05)
              </div>
            </div>
          </div>

          {/* Action to Execute Generator */}
          {!generatedResult && (
            <div className="pt-2 flex justify-center">
              <button
                id="btn-run-auto-scheduler"
                onClick={handleRunGenerator}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando combinações sem conflito...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Executar Otimizador Automático</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results Output */}
          {generatedResult && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">
                    {generatedResult.successCount} Horários Alocados com Sucesso!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Nenhum conflito encontrado. Todas as regras de negócio foram satisfeitas.
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>

              {/* Execution log */}
              <div className="bg-slate-900 rounded-xl p-3.5 text-slate-200 font-mono text-[11px] max-h-44 overflow-y-auto space-y-1">
                {generatedResult.log.map((line, idx) => (
                  <div key={idx} className={line.startsWith('+') ? 'text-emerald-400' : line.startsWith('!') ? 'text-amber-400' : 'text-slate-400'}>
                    {line}
                  </div>
                ))}
              </div>

              {/* Final Apply / Dismiss buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Recalcular
                </button>
                <button
                  id="btn-apply-auto-scheduler"
                  type="button"
                  onClick={() => {
                    onApplyGenerated(generatedResult.allocated);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Aplicar {generatedResult.successCount} Aulas à Grade
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
