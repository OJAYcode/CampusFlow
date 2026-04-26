/* eslint-disable simple-import-sort/imports */
"use client";

import * as React from "react";
import { create } from "zustand";
import { toast } from "sonner";

import { getCurrentUser, loginAdmin, loginLecturer, loginStudent, registerLecturer, registerStudent } from "@/src/api/auth";
import { ROLE_HOME_ROUTES, type Role } from "@/src/lib/constants";
import type { User } from "@/src/types/domain";
import { getLogoutRedirect } from "@/src/utils/auth-routing";
import { getErrorMessage } from "@/src/utils/error";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/src/utils/session-storage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  bootstrap: () => Promise<void>;
  setSession: (session: { user: User; accessToken: string; refreshToken: string }) => void;
  registerStudent: (payload: {
    matricNumber: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  registerLecturer: (payload: {
    employeeId: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  loginStudent: (payload: { email: string; password: string }) => Promise<void>;
  loginLecturer: (payload: { email: string; password: string }) => Promise<void>;
  loginAdmin: (payload: { email: string; password: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  isBootstrapping: true,
  isAuthenticated: false,
  bootstrap: async () => {
    const session = getStoredSession();
    if (!session.accessToken || !session.refreshToken) {
      set({ isBootstrapping: false });
      return;
    }

    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });

    try {
      await get().fetchMe();
    } catch {
      get().logout();
    } finally {
      set({ isBootstrapping: false });
    }
  },
  setSession: ({ user, accessToken, refreshToken }) => {
    setStoredSession({ accessToken, refreshToken });
    set({
      user,
      accessToken,
      refreshToken,
      role: user.role,
      isAuthenticated: true,
    });
  },
  registerStudent: async (payload) => {
    const response = await registerStudent(payload);
    get().setSession({
      user: response.data.user,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  },
  registerLecturer: async (payload) => {
    const response = await registerLecturer(payload);
    get().setSession({
      user: response.data.user,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  },
  loginStudent: async (payload) => {
    const response = await loginStudent(payload);
    get().setSession({
      user: response.data.user,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  },
  loginLecturer: async (payload) => {
    const response = await loginLecturer(payload);
    get().setSession({
      user: response.data.user,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  },
  loginAdmin: async (payload) => {
    const response = await loginAdmin(payload);
    get().setSession({
      user: response.data.user,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  },
  fetchMe: async () => {
    const response = await getCurrentUser();
    const session = getStoredSession();
    set({
      user: response.data,
      role: response.data.role,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
    });
  },
  refreshSession: async () => {
    await get().fetchMe();
  },
  logout: () => {
    const role = get().role;
    clearStoredSession();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
    if (typeof window !== "undefined") {
      window.location.href = getLogoutRedirect(role, window.location.pathname);
    }
  },
}));

export function AuthBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  React.useEffect(() => {
    bootstrap().catch((error) => {
      toast.error(getErrorMessage(error));
    });
  }, [bootstrap]);

  return null;
}

export function useRoleHome() {
  const role = useAuthStore((state) => state.role);
  return role ? ROLE_HOME_ROUTES[role] : "/";
}
