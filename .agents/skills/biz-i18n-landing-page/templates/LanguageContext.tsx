"use client";

/**
 * Client-side i18n provider for the landing page.
 *
 * Why client-side (no locale routing): the landing page is a single URL that
 * already owns app/api/, app/admin/, app/cam-on/ routes. Locale-prefixed
 * routing would force every page under app/[locale]/ and add middleware — a
 * heavy, invasive change for a one-page conversion site. Instead the language
 * lives in React state, persists to localStorage, and the whole tree
 * re-renders the instant the visitor flips the switch. No reload, no new
 * route, no extra dependency.
 *
 * Hydration: the server always renders `defaultLocale`. The saved/detected
 * locale is applied in an effect that runs *after* the first client render,
 * so the first client render still matches the server HTML and React reports
 * no hydration mismatch. A visitor whose saved language differs from the
 * default sees one brief frame in the default language — the accepted
 * trade-off for URL-free i18n.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  defaultLocale,
  locales,
  type Dictionary,
  type Locale,
} from "./dictionaries";

const STORAGE_KEY = "site-locale";

type LanguageContextValue = {
  /** The active locale code, e.g. "vi" | "en". */
  locale: Locale;
  /** Switch language — updates state, persists the choice, syncs <html lang>. */
  setLocale: (locale: Locale) => void;
  /** The active dictionary — read copy as `t.hero.title`, etc. */
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Runs once, after the first paint — never during hydration — so the initial
  // client render matches the server. Picks, in order: a previously saved
  // choice, then the browser's language, then leaves the default in place.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (locales as string[]).includes(saved)) {
      setLocaleState(saved as Locale);
      return;
    }
    const browser = navigator.language.slice(0, 2);
    if ((locales as string[]).includes(browser)) {
      setLocaleState(browser as Locale);
    }
  }, []);

  // Keep <html lang> and the browser tab title in sync with the active
  // language. Tab title matters because layout.tsx metadata is static and
  // server-rendered in the default language only.
  useEffect(() => {
    document.documentElement.lang = locale;
    const title = dictionaries[locale].meta?.title;
    if (title) document.title = title;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private-mode browsers — ignore; the choice
      // simply won't persist to the next visit.
    }
  };

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: dictionaries[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/** Full context — `locale`, `setLocale`, and the active dictionary `t`. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}

/** Shortcut for components that only read copy: `const t = useT();`. */
export function useT(): Dictionary {
  return useLanguage().t;
}
