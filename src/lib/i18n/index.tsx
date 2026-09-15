'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, TranslationDictionary } from './types';
import { en } from './translations/en';
import { mr } from './translations/mr';
import { hi } from './translations/hi';

const translations: Record<Language, TranslationDictionary> = {
  en,
  mr,
  hi,
};

const localeMap: Record<Language, string> = {
  en: 'en-IN',
  mr: 'mr-IN',
  hi: 'hi-IN',
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatLocaleDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatLocaleCurrency: (amount: number) => string;
  isLoaded: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  formatLocaleDate: (date: string | Date) => String(date),
  formatLocaleCurrency: (amount: number) => `₹${amount.toFixed(2)}`,
  isLoaded: false,
});

const STORAGE_KEY = 'papertrack_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore localStorage access issues in restricted contexts
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || en;
    let text = dict[key] || en[key] || key;

    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
      }
    }

    return text;
  }, [language]);

  const formatLocaleDate = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return String(date);
      const defaultOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options,
      };
      return new Intl.DateTimeFormat(localeMap[language], defaultOptions).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatLocaleCurrency = useCallback((amount: number): string => {
    try {
      return new Intl.NumberFormat(localeMap[language], {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `₹${amount.toFixed(2)}`;
    }
  }, [language]);

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatLocaleDate,
        formatLocaleCurrency,
        isLoaded,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export * from './types';
