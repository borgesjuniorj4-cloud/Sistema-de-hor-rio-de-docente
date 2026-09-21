import { 
  User, Teacher, Department, Course, Subject, ClassGroup, 
  Room, AcademicPeriod, TeacherAvailability, ScheduleItem, 
  ChangeRequest, NotificationItem, AuditLog 
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Borges Junior',
    email: 'admin@instituicao.edu',
    role: 'admin',
    roleTitle: 'Administrador do Sistema',
    status: 'Ativo',
    password: 'admin123',
  },
  {
    id: 'usr-gestor',
    name: 'Ana Martins',
    email: 'gestor.horarios@instituicao.edu',
    role: 'gestor',
    roleTitle: 'Gestor de Horários',
    status: 'Ativo',
    password: 'gestor123',
  },
  {
    id: 'usr-coord',
    name: 'Prof. Dr. Fernando Ramos',
    email: 'coordenador.inf@instituicao.edu',
    role: 'coordenador',
    roleTitle: 'Coordenador de Engenharia Informática',
    status: 'Ativo',
    password: 'coord123',
  },
  {
    id: 'usr-doc-joao',
    name: 'João Manuel',
    email: 'joao.manuel@instituicao.edu',
    role: 'docente',
    roleTitle: 'Docente Convidado',
    status: 'Ativo',
    password: 'docente123',
    teacherId: 'doc-1',
  },
  {
    id: 'usr-doc-maria',
    name: 'Maria Silva',
    email: 'maria.silva@instituicao.edu',
    role: 'docente',
    roleTitle: 'Professora Associada',
    status: 'Ativo',
    password: 'docente123',
    teacherId: 'doc-2',
  },
  {
    id: 'usr-doc-pedro',
    name: 'Pedro José',
    email: 'pedro.jose@instituicao.edu',
    role: 'docente',
    roleTitle: 'Professor Auxiliar',
    status: 'Ativo',
    password: 'docente123',
    teacherId: 'doc-3',
  },
  {
    id: 'usr-aluno',
    name: 'Lucas Ferreira',
    email: 'lucas.aluno@estudantes.instituicao.edu',
    role: 'estudante',
    roleTitle: 'Estudante - LEI (Turma INF-A)',
    status: 'Ativo',
    password: 'aluno123',
    classId: 'turma-1',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dep-inf',
    code: 'DINF',
    name: 'Departamento de Informática',
    description: 'Ciências da Computação, Engenharia de Software e Sistemas de Informação',
    manager: 'Prof. Dr. Fernando Ramos',
    status: 'Ativo',
  },
  {
    id: 'dep-mat',
    code: 'DMAT',
    name: 'Departamento de Matemática',
    description: 'Matemática Aplicada, Estatística, Álgebra e Análise',
    manager: 'Dra. Luísa Albuquerque',
    status: 'Ativo',
  },
  {
    id: 'dep-eco',
    code: 'DECO',
    name: 'Departamento de Economia',
    description: 'Ciências Económicas, Gestão e Finanças Institucionais',
    manager: 'Dr. António Mendes',
    status: 'Ativo',
  },
  {
    id: 'dep-eng',
    code: 'DENG',
    name: 'Departamento de Engenharia',
    description: 'Engenharia Eletrotécnica, Mecânica e Automação',
    manager: 'Prof. Dr. Manuel Cardoso',
    status: 'Ativo',
  },
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'doc-1',
    userId: 'usr-doc-joao',
    code: 'DOC001',
    name: 'João Manuel',
    gender: 'Masculino',
    birthDate: '1984-05-12',
    email: 'joao.manuel@instituicao.edu',
    phone: '+351 912 345 678',
    departmentId: 'dep-inf',
    category: 'Professor Convidado',
    specialization: 'Programação de Sistemas e Arquitetura de Software',
    contractType: 'Tempo Integral',
    workloadLimit: 16,
    currentWorkload: 8,
    status: 'Ativo',
    entryDate: '2019-09-01',
    notes: 'Disponibilidade reduzida às terças-feiras de manhã para investigação.',
  },
  {
    id: 'doc-2',
    userId: 'usr-doc-maria',
    code: 'DOC002',
    name: 'Maria Silva',
    gender: 'Feminino',
    birthDate: '1979-11-20',
    email: 'maria.silva@instituicao.edu',
    phone: '+351 923 456 789',
    departmentId: 'dep-mat',
    category: 'Professora Associada',
    specialization: 'Análise Numérica e Estatística Multivariada',
    contractType: 'Tempo Integral',
    workloadLimit: 18,
    currentWorkload: 10,
    status: 'Ativo',
    entryDate: '2015-02-15',
    notes: 'Membro do Conselho Científico.',
  },
  {
    id: 'doc-3',
    userId: 'usr-doc-pedro',
    code: 'DOC003',
    name: 'Pedro José',
    gender: 'Masculino',
    birthDate: '1988-03-08',
    email: 'pedro.jose@instituicao.edu',
    phone: '+351 934 567 890',
    departmentId: 'dep-inf',
    category: 'Professor Auxiliar',
    specialization: 'Bases de Dados Relacionais e Não-Relacionais',
    contractType: 'Tempo Integral',
    workloadLimit: 16,
    currentWorkload: 6,
    status: 'Ativo',
    entryDate: '2021-09-01',
    notes: 'Coordena o laboratório de projetos integrados.',
  },
  {
    id: 'doc-4',
    code: 'DOC004',
    name: 'Dra. Helena Costa',
    gender: 'Feminino',
    birthDate: '1982-07-25',
    email: 'helena.costa@instituicao.edu',
    phone: '+351 965 123 456',
    departmentId: 'dep-inf',
    category: 'Professora Auxiliar',
    specialization: 'Redes de Computadores e Cibersegurança',
    contractType: 'Tempo Integral',
    workloadLimit: 16,
    currentWorkload: 8,
    status: 'Ativo',
    entryDate: '2018-09-01',
    notes: 'Responsável pelo laboratório de infraestruturas de rede.',
  },
  {
    id: 'doc-5',
    code: 'DOC005',
    name: 'Dr. Rui Barbosa',
    gender: 'Masculino',
    birthDate: '1975-01-30',
    email: 'rui.barbosa@instituicao.edu',
    phone: '+351 911 223 344',
    departmentId: 'dep-mat',
    category: 'Professor Catedrático',
    specialization: 'Álgebra e Geometria Analítica',
    contractType: 'Tempo Parcial',
    workloadLimit: 12,
    currentWorkload: 4,
    status: 'Ativo',
    entryDate: '2012-09-01',
    notes: 'Investigador principal de projeto FCT.',
  },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-lei',
    departmentId: 'dep-inf',
    code: 'LEI',
    name: 'Licenciatura em Engenharia Informática',
    degree: 'Licenciatura',
    duration: '3 Anos',
    semesterCount: 6,
    status: 'Ativo',
  },
  {
    id: 'crs-lcc',
    departmentId: 'dep-inf',
    code: 'LCC',
    name: 'Licenciatura em Ciência de Computadores',
    degree: 'Licenciatura',
    duration: '3 Anos',
    semesterCount: 6,
    status: 'Ativo',
  },
  {
    id: 'crs-mes',
    departmentId: 'dep-inf',
    code: 'MES',
    name: 'Mestrado em Engenharia de Software',
    degree: 'Mestrado',
    duration: '2 Anos',
    semesterCount: 4,
    status: 'Ativo',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-inf101',
    courseId: 'crs-lei',
    departmentId: 'dep-inf',
    code: 'INF101',
    name: 'Programação I',
    description: 'Introdução à programação estruturada, algoritmos e boas práticas de codificação.',
    credits: 6,
    weeklyHours: 4,
    semester: 1,
    type: 'Obrigatória',
    status: 'Ativo',
  },
  {
    id: 'sub-inf102',
    courseId: 'crs-lei',
    departmentId: 'dep-inf',
    code: 'INF102',
    name: 'Base de Dados',
    description: 'Modelação relacional, álgebra relacional, linguagem SQL e integridade de dados.',
    credits: 6,
    weeklyHours: 4,
    semester: 1,
    type: 'Obrigatória',
    status: 'Ativo',
  },
  {
    id: 'sub-mat101',
    courseId: 'crs-lei',
    departmentId: 'dep-mat',
    code: 'MAT101',
    name: 'Matemática I',
    description: 'Cálculo diferencial e integral, limites, séries e sucessões reais.',
    credits: 6,
    weeklyHours: 5,
    semester: 1,
    type: 'Obrigatória',
    status: 'Ativo',
  },
  {
    id: 'sub-inf201',
    courseId: 'crs-lei',
    departmentId: 'dep-inf',
    code: 'INF201',
    name: 'Programação II',
    description: 'Programação orientada a objetos, padrões de projeto e estruturas de dados avançadas.',
    credits: 6,
    weeklyHours: 4,
    semester: 2,
    type: 'Obrigatória',
    status: 'Ativo',
  },
  {
    id: 'sub-inf204',
    courseId: 'crs-lei',
    departmentId: 'dep-inf',
    code: 'INF204',
    name: 'Redes de Computadores',
    description: 'Modelo OSI, protocolo TCP/IP, encaminhamento e protocolos de aplicação.',
    credits: 6,
    weeklyHours: 4,
    semester: 2,
    type: 'Obrigatória',
    status: 'Ativo',
  },
  {
    id: 'sub-mat202',
    courseId: 'crs-lei',
    departmentId: 'dep-mat',
    code: 'MAT202',
    name: 'Álgebra Linear',
    description: 'Matrizes, determinantes, espaços vetoriais e transformações lineares.',
    credits: 5,
    weeklyHours: 4,
    semester: 2,
    type: 'Obrigatória',
    status: 'Ativo',
  },
];

