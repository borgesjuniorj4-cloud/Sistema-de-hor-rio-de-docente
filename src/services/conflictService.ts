import { 
  ScheduleItem, Teacher, Room, ClassGroup, Subject, 
  TeacherAvailability, ScheduleConflict, ConflictType 
} from '../types';

// Helper to convert HH:MM to minutes
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Check if two time intervals overlap
export function isOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export function validateAllSchedules(
  schedules: ScheduleItem[],
  teachers: Teacher[],
  rooms: Room[],
  classes: ClassGroup[],
  subjects: Subject[],
  availabilities: TeacherAvailability[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const classMap = new Map(classes.map(c => [c.id, c]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // 1. Check pairwise conflicts (RN01, RN02, RN03, RN07)
  for (let i = 0; i < schedules.length; i++) {
    const itemA = schedules[i];
    // Skip cancelled schedules
    if (itemA.status === 'Cancelado') continue;

    const teacherA = teacherMap.get(itemA.teacherId);
    const roomA = roomMap.get(itemA.roomId);
    const classA = classMap.get(itemA.classId);
    const subjectA = subjectMap.get(itemA.subjectId);

    // RN05: Capacidade da sala vs alunos da turma
    if (roomA && classA && classA.studentCount > roomA.capacity) {
      conflicts.push({
        id: `conf-rn05-${itemA.id}`,
        type: 'RN05_CAPACITY_CONFLICT',
        code: 'RN05',
        severity: 'medium',
        title: 'Capacidade de Sala Insuficiente',
        description: `A turma ${classA.name} tem ${classA.studentCount} estudantes, mas a sala ${roomA.name} suporta apenas ${roomA.capacity} lugares.`,
        scheduleItemIds: [itemA.id],
        involvedRoomId: roomA.id,
        involvedClassId: classA.id,
      });
    }

    // RN04: Indisponibilidade do docente
    const slotStr = `${itemA.startTime}-${itemA.endTime}`;
    const unavail = availabilities.find(
      a => a.teacherId === itemA.teacherId &&
           a.dayOfWeek === itemA.dayOfWeek &&
           a.timeSlot === slotStr &&
           a.status === 'Indisponível'
    );
    if (unavail) {
      conflicts.push({
        id: `conf-rn04-${itemA.id}`,
        type: 'RN04_AVAILABILITY_CONFLICT',
        code: 'RN04',
        severity: 'high',
        title: 'Docente Indisponível',
        description: `O docente ${teacherA ? teacherA.name : 'Docente'} declarou-se indisponível em ${itemA.dayOfWeek}-feira das ${itemA.startTime} às ${itemA.endTime}.`,
        scheduleItemIds: [itemA.id],
        involvedTeacherId: itemA.teacherId,
      });
    }

    for (let j = i + 1; j < schedules.length; j++) {
      const itemB = schedules[j];
      if (itemB.status === 'Cancelado') continue;

      // Only evaluate if on the same day and periods overlap
      if (itemA.dayOfWeek === itemB.dayOfWeek && isOverlapping(itemA.startTime, itemA.endTime, itemB.startTime, itemB.endTime)) {
        // RN01: Conflito de docente
        if (itemA.teacherId === itemB.teacherId) {
          const tName = teacherA ? teacherA.name : 'Docente';
          const subB = subjectMap.get(itemB.subjectId);
          conflicts.push({
            id: `conf-rn01-${itemA.id}-${itemB.id}`,
            type: 'RN01_TEACHER_CONFLICT',
            code: 'RN01',
            severity: 'high',
            title: 'Conflito de Docente',
            description: `O docente ${tName} está atribuído simultaneamente a ${subjectA?.name || 'Aula A'} e ${subB?.name || 'Aula B'} na ${itemA.dayOfWeek}-feira (${itemA.startTime} às ${itemA.endTime}).`,
            scheduleItemIds: [itemA.id, itemB.id],
            involvedTeacherId: itemA.teacherId,
          });
        }

        // RN02: Conflito de sala
        if (itemA.roomId === itemB.roomId) {
          const rName = roomA ? roomA.name : 'Sala';
          const classB = classMap.get(itemB.classId);
          conflicts.push({
            id: `conf-rn02-${itemA.id}-${itemB.id}`,
            type: 'RN02_ROOM_CONFLICT',
            code: 'RN02',
            severity: 'high',
            title: 'Conflito de Sala',
            description: `A sala ${rName} já está reservada simultaneamente para ${classA?.name || 'Turma A'} e ${classB?.name || 'Turma B'} neste período.`,
            scheduleItemIds: [itemA.id, itemB.id],
            involvedRoomId: itemA.roomId,
          });
        }

        // RN03: Conflito de turma
        if (itemA.classId === itemB.classId) {
          const cName = classA ? classA.name : 'Turma';
          const subB = subjectMap.get(itemB.subjectId);
          conflicts.push({
            id: `conf-rn03-${itemA.id}-${itemB.id}`,
            type: 'RN03_CLASS_CONFLICT',
            code: 'RN03',
            severity: 'high',
            title: 'Conflito de Turma',
            description: `A turma ${cName} possui duas disciplinas sobrepostas (${subjectA?.name || 'Disc. A'} e ${subB?.name || 'Disc. B'}) no mesmo horário.`,
            scheduleItemIds: [itemA.id, itemB.id],
            involvedClassId: itemA.classId,
          });
        }

        // RN07: Horário duplicado
        if (itemA.classId === itemB.classId && itemA.subjectId === itemB.subjectId && itemA.startTime === itemB.startTime && itemA.endTime === itemB.endTime) {
          conflicts.push({
            id: `conf-rn07-${itemA.id}-${itemB.id}`,
            type: 'RN07_DUPLICATE_LESSON',
            code: 'RN07',
            severity: 'medium',
            title: 'Aula Duplicada',
            description: `Existem duas aulas idênticas cadastradas para a mesma turma e disciplina no mesmo horário.`,
            scheduleItemIds: [itemA.id, itemB.id],
          });
        }
      }
    }
  }

  // RN06: Carga horária semanal por docente
  for (const teacher of teachers) {
    const teacherSchedules = schedules.filter(
      s => s.teacherId === teacher.id && s.status !== 'Cancelado'
    );
    let totalMinutes = 0;
    for (const sch of teacherSchedules) {
      totalMinutes += timeToMinutes(sch.endTime) - timeToMinutes(sch.startTime);
    }
    const totalHours = Math.round(totalMinutes / 60);

    if (totalHours > teacher.workloadLimit) {
      conflicts.push({
        id: `conf-rn06-${teacher.id}`,
        type: 'RN06_WORKLOAD_LIMIT',
        code: 'RN06',
        severity: 'medium',
        title: 'Limite de Carga Horária Excedido',
        description: `O docente ${teacher.name} possui ${totalHours}h semanais atribuídas, ultrapassando o seu limite contratual de ${teacher.workloadLimit}h.`,
        scheduleItemIds: teacherSchedules.map(s => s.id),
        involvedTeacherId: teacher.id,
      });
    }
  }

  return conflicts;
}

// Function to test prospective item conflict before adding/updating
export function checkProspectiveConflicts(
  candidate: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  existingSchedules: ScheduleItem[],
  teachers: Teacher[],
  rooms: Room[],
  classes: ClassGroup[],
  subjects: Subject[],
  availabilities: TeacherAvailability[]
): string[] {
  const issues: string[] = [];
  const teacher = teachers.find(t => t.id === candidate.teacherId);
  const room = rooms.find(r => r.id === candidate.roomId);
  const classGroup = classes.find(c => c.id === candidate.classId);
  const subject = subjects.find(s => s.id === candidate.subjectId);

  // Check room capacity
  if (room && classGroup && classGroup.studentCount > room.capacity) {
    issues.push(`Capacidade excedida: Sala suporta ${room.capacity} lugares, mas a turma tem ${classGroup.studentCount} alunos.`);
  }

  // Check teacher availability
  const slotStr = `${candidate.startTime}-${candidate.endTime}`;
  const unavail = availabilities.find(
    a => a.teacherId === candidate.teacherId &&
         a.dayOfWeek === candidate.dayOfWeek &&
         a.timeSlot === slotStr &&
         a.status === 'Indisponível'
  );
  if (unavail) {
    issues.push(`Docente indisponível: ${teacher?.name} marcou indisponibilidade neste dia e horário.`);
  }

  // Check overlapping with others
  for (const item of existingSchedules) {
    if (candidate.id && item.id === candidate.id) continue;
    if (item.status === 'Cancelado') continue;

    if (item.dayOfWeek === candidate.dayOfWeek && isOverlapping(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
      if (item.teacherId === candidate.teacherId) {
        issues.push(`Conflito de Docente: ${teacher?.name || 'Docente'} já possui outra aula neste horário (${item.startTime}-${item.endTime}).`);
      }
      if (item.roomId === candidate.roomId) {
        issues.push(`Conflito de Sala: A sala ${room?.name || 'Sala'} já está ocupada por outra turma neste horário.`);
      }
      if (item.classId === candidate.classId) {
        issues.push(`Conflito de Turma: A turma ${classGroup?.name || 'Turma'} já tem outra aula agendada neste horário.`);
      }
    }
  }

  return issues;
}

export const ConflictService = {
  validateAllSchedules,
  isOverlapping,
  timeToMinutes,
  checkProspectiveConflicts,
  validateSingleSchedule: checkProspectiveConflicts,
};
