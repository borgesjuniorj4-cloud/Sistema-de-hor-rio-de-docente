import { 
  User, Teacher, Department, Course, Subject, ClassGroup, 
  Room, AcademicPeriod, TeacherAvailability, ScheduleItem, 
  ChangeRequest, NotificationItem, AuditLog 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_TEACHERS, 
  INITIAL_COURSES, INITIAL_SUBJECTS, INITIAL_CLASSES, 
  INITIAL_ROOMS, INITIAL_ACADEMIC_PERIODS, INITIAL_AVAILABILITIES, 
  INITIAL_SCHEDULES, INITIAL_CHANGE_REQUESTS, INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'sghd_users_v1',
  CURRENT_USER: 'sghd_current_user_v1',
  DEPARTMENTS: 'sghd_departments_v1',
  TEACHERS: 'sghd_teachers_v1',
  COURSES: 'sghd_courses_v1',
  SUBJECTS: 'sghd_subjects_v1',
  CLASSES: 'sghd_classes_v1',
  ROOMS: 'sghd_rooms_v1',
  PERIODS: 'sghd_periods_v1',
  AVAILABILITIES: 'sghd_availabilities_v1',
  SCHEDULES: 'sghd_schedules_v1',
  CHANGE_REQUESTS: 'sghd_change_requests_v1',
  NOTIFICATIONS: 'sghd_notifications_v1',
  AUDIT_LOGS: 'sghd_audit_logs_v1',
};

function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const parsed = JSON.parse(raw);
      if (parsed !== null && parsed !== undefined) {
        if (Array.isArray(fallback)) {
          return (Array.isArray(parsed) ? parsed : fallback) as T;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}:`, e);
  }
  return fallback;
}

function saveItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing localStorage for ${key}:`, e);
  }
}

