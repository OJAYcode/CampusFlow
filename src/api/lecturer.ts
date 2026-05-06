/* eslint-disable @typescript-eslint/no-explicit-any, simple-import-sort/imports */
import { apiClient } from "@/src/api/client";
import type {
  Announcement,
  ApiEnvelope,
  AttendanceSession,
  AttendanceSessionLiveView,
  Assessment,
  AssessmentAttempt,
  Assignment,
  AssignmentSubmission,
  Course,
  CourseAttendancePercentageReport,
  Material,
  Message,
  User,
} from "@/src/types/domain";

export const lecturerApi = {
  courses: () => apiClient.get<ApiEnvelope<Array<{ _id: string; course: Course }>>>("/lecturers/courses").then((res) => res.data),
  workspace: (courseId: string) =>
    apiClient.get<ApiEnvelope<{
      materials: Material[];
      assignments: Assignment[];
      assessments: Assessment[];
      announcements: Announcement[];
    }>>(`/lecturers/courses/${courseId}/workspace`).then((res) => res.data),
  courseStudents: (courseId: string) =>
    apiClient
      .get<ApiEnvelope<{
        course: Pick<Course, "_id" | "code" | "title" | "department" | "level">;
        approvedStudents: Array<Pick<User, "_id" | "fullName" | "email" | "matricNumber" | "department" | "level">>;
        cohortStudents: Array<Pick<User, "_id" | "fullName" | "email" | "matricNumber" | "department" | "level">>;
      }>>(`/lecturers/courses/${courseId}/students`)
      .then((res) => res.data),
  courseReport: (courseId: string) =>
    apiClient.get<ApiEnvelope<any>>(`/lecturers/courses/${courseId}/report`).then((res) => res.data),
  exportCourseReportCsv: (courseId: string) =>
    apiClient.get(`/lecturers/courses/${courseId}/report.csv`, { responseType: "blob" }),
  exportCourseReportPdf: (courseId: string) =>
    apiClient.get(`/lecturers/courses/${courseId}/report.pdf`, { responseType: "blob" }),
  attendanceSessions: (payload: Record<string, unknown>) =>
    apiClient.post<ApiEnvelope<AttendanceSession>>("/lecturers/attendance-sessions", payload).then((res) => res.data),
  lecturerAttendanceSessions: () =>
    apiClient.get<ApiEnvelope<AttendanceSession[]>>("/lecturers/attendance-sessions").then((res) => res.data),
  endAttendanceSession: (sessionId: string) =>
    apiClient.patch<ApiEnvelope<AttendanceSession>>(`/lecturers/attendance-sessions/${sessionId}/end`).then((res) => res.data),
  cancelAttendanceSession: (sessionId: string) =>
    apiClient.patch<ApiEnvelope<AttendanceSession>>(`/lecturers/attendance-sessions/${sessionId}/cancel`).then((res) => res.data),
  attendanceSessionLive: (sessionId: string) =>
    apiClient
      .get<ApiEnvelope<AttendanceSessionLiveView>>(`/lecturers/attendance-sessions/${sessionId}/live`)
      .then((res) => res.data),
  exportAttendanceSessionCsv: (sessionId: string) =>
    apiClient.get(`/lecturers/attendance-sessions/${sessionId}/export.csv`, { responseType: "blob" }),
  exportAttendanceSessionDocx: (sessionId: string) =>
    apiClient.get(`/lecturers/attendance-sessions/${sessionId}/export.docx`, { responseType: "blob" }),
  exportAttendanceSessionPdf: (sessionId: string) =>
    apiClient.get(`/lecturers/attendance-sessions/${sessionId}/export.pdf`, { responseType: "blob" }),
  attendancePercentages: (courseId: string) =>
    apiClient.get<ApiEnvelope<CourseAttendancePercentageReport>>(`/lecturers/courses/${courseId}/attendance-percentages`).then((res) => res.data),
  createAssignment: (payload: FormData) =>
    apiClient.post<ApiEnvelope<Assignment>>("/lecturers/assignments", payload).then((res) => res.data),
  updateAssignment: (assignmentId: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<Assignment>>(`/lecturers/assignments/${assignmentId}`, payload).then((res) => res.data),
  deleteAssignment: (assignmentId: string) =>
    apiClient.delete<ApiEnvelope<Assignment>>(`/lecturers/assignments/${assignmentId}`).then((res) => res.data),
  submissions: (assignmentId: string) =>
    apiClient.get<ApiEnvelope<AssignmentSubmission[]>>(`/lecturers/assignments/${assignmentId}/submissions`).then((res) => res.data),
  gradeSubmission: (submissionId: string, payload: { grade: number; feedback?: string }) =>
    apiClient.patch<ApiEnvelope<AssignmentSubmission>>(`/lecturers/submissions/${submissionId}/grade`, payload).then((res) => res.data),
  createAssessment: (payload: Record<string, unknown>) =>
    apiClient.post<ApiEnvelope<Assessment>>("/lecturers/assessments", payload).then((res) => res.data),
  assessments: () =>
    apiClient.get<ApiEnvelope<Assessment[]>>("/lecturers/assessments").then((res) => res.data),
  updateAssessment: (assessmentId: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<Assessment>>(`/lecturers/assessments/${assessmentId}`, payload).then((res) => res.data),
  deleteAssessment: (assessmentId: string) =>
    apiClient.delete<ApiEnvelope<Assessment>>(`/lecturers/assessments/${assessmentId}`).then((res) => res.data),
  assessmentAttempts: (assessmentId: string) =>
    apiClient.get<ApiEnvelope<AssessmentAttempt[]>>(`/lecturers/assessments/${assessmentId}/attempts`).then((res) => res.data),
  createAnnouncement: (payload: Record<string, unknown>) =>
    apiClient.post<ApiEnvelope<Announcement>>("/lecturers/announcements", payload).then((res) => res.data),
  announcements: () =>
    apiClient.get<ApiEnvelope<Announcement[]>>("/lecturers/announcements").then((res) => res.data),
  updateAnnouncement: (announcementId: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<Announcement>>(`/lecturers/announcements/${announcementId}`, payload).then((res) => res.data),
  deleteAnnouncement: (announcementId: string) =>
    apiClient.delete<ApiEnvelope<Announcement>>(`/lecturers/announcements/${announcementId}`).then((res) => res.data),
  sendMessage: (payload: Record<string, unknown>) =>
    apiClient.post<ApiEnvelope<Message>>("/lecturers/messages", payload).then((res) => res.data),
  messages: () => apiClient.get<ApiEnvelope<Message[]>>("/lecturers/messages").then((res) => res.data),
  uploadMaterial: (payload: FormData) =>
    apiClient.post<ApiEnvelope<Material>>("/lecturers/materials", payload).then((res) => res.data),
  deleteMaterial: (materialId: string) =>
    apiClient.delete<ApiEnvelope<Material>>(`/lecturers/materials/${materialId}`).then((res) => res.data),
};
