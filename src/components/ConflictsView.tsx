import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldCheck, CheckCircle2, Trash2, 
  Edit3, ArrowRight, Check, Sparkles, Filter 
} from 'lucide-react';
import { 
  ScheduleConflict, ScheduleItem, Teacher, Room, 
  ClassGroup, Subject 
} from '../types';

interface ConflictsViewProps {
  conflicts: ScheduleConflict[];
  schedules: ScheduleItem[];
  teachers: Teacher[];
  rooms: Room[];
  classes: ClassGroup[];
  subjects: Subject[];
  onResolveByDeleting: (scheduleId: string) => void;
  onSelectScheduleForEdit: (schedule: ScheduleItem) => void;
  onInjectTestConflict: () => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflicts = [],
  schedules = [],
  teachers = [],
  rooms = [],
  classes = [],
  subjects = [],
  onResolveByDeleting,
  onSelectScheduleForEdit,
  onInjectTestConflict,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium'>('all');

  const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const filtered = safeConflicts.filter(c => {
    if (filterSeverity === 'all') return true;
    return c.severity === filterSeverity;
  });

  const highCount = safeConflicts.filter(c => c.severity === 'high').length;
  const mediumCount = safeConflicts.filter(c => c.severity === 'medium').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                conflicts.length > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {conflicts.length > 0 ? `${conflicts.length} Conflitos Activos` : 'Validação 100% Conforme'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Regras RN01 a RN07 (PDF Seções 14, 18, 38)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Motor de Deteção de Conflitos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Validação algorítmica em tempo real de sobreposições de horários, salas, turmas e limites contratuais.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {conflicts.length === 0 && (
              <button
                id="btn-inject-test-conflict"
                onClick={onInjectTestConflict}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Cria intencionalmente uma sobreposição para testar o algoritmo"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Simular Conflito para Teste</span>
              </button>
            )}
          </div>
        </div>

        {/* Severity Filter pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filtrar Severidade:</span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'all' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({conflicts.length})
          </button>
          <button
            onClick={() => setFilterSeverity('high')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'high' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Alta Severidade / Bloqueante ({highCount})
          </button>
          <button
            onClick={() => setFilterSeverity('medium')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'medium' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Média Severidade / Capacidade / Carga ({mediumCount})
          </button>
        </div>
      </div>

      {/* Rules Summary Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { code: 'RN01', name: 'Docente Duplo', desc: 'Docente em 2 aulas no mesmo horário' },
          { code: 'RN02', name: 'Sala Ocupada', desc: '2 turmas na mesma sala no mesmo período' },
          { code: 'RN03', name: 'Turma Dupla', desc: 'Turma com 2 disciplinas sobrepostas' },
          { code: 'RN04', name: 'Disponibilidade', desc: 'Aula em período marcado indisponível' },
          { code: 'RN05', name: 'Capacidade', desc: 'Estudantes da turma > capacidade da sala' },
          { code: 'RN06', name: 'Carga Horária', desc: 'Horas semanais > limite contratual' },
          { code: 'RN07', name: 'Duplicação', desc: 'Mesma aula cadastrada em duplicado' },
        ].map(rn => {
          const count = conflicts.filter(c => c.code === rn.code).length;
          return (
            <div 
              key={rn.code}
              className={`p-3 rounded-xl border text-xs transition-all ${
                count > 0 
                  ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold text-xs">
                <span>{rn.code}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  count > 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </div>
              <div className="font-semibold mt-1 truncate">{rn.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{rn.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Conflicts List */}
      {conflicts.length === 0 ? (
        <div className="bg-white rounded-xl border border-emerald-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Nenhum Conflito Detectado na Grade!
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            Todas as aulas programadas respeitam as disponibilidades dos docentes, capacidade das salas e não possuem sobreposição de horários.
          </p>
          <div className="mt-4">
            <button
              onClick={onInjectTestConflict}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Simular Conflito para Demonstração
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(conflict => {
            // Find involved schedules
            const involvedItems = safeSchedules.filter(s => (conflict.scheduleItemIds || []).includes(s.id));

            return (
              <div 
                key={conflict.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                  conflict.severity === 'high' 
                    ? 'border-rose-300 ring-1 ring-rose-200' 
                    : 'border-amber-300 ring-1 ring-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      conflict.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          conflict.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {conflict.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{conflict.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {conflict.description}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${
                    conflict.severity === 'high' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold'
                  }`}>
                    {conflict.severity === 'high' ? 'Conflito Crítico (Bloqueante)' : 'Aviso Institucional'}
                  </span>
                </div>

                {/* Involved schedules detail cards */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Aulas Envolvidas neste Conflito:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {involvedItems.map(item => {
                      const teacher = teachers.find(t => t.id === item.teacherId);
                      const subject = subjects.find(s => s.id === item.subjectId);
                      const classGroup = classes.find(c => c.id === item.classId);
                      const room = rooms.find(r => r.id === item.roomId);

                      return (
                        <div 
                          key={item.id}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{subject?.name}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              <span>{item.dayOfWeek}-feira, {item.startTime}-{item.endTime}</span>
                              <span className="mx-1.5">•</span>
                              <span>{room?.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Docente: <strong className="text-slate-700">{teacher?.name}</strong> • Turma: <strong className="text-slate-700">{classGroup?.name}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onSelectScheduleForEdit(item)}
                              className="px-2.5 py-1.5 rounded-md bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 font-medium text-xs flex items-center gap-1 transition-colors"
                              title="Editar aula para alterar horário ou sala"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Ajustar</span>
                            </button>
                            <button
                              onClick={() => onResolveByDeleting(item.id)}
                              className="p-1.5 rounded-md bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
                              title="Remover esta aula para desmarcar o conflito"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
