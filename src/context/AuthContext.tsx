import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserRole } from '../models/Roles';
import { authApi } from '../api/services';
import type { AppUser } from '../api/types';
import { getToken, setToken, USER_KEY } from '../api/http';

interface AuthContextValue {
  user: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  firestoreUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  firestoreUserId: null,
  login: async () => undefined,
  logout: () => undefined,
});

function persistUser(user: AppUser | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function readStoredUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const cachedUser = readStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        const me = await authApi.me();
        setUser(me.user);
        persistUser(me.user);
      } catch {
        setToken(null);
        persistUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap().catch(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role: user?.role || null,
    loading,
    firestoreUserId: user?.id || null,
    login: async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      setToken(result.token);
      persistUser(result.user);
      setUser(result.user);
    },
    logout: () => {
      setToken(null);
      persistUser(null);
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
