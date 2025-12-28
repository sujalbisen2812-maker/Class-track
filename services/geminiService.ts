import { GoogleGenAI, Type } from "@google/genai";
import { Course, DailyAttendance, AttendanceStatus } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeAttendancePatterns = async (
  course: Course,
  history: DailyAttendance[]
): Promise<string> => {
  // 1. Prepare data summary for the prompt
  const totalClasses = history.length;
  if (totalClasses === 0) return "No attendance data available to analyze.";

  const studentStats = course.students.map(student => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    history.forEach(day => {
      const record = day.records.find(r => r.studentId === student.id);
      if (record) {
        if (record.status === AttendanceStatus.PRESENT) present++;
        else if (record.status === AttendanceStatus.LATE) late++;
        else if (record.status === AttendanceStatus.ABSENT) absent++;
        else if (record.status === AttendanceStatus.EXCUSED) excused++;
      }
    });

    const attendanceRate = ((present + late * 0.5) / totalClasses) * 100;

    return {
      name: student.name,
      present,
      absent,
      late,
      attendanceRate: attendanceRate.toFixed(1) + '%'
    };
  });

  const prompt = `
    Analyze the following class attendance data for the course "${course.name}".
    Total classes held: ${totalClasses}.

    Student Statistics:
    ${JSON.stringify(studentStats, null, 2)}

    Please provide a concise but insightful report.
    1. Identify any general attendance trends.
    2. Flag students who are "At Risk" (low attendance).
    3. Suggest a brief intervention strategy for the most critical cases.
    
    Keep the tone professional and constructive for a teacher.
    Format the output in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an educational data analyst assistant helping a teacher understand student attendance patterns.",
        temperature: 0.3, // Lower temperature for more factual analysis
      }
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to connect to AI service. Please check your API key.";
  }
};

export const generateExcuseNoteSummary = async (notes: string[]): Promise<string> => {
    if (notes.length === 0) return "No notes to summarize.";

    const prompt = `Summarize these absence notes into a single category label or brief reason (e.g., "Medical", "Family Emergency", "Unknown"). Notes: ${JSON.stringify(notes)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "";
    } catch (e) {
        return "Error analyzing notes.";
    }
}
