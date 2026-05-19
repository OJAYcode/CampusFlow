const STORAGE_KEY = "campusflow-auth-session";

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
}

function emptySession(): StoredSession {
  return { accessToken: null, refreshToken: null };
}

function readSession(storage: Storage | undefined | null): StoredSession {
  if (!storage) return emptySession();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : emptySession();
  } catch {
    return emptySession();
  }
}

export function getStoredSession(): StoredSession {
  if (typeof window === "undefined") {
    return emptySession();
  }

  try {
    const persistentSession = readSession(window.localStorage);
    if (persistentSession.accessToken || persistentSession.refreshToken) {
      return persistentSession;
    }

    // Migrate older tab-only auth into persistent storage so sessions survive app restarts.
    const legacySession = readSession(window.sessionStorage);
    if (legacySession.accessToken || legacySession.refreshToken) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySession));
      window.sessionStorage.removeItem(STORAGE_KEY);
      return legacySession;
    }

    return emptySession();
  } catch {
    return emptySession();
  }
}

export function setStoredSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}
