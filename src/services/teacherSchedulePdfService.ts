import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Teacher, Room, ScheduleItem, Subject, ClassGroup, 
  AcademicPeriod, Department, User 
} from '../types';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../data/initialData';

export interface TeacherSchedulePdfOptions {
  teacher: Teacher;
  period: AcademicPeriod;
  currentUser: User;
  schedules: ScheduleItem[];
  subjects: Subject[];
  classes: ClassGroup[];
  rooms: Room[];
  departments: Department[];
  orientation?: 'portrait' | 'landscape';
  includeGrid?: boolean;
  includeTable?: boolean;
  includeWorkloadAnalysis?: boolean;
  includeSignatures?: boolean;
  officialNotes?: string;
}

export function generateTeacherSchedulePdf(options: TeacherSchedulePdfOptions): jsPDF {
  const {
    teacher,
    period,
    currentUser,
    schedules,
    subjects,
    classes,
    rooms,
    departments,
    orientation = 'landscape',
    includeGrid = true,
    includeTable = true,
    includeWorkloadAnalysis = true,
    includeSignatures = true,
    officialNotes,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = margin;

  // Color Palette (Formal Academic)
  const primaryNavy: [number, number, number] = [15, 23, 42];     // slate-900
  const accentIndigo: [number, number, number] = [67, 56, 202];   // indigo-700
  const accentBlue: [number, number, number] = [30, 64, 175];     // blue-800
  const borderGrey: [number, number, number] = [203, 213, 225];   // slate-300
  const lightBg: [number, number, number] = [248, 250, 252];      // slate-50

  // Filter schedules strictly for this teacher and period
  const teacherSchedules = schedules.filter(s => 
    s.teacherId === teacher.id && 
    (s.academicPeriodId === period.id || s.periodId === period.id || !s.academicPeriodId) &&
    s.status !== 'Cancelado'
  );

  // Calculate teacher scheduled hours
  let totalMinutes = 0;
  for (const s of teacherSchedules) {
    const [sh, sm] = (s.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (s.endTime || '10:00').split(':').map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
  }
  const totalWeeklyHours = Number((totalMinutes / 60).toFixed(1));
  const maxWeeklyHours = teacher.workloadLimit || 16;
  const isOverloaded = totalWeeklyHours > maxWeeklyHours;
  const workloadPercentage = Math.round((totalWeeklyHours / maxWeeklyHours) * 100);

  // Fast entity maps
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const classMap = new Map(classes.map(c => [c.id, c]));
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const dept = departments.find(d => d.id === teacher.departmentId);

  // 1. INSTITUTIONAL HEADER BAR
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 20, 2, 2, 'F');

  // Institution title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSIDADE TOBAS • DIREÇÃO PEDAGÓGICA E GESTÃO ACADÉMICA', margin + 6, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text('SGHD - Sistema Integrado de Gestão de Horários e Distribuição de Serviço Docente', margin + 6, currentY + 11.5);

  doc.setFontSize(7.5);
  doc.setTextColor(199, 210, 254);
  const emitDate = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Documento Oficial de Alocação Letiva | Emitido em: ${emitDate} | Autenticado por: ${currentUser.name}`, margin + 6, currentY + 16.5);

  currentY += 23;

  // 2. TEACHER & PERIOD IDENTIFICATION SUMMARY CARD
  const cardHeight = 22;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), cardHeight, 1.5, 1.5, 'FD');

  // Left side: Teacher Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`DOCENTE: ${teacher.name.toUpperCase()}`, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Código: ${teacher.code || teacher.id}   |   Categoria: ${teacher.category || 'Docente'}   |   Contrato: ${teacher.contractType || 'Tempo Integral'}`, margin + 4, currentY + 11.5);
  doc.text(`Departamento: ${dept?.name || teacher.departmentId || 'Geral'}   |   E-mail: ${teacher.email || 'N/D'}`, margin + 4, currentY + 16.5);

  // Right side: Period & Workload Badge
  const colRightX = pageWidth - margin - 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentIndigo[0], accentIndigo[1], accentIndigo[2]);
  doc.text(`PERÍODO ACADÉMICO: ${period.academicYear} • ${period.semester}`, colRightX, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Vigência: ${period.startDate || '2026-09-01'} a ${period.endDate || '2027-01-31'}`, colRightX, currentY + 11.5);

  const statusColor = isOverloaded ? [225, 29, 72] : [16, 185, 129];
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Carga Atribuída: ${totalWeeklyHours}h / ${maxWeeklyHours}h (${workloadPercentage}%) • ${teacherSchedules.length} aulas semanais`, colRightX, currentY + 16.5);

  currentY += cardHeight + 4;

  // 3. WEEKLY TIMETABLE GRID (GRADE HORÁRIA VISUAL)
  if (includeGrid) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('GRADE HORÁRIA SEMANAL DO DOCENTE', margin, currentY + 2);
    currentY += 4;

    const days = DAYS_OF_WEEK; // ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
    const timeSlots = TIME_SLOTS; // ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00']

    const gridHead = [['Horário', ...days.map(d => `${d}-feira`)]];
    const gridBody = timeSlots.map(slot => {
      const [slotStart, slotEnd] = slot.split('-');
      
      const row = [slot];
      for (const day of days) {
        // Find matching schedule item
        const match = teacherSchedules.find(s => {
          if (s.dayOfWeek !== day) return false;
          // check if time overlaps with slot
          return s.startTime === slotStart || (s.startTime <= slotStart && s.endTime >= slotEnd);
        });

        if (match) {
          const sub = subjectMap.get(match.subjectId);
          const cls = classMap.get(match.classId);
          const rm = roomMap.get(match.roomId);
          const text = `${sub?.code || 'DISC'} • ${sub?.name || 'Disciplina'}\nTurma: ${cls?.code || '---'}\nSala: ${rm?.code || '---'} (${match.lessonType || 'Teórica'})`;
          row.push(text);
        } else {
          row.push('---');
        }
      }
      return row;
    });

    autoTable(doc, {
      startY: currentY,
      head: gridHead,
      body: gridBody,
      theme: 'grid',
      styles: {
        fontSize: orientation === 'landscape' ? 7.5 : 6.5,
        cellPadding: orientation === 'landscape' ? 2 : 1.5,
        valign: 'middle',
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: {
          cellWidth: orientation === 'landscape' ? 24 : 20,
          fontStyle: 'bold',
          halign: 'center',
          fillColor: [241, 245, 249],
        },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index > 0) {
          const text = String(data.cell.raw || '');
          if (text !== '---') {
            data.cell.styles.fillColor = [238, 242, 255]; // Soft indigo
            data.cell.styles.textColor = [49, 46, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.halign = 'center';
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    // Update currentY after table
    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // 4. DETAILED LESSONS TABLE (LISTA DETALHADA DAS AULAS ATRIBUÍDAS)
  if (includeTable) {
    // Check if new page is needed
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`DISCRIMINAÇÃO DETALHADA DAS AULAS ATRIBUÍDAS (${teacherSchedules.length} Atividades)`, margin, currentY + 2);
    currentY += 4;

    const listHead = [['Dia', 'Horário', 'Código', 'Disciplina', 'Turma', 'Sala / Bloco', 'Tipo', 'Carga', 'Estado']];
    
    // Sort schedules chronologically
    const dayOrder: Record<string, number> = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
    const sortedSchedules = [...teacherSchedules].sort((a, b) => {
      const dDiff = (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99);
      if (dDiff !== 0) return dDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    const listBody = sortedSchedules.map(sch => {
      const sub = subjectMap.get(sch.subjectId);
      const cls = classMap.get(sch.classId);
      const rm = roomMap.get(sch.roomId);
      const [sh, sm] = sch.startTime.split(':').map(Number);
      const [eh, em] = sch.endTime.split(':').map(Number);
      const durationHours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;

      return [
        sch.dayOfWeek,
        `${sch.startTime} - ${sch.endTime}`,
        sub?.code || '---',
        sub?.name || 'Disciplina',
        cls?.name || cls?.code || '---',
        rm ? `${rm.code} (${rm.name})` : '---',
        sch.lessonType || 'Teórica',
        `${durationHours}h`,
        sch.status || 'Publicado',
      ];
    });

    if (listBody.length === 0) {
      listBody.push(['---', '---', '---', 'Nenhuma aula cadastrada neste período académico', '---', '---', '---', '0h', '---']);
    }

    autoTable(doc, {
      startY: currentY,
      head: listHead,
      body: listBody,
      theme: 'striped',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // 5. WORKLOAD & COMPLIANCE SUMMARY (RN06)
  if (includeWorkloadAnalysis) {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = margin;
    }

    const boxHeight = 16;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('AUDITORIA DE CARGA HORÁRIA E CONFORMIDADE REGULAMENTAR (RN06):', margin + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const balanceText = isOverloaded 
      ? `EXCESSO DE CARGA DETECTADO: O docente excede o limite contratual em ${(totalWeeklyHours - maxWeeklyHours).toFixed(1)} horas semanais.`
      : `CONFORME: Carga atribuída (${totalWeeklyHours}h) dentro do limite regulamentar permitido (${maxWeeklyHours}h/semana). Saldo livre: ${(maxWeeklyHours - totalWeeklyHours).toFixed(1)}h.`;
    
    doc.text(balanceText, margin + 4, currentY + 10.5);

    if (officialNotes) {
      doc.setFont('helvetica', 'italic');
      doc.text(`Observações: ${officialNotes}`, margin + 4, currentY + 14.5);
    }

    currentY += boxHeight + 6;
  }

  // 6. FORMAL SIGNATURES BLOCK
  if (includeSignatures) {
    if (currentY > pageHeight - 32) {
      doc.addPage();
      currentY = margin + 5;
    }

    const sigBoxWidth = (pageWidth - (margin * 2) - 16) / 3;
    const sigY = currentY + 12;

    // Docente
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY, margin + sigBoxWidth, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Assinatura do Docente', margin + (sigBoxWidth / 2), sigY + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(teacher.name, margin + (sigBoxWidth / 2), sigY + 7.5, { align: 'center' });

    // Diretor de Departamento
    const dirX = margin + sigBoxWidth + 8;
    doc.line(dirX, sigY, dirX + sigBoxWidth, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Diretor do Departamento', dirX + (sigBoxWidth / 2), sigY + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(dept?.director || dept?.manager || 'Direção de Departamento', dirX + (sigBoxWidth / 2), sigY + 7.5, { align: 'center' });

    // Direção Pedagógica / Reitoria
    const pedX = dirX + sigBoxWidth + 8;
    doc.line(pedX, sigY, pedX + sigBoxWidth, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Direção Pedagógica / Reitoria', pedX + (sigBoxWidth / 2), sigY + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Homologação SGHD', pedX + (sigBoxWidth / 2), sigY + 7.5, { align: 'center' });
  }

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Universidade Tobas • SGHD - Horário Individual de Docente (${teacher.name}) • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}
