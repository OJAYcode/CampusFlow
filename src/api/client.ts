/* eslint-disable simple-import-sort/imports */
import axios from "axios";

import { getSessionExpiredRedirect } from "@/src/utils/auth-routing";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/src/utils/session-storage";

function normalizeApiBaseUrl(value?: string) {
  const fallback = "http://localhost:10000/api/v1";
  const rawValue = String(value || "").trim();

  if (!rawValue) return fallback;

  const trimmed = rawValue.replace(/\/+$/, "");

  try {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");

    if (!normalizedPath || normalizedPath === "/") {
      parsed.pathname = "/api/v1";
      return parsed.toString().replace(/\/+$/, "");
    }

    if (normalizedPath === "/api/v1") {
      parsed.pathname = "/api/v1";
      return parsed.toString().replace(/\/+$/, "");
    }

    return trimmed;
  } catch {
    return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
  }
}

const baseURL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

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
