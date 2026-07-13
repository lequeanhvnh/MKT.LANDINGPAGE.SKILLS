# Translation guide — localizing the copy, not translating it

In Phase 3 you write a dictionary file for every non-source language. This is
sales copy — the quality bar is the same as if a native marketer wrote it. A
literal, word-for-word translation reads as machine output and quietly kills
conversion. Localize.

## The mindset

Translate the *intent and the persuasion*, not the words. Ask: "how would a
native marketer in this language sell this exact thing?" Then write that.
Keep the meaning, the offer, the structure, and roughly the length (a button
that says one word should still be one or two words). Headlines and CTAs
deserve the most care — rework them so they land, don't transliterate them.

## Never translate these — copy them through verbatim

- Brand names, product names, project names, company names
- Person names, job titles that are proper nouns
- Hashtags, URLs, email addresses, social handles
- Phone numbers
- **VND prices and amounts** — `499K`, `5.999.000đ`, `12.868M`, `120tr/m²`
  stay exactly as written. The transaction is in VND for every visitor; do
  not convert to USD. (If a price string also contains words — `"/ khoá"`,
  `"trọn gói"` — translate only the words.)
- Numbers, dates, measurements

## Tone and register per language

The Vietnamese source addresses the reader formally as *anh/chị*. Carry that
respectful-but-warm register across — but use each language's natural form,
never a calque of "anh/chị":

- **English** — "you". Confident, benefit-led marketing English. Contractions
  are fine ("you'll", "we've"). Do not write "brother/sister" or "Dear".
- **中文 (Chinese, Simplified)** — address the reader as 您. Concise, professional.
- **한국어 (Korean)** — 존댓말 (해요체/합쇼체). Polite, modern marketing tone.
- **日本語 (Japanese)** — です/ます調. Polite, clear.

When unsure, match the warmth and confidence of the source rather than its
exact grammar.

## Practical rules

- **Match the shape exactly.** Same keys, same array lengths, same nesting as
  the source dictionary — TypeScript will reject the file otherwise. Translate
  values only; never rename or drop a key.
- **Mind layout.** Some languages run long. If a translated headline or button
  label is much longer than the source, tighten it so it does not break the
  design at mobile widths.
- **Keep placeholders and markup intact** — `{name}`, `\n`, emoji, inline
  units all carry over untouched and in the right position.
- **FAQ** — translate both question and answer so they read naturally as a
  pair, not as two separate fragments.
- **Form validation messages** — translate these too; an English visitor who
  mistypes a phone number should see an English error.

## The source dictionary is sacred

The source-language file (`vi.ts` for a Vietnamese page) holds the **exact
original strings**. Never paraphrase or "improve" it — after rewiring, the
page in its original language must read identically to before. Improving copy
is a separate job (`/biz-sales-page-copy`).