export const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'turma-1',
    courseId: 'crs-lei',
    code: 'INF-A',
    name: 'Turma INF-A (1º Ano)',
    year: 1,
    semester: 1,
    shift: 'Manhã',
    studentCount: 32,
    status: 'Ativo',
  },
  {
    id: 'turma-2',
    courseId: 'crs-lei',
    code: 'INF-B',
    name: 'Turma INF-B (1º Ano)',
    year: 1,
    semester: 1,
    shift: 'Tarde',
    studentCount: 28,
    status: 'Ativo',
  },
  {
    id: 'turma-3',
    courseId: 'crs-lei',
    code: 'INF-C',
    name: 'Turma INF-C (2º Ano)',
    year: 2,
    semester: 2,
    shift: 'Manhã',
    studentCount: 26,
    status: 'Ativo',
  },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-lab1',
    code: 'LAB-1',
    name: 'Laboratório 1',
    building: 'Edifício Central (A)',
    floor: 'Piso 1',
    capacity: 35,
    type: 'Laboratório',
    equipment: ['Computadores', 'Projetor', 'Quadro interativo', 'Ar condicionado'],
    status: 'Disponível',
  },
  {
    id: 'room-lab2',
    code: 'LAB-2',
    name: 'Laboratório 2',
    building: 'Edifício Central (A)',
    floor: 'Piso 1',
    capacity: 32,
    type: 'Laboratório',
    equipment: ['Computadores', 'Projetor', 'Ar condicionado'],
    status: 'Disponível',
  },
  {
    id: 'room-sala4',
    code: 'SAL-04',
    name: 'Sala 4',
    building: 'Edifício B',
    floor: 'Piso 2',
    capacity: 45,
    type: 'Sala normal',
    equipment: ['Projetor', 'Quadro interativo', 'Ar condicionado', 'Sistema de som'],
    status: 'Disponível',
  },
  {
    id: 'room-sala3',
    code: 'SAL-03',
    name: 'Sala 3',
    building: 'Edifício B',
    floor: 'Piso 1',
    capacity: 30,
    type: 'Sala normal',
    equipment: ['Projetor', 'Ar condicionado'],
    status: 'Disponível',
  },
  {
    id: 'room-auditorio',
    code: 'AUD-01',
    name: 'Auditório Principal',
    building: 'Edifício Central (A)',
    floor: 'Piso 0',
    capacity: 120,
    type: 'Auditório',
    equipment: ['Sistema de som', 'Projetor', 'Quadro interativo', 'Ar condicionado', 'Microfones'],
    status: 'Disponível',
  },
  {
    id: 'room-sala-inf',
    code: 'SINF-01',
    name: 'Sala de Informática 1',
    building: 'Edifício A',
    floor: 'Piso 2',
    capacity: 25,
    type: 'Sala de informática',
    equipment: ['Computadores', 'Projetor'],
    status: 'Disponível',
  },
];

