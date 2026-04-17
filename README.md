# rfnry docs

Minimal, opinionated Astro starter for documentation sites with versioning, i18n, and first-class AI-consumption endpoints.

## Features

- **Multi-version**: content under `src/content/docs/{version}/{locale}/` with a header version picker. Bumping a version is `cp -r v1 v2`.
- **Multi-locale**: Astro's built-in i18n. Locale picker preserves the current page when switching.
- **AI-ready**: every page exposed as raw markdown at `/{locale}/{version}/{slug}.md`. Per-version `llms.txt` and `llms-full.txt`. "Copy for AI" buttons on every page and every `##` section, each copying the content prefixed with a context header (source URL, version, locale, anchor).
- **Static search**: Pagefind, indexed at post-build, scoped to the current version.
- **Opinionated design**: monochrome dark/light with a theme dropdown (Light / Dark / System). Four CSS custom properties (`--color-bg`, `--color-bg-inner`, `--color-lines`, `--color-tree-line`) retune the entire visual system.
- **Markdown only**: no MDX. Content survives the round-trip to `.md` endpoints without compilation, which is exactly what AI tools want.

## Quick start

Click **Use this template** on GitHub, or clone directly:

```bash
git clone https://github.com/rfnry/docs.git my-docs
cd my-docs
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Configure

Edit `src/docs.config.ts` — the single file that drives site metadata, versions, locales, theme default, header links, and logo toggle:

```ts
import type { DocsConfig } from "./lib/config";

export const docsConfig = {
  site: {
    title: "Docs",
    description: "Project documentation.",
    url: "https://your-domain.example",
    logo: { enabled: false, src: "/logo.svg", alt: "Docs" },
    github: "https://github.com/your-org/your-repo",
  },
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "pt-br", label: "Português (Brasil)" },
    ],
  },
  versions: [{ id: "v1", label: "v1.0", current: true }],
  theme: { default: "system" },
  headerLinks: [] as DocsConfig["headerLinks"],
} satisfies DocsConfig;
```

Restyle via `src/styles/tokens.css`.

## Authoring

Drop markdown files under `src/content/docs/{version}/{locale}/`:

```yaml
---
title: Quickstart
description: One sentence used for <meta>, llms.txt, and search.
sidebar:
  order: 1
  label: Optional override    # falls back to title
  hidden: false               # optional; omits from sidebar + AI endpoints
---
```

Folders can carry a `_group.yaml` sidecar:

```yaml
label: Guides
order: 2
collapsed: false
```

Unlimited nesting depth. Groups containing the current page auto-expand; the rest honor `collapsed`.

## Routes

| Route | Content |
|---|---|
| `/` | Redirects to `/{defaultLocale}/{currentVersion}/` |
| `/{locale}/{version}/{slug}/` | Rendered HTML page |
| `/{locale}/{version}/{slug}.md` | Raw markdown with context header |
| `/{locale}/{version}/llms.txt` | Index of all pages (markdown bullets) |
| `/{locale}/{version}/llms-full.txt` | Every page concatenated in sidebar order |

## Scripts

```
npm run dev         # astro dev
npm run build       # astro build && pagefind --site dist
npm run preview     # astro preview
npm run typecheck   # astro check
npm run check       # biome check
npm run check:fix   # biome check --write
npm run format      # biome format --write
npm run test        # vitest run
```

CI on `push` / `pull_request` runs `check`, `typecheck`, `test`, `build` — see `.github/workflows/ci.yml`.

## License

MIT — see [LICENSE](./LICENSE).
