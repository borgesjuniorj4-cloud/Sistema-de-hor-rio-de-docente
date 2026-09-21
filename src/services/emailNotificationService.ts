import { ScheduleItem, Teacher, Subject, ClassGroup, Room, AcademicPeriod, User } from '../types';

export type EmailNotificationType = 
  | 'NEW_LESSON' 
  | 'UPDATED_LESSON' 
  | 'REMOVED_LESSON' 
  | 'REQUEST_APPROVED';

export interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface SimulatedEmail {
  id: string;
  recipientTeacherId: string;
  recipientTeacherName: string;
  recipientEmail: string;
  sender: string;
  subject: string;
  type: EmailNotificationType;
  typeLabel: string;
  sentAt: string;
  status: 'ENVIADO';
  read: boolean;
  previewSnippet: string;
  metadata: {
    subjectName: string;
    subjectCode: string;
    className: string;
    roomName: string;
    roomCode: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    timeSlot: string;
    lessonType: string;
    academicPeriod: string;
    operatorName: string;
    operatorRole: string;
    changes?: FieldChange[];
    additionalNote?: string;
  };
  bodyText: string;
  bodyHtml: string;
}

const STORAGE_KEY = 'universidade_tobas_simulated_emails';
const MAX_STORED_EMAILS = 120;

/**
 * Retrieves all stored simulated emails from localStorage.
 */
export function getStoredSimulatedEmails(): SimulatedEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Erro ao recuperar e-mails simulados:', err);
    return [];
  }
}

/**
 * Saves simulated emails list to localStorage.
 */
function persistEmails(emails: SimulatedEmail[]): void {
  try {
    const trimmed = emails.slice(0, MAX_STORED_EMAILS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Erro ao persistir e-mails simulados:', err);
  }
}

/**
 * Get emails specifically received by a given teacher.
 */
export function getTeacherSimulatedEmails(teacherId: string): SimulatedEmail[] {
  const all = getStoredSimulatedEmails();
  return all.filter(e => e.recipientTeacherId === teacherId);
}

/**
 * Mark a simulated email as read.
 */
export function markSimulatedEmailAsRead(id: string): void {
  const emails = getStoredSimulatedEmails();
  const updated = emails.map(e => e.id === id ? { ...e, read: true } : e);
  persistEmails(updated);
  window.dispatchEvent(new CustomEvent('sghd:simulated_emails_updated'));
}

/**
 * Mark all simulated emails as read.
 */
export function markAllSimulatedEmailsAsRead(): void {
  const emails = getStoredSimulatedEmails();
  const updated = emails.map(e => ({ ...e, read: true }));
  persistEmails(updated);
  window.dispatchEvent(new CustomEvent('sghd:simulated_emails_updated'));
}

/**
 * Delete a specific simulated email.
 */
export function deleteSimulatedEmail(id: string): void {
  const emails = getStoredSimulatedEmails();
  const updated = emails.filter(e => e.id !== id);
  persistEmails(updated);
  window.dispatchEvent(new CustomEvent('sghd:simulated_emails_updated'));
}

/**
 * Clear all simulated emails.
 */
export function clearAllSimulatedEmails(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('sghd:simulated_emails_updated'));
}

/**
 * Helper to compute changed fields between two schedule states.
 */
