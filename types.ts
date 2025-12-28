export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface Student {
  id: string;
  name: string;
  studentId: string; // e.g., "S12345"
  avatarUrl: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface DailyAttendance {
  date: string; // ISO string YYYY-MM-DD
  courseId: string;
  records: AttendanceRecord[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  schedule: string;
  students: Student[];
}

export interface AnalysisResult {
  summary: string;
  atRiskStudents: string[];
  recommendations: string[];
}