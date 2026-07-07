import React, { createContext, useCallback } from 'react';
import { Language } from './types';
import { translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  language,
  onLanguageChange,
}: {
  children: React.ReactNode;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const setLanguage = useCallback(
    (newLanguage: Language) => {
      onLanguageChange(newLanguage);
    },
    [onLanguageChange]
  );

  const t = useCallback(
    (key: string, defaultValue: string = key): string => {
      const keys = key.split('.');
      let value: any = translations[language] || {};

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue;
        }
      }

      return typeof value === 'string' ? value : defaultValue;
    },
    [language]
  );

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
