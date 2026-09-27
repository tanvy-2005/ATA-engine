import axios from 'axios';
import { supabase } from './supabase';

// Create real Axios client
const realClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to inject Auth token if present
realClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
        localStorage.setItem('token', token);
      }
    } catch (e) {}
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Prevent GET caching
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  return config;
});

// Response interceptor to handle session timeouts and invalid tokens
realClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Verify if Supabase still has an active session before aggressively logging out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.error("Backend returned 401 but Supabase session is active. Token may be invalid for backend.");
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = realClient;
