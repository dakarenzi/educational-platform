import { create } from 'zustand';
import type { User, JWTPayload } from '@shared/types';
import { api } from '@/lib/api-client';
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  actions: {
    login: (user: User, token: string) => void;
    logout: () => void;
    initialize: () => Promise<void>;
  };
}
const STORAGE_KEY = 'auth-token';
const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage != null;
  } catch (e) {
    return false;
  }
};
const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp * 1000 < Date.now()) {
      console.log("Token expired");
      return null;
    }
    return decodedPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  actions: {
    login: (user, token) => {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, token);
      }
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
    initialize: async () => {
      if (get().isInitialized || !isLocalStorageAvailable()) {
        return;
      }
      try {
        const token = localStorage.getItem(STORAGE_KEY);
        if (token) {
          const claims = decodeJWT(token);
          if (claims) {
            const user = await api<User>(`/api/users/${claims.userId}`);
            set({ user, token, isAuthenticated: true, isInitialized: true });
          } else {
            get().actions.logout();
            set({ isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        get().actions.logout();
        set({ isInitialized: true });
      }
    },
  },
}));
// Expose actions for non-hook usage
export const authActions = useAuthStore.getState().actions;
// Initialize auth state on app load
authActions.initialize();