import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSwitcher = ({ className = "" }) => {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center bg-secondary/50 rounded-lg p-1 border border-border shadow-inner ${className}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setLanguage('fr'); }}
        className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
          currentLanguage === 'fr' 
            ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`}
        aria-label="Switch to French"
      >
        FR
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
        className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
          currentLanguage === 'en' 
            ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
};