import { apiClient } from "@/src/api/client";
import type { ApiEnvelope, User } from "@/src/types/domain";

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export async function registerStudent(payload: {
  matricNumber: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/student/register", payload);
  return response.data;
}

export async function registerLecturer(payload: {
  employeeId: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/lecturer/register", payload);
  return response.data;
}

export async function loginStudent(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/student/login", payload);
  return response.data;
}

export async function loginLecturer(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/lecturer/login", payload);
  return response.data;
}

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/admin/login", payload);
  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<ApiEnvelope<{ resetToken?: string; resetLink?: string }>>(
    "/auth/forgot-password",
    { email },
  );
  return response.data;
}

export async function resetPassword(payload: { resetToken: string; newPassword: string }) {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>("/auth/reset-password", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiEnvelope<User>>("/auth/me");
  return response.data;
}
