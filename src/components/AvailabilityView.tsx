import React, { useState } from 'react';
import { 
  CalendarClock, Check, X, Star, Save, User as UserIcon, 
  HelpCircle, CheckCircle2 
} from 'lucide-react';
import { 
  Teacher, TeacherAvailability, UserRole, DayOfWeek, 
  AvailabilityStatus 
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';

interface AvailabilityViewProps {
  teachers: Teacher[];
  availabilities: TeacherAvailability[];
  currentTeacherId?: string;
  userRole: UserRole;
  onSaveAvailabilities: (teacherId: string, updated: TeacherAvailability[]) => void;
}

export const AvailabilityView: React.FC<AvailabilityViewProps> = ({
  teachers = [],
  availabilities = [],
  currentTeacherId,
  userRole,
  onSaveAvailabilities,
}) => {
  const isDocente = userRole === 'docente';
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentTeacherId || teachers[0]?.id || ''
  );
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeTeacherId = isDocente ? (currentTeacherId || selectedTeacherId) : selectedTeacherId;
  const selectedTeacher = teachers.find(t => t.id === activeTeacherId) || (isDocente ? teachers.find(t => t.id === currentTeacherId) : teachers[0]);

  const visibleSlots = TIME_SLOTS.filter(slot => {
    const [startH] = slot.split(':').map(Number);
    if (selectedShift === 'morning') return startH < 12;
    if (selectedShift === 'afternoon') return startH >= 12;
    return true;
  });

  const getStatus = (day: DayOfWeek, slot: string): AvailabilityStatus => {
    if (!activeTeacherId) return 'Disponível';
    const record = availabilities.find(
      a => a.teacherId === activeTeacherId && a.dayOfWeek === day && a.timeSlot === slot
    );
    return record ? record.status : 'Disponível';
  };

  const handleToggleSlot = (day: DayOfWeek, slot: string) => {
    if (!activeTeacherId) return;
    // Cycle: Disponível -> Indisponível -> Preferencial -> Disponível
    const current = getStatus(day, slot);
    let next: AvailabilityStatus = 'Indisponível';
    if (current === 'Disponível') next = 'Indisponível';
    else if (current === 'Indisponível') next = 'Preferencial';
    else next = 'Disponível';

    // Build updated array
    const existingIndex = availabilities.findIndex(
      a => a.teacherId === activeTeacherId && a.dayOfWeek === day && a.timeSlot === slot
    );

    let updated: TeacherAvailability[];
    if (existingIndex >= 0) {
      updated = availabilities.map((a, idx) => 
        idx === existingIndex ? { ...a, status: next } : a
      );
    } else {
      updated = [
        ...availabilities,
        {
          id: `av-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          teacherId: selectedTeacher.id,
          dayOfWeek: day,
          timeSlot: slot,
          status: next,
        }
      ];
    }

    onSaveAvailabilities(selectedTeacher.id, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSetAll = (status: AvailabilityStatus) => {
    if (!activeTeacherId) return;
    const newItems: TeacherAvailability[] = [];
    for (const day of DAYS_OF_WEEK) {
      for (const slot of TIME_SLOTS) {
        newItems.push({
          id: `av-${Date.now()}-${day}-${slot}`,
          teacherId: activeTeacherId,
          dayOfWeek: day,
          timeSlot: slot,
          status,
        });
      }
    }

    // Replace all for this teacher
    const remaining = availabilities.filter(a => a.teacherId !== activeTeacherId);
    onSaveAvailabilities(activeTeacherId, [...remaining, ...newItems]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Disponibilidade Semanal (PDF Seção 13, RN04)
              </span>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {isDocente ? 'Minha Disponibilidade Docente' : 'Consulta e Gestão de Disponibilidade'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer faixa horária para alternar entre Disponível, Indisponível e Preferencial.
            </p>
          </div>

          {/* Teacher selector if manager/admin */}
          {!isDocente && (
            <div className="flex items-center gap-2 min-w-[260px]">
              <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                  Docente em Consulta:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} • {t.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Shift Filter Toolbar and Information Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start">
            <button
              onClick={() => setSelectedShift('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedShift === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos os Tempos (13 tempos)
            </button>
            <button
              onClick={() => setSelectedShift('morning')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                selectedShift === 'morning'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌅 Manhã</span>
              <span className="text-[10px] font-normal text-slate-500">(07:00 - 11:50)</span>
            </button>
            <button
              onClick={() => setSelectedShift('afternoon')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                selectedShift === 'afternoon'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>☀️ Tarde</span>
              <span className="text-[10px] font-normal text-slate-500">(12:00 - 17:50)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="font-semibold text-slate-700">Regulamento dos Turnos:</span>
            <span>Aulas de 50 min • Intervalo de 15 min às <strong>09:30-09:45</strong> (Manhã) e <strong>14:30-14:45</strong> (Tarde)</span>
          </div>
        </div>

        {/* Legend & Batch Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-slate-500">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></span>
              <span className="text-slate-700 font-medium">Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300"></span>
              <span className="text-rose-700 font-medium">Indisponível (RN04)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-300"></span>
              <span className="text-blue-700 font-medium">Preferencial</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleSetAll('Disponível')}
              className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition-colors"
            >
              Marcar Todos Disponível
            </button>
            <button
              onClick={() => handleSetAll('Indisponível')}
              className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition-colors"
            >
              Limpar / Indisponível
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Availability Timetable */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-36 border-r border-slate-200">
                  Dia da Semana
                </th>
                {visibleSlots.map(slot => (
                  <th key={slot} className="py-3 px-3 text-center text-xs font-bold text-slate-700 border-r border-slate-200 last:border-r-0 font-mono">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {DAYS_OF_WEEK.map(day => (
                <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-xs text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    {day}-feira
                  </td>

                  {visibleSlots.map(slot => {
                    const status = getStatus(day, slot);

                    return (
                      <td key={`${day}-${slot}`} className="p-2 border-r border-slate-200 last:border-r-0 text-center">
                        <button
                          onClick={() => handleToggleSlot(day, slot)}
                          className={`w-full py-3 px-2 rounded-xl text-xs font-semibold transition-all shadow-2xs border flex flex-col items-center justify-center gap-1 ${
                            status === 'Disponível'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : status === 'Indisponível'
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {status === 'Disponível' && (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-[11px]">Disponível</span>
                            </>
                          )}
                          {status === 'Indisponível' && (
                            <>
                              <X className="w-4 h-4 text-rose-600" />
                              <span className="text-[11px]">Indisponível</span>
                            </>
                          )}
                          {status === 'Preferencial' && (
                            <>
                              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                              <span className="text-[11px]">Preferencial</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
