import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export interface UserProfile {
  id: number;
  employeeCode: string;
  fullName?: string;
  department?: string;
  company: string;
  branch: string;
  roles: string[];
  permissions?: string[];
  attendanceRequired: boolean;
  firstLoginDone: boolean;
}

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  authStatus: AuthStatus;
  firstLoginDone: boolean;
  attendanceStamped: boolean;
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
  setFirstLoginDone: (done: boolean) => void;
  setAttendanceStamped: (stamped: boolean) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rrh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('bootstrapping');

  // Silent refresh on mount — explicit bootstrapping state
  useEffect(() => {
    const initAuth = async () => {
      setAuthStatus('bootstrapping');
      // If we have a user stored but no access token in memory, try to refresh
      const savedUser = localStorage.getItem('rrh_user');
      if (savedUser && !accessToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            // Credentials 'include' ensures the httpOnly refresh cookie is sent
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (res.ok) {
            const data = await res.json();
            setAccessToken(data.accessToken);
            setAuthStatus('authenticated');
          } else {
            // Refresh failed, meaning session is dead
            logout();
            setAuthStatus('unauthenticated');
          }
        } catch (err) {
          console.error('Silent refresh failed', err);
          logout();
          setAuthStatus('unauthenticated');
        }
      } else if (savedUser && accessToken) {
        // We already have both user and token from a previous session
        setAuthStatus('authenticated');
      } else {
        // No saved user — treat as unauthenticated
        logout();
        setAuthStatus('unauthenticated');
      }
    };
    initAuth();
  }, [accessToken]);

  const [firstLoginDone, setFirstLoginDoneState] = useState<boolean>(() => {
    if (!user) return true;
    return Boolean(user.firstLoginDone);
  });

  const [attendanceStamped, setAttendanceStamped] = useState<boolean>(false);

  const login = (userData: UserProfile, token: string) => {
    setUser(userData);
    setAccessToken(token);
    const isDone = Boolean(userData.firstLoginDone);
    setFirstLoginDoneState(isDone);
    localStorage.setItem('rrh_user', JSON.stringify({ ...userData, firstLoginDone: isDone }));
    setAuthStatus('authenticated');
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setAttendanceStamped(false);
    localStorage.removeItem('rrh_user');
    setAuthStatus('unauthenticated');
  };

  const setFirstLoginDone = (done: boolean) => {
    setFirstLoginDoneState(done);
    if (user) {
      const updated = { ...user, firstLoginDone: done };
      setUser(updated);
      localStorage.setItem('rrh_user', JSON.stringify(updated));
    }
  };

  // Helper fetch function that automatically includes Bearer token & intercepts expired 401s
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const res = await fetch(url, { ...options, headers });

    // Handle Expired Token -> attempt single refresh, then retry
    if (res.status === 401) {
      // Single-flight guard: prevent multiple simultaneous refresh calls
      if (fetchWithAuth.refreshInProgress) {
        // Already refreshing; just logout after retry fails
        logout();
        return res;
      }
      fetchWithAuth.refreshInProgress = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.accessToken);
          // Retry the original request with new token
          const retryHeaders = new Headers(options.headers || {});
          if (data.accessToken) {
            retryHeaders.set('Authorization', `Bearer ${data.accessToken}`);
          }
          return fetch(url, { ...options, headers: retryHeaders });
        } else {
          // Refresh failed
          logout();
          setAuthStatus('unauthenticated');
        }
      } catch (err) {
        console.error('Silent refresh retry failed', err);
        logout();
        setAuthStatus('unauthenticated');
      } finally {
        fetchWithAuth.refreshInProgress = false;
      }
    }

    return res;
  };

  // Single-flight refresh guard
  fetchWithAuth.refreshInProgress = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        authStatus,
        firstLoginDone,
        attendanceStamped,
        login,
        logout,
        setFirstLoginDone,
        setAttendanceStamped,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
