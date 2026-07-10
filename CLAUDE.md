# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **skills library**, not an application. The repo holds Claude Code skills + subagents that together form a Vietnamese-market landing-page pipeline (offer design → sales page → payment → email → chatbot → deploy → admin dashboard). The skills generate code into `output/<slug>/`, which is gitignored — the only "app" code that exists in this repo at any moment is whatever was last generated there.

The skills are user-invoked via slash commands (e.g. `/biz-offer-alex-hormozi`, `/ui-ux-pro-max`, `/biz-setup-sepay-payment`). Most are written in Vietnamese (xưng "anh/chị") and target solopreneurs / freelancers selling digital products in VN.

## Layout

```
.claude/skills/<skill-name>/SKILL.md   — skill prompts (the actual product of this repo)
.claude/skills/<skill-name>/templates  — boilerplate the skill writes into output/
.claude/skills/<skill-name>/references — long-form docs the skill loads on demand
.claude/worktrees/                      — transient git worktrees created by agents (gitignored, created on demand)
output/<slug>/                          — generated artifacts (gitignored)
so-do-thuat-toan-landing-page-supabase.md — VN explainer of the checkout/webhook algorithm
.mcp.json                               — project MCP: Supabase HTTP server only
.env.example                            — ELEVENLABS / HEYGEN / GEMINI / OPENAI keys (video pipeline, optional for landing-page work)
```

Skills follow a consistent shape: `SKILL.md` frontmatter (`name`, `description`) is what Claude Code matches against; the body is the multi-phase workflow. When editing a skill, the `description` field is what controls when it fires — keep its USE-WHEN trigger list intact.

## The pipeline (skill order)

`/market-research` → `/biz-offer-alex-hormozi` → `/ui-ux-pro-max` (builds Next.js project under `output/<slug>/landing-page/`) → `/biz-setup-sepay-payment` → `/biz-email-setup` → `/biz-telegram-payment-notify` → `/biz-nextjs-chatbot-openrouter` → `/biz-deploy-vercel` → `/biz-admin-leads-dashboard`

Each skill reads the prior skill's output (`offer.json`, `lib/leads-supabase.ts`, etc.) — order matters. `biz-sales-page-layout` and `biz-sales-page-copy` are **deprecated** (2026-05-14); the pipeline now goes offer → `ui-ux-pro-max` directly with no wireframe markdown step.

## Working on a generated landing page (under `output/<slug>/landing-page/`)

Stack: Next.js 15 App Router + React 19 + TypeScript + Tailwind 4 (configured via `@theme` in `app/globals.css`, not `tailwind.config.js`). Supabase JS client for persistence, nodemailer for SMTP.

```bash
cd output/<slug>/landing-page
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
npm run start    # serve the built app
```

There is no test suite, no lint config — `next build` is the only correctness gate.

Per-project routes that the skills produce:
- `app/page.tsx` — sales page (sections in `components/`)
- `app/api/checkout/route.ts` — creates pending order, returns VietQR
- `app/api/sepay-webhook/route.ts` — Sepay → marks order paid, fires email + Telegram in parallel via `Promise.allSettled` (must return 200 even if side-effects fail, else Sepay retries)
- `app/api/lead/route.ts` — minimal lead capture (used before sepay skill is run)
- `app/api/chat/route.ts` — OpenRouter chatbot stream
- `app/admin/page.tsx` — CRM dashboard (password-gated; default `123456`)
- `app/api/health/route.ts` — pinged every 6 days by Vercel Cron to prevent Supabase auto-pause
- `lib/leads-supabase.ts` — single source of truth for lead CRUD; backed by 4 tables: `leads`, `phone_index`, `order_counter`, `webhook_dedup`

See `so-do-thuat-toan-landing-page-supabase.md` for the full checkout/webhook algorithm and the lifecycle of a `status` field (`pending` 7d → `paid` 90d → `expired` auto-cleanup via pg_cron).

## Skill authoring conventions

- **Vietnamese, not English.** Body copy, prompts user sees, error messages, generated email/landing-page text — all VN. Code identifiers stay English.
- **Charm pricing in VND.** `499.000đ` / `999.000đ`, not USD, not round numbers.
- **Phone validation regex is `^(0|\+84)[0-9]{9}$`** — used in both client and server. Don't loosen it.
- **Form fields are exactly three:** họ tên, SĐT, email. Don't add fields without an explicit reason.
- **Skills propose, user picks.** Each phase ends with the user confirming a choice; skills must not silently commit to bonus/guarantee/pricing decisions.
- **No emojis in code or commits** unless the user asked. Skills can use emojis in user-facing chat output.

## MCP and external services

- **Supabase MCP** is wired at project scope in `.mcp.json` (project ref `vygejqakditopeqnyevr`). Use `list_tables` / `get_logs` / `get_advisors` before migrations, prefer `apply_migration` over raw `execute_sql` for schema changes.
- **Vercel** is the deploy target. `.vercel/` is gitignored.
- **Sepay** issues the VietQR webhook; webhook URL is configured in the Sepay dashboard, not in code.

## Things to remember

- `output/` is gitignored on purpose — never commit generated landing pages.
- `.claude/worktrees/` is gitignored and contains transient agent work; clean up only if the user asks.
- Don't run `npm install` at the repo root — there is no root `package.json`. Always `cd` into the specific `output/<slug>/landing-page/` first.
- When a skill says "DEPRECATED" in its description, don't trigger it on the old keywords — route to the replacement skill noted in the deprecation line.
