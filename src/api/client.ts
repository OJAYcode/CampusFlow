import axios from "axios";

import { clearStoredSession, getStoredSession, setStoredSession } from "@/src/utils/session-storage";
import { getSessionExpiredRedirect } from "@/src/utils/auth-routing";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:10000/api/v1";

let refreshPromise: Promise<string | null> | null = null;

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredSession();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }

    const token = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!token) {
      clearStoredSession();
      if (typeof window !== "undefined") {
        window.location.href = getSessionExpiredRedirect(window.location.pathname);
      }
      throw error;
    }

    originalRequest.headers.Authorization = `Bearer ${token}`;
    return apiClient(originalRequest);
  },
);

async function refreshAccessToken() {
  const session = getStoredSession();
  if (!session.refreshToken) return null;

  try {
    const response = await axios.post(`${baseURL}/auth/refresh-token`, {
      refreshToken: session.refreshToken,
    });

    const nextSession = {
      accessToken: response.data.data.token,
      refreshToken: response.data.data.refreshToken,
    };

    setStoredSession(nextSession);
    return nextSession.accessToken;
  } catch {
    return null;
  }
}