export function computeScheduleChanges(
  oldSchedule: ScheduleItem,
  newSchedule: ScheduleItem,
  rooms: Room[]
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (oldSchedule.dayOfWeek !== newSchedule.dayOfWeek) {
    changes.push({
      field: 'dayOfWeek',
      label: 'Dia da Semana',
      before: oldSchedule.dayOfWeek,
      after: newSchedule.dayOfWeek,
    });
  }

  if (oldSchedule.startTime !== newSchedule.startTime || oldSchedule.endTime !== newSchedule.endTime) {
    changes.push({
      field: 'time',
      label: 'Horário Letivo',
      before: `${oldSchedule.startTime} - ${oldSchedule.endTime}`,
      after: `${newSchedule.startTime} - ${newSchedule.endTime}`,
    });
  }

  if (oldSchedule.roomId !== newSchedule.roomId) {
    const oldRoom = rooms.find(r => r.id === oldSchedule.roomId);
    const newRoom = rooms.find(r => r.id === newSchedule.roomId);
    changes.push({
      field: 'room',
      label: 'Sala / Espaço Físico',
      before: oldRoom ? `${oldRoom.name} (${oldRoom.code})` : oldSchedule.roomId,
      after: newRoom ? `${newRoom.name} (${newRoom.code})` : newSchedule.roomId,
    });
  }

  if (oldSchedule.lessonType !== newSchedule.lessonType) {
    changes.push({
      field: 'lessonType',
      label: 'Tipo de Aula',
      before: oldSchedule.lessonType,
      after: newSchedule.lessonType,
    });
  }

  if (oldSchedule.status !== newSchedule.status) {
    changes.push({
      field: 'status',
      label: 'Estado da Aula',
      before: oldSchedule.status,
      after: newSchedule.status,
    });
  }

  return changes;
}

export interface SendScheduleEmailParams {
  type: EmailNotificationType;
  teacher: Teacher;
  schedule: ScheduleItem;
  oldSchedule?: ScheduleItem;
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  periods: AcademicPeriod[];
  currentUser: User;
  additionalNote?: string;
  customReason?: string;
}

/**
 * Simulates sending an official email notification from Universidade Tobas to a teacher.
 * Generates an authentic, beautifully styled institutional HTML email and stores it in the system.
 */
export function sendScheduleEmailNotification(params: SendScheduleEmailParams): SimulatedEmail {
  const {
    type,
    teacher,
    schedule,
    oldSchedule,
    subjects,
    classes,
    rooms,
    periods,
    currentUser,
    additionalNote,
    customReason,
  } = params;

  const subject = subjects.find(s => s.id === schedule.subjectId);
  const classGroup = classes.find(c => c.id === schedule.classId);
  const room = rooms.find(r => r.id === schedule.roomId);
  const period = periods.find(p => p.id === (schedule.academicPeriodId || schedule.periodId)) || periods[0];

  const subjectName = subject?.name || 'Disciplina Curricular';
  const subjectCode = subject?.code || 'DISC';
  const className = classGroup?.name || 'Turma Não Especificada';
  const roomName = room ? `${room.name} (${room.code})` : schedule.roomId || 'Sala por definir';
  const roomCode = room?.code || '';
  const periodLabel = period ? `${period.academicYear} - ${period.semester}` : '2026/2027 - 1.º Semestre';

  const timeSlot = `${schedule.startTime} - ${schedule.endTime}`;
  const dayOfWeek = schedule.dayOfWeek;
  const lessonType = schedule.lessonType || 'Teórica';

  // Compute changes if updating an existing lesson
  const changes = (type === 'UPDATED_LESSON' && oldSchedule)
    ? computeScheduleChanges(oldSchedule, schedule, rooms)
    : undefined;

  let typeLabel = 'Nova Aula Atribuída';
  let emailSubject = `[Universidade Tobas] Atribuição de Nova Aula: ${subjectName} (${className})`;
  let headerTitle = 'Nova Aula Atribuída à Sua Grade Horária';
  let actionIntro = `Informamos que foi atribuída uma nova aula à sua distribuição de serviço docente na Universidade Tobas.`;
  let badgeColor = '#4f46e5'; // Indigo

  if (type === 'UPDATED_LESSON') {
    typeLabel = 'Alteração de Horário';
    emailSubject = `[Universidade Tobas] Alteração de Horário: ${subjectName} (${className})`;
    headerTitle = 'Atualização na Sua Grade Horária';
    actionIntro = `Informamos que foram introduzidas alterações a uma aula da sua grade horária na Universidade Tobas.`;
    badgeColor = '#0284c7'; // Sky / Blue
  } else if (type === 'REQUEST_APPROVED') {
    typeLabel = 'Solicitação Aprovada';
    emailSubject = `[Universidade Tobas] Pedido de Ajuste Aprovado: ${subjectName} (${className})`;
    headerTitle = 'Pedido de Ajuste de Horário Deferido';
    actionIntro = `A sua solicitação de ajuste de horário foi aprovada e as novas coordenadas letivas já se encontram atualizadas na grade oficial.`;
    badgeColor = '#059669'; // Emerald
  } else if (type === 'REMOVED_LESSON') {
    typeLabel = 'Aula Desatribuída';
    emailSubject = `[Universidade Tobas] Desatribuição de Aula: ${subjectName} (${className})`;
    headerTitle = 'Remoção / Cancelamento de Aula';
    actionIntro = `Informamos que a aula abaixo descrita foi desatribuída da sua grade horária oficial.`;
    badgeColor = '#e11d48'; // Rose
  }

  const senderAddress = 'Universidade Tobas - SGHD <notificacoes.horarios@tobas.edu>';
  const recipientEmail = teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, '.')}@tobas.edu`;
  const sentAt = new Date().toISOString();
  const formattedDate = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  // Plain text preview
  const bodyText = `
