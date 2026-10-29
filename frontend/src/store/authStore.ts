import { create } from 'zustand';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  grado?: string;
  ci?: string;
  cm?: string;
  promocion?: string;
  telefono?: string;
  direccion?: string;
  foto_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const getInitialUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
      return null;
    }
    return JSON.parse(storedUser);
  } catch (error) {
    console.warn('Error reading user from localStorage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const getInitialToken = (): string | null => {
  try {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
      return null;
    }
    return storedToken;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => {
  return {
    user: getInitialUser(),
    token: getInitialToken(),
    setAuth: (user, token) => {
      try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      } catch (err) {
        console.error('Error saving auth to localStorage:', err);
      }
      set({ user, token });
    },
    logout: () => {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } catch (err) {
        console.error('Error removing auth from localStorage:', err);
      }
      set({ user: null, token: null });
    },
  };
});

