import { useState, useEffect, useCallback } from 'react';
export function useTheme() {
  const [isDark, setIsDark] = useState<boolean | undefined>(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined' || isDark === undefined) {
      return;
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const toggleTheme = useCallback(() => {
    setIsDark(prev => (prev === undefined ? false : !prev));
  }, []);
  return { isDark, toggleTheme };
}