export type UserRole = 'admin' | 'gestor' | 'coordenador' | 'docente' | 'estudante';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  password?: string;
  avatarUrl?: string;
  teacherId?: string;
  classId?: string;
}

export type TeacherStatus = 'Ativo' | 'Inativo' | 'Suspenso' | 'Em licença';
export type ContractType = 'Tempo Integral' | 'Tempo Parcial' | 'Horista' | 'Dedicado';

export interface Teacher {
  id: string;
  userId?: string;
  code: string;
  name: string;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  birthDate: string;
  email: string;
  phone: string;
  departmentId: string;
  category: string; // e.g., Professor Catedrático, Associado, Auxiliar, Convidado
  specialization: string;
  contractType: ContractType;
  workloadLimit: number; // max weekly hours, e.g. 18h
  currentWorkload: number; // calculated from scheduled lessons
  status: TeacherStatus;
  entryDate: string;
  notes?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  manager: string; // Responsável
  status: 'Ativo' | 'Inativo';
}

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  degree: 'Licenciatura' | 'Mestrado' | 'Doutoramento' | 'Pós-Graduação';
  duration: string; // e.g. '3 Anos'
  semesterCount: number;
  status: 'Ativo' | 'Inativo';
}

export interface Subject {
  id: string;
  courseId: string;
  departmentId: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  weeklyHours: number;
  semester: number;
  type: 'Obrigatória' | 'Optativa';
  status: 'Ativo' | 'Inativo';
}

export interface ClassGroup {
  id: string;
  courseId: string;
  code: string;
  name: string; // e.g. 'INF-A'
  year: number;
  semester: number;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  studentCount: number;
  status: 'Ativo' | 'Inativo';
}

export type RoomType = 'Sala normal' | 'Laboratório' | 'Sala de informática' | 'Auditório' | 'Sala de reuniões';

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  type: RoomType;
  equipment: string[]; // e.g. ['Projetor', 'Computadores', 'Quadro interativo', 'Ar condicionado', 'Sistema de som']
  status: 'Disponível' | 'Manutenção' | 'Inativo';
}

export interface AcademicPeriod {
  id: string;
  academicYear: string; // e.g. '2026/2027'
  semester: string; // '1.º Semestre' | '2.º Semestre'
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'Ativo' | 'Planeamento' | 'Encerrado';
}

export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';
export type AvailabilityStatus = 'Disponível' | 'Indisponível' | 'Preferencial';

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  timeSlot: string; // e.g. '08:00-10:00'
  status: AvailabilityStatus;
}

export type ScheduleStatus = 
  | 'Rascunho' 
  | 'Em validação' 
  | 'Aprovado' 
  | 'Publicado' 
  | 'Suspenso' 
  | 'Cancelado';

export type LessonType = 'Teórica' | 'Prática' | 'Teórico-Prática' | 'Laboratório';

export interface ScheduleItem {
  id: string;
  academicPeriodId: string;
  periodId?: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  roomId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // '08:00'
  endTime: string;   // '10:00'
  lessonType: LessonType;
  notes?: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export type ConflictType = 
  | 'RN01_TEACHER_CONFLICT'
  | 'RN02_ROOM_CONFLICT'
  | 'RN03_CLASS_CONFLICT'
  | 'RN04_AVAILABILITY_CONFLICT'
  | 'RN05_CAPACITY_CONFLICT'
  | 'RN06_WORKLOAD_LIMIT'
  | 'RN07_DUPLICATE_LESSON';

export interface ScheduleConflict {
  id: string;
  type: ConflictType;
  code: string;
  severity: 'high' | 'medium';
  title: string;
  description: string;
  scheduleItemIds: string[];
  involvedTeacherId?: string;
  involvedRoomId?: string;
  involvedClassId?: string;
}

export type RequestStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';

export interface ChangeRequest {
  id: string;
  scheduleId: string;
  requestedByUserId: string;
  requestedByName: string;
  teacherId: string;
  currentScheduleInfo: {
    subjectName: string;
    className: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    roomName: string;
  };
  newDayOfWeek: DayOfWeek;
  newStartTime: string;
  newEndTime: string;
  newRoomId?: string;
  reason: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // empty means all or role target
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity?: string;
  entityType?: string;
  entityId: string;
  details?: string;
  oldData?: string;
  newData?: string;
  previousValues?: any;
  newValues?: any;
  timestamp: string;
}

export type AuditLogEntry = AuditLog;
