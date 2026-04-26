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

export const notificationApi = {
  pushPublicConfig: () =>
    apiClient.get<ApiEnvelope<PushPublicConfig>>("/notifications/push/public-config").then((res) => res.data),
  savePushSubscription: (payload: PushSubscriptionPayload) =>
    apiClient.post<ApiEnvelope<any>>("/notifications/push/subscriptions", payload).then((res) => res.data),
  deletePushSubscription: (endpoint: string) =>
    apiClient.delete<ApiEnvelope<any>>("/notifications/push/subscriptions", { data: { endpoint } }).then((res) => res.data),
  notifications: () =>
    apiClient.get<ApiEnvelope<any[]>>("/notifications").then((res) => res.data),
};
