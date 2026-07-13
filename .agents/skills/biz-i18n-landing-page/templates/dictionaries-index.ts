/**
 * Locale registry.
 *
 * Fill `dictionaries`, `defaultLocale`, and `localeNames` from the languages
 * chosen in the interview. The example below wires Vietnamese + English — add
 * one `import` + one entry per extra language.
 *
 * The source-of-truth language (the one the page was originally written in) is
 * imported first and its shape becomes the `Dictionary` type. Every other
 * language file is typed as `Dictionary`, so TypeScript flags any key you
 * forget to translate or mistype.
 */

import { vi } from "./vi";
import { en } from "./en";

/** Every language file, keyed by locale code. Add extra languages here. */
export const dictionaries = { vi, en };

/** The dictionary shape — derived from `vi`, the source-of-truth language. */
export type Dictionary = typeof vi;

/** Union of available locale codes, e.g. "vi" | "en". */
export type Locale = keyof typeof dictionaries;

/** All locale codes, in the order the switcher should show them. */
export const locales = Object.keys(dictionaries) as Locale[];

/** The language rendered on first paint / server-side. */
export const defaultLocale: Locale = "vi";

/** Human-readable names — used for the switcher's accessible label / tooltip. */
export const localeNames: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};
