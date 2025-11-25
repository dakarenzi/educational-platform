import { useState, useEffect, useRef } from 'react';
import type { User } from '@shared/types';
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
const STORAGE_KEY = 'auth-storage';
const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage != null;
  } catch (e) {
    return false;
  }
};
type Subscriber = () => void;
// This factory function creates a new instance of the auth store and its associated hook.
// This ensures that React hooks (useState, useEffect, useRef) are only called when the
// useAuthStore hook is actually used within a React component, fixing the "invalid hook call" error.
export const createAuthStore = () => {
  const subscribers = new Set<Subscriber>();
  const readPersisted = (): Partial<AuthState> => {
    if (!isLocalStorageAvailable()) return { user: null, isAuthenticated: false };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { user: null, isAuthenticated: false };
      const parsed = JSON.parse(raw);
      return {
        user: parsed?.user ?? null,
        isAuthenticated: !!parsed?.isAuthenticated,
      };
    } catch (error) {
      console.error("Failed to read persisted auth state:", error);
      return { user: null, isAuthenticated: false };
    }
  };
  let state: AuthState = {
    ...readPersisted(),
    user: readPersisted().user || null,
    isAuthenticated: readPersisted().isAuthenticated || false,
    login: () => {},
    logout: () => {},
  };
  const notify = () => {
    subscribers.forEach((s) => {
      try {
        s();
      } catch (e) {
        console.error("Auth store subscriber failed:", e);
      }
    });
  };
  const persist = (s: AuthState) => {
    if (!isLocalStorageAvailable()) return;
    try {
      const toPersist = {
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (error) {
      console.error("Failed to persist auth state:", error);
    }
  };
  const setState = (patch: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
    const nextState = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...nextState };
    persist(state);
    notify();
  };
  const login = (user: User) => {
    setState({ user, isAuthenticated: true });
  };
  const logout = () => {
    setState({ user: null, isAuthenticated: false });
  };
  state.login = login;
  state.logout = logout;
  const useAuthStore = <T>(selector: (s: AuthState) => T): T => {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;
    const getSelected = (): T => {
      try {
        return selectorRef.current(state);
      } catch (e) {
        console.error("Auth store selector failed:", e);
        return undefined as any as T;
      }
    };
    const [selectedValue, setSelectedValue] = useState(() => getSelected());
    const selectedValueRef = useRef(selectedValue);
    selectedValueRef.current = selectedValue;
    useEffect(() => {
      const checkForUpdates = () => {
        try {
          const nextValue = getSelected();
          if (nextValue !== selectedValueRef.current) {
            selectedValueRef.current = nextValue;
            setSelectedValue(nextValue);
          }
        } catch (e) {
          console.error("Auth store update check failed:", e);
        }
      };
      checkForUpdates();
      const unsubscribe = () => subscribers.delete(checkForUpdates);
      subscribers.add(checkForUpdates);
      return unsubscribe;
    }, []);
    return selectedValue;
  };
  (useAuthStore as any).getState = () => state;
  return useAuthStore;
};
// Export a single instance for the app to use.
// Components will call this hook, which is now safe.
export const useAuthStore = createAuthStore();