import React, { useState } from 'react';
import { 
  Building2, GraduationCap, BookOpen, UserCheck, 
  School, Clock, Plus, Search, Edit3, Trash2, X, Check, CheckCircle2,
  Shield, Lock, Award, UserPlus, AlertCircle
} from 'lucide-react';
import { 
  Department, Course, Subject, ClassGroup, 
  Room, AcademicPeriod, UserRole, Teacher, User 
} from '../types';

interface AcademicDataViewProps {
  activeTab: 'departments' | 'courses' | 'subjects' | 'classes' | 'rooms' | 'periods';
  departments: Department[];
  courses: Course[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  periods: AcademicPeriod[];
  teachers?: Teacher[];
  users?: User[];
  userRole: UserRole;
  onSaveDepartment: (d: Partial<Department>) => void;
  onDeleteDepartment: (id: string) => void;
  onSaveCourse: (c: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
  onSaveSubject: (s: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  onSaveClass: (c: Partial<ClassGroup>) => void;
  onDeleteClass: (id: string) => void;
  onSaveRoom: (r: Partial<Room>) => void;
  onDeleteRoom: (id: string) => void;
  onSavePeriod: (p: Partial<AcademicPeriod>) => void;
  onSwitchTab?: (tab: 'departments' | 'courses' | 'subjects' | 'classes' | 'rooms' | 'periods') => void;
}

export const AcademicDataView: React.FC<AcademicDataViewProps> = ({
  activeTab,
  departments = [],
  courses = [],
  subjects = [],
  classes = [],
  rooms = [],
  periods = [],
  teachers = [],
  users = [],
  userRole,
  onSaveDepartment,
  onDeleteDepartment,
  onSaveCourse,
  onDeleteCourse,
  onSaveSubject,
  onDeleteSubject,
  onSaveClass,
  onDeleteClass,
  onSaveRoom,
  onDeleteRoom,
  onSavePeriod,
  onSwitchTab,
}) => {
  const canEdit = ['admin', 'gestor'].includes(userRole);
  const isAdmin = userRole === 'admin';
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Forms state
  const [deptForm, setDeptForm] = useState<Partial<Department>>({});
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({});
  const [classForm, setClassForm] = useState<Partial<ClassGroup>>({});
  const [roomForm, setRoomForm] = useState<Partial<Room>>({});
  const [periodForm, setPeriodForm] = useState<Partial<AcademicPeriod>>({});

  const titles = {
    departments: { title: 'Gestão de Departamentos', desc: 'Organização institucional de docentes e áreas de ensino (PDF Seção 6)', icon: Building2 },
    courses: { title: 'Gestão de Cursos', desc: 'Licenciaturas, Mestrados e Doutoramentos (PDF Seção 7)', icon: GraduationCap },
    subjects: { title: 'Gestão de Disciplinas', desc: 'Carga horária semanal, créditos e semestres letivos (PDF Seção 8)', icon: BookOpen },
    classes: { title: 'Gestão de Turmas', desc: 'Turmas, anos letivos, turnos e contagem de alunos (PDF Seção 9)', icon: UserCheck },
    rooms: { title: 'Gestão de Salas e Laboratórios', desc: 'Espaços físicos, capacidade e equipamentos para evitar sobreposições (PDF Seção 10)', icon: School },
    periods: { title: 'Gestão de Períodos Lectivos', desc: 'Calendários semestrais e datas de início/fim das aulas (PDF Seção 11)', icon: Clock },
  };

  const currentMeta = titles[activeTab] || titles.departments;
  const TabIcon = currentMeta.icon;

  // Open Handlers
  const handleOpenNew = () => {
    setEditingItem(null);
    if (activeTab === 'departments') {
      setDeptForm({ 
        code: `DEP-${departments.length + 1}`, 
        name: '', 
        description: '', 
        manager: '', 
        director: '', 
        directorEmail: '',
        status: 'Ativo' 
      });
    } else if (activeTab === 'courses') {
      setCourseForm({ 
        code: `CRS-${courses.length + 1}`, 
        name: '', 
        departmentId: departments[0]?.id || '', 
        degree: 'Licenciatura', 
        duration: '3 Anos', 
        semesterCount: 6, 
        coordinator: '', 
        coordinatorEmail: '',
        status: 'Ativo' 
      });
    } else if (activeTab === 'subjects') {
      setSubjectForm({ code: `DISC${subjects.length + 1}`, name: '', description: '', courseId: courses[0]?.id || '', departmentId: departments[0]?.id || '', credits: 6, weeklyHours: 4, semester: 1, type: 'Obrigatória', status: 'Ativo' });
    } else if (activeTab === 'classes') {
      setClassForm({ code: `TURMA-${classes.length + 1}`, name: '', courseId: courses[0]?.id || '', year: 1, semester: 1, shift: 'Manhã', studentCount: 30, status: 'Ativo' });
    } else if (activeTab === 'rooms') {
      setRoomForm({ code: `SALA-${rooms.length + 1}`, name: '', building: 'Edifício Central', floor: 'Piso 1', capacity: 35, type: 'Sala normal', equipment: ['Projetor', 'Ar condicionado'], status: 'Disponível' });
    } else if (activeTab === 'periods') {
      setPeriodForm({ academicYear: '2026', semester: '1.º Semestre', startDate: '2026-09-01', endDate: '2027-01-31', isCurrent: false, status: 'Ativo' });
    }
    setModalType(activeTab);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Quick Sub-Navigation Tabs (Crucial for Mobile Access) */}
      {onSwitchTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 scrollbar-none">
          {[
            { id: 'rooms', label: 'Salas e Labs', icon: School },
            { id: 'classes', label: 'Turmas', icon: UserCheck },
            { id: 'subjects', label: 'Disciplinas', icon: BookOpen },
            { id: 'courses', label: 'Cursos', icon: GraduationCap },
            { id: 'departments', label: 'Departamentos', icon: Building2 },
            { id: 'periods', label: 'Períodos', icon: Clock },
          ].map(tab => {
            const TabItemIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-switch-${tab.id}`}
                onClick={() => onSwitchTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[40px] shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <TabItemIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
              <TabIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentMeta.title}</h1>
              <p className="text-xs text-slate-500">{currentMeta.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full sm:w-64 text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {canEdit && (
              <button
                onClick={handleOpenNew}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RENDER TABLE DEPENDING ON TAB */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
        
        {/* DEPARTMENTS */}
        {activeTab === 'departments' && (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome do Departamento</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span>Diretor do Departamento</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Exclusivo Admin
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Estado</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments
                .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()))
                .map(dept => {
                  const currentDirector = dept.director || dept.manager;
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{dept.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{dept.name}</td>
                      <td className="py-3 px-4">
                        {currentDirector ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                              <Shield className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{currentDirector}</div>
                              <div className="text-[10px] text-purple-700 font-medium flex items-center gap-1">
                                <Award className="w-2.5 h-2.5" />
                                <span>{dept.appointedBy ? `Nomeado por ${dept.appointedBy}` : 'Nomeado pelo Administrador'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Pendente nomeação pelo Admin</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{dept.description}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dept.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingItem(dept); setDeptForm(dept); setModalType('departments'); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                              title="Editar Departamento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => onDeleteDepartment(dept.id)} 
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Eliminar Departamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome do Curso</th>
                <th className="py-3 px-4">Grau Académico</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span>Coordenador do Curso</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Exclusivo Admin
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4">Duração</th>
                <th className="py-3 px-4">Estado</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses
                .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                .map(course => {
                  const dept = departments.find(d => d.id === course.departmentId);
                  return (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{course.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{course.name}</td>
                      <td className="py-3 px-4 text-slate-700">{course.degree}</td>
                      <td className="py-3 px-4 text-slate-600">{dept?.name}</td>
                      <td className="py-3 px-4">
                        {course.coordinator ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                              <Award className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{course.coordinator}</div>
                              <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                                <span>{course.appointedBy ? `Nomeado por ${course.appointedBy}` : 'Nomeado pelo Administrador'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Pendente nomeação pelo Admin</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{course.duration} ({course.semesterCount} semestres)</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {course.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingItem(course); setCourseForm(course); setModalType('courses'); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                              title="Editar Curso"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => onDeleteCourse(course.id)} 
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Eliminar Curso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {/* SUBJECTS */}
        {activeTab === 'subjects' && (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Disciplina</th>
                <th className="py-3 px-4">Curso</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Carga Semanal</th>
                <th className="py-3 px-4">Créditos</th>
                <th className="py-3 px-4">Tipo</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects
                .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
                .map(subj => {
                  const course = courses.find(c => c.id === subj.courseId);
                  return (
                    <tr key={subj.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{subj.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{subj.name}</td>
                      <td className="py-3 px-4 text-slate-700">{course?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{subj.semester}º Semestre</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{subj.weeklyHours} horas</td>
                      <td className="py-3 px-4 text-slate-600">{subj.credits} ECTS</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {subj.type}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingItem(subj); setSubjectForm(subj); setModalType('subjects'); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeleteSubject(subj.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {/* CLASSES */}
        {activeTab === 'classes' && (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome da Turma</th>
                <th className="py-3 px-4">Curso</th>
                <th className="py-3 px-4">Ano / Semestre</th>
                <th className="py-3 px-4">Turno</th>
                <th className="py-3 px-4">N.º Estudantes</th>
                <th className="py-3 px-4">Estado</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes
                .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                .map(cls => {
                  const course = courses.find(c => c.id === cls.courseId);
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{cls.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{cls.name}</td>
                      <td className="py-3 px-4 text-slate-700">{course?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{cls.year}º Ano ({cls.semester}º Sem)</td>
                      <td className="py-3 px-4 text-slate-600">{cls.shift}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cls.studentCount} alunos</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cls.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingItem(cls); setClassForm(cls); setModalType('classes'); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeleteClass(cls.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {/* ROOMS */}
        {activeTab === 'rooms' && (
          <div>
            {/* Mobile Cards (Phones) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {rooms
                .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
                .map(room => (
                  <div key={room.id} className="p-4 space-y-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {room.code}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            {room.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">{room.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {room.building}, {room.floor}
                        </p>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {room.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Capacidade: {room.capacity} lugares
                      </span>

                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingItem(room); setRoomForm(room); setModalType('rooms'); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs flex items-center gap-1 font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => onDeleteRoom(room.id)} 
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {room.equipment && room.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {room.equipment.map((eq, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Desktop Table (Laptops & Desktops) */}
            <table className="hidden md:table w-full text-xs text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Sala</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Capacidade (RN05)</th>
                  <th className="py-3 px-4">Equipamentos</th>
                  <th className="py-3 px-4">Estado</th>
                  {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms
                  .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
                  .map(room => (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{room.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{room.name}</td>
                      <td className="py-3 px-4 text-slate-600">{room.building}, {room.floor}</td>
                      <td className="py-3 px-4 text-slate-700">{room.type}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{room.capacity} lugares</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {room.equipment.join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {room.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingItem(room); setRoomForm(room); setModalType('rooms'); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeleteRoom(room.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PERIODS */}
        {activeTab === 'periods' && (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Ano Lectivo</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Data Início</th>
                <th className="py-3 px-4">Data Fim</th>
                <th className="py-3 px-4">Período Atual</th>
                <th className="py-3 px-4">Estado</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map(period => (
                <tr key={period.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{period.academicYear}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{period.semester}</td>
                  <td className="py-3 px-4 text-slate-600">{period.startDate}</td>
                  <td className="py-3 px-4 text-slate-600">{period.endDate}</td>
                  <td className="py-3 px-4">
                    {period.isCurrent ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3 text-emerald-600" /> Período Vigente
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Não</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      {period.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { setEditingItem(period); setPeriodForm(period); setModalType('periods'); }}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* MODALS */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Editar Registo' : 'Cadastrar Novo Registo'}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (modalType === 'departments') onSaveDepartment({ ...deptForm, id: editingItem?.id });
                else if (modalType === 'courses') onSaveCourse({ ...courseForm, id: editingItem?.id });
                else if (modalType === 'subjects') onSaveSubject({ ...subjectForm, id: editingItem?.id });
                else if (modalType === 'classes') onSaveClass({ ...classForm, id: editingItem?.id });
                else if (modalType === 'rooms') onSaveRoom({ ...roomForm, id: editingItem?.id });
                else if (modalType === 'periods') onSavePeriod({ ...periodForm, id: editingItem?.id });
                setModalType(null);
              }}
              className="p-6 space-y-4 text-xs"
            >
              {modalType === 'departments' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Código</label>
                    <input type="text" required value={deptForm.code || ''} onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nome do Departamento</label>
                    <input type="text" required value={deptForm.name || ''} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full border rounded p-2" />
                  </div>

                  {/* Diretor do Departamento - EXCLUSIVO ADMIN */}
                  <div className={`p-3 rounded-xl border ${isAdmin ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>Diretor do Departamento</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Exclusivo Admin
                        </span>
                      </label>
                      {isAdmin && (
                        <span className="text-[10px] text-purple-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Permissão Admin Ativa</span>
                        </span>
                      )}
                    </div>

                    {isAdmin ? (
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Nome do Diretor:</label>
                          <input
                            type="text"
                            placeholder="ex.: Prof. Dr. Manuel Cardoso"
                            value={deptForm.director || deptForm.manager || ''}
                            onChange={e => setDeptForm({ ...deptForm, director: e.target.value, manager: e.target.value })}
                            className="w-full border rounded p-2 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">E-mail Institucional do Diretor:</label>
                          <input
                            type="email"
                            placeholder="ex.: diretor.inf@instituicao.edu"
                            value={deptForm.directorEmail || ''}
                            onChange={e => setDeptForm({ ...deptForm, directorEmail: e.target.value })}
                            className="w-full border rounded p-2 bg-white text-slate-900"
                          />
                        </div>
                        {teachers && teachers.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] text-slate-500">Ou nomear docente cadastrado:</span>
                            <select
                              className="w-full mt-1 border rounded p-1.5 text-xs bg-white text-slate-800"
                              onChange={e => {
                                const selected = teachers.find(t => t.id === e.target.value);
                                if (selected) {
                                  setDeptForm({
                                    ...deptForm,
                                    director: selected.name,
                                    manager: selected.name,
                                    directorEmail: selected.email,
                                    directorId: selected.userId || selected.id,
                                  });
                                }
                              }}
                            >
                              <option value="">-- Selecionar Docente da Instituição --</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.category} - {t.departmentId})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Acesso Restrito ao Administrador</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            Apenas o perfil <strong>Administrador</strong> tem permissão estatutária para nomear ou destituir o Diretor do Departamento.
                          </div>
                          <div className="mt-1.5 font-medium text-[11px] text-slate-700 bg-white/80 p-1.5 rounded border border-amber-100">
                            Diretor em funções: <strong>{deptForm.director || deptForm.manager || 'Nenhum diretor nomeado'}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Descrição</label>
                    <textarea value={deptForm.description || ''} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full border rounded p-2" rows={3} />
                  </div>
                </>
              )}

              {modalType === 'courses' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Código</label>
                    <input type="text" required value={courseForm.code || ''} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nome do Curso</label>
                    <input type="text" required value={courseForm.name || ''} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Departamento</label>
                    <select value={courseForm.departmentId} onChange={e => setCourseForm({ ...courseForm, departmentId: e.target.value })} className="w-full border rounded p-2">
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  {/* Coordenador do Curso - EXCLUSIVO ADMIN */}
                  <div className={`p-3 rounded-xl border ${isAdmin ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        <span>Coordenador do Curso</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Exclusivo Admin
                        </span>
                      </label>
                      {isAdmin && (
                        <span className="text-[10px] text-purple-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Permissão Admin Ativa</span>
                        </span>
                      )}
                    </div>

                    {isAdmin ? (
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Nome do Coordenador:</label>
                          <input
                            type="text"
                            placeholder="ex.: Prof. Dr. Fernando Ramos"
                            value={courseForm.coordinator || ''}
                            onChange={e => setCourseForm({ ...courseForm, coordinator: e.target.value })}
                            className="w-full border rounded p-2 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">E-mail Institucional do Coordenador:</label>
                          <input
                            type="email"
                            placeholder="ex.: coordenador.inf@instituicao.edu"
                            value={courseForm.coordinatorEmail || ''}
                            onChange={e => setCourseForm({ ...courseForm, coordinatorEmail: e.target.value })}
                            className="w-full border rounded p-2 bg-white text-slate-900"
                          />
                        </div>
                        {teachers && teachers.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] text-slate-500">Ou nomear docente cadastrado:</span>
                            <select
                              className="w-full mt-1 border rounded p-1.5 text-xs bg-white text-slate-800"
                              onChange={e => {
                                const selected = teachers.find(t => t.id === e.target.value);
                                if (selected) {
                                  setCourseForm({
                                    ...courseForm,
                                    coordinator: selected.name,
                                    coordinatorEmail: selected.email,
                                    coordinatorId: selected.userId || selected.id,
                                  });
                                }
                              }}
                            >
                              <option value="">-- Selecionar Docente da Instituição --</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.category} - {t.departmentId})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Acesso Restrito ao Administrador</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            Apenas o perfil <strong>Administrador</strong> tem permissão estatutária para nomear ou destituir o Coordenador do Curso.
                          </div>
                          <div className="mt-1.5 font-medium text-[11px] text-slate-700 bg-white/80 p-1.5 rounded border border-amber-100">
                            Coordenador em funções: <strong>{courseForm.coordinator || 'Nenhum coordenador nomeado'}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Grau</label>
                      <select value={courseForm.degree} onChange={e => setCourseForm({ ...courseForm, degree: e.target.value as any })} className="w-full border rounded p-2">
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Mestrado">Mestrado</option>
                        <option value="Doutoramento">Doutoramento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Duração</label>
                      <input type="text" value={courseForm.duration || ''} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'subjects' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Código</label>
                      <input type="text" required value={subjectForm.code || ''} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nome da Disciplina</label>
                      <input type="text" required value={subjectForm.name || ''} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Curso</label>
                    <select value={subjectForm.courseId} onChange={e => setSubjectForm({ ...subjectForm, courseId: e.target.value })} className="w-full border rounded p-2">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Carga Horária Semanal</label>
                      <input type="number" min="1" max="10" required value={subjectForm.weeklyHours || 4} onChange={e => setSubjectForm({ ...subjectForm, weeklyHours: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Créditos (ECTS)</label>
                      <input type="number" min="1" max="30" required value={subjectForm.credits || 6} onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Semestre</label>
                      <input type="number" min="1" max="10" required value={subjectForm.semester || 1} onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'classes' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Código</label>
                      <input type="text" required value={classForm.code || ''} onChange={e => setClassForm({ ...classForm, code: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nome da Turma</label>
                      <input type="text" required value={classForm.name || ''} onChange={e => setClassForm({ ...classForm, name: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Curso</label>
                    <select value={classForm.courseId} onChange={e => setClassForm({ ...classForm, courseId: e.target.value })} className="w-full border rounded p-2">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Turno</label>
                      <select value={classForm.shift} onChange={e => setClassForm({ ...classForm, shift: e.target.value as any })} className="w-full border rounded p-2">
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Ano Letivo</label>
                      <input type="number" min="1" max="5" value={classForm.year || 1} onChange={e => setClassForm({ ...classForm, year: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nº Estudantes</label>
                      <input type="number" min="1" max="150" value={classForm.studentCount || 30} onChange={e => setClassForm({ ...classForm, studentCount: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'rooms' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Código</label>
                      <input type="text" required value={roomForm.code || ''} onChange={e => setRoomForm({ ...roomForm, code: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nome da Sala</label>
                      <input type="text" required value={roomForm.name || ''} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Edifício</label>
                      <input type="text" value={roomForm.building || ''} onChange={e => setRoomForm({ ...roomForm, building: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Piso</label>
                      <input type="text" value={roomForm.floor || ''} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Tipo de Sala</label>
                      <select value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value as any })} className="w-full border rounded p-2">
                        <option value="Sala normal">Sala normal</option>
                        <option value="Laboratório">Laboratório</option>
                        <option value="Sala de informática">Sala de informática</option>
                        <option value="Auditório">Auditório</option>
                        <option value="Sala de reuniões">Sala de reuniões</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Capacidade (Lugares)</label>
                      <input type="number" min="1" max="500" value={roomForm.capacity || 30} onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'periods' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Ano Lectivo</label>
                      <input type="text" required value={periodForm.academicYear || '2026'} onChange={e => setPeriodForm({ ...periodForm, academicYear: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Semestre</label>
                      <select value={periodForm.semester} onChange={e => setPeriodForm({ ...periodForm, semester: e.target.value })} className="w-full border rounded p-2">
                        <option value="1.º Semestre">1.º Semestre</option>
                        <option value="2.º Semestre">2.º Semestre</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Data de Início</label>
                      <input type="date" required value={periodForm.startDate || ''} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Data de Fim</label>
                      <input type="date" required value={periodForm.endDate || ''} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="chk-current" checked={periodForm.isCurrent || false} onChange={e => setPeriodForm({ ...periodForm, isCurrent: e.target.checked })} className="rounded" />
                    <label htmlFor="chk-current" className="font-semibold">Definir como Período Vigente</label>
                  </div>
                </>
              )}

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
