import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ScheduleItem, Teacher, Department, Course, Subject, 
  ClassGroup, Room, AcademicPeriod, TeacherAvailability, 
  ChangeRequest, AuditLogEntry, NotificationItem, UserRole, 
  ScheduleStatus, User 
} from './types';
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_COURSES, 
  INITIAL_SUBJECTS, INITIAL_CLASSES, INITIAL_ROOMS, 
  INITIAL_PERIODS, INITIAL_TEACHERS, INITIAL_SCHEDULES, 
  INITIAL_AVAILABILITIES, INITIAL_CHANGE_REQUESTS, 
  INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS 
} from './data/initialData';
import { StorageService } from './services/storageService';
import { ConflictService } from './services/conflictService';
import { useIdleTimer } from './hooks/useIdleTimer';

// Subcomponents
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SchedulesView } from './components/SchedulesView';
import { ConflictsView } from './components/ConflictsView';
import { AvailabilityView } from './components/AvailabilityView';
import { TeachersView } from './components/TeachersView';
import { AcademicDataView } from './components/AcademicDataView';
import { ChangeRequestsView } from './components/ChangeRequestsView';
import { AuditLogsView } from './components/AuditLogsView';
import { ReportsView } from './components/ReportsView';
import { AdminView } from './components/AdminView';
import { ScheduleModal } from './components/ScheduleModal';
import { AutoGenerateModal } from './components/AutoGenerateModal';
import { LockScreen } from './components/LockScreen';
import { LoginScreen } from './components/LoginScreen';
import { SimulatedEmailToast } from './components/SimulatedEmailToast';
import { SimulatedEmailsModal } from './components/SimulatedEmailsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { 
  sendScheduleEmailNotification, 
  SimulatedEmail, 
  getStoredSimulatedEmails 
} from './services/emailNotificationService';

