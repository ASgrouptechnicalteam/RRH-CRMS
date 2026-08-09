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
  attendanceRequired: boolean;
  firstLoginDone: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
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

  // Silent refresh on mount
  useEffect(() => {
    const initAuth = async () => {
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
          } else {
            // Refresh failed, meaning session is dead
            logout();
          }
        } catch (err) {
          console.error('Silent refresh failed', err);
          logout();
        }
      }
    };
    initAuth();
  }, []);

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
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setAttendanceStamped(false);
    localStorage.removeItem('rrh_user');
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

    // Handle Expired Token -> Redirect/Throw user to Login page
    if (res.status === 401) {
      const clone = res.clone();
      try {
        const body = await clone.json();
        if (body.code === 'TOKEN_EXPIRED' || body.code === 'UNAUTHORIZED') {
          console.warn('⚠️ Token expired or invalid. Redirecting to login page...');
          logout();
        }
      } catch (e) {
        logout();
      }
    }

    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
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
