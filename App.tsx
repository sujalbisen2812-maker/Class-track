import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_COURSES, INITIAL_HISTORY } from './constants';
import { Course, DailyAttendance, AttendanceStatus, AttendanceRecord, Student } from './types';
import StudentRow from './components/StudentRow';
import StatusBadge from './components/StatusBadge';
import StatsChart from './components/StatsChart';
import GeminiReportModal from './components/GeminiReportModal';
import AddStudentModal from './components/AddStudentModal';
import { analyzeAttendancePatterns } from './services/geminiService';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(MOCK_COURSES[0].id);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Flattened history state for simplicity in this demo
  const [history, setHistory] = useState<DailyAttendance[]>(INITIAL_HISTORY);
  
  // Current working state (draft)
  const [currentAttendance, setCurrentAttendance] = useState<DailyAttendance | null>(null);
  
  // AI State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [aiReport, setAiReport] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Add Student State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  // Initialize or fetch attendance for selected date/course
  // Note: Dependency array reduced to prevent resetting work when course details update (like adding a student)
  useEffect(() => {
    const existing = history.find(h => h.date === date && h.courseId === selectedCourseId);
    
    // We access the current version of selectedCourse from the outer scope variables (closure)
    // but we use the ID to find the fresh reference from the courses state if needed inside.
    const courseNow = courses.find(c => c.id === selectedCourseId) || courses[0];

    if (existing) {
      setCurrentAttendance({ ...existing }); // Clone to avoid direct mutation of history state
    } else {
      // Create new draft
      setCurrentAttendance({
        date,
        courseId: selectedCourseId,
        records: courseNow.students.map(s => ({
          studentId: s.id,
          status: AttendanceStatus.PRESENT // Default to present
        }))
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedCourseId]); // Intentionally omitting courses/history to prevent resets during edits

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => {
      if (!prev) return null;
      
      const exists = prev.records.some(r => r.studentId === studentId);
      let newRecords;
      
      if (exists) {
        newRecords = prev.records.map(r => 
          r.studentId === studentId ? { ...r, status } : r
        );
      } else {
        // Handle case where student exists in course but not in record yet (e.g. newly added student in old history view)
        newRecords = [...prev.records, { studentId, status }];
      }

      return { ...prev, records: newRecords };
    });
  }, []);

  const handleSave = () => {
    if (!currentAttendance) return;
    
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.date === date && h.courseId === selectedCourseId));
      return [...filtered, currentAttendance];
    });

    // Visual feedback could go here
    alert("Attendance saved successfully!");
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!currentAttendance) return;
    
    // We must ensure all current students have a record
    const allStudentIds = selectedCourse.students.map(s => s.id);
    
    setCurrentAttendance(prev => {
       if(!prev) return null;
       
       const updatedRecords = allStudentIds.map(sid => {
         const existingRecord = prev.records.find(r => r.studentId === sid);
         return {
           studentId: sid,
           status: status,
           note: existingRecord?.note
         };
       });

       return {
           ...prev,
           records: updatedRecords
       }
    });
  };

  const handleGenerateReport = async () => {
    setIsReportOpen(true);
    setIsAnalyzing(true);
    // Filter history for this course
    const courseHistory = history.filter(h => h.courseId === selectedCourseId);
    
    // Include current draft in analysis if it's new
    const relevantHistory = [...courseHistory];
    const isCurrentInHistory = courseHistory.some(h => h.date === currentAttendance?.date);
    if (!isCurrentInHistory && currentAttendance) {
        relevantHistory.push(currentAttendance);
    }

    const report = await analyzeAttendancePatterns(selectedCourse, relevantHistory);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const handleAddStudent = (name: string, studentId: string) => {
    const newStudent: Student = {
      id: `stu_${Date.now()}`,
      name,
      studentId,
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100` 
    };

    // Update Courses State
    setCourses(prev => prev.map(c => {
      if (c.id === selectedCourseId) {
        return { ...c, students: [...c.students, newStudent] };
      }
      return c;
    }));

    // Immediately add to current attendance draft so they appear editable
    setCurrentAttendance(prev => {
      if (!prev) return null;
      // Prevent duplicates just in case
      if (prev.records.some(r => r.studentId === newStudent.id)) return prev;

      return {
        ...prev,
        records: [
          ...prev.records,
          { studentId: newStudent.id, status: AttendanceStatus.PRESENT }
        ]
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:h-screen sticky top-0 md:fixed z-10 flex flex-col">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2 text-indigo-600">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
               <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.801 6.2a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 2.174v-.224c0-.131.067-.248.182-.311a54.614 54.614 0 014.018-1.629zM4.5 9.05a54.941 54.941 0 0115 0v.5a54.943 54.943 0 01-15 0v-.5z" />
               <path fillRule="evenodd" d="M3.75 12a.75.75 0 01.75.75v4.5c0 .326.104.627.28.875a50.003 50.003 0 0113.44 0c.176-.248.28-.549.28-.875v-4.5a.75.75 0 011.5 0v4.5c0 .878-.456 1.66-1.162 2.132a51.498 51.498 0 01-14.176 0C3.306 18.91 2.25 18.128 2.25 17.25v-4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
             </svg>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">ClassTrack</h1>
           </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">My Courses</p>
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${selectedCourseId === course.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <div className="font-semibold">{course.code}</div>
              <div className="text-sm opacity-80 truncate">{course.name}</div>
              {selectedCourseId === course.id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
             className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
             onClick={() => alert("Settings would go here")}
           >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{selectedCourse.name}</h2>
            <p className="text-slate-500 mt-1">{selectedCourse.schedule} • {selectedCourse.students.length} Students</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
             </div>
             
             <button 
               onClick={handleGenerateReport}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576L8.279 5.044A.75.75 0 019 4.5zM18 15a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 15z" clipRule="evenodd" />
               </svg>
               AI Analysis
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Attendance Sheet */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Quick Actions & Add Student */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-3">
                   <span className="text-sm font-semibold text-slate-700">Mark All:</span>
                   <div className="flex gap-2">
                     {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT].map(status => (
                        <button 
                          key={status}
                          onClick={() => handleMarkAll(status)}
                          className="text-xs px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-600"
                        >
                          {status}
                        </button>
                     ))}
                   </div>
               </div>

               <button
                 onClick={() => setIsAddStudentOpen(true)}
                 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                   <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                 </svg>
                 Add Student
               </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {selectedCourse.students.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  record={currentAttendance?.records.find(r => r.studentId === student.id)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {/* Submit */}
            <div className="pt-4 flex justify-end">
               <button 
                 onClick={handleSave}
                 className="px-8 py-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all font-semibold"
               >
                 Save Attendance
               </button>
            </div>
          </div>

          {/* Side Stats Panel */}
          <div className="lg:col-span-1 space-y-6">
             {/* Today's Overview Card */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Class Overview</h3>
               <div className="relative">
                 {currentAttendance && <StatsChart currentRecords={currentAttendance} />}
               </div>
               <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                    <span className="block text-2xl font-bold text-emerald-600">
                       {currentAttendance?.records.filter(r => r.status === AttendanceStatus.PRESENT).length}
                    </span>
                    <span className="text-xs text-emerald-800 font-medium">Present</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 text-center">
                    <span className="block text-2xl font-bold text-rose-600">
                       {currentAttendance?.records.filter(r => r.status === AttendanceStatus.ABSENT).length}
                    </span>
                    <span className="text-xs text-rose-800 font-medium">Absent</span>
                  </div>
               </div>
             </div>

             {/* Recent Activity Mini Feed (Mock) */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Alerts</h3>
               <ul className="space-y-4">
                 <li className="flex gap-3 text-sm">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0"></div>
                   <div>
                     <span className="font-semibold text-slate-800">Charlie Brown</span>
                     <p className="text-slate-500">Late 3 times this month.</p>
                   </div>
                 </li>
                 <li className="flex gap-3 text-sm">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0"></div>
                   <div>
                     <span className="font-semibold text-slate-800">Low Attendance Alert</span>
                     <p className="text-slate-500">Class average dropped below 85% yesterday.</p>
                   </div>
                 </li>
               </ul>
             </div>
          </div>

        </div>
      </main>

      <GeminiReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        report={aiReport}
        isLoading={isAnalyzing}
      />

      <AddStudentModal 
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAdd={handleAddStudent}
      />
    </div>
  );
};

export default App;