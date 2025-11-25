import { useState, useEffect, useCallback } from 'react';
export function useTheme() {
  const [isDark, setIsDark] = useState<boolean | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme ? savedTheme === 'dark' : prefersDark;
  });
  useEffect(() => {
    // This effect runs only on the client after mount, safely accessing localStorage.
    if (typeof window === 'undefined') return;
    if (isDark !== undefined) return;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme ? savedTheme === 'dark' : prefersDark);
  }, [isDark]);
  useEffect(() => {
    // This effect synchronizes the theme with the DOM when isDark changes.
    if (typeof window === 'undefined' || isDark === undefined) return;
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