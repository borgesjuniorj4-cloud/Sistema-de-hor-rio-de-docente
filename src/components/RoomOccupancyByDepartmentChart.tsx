import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';
import { 
  Building2, School, Clock, Layers, Filter, 
  BarChart3, CheckCircle2, TrendingUp, Info
} from 'lucide-react';
import { Room, ScheduleItem, Subject, Department, Teacher } from '../types';

interface RoomOccupancyByDepartmentChartProps {
  rooms: Room[];
  schedules: ScheduleItem[];
  subjects: Subject[];
  departments: Department[];
  teachers?: Teacher[];
}

// Consistent and distinct departmental palette
const DEPARTMENT_COLORS: Record<string, string> = {
  'dep-inf': '#4f46e5', // Indigo
  'dep-mat': '#059669', // Emerald
  'dep-eco': '#d97706', // Amber
  'dep-eng': '#7c3aed', // Violet
  'default_0': '#2563eb', // Blue
  'default_1': '#0891b2', // Cyan
  'default_2': '#e11d48', // Rose
  'default_3': '#0d9488', // Teal
  'default_4': '#64748b', // Slate
};

export const RoomOccupancyByDepartmentChart: React.FC<RoomOccupancyByDepartmentChartProps> = ({
  rooms = [],
  schedules = [],
  subjects = [],
  departments = [],
  teachers = [],
}) => {
  const [viewMode, setViewMode] = useState<'stacked_rooms' | 'by_department' | 'by_room_type'>('stacked_rooms');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Map of departments for quick lookup and assign colors
  const deptMap = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach(d => map.set(d.id, d));
    return map;
  }, [departments]);

  const getDeptColor = (deptId: string, index = 0): string => {
    if (DEPARTMENT_COLORS[deptId]) return DEPARTMENT_COLORS[deptId];
    const fallbackKeys = ['default_0', 'default_1', 'default_2', 'default_3', 'default_4'];
    return DEPARTMENT_COLORS[fallbackKeys[index % fallbackKeys.length]];
  };

  // Pre-calculate valid schedule hours
  const validSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (s.status === 'Cancelado') return false;
      if (selectedDayFilter !== 'all' && s.dayOfWeek !== selectedDayFilter) return false;

      // Find subject / teacher to get department
      const subject = subjects.find(sub => sub.id === s.subjectId);
      const teacher = teachers.find(t => t.id === s.teacherId);
      const deptId = subject?.departmentId || teacher?.departmentId || 'outros';

      if (selectedDeptFilter !== 'all' && deptId !== selectedDeptFilter) return false;

      // Room type filter
      const room = rooms.find(r => r.id === s.roomId);
      if (selectedRoomTypeFilter !== 'all' && room && room.type !== selectedRoomTypeFilter) return false;

      return true;
    });
  }, [schedules, subjects, teachers, rooms, selectedDayFilter, selectedDeptFilter, selectedRoomTypeFilter]);

  // Helper to compute hours for a schedule item
  const getScheduleDurationHours = (s: ScheduleItem): number => {
    const [sh, sm] = (s.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (s.endTime || '10:00').split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  // 1. DATA FOR VIEW: Stacked Rooms (Rooms on X-axis, hours divided by department)
  const stackedRoomsData = useMemo(() => {
    const filteredRooms = rooms.filter(r => {
      if (selectedRoomTypeFilter !== 'all' && r.type !== selectedRoomTypeFilter) return false;
      return true;
    });

    return filteredRooms.map(room => {
      const roomSchedules = validSchedules.filter(s => s.roomId === room.id);
      
      const row: Record<string, any> = {
        roomId: room.id,
        roomCode: room.code || room.name,
        roomName: room.name,
        roomType: room.type,
        capacity: room.capacity,
        totalHours: 0,
      };

      // Calculate hours per department for this room
      departments.forEach(dept => {
        row[dept.code] = 0;
      });
      row['OUTROS'] = 0;

      roomSchedules.forEach(s => {
        const subject = subjects.find(sub => sub.id === s.subjectId);
        const teacher = teachers.find(t => t.id === s.teacherId);
        const deptId = subject?.departmentId || teacher?.departmentId || '';
        const dept = deptMap.get(deptId);
        const deptKey = dept ? dept.code : 'OUTROS';
        const hours = getScheduleDurationHours(s);

        row[deptKey] = (row[deptKey] || 0) + hours;
        row.totalHours += hours;
      });

      // Occupancy percentage based on 40h standard week
      row.occupancyRate = Math.min(100, Math.round((row.totalHours / 40) * 100));

      return row;
    });
  }, [rooms, validSchedules, departments, subjects, teachers, deptMap, selectedRoomTypeFilter]);

  // 2. DATA FOR VIEW: By Department (Departments on X-axis, total room hours used)
  const byDepartmentData = useMemo(() => {
    const map = new Map<string, {
      deptId: string;
      deptCode: string;
      deptName: string;
      totalHours: number;
      roomsUsed: Set<string>;
      lessonsCount: number;
      color: string;
    }>();

    departments.forEach((dept, idx) => {
      map.set(dept.id, {
        deptId: dept.id,
        deptCode: dept.code,
        deptName: dept.name,
        totalHours: 0,
        roomsUsed: new Set<string>(),
        lessonsCount: 0,
        color: getDeptColor(dept.id, idx),
      });
    });

    validSchedules.forEach(s => {
      const subject = subjects.find(sub => sub.id === s.subjectId);
      const teacher = teachers.find(t => t.id === s.teacherId);
      const deptId = subject?.departmentId || teacher?.departmentId || '';
      
      const item = map.get(deptId);
      if (item) {
        const hours = getScheduleDurationHours(s);
        item.totalHours += hours;
        item.lessonsCount += 1;
        if (s.roomId) item.roomsUsed.add(s.roomId);
      }
    });

    return Array.from(map.values()).map(d => ({
      deptId: d.deptId,
      deptCode: d.deptCode,
      deptName: d.deptName,
      totalHours: Number(d.totalHours.toFixed(1)),
      roomsCount: d.roomsUsed.size,
      lessonsCount: d.lessonsCount,
      color: d.color,
    }));
  }, [departments, validSchedules, subjects, teachers]);

  // 3. DATA FOR VIEW: By Room Type per Department
  const byRoomTypeData = useMemo(() => {
    const roomTypes = ['Sala normal', 'Laboratório', 'Auditório', 'Sala de informática'];
    return roomTypes.map(type => {
      const row: Record<string, any> = {
        roomType: type,
        totalHours: 0,
      };

      departments.forEach(dept => {
        row[dept.code] = 0;
      });

      validSchedules.forEach(s => {
        const room = rooms.find(r => r.id === s.roomId);
        if (room && room.type === type) {
          const subject = subjects.find(sub => sub.id === s.subjectId);
          const teacher = teachers.find(t => t.id === s.teacherId);
          const deptId = subject?.departmentId || teacher?.departmentId || '';
          const dept = deptMap.get(deptId);
          if (dept) {
            const hours = getScheduleDurationHours(s);
            row[dept.code] = (row[dept.code] || 0) + hours;
            row.totalHours += hours;
          }
        }
      });

      return row;
    });
  }, [validSchedules, rooms, departments, subjects, teachers, deptMap]);

  // Global KPIs for summary header
  const totalAllocatedHours = useMemo(() => {
    return validSchedules.reduce((acc, s) => acc + getScheduleDurationHours(s), 0);
  }, [validSchedules]);

  const topDepartment = useMemo(() => {
    if (byDepartmentData.length === 0) return null;
    return [...byDepartmentData].sort((a, b) => b.totalHours - a.totalHours)[0];
  }, [byDepartmentData]);

  const topRoom = useMemo(() => {
    if (stackedRoomsData.length === 0) return null;
    return [...stackedRoomsData].sort((a, b) => b.totalHours - a.totalHours)[0];
  }, [stackedRoomsData]);

  const averageHoursPerRoom = useMemo(() => {
    if (stackedRoomsData.length === 0) return 0;
    const total = stackedRoomsData.reduce((acc, r) => acc + r.totalHours, 0);
    return (total / stackedRoomsData.length).toFixed(1);
  }, [stackedRoomsData]);

  // Custom Tooltip for Stacked Rooms
  const CustomStackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const room = rooms.find(r => (r.code || r.name) === label);
      const totalInRoom = payload.reduce((acc: number, entry: any) => acc + (Number(entry.value) || 0), 0);

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
            <div>
              <p className="font-bold text-sm text-slate-100">{room?.name || label}</p>
              <p className="text-[11px] text-slate-400">{room?.building} • {room?.type}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-700/50">
              {totalInRoom}h
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Ocupação por Departamento:
            </p>
            {payload
              .filter((entry: any) => Number(entry.value) > 0)
              .map((entry: any) => {
                const dept = departments.find(d => d.code === entry.dataKey);
                const pct = totalInRoom > 0 ? Math.round((Number(entry.value) / totalInRoom) * 100) : 0;
                return (
                  <div key={entry.dataKey} className="flex items-center justify-between text-[11px] gap-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="truncate font-medium text-slate-200">
                        {dept ? dept.name : entry.dataKey}:
                      </span>
                    </div>
                    <span className="font-bold text-slate-100 shrink-0">
                      {entry.value}h <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Capacidade: {room?.capacity || 0} lugares</span>
            <span>Taxa Semanal: {Math.round((totalInRoom / 40) * 100)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total de Horas Alocadas</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalAllocatedHours}h</span>
            <span className="text-xs text-slate-500 font-medium">semana letiva</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Distribuição em {validSchedules.length} blocos de aulas
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Maior Ocupante de Salas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 truncate">
              {topDepartment?.deptCode || 'N/D'}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {topDepartment?.totalHours || 0}h
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {topDepartment?.deptName || 'Nenhum departamento com aulas'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Sala Mais Requisitada</span>
            <School className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 truncate">
              {topRoom?.roomCode || 'N/D'}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {topRoom?.totalHours || 0}h / 40h
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {topRoom?.roomName || 'Sem ocupação'} ({topRoom?.roomType})
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Média de Carga por Sala</span>
            <BarChart3 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{averageHoursPerRoom}h</span>
            <span className="text-xs text-slate-500">por espaço físico</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Base para cálculo de eficiência institucional
          </p>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Ocupação Horária das Salas por Departamento
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualização interativa das horas letivas semanais alocadas por cada departamento nos diferentes espaços físicos.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                id="btn-chart-view-stacked-rooms"
                type="button"
                onClick={() => setViewMode('stacked_rooms')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'stacked_rooms'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Sala (Empilhado)
              </button>
              <button
                id="btn-chart-view-by-department"
                type="button"
                onClick={() => setViewMode('by_department')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'by_department'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total por Departamento
              </button>
              <button
                id="btn-chart-view-by-room-type"
                type="button"
                onClick={() => setViewMode('by_room_type')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'by_room_type'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Tipo de Sala
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filtrar dados:</span>
            </div>

            {/* Department filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-dept-filter" className="text-slate-500 font-normal">Departamento:</label>
              <select
                id="select-dept-filter"
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">Todos os Departamentos</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Room Type filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-room-type-filter" className="text-slate-500 font-normal">Tipo de Sala:</label>
              <select
                id="select-room-type-filter"
                value={selectedRoomTypeFilter}
                onChange={(e) => setSelectedRoomTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                <option value="Laboratório">Laboratório</option>
                <option value="Sala normal">Sala normal</option>
                <option value="Auditório">Auditório</option>
                <option value="Sala de informática">Sala de informática</option>
              </select>
            </div>

            {/* Day of Week filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-day-filter" className="text-slate-500 font-normal">Dia da Semana:</label>
              <select
                id="select-day-filter"
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">Todos os Dias (Seg - Sex)</option>
                <option value="Segunda">Segunda-feira</option>
                <option value="Terça">Terça-feira</option>
                <option value="Quarta">Quarta-feira</option>
                <option value="Quinta">Quinta-feira</option>
                <option value="Sexta">Sexta-feira</option>
              </select>
            </div>

            {(selectedDeptFilter !== 'all' || selectedRoomTypeFilter !== 'all' || selectedDayFilter !== 'all') && (
              <button
                id="btn-clear-chart-filters"
                onClick={() => {
                  setSelectedDeptFilter('all');
                  setSelectedRoomTypeFilter('all');
                  setSelectedDayFilter('all');
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline ml-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="p-4 sm:p-6">
          
          {/* VIEW 1: STACKED ROOMS */}
          {viewMode === 'stacked_rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-700">
                  Horas Ocupadas por Sala com Decomposição por Departamento (Semanal)
                </span>
                <span className="text-[11px] text-slate-400">
                  Eixo Y: Horas semanais (h) • Capacidade semanal padrão: 40h
                </span>
              </div>

              <div className="h-84 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stackedRoomsData}
                    margin={{ top: 15, right: 20, left: -10, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="roomCode" 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: 11 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      unit="h"
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomStackedTooltip />} />
                    <Legend 
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                    />
                    {departments.map((dept, idx) => (
                      <Bar
                        key={dept.id}
                        dataKey={dept.code}
                        name={`${dept.code} (${dept.name.replace('Departamento de ', '')})`}
                        stackId="a"
                        fill={getDeptColor(dept.id, idx)}
                        radius={[0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Cada coluna representa uma sala física. As cores empilhadas representam a proporção de horas que cada departamento ocupa no espaço. Passe o cursor sobre uma barra para inspecionar os detalhes e percentuais exatos.
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: BY DEPARTMENT TOTAL */}
          {viewMode === 'by_department' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-700">
                  Volume Total de Horas de Sala Utilizadas por Cada Departamento
                </span>
                <span className="text-[11px] text-slate-400">
                  Total de salas distintas e horas atribuídas
                </span>
              </div>

              <div className="h-84 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byDepartmentData}
                    margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="deptCode" 
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: 11 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      unit="h"
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} horas de sala`, 'Carga Alocada']}
                      labelFormatter={(label: any) => {
                        const d = departments.find(dept => dept.code === label);
                        return d ? `${d.name} (${d.code})` : label;
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        border: '1px solid #334155',
                        fontSize: '12px',
                      }}
                    />
                    <Bar 
                      dataKey="totalHours" 
                      name="Horas Alocadas em Salas" 
                      radius={[6, 6, 0, 0]}
                    >
                      {byDepartmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {byDepartmentData.map(d => (
                  <div key={d.deptId} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="font-bold text-xs text-slate-800">{d.deptCode}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{d.totalHours}h</p>
                    <p className="text-[11px] text-slate-500">
                      Utiliza <strong>{d.roomsCount}</strong> salas distintas ({d.lessonsCount} aulas)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: BY ROOM TYPE */}
          {viewMode === 'by_room_type' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-700">
                  Ocupação Horária por Tipologia de Espaço (Laboratórios vs Salas vs Auditórios)
                </span>
                <span className="text-[11px] text-slate-400">
                  Eixo Y: Horas semanais por tipo de sala
                </span>
              </div>

              <div className="h-84 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byRoomTypeData}
                    margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="roomType" 
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: 11 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      unit="h"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        border: '1px solid #334155',
                        fontSize: '12px',
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                    />
                    {departments.map((dept, idx) => (
                      <Bar
                        key={dept.id}
                        dataKey={dept.code}
                        name={`${dept.code} - ${dept.name.replace('Departamento de ', '')}`}
                        fill={getDeptColor(dept.id, idx)}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* Detailed Breakdown Table */}
        <div className="border-t border-slate-200">
          <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              Tabela de Distribuição Departamental das Salas
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              {departments.length} departamentos cadastrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Departamento</th>
                  <th className="py-2.5 px-4">Responsável</th>
                  <th className="py-2.5 px-4">Carga em Salas</th>
                  <th className="py-2.5 px-4">% do Uso Institucional</th>
                  <th className="py-2.5 px-4">Salas Distintas</th>
                  <th className="py-2.5 px-4">Aulas Semanais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byDepartmentData.map((d, index) => {
                  const dept = departments.find(dep => dep.id === d.deptId);
                  const percentage = totalAllocatedHours > 0 
                    ? Math.round((d.totalHours / totalAllocatedHours) * 100) 
                    : 0;

                  return (
                    <tr key={d.deptId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: d.color }}
                          ></span>
                          <div>
                            <span>{d.deptName}</span>
                            <span className="text-slate-400 font-normal ml-1.5">({d.deptCode})</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {dept?.manager || 'Não atribuído'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {d.totalHours}h
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: d.color }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {d.roomsCount} salas
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.lessonsCount} aulas
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
