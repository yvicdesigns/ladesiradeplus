import React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminLanguageContext = createContext();

export const useAdminLanguage = () => useContext(AdminLanguageContext);

export const AdminLanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Force French language when in admin area
    if (i18n.language !== 'fr') {
      i18n.changeLanguage('fr');
    }
  }, [i18n]);

  return (
    <AdminLanguageContext.Provider value={{ language: 'fr' }}>
      {children}
    </AdminLanguageContext.Provider>
  );
};