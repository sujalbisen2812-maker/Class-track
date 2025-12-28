import React from 'react';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';
import StatusBadge from './StatusBadge';

interface StudentRowProps {
  student: Student;
  record: AttendanceRecord | undefined;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ student, record, onStatusChange }) => {
  const currentStatus = record?.status || AttendanceStatus.PRESENT; // Default to Present visually if unset, though usually we init explicitly

  const handleCycleStatus = () => {
    const statuses = Object.values(AttendanceStatus);
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(student.id, nextStatus);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm gap-4">
      <div className="flex items-center gap-3">
        <img 
          src={student.avatarUrl} 
          alt={student.name} 
          className="w-10 h-10 rounded-full object-cover border border-slate-100"
        />
        <div>
          <h3 className="font-medium text-slate-900">{student.name}</h3>
          <p className="text-xs text-slate-500">{student.studentId}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {/* Mobile: Tap to cycle, Desktop: Buttons */}
        <div className="sm:hidden w-full">
            <StatusBadge status={currentStatus} onClick={handleCycleStatus} interactive={true} />
        </div>

        <div className="hidden sm:flex gap-2">
           {Object.values(AttendanceStatus).map((status) => (
             <button
               key={status}
               onClick={() => onStatusChange(student.id, status)}
               className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                 ${currentStatus === status 
                   ? 'bg-slate-900 text-white shadow-md' 
                   : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
             >
               {status.charAt(0) + status.slice(1).toLowerCase()}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

export default StudentRow;