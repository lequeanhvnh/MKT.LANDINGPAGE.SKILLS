# Wiring guide — connecting the i18n system to the page

Phases 4–5 turn the dictionaries into a live multilingual page. This file is
the mechanical detail behind those phases.

## File placement and import paths

Put everything under `app/i18n/` (or `src/app/i18n/` for a `src/`-layout
project):

```
app/i18n/
├── dictionaries/
│   ├── vi.ts          source of truth — exact original strings
│   ├── en.ts          one per extra language, typed as Dictionary
│   └── index.ts       registry (from templates/dictionaries-index.ts)
├── LanguageContext.tsx    (from templates/, copy verbatim)
└── LanguageSwitcher.tsx   (from templates/, copy verbatim)
```

Living under `app/` keeps the import path identical in both project layouts:
`@/app/i18n/...` resolves whether `@/*` maps to the repo root or to `src/`.

If the project has **no `@/` path alias** (check `tsconfig.json` →
`compilerOptions.paths`), use relative imports instead — `../i18n/...` from a
component, `./i18n/...` from `layout.tsx`. The template files themselves use
relative imports between each other (`./LanguageContext`, `./dictionaries`),
so they work unchanged either way.

## Wiring layout.tsx

`layout.tsx` can stay a server component. Wrap the body content in the
provider and render the switcher once, inside it:

```tsx
import { LanguageProvider } from "@/app/i18n/LanguageContext";
import LanguageSwitcher from "@/app/i18n/LanguageSwitcher";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={/* keep existing classes */}>
        <LanguageProvider>
          <LanguageSwitcher />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

Leave the `metadata` export as-is — it is static and server-rendered in the
default language. The provider syncs the browser tab title to the active
language client-side, so a visitor who switches still gets a matching title.

## Rewiring a component

Every component that renders dictionary copy needs three changes:

1. `"use client"` at the very top (the hook reads React context, which only
   works in client components). Most landing-page sections are presentational,
   so this is safe — and if the file already has `"use client"`, leave it.
2. `const t = useT();` inside the component body.
3. Replace each hardcoded string with its dictionary key.

```tsx
// BEFORE — components/Hero.tsx
export default function Hero() {
  return (
    <section>
      <h1>Tăng doanh số với hệ thống AI</h1>
      <p>Triển khai trong 30 ngày, không cần biết code.</p>
      <button>Nhận tư vấn miễn phí</button>
    </section>
  );
}

// AFTER
"use client";
import { useT } from "@/app/i18n/LanguageContext";

export default function Hero() {
  const t = useT();
  return (
    <section>
      <h1>{t.hero.title}</h1>
      <p>{t.hero.subtitle}</p>
      <button>{t.hero.cta}</button>
    </section>
  );
}
```

**Local data arrays** move into the dictionary; the component maps over the
dictionary value instead of a local const:

```tsx
// BEFORE
const tiers = [{ name: "Gói Cơ Bản", price: "499K" }];
// ...tiers.map(...)

// AFTER
const t = useT();
// ...t.pricing.tiers.map(...)
```

Anything that is *not* language — `className`, `href`, image `src`, numeric
props — stays exactly as it was.

## Why there is no hydration mismatch

The server renders `defaultLocale`. `LanguageProvider` starts its state at
`defaultLocale` too, so the **first** client render matches the server HTML
exactly — React hydrates cleanly. Only *after* that first render does the
mount effect read `localStorage` / the browser language and, if different,
call `setState` — a normal post-mount update, not a hydration step. A visitor
whose saved language differs from the default therefore sees one brief frame
of the default language. That flash is the price of URL-free i18n and is
acceptable for a landing page; do not try to "fix" it by gating render on a
`mounted` flag, which blanks the page and wrecks LCP.

## Verifying the build

From inside the project directory:

```bash
npm run build      # or: npm run lint
```

Common failures and fixes:

- **`Property 'x' is missing` / `Object literal may only specify known
  properties`** — a translation file has a missing or misspelled key. The
  error names the key; fix that language file to match the source shape.
- **`useLanguage must be used inside <LanguageProvider>`** (runtime) — a
  component calls `useT()` but is missing `"use client"`, or sits outside the
  provider. Add the directive; confirm the provider wraps `{children}`.
- **Unterminated string / unexpected token in a dictionary** — a translated
  value contains an unescaped quote. Use double-quoted TS strings and escape
  inner quotes, or use a different quote style.
- **`Cannot find module './vi'`** — a language is listed in `index.ts` but its
  file was not created, or vice versa.

The acceptance check: with the build green, the page in the **default
language** must read identically to before this skill ran. The other
languages appear when the visitor presses the switch.

## Re-running later to add a language

If `app/i18n/` already exists, this skill is being re-run to add a language.
Do not rebuild from scratch: add the new `<code>.ts` file, add one `import`
and one `dictionaries`/`localeNames` entry in `index.ts`, and rebuild. The
components and the switcher need no changes — the switcher renders whatever
`locales` contains.
