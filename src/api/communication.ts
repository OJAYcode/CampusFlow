/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/src/api/client";
import type { ApiEnvelope, Message, MessageThreadSummary, PaginatedResult } from "@/src/types/domain";

export const communicationApi = {
  threads: (page = 1, limit = 20) =>
    apiClient
      .get<ApiEnvelope<PaginatedResult<MessageThreadSummary>>>(`/communication/messages?page=${page}&limit=${limit}`)
      .then((res) => res.data),
  threadMessages: (threadKey: string, page = 1, limit = 20) =>
    apiClient
      .get<ApiEnvelope<PaginatedResult<Message>>>(`/communication/messages/${threadKey}?page=${page}&limit=${limit}`)
      .then((res) => res.data),
  markAsRead: (threadKey: string) =>
    apiClient.post<ApiEnvelope<{ threadKey: string; updatedCount: number }>>(`/communication/messages/${threadKey}/read`).then((res) => res.data),
  announcements: () => apiClient.get<ApiEnvelope<any[]>>("/communication/announcements").then((res) => res.data),
};
