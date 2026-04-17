# rfnry Docs Template

Minimal, opinionated Astro starter for documentation sites with versioning, i18n, and first-class AI-consumption endpoints.

## Features

- **Multi-version**: content under `src/content/docs/{version}/{locale}/` with a header version picker.
- **Multi-locale**: Astro's built-in i18n; locale picker preserves the current page when switching.
- **AI-ready**: every page exposed as raw markdown (`/{locale}/{version}/{slug}.md`). Per-version `llms.txt` and `llms-full.txt`. "Copy for AI" buttons on each page and each `##` section, including a context header (source URL, version, locale).
- **Static search**: Pagefind, scoped to the current version + locale.
- **Opinionated design**: monochrome dark/light with a tri-state theme toggle. One `src/styles/tokens.css` to edit colors and spacing.

## Getting started

```bash
npm install
npm run dev
```

## Editing content

Add a markdown file under `src/content/docs/{version}/{locale}/`. Frontmatter:

```yaml
---
title: Quickstart
description: One sentence used for <meta>, llms.txt, and search.
sidebar:
  order: 1
  label: Optional override
  hidden: false
---
```

Folders can optionally have a `_group.yaml`:

```yaml
label: Guides
order: 2
collapsed: false
```

## Configuration

Edit `src/config/docs.config.ts` — the single source of truth for site metadata, versions, locales, header links, and theme default.

## AI consumption

| Endpoint | Use |
|---|---|
| `/{locale}/{version}/{slug}.md` | Raw markdown for one page |
| `/{locale}/{version}/llms.txt` | Short index of all pages |
| `/{locale}/{version}/llms-full.txt` | Every page concatenated |

## Build

```bash
npm run build     # astro build && pagefind --site dist
npm run preview
```

## Test

```bash
npm test
```
