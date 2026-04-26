/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/src/api/client";
import type {
  Announcement,
  ApiEnvelope,
  Assessment,
  AssessmentAttempt,
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  Enrollment,
  Material,
  Message,
  OnlineMaterialResult,
  User,
} from "@/src/types/domain";

export const studentApi = {
  profile: () => apiClient.get<ApiEnvelope<User>>("/students/profile").then((res) => res.data),
  updateProfile: (payload: { fullName?: string; email?: string; phone?: string }) =>
    apiClient.patch<ApiEnvelope<User>>("/students/profile", payload).then((res) => res.data),
  electives: () => apiClient.get<ApiEnvelope<any[]>>("/students/electives").then((res) => res.data),
  selectElectives: (courseIds: string[]) =>
    apiClient.post<ApiEnvelope<any>>("/students/electives", { courseIds }).then((res) => res.data),
  enrollments: () =>
    apiClient.get<ApiEnvelope<Enrollment[]>>("/students/enrollments").then((res) => res.data),
  materials: () => apiClient.get<ApiEnvelope<Material[]>>("/students/materials").then((res) => res.data),
  searchOnlineMaterials: (title: string) =>
    apiClient
      .get<ApiEnvelope<OnlineMaterialResult[]>>("/students/materials/search-online", {
        params: { title },
      })
      .then((res) => res.data),
  assignments: () =>
    apiClient.get<ApiEnvelope<Assignment[]>>("/students/assignments").then((res) => res.data),
  assessments: () =>
    apiClient.get<ApiEnvelope<Assessment[]>>("/students/assessments").then((res) => res.data),
  assessmentAttempts: () =>
    apiClient.get<ApiEnvelope<AssessmentAttempt[]>>("/students/assessments/attempts").then((res) => res.data),
  announcements: () =>
    apiClient.get<ApiEnvelope<Announcement[]>>("/students/announcements").then((res) => res.data),
  messages: () => apiClient.get<ApiEnvelope<Message[]>>("/students/messages").then((res) => res.data),
  sendMessage: (payload: {
    threadKey: string;
    recipientIds: string[];
    body: string;
    courseId?: string;
  }) => apiClient.post<ApiEnvelope<Message>>("/students/messages", payload).then((res) => res.data),
  attendanceHistory: () =>
    apiClient.get<ApiEnvelope<AttendanceRecord[]>>("/attendance/history").then((res) => res.data),
  activeSessions: () =>
    apiClient.get<ApiEnvelope<AttendanceSession[]>>("/attendance/sessions").then((res) => res.data),
};
