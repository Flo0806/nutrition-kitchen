# nutrition-kitchen

A public, open source Nuxt app (nutrition.fh-softdev.de): anyone builds a recipe from raw materials
and gets its EU nutrition declaration (Regulation 1169/2011). Showcase for `@thereforejs/nutrition`,
`@thereforejs/foods` and `@thereforejs/food-finder`. UI German first, English too.
Stack: Nuxt 4.6 (`app/` dir), Nuxt UI 4, pnpm. Planned: `@nuxtjs/i18n`, `nuxt-auth-utils`, SQLite via
Drizzle, Docker image on ghcr.

## Workflow

- The repo is public. Plans, handoffs and notes live in `.agent/` (ignored), never in tracked files.
- Commits: one line, Conventional Commits (`feat(label): add print view`), no body, no Co-Authored-By
  or other trailers. Commit on `main` after `pnpm verify` is green. Never push, never release: the
  owner does (`scripts/release.sh`).
- One small step, then report. Talk before code; a question asks for a discussion, not for code.
- Investigate before changing: find the cause, report options. No symptom workarounds.
- Dev server: `pnpm dev --port 3070 --strictPort`; take it over with `--takeover`. Never delete `.data/`.
- Logs: nuxt-spyglass writes `.data/spyglass/logs.ndjson`; read them with the spyglass MCP tools.
- Nuxt modules: ask the nuxt-care MCP first (`module_health`, `module_context`), docs after.

## Code rules

- All code, names, ids, keys, file names, comments and docs in English, even though the UI is German.
- Comments: few, short, the why only. Never the what or the how.
- No em dashes or en dashes anywhere. Use a plain hyphen.
- `pnpm verify` bundles fmt, lint, typecheck, unit/property tests and E2E (Chromium, WebKit, mobile
  WebKit, plus a browserless `node` project for api and bundle checks, against a production build
  on port 3101). It is the definition of done.
- Zod at every boundary (API, forms, localStorage, env). Every recipe access checks the owner.
- The libraries calculate, the app never interprets: display `text[locale]`, never format numbers
  yourself; `null` is unknown and goes to the report; errors refuse the whole result.
- `@thereforejs/foods` is server only (`GET /api/foods/:code`); the client never imports all foods.

## Stack decisions

- Nuxt UI themed through `app/assets/css/tokens.css` (`@theme static` scales basil, yolk, sage) and
  `app/app.config.ts`. Fonts: Atkinson Hyperlegible Next (UI), Archivo (label), via `@nuxt/fonts`.
- Light mode only (`ui.colorMode: false`), 2026-10-31: the label is printed matter.
- SQLite, not MySQL, 2026-10-31: one server, rare writes (saving recipes), WAL handles far more than
  this app needs. Database and pictures share the `data` volume at `/app/.data`.
- TypeScript pinned to 6.x: vue-tsc (Volar 2.4) does not support TypeScript 7 yet.
