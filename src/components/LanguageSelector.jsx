import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app_language', newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2 h-9 text-gray-600 hover:text-primary hover:bg-amber-50 transition-colors"
      title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <Globe className="w-4 h-4" />
      <span className="font-bold text-xs uppercase w-4">
        {i18n.language === 'fr' || i18n.language?.startsWith('fr') ? 'FR' : 'EN'}
      </span>
    </Button>
  );
};