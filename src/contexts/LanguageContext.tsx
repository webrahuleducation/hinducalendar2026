import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { translations, TranslationKey } from "@/i18n/translations";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("language");
    if (stored === "hi" || stored === "en") return stored;
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    // RTL prep: for future RTL languages, set dir accordingly
    document.documentElement.dir = "ltr";
  }, []);

  // Sync lang attribute on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || translations["en"][key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
