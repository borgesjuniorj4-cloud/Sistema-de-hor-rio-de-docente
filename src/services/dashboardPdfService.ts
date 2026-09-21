import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Teacher, Room, ScheduleItem, Subject, ClassGroup, 
  AcademicPeriod, ScheduleConflict, ChangeRequest, User 
} from '../types';

export interface DashboardPdfOptions {
  period?: AcademicPeriod;
  currentUser: User;
  includeKpis: boolean;
  includeConflicts: boolean;
  includeTeachers: boolean;
  includeRooms: boolean;
  includeWorkflow: boolean;
  includeSignatures: boolean;
  managerNotes?: string;
  filterOnlyOverloaded?: boolean;
}

export function generateDashboardPdf(
  data: {
    teachers: Teacher[];
    subjects: Subject[];
    classes: ClassGroup[];
    rooms: Room[];
    schedules: ScheduleItem[];
    conflicts: ScheduleConflict[];
    changeRequests: ChangeRequest[];
    periods: AcademicPeriod[];
  },
  options: DashboardPdfOptions
): jsPDF {
  const {
    teachers,
    subjects,
    classes,
    rooms,
    schedules,
    conflicts,
    changeRequests,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600
  const lightBg: [number, number, number] = [248, 250, 252]; // slate-50

  const activeTeachers = teachers.filter(t => t.status === 'Ativo');
  const activeRooms = rooms.filter(r => r.status === 'Disponível');
  const scheduledLessons = schedules.filter(s => s.status !== 'Cancelado');
  const publishedCount = schedules.filter(s => s.status === 'Publicado').length;
  const pendingRequestsCount = changeRequests.filter(r => r.status === 'Pendente').length;
  const currentPeriod = options.period || data.periods.find(p => p.isCurrent) || data.periods[0];

  // Helper for adding section headers
  const addSectionTitle = (title: string, subtitle?: string) => {
    // Check page break needed
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = margin + 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, margin, currentY);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, margin, currentY + 4);
      currentY += 8;
    } else {
      currentY += 6;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
    currentY += 3;
  };

  // 1. INSTITUTIONAL HEADER
  // Header background accent bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 24, 'F');

  // Institution text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSIDADE TOBAS - CAMPUS CENTRAL', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('SGHD • Sistema de Gestão de Horários e Alocação Docente', margin + 6, currentY + 13);

  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  const dateStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Emitido em: ${dateStr} | Por: ${options.currentUser.name} (${options.currentUser.roleTitle})`, margin + 6, currentY + 19);

  currentY += 29;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RELATÓRIO EXECUTIVO DO DASHBOARD ACADÉMICO', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ano Lectivo: ${currentPeriod?.academicYear || '2026/2027'} • Semestre: ${currentPeriod?.semester || '1.º Semestre'} • Estado: ${publishedCount === scheduledLessons.length && scheduledLessons.length > 0 ? 'Publicado' : 'Em Planeamento / Validação'}`, margin, currentY);

  currentY += 8;

  // Optional Manager Note
  if (options.managerNotes && options.managerNotes.trim()) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Despacho / Observações do Gestor Académico:', margin + 4, currentY + 5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(options.managerNotes.substring(0, 140), margin + 4, currentY + 10);
    currentY += 18;
  }

  // 2. INDICADORES CHAVE (KPIS)
  if (options.includeKpis) {
    addSectionTitle('1. Indicadores Globais do Semestre (KPIs)', 'Visão sintética dos recursos humanos, infraestruturas e carga lectiva');

    const kpiData = [
      ['Docentes Ativos', `${activeTeachers.length} docentes cadastrados`],
      ['Disciplinas em Curso', `${subjects.length} unidades curriculares`],
      ['Turmas em Atividade', `${classes.length} turmas (${classes.reduce((acc, c) => acc + (c.studentCount || 0), 0)} estudantes)`],
      ['Salas & Laboratórios', `${activeRooms.length} espaços operacionais`],
      ['Aulas Programadas', `${scheduledLessons.length} aulas semanais (${publishedCount} publicadas)`],
      ['Conflitos Detetados (RN01-RN07)', `${conflicts.length} conflito(s) ativos`],
      ['Solicitações de Ajuste', `${pendingRequestsCount} pendente(s) de homologação`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Métrica / Indicador Institucional', 'Valor Consolidado']],
      body: kpiData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 3. CONFLITOS DE REGRAS DE NEGÓCIO (RN01-RN07)
  if (options.includeConflicts) {
    addSectionTitle('2. Auditoria e Validação de Conflitos (RN01 a RN07)', 'Conformidade com restrições pedagógicas, docentes e de espaço');

    if (conflicts.length === 0) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text('✓ CONFORMIDADE TOTAL: Nenhum conflito de horário detetado pelo validador automático.', margin + 4, currentY + 7);
      currentY += 17;
    } else {
      const conflictRows = conflicts.map(c => [
        c.code,
        c.title,
        c.description,
        c.severity === 'high' ? 'Crítico (RN violada)' : 'Médio',
        `${c.scheduleItemIds.length} aulas`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Regra', 'Conflito', 'Descrição / Justificativa', 'Severidade', 'Impacto']],
        body: conflictRows,
        theme: 'grid',
        headStyles: {
          fillColor: [225, 29, 72], // Rose red
          textColor: 255,
          fontSize: 8.5,
          fontStyle: 'bold',
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 35 },
          2: { cellWidth: 80 },
          3: { cellWidth: 25 },
          4: { cellWidth: 22 },
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // 4. CARGA HORÁRIA DOS DOCENTES (RN06)
  if (options.includeTeachers) {
    addSectionTitle('3. Monitorização da Carga Horária Docente (RN06)', 'Acompanhamento do cumprimento das cargas horárias contratuais e sobrecargas');

    // Calculate teacher hours
    const teacherRows = teachers
      .map(t => {
        const tSchedules = scheduledLessons.filter(s => s.teacherId === t.id);
        let totalMinutes = 0;
        for (const sch of tSchedules) {
          const [sh, sm] = sch.startTime.split(':').map(Number);
          const [eh, em] = sch.endTime.split(':').map(Number);
          totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
        }
        const hours = Math.round((totalMinutes / 60) * 10) / 10;
        const limit = t.workloadLimit || 16;
        const diff = Math.round((hours - limit) * 10) / 10;
        const rate = Math.round((hours / limit) * 100);
        const isOver = hours > limit;

        return {
          name: t.name,
          code: t.code,
          category: t.category,
          contract: t.contractType,
          limit: `${limit}h`,
          allocated: `${hours}h`,
          rate: `${rate}%`,
          lessons: tSchedules.length,
          status: isOver ? `Excedeu (+${diff}h)` : hours === limit ? 'Carga Completa' : `Disponível (${Math.abs(diff)}h)`,
          isOver,
        };
      })
      .filter(item => options.filterOnlyOverloaded ? item.isOver : true);

    autoTable(doc, {
      startY: currentY,
      head: [['Docente', 'Código', 'Categoria', 'Contrato', 'Limite', 'Alocado', 'Ocupação', 'Aulas', 'Estado RN06']],
      body: teacherRows.map(r => [
        r.name, r.code, r.category, r.contract, r.limit, r.allocated, r.rate, r.lessons, r.status
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      didParseCell: function (cellData) {
        if (cellData.section === 'body' && cellData.column.index === 8) {
          const text = String(cellData.cell.raw);
          if (text.includes('Excedeu')) {
            cellData.cell.styles.textColor = [190, 18, 60];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (text.includes('Completa')) {
            cellData.cell.styles.textColor = [15, 118, 110];
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. OCUPAÇÃO DE SALAS E LABORATÓRIOS
  if (options.includeRooms) {
    addSectionTitle('4. Taxa de Utilização de Salas e Laboratórios', 'Ocupação semanal das instalações físicas de ensino (base de cálculo: 40h semanais)');

    const roomRows = rooms.map(room => {
      const roomSchedules = scheduledLessons.filter(s => s.roomId === room.id);
      let totalMinutes = 0;
      for (const sch of roomSchedules) {
        const [sh, sm] = sch.startTime.split(':').map(Number);
        const [eh, em] = sch.endTime.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      }
      const occupiedHours = Math.round((totalMinutes / 60) * 10) / 10;
      const weeklyCapacityHours = 40; // 5 days * 8 hours
      const occupancyRate = Math.min(100, Math.round((occupiedHours / weeklyCapacityHours) * 100));

      return [
        room.name,
        room.code,
        room.building,
        room.type,
        `${room.capacity} lug.`,
        `${roomSchedules.length} aulas`,
        `${occupiedHours}h / ${weeklyCapacityHours}h`,
        `${occupancyRate}%`,
        room.status,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Espaço', 'Código', 'Edifício', 'Tipo', 'Capacidade', 'Aulas/Sem', 'Horas Usadas', 'Taxa Uso', 'Estado']],
      body: roomRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // Teal
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 6. CICLO DE APROVAÇÃO E PUBLICAÇÃO
  if (options.includeWorkflow) {
    addSectionTitle('5. Distribuição das Aulas por Estado do Ciclo de Publicação', 'Acompanhamento do fluxo institucional (Rascunho > Validação > Aprovado > Publicado)');

    const statusCounts = {
      Rascunho: schedules.filter(s => s.status === 'Rascunho').length,
      'Em validação': schedules.filter(s => s.status === 'Em validação').length,
      Aprovado: schedules.filter(s => s.status === 'Aprovado').length,
      Publicado: schedules.filter(s => s.status === 'Publicado').length,
      Cancelado: schedules.filter(s => s.status === 'Cancelado').length,
    };

    const workflowRows = [
      ['1. Rascunho', `${statusCounts.Rascunho} aulas`, `${Math.round((statusCounts.Rascunho / (schedules.length || 1)) * 100)}%`, 'Elaboração inicial pelo gestor'],
      ['2. Em Validação', `${statusCounts['Em validação']} aulas`, `${Math.round((statusCounts['Em validação'] / (schedules.length || 1)) * 100)}%`, 'Em auditoria pelo motor de conflitos RN01-RN07'],
      ['3. Aprovado', `${statusCounts.Aprovado} aulas`, `${Math.round((statusCounts.Aprovado / (schedules.length || 1)) * 100)}%`, 'Homologado pela coordenação pedagógica'],
      ['4. Publicado', `${statusCounts.Publicado} aulas`, `${Math.round((statusCounts.Publicado / (schedules.length || 1)) * 100)}%`, 'Visível para todos os docentes e estudantes'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Etapa do Ciclo', 'Total de Aulas', 'Percentual', 'Significado Institucional']],
      body: workflowRows,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 7. ASSINATURAS INSTITUCIONAIS
  if (options.includeSignatures) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin + 15;
    } else {
      currentY = Math.max(currentY + 5, pageHeight - 40);
    }

    const colWidth = (pageWidth - (margin * 2) - 15) / 2;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);

    // Left signature: Gestor Académico
    doc.line(margin + 5, currentY + 12, margin + colWidth - 5, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(options.currentUser.name, margin + 5, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${options.currentUser.roleTitle} • SGHD`, margin + 5, currentY + 20);

    // Right signature: Direção Pedagógica
    const rightColX = margin + colWidth + 15;
    doc.line(rightColX + 5, currentY + 12, rightColX + colWidth - 5, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Conselho Pedagógico / Direção', rightColX + 5, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Homologação e Arquivo Oficial', rightColX + 5, currentY + 20);
  }

  // 8. ADD PAGE NUMBERS & FOOTER TO ALL PAGES
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    
    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text('Universidade Tobas - SGHD • Sistema de Gestão de Horários de Docentes • Documento Oficial', margin, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  return doc;
}

export function downloadDashboardPdf(
  data: Parameters<typeof generateDashboardPdf>[0],
  options: DashboardPdfOptions,
  filename?: string
): void {
  const doc = generateDashboardPdf(data, options);
  const periodTag = options.period?.academicYear.replace(/[^a-zA-Z0-9]/g, '_') || '2026';
  const defaultFilename = filename || `Universidade_Tobas_Relatorio_Dashboard_${periodTag}.pdf`;
  doc.save(defaultFilename);
}
