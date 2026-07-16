# Extraction guide — inventorying every string on the page

The goal of Phase 2 is a complete, deduplicated inventory of every string a
visitor can read. Miss one and that string stays stuck in the original
language no matter which switch the visitor presses. Be exhaustive.

## Where to look

Start at `app/page.tsx` (or `src/app/page.tsx`). It is usually a thin shell
that imports and composes section components. Walk every component it renders,
and any component those render in turn:

- `app/page.tsx` / `src/app/page.tsx` — composition + occasionally inline copy
- Every component under `components/` (or `app/components/`, `src/components/`)
  that ends up on the page — `Hero`, `Pricing`, `FAQ`, `Footer`, `Navbar`, etc.
- `app/layout.tsx` — the `metadata` export (`title`, `description`,
  `openGraph.title`, `openGraph.description`, `keywords`)

## What counts as a visible string

Capture all of these:

- JSX text nodes — anything between tags: `<h1>Đây là tiêu đề</h1>`
- Button / link labels, CTA text
- Form `label`, `placeholder`, and validation / error / success messages
- Accessibility text: `aria-label`, `title`, image `alt`
- String values inside **local data arrays/objects** that get rendered —
  pricing tiers, FAQ Q&A, feature bullets, testimonials, stat captions.
  These are the easiest to miss because they sit at the top of the file:

  ```tsx
  const tiers = [
    { name: "Gói Đồng Hành", price: "5.999.000đ", tag: "Phổ biến nhất" },
  ];
  ```

  Every `name`, `tag`, `price` label, `feature` string here is page copy.

## What to leave alone

Do **not** pull these into the dictionary — they are not language:

- `className` / Tailwind strings
- `href`, `src`, image paths, anchor IDs
- Code identifiers, prop names, env keys, component names
- Brand names, product names, person names — see `translation-guide.md`
- Numbers that are not part of a sentence (raw counts, coordinates)

`price` strings are a judgment call: keep the **number** identical across
languages (it is a VND amount), but if a price string contains words —
`"5.999.000đ / khoá"` — the word part is translatable. Split if needed.

## Key naming

Group keys by the component they come from so wiring is mechanical: strings
from `Hero.tsx` become `hero.*`, strings from `Pricing.tsx` become
`pricing.*`. Use `lowerCamelCase` leaf keys that describe the role of the
string, not its content:

- Good: `hero.title`, `hero.subtitle`, `hero.cta`, `form.errorPhone`
- Bad: `hero.dongHanhCungBan`, `text1`, `string_42`

Repeated structures stay as arrays — `pricing.tiers`, `faq.items`,
`features.list` — each element an object. Translating an array means
translating every element; keep the array length and order identical across
languages.

## Output of this phase

A single key tree, written first as the source-of-truth dictionary
(`vi.ts` if the page is in Vietnamese) with the **exact original strings**.
This file defines the shape every other language must match. See
`templates/dictionary-source.example.ts` for the structure.
