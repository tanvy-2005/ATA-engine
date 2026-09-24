import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  rememberMe: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  loginWithToken: (token: string, user: User, remember?: boolean) => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  githubLogin: () => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setRememberMe: (remember: boolean) => void;
  updateUser: (data: Partial<User>) => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from local storage or mock
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const storedRemember = localStorage.getItem('rememberMe') === 'true';

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    if (storedTheme) {
      setTheme(storedTheme);
    }
    setRememberMe(storedRemember);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = response.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);
      if (remember) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('token', jwtToken);
        localStorage.removeItem('rememberMe');
      }
    } catch (error: any) {
      console.error('Login error', error);

      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/signup', { name, email, password });
      const { user: userData, token: jwtToken } = response.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);
      return response.data;
    } catch (error: any) {
      console.error('Signup error', error);
<<<<<<< HEAD
=======

>>>>>>> a09dbf334325941ddaa5e24c09a03c28d5dd86c9
      throw error;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      await apiClient.post('/auth/verify-email', { email, code });
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, is_verified: true };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    } catch (error: any) {
      console.error('Verify email error', error);
      throw error;
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const response = await apiClient.post('/auth/resend-code', { email });
      return response.data;
    } catch (error: any) {
      console.error('Resend verification code error', error);
      throw error;
    }
  };

  const openOAuthPopup = (url: string) => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      url,
      'OAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no,resizable=yes`
    );
    if (!popup) {
      window.location.href = url;
    }
  };

  const googleLogin = async () => {
    openOAuthPopup('http://localhost:8000/api/v1/auth/google');
  };

  const githubLogin = async () => {
    openOAuthPopup('http://localhost:8000/api/v1/auth/github');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('auth_password');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth_password');
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error: any) {
      console.error('Forgot password error', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
    } catch (error: any) {
      console.error('Reset password error', error);
      throw error;
    }
  };

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetRememberMe = (remember: boolean) => {
    setRememberMe(remember);
    localStorage.setItem('rememberMe', String(remember));
  }

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = prev
        ? { ...prev, ...data }
        : ({ id: 'user-1', name: 'tanvy', email: 'tanvy@hindustaan.in', ...data } as User);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const loginWithToken = useCallback((jwtToken: string, userData: User, remember: boolean = true) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    if (remember) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', jwtToken);
    }
  }, []);

  const value = {
    user,
    token,
    theme,
    rememberMe,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    loginWithToken,
    signup,
    googleLogin,
    githubLogin,
    logout,
    forgotPassword,
    resetPassword,
    setTheme: handleSetTheme,
    setRememberMe: handleSetRememberMe,
    updateUser,
    verifyEmail,
    resendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
