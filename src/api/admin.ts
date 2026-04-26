/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/src/api/client";
import type { AcademicUnit, ApiEnvelope, AttendanceRecord, AttendanceSession, AttendanceSessionLiveView, Course, CourseAttendancePercentageReport, SeededLecturer, User } from "@/src/types/domain";

export const adminApi = {
  dashboard: () => apiClient.get<ApiEnvelope<Record<string, number>>>("/admin/dashboard").then((res) => res.data),
  faculties: () => apiClient.get<ApiEnvelope<AcademicUnit[]>>("/admin/faculties").then((res) => res.data),
  createFaculty: (payload: { name: string; code: string }) =>
    apiClient.post<ApiEnvelope<AcademicUnit>>("/admin/faculties", payload).then((res) => res.data),
  updateFaculty: (id: string, payload: { name: string; code: string }) =>
    apiClient.patch<ApiEnvelope<AcademicUnit>>(`/admin/faculties/${id}`, payload).then((res) => res.data),
  deleteFaculty: (id: string) =>
    apiClient.delete<ApiEnvelope<AcademicUnit>>(`/admin/faculties/${id}`).then((res) => res.data),
  departments: () => apiClient.get<ApiEnvelope<AcademicUnit[]>>("/admin/departments").then((res) => res.data),
  createDepartment: (payload: { name: string; code: string; faculty: string }) =>
    apiClient.post<ApiEnvelope<AcademicUnit>>("/admin/departments", payload).then((res) => res.data),
  updateDepartment: (id: string, payload: { name: string; code: string; faculty: string }) =>
    apiClient.patch<ApiEnvelope<AcademicUnit>>(`/admin/departments/${id}`, payload).then((res) => res.data),
  deleteDepartment: (id: string) =>
    apiClient.delete<ApiEnvelope<AcademicUnit>>(`/admin/departments/${id}`).then((res) => res.data),
  students: () => apiClient.get<ApiEnvelope<User[]>>("/admin/students").then((res) => res.data),
  seededStudents: () => apiClient.get<ApiEnvelope<any[]>>("/admin/seeded-students").then((res) => res.data),
  seedStudents: (students: Array<Record<string, unknown>>) =>
    apiClient.post<ApiEnvelope<any>>("/admin/students/seed", { students }).then((res) => res.data),
  updateSeededStudent: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<any>>(`/admin/seeded-students/${id}`, payload).then((res) => res.data),
  deleteSeededStudent: (id: string) =>
    apiClient.delete<ApiEnvelope<any>>(`/admin/seeded-students/${id}`).then((res) => res.data),
  seededLecturers: () =>
    apiClient.get<ApiEnvelope<SeededLecturer[]>>("/admin/seeded-lecturers").then((res) => res.data),
  seedLecturers: (lecturers: Array<Record<string, unknown>>) =>
    apiClient.post<ApiEnvelope<any>>("/admin/lecturers/seed", { lecturers }).then((res) => res.data),
  updateSeededLecturer: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<SeededLecturer>>(`/admin/seeded-lecturers/${id}`, payload).then((res) => res.data),
  deleteSeededLecturer: (id: string) =>
    apiClient.delete<ApiEnvelope<SeededLecturer>>(`/admin/seeded-lecturers/${id}`).then((res) => res.data),
  lecturers: () => apiClient.get<ApiEnvelope<User[]>>("/admin/lecturers").then((res) => res.data),
  createLecturer: (payload: { fullName: string; email: string; password: string }) =>
    apiClient.post<ApiEnvelope<User>>("/admin/lecturers", payload).then((res) => res.data),
  updateLecturer: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<User>>(`/admin/lecturers/${id}`, payload).then((res) => res.data),
  deleteLecturer: (id: string) =>
    apiClient.delete<ApiEnvelope<User>>(`/admin/lecturers/${id}`).then((res) => res.data),
  createAdmin: (payload: { fullName: string; email: string; password: string }) =>
    apiClient.post<ApiEnvelope<User>>("/admin/admins", payload).then((res) => res.data),
  courses: () => apiClient.get<ApiEnvelope<Course[]>>("/admin/courses").then((res) => res.data),
  createCourse: (payload: Record<string, unknown>) =>
    apiClient.post<ApiEnvelope<Course>>("/admin/courses", payload).then((res) => res.data),
  courseDetail: (id: string) => apiClient.get<ApiEnvelope<any>>(`/admin/courses/${id}`).then((res) => res.data),
  updateCourse: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<Course>>(`/admin/courses/${id}`, payload).then((res) => res.data),
  deleteCourse: (id: string) =>
    apiClient.delete<ApiEnvelope<Course>>(`/admin/courses/${id}`).then((res) => res.data),
  assignLecturer: (payload: { courseId: string; lecturerId: string; permissions?: string[] }) =>
    apiClient.post<ApiEnvelope<any>>("/admin/course-lecturers", payload).then((res) => res.data),
  communications: () => apiClient.get<ApiEnvelope<any>>("/admin/communications").then((res) => res.data),
  auditLogs: () => apiClient.get<ApiEnvelope<any[]>>("/admin/audit-logs").then((res) => res.data),
  attendanceSessions: () =>
    apiClient.get<ApiEnvelope<AttendanceSession[]>>("/admin/attendance-sessions").then((res) => res.data),
  attendanceSessionLive: (id: string) =>
    apiClient.get<ApiEnvelope<AttendanceSessionLiveView>>(`/admin/attendance-sessions/${id}/live`).then((res) => res.data),
  updateAttendanceSession: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<ApiEnvelope<AttendanceSession>>(`/admin/attendance-sessions/${id}`, payload).then((res) => res.data),
  cancelAttendanceSession: (id: string) =>
    apiClient.patch<ApiEnvelope<AttendanceSession>>(`/admin/attendance-sessions/${id}/cancel`).then((res) => res.data),
  deleteAttendanceSession: (id: string) =>
    apiClient.delete<ApiEnvelope<AttendanceSession>>(`/admin/attendance-sessions/${id}`).then((res) => res.data),
  exportAttendanceSessionCsv: (id: string) =>
    apiClient.get(`/admin/attendance-sessions/${id}/export.csv`, { responseType: "blob" }),
  exportAttendanceSessionDocx: (id: string) =>
    apiClient.get(`/admin/attendance-sessions/${id}/export.docx`, { responseType: "blob" }),
  exportAttendanceSessionPdf: (id: string) =>
    apiClient.get(`/admin/attendance-sessions/${id}/export.pdf`, { responseType: "blob" }),
  attendanceRecords: () =>
    apiClient.get<ApiEnvelope<AttendanceRecord[]>>("/admin/attendance-records").then((res) => res.data),
  materials: () => apiClient.get<ApiEnvelope<any[]>>("/admin/materials").then((res) => res.data),
  assignments: () => apiClient.get<ApiEnvelope<any[]>>("/admin/assignments").then((res) => res.data),
  assessmentAttempts: () =>
    apiClient.get<ApiEnvelope<any[]>>("/admin/assessment-attempts").then((res) => res.data),
  electiveRequests: () => apiClient.get<ApiEnvelope<any[]>>("/admin/elective-requests").then((res) => res.data),
  approveElectiveRequest: (enrollmentId: string, payload: { approvalStatus: "approved" | "rejected"; rejectionReason?: string }) =>
    apiClient.patch<ApiEnvelope<any>>(`/admin/elective-requests/${enrollmentId}`, payload).then((res) => res.data),
  reportsSystem: () => apiClient.get<ApiEnvelope<any>>("/admin/reports/system").then((res) => res.data),
  reportsCourseAttendance: (courseId: string) =>
    apiClient.get<ApiEnvelope<any>>(`/admin/reports/courses/${courseId}/attendance`).then((res) => res.data),
  reportsCourseAttendancePercentages: (courseId: string) =>
    apiClient.get<ApiEnvelope<CourseAttendancePercentageReport>>(`/admin/reports/courses/${courseId}/attendance-percentages`).then((res) => res.data),
  reportsCourseAcademic: (courseId: string) =>
    apiClient.get<ApiEnvelope<any>>(`/admin/reports/courses/${courseId}/academic`).then((res) => res.data),
  reportsEnrollments: () => apiClient.get<ApiEnvelope<any>>("/admin/reports/enrollments").then((res) => res.data),
  reportsAssignments: (courseId: string) =>
    apiClient.get<ApiEnvelope<any>>(`/admin/reports/assignments?courseId=${courseId}`).then((res) => res.data),
  reportsAssessments: (courseId: string) =>
    apiClient.get<ApiEnvelope<any>>(`/admin/reports/assessments?courseId=${courseId}`).then((res) => res.data),
  exportCourseAcademicCsv: (courseId: string) =>
    apiClient.get(`/admin/reports/courses/${courseId}/export.csv`, { responseType: "blob" }),
  exportCourseAcademicPdf: (courseId: string) =>
    apiClient.get(`/admin/reports/courses/${courseId}/export.pdf`, { responseType: "blob" }),
  saveSetting: (payload: { key: string; value: string; description?: string }) =>
    apiClient.post<ApiEnvelope<any>>("/admin/settings", payload).then((res) => res.data),
};
