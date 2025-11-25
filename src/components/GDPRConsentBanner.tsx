import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
const CONSENT_KEY = 'gdpr_consent';
export function GDPRConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setIsVisible(true);
    }
  }, []);
  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setIsVisible(false);
  };
  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    setIsVisible(false);
    toast.warning(t('gdprConsent.declineToast'));
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <Alert className="max-w-4xl mx-auto shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Cookie className="h-6 w-6 flex-shrink-0" />
            <div className="flex-1">
              <AlertTitle className="font-bold">{t('gdprConsent.title')}</AlertTitle>
              <AlertDescription>
                {t('gdprConsent.message')}
              </AlertDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
              <Button onClick={handleAccept}>{t('gdprConsent.accept')}</Button>
              <Button variant="outline" onClick={handleDecline}>{t('gdprConsent.decline')}</Button>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}