/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/src/api/client";
import type { ApiEnvelope, AssessmentAttempt, AssessmentDetailResponse, Assignment, AssignmentSubmission, Material } from "@/src/types/domain";

export const sharedApi = {
  assignment: (id: string) => apiClient.get<ApiEnvelope<Assignment>>(`/assignments/${id}`).then((res) => res.data),
  submitAssignment: (id: string, payload: FormData) =>
    apiClient.post<ApiEnvelope<AssignmentSubmission>>(`/assignments/${id}/submit`, payload).then((res) => res.data),
  assignmentSubmissions: (id: string) =>
    apiClient.get<ApiEnvelope<AssignmentSubmission[]>>(`/assignments/${id}/submissions`).then((res) => res.data),
  assessment: (id: string) =>
    apiClient.get<ApiEnvelope<AssessmentDetailResponse>>(`/assessments/${id}`).then((res) => res.data),
  startAssessment: (id: string, payload: { cameraGranted: boolean; microphoneGranted: boolean }) =>
    apiClient.post<ApiEnvelope<AssessmentAttempt>>(`/assessments/${id}/start`, payload).then((res) => res.data),
  updateAssessmentProctoring: (
    id: string,
    payload: {
      cameraGranted?: boolean;
      microphoneGranted?: boolean;
      tabSwitchCount?: number;
      windowBlurCount?: number;
      lastVisibilityChangeAt?: string;
      latestSnapshotDataUrl?: string;
      micLevel?: number;
    },
  ) => apiClient.patch<ApiEnvelope<AssessmentAttempt>>(`/assessments/${id}/proctoring`, payload).then((res) => res.data),
  submitAssessment: (id: string, payload: { answers: Array<{ questionId: string; answer: string | number | boolean }> }) =>
    apiClient.post<ApiEnvelope<AssessmentAttempt>>(`/assessments/${id}/submit`, payload).then((res) => res.data),
  materialsByCourse: (courseId: string) =>
    apiClient.get<ApiEnvelope<Material[]>>(`/materials/course/${courseId}`).then((res) => res.data),
  submitAttendance: (payload: {
    sessionId: string;
    sessionCode: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    deviceFingerprint?: string;
    visitorId?: string;
    faceImageUrl?: string;
  }) => apiClient.post<ApiEnvelope<any>>("/attendance/submit", payload).then((res) => res.data),
  joinAttendanceSessionPresence: (payload: {
    sessionId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    deviceFingerprint?: string;
    visitorId?: string;
  }) => apiClient.post<ApiEnvelope<any>>("/attendance/presence/join", payload).then((res) => res.data),
};
