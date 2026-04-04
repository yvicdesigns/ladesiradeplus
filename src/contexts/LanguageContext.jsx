import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // useTranslation now works correctly because this component is wrapped by I18nextProvider
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || 'fr';

  const setLanguage = useCallback((lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  }, [i18n]);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const value = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t
  }), [currentLanguage, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};