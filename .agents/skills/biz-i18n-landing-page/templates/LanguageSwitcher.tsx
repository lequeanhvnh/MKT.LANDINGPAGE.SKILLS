"use client";

/**
 * Language switcher — a small pill fixed to the top-right corner, visible on
 * every page and while scrolling. Each language is one button showing its
 * locale code (VI, EN, ...); the active one is filled in.
 *
 * Rendered once in app/layout.tsx, just inside <LanguageProvider>. The pill
 * stays readable for 2–5 languages; beyond that, switch to a <select>.
 *
 * The chatbot widget (if present) sits bottom-right, so there is no overlap.
 * If a sticky site header collides with the pill, nudge `top-3`/`right-3`.
 */

import { useLanguage } from "./LanguageContext";
import { locales, localeNames } from "./dictionaries";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="fixed right-3 top-3 z-[60] flex items-center gap-0.5 rounded-full border border-black/10 bg-white/90 p-0.5 shadow-md backdrop-blur-sm"
      role="group"
      aria-label="Chọn ngôn ngữ / Select language"
    >
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            aria-label={localeNames[code]}
            title={localeNames[code]}
            className={
              "rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors " +
              (active
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:text-neutral-900")
            }
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
