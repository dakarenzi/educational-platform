import { useState, useEffect, useRef, useCallback } from 'react';
import type { User, JWTPayload } from '@shared/types';
import { api } from '@/lib/api-client';
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
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
type Subscriber = () => void;
export const createAuthStore = () => {
  const subscribers = new Set<Subscriber>();
  let state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    initialize: async () => {},
  };
  const notify = () => subscribers.forEach((s) => s());
  const setState = (patch: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
    const nextState = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...nextState };
    notify();
  };
  const login = (user: User, token: string) => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(STORAGE_KEY, token);
    }
    setState({ user, token, isAuthenticated: true });
  };
  const logout = () => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState({ user: null, token: null, isAuthenticated: false });
  };
  const initialize = async () => {
    if (!isLocalStorageAvailable()) return;
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      const claims = decodeJWT(token);
      if (claims) {
        try {
          // Fetch user data to ensure it's up-to-date
          const user = await api<User>(`/api/users/${claims.userId}`);
          login(user, token);
        } catch (error) {
          console.error("Failed to re-authenticate user:", error);
          logout();
        }
      } else {
        logout();
      }
    }
  };
  state.login = login;
  state.logout = logout;
  state.initialize = initialize;
  const useAuthStore = <T>(selector: (s: AuthState) => T): T => {
    const getSelected = useCallback(() => selector(state), [selector]);
    const [value, setValue] = useState(getSelected);
    useEffect(() => {
      const sub = () => setValue(getSelected);
      subscribers.add(sub);
      return () => subscribers.delete(sub);
    }, [getSelected]);
    return value;
  };
  (useAuthStore as any).getState = () => state;
  return useAuthStore;
};
export const useAuthStore = createAuthStore();
// Initialize auth state on app load
useAuthStore.getState().initialize();