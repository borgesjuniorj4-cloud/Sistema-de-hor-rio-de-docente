import React, { useState } from 'react';
import { 
  GitPullRequest, CheckCircle2, XCircle, Clock, 
  User as UserIcon, Calendar, ArrowRight, MessageSquare, 
  Plus, AlertCircle, Check, X, Trash2 
} from 'lucide-react';
import { 
  ChangeRequest, ScheduleItem, Teacher, Subject, 
  ClassGroup, Room, UserRole, DayOfWeek 
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';

interface ChangeRequestsViewProps {
  changeRequests: ChangeRequest[];
  schedules: ScheduleItem[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  userRole: UserRole;
  currentUserId: string;
  currentTeacherId?: string;
  onApproveRequest: (requestId: string, comment?: string) => void;
  onRejectRequest: (requestId: string, comment?: string) => void;
  onCreateRequest: (req: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteRequest?: (requestId: string) => void;
}

export const ChangeRequestsView: React.FC<ChangeRequestsViewProps> = ({
  changeRequests = [],
  schedules = [],
  teachers = [],
  subjects = [],
  classes = [],
  rooms = [],
  userRole,
  currentUserId,
  currentTeacherId,
  onApproveRequest,
  onRejectRequest,
  onCreateRequest,
  onDeleteRequest,
}) => {
  const isDocente = userRole === 'docente';
  const canApprove = ['admin', 'gestor', 'coordenador'].includes(userRole);
  const isAdmin = userRole === 'admin';

  const safeChangeRequests = Array.isArray(changeRequests) ? changeRequests : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New request form state
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [newDay, setNewDay] = useState<DayOfWeek>('Segunda');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('12:00');
  const [reason, setReason] = useState('');

  // Review comment modal state
  const [activeReviewReq, setActiveReviewReq] = useState<ChangeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reqToDelete, setReqToDelete] = useState<ChangeRequest | null>(null);

  // Filter list
  const filtered = safeChangeRequests.filter(req => {
    if (isDocente && currentTeacherId && req.teacherId !== currentTeacherId) {
      return false;
    }
    if (filterStatus !== 'all' && req.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Allowed schedules to change (teacher's schedules or all if admin)
  const availableSchedules = isDocente && currentTeacherId
    ? safeSchedules.filter(s => s.teacherId === currentTeacherId && s.status !== 'Cancelado')
    : safeSchedules.filter(s => s.status !== 'Cancelado');

  const handleOpenNew = () => {
    if (availableSchedules.length > 0) {
      setSelectedScheduleId(availableSchedules[0].id);
    }
    setNewDay('Segunda');
    setNewStartTime('10:00');
    setNewEndTime('12:00');
    setReason('');
    setIsNewModalOpen(true);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const sch = schedules.find(s => s.id === selectedScheduleId);
    if (!sch) return;

    const teacher = teachers.find(t => t.id === sch.teacherId);
    const subject = subjects.find(s => s.id === sch.subjectId);
    const classGroup = classes.find(c => c.id === sch.classId);
    const room = rooms.find(r => r.id === sch.roomId);

    onCreateRequest({
      scheduleId: sch.id,
      requestedByUserId: currentUserId,
      requestedByName: teacher?.name || 'Docente',
      teacherId: sch.teacherId,
      currentScheduleInfo: {
        subjectName: subject?.name || 'Disciplina',
        className: classGroup?.name || 'Turma',
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        roomName: room?.name || 'Sala',
      },
      newDayOfWeek: newDay,
      newStartTime,
      newEndTime,
      reason,
    });

    setIsNewModalOpen(false);
  };

  const handleConfirmReview = () => {
    if (!activeReviewReq || !reviewAction) return;
    if (reviewAction === 'approve') {
      onApproveRequest(activeReviewReq.id, reviewComment);
    } else {
      onRejectRequest(activeReviewReq.id, reviewComment);
    }
    setActiveReviewReq(null);
    setReviewAction(null);
    setReviewComment('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Módulo 21 & 22 (PDF Páginas 20-21)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {filtered.length} solicitações registadas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Solicitações de Alteração de Horários
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fluxo formal de pedidos de reajuste com auditoria completa de motivos e aprovação institucional.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Solicitação de Ajuste</span>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filtrar Estado:</span>
          {['all', 'Pendente', 'Aprovada', 'Rejeitada'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st 
                  ? 'bg-slate-900 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            Nenhuma solicitação encontrada para os filtros selecionados.
          </div>
        ) : (
          filtered.map(req => (
            <div 
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-100 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {req.currentScheduleInfo.subjectName} ({req.currentScheduleInfo.className})
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      req.status === 'Pendente'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : req.status === 'Aprovada'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solicitante: <strong className="text-slate-700">{req.requestedByName}</strong> • Criado em {new Date(req.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>

                {/* Review and delete actions if manager or admin */}
                <div className="flex items-center gap-2">
                  {canApprove && req.status === 'Pendente' && (
                    <>
                      <button
                        onClick={() => { setActiveReviewReq(req); setReviewAction('approve'); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar Alteração</span>
                      </button>
                      <button
                        onClick={() => { setActiveReviewReq(req); setReviewAction('reject'); }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </>
                  )}

                  {(isAdmin || canApprove) && onDeleteRequest && (
                    <button
                      id={`btn-delete-change-req-${req.id}`}
                      onClick={() => setReqToDelete(req)}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar esta solicitação de alteração"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Comparision (Before -> After, matching PDF page 20) */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Horário Atual Cadastrado:
                  </span>
                  <div className="font-semibold text-slate-800">
                    {req.currentScheduleInfo.dayOfWeek}-feira, {req.currentScheduleInfo.startTime} às {req.currentScheduleInfo.endTime}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Espaço: {req.currentScheduleInfo.roomName}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-indigo-500 block mb-1">
                    Novo Horário Solicitado:
                  </span>
                  <div className="font-bold text-indigo-900">
                    {req.newDayOfWeek}-feira, {req.newStartTime} às {req.newEndTime}
                  </div>
                  <div className="text-indigo-700 text-[11px] mt-0.5">
                    Sala sugerida: Manter ou alocar pelo gestor
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="mt-3 text-xs text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900">Motivo informado:</span> {req.reason}
              </div>

              {/* Review Info if evaluated */}
              {req.reviewedBy && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Avaliado por: <strong className="text-slate-700">{req.reviewedBy}</strong></span>
                  {req.reviewComment && <span>• Comentário: "{req.reviewComment}"</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Solicitar Alteração de Horário</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Selecione a Aula a Alterar *</label>
                <select
                  value={selectedScheduleId}
                  onChange={e => setSelectedScheduleId(e.target.value)}
                  required
                  className="w-full border rounded p-2 text-xs"
                >
                  {availableSchedules.map(s => {
                    const subj = subjects.find(sub => sub.id === s.subjectId);
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {subj?.name} ({cls?.name}) - {s.dayOfWeek} {s.startTime}-{s.endTime}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Novo Dia *</label>
                  <select value={newDay} onChange={e => setNewDay(e.target.value as any)} className="w-full border rounded p-2 text-xs">
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}-feira</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Hora Inicial *</label>
                  <select value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full border rounded p-2 text-xs font-mono">
                    <option value="08:00">08:00</option>
                    <option value="10:00">10:00</option>
                    <option value="14:00">14:00</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Hora Final *</label>
                  <select value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="w-full border rounded p-2 text-xs font-mono">
                    <option value="10:00">10:00</option>
                    <option value="12:00">12:00</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Motivo Detalhado da Alteração *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Conflito com conferência internacional ou reunião departamental obrigatória."
                  className="w-full border rounded p-2 text-xs"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-3 py-1.5 border rounded">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded font-medium">
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Approve / Reject with comment) */}
      {activeReviewReq && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm">
              {reviewAction === 'approve' ? 'Aprovar Solicitação de Horário' : 'Rejeitar Solicitação de Horário'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {reviewAction === 'approve' 
                ? 'Ao aprovar, a aula será movida automaticamente para o novo horário no calendário e os envolvidos serão notificados.' 
                : 'Informe a justificativa institucional para o indeferimento.'}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold mb-1">Parecer / Comentário</label>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Ex: Aprovado sem restrições ou Sala indisponível no novo horário."
                className="w-full border rounded p-2 text-xs"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setActiveReviewReq(null); setReviewAction(null); }} className="px-3 py-1.5 border rounded text-xs">
                Cancelar
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-4 py-1.5 rounded text-white text-xs font-semibold ${
                  reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirmar {reviewAction === 'approve' ? 'Aprovação' : 'Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Modal */}
      {reqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm text-white">Eliminar Solicitação</h3>
              </div>
              <button
                type="button"
                onClick={() => setReqToDelete(null)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Tem a certeza de que deseja eliminar esta solicitação de alteração de horário de <strong>{reqToDelete.teacherName}</strong>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>Disciplina: <strong>{reqToDelete.subjectName}</strong> ({reqToDelete.className})</div>
                <div className="text-slate-500 mt-1">Motivo: "{reqToDelete.reason}"</div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReqToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteRequest && reqToDelete) {
                      onDeleteRequest(reqToDelete.id);
                      setReqToDelete(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Eliminar Solicitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
