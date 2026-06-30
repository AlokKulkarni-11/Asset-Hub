import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  mobileNumber?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('wealthmap_token');
  const userJson = localStorage.getItem('wealthmap_user');
  let user = null;
  
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user from local storage');
    }
  }

  return {
    token,
    user,
    isAuthenticated: !!token,
    login: (token, user) => {
      localStorage.setItem('wealthmap_token', token);
      localStorage.setItem('wealthmap_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('wealthmap_token');
      localStorage.removeItem('wealthmap_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
