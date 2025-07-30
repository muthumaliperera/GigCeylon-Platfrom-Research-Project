 import { api } from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'job_seeker' | 'talent_connector' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'job_seeker' | 'talent_connector' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const { user, token } = response.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const { user, token } = response.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
