import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageCode } from '../types';
import { loadPreferences, savePreferences } from '../services/storage';
import { getTranslation, TranslationKey } from '../utils/translations';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  pick: (en: string, kn: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => loadPreferences().language);

  useEffect(() => {
    document.documentElement.lang = language === 'kn' ? 'kn' : 'en';
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    const current = loadPreferences();
    savePreferences({ ...current, language: lang });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  const t = (key: TranslationKey) => getTranslation(language, key);

  const pick = (en: string, kn: string) => (language === 'kn' && kn ? kn : en);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, pick }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