export const INITIAL_ACADEMIC_PERIODS: AcademicPeriod[] = [
  {
    id: 'period-2026-1',
    academicYear: '2026',
    semester: '1.º Semestre',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    isCurrent: true,
    status: 'Ativo',
  },
  {
    id: 'period-2026-2',
    academicYear: '2026',
    semester: '2.º Semestre',
    startDate: '2027-02-15',
    endDate: '2027-06-30',
    isCurrent: false,
    status: 'Planeamento',
  },
];

export const INITIAL_PERIODS = INITIAL_ACADEMIC_PERIODS;

export const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
];

export const DAYS_OF_WEEK: ('Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta')[] = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
];

// Seed Availabilities (Matching PDF page 13 example)
export const INITIAL_AVAILABILITIES: TeacherAvailability[] = [
  // João Manuel (doc-1)
  { id: 'av-1', teacherId: 'doc-1', dayOfWeek: 'Segunda', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-2', teacherId: 'doc-1', dayOfWeek: 'Segunda', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-3', teacherId: 'doc-1', dayOfWeek: 'Segunda', timeSlot: '14:00-16:00', status: 'Indisponível' },
  { id: 'av-4', teacherId: 'doc-1', dayOfWeek: 'Segunda', timeSlot: '16:00-18:00', status: 'Disponível' },
  { id: 'av-5', teacherId: 'doc-1', dayOfWeek: 'Terça', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-6', teacherId: 'doc-1', dayOfWeek: 'Terça', timeSlot: '10:00-12:00', status: 'Indisponível' },
  { id: 'av-7', teacherId: 'doc-1', dayOfWeek: 'Terça', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-8', teacherId: 'doc-1', dayOfWeek: 'Terça', timeSlot: '16:00-18:00', status: 'Disponível' },
  { id: 'av-9', teacherId: 'doc-1', dayOfWeek: 'Quarta', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-10', teacherId: 'doc-1', dayOfWeek: 'Quarta', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-11', teacherId: 'doc-1', dayOfWeek: 'Quarta', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-12', teacherId: 'doc-1', dayOfWeek: 'Quarta', timeSlot: '16:00-18:00', status: 'Indisponível' },
  { id: 'av-13', teacherId: 'doc-1', dayOfWeek: 'Quinta', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-14', teacherId: 'doc-1', dayOfWeek: 'Quinta', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-15', teacherId: 'doc-1', dayOfWeek: 'Quinta', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-16', teacherId: 'doc-1', dayOfWeek: 'Quinta', timeSlot: '16:00-18:00', status: 'Disponível' },
  { id: 'av-17', teacherId: 'doc-1', dayOfWeek: 'Sexta', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-18', teacherId: 'doc-1', dayOfWeek: 'Sexta', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-19', teacherId: 'doc-1', dayOfWeek: 'Sexta', timeSlot: '14:00-16:00', status: 'Indisponível' },
  { id: 'av-20', teacherId: 'doc-1', dayOfWeek: 'Sexta', timeSlot: '16:00-18:00', status: 'Indisponível' },

  // Maria Silva (doc-2)
  { id: 'av-21', teacherId: 'doc-2', dayOfWeek: 'Segunda', timeSlot: '08:00-10:00', status: 'Indisponível' },
  { id: 'av-22', teacherId: 'doc-2', dayOfWeek: 'Segunda', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-23', teacherId: 'doc-2', dayOfWeek: 'Segunda', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-24', teacherId: 'doc-2', dayOfWeek: 'Terça', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-25', teacherId: 'doc-2', dayOfWeek: 'Terça', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-26', teacherId: 'doc-2', dayOfWeek: 'Quarta', timeSlot: '08:00-10:00', status: 'Disponível' },
  { id: 'av-27', teacherId: 'doc-2', dayOfWeek: 'Quarta', timeSlot: '10:00-12:00', status: 'Disponível' },
  { id: 'av-28', teacherId: 'doc-2', dayOfWeek: 'Quinta', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-29', teacherId: 'doc-2', dayOfWeek: 'Sexta', timeSlot: '08:00-10:00', status: 'Disponível' },

  // Pedro José (doc-3)
  { id: 'av-30', teacherId: 'doc-3', dayOfWeek: 'Segunda', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-31', teacherId: 'doc-3', dayOfWeek: 'Terça', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-32', teacherId: 'doc-3', dayOfWeek: 'Quarta', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-33', teacherId: 'doc-3', dayOfWeek: 'Quinta', timeSlot: '14:00-16:00', status: 'Disponível' },
  { id: 'av-34', teacherId: 'doc-3', dayOfWeek: 'Sexta', timeSlot: '10:00-12:00', status: 'Disponível' },
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  // Monday
  {
    id: 'sch-1',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-1', // João Manuel
    subjectId: 'sub-inf101', // Programação I
    classId: 'turma-1', // INF-A
    roomId: 'room-lab1', // Lab 1
    dayOfWeek: 'Segunda',
    startTime: '08:00',
    endTime: '10:00',
    lessonType: 'Prática',
    status: 'Publicado',
    notes: 'Introdução aos algoritmos práticos.',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'sch-2',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-2', // Maria Silva
    subjectId: 'sub-mat101', // Matemática I
    classId: 'turma-1', // INF-A
    roomId: 'room-sala4', // Sala 4
    dayOfWeek: 'Segunda',
    startTime: '10:00',
    endTime: '12:00',
    lessonType: 'Teórica',
    status: 'Publicado',
    notes: 'Cálculo de limites fundamentais.',
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'sch-3',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-1', // João Manuel
    subjectId: 'sub-inf102', // Base de Dados
    classId: 'turma-2', // INF-B
    roomId: 'room-lab2', // Lab 2
    dayOfWeek: 'Segunda',
    startTime: '14:00',
    endTime: '16:00',
    lessonType: 'Laboratório',
    status: 'Publicado',
    notes: 'Laboratório prático de SQL.',
    createdAt: '2026-08-16T10:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },

  // Tuesday
  {
    id: 'sch-4',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-1', // João Manuel
    subjectId: 'sub-inf201', // Programação II
    classId: 'turma-3', // INF-C
    roomId: 'room-lab1', // Lab 1
    dayOfWeek: 'Terça',
    startTime: '10:00',
    endTime: '12:00',
    lessonType: 'Prática',
    status: 'Publicado',
    notes: 'Paradigma orientado a objetos.',
    createdAt: '2026-08-16T11:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'sch-5',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-3', // Pedro José
    subjectId: 'sub-inf102', // Base de Dados
    classId: 'turma-2', // INF-B
    roomId: 'room-lab2', // Lab 2
    dayOfWeek: 'Terça',
    startTime: '14:00',
    endTime: '16:00',
    lessonType: 'Teórico-Prática',
    status: 'Publicado',
    notes: 'Diagramas Entidade-Relacionamento.',
    createdAt: '2026-08-17T09:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },

  // Wednesday
  {
    id: 'sch-6',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-2', // Maria Silva
    subjectId: 'sub-mat101', // Matemática I
    classId: 'turma-2', // INF-B
    roomId: 'room-sala4', // Sala 4
    dayOfWeek: 'Quarta',
    startTime: '08:00',
    endTime: '10:00',
    lessonType: 'Teórica',
    status: 'Publicado',
    notes: 'Sucessões e convergência.',
    createdAt: '2026-08-17T14:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'sch-7',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-4', // Helena Costa
    subjectId: 'sub-inf204', // Redes
    classId: 'turma-3', // INF-C
    roomId: 'room-lab1', // Lab 1
    dayOfWeek: 'Quarta',
    startTime: '10:00',
    endTime: '12:00',
    lessonType: 'Laboratório',
    status: 'Publicado',
    notes: 'Análise de pacotes Wireshark.',
    createdAt: '2026-08-17T15:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },

  // Thursday
  {
    id: 'sch-8',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-1', // João Manuel
    subjectId: 'sub-inf101', // Programação I
    classId: 'turma-1', // INF-A
    roomId: 'room-lab1', // Lab 1
    dayOfWeek: 'Quinta',
    startTime: '08:00',
    endTime: '10:00',
    lessonType: 'Teórica',
    status: 'Publicado',
    notes: 'Funções e ponteiros.',
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'sch-9',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-2', // Maria Silva
    subjectId: 'sub-mat202', // Álgebra Linear
    classId: 'turma-1', // INF-A
    roomId: 'room-sala4', // Sala 4
    dayOfWeek: 'Quinta',
    startTime: '14:00',
    endTime: '16:00',
    lessonType: 'Teórico-Prática',
    status: 'Publicado',
    notes: 'Determinantes de matrizes nxn.',
    createdAt: '2026-08-18T10:30:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },

  // Friday (Draft in review)
  {
    id: 'sch-10',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-3', // Pedro José
    subjectId: 'sub-inf102', // Base de Dados
    classId: 'turma-2', // INF-B
    roomId: 'room-lab2', // Lab 2
    dayOfWeek: 'Sexta',
    startTime: '10:00',
    endTime: '12:00',
    lessonType: 'Prática',
    status: 'Em validação',
    notes: 'Sessão de reforço para projeto semestral.',
    createdAt: '2026-08-19T14:00:00Z',
    updatedAt: '2026-08-21T09:00:00Z',
  },
  {
    id: 'sch-11',
    academicPeriodId: 'period-2026-1',
    teacherId: 'doc-4', // Helena Costa
    subjectId: 'sub-inf204', // Redes
    classId: 'turma-3', // INF-C
    roomId: 'room-lab1', // Lab 1
    dayOfWeek: 'Sexta',
    startTime: '14:00',
    endTime: '16:00',
    lessonType: 'Teórica',
    status: 'Aprovado',
    notes: 'Protocolos de transporte TCP e UDP.',
    createdAt: '2026-08-19T16:00:00Z',
    updatedAt: '2026-08-21T10:00:00Z',
  },
];

export const INITIAL_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'req-1',
    scheduleId: 'sch-1',
    requestedByUserId: 'usr-doc-joao',
    requestedByName: 'João Manuel',
    teacherId: 'doc-1',
    currentScheduleInfo: {
      subjectName: 'Programação I',
      className: 'INF-A',
      dayOfWeek: 'Segunda',
      startTime: '08:00',
      endTime: '10:00',
      roomName: 'Laboratório 1',
    },
    newDayOfWeek: 'Segunda',
    newStartTime: '10:00',
    newEndTime: '12:00',
    newRoomId: 'room-lab1',
    reason: 'Conflito com outra atividade académica de investigação no departamento.',
    status: 'Pendente',
    createdAt: '2026-08-22T08:30:00Z',
  },
  {
    id: 'req-2',
    scheduleId: 'sch-3',
    requestedByUserId: 'usr-doc-joao',
    requestedByName: 'João Manuel',
    teacherId: 'doc-1',
    currentScheduleInfo: {
      subjectName: 'Base de Dados',
      className: 'INF-B',
      dayOfWeek: 'Segunda',
      startTime: '14:00',
      endTime: '16:00',
      roomName: 'Laboratório 2',
    },
    newDayOfWeek: 'Quarta',
    newStartTime: '14:00',
    newEndTime: '16:00',
    newRoomId: 'room-lab2',
    reason: 'Necessidade de ajuste com a equipa de monitoria laboratorial.',
    status: 'Aprovada',
    reviewedBy: 'Prof. Dr. Fernando Ramos',
    reviewComment: 'Ajuste deferido sem conflito de espaço.',
    createdAt: '2026-08-19T10:00:00Z',
    reviewedAt: '2026-08-20T14:00:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Horário Oficial Publicado',
    message: 'O horário do 1.º Semestre de 2026 foi publicado para os cursos de Engenharia Informática.',
    type: 'success',
    read: false,
    createdAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'notif-2',
    title: 'Nova Solicitação de Alteração',
    message: 'O docente João Manuel solicitou alteração de horário da aula de Programação I (INF-A).',
    type: 'warning',
    read: false,
    createdAt: '2026-08-22T08:31:00Z',
  },
  {
    id: 'notif-3',
    title: 'Solicitação Aprovada',
    message: 'A alteração para a disciplina Base de Dados (INF-B) foi aprovada pela coordenação.',
    type: 'info',
    read: true,
    createdAt: '2026-08-20T14:05:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-admin',
    userName: 'Borges Junior (admin)',
    userRole: 'Administrador',
    action: 'Criou docente',
    entity: 'Docente',
    entityId: 'doc-1',
    oldData: '---',
    newData: 'João Manuel (DOC001, Dept. Informática)',
    timestamp: '2026-08-18 09:30:15',
  },
  {
    id: 'aud-2',
    userId: 'usr-gestor',
    userName: 'Ana Martins (gestor)',
    userRole: 'Gestor de Horários',
    action: 'Alterou horário',
    entity: 'Horário',
    entityId: 'sch-1',
    oldData: 'Segunda 09:00-11:00 (Sala 4)',
    newData: 'Segunda 08:00-10:00 (Lab 1)',
    timestamp: '2026-08-18 11:20:45',
  },
  {
    id: 'aud-3',
    userId: 'usr-coord',
    userName: 'Dr. Fernando Ramos (coordenador)',
    userRole: 'Coordenador',
    action: 'Aprovou horário',
    entity: 'Horário',
    entityId: 'turma-1',
    oldData: 'Estado: Em validação',
    newData: 'Estado: Aprovado (Turma INF-A)',
    timestamp: '2026-08-18 16:45:00',
  },
  {
    id: 'aud-4',
    userId: 'usr-gestor',
    userName: 'Ana Martins (gestor)',
    userRole: 'Gestor de Horários',
    action: 'Publicou horário',
    entity: 'Horário',
    entityId: 'period-2026-1',
    oldData: 'Estado: Aprovado',
    newData: 'Estado: Publicado (Período 2026 - 1.º Semestre)',
    timestamp: '2026-08-20 11:00:00',
  },
];
