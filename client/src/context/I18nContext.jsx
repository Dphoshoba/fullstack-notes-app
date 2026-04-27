import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { defaultLanguage, languages, translations } from "../i18n/translations.js";

const LANGUAGE_KEY = "notes_api_language";
const I18nContext = createContext(null);

const interpolate = (template, values = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key] ?? "");

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return translations[stored] ? stored : defaultLanguage;
  });

  const currentLanguage = languages.find((item) => item.code === language) || languages[0];

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = currentLanguage.dir;
  }, [currentLanguage.dir, language]);

  const value = useMemo(
    () => ({
      language,
      languages,
      setLanguage(nextLanguage) {
        if (translations[nextLanguage]) {
          setLanguageState(nextLanguage);
        }
      },
      t(key, values) {
        const template = translations[language]?.[key] || translations[defaultLanguage][key] || key;
        return interpolate(template, values);
      }
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
