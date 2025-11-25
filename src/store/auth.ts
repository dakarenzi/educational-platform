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
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

// Stable login/logout placeholders; real implementations assigned after they are defined.
let state: AuthState = {
  user: null,
  isAuthenticated: false,
  // temporary no-op; will be replaced by stable implementations below
  login: (() => {}) as (user: User) => void,
  logout: (() => {}) as () => void,
};

const notify = () => {
  subscribers.forEach((s) => {
    try {
      s();
    } catch {
      // swallow subscriber errors to avoid breaking store updates
    }
  });
};

const readPersisted = (): Partial<AuthState> | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      isAuthenticated: !!parsed?.isAuthenticated,
    } as Partial<AuthState>;
  } catch {
    return null;
  }
};

const persist = (s: AuthState) => {
  if (!isLocalStorageAvailable()) return;
  try {
    const toPersist = {
      user: s.user,
      isAuthenticated: s.isAuthenticated,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    // ignore persistence errors
  }
};

const getState = (): AuthState => state;

const setState = (partial: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
  const patch = typeof partial === 'function' ? partial(state) : partial;
  const next: AuthState = {
    ...state,
    ...patch,
  };
  // Ensure stable login/logout references are preserved (will be assigned below)
  next.login = state.login;
  next.logout = state.logout;
  state = next;
  persist(state);
  notify();
};

const subscribe = (listener: Subscriber) => {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
};

// Stable action implementations
const login = (user: User) => {
  setState({ user, isAuthenticated: true });
};
const logout = () => {
  setState({ user: null, isAuthenticated: false });
};

// Initialize state from persistence, preserving stable functions
const persisted = readPersisted();
state = {
  user: persisted?.user ?? null,
  isAuthenticated: persisted?.isAuthenticated ?? false,
  login,
  logout,
};

// Ensure persisted state is saved in case defaults differ
persist(state);

 // Exported hook using a stable subscription-based implementation (useState/useEffect)
 // to avoid runtime issues with useSyncExternalStore in some environments.
 export function useAuthStore<T>(selector: (s: AuthState) => T): T {
   const selectorRef = useRef(selector);
   // keep latest selector reference to avoid resubscribing when selector identity changes
   selectorRef.current = selector;

   const getSelected = (): T => {
     try {
       return selectorRef.current(getState());
     } catch {
       // swallow selector errors and return undefined typed as T
       return undefined as any as T;
     }
   };

   const [selected, setSelected] = useState<T>(() => getSelected());
   const selectedRef = useRef<T>(selected);
   // keep current selected value in a ref for stable comparisons inside subscriber
   selectedRef.current = selected;

   useEffect(() => {
     const check = () => {
       try {
         const next = selectorRef.current(getState());
         if (next !== selectedRef.current) {
           selectedRef.current = next;
           setSelected(next);
         }
       } catch {
         // swallow selector errors to avoid breaking components
       }
     };

     // run once to ensure initial sync, then subscribe for updates
     check();
     const unsubscribe = subscribe(check);
     return unsubscribe;
   }, []);

   return selected;
 }

 // Expose getState on the hook for parity with prior API
 // (useAuthStore as any).getState will be available to consumers
 ;(useAuthStore as any).getState = getState;