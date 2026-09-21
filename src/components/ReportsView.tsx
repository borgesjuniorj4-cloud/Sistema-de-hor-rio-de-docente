import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Download, Printer, Users, School, 
  Clock, CheckCircle2, AlertCircle, PieChart, Layers, FileText,
  FileDown, LayoutGrid
} from 'lucide-react';
import { 
  Teacher, Room, ScheduleItem, Subject, ClassGroup, User, 
  ScheduleConflict, ChangeRequest, AcademicPeriod, Department 
} from '../types';
import { INITIAL_DEPARTMENTS } from '../data/initialData';
import { DashboardExportModal } from './DashboardExportModal';
import { RoomOccupancyByDepartmentChart } from './RoomOccupancyByDepartmentChart';

interface ReportsViewProps {
  teachers: Teacher[];
  rooms: Room[];
  schedules: ScheduleItem[];
  subjects: Subject[];
  classes: ClassGroup[];
  departments?: Department[];
  currentUser?: User;
  conflicts?: ScheduleConflict[];
  changeRequests?: ChangeRequest[];
  periods?: AcademicPeriod[];
  onExportSuccess?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  teachers = [],
  rooms = [],
  schedules = [],
  subjects = [],
  classes = [],
  departments = [],
  currentUser,
  conflicts = [],
  changeRequests = [],
  periods = [],
  onExportSuccess,
}) => {
  const [reportType, setReportType] = useState<'dept_occupancy' | 'occupancy' | 'workload'>('dept_occupancy');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const isManager = currentUser ? ['gestor', 'admin', 'coordenador'].includes(currentUser.role) : true;

  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeDepartments = Array.isArray(departments) && departments.length > 0 
    ? departments 
    : INITIAL_DEPARTMENTS;

  // Teacher Workload calculations
  const teacherStats = useMemo(() => {
    return safeTeachers.map(teacher => {
      const teacherSchedules = safeSchedules.filter(
        s => s.teacherId === teacher.id && s.status !== 'Cancelado'
      );
      let hours = 0;
      for (const s of teacherSchedules) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        hours += (eh * 60 + em - (sh * 60 + sm)) / 60;
      }
      const occupancyRate = Math.round((hours / (teacher.workloadLimit || 16)) * 100);
      return {
        ...teacher,
        scheduledHours: hours,
        lessonCount: teacherSchedules.length,
        occupancyRate,
        isOverloaded: hours > (teacher.workloadLimit || 16),
      };
    });
  }, [safeTeachers, safeSchedules]);

  // Room Occupancy calculations (Assuming 5 days * 8 working hours = 40h available institutional time)
  const roomStats = useMemo(() => {
    const totalWeeklyHoursAvailable = 40;
    return safeRooms.map(room => {
      const roomSchedules = safeSchedules.filter(
        s => s.roomId === room.id && s.status !== 'Cancelado'
      );
      let hours = 0;
      for (const s of roomSchedules) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        hours += (eh * 60 + em - (sh * 60 + sm)) / 60;
      }
      const occupancyRate = Math.min(100, Math.round((hours / totalWeeklyHoursAvailable) * 100));
      return {
        ...room,
        occupiedHours: hours,
        occupancyRate,
      };
    });
  }, [rooms, schedules]);

  const exportCurrentReport = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'workload') {
      headers = ['Docente', 'Código', 'Categoria', 'Carga Limite', 'Horas Alocadas', 'Aulas Semanais', 'Taxa Ocupação (%)'];
      rows = teacherStats.map(t => [
        t.name, t.code, t.category, `${t.workloadLimit}h`, `${t.scheduledHours}h`, t.lessonCount, `${t.occupancyRate}%`
      ]);
    } else if (reportType === 'dept_occupancy') {
      headers = ['Departamento', 'Código', 'Responsável', 'Horas Alocadas em Salas', 'Aulas Registadas'];
      rows = safeDepartments.map(dept => {
        const deptSchedules = safeSchedules.filter(s => {
          if (s.status === 'Cancelado') return false;
          const sub = safeSubjects.find(sb => sb.id === s.subjectId);
          const t = safeTeachers.find(tc => tc.id === s.teacherId);
          return (sub?.departmentId === dept.id) || (t?.departmentId === dept.id);
        });
        let hours = 0;
        for (const s of deptSchedules) {
          const [sh, sm] = (s.startTime || '08:00').split(':').map(Number);
          const [eh, em] = (s.endTime || '10:00').split(':').map(Number);
          hours += (eh * 60 + em - (sh * 60 + sm)) / 60;
        }
        return [
          dept.name,
          dept.code,
          dept.manager || 'Não atribuído',
          `${hours.toFixed(1)}h`,
          deptSchedules.length
        ];
      });
    } else {
      headers = ['Sala', 'Código', 'Tipo', 'Capacidade', 'Horas Ocupadas (Semana)', 'Taxa de Ocupação (%)'];
      rows = roomStats.map(r => [
        r.name, r.code, r.type, `${r.capacity} lugares`, `${r.occupiedHours}h / 40h`, `${r.occupancyRate}%`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${reportType}_sghd.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Módulo 23 & 24 (PDF Seções 23, 24)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Relatórios Institucionais e Ocupação
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Relatórios e Estatísticas Académicas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Análise quantitativa de alocação de docentes, taxas de utilização de salas e indicadores pedagógicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isManager && (
              <button
                id="btn-reports-export-dashboard-pdf"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Exportar Relatório Consolidado do Dashboard em PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Exportar Relatório PDF</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={exportCurrentReport}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            id="tab-report-dept-occupancy"
            onClick={() => setReportType('dept_occupancy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              reportType === 'dept_occupancy' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ocupação por Departamento (Gráficos)</span>
          </button>
          <button
            id="tab-report-occupancy"
            onClick={() => setReportType('occupancy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              reportType === 'occupancy' 
                ? 'bg-indigo-600 text-white font-semibold shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Taxa de Ocupação das Salas</span>
          </button>
          <button
            id="tab-report-workload"
            onClick={() => setReportType('workload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              reportType === 'workload' 
                ? 'bg-indigo-600 text-white font-semibold shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Carga Horária dos Docentes</span>
          </button>
        </div>
      </div>

      {/* RENDER REPORT */}
      {reportType === 'dept_occupancy' ? (
        <RoomOccupancyByDepartmentChart
          rooms={safeRooms}
          schedules={safeSchedules}
          subjects={safeSubjects}
          departments={safeDepartments}
          teachers={safeTeachers}
        />
      ) : reportType === 'workload' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Relatório Consolidado de Carga Horária Docente
            </h3>
            <span className="text-xs text-slate-500">
              {teachers.length} docentes avaliados
            </span>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Docente</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Carga Contratual</th>
                <th className="py-3 px-4">Horas Lecionadas</th>
                <th className="py-3 px-4">Aulas Semanais</th>
                <th className="py-3 px-4">Utilização (%)</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherStats.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {t.name} <span className="text-slate-400 font-normal">({t.code})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{t.category}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{t.workloadLimit}h / semana</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.scheduledHours}h</td>
                  <td className="py-3 px-4 text-slate-700">{t.lessonCount} aulas</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${t.isOverloaded ? 'bg-rose-500' : 'bg-indigo-600'}`}
                          style={{ width: `${Math.min(100, t.occupancyRate)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{t.occupancyRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {t.isOverloaded ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                        Sobrecarga (RN06)
                      </span>
                    ) : t.scheduledHours === 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Sem Aulas
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                        Regular
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Taxa de Ocupação dos Espaços Físicos e Salas (Base 40h/sem)
            </h3>
            <span className="text-xs text-slate-500">
              {rooms.length} salas monitorizadas
            </span>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sala</th>
                <th className="py-3 px-4">Edifício / Piso</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Capacidade</th>
                <th className="py-3 px-4">Horas Ocupadas</th>
                <th className="py-3 px-4">Taxa de Ocupação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomStats.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {r.name} <span className="text-slate-400 font-normal">({r.code})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{r.building}, {r.floor}</td>
                  <td className="py-3 px-4 text-slate-700">{r.type}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{r.capacity} lugares</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.occupiedHours}h / 40h</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${r.occupancyRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{r.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentUser && (
        <DashboardExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          currentUser={currentUser}
          teachers={safeTeachers}
          subjects={safeSubjects}
          classes={safeClasses}
          rooms={safeRooms}
          schedules={safeSchedules}
          conflicts={conflicts}
          changeRequests={changeRequests}
          periods={periods}
          onExportSuccess={() => {
            if (onExportSuccess) onExportSuccess();
          }}
        />
      )}

    </div>
  );
};
