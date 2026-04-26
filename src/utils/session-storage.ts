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
    const sessionSession = readSession(window.sessionStorage);
    if (sessionSession.accessToken || sessionSession.refreshToken) {
      return sessionSession;
    }

    // Migrate older shared localStorage auth into the current tab only.
    const legacyLocalSession = readSession(window.localStorage);
    if (legacyLocalSession.accessToken || legacyLocalSession.refreshToken) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(legacyLocalSession));
      window.localStorage.removeItem(STORAGE_KEY);
      return legacyLocalSession;
    }

    return emptySession();
  } catch {
    return emptySession();
  }
}

export function setStoredSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.localStorage.removeItem(STORAGE_KEY);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}
