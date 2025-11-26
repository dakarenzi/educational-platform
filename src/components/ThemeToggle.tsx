import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
interface ThemeToggleProps {
  className?: string;
}
export function ThemeToggle({ className = "absolute top-4 right-4" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  // Defensive: don't render or allow toggling until the theme value is initialized on the client.
  if (typeof isDark !== 'boolean') {
    return null;
  }
  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={`${className} text-2xl hover:scale-110 hover:rotate-12 transition-all duration-200 active:scale-90 z-50`}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  );
}