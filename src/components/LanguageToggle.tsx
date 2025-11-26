import i18n from '@/i18n';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
interface LanguageToggleProps {
  className?: string;
}
export function LanguageToggle({ className }: LanguageToggleProps) {
  // Guard against calling useTranslation before i18n is ready.
  if (!i18n.isInitialized) {
    return null;
  }
  const { i18n: i18nInstance } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18nInstance.changeLanguage(lng);
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
        <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18nInstance.language === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('fr')} disabled={i18nInstance.language === 'fr'}>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}