export const StorageService = {
  getUsers(): User[] {
    const users = loadItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.map(u => {
      const defaultUser = INITIAL_USERS.find(iu => iu.id === u.id || iu.email === u.email);
      let updated = u.name === 'Carlos Silva' ? { ...u, name: 'Borges Junior' } : u;
      if (!updated.password && defaultUser?.password) {
        updated = { ...updated, password: defaultUser.password };
      }
      return updated;
    });
  },
  saveUsers(users: User[]) {
    saveItem(STORAGE_KEYS.USERS, users);
  },

  getCurrentUser(): User {
    const stored = loadItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) {
      const defaultUser = INITIAL_USERS.find(iu => iu.id === stored.id || iu.email === stored.email);
      let res = stored.name === 'Carlos Silva' ? { ...stored, name: 'Borges Junior' } : stored;
      if (!res.password && defaultUser?.password) {
        res = { ...res, password: defaultUser.password };
      }
      return res;
    }
    return INITIAL_USERS[0]; // Admin by default
  },
  setCurrentUser(user: User) {
    saveItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getDepartments(): Department[] {
    return loadItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },
  saveDepartments(deps: Department[]) {
    saveItem(STORAGE_KEYS.DEPARTMENTS, deps);
  },

  getTeachers(): Teacher[] {
    return loadItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  },
  saveTeachers(teachers: Teacher[]) {
    saveItem(STORAGE_KEYS.TEACHERS, teachers);
  },

  getCourses(): Course[] {
    return loadItem<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  },
  saveCourses(courses: Course[]) {
    saveItem(STORAGE_KEYS.COURSES, courses);
  },

  getSubjects(): Subject[] {
    return loadItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },
  saveSubjects(subs: Subject[]) {
    saveItem(STORAGE_KEYS.SUBJECTS, subs);
  },

  getClasses(): ClassGroup[] {
    return loadItem<ClassGroup[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClasses(classes: ClassGroup[]) {
    saveItem(STORAGE_KEYS.CLASSES, classes);
  },

  getRooms(): Room[] {
    return loadItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
  },
  saveRooms(rooms: Room[]) {
    saveItem(STORAGE_KEYS.ROOMS, rooms);
  },

  getPeriods(): AcademicPeriod[] {
    return loadItem<AcademicPeriod[]>(STORAGE_KEYS.PERIODS, INITIAL_ACADEMIC_PERIODS);
  },
  savePeriods(periods: AcademicPeriod[]) {
    saveItem(STORAGE_KEYS.PERIODS, periods);
  },

  getAvailabilities(): TeacherAvailability[] {
    return loadItem<TeacherAvailability[]>(STORAGE_KEYS.AVAILABILITIES, INITIAL_AVAILABILITIES);
  },
  saveAvailabilities(avail: TeacherAvailability[]) {
    saveItem(STORAGE_KEYS.AVAILABILITIES, avail);
  },

  getSchedules(): ScheduleItem[] {
    return loadItem<ScheduleItem[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  },
  saveSchedules(schedules: ScheduleItem[]) {
    saveItem(STORAGE_KEYS.SCHEDULES, schedules);
  },

  getChangeRequests(): ChangeRequest[] {
    return loadItem<ChangeRequest[]>(STORAGE_KEYS.CHANGE_REQUESTS, INITIAL_CHANGE_REQUESTS);
  },
  saveChangeRequests(reqs: ChangeRequest[]) {
    saveItem(STORAGE_KEYS.CHANGE_REQUESTS, reqs);
  },

  getNotifications(): NotificationItem[] {
    return loadItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifs: NotificationItem[]) {
    saveItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  getAuditLogs(): AuditLog[] {
    return loadItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  saveAuditLogs(logs: AuditLog[]) {
    saveItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  addAudit(
    currentUser: User,
    action: string,
    entity: string,
    entityId: string,
    oldData?: string,
    newData?: string
  ) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.name} (${currentUser.role})`,
      userRole: currentUser.roleTitle,
      action,
      entity,
      entityId,
      oldData: oldData || '---',
      newData: newData || '---',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    const updated = [newLog, ...logs];
    this.saveAuditLogs(updated);
    return updated;
  },

  addNotification(title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert' = 'info') {
    const notifs = this.getNotifications();
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...notifs];
    this.saveNotifications(updated);
    return updated;
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.PERIODS);
    localStorage.removeItem(STORAGE_KEYS.AVAILABILITIES);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.CHANGE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  },

  resetToDefaults() {
    this.resetAllData();
  },

  getStorageStatistics() {
    let totalKeys = 0;
    let sghdKeys = 0;
    let estimatedSizeBytes = 0;
    try {
      totalKeys = localStorage.length;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('sghd_')) sghdKeys++;
          const val = localStorage.getItem(key) || '';
          estimatedSizeBytes += (key.length + val.length) * 2;
        }
      }
    } catch (e) {
      console.warn('Error reading storage statistics:', e);
    }

    const currentData = this.loadInitialData();

    return {
      totalKeys,
      sghdKeys,
      estimatedSizeBytes,
      estimatedSizeKB: (estimatedSizeBytes / 1024).toFixed(2),
      counts: {
        users: currentData.users.length,
        teachers: currentData.teachers.length,
        departments: currentData.departments.length,
        courses: currentData.courses.length,
        subjects: currentData.subjects.length,
        classes: currentData.classes.length,
        rooms: currentData.rooms.length,
        periods: currentData.periods.length,
        availabilities: currentData.availabilities.length,
        schedules: currentData.schedules.length,
        changeRequests: currentData.changeRequests.length,
        notifications: currentData.notifications.length,
        auditLogs: currentData.auditLogs.length,
      },
    };
  },

  exportFullStorageBackup(currentUser?: User, downloadFile = true) {
    const rawLocalStorage: Record<string, string> = {};
    let totalKeys = 0;
    try {
      totalKeys = localStorage.length;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            rawLocalStorage[key] = val;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read full localStorage raw entries:', e);
    }

    const activeState = this.loadInitialData();

    const backupPayload = {
      metadata: {
        appName: 'Universidade Tobas - SGHD (Sistema de Gestão de Horários de Docentes)',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Administrador',
        totalStorageKeys: totalKeys,
        summary: {
          users: activeState.users.length,
          teachers: activeState.teachers.length,
          departments: activeState.departments.length,
          courses: activeState.courses.length,
          subjects: activeState.subjects.length,
          classes: activeState.classes.length,
          rooms: activeState.rooms.length,
          periods: activeState.periods.length,
          availabilities: activeState.availabilities.length,
          schedules: activeState.schedules.length,
          changeRequests: activeState.changeRequests.length,
          notifications: activeState.notifications.length,
          auditLogs: activeState.auditLogs.length,
        },
      },
      state: activeState,
      rawLocalStorage,
    };

    if (downloadFile && typeof window !== 'undefined') {
      try {
        const jsonString = JSON.stringify(backupPayload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        a.href = url;
        a.download = `universidade_tobas_sghd_backup_${nowStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error triggering file download:', err);
      }
    }

    return backupPayload;
  },

  importFullStorageBackup(backupJson: any): {
    success: boolean;
    message: string;
    restoredData?: ReturnType<typeof StorageService.loadInitialData>;
    counts?: Record<string, number>;
  } {
    if (!backupJson || typeof backupJson !== 'object') {
      return { success: false, message: 'Ficheiro JSON inválido ou vazio.' };
    }

    try {
      // 1. If rawLocalStorage is present, restore all raw keys
      if (backupJson.rawLocalStorage && typeof backupJson.rawLocalStorage === 'object') {
        const entries = Object.entries(backupJson.rawLocalStorage);
        for (const [key, val] of entries) {
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
          } else {
            localStorage.setItem(key, JSON.stringify(val));
          }
        }
      }

      // 2. Extract structured state either from backupJson.state or direct fields
      const stateObj = backupJson.state || backupJson;

      if (Array.isArray(stateObj.users)) this.saveUsers(stateObj.users);
      if (Array.isArray(stateObj.teachers)) this.saveTeachers(stateObj.teachers);
      if (Array.isArray(stateObj.departments)) this.saveDepartments(stateObj.departments);
      if (Array.isArray(stateObj.courses)) this.saveCourses(stateObj.courses);
      if (Array.isArray(stateObj.subjects)) this.saveSubjects(stateObj.subjects);
      if (Array.isArray(stateObj.classes)) this.saveClasses(stateObj.classes);
      if (Array.isArray(stateObj.rooms)) this.saveRooms(stateObj.rooms);
      if (Array.isArray(stateObj.periods)) this.savePeriods(stateObj.periods);
      if (Array.isArray(stateObj.availabilities)) this.saveAvailabilities(stateObj.availabilities);
      if (Array.isArray(stateObj.schedules)) this.saveSchedules(stateObj.schedules);
      if (Array.isArray(stateObj.changeRequests)) this.saveChangeRequests(stateObj.changeRequests);
      if (Array.isArray(stateObj.notifications)) this.saveNotifications(stateObj.notifications);
      if (Array.isArray(stateObj.auditLogs)) this.saveAuditLogs(stateObj.auditLogs);
      if (stateObj.currentUser && typeof stateObj.currentUser === 'object') {
        this.setCurrentUser(stateObj.currentUser);
      }

      // 3. Load fresh state to verify
      const freshData = this.loadInitialData();

      const counts = {
        users: freshData.users.length,
        teachers: freshData.teachers.length,
        departments: freshData.departments.length,
        courses: freshData.courses.length,
        subjects: freshData.subjects.length,
        classes: freshData.classes.length,
        rooms: freshData.rooms.length,
        periods: freshData.periods.length,
        availabilities: freshData.availabilities.length,
        schedules: freshData.schedules.length,
        changeRequests: freshData.changeRequests.length,
        notifications: freshData.notifications.length,
        auditLogs: freshData.auditLogs.length,
      };

      return {
        success: true,
        message: 'Estado do localStorage e dados do sistema restaurados com sucesso!',
        restoredData: freshData,
        counts,
      };
    } catch (err: any) {
      console.error('Error restoring backup into localStorage:', err);
      return {
        success: false,
        message: `Falha ao restaurar os dados do backup: ${err?.message || 'Erro desconhecido'}`,
      };
    }
  },

  loadInitialData() {
    return {
      users: this.getUsers(),
      currentUser: this.getCurrentUser(),
      departments: this.getDepartments(),
      teachers: this.getTeachers(),
      courses: this.getCourses(),
      subjects: this.getSubjects(),
      classes: this.getClasses(),
      rooms: this.getRooms(),
      periods: this.getPeriods(),
      availabilities: this.getAvailabilities(),
      schedules: this.getSchedules(),
      changeRequests: this.getChangeRequests(),
      notifications: this.getNotifications(),
      auditLogs: this.getAuditLogs(),
    };
  },
};
