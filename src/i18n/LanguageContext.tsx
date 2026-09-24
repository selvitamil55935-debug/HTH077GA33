import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, SUPPORTED_LANGUAGES, LanguageOption } from './types';
import { translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languages: LanguageOption[];
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('fin_language') as Language;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'es')) {
      return saved;
    }
    // Check navigator language if available
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('hi')) return 'hi';
      if (navLang.startsWith('es')) return 'es';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fin_language', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  /**
   * Helper function to retrieve nested translation key with parameter substitution:
   * e.g. t('recurring.inDays', { days: 4, date: 'Oct 12' })
   */
  const t = (key: string, params?: Record<string, string | number>, fallback?: string): string => {
    const parts = key.split('.');
    let current: any = translations[language];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    // Fallback to English if translation is missing in selected language
    if (current === undefined && language !== 'en') {
      let enCurrent: any = translations.en;
      for (const part of parts) {
        if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
          enCurrent = enCurrent[part];
        } else {
          enCurrent = undefined;
          break;
        }
      }
      current = enCurrent;
    }

    if (current === undefined || typeof current !== 'string') {
      return fallback || key;
    }

    // Replace template parameters e.g. {currency}, {amount}, {days}
    if (params) {
      let result = current;
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
      return result;
    }

    return current;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
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