UNIVERSIDADE TOBAS - SISTEMA DE GESTÃO DE HORÁRIOS DE DOCENTES (SGHD)
Campus Central • Notificação Oficial de Horário

Exmo(a). Prof(a). ${teacher.name},

${actionIntro}

DETALHES DA AULA:
- Disciplina: ${subjectName} (${subjectCode})
- Turma: ${className}
- Dia da Semana: ${dayOfWeek}
- Horário: ${timeSlot}
- Espaço Físico / Sala: ${roomName}
- Tipologia: ${lessonType}
- Período Letivo: ${periodLabel}
- Estado no Sistema: ${schedule.status}
${changes && changes.length > 0 ? '\nALTERAÇÕES REGISTADAS:\n' + changes.map(c => `* ${c.label}: de "${c.before}" para "${c.after}"`).join('\n') : ''}
${additionalNote ? `\nObservações: ${additionalNote}` : ''}
${customReason ? `\nMotivo do Ajuste: ${customReason}` : ''}

Responsável pela Operação: ${currentUser.name} (${currentUser.role})
Data/Hora de Emissão: ${formattedDate}

Poderá consultar a sua grade horária completa e sincronizada acedendo ao portal SGHD da Universidade Tobas.

Com os melhores cumprimentos,
Serviços Académicos e Gestão Curricular
Universidade Tobas
`.trim();

  // HTML content formatted like an institutional university email
  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .email-card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .email-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 24px; border-bottom: 3px solid #6366f1; }
    .email-header h1 { margin: 0 0 4px 0; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #e0e7ff; }
    .email-header h2 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${badgeColor}; color: #ffffff; margin-top: 10px; }
    .email-body { padding: 28px 24px; }
    .salutation { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .intro-p { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 22px; }
    .details-grid { display: table; width: 100%; border-collapse: collapse; font-size: 13px; }
    .details-row { display: table-row; border-bottom: 1px solid #edf2f7; }
    .details-row:last-child { border-bottom: none; }
    .details-cell-label { display: table-cell; padding: 8px 6px; font-weight: 600; color: #64748b; width: 35%; }
    .details-cell-value { display: table-cell; padding: 8px 6px; font-weight: 700; color: #0f172a; }
    .changes-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 22px; }
    .changes-title { font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .changes-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .changes-table th { text-align: left; padding: 6px; color: #3b82f6; border-bottom: 1px solid #dbeafe; font-size: 11px; text-transform: uppercase; }
    .changes-table td { padding: 7px 6px; border-bottom: 1px solid #e0e7ff; color: #1e3a8a; }
    .val-before { color: #dc2626; text-decoration: line-through; margin-right: 6px; }
    .val-after { color: #16a34a; font-weight: 700; }
    .cta-container { text-align: center; margin: 26px 0 16px 0; }
    .cta-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2); }
    .email-footer { background: #f1f5f9; padding: 18px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
    .email-footer p { margin: 4px 0; }
    .security-stamp { display: inline-block; background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #475569; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h1>Universidade Tobas • SGHD</h1>
      <h2>${headerTitle}</h2>
      <span class="badge">${typeLabel}</span>
    </div>
    
    <div class="email-body">
      <p class="salutation">Exmo(a). Prof(a). ${teacher.name},</p>
      <p class="intro-p">${actionIntro}</p>

      ${changes && changes.length > 0 ? `
      <div class="changes-box">
        <div class="changes-title">Resumo das Alterações Efetuadas:</div>
        <table class="changes-table">
          <thead>
            <tr>
              <th>Parâmetro</th>
              <th>Anterior</th>
              <th>Novo Valor Atualizado</th>
            </tr>
          </thead>
          <tbody>
            ${changes.map(c => `
              <tr>
                <td><strong>${c.label}</strong></td>
                <td><span class="val-before">${c.before}</span></td>
                <td><span class="val-after">${c.after}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="details-box">
        <div class="details-grid">
          <div class="details-row">
            <div class="details-cell-label">Disciplina:</div>
            <div class="details-cell-value">${subjectName} <span style="color:#64748b; font-weight:normal;">(${subjectCode})</span></div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Turma:</div>
            <div class="details-cell-value">${className}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Dia da Semana:</div>
            <div class="details-cell-value">${dayOfWeek}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Horário Letivo:</div>
            <div class="details-cell-value" style="color:#4f46e5;">${timeSlot}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Espaço / Sala:</div>
            <div class="details-cell-value">${roomName}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Tipo de Aula:</div>
            <div class="details-cell-value">${lessonType}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Período Letivo:</div>
            <div class="details-cell-value">${periodLabel}</div>
          </div>
          <div class="details-row">
            <div class="details-cell-label">Estado Oficial:</div>
            <div class="details-cell-value">${schedule.status}</div>
          </div>
        </div>
      </div>

      ${additionalNote ? `
      <p style="font-size:13px; color:#475569; background:#fffbeb; border:1px solid #fef3c7; padding:12px; border-radius:6px;">
        <strong>Nota da Coordenação:</strong> ${additionalNote}
      </p>
      ` : ''}

      <div class="cta-container">
        <span class="cta-btn">Consultar Grade no SGHD</span>
      </div>

      <p style="font-size:12px; color:#64748b; line-height:1.5; margin-top:20px;">
        Caso verifique qualquer incompatibilidade de agenda, poderá submeter uma solicitação formal de ajuste de horário através do portal SGHD da instituição.
      </p>
    </div>

    <div class="email-footer">
      <p><strong>Universidade Tobas</strong> • Direção de Serviços Académicos e Gestão de Horários</p>
      <p>Emissor do Processo: ${currentUser.name} (${currentUser.role}) | Data de Envio: ${formattedDate}</p>
      <div class="security-stamp">SGHD EMAIL DISPATCH SIMULATOR • UNIVERSIDADE TOBAS ID: ${schedule.id}</div>
      <p style="margin-top:8px; font-size:10px; color:#94a3b8;">
        Esta é uma mensagem eletrónica automática institucional gerada pelo sistema SGHD. A informação contida é confidencial e destinada exclusivamente ao docente designado.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();

  const previewSnippet = `${typeLabel}: ${subjectName} (${className}) - ${dayOfWeek} às ${schedule.startTime}`;

  const emailItem: SimulatedEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientTeacherId: teacher.id,
    recipientTeacherName: teacher.name,
    recipientEmail,
    sender: senderAddress,
    subject: emailSubject,
    type,
    typeLabel,
    sentAt,
    status: 'ENVIADO',
    read: false,
    previewSnippet,
    metadata: {
      subjectName,
      subjectCode,
      className,
      roomName,
      roomCode,
      dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      timeSlot,
      lessonType,
      academicPeriod: periodLabel,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      changes,
      additionalNote,
    },
    bodyText,
    bodyHtml,
  };

  // Prepend to stored list
  const currentEmails = getStoredSimulatedEmails();
  const updatedEmails = [emailItem, ...currentEmails];
  persistEmails(updatedEmails);

  // Dispatch custom events for real-time reactivity in UI components
  try {
    window.dispatchEvent(new CustomEvent('sghd:email_notification_sent', { detail: emailItem }));
    window.dispatchEvent(new CustomEvent('sghd:simulated_emails_updated', { detail: emailItem }));
  } catch (err) {
    console.warn('Erro ao disparar evento de email:', err);
  }

  return emailItem;
}
