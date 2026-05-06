import { apiClient } from "@/src/api/client";
import type { ApiEnvelope } from "@/src/types/domain";

export interface PushPublicConfig {
  publicKey: string;
  enabled: boolean;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  portal: "student" | "staff";
}

export interface PushSubscriptionRecord {
  endpoint: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationRecord {
  _id?: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
}

export const notificationApi = {
  pushPublicConfig: () =>
    apiClient.get<ApiEnvelope<PushPublicConfig>>("/notifications/push/public-config").then((res) => res.data),
  savePushSubscription: (payload: PushSubscriptionPayload) =>
    apiClient.post<ApiEnvelope<PushSubscriptionRecord>>("/notifications/push/subscriptions", payload).then((res) => res.data),
  deletePushSubscription: (endpoint: string) =>
    apiClient.delete<ApiEnvelope<PushSubscriptionRecord>>("/notifications/push/subscriptions", { data: { endpoint } }).then((res) => res.data),
  notifications: () =>
    apiClient.get<ApiEnvelope<NotificationRecord[]>>("/notifications").then((res) => res.data),
};