export default function App() {
  // Load data or initialize
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentication State: Require password on entry
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sghd_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = StorageService.getUsers();
      if (stored && stored.length) return stored;
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const storedId = sessionStorage.getItem('sghd_logged_user_id');
      if (storedId) {
        const storedUsers = StorageService.getUsers();
        const found = (storedUsers.length ? storedUsers : INITIAL_USERS).find(u => u.id === storedId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS[0]; // Admin by default
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [classes, setClasses] = useState<ClassGroup[]>(INITIAL_CLASSES);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [periods, setPeriods] = useState<AcademicPeriod[]>(INITIAL_PERIODS);
  const [availabilities, setAvailabilities] = useState<TeacherAvailability[]>(INITIAL_AVAILABILITIES);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(INITIAL_CHANGE_REQUESTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modal helpers for global triggers
  const [globalScheduleModalOpen, setGlobalScheduleModalOpen] = useState(false);
  const [globalEditingSchedule, setGlobalEditingSchedule] = useState<ScheduleItem | null>(null);
  const [globalAutoModalOpen, setGlobalAutoModalOpen] = useState(false);

  // Simulated Email Notification System State
  const [simulatedEmailsModalOpen, setSimulatedEmailsModalOpen] = useState(false);
  const [previewSimulatedEmail, setPreviewSimulatedEmail] = useState<SimulatedEmail | null>(null);
  const [simulatedEmailsCount, setSimulatedEmailsCount] = useState<number>(() => getStoredSimulatedEmails().length);

  useEffect(() => {
    const handleEmailsUpdated = () => {
      setSimulatedEmailsCount(getStoredSimulatedEmails().length);
    };
    window.addEventListener('sghd:simulated_emails_updated', handleEmailsUpdated);
    return () => window.removeEventListener('sghd:simulated_emails_updated', handleEmailsUpdated);
  }, []);

  // Session Lock & 30-minute Idle Timer
  const IDLE_TIMEOUT_MINUTES = 30;
  const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sghd_session_locked') === 'true';
    } catch {
      return false;
    }
  });

  const handleLockSession = useCallback(() => {
    setIsLocked(true);
    try {
      localStorage.setItem('sghd_session_locked', 'true');
    } catch {
      // ignore
    }
  }, []);

  const { resetTimer } = useIdleTimer({
    timeoutMs: IDLE_TIMEOUT_MS,
    onIdle: handleLockSession,
    enabled: !isLocked,
  });

  const handleUnlockSession = useCallback(() => {
    setIsLocked(false);
    try {
      localStorage.removeItem('sghd_session_locked');
    } catch {
      // ignore
    }
    resetTimer();
  }, [resetTimer]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = StorageService.loadInitialData();
      if (stored.users?.length) setUsers(stored.users);
      if (stored.schedules?.length) setSchedules(stored.schedules);
      if (stored.teachers?.length) setTeachers(stored.teachers);
      if (stored.departments?.length) setDepartments(stored.departments);
      if (stored.courses?.length) setCourses(stored.courses);
      if (stored.subjects?.length) setSubjects(stored.subjects);
      if (stored.classes?.length) setClasses(stored.classes);
      if (stored.rooms?.length) setRooms(stored.rooms);
      if (stored.periods?.length) setPeriods(stored.periods);
      if (stored.availabilities?.length) setAvailabilities(stored.availabilities);
      if (stored.changeRequests?.length) setChangeRequests(stored.changeRequests);
      if (stored.auditLogs?.length) {
        setAuditLogs(stored.auditLogs.map(log => ({
          ...log,
          userName: log.userName?.replace('Carlos Silva', 'Borges Junior'),
          details: log.details?.replace('Carlos Silva', 'Borges Junior'),
        })));
      }
      if (stored.notifications?.length) setNotifications(stored.notifications);
      setCurrentUser(prev => prev.name === 'Carlos Silva' ? { ...prev, name: 'Borges Junior' } : prev);
    } catch (e) {
      console.warn('Could not load localStorage, using defaults', e);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveUsers(users);
  }, [users, dataLoaded]);

  // Sync state changes to storage
  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveSchedules(schedules);
  }, [schedules, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveTeachers(teachers);
  }, [teachers, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveAvailabilities(availabilities);
  }, [availabilities, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveChangeRequests(changeRequests);
  }, [changeRequests, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveAuditLogs(auditLogs);
  }, [auditLogs, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    StorageService.saveNotifications(notifications);
  }, [notifications, dataLoaded]);

  // Dynamic calculation of conflicts using the validation engine (RN01 - RN07)
  const conflicts = useMemo(() => {
    return ConflictService.validateAllSchedules(
      schedules,
      teachers,
      rooms,
      classes,
      subjects,
      availabilities
    );
  }, [schedules, teachers, rooms, classes, subjects, availabilities]);

  // Quick helper to log audit entry
  const logAudit = (action: AuditLogEntry['action'], entityType: string, entityId: string, details: string, prev?: any, next?: any) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      details,
      previousValues: prev,
      newValues: next,
    };
    setAuditLogs(prevLogs => [newLog, ...prevLogs]);
  };

  // Switch role helper
  const handleSwitchRole = (role: UserRole) => {
    const userForRole = users.find(u => u.role === role) || INITIAL_USERS.find(u => u.role === role) || {
      id: `usr-${role}`,
      name: `Utilizador ${role.toUpperCase()}`,
      email: `${role}@instituicao.edu`,
      role,
      departmentId: departments[0]?.id,
    };
    setCurrentUser(userForRole);

    // If teacher or student, set appropriate default views if current is restricted
    if (role === 'docente') {
      if (['departments', 'courses', 'audit_logs'].includes(currentTab)) {
        setCurrentTab('schedules');
      }
    } else if (role === 'estudante') {
      if (!['dashboard', 'schedules'].includes(currentTab)) {
        setCurrentTab('schedules');
      }
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = useCallback((user: User, rememberMe: boolean) => {
    setCurrentUser(user);
    handleSwitchRole(user.role);
    setIsAuthenticated(true);
    setIsLocked(false);
    try {
      sessionStorage.setItem('sghd_authenticated', 'true');
      sessionStorage.setItem('sghd_logged_user_id', user.id);
      if (rememberMe) {
        localStorage.setItem('sghd_authenticated', 'true');
        localStorage.setItem('sghd_logged_user_id', user.id);
      }
      localStorage.removeItem('sghd_session_locked');
    } catch {
      // ignore
    }
    resetTimer();
    logAudit('LOGIN' as any, 'Autenticação', user.id, `Utilizador ${user.name} (${user.roleTitle}) iniciou sessão com validação de credenciais.`);
  }, [resetTimer]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setIsLocked(false);
    try {
      sessionStorage.removeItem('sghd_authenticated');
      sessionStorage.removeItem('sghd_logged_user_id');
      localStorage.removeItem('sghd_authenticated');
      localStorage.removeItem('sghd_logged_user_id');
      localStorage.removeItem('sghd_session_locked');
    } catch {
      // ignore
    }
    logAudit('LOGOUT' as any, 'Autenticação', currentUser.id, `Utilizador ${currentUser.name} terminou sessão no sistema.`);
  }, [currentUser]);

  // Schedule CRUD
  const handleSaveSchedule = (scheduleData: Partial<ScheduleItem>) => {
    let updatedSchedules: ScheduleItem[];
    const isEdit = !!scheduleData.id;
    let oldItem: ScheduleItem | undefined;

    if (isEdit) {
      oldItem = schedules.find(s => s.id === scheduleData.id);
      updatedSchedules = schedules.map(s => 
        s.id === scheduleData.id ? { ...s, ...scheduleData, updatedAt: new Date().toISOString() } as ScheduleItem : s
      );
      logAudit('UPDATE', 'Horário', scheduleData.id!, `Aula atualizada para ${scheduleData.dayOfWeek} às ${scheduleData.startTime}`, oldItem, scheduleData);
    } else {
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: scheduleData.subjectId!,
        teacherId: scheduleData.teacherId!,
        classId: scheduleData.classId!,
        roomId: scheduleData.roomId!,
        academicPeriodId: scheduleData.academicPeriodId || scheduleData.periodId || periods[0]?.id || 'period-2026-1',
        periodId: scheduleData.academicPeriodId || scheduleData.periodId || periods[0]?.id || 'period-2026-1',
        dayOfWeek: scheduleData.dayOfWeek!,
        startTime: scheduleData.startTime!,
        endTime: scheduleData.endTime!,
        lessonType: scheduleData.lessonType || 'Teórica',
        status: scheduleData.status || 'Rascunho',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedSchedules = [...schedules, newItem];
      logAudit('CREATE', 'Horário', newItem.id, `Nova aula agendada em ${newItem.dayOfWeek} ${newItem.startTime}-${newItem.endTime}`);
    }

    setSchedules(updatedSchedules);

    // If there was an in-app notification to create
    const targetTeacherId = scheduleData.teacherId || oldItem?.teacherId;
    const teacher = teachers.find(t => t.id === targetTeacherId);
    if (teacher) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: currentUser.id,
        title: isEdit ? 'Horário Atualizado' : 'Nova Aula Atribuída',
        message: `Aula em ${scheduleData.dayOfWeek} às ${scheduleData.startTime} foi ${isEdit ? 'atualizada' : 'adicionada'}.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    }

    // DISPATCH SIMULATED EMAIL NOTIFICATION TO TEACHER(S)
    try {
      if (isEdit && oldItem) {
        const savedItem = updatedSchedules.find(s => s.id === scheduleData.id);
        if (savedItem) {
          // Check if the assigned teacher was changed
          if (oldItem.teacherId !== savedItem.teacherId) {
            // 1. Notify previous teacher of unassignment
            const previousTeacher = teachers.find(t => t.id === oldItem!.teacherId);
            if (previousTeacher) {
              sendScheduleEmailNotification({
                type: 'REMOVED_LESSON',
                teacher: previousTeacher,
                schedule: oldItem,
                subjects,
                classes,
                rooms,
                periods,
                currentUser,
                additionalNote: 'A aula foi transferida para outro docente na distribuição letiva.',
              });
            }

            // 2. Notify new teacher of new lesson assignment
            const newTeacher = teachers.find(t => t.id === savedItem.teacherId);
            if (newTeacher) {
              sendScheduleEmailNotification({
                type: 'NEW_LESSON',
                teacher: newTeacher,
                schedule: savedItem,
                subjects,
                classes,
                rooms,
                periods,
                currentUser,
                additionalNote: 'Aula atribuída à sua grade horária na Universidade Tobas.',
              });
            }
          } else {
            // Same teacher: notify about updated time/day/room/type
            const assignedTeacher = teachers.find(t => t.id === savedItem.teacherId);
            if (assignedTeacher) {
              sendScheduleEmailNotification({
                type: 'UPDATED_LESSON',
                teacher: assignedTeacher,
                schedule: savedItem,
                oldSchedule: oldItem,
                subjects,
                classes,
                rooms,
                periods,
                currentUser,
                additionalNote: (scheduleData as any).notes,
              });
            }
          }
        }
      } else {
        // New lesson created and assigned
        const createdItem = updatedSchedules[updatedSchedules.length - 1];
        const assignedTeacher = teachers.find(t => t.id === scheduleData.teacherId);
        if (assignedTeacher && createdItem) {
          sendScheduleEmailNotification({
            type: 'NEW_LESSON',
            teacher: assignedTeacher,
            schedule: createdItem,
            subjects,
            classes,
            rooms,
            periods,
            currentUser,
            additionalNote: (scheduleData as any).notes,
          });
        }
      }
    } catch (emailErr) {
      console.error('Erro ao enviar notificação de e-mail simulada:', emailErr);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    const item = schedules.find(s => s.id === id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    logAudit('DELETE', 'Horário', id, `Aula removida da grade oficial`, item, undefined);

    // Notify teacher by simulated email about removed/canceled class
    if (item) {
      const teacher = teachers.find(t => t.id === item.teacherId);
      if (teacher) {
        try {
          sendScheduleEmailNotification({
            type: 'REMOVED_LESSON',
            teacher,
            schedule: item,
            subjects,
            classes,
            rooms,
            periods,
            currentUser,
            additionalNote: 'A aula foi removida da grade horária oficial pelo coordenador/administrador.',
          });
        } catch (emailErr) {
          console.error('Erro ao enviar notificação de remoção de aula:', emailErr);
        }
      }
    }
  };

  const handleBulkUpdateStatus = (targetStatus: ScheduleStatus, ids?: string[]) => {
    setSchedules(prev => 
      prev.map(s => {
        if (ids && !ids.includes(s.id)) return s;
        return { ...s, status: targetStatus, updatedAt: new Date().toISOString() };
      })
    );
    logAudit('PUBLISH', 'Horário', 'bulk', `Horário oficial publicado para o estado: ${targetStatus}`);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Horário Oficial Publicado',
      message: `A grade horária foi publicada oficialmente para consulta de docentes e estudantes.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleApplyGeneratedSchedules = (newItems: ScheduleItem[]) => {
    setSchedules(newItems);
    logAudit('AUTO_GENERATE', 'Horário', 'auto-batch', `Grade de horários gerada com ${newItems.length} aulas pelo otimizador`);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Horário Automático Gerado',
      message: `O otimizador completou a alocação de ${newItems.length} aulas com respeito integral às disponibilidades.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Teacher CRUD with Automatic Credential Provisioning for Administrator Authority
  const handleSaveTeacher = (teacherData: Partial<Teacher>) => {
    if (teacherData.id) {
      setTeachers(prev => prev.map(t => t.id === teacherData.id ? { ...t, ...teacherData } as Teacher : t));
      
      // Update linked user account details if email or name changed
      setUsers(prev => prev.map(u => {
        if (u.teacherId === teacherData.id || (teacherData.userId && u.id === teacherData.userId)) {
          return {
            ...u,
            name: teacherData.name || u.name,
            email: teacherData.email || u.email,
            roleTitle: teacherData.category || u.roleTitle,
          };
        }
        return u;
      }));

      logAudit('UPDATE', 'Docente', teacherData.id, `Docente ${teacherData.name} atualizado`);
      const existing = teachers.find(t => t.id === teacherData.id);
      return { teacher: { ...existing, ...teacherData } as Teacher };
    } else {
      const newTeacherId = `tch-${Date.now()}`;
      const newUserId = `usr-doc-${Date.now()}`;

      // Generate random secure password (e.g. Doc#4mK8x9)
      const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
      let randomCode = '';
      for (let i = 0; i < 6; i++) {
        randomCode += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      const generatedPassword = `Doc#${randomCode}`;

      const newUser: User = {
        id: newUserId,
        name: teacherData.name || 'Novo Docente',
        email: teacherData.email || `docente.${Date.now()}@instituicao.edu`,
        role: 'docente',
        roleTitle: teacherData.category || 'Professor Auxiliar',
        status: 'Ativo',
        password: generatedPassword,
        teacherId: newTeacherId,
      };

      const newT: Teacher = {
        ...teacherData,
        id: newTeacherId,
        userId: newUserId,
      } as Teacher;

      setUsers(prev => {
        const updatedUsers = [...prev, newUser];
        StorageService.saveUsers(updatedUsers);
        return updatedUsers;
      });

      setTeachers(prev => {
        const updatedTeachers = [...prev, newT];
        StorageService.saveTeachers(updatedTeachers);
        return updatedTeachers;
      });

      logAudit(
        'CREATE', 
        'Docente', 
        newTeacherId, 
        `Novo docente (${newT.name}) cadastrado com conta e credenciais geradas automaticamente pelo Administrador.`
      );

      return { teacher: newT, user: newUser, generatedPassword };
    }
  };

  // Administrator Authority: Reset teacher login password
  const handleResetTeacherPassword = (teacherId: string): string | null => {
    if (currentUser.role !== 'admin') return null;

    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    let randomCode = '';
    for (let i = 0; i < 6; i++) {
      randomCode += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    const newPassword = `Doc#${randomCode}`;

    setUsers(prev => {
      let matched = false;
      const updated = prev.map(u => {
        if (u.teacherId === teacherId) {
          matched = true;
          return { ...u, password: newPassword };
        }
        return u;
      });

      // If user account wasn't registered yet, provision it now
      if (!matched) {
        const tch = teachers.find(t => t.id === teacherId);
        if (tch) {
          const createdUser: User = {
            id: tch.userId || `usr-doc-${teacherId}`,
            name: tch.name,
            email: tch.email,
            role: 'docente',
            roleTitle: tch.category || 'Docente',
            status: 'Ativo',
            password: newPassword,
            teacherId: tch.id,
          };
          updated.push(createdUser);
        }
      }
      StorageService.saveUsers(updated);
      return updated;
    });

    const teacher = teachers.find(t => t.id === teacherId);
    logAudit(
      'UPDATE', 
      'Credenciais', 
      teacherId, 
      `Palavra-passe de acesso do docente ${teacher?.name || teacherId} redefinida pelo Administrador.`
    );
    return newPassword;
  };

  const handleDeleteTeacher = (id: string, options?: { deleteSchedules?: boolean; deleteUserAccount?: boolean }) => {
    const t = teachers.find(item => item.id === id);
    setTeachers(prev => prev.filter(item => item.id !== id));
    setAvailabilities(prev => prev.filter(a => a.teacherId !== id));

    if (options?.deleteSchedules) {
      setSchedules(prev => prev.filter(s => s.teacherId !== id));
    }

    if (options?.deleteUserAccount) {
      setUsers(prev => {
        const filtered = prev.filter(u => u.teacherId !== id && u.id !== t?.userId);
        StorageService.saveUsers(filtered);
        return filtered;
      });
    }

    logAudit(
      'DELETE', 
      'Docente', 
      id, 
      `Docente ${t?.name || id} eliminado do sistema${options?.deleteSchedules ? ' com os respetivos horários' : ''}${options?.deleteUserAccount ? ' e conta de utilizador associada' : ''}.`
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Docente Eliminado',
      message: `O docente ${t?.name || ''} foi removido com sucesso.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Delete Change Request
  const handleDeleteChangeRequest = (requestId: string) => {
    const req = changeRequests.find(r => r.id === requestId);
    setChangeRequests(prev => prev.filter(r => r.id !== requestId));
    logAudit('DELETE', 'SolicitacaoAlteracao', requestId, `Solicitação de alteração #${requestId} (${req?.teacherName || 'Docente'} - ${req?.subjectName || ''}) eliminada por ${currentUser.name}`);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Solicitação Eliminada',
      message: 'A solicitação de alteração de horário foi removida do sistema.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Teacher Availability
  const handleSaveAvailabilities = (teacherId: string, updated: TeacherAvailability[]) => {
    const remaining = availabilities.filter(a => a.teacherId !== teacherId);
    setAvailabilities([...remaining, ...updated]);
    const teacher = teachers.find(t => t.id === teacherId);
    logAudit('UPDATE', 'Disponibilidade', teacherId, `Disponibilidade semanal de ${teacher?.name} atualizada`);
  };

  // Change Requests
  const handleCreateChangeRequest = (reqData: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: ChangeRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    };
    setChangeRequests(prev => [newReq, ...prev]);
    logAudit('CREATE', 'Solicitação', newReq.id, `Nova solicitação de alteração enviada por ${newReq.requestedByName}`);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Nova Solicitação de Ajuste',
      message: `${newReq.requestedByName} solicitou alteração na aula de ${newReq.currentScheduleInfo.subjectName}.`,
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleApproveChangeRequest = (requestId: string, comment?: string) => {
    const req = changeRequests.find(r => r.id === requestId);
    if (!req) return;

    // Apply change to schedule
    setSchedules(prev => 
      prev.map(s => {
        if (s.id === req.scheduleId) {
          return {
            ...s,
            dayOfWeek: req.newDayOfWeek,
            startTime: req.newStartTime,
            endTime: req.newEndTime,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // Update request status
    setChangeRequests(prev => 
      prev.map(r => r.id === requestId ? {
        ...r,
        status: 'Aprovada',
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString(),
        reviewComment: comment,
      } : r)
    );

    logAudit('UPDATE', 'Solicitação', requestId, `Solicitação aprovada por ${currentUser.name}: ${req.currentScheduleInfo.subjectName} movida para ${req.newDayOfWeek} ${req.newStartTime}`);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: req.requestedByUserId,
      title: 'Solicitação de Horário Aprovada',
      message: `O seu pedido de alteração de horário foi aprovado e inserido na grade oficial.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);

    // Send official simulated approval email to teacher
    try {
      const targetSchedule = schedules.find(s => s.id === req.scheduleId);
      const teacher = teachers.find(t => t.id === req.teacherId);
      if (teacher && targetSchedule) {
        const updatedScheduleItem: ScheduleItem = {
          ...targetSchedule,
          dayOfWeek: req.newDayOfWeek,
          startTime: req.newStartTime,
          endTime: req.newEndTime,
          updatedAt: new Date().toISOString(),
        };
        sendScheduleEmailNotification({
          type: 'REQUEST_APPROVED',
          teacher,
          schedule: updatedScheduleItem,
          oldSchedule: targetSchedule,
          subjects,
          classes,
          rooms,
          periods,
          currentUser,
          customReason: req.reason,
          additionalNote: comment ? `Parecer da Coordenação: ${comment}` : undefined,
        });
      }
    } catch (err) {
      console.error('Erro ao enviar e-mail de aprovação de solicitação:', err);
    }
  };

  const handleRejectChangeRequest = (requestId: string, comment?: string) => {
    setChangeRequests(prev => 
      prev.map(r => r.id === requestId ? {
        ...r,
        status: 'Rejeitada',
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString(),
        reviewComment: comment,
      } : r)
    );
    logAudit('UPDATE', 'Solicitação', requestId, `Solicitação rejeitada por ${currentUser.name}`);
  };

  // Simulate test conflict for demonstration of RN01-RN07 detection
  const handleInjectTestConflict = () => {
    // Duplicate teacher into two simultaneous slots: João Manuel on Segunda 08:00
    const conflictItem: ScheduleItem = {
      id: `sch-conflict-${Date.now()}`,
      subjectId: subjects[2]?.id || 'sub-003',
      teacherId: 'tch-001', // João Manuel
      classId: 'cls-002', // INF-B
      roomId: 'rm-003', // Lab 1
      academicPeriodId: periods[0]?.id || 'period-2026-1',
      periodId: periods[0]?.id || 'period-2026-1',
      dayOfWeek: 'Segunda',
      startTime: '08:00',
      endTime: '10:00',
      lessonType: 'Prática',
      status: 'Em validação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSchedules(prev => [...prev, conflictItem]);
    setCurrentTab('conflicts');
  };

  // Reset database back to factory demo seed
  const handleResetData = () => {
    if (confirm('Tem certeza de que deseja restaurar os dados de demonstração iniciais? Todas as edições manuais serão redefinidas.')) {
      StorageService.resetToDefaults();
      setSchedules(INITIAL_SCHEDULES);
      setTeachers(INITIAL_TEACHERS);
      setDepartments(INITIAL_DEPARTMENTS);
      setCourses(INITIAL_COURSES);
      setSubjects(INITIAL_SUBJECTS);
      setClasses(INITIAL_CLASSES);
      setRooms(INITIAL_ROOMS);
      setPeriods(INITIAL_PERIODS);
      setAvailabilities(INITIAL_AVAILABILITIES);
      setChangeRequests(INITIAL_CHANGE_REQUESTS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  };

  // Restore complete state from imported JSON backup
  const handleRestoreState = (restoredData: any) => {
    if (!restoredData) return;
    if (Array.isArray(restoredData.users)) setUsers(restoredData.users);
    if (Array.isArray(restoredData.teachers)) setTeachers(restoredData.teachers);
    if (Array.isArray(restoredData.departments)) setDepartments(restoredData.departments);
    if (Array.isArray(restoredData.courses)) setCourses(restoredData.courses);
    if (Array.isArray(restoredData.subjects)) setSubjects(restoredData.subjects);
    if (Array.isArray(restoredData.classes)) setClasses(restoredData.classes);
    if (Array.isArray(restoredData.rooms)) setRooms(restoredData.rooms);
    if (Array.isArray(restoredData.periods)) setPeriods(restoredData.periods);
    if (Array.isArray(restoredData.availabilities)) setAvailabilities(restoredData.availabilities);
    if (Array.isArray(restoredData.schedules)) setSchedules(restoredData.schedules);
    if (Array.isArray(restoredData.changeRequests)) setChangeRequests(restoredData.changeRequests);
    if (Array.isArray(restoredData.auditLogs)) setAuditLogs(restoredData.auditLogs);
    if (Array.isArray(restoredData.notifications)) setNotifications(restoredData.notifications);
    if (restoredData.currentUser) setCurrentUser(restoredData.currentUser);
  };

  // Notification read
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const pendingRequestsCount = changeRequests.filter(r => r.status === 'Pendente').length;

  // Access Gate: Require authentication screen upon entering the system
  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        defaultUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      
      {/* Top Navigation Bar with Role Switcher & Notifications */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSelectUser={u => setCurrentUser(u)}
        onSwitchRole={handleSwitchRole}
        conflicts={conflicts}
        activeConflictsCount={conflicts.length}
        pendingRequestsCount={pendingRequestsCount}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationAsRead}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsRead={handleClearNotifications}
        onClearNotifications={handleClearNotifications}
        onNavigateToConflicts={() => setCurrentTab('conflicts')}
        onNavigate={tab => setCurrentTab(tab as any)}
        onResetData={handleResetData}
        onLockSession={handleLockSession}
        onLogout={handleLogout}
        onOpenSimulatedEmails={() => {
          setPreviewSimulatedEmail(null);
          setSimulatedEmailsModalOpen(true);
        }}
        simulatedEmailsCount={simulatedEmailsCount}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Workspace with Sidebar and Content View */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 pb-24 lg:pb-8">
        
        {/* Left Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          userRole={currentUser.role}
          conflictCount={conflicts.length}
          conflictsCount={conflicts.length}
          pendingRequestsCount={pendingRequestsCount}
          onResetData={handleResetData}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Views */}
        <main className="flex-1 min-w-0">
          
          {/* DASHBOARD VIEW */}
          {currentTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              userRole={currentUser.role}
              currentTeacherId={currentUser.teacherId}
              currentClassId={currentUser.classId}
              schedules={schedules}
              teachers={teachers}
              subjects={subjects}
              classes={classes}
              rooms={rooms}
              conflicts={conflicts}
              changeRequests={changeRequests}
              periods={periods}
              onNavigate={tab => setCurrentTab(tab as any)}
              onOpenAddSchedule={() => {
                setGlobalEditingSchedule(null);
                setGlobalScheduleModalOpen(true);
              }}
              onOpenAutoScheduler={() => setGlobalAutoModalOpen(true)}
              onPublishSchedule={() => handleBulkUpdateStatus('Publicado')}
              onOpenEmails={() => {
                setPreviewSimulatedEmail(null);
                setSimulatedEmailsModalOpen(true);
              }}
              onExportPdfSuccess={() => {
                logAudit('EXPORT', 'Relatório', 'dashboard-pdf', 'Relatório executivo do dashboard em PDF exportado pelo Gestor Académico');
                const notif: NotificationItem = {
                  id: `notif-${Date.now()}`,
                  userId: currentUser.id,
                  title: 'Relatório PDF Exportado',
                  message: 'O relatório consolidado do dashboard em formato PDF foi gerado e descarregado com sucesso.',
                  type: 'success',
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                setNotifications(prev => [notif, ...prev]);
              }}
            />
          )}

          {/* SCHEDULES VIEW (Interactive Weekly Timetable + List) */}
          {currentTab === 'schedules' && (
            <SchedulesView
              schedules={schedules}
              teachers={teachers}
              subjects={subjects}
              classes={classes}
              rooms={rooms}
              periods={periods}
              conflicts={conflicts}
              userRole={currentUser.role}
              currentUserId={currentUser.id}
              currentTeacherId={currentUser.teacherId}
              currentClassId={currentUser.classId}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onApplyGeneratedSchedules={handleApplyGeneratedSchedules}
              availabilities={availabilities}
              onRequestChange={item => {
                setCurrentTab('change_requests');
              }}
            />
          )}

          {/* CONFLICTS DETECTION ENGINE VIEW (RN01 - RN07) */}
          {currentTab === 'conflicts' && (
            <ConflictsView
              conflicts={conflicts}
              schedules={schedules}
              teachers={teachers}
              rooms={rooms}
              classes={classes}
              subjects={subjects}
              onResolveByDeleting={handleDeleteSchedule}
              onSelectScheduleForEdit={item => {
                setGlobalEditingSchedule(item);
                setGlobalScheduleModalOpen(true);
              }}
              onInjectTestConflict={handleInjectTestConflict}
            />
          )}

          {/* TEACHER AVAILABILITY VIEW (PDF Section 13) */}
          {currentTab === 'availability' && (
            <AvailabilityView
              teachers={teachers}
              availabilities={availabilities}
              currentTeacherId={currentUser.teacherId}
              userRole={currentUser.role}
              onSaveAvailabilities={handleSaveAvailabilities}
            />
          )}

          {/* TEACHERS MANAGEMENT VIEW (PDF Section 5) */}
          {currentTab === 'teachers' && (
            <TeachersView
              teachers={teachers}
              departments={departments}
              schedules={schedules}
              userRole={currentUser.role}
              users={users}
              currentUserId={currentUser.id}
              currentTeacherId={currentUser.teacherId}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onResetTeacherPassword={handleResetTeacherPassword}
            />
          )}

          {/* ACADEMIC STRUCTURE VIEWS (Sections 6 to 11) */}
          {['departments', 'courses', 'subjects', 'classes', 'rooms', 'periods'].includes(currentTab) && (
            <AcademicDataView
              activeTab={currentTab as any}
              departments={departments}
              courses={courses}
              subjects={subjects}
              classes={classes}
              rooms={rooms}
              periods={periods}
              userRole={currentUser.role}
              onSaveDepartment={d => {
                if (d.id) setDepartments(prev => prev.map(item => item.id === d.id ? { ...item, ...d } as Department : item));
                else setDepartments(prev => [...prev, { ...d, id: `dep-${Date.now()}` } as Department]);
              }}
              onDeleteDepartment={id => setDepartments(prev => prev.filter(d => d.id !== id))}
              onSaveCourse={c => {
                if (c.id) setCourses(prev => prev.map(item => item.id === c.id ? { ...item, ...c } as Course : item));
                else setCourses(prev => [...prev, { ...c, id: `crs-${Date.now()}` } as Course]);
              }}
              onDeleteCourse={id => setCourses(prev => prev.filter(c => c.id !== id))}
              onSaveSubject={s => {
                if (s.id) setSubjects(prev => prev.map(item => item.id === s.id ? { ...item, ...s } as Subject : item));
                else setSubjects(prev => [...prev, { ...s, id: `sub-${Date.now()}` } as Subject]);
              }}
              onDeleteSubject={id => setSubjects(prev => prev.filter(s => s.id !== id))}
              onSaveClass={c => {
                if (c.id) setClasses(prev => prev.map(item => item.id === c.id ? { ...item, ...c } as ClassGroup : item));
                else setClasses(prev => [...prev, { ...c, id: `cls-${Date.now()}` } as ClassGroup]);
              }}
              onDeleteClass={id => setClasses(prev => prev.filter(c => c.id !== id))}
              onSaveRoom={r => {
                if (r.id) setRooms(prev => prev.map(item => item.id === r.id ? { ...item, ...r } as Room : item));
                else setRooms(prev => [...prev, { ...r, id: `rm-${Date.now()}` } as Room]);
              }}
              onDeleteRoom={id => setRooms(prev => prev.filter(r => r.id !== id))}
              onSavePeriod={p => {
                if (p.id) setPeriods(prev => prev.map(item => item.id === p.id ? { ...item, ...p } as AcademicPeriod : item));
                else setPeriods(prev => [...prev, { ...p, id: `per-${Date.now()}` } as AcademicPeriod]);
              }}
              onSwitchTab={tab => setCurrentTab(tab as any)}
            />
          )}

          {/* CHANGE REQUESTS VIEW (PDF Sections 20-22) */}
          {currentTab === 'change_requests' && (
            <ChangeRequestsView
              changeRequests={changeRequests}
              schedules={schedules}
              teachers={teachers}
              subjects={subjects}
              classes={classes}
              rooms={rooms}
              userRole={currentUser.role}
              currentUserId={currentUser.id}
              currentTeacherId={currentUser.teacherId}
              onApproveRequest={handleApproveChangeRequest}
              onRejectRequest={handleRejectChangeRequest}
              onCreateRequest={handleCreateChangeRequest}
              onDeleteRequest={handleDeleteChangeRequest}
            />
          )}

          {/* AUDIT LOGS VIEW (PDF Section 20 & 33) */}
          {(currentTab === 'audit_logs' || currentTab === 'audit') && (
            <AuditLogsView 
              logs={auditLogs}
              userRole={currentUser.role}
              onDeleteLog={id => {
                setAuditLogs(prev => prev.filter(l => l.id !== id));
                const notif: NotificationItem = {
                  id: `notif-${Date.now()}`,
                  userId: currentUser.id,
                  title: 'Registo de Atividade Removido',
                  message: 'O item selecionado da auditoria foi eliminado.',
                  type: 'info',
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                setNotifications(prev => [notif, ...prev]);
              }}
              onClearLogs={() => {
                setAuditLogs([]);
                const notif: NotificationItem = {
                  id: `notif-${Date.now()}`,
                  userId: currentUser.id,
                  title: 'Histórico de Atividades Limpo',
                  message: 'Todos os registos de auditoria foram removidos.',
                  type: 'info',
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                setNotifications(prev => [notif, ...prev]);
              }}
            />
          )}

          {/* REPORTS & OCCUPANCY VIEW (PDF Section 23-24) */}
          {currentTab === 'reports' && (
            <ReportsView
              teachers={teachers}
              rooms={rooms}
              schedules={schedules}
              subjects={subjects}
              classes={classes}
              departments={departments}
              currentUser={currentUser}
              conflicts={conflicts}
              changeRequests={changeRequests}
              periods={periods}
              onExportSuccess={() => {
                logAudit('EXPORT', 'Relatório', 'dashboard-pdf', 'Relatório executivo do dashboard em PDF exportado via módulo de relatórios');
                const notif: NotificationItem = {
                  id: `notif-${Date.now()}`,
                  userId: currentUser.id,
                  title: 'Relatório PDF Exportado',
                  message: 'O relatório consolidado em PDF foi gerado e descarregado.',
                  type: 'success',
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                setNotifications(prev => [notif, ...prev]);
              }}
            />
          )}

          {/* ADMIN VIEW (LocalStorage Export & Restore) */}
          {currentTab === 'admin_panel' && (
            <AdminView
              currentUser={currentUser}
              users={users}
              teachers={teachers}
              departments={departments}
              courses={courses}
              subjects={subjects}
              classes={classes}
              rooms={rooms}
              periods={periods}
              availabilities={availabilities}
              schedules={schedules}
              changeRequests={changeRequests}
              auditLogs={auditLogs}
              notifications={notifications}
              onRestoreState={handleRestoreState}
              onResetToDefaults={handleResetData}
              onLogAudit={(action, entity, entityId, details) => {
                logAudit(action as any, entity, entityId, details);
              }}
              onNotify={(title, message, type) => {
                const notif: NotificationItem = {
                  id: `notif-${Date.now()}`,
                  userId: currentUser.id,
                  title,
                  message,
                  type,
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                setNotifications(prev => [notif, ...prev]);
              }}
            />
          )}

        </main>
      </div>

      {/* Global Modals */}
      <ScheduleModal
        isOpen={globalScheduleModalOpen}
        onClose={() => {
          setGlobalScheduleModalOpen(false);
          setGlobalEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        editingSchedule={globalEditingSchedule}
        teachers={teachers}
        subjects={subjects}
        classes={classes}
        rooms={rooms}
        periods={periods}
        existingSchedules={schedules}
        availabilities={availabilities}
      />

      <AutoGenerateModal
        isOpen={globalAutoModalOpen}
        onClose={() => setGlobalAutoModalOpen(false)}
        onApplyGenerated={handleApplyGeneratedSchedules}
        subjects={subjects}
        teachers={teachers}
        classes={classes}
        rooms={rooms}
        availabilities={availabilities}
        existingSchedules={schedules}
        periodId={periods[0]?.id || ''}
      />

      {/* 30-Minute Inactivity Session Lock Screen */}
      {isLocked && (
        <LockScreen
          currentUser={currentUser}
          users={users}
          onUnlock={handleUnlockSession}
          onSwitchUser={(u) => {
            setCurrentUser(u);
            handleSwitchRole(u.role);
          }}
          onLogout={handleLogout}
          idleDurationMinutes={IDLE_TIMEOUT_MINUTES}
        />
      )}

      {/* Simulated Email Toast and Modal System */}
      <SimulatedEmailToast
        onOpenEmailPreview={(email) => {
          setPreviewSimulatedEmail(email);
          setSimulatedEmailsModalOpen(true);
        }}
      />

      <SimulatedEmailsModal
        isOpen={simulatedEmailsModalOpen}
        onClose={() => {
          setSimulatedEmailsModalOpen(false);
          setPreviewSimulatedEmail(null);
        }}
        initialEmail={previewSimulatedEmail}
        teacherFilterId={currentUser.role === 'docente' ? (currentUser.teacherId || teachers.find(t => t.userId === currentUser.id)?.id) : undefined}
      />

      {/* Mobile Bottom Navigation Bar (Phone Quick Access for Rooms, Teachers, Schedules, Dashboard & Menu) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        userRole={currentUser.role}
        conflictsCount={conflicts.length}
        pendingRequestsCount={pendingRequestsCount}
      />

    </div>
  );
}
