'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useLocalStorageState } from 'ahooks';
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';

export type Locale = 'zh' | 'en';

const messagesMap = {
  zh: zhMessages,
  en: enMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): string | Record<string, string> | undefined {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    return value as Record<string, string>;
  }

  return undefined;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useLocalStorageState<Locale>('aigate-locale', {
    defaultValue: 'zh',
  });

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = messagesMap[locale || 'zh'];
      const value = getNestedValue(messages as Record<string, unknown>, key);

      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }

      if (typeof value === 'string') {
        // 替换参数占位符 {{key}}
        if (params) {
          return Object.entries(params).reduce(
            (acc, [paramKey, paramValue]) =>
              acc.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue)),
            value
          );
        }
        return value;
      }

      // If value is an object (namespace), return the key as fallback
      console.warn(`Translation key '${key}' returns an object, expected string`);
      return key;
    },
    [locale]
  );

  const handleSetLocale = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
      // 更新 html lang 属性
      document.documentElement.lang = newLocale === 'zh' ? 'zh-CN' : 'en';
    },
    [setLocale]
  );

  return (
    <I18nContext.Provider value={{ locale: locale || 'zh', setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
