import { useState, useEffect, useCallback } from 'react';
export function useTheme() {
  const [isDark, setIsDark] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    // This effect runs only on the client after mount, safely accessing localStorage.
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme ? savedTheme === 'dark' : prefersDark);
  }, []);
  useEffect(() => {
    // This effect synchronizes the theme with the DOM when isDark changes.
    if (isDark === undefined) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);
  return { isDark, toggleTheme };
}