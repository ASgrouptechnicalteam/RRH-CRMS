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
  phone?: string | null;
  secondaryPhone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  socialLinks?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  profileImageUrl?: string | null;
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
  updateUser: (partialUser: Partial<UserProfile>) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type RefreshResult = 
  | { success: true; token: string }
  | { success: false; reason: 'unauthorized' | 'network_error' | 'server_error' };

// Shared single-flight refresh state
let refreshPromise: Promise<RefreshResult> | null = null;

const performRefresh = async (): Promise<RefreshResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json();
      return { success: true, token: data.accessToken };
    } else if (res.status === 401 || res.status === 403) {
      return { success: false, reason: 'unauthorized' };
    } else {
      return { success: false, reason: 'server_error' };
    }
  } catch (err) {
    console.error('Refresh network failed', err);
    return { success: false, reason: 'network_error' };
  }
};

const refreshAccessToken = async (): Promise<RefreshResult> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rrh_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Access token strictly in memory
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('bootstrapping');

  const [firstLoginDone, setFirstLoginDoneState] = useState<boolean>(() => {
    if (!user) return true;
    return Boolean(user.firstLoginDone);
  });

  const [attendanceStamped, setAttendanceStamped] = useState<boolean>(false);

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setAttendanceStamped(false);
    localStorage.removeItem('rrh_user');
    // Ensure no token persistence remains
    localStorage.removeItem('rrh_token');
    setAuthStatus('unauthenticated');
    // Best effort background request to destroy backend session explicitly
    fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
  
    const initAuth = async () => {
      setAuthStatus('bootstrapping');
      const savedUser = localStorage.getItem('rrh_user');
      
      if (savedUser && !accessToken) {
        const result = await refreshAccessToken();
        
        if (!isMounted) return;
  
        if (result.success) {
          setAccessToken(result.token);
          setAuthStatus('authenticated');
        } else if (result.reason === 'unauthorized') {
          logout();
        } else {
          // Network or server error - don't destroy local auth state so we can retry
          setAccessToken(null);
          setAuthStatus('unauthenticated');
        }
      } else if (savedUser && accessToken) {
        setAuthStatus('authenticated');
      } else {
        logout();
      }
    };
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const login = (userData: UserProfile, token: string) => {
    setUser(userData);
    setAccessToken(token);
    const isDone = Boolean(userData.firstLoginDone);
    setFirstLoginDoneState(isDone);
    localStorage.setItem('rrh_user', JSON.stringify({ ...userData, firstLoginDone: isDone }));
    localStorage.removeItem('rrh_token'); // Make sure it's strictly removed
    setAuthStatus('authenticated');
  };

  const setFirstLoginDone = (done: boolean) => {
    setFirstLoginDoneState(done);
    if (user) {
      const updated = { ...user, firstLoginDone: done };
      setUser(updated);
      localStorage.setItem('rrh_user', JSON.stringify(updated));
    }
  };

  const updateUser = (partialUser: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...partialUser };
      setUser(updated);
      localStorage.setItem('rrh_user', JSON.stringify(updated));
    }
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      const result = await refreshAccessToken();
      
      if (result.success) {
        setAccessToken(result.token);
        
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${result.token}`);
        return fetch(url, { ...options, headers: retryHeaders });
      } else if (result.reason === 'unauthorized') {
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
        authStatus,
        firstLoginDone: firstLoginDone,
        attendanceStamped,
        login,
        logout,
        setFirstLoginDone,
        setAttendanceStamped,
        updateUser,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
