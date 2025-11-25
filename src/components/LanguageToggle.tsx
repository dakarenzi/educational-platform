import i18n from '@/i18n';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
interface LanguageToggleProps {
  className?: string;
}
export function LanguageToggle({ className }: LanguageToggleProps) {
  if (!i18n.isInitialized) {
    return null; // or a loading skeleton
  }
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    try {
      // persist selected language so it survives reloads
      localStorage.setItem('i18nextLng', lng);
    } catch (_) {
      // ignore localStorage errors (e.g., SSR or disabled storage)
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("text-2xl hover:scale-110 transition-all duration-200 active:scale-90 z-50", className)}>
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('fr')} disabled={i18n.language === 'fr'}>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}