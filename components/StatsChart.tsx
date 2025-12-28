import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AttendanceStatus, DailyAttendance } from '../types';

interface StatsChartProps {
  currentRecords: DailyAttendance;
}

const StatsChart: React.FC<StatsChartProps> = ({ currentRecords }) => {
  const counts = {
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.ABSENT]: 0,
    [AttendanceStatus.LATE]: 0,
    [AttendanceStatus.EXCUSED]: 0,
  };

  currentRecords.records.forEach(r => {
    counts[r.status]++;
  });

  const data = [
    { name: 'Present', value: counts[AttendanceStatus.PRESENT], color: '#10b981' }, // Emerald-500
    { name: 'Absent', value: counts[AttendanceStatus.ABSENT], color: '#f43f5e' },  // Rose-500
    { name: 'Late', value: counts[AttendanceStatus.LATE], color: '#f59e0b' },    // Amber-500
    { name: 'Excused', value: counts[AttendanceStatus.EXCUSED], color: '#3b82f6' }, // Blue-500
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;