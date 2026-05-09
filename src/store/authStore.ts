// BACKEND INTEGRATION: Replace mock auth with real JWT API calls
import { create } from 'zustand';

export type UserRole = 'student' | 'professional';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  joinedAt: string;
  studyStreak: number;
  documentsCount: number;
  quizzesCompleted: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'arjun.sharma@learniq.app': {
    id: 'user-001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@learniq.app',
    password: 'StudyHard@2026',
    role: 'student',
    joinedAt: '2026-01-15',
    studyStreak: 14,
    documentsCount: 8,
    quizzesCompleted: 23,
  },
  'priya.mehta@learniq.app': {
    id: 'user-002',
    name: 'Priya Mehta',
    email: 'priya.mehta@learniq.app',
    password: 'PrepPro@2026',
    role: 'professional',
    joinedAt: '2026-02-03',
    studyStreak: 7,
    documentsCount: 5,
    quizzesCompleted: 11,
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1200));
    const match = MOCK_USERS[email.toLowerCase()];
    if (match && match.password === password) {
      const { password: _pw, ...user } = match;
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  register: async (name: string, email: string, _password: string, role: UserRole): Promise<boolean> => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1400));
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      joinedAt: new Date().toISOString().split('T')[0],
      studyStreak: 0,
      documentsCount: 0,
      quizzesCompleted: 0,
    };
    set({ user: newUser, isAuthenticated: true, isLoading: false });
    return true;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));