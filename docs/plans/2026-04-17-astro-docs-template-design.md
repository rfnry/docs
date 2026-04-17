# Astro Docs Template — Design

**Date:** 2026-04-17
**Status:** Validated via brainstorming, ready for implementation planning

## Purpose

A minimal, opinionated Astro starter template for building multi-version, multi-language documentation sites from plain Markdown. First-class support for AI consumption: every page exists as raw markdown, and the whole docs set can be pulled as a single text stream for pasting into an LLM.

**Design philosophy:** the template is visually opinionated (shadcn/vercel-style monochrome). Users change colors via CSS custom properties and edit content; they do not restyle components or choose layouts.

## Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Astro 6.1+ | Project already scaffolded; first-class static + content collections |
| UI framework | None | Every interactive piece is small and DOM-local. Vanilla `<script>` inside Astro components |
| Authoring | Markdown only (`.md`) | Raw markdown survives round-trip to AI endpoints without compilation; no MDX |
| Styling | Plain CSS + CSS custom properties | No dependencies; theme via `:root` tokens and `[data-theme]` attribute |
| Search | Pagefind | Static, multilingual, no external service, post-build indexing |
| i18n | Astro built-in (`i18n` config) | `prefixDefaultLocale: true`, locale-first URLs |
| Code highlighting | Shiki (Astro built-in) | Zero extra setup |
| Admonitions | GFM alerts (`> [!NOTE]`) via remark | Pure-markdown syntax, no component imports |

## Content model

### Folder layout (version-outer)

```
src/content/docs/
  v1/
    en/
      index.md
      guides/
        _group.yaml
        installation.md
        quickstart.md
    pt-br/
      index.md
      guides/
        installation.md
  v2/
    en/
      index.md
      ...
```

Bumping a version = duplicate a `v{N}/` folder. Translators work inside a locale subtree.

### Frontmatter schema

Validated with Zod via `src/content.config.ts`.

```yaml
---
title: Getting Started          # required
description: Install and run... # required (used for <meta>, llms.txt, search)
sidebar:
  order: 1                      # optional, default 100
  label: Start here             # optional, overrides title in sidebar
  hidden: false                 # optional
---
```

### Folder metadata (`_group.yaml`)

Optional sidecar inside any folder:

```yaml
label: Guides
order: 2
collapsed: false
```

Folders without `_group.yaml` use humanized folder name and order 100.

### Content collection

One collection, loaded via the `glob` loader:

```ts
// src/content.config.ts
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sidebar: z.object({
      order: z.number().default(100),
      label: z.string().optional(),
      hidden: z.boolean().default(false),
    }).default({}),
  }),
});
```

Entry IDs encode the full path: `v1/en/guides/installation`. We parse `version`, `locale`, and `slug` from the ID.

## Routing

### Astro i18n config

Derived from `docsConfig` (see below):

```ts
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'pt-br'],
  routing: { prefixDefaultLocale: true },
}
```

All URLs carry a locale prefix.

### Routes

| File | Produces |
|---|---|
| `src/pages/index.astro` | `/` → redirects to `/{defaultLocale}/{currentVersion}/` |
| `src/pages/[locale]/index.astro` | `/{locale}` → redirects to `/{locale}/{currentVersion}/` |
| `src/pages/[locale]/[version]/[...slug].astro` | Every doc page, via `getStaticPaths` |
| `src/pages/[locale]/[version]/[...slug].md.ts` | Raw-markdown endpoint mirroring every page |
| `src/pages/[locale]/[version]/llms.txt.ts` | Short index (title, description, links) |
| `src/pages/[locale]/[version]/llms-full.txt.ts` | All pages concatenated |
| `src/pages/404.astro` | Fallback |

`getStaticPaths` reads the content collection, parses each ID to `{ locale, version, slug }`, and returns the params plus the entry as a prop.

## AI-consumption surface

### Static endpoints (per version + locale)

1. **`/{locale}/{version}/llms.txt`** — index file, `text/plain`
   - Title, description, site URL
   - Bulleted list of `[title](absolute-url): description` for every non-hidden page, in sidebar order

2. **`/{locale}/{version}/llms-full.txt`** — full-text blob, `text/plain`
   - Every page concatenated in sidebar order
   - Each page prefixed with a small header: `# <title>\n\n<canonical-url>\n\n`
   - Markdown preserved verbatim (frontmatter stripped)

3. **`/{locale}/{version}/{slug}.md`** — per-page raw markdown, `text/markdown`
   - Frontmatter stripped; title prepended as `# <title>`
   - One-to-one with the rendered HTML page

### In-page UI

4. **Page-level "Copy for AI" button** in the page header
   - Copies the page markdown plus a small context header:
     ```
     > Source: <canonical-url>
     > Version: v2 · Locale: en

     # <title>

     <body>
     ```
   - The context header makes the clipboard content self-describing when pasted into Claude.

5. **Section-level "Copy for AI" button** on every `##` heading
   - A section = an `<h2>` heading and all content up to the next `<h2>` (or end of page).
   - Copies the section markdown with the same context header plus an anchor: `> Anchor: #<slug>`.
   - `###`/`####` headings do not get their own button (too noisy; sections are the natural unit).

### Implementation notes

- The `.md` endpoint and the Copy-for-AI buttons share the same source: the raw body stored by the glob loader (`entry.body`).
- Section-slicing is done by walking the markdown AST at build time, producing an array of `{ heading, anchor, markdown }` that we inline as a `<script type="application/json">` the client reads when a section copy button is clicked.
- Canonical URLs are resolved via `getAbsoluteLocaleUrl()` using Astro's `site` config.

## Layout

One layout, one content shell.

```
┌─────────────────────────────────────────────────────────────┐
│ Header: logo │ version ▾ │       search       │ links │ lang ▾ │
├──────────┬─────────────────────────────────────┬────────────┤
│          │                                     │            │
│ Sidebar  │  Content                            │  TOC       │
│ (folder  │  • title                            │  (on-this- │
│  tree)   │  • Copy for AI btn                  │   page)    │
│          │  • body (with per-section btns)     │            │
│          │  • prev/next                        │            │
│          │                                     │            │
└──────────┴─────────────────────────────────────┴────────────┘
```

### Components (all Astro, no framework)

- `Layout.astro` — `<html>`, `<head>`, theme bootstrap script, `<body>` with three-column grid
- `Header.astro` — logo, `VersionPicker`, `Search`, header links, `LocalePicker`, `ThemeToggle`
- `Sidebar.astro` — recursive rendering of the folder tree
- `TOC.astro` — built from `headings` returned by `render(entry)`, filtered to h2/h3
- `Prose.astro` — wraps the rendered `<Content />`, applies typography styles
- `CopyForAI.astro` — the button; one instance in the page header, one per h2 heading (injected via a rehype plugin that adds anchors + data attributes)

### Right-sidebar TOC

Uses `const { Content, headings } = await render(entry)`. We render h2 and h3 headings with indent by depth. Scroll-spy is a small `IntersectionObserver` script.

## Sidebar generation

At build time:

1. Load all entries for the current `(locale, version)` pair.
2. Group by folder path.
3. For each folder, read optional `_group.yaml` (or use defaults).
4. Sort siblings by `order` ascending, then by title ascending.
5. Filter out entries with `sidebar.hidden: true`.
6. Produce a recursive `SidebarNode` tree: `{ label, href?, order, children: SidebarNode[] }`.

This happens in `src/lib/sidebar.ts`, called from the layout with `(locale, version)` from the route params.

`_group.yaml` files are not picked up by the content glob (pattern is `**/*.md`). A separate small `import.meta.glob('/src/content/docs/**/_group.yaml', { as: 'raw' })` loads them.

## Central config

`src/config/docs.config.ts` is the single source of truth users edit.

```ts
export const docsConfig = {
  site: {
    title: 'rfnry Docs',
    description: '...',
    url: 'https://docs.rfnry.dev',
    logo: { src: '/logo.svg', alt: 'rfnry' },
    github: 'https://github.com/...',
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English' },
      { code: 'pt-br', label: 'Português (Brasil)' },
    ],
  },
  versions: [
    { id: 'v2', label: 'v2.0', current: true },
    { id: 'v1', label: 'v1.0' },
  ],
  theme: { default: 'system' },
  headerLinks: [
    { label: 'Blog', href: 'https://...' },
  ],
} satisfies DocsConfig;
```

`astro.config.mjs` imports this and derives its `i18n` block, `site`, etc. Exactly one `current: true` version is validated at build.

## Styling and theming

### Tokens

`src/styles/tokens.css` defines all design tokens as CSS custom properties under `:root` (dark default) and `[data-theme='light']`.

```css
:root {
  --color-bg: #000;
  --color-fg: #fafafa;
  --color-muted: #a1a1aa;
  --color-border: #27272a;
  --color-surface: #09090b;
  --color-accent: #fafafa;
  --color-accent-fg: #000;

  --font-sans: ui-sans-serif, system-ui, ...;
  --font-mono: ui-monospace, ...;

  --radius: 6px;
  --content-max: 720px;
  --sidebar-w: 260px;
  --toc-w: 220px;
}

[data-theme='light'] {
  --color-bg: #fff;
  --color-fg: #0a0a0a;
  ...
}
```

### Component styles

Each component uses Astro's scoped `<style>`. No global CSS except `tokens.css` and `reset.css`.

### Theme toggle

- A small inline script in `<head>` sets `data-theme` on `<html>` before first paint, reading from `localStorage.theme` with a fallback to the configured default (respecting `prefers-color-scheme` when default is `system`).
- The toggle cycles: dark → light → system. Writes to `localStorage`.

## Search (Pagefind)

- Added as a `postbuild` script: `pagefind --site dist`.
- Pagefind's output lives in `dist/pagefind/`. Loaded lazily by the header search component.
- The `<html>` tag carries `lang="{locale}"` so Pagefind indexes per-language automatically.
- We add `data-pagefind-filter="version:{version}"` on the page body so search results are filtered to the current version. The dialog UI shows results for the active `(locale, version)` only.
- Keybinding: `/` or `Ctrl/Cmd+K` opens the dialog.

## Interactivity inventory

All tiny, all vanilla:

| Piece | Script |
|---|---|
| Theme toggle | `src/scripts/theme.ts` — cycles tri-state, persists |
| Theme FOUC prevention | Inline script in `<head>` |
| Copy for AI (page) | `src/scripts/copy-ai.ts` — fetches `{slug}.md`, prepends header, writes to clipboard |
| Copy for AI (section) | Same module — reads section markdown from inline JSON |
| Mobile sidebar | `src/scripts/mobile-sidebar.ts` — toggles `data-sidebar-open` on body |
| TOC scroll-spy | `src/scripts/toc.ts` — `IntersectionObserver` |
| Version/Locale pickers | Plain `<details>` elements with CSS — no JS |
| Search | `src/scripts/search.ts` — lazy-imports Pagefind |

Total client JS budget target: under 10 KB gzipped excluding Pagefind.

## File tree (target)

```
.
├── astro.config.mjs
├── package.json
├── plans/
├── public/
│   └── favicon.svg
└── src/
    ├── config/
    │   └── docs.config.ts
    ├── content/
    │   └── docs/
    │       └── {version}/{locale}/...md
    ├── content.config.ts
    ├── layouts/
    │   └── Layout.astro
    ├── components/
    │   ├── Header.astro
    │   ├── Sidebar.astro
    │   ├── TOC.astro
    │   ├── Prose.astro
    │   ├── CopyForAI.astro
    │   ├── VersionPicker.astro
    │   ├── LocalePicker.astro
    │   ├── ThemeToggle.astro
    │   └── Search.astro
    ├── lib/
    │   ├── sidebar.ts
    │   ├── routing.ts        (helpers over Astro's i18n)
    │   ├── ai-content.ts     (section slicing, context headers)
    │   └── remark/           (GFM alerts, section-anchor injection)
    ├── pages/
    │   ├── index.astro
    │   ├── 404.astro
    │   └── [locale]/
    │       ├── index.astro
    │       └── [version]/
    │           ├── [...slug].astro
    │           ├── [...slug].md.ts
    │           ├── llms.txt.ts
    │           └── llms-full.txt.ts
    ├── scripts/
    │   ├── theme.ts
    │   ├── copy-ai.ts
    │   ├── mobile-sidebar.ts
    │   ├── toc.ts
    │   └── search.ts
    └── styles/
        ├── reset.css
        ├── tokens.css
        └── prose.css
```

## Build and dev workflow

```
npm run dev      → astro dev
npm run build    → astro build && pagefind --site dist
npm run preview  → astro preview
```

Pagefind runs only on `build` (indexing dev is not needed).

## Out of scope (explicitly deferred)

- MDX / component imports in content
- Live API route for docs (static endpoints cover every use case)
- Embeddings / vector search endpoints
- Per-`###`-heading copy buttons
- Algolia / hosted search
- Authenticated / gated docs
- Analytics integration
- A CLI or generator for scaffolding new doc projects (this is a template, not a framework)

## Open implementation questions (to resolve during planning)

- Exact remark plugin for section-anchor injection, or a small custom one
- Sidebar collapse state persistence (session vs none)
- Handling of missing translations: render with a "not translated" notice pointing at the `fallback` locale, or 404? Astro's `i18n.fallback` can handle some of this; to decide per-route.
- Validation step that ensures every page exists in all locales, or allow partial translations (current lean: allow partial, with the fallback notice)

---

End of design.
