import React from 'react';
import { AttendanceStatus } from '../types';

interface StatusBadgeProps {
  status: AttendanceStatus;
  onClick?: () => void;
  interactive?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onClick, interactive = false }) => {
  const getStyles = (s: AttendanceStatus) => {
    switch (s) {
      case AttendanceStatus.PRESENT:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case AttendanceStatus.ABSENT:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case AttendanceStatus.LATE:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case AttendanceStatus.EXCUSED:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center justify-center gap-1.5";
  const interactiveClasses = interactive ? "cursor-pointer hover:shadow-md hover:scale-105 select-none" : "";

  return (
    <span 
      onClick={onClick}
      className={`${baseClasses} ${getStyles(status)} ${interactiveClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status === AttendanceStatus.PRESENT ? 'bg-emerald-500' : status === AttendanceStatus.ABSENT ? 'bg-rose-500' : status === AttendanceStatus.LATE ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;