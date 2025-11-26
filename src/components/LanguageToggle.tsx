import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
interface LanguageToggleProps {
  className?: string;
}
export function LanguageToggle({ className }: LanguageToggleProps) {
  // Call the hook unconditionally at the top level.
  const { i18n } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  // Render the component, but disable functionality if i18n is not ready.
  const isInitialized = i18n.isInitialized;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("text-2xl hover:scale-110 transition-all duration-200 active:scale-90 z-50", className)}
          disabled={!isInitialized}
          aria-label="Change language"
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={!isInitialized || i18n.language === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('fr')} disabled={!isInitialized || i18n.language === 'fr'}>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}