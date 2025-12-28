
import { Course, Student, AttendanceStatus, DailyAttendance } from "./types";

const NAMES = [
  "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
  "Fiona Gallagher", "George Miller", "Hannah Abbott", "Ian Somerhalder", "Julia Roberts"
];

const generateStudents = (count: number): Student[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `stu_${i + 1}`,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i}` : ''),
    studentId: `S${2024000 + i}`,
    avatarUrl: `https://picsum.photos/seed/${i + 100}/100/100`
  }));
};

export const MOCK_COURSES: Course[] = [
  {
    id: "c_1",
    name: "Advanced Mathematics 101",
    code: "MATH101",
    schedule: "Mon/Wed 10:00 AM",
    students: generateStudents(8)
  },
  {
    id: "c_2",
    name: "Chemistry",
    code: "CHEM204",
    schedule: "Tue/Thu 2:00 PM",
    students: generateStudents(12)
  }
];

// Seed some past data for the graph
export const INITIAL_HISTORY: DailyAttendance[] = [
  {
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
    courseId: "c_1",
    records: MOCK_COURSES[0].students.map(s => ({
      studentId: s.id,
      status: Math.random() > 0.2 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT
    }))
  },
  {
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    courseId: "c_1",
    records: MOCK_COURSES[0].students.map(s => ({
      studentId: s.id,
      status: Math.random() > 0.1 ? AttendanceStatus.PRESENT : AttendanceStatus.LATE
    }))
  }
];
