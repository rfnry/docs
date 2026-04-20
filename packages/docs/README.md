# @rfnry/docs

Astro integration for minimal, opinionated documentation sites. Multiple packages, independent versions per package, i18n, search, and first-class AI-consumption endpoints — drop in content, done.

## Features

- **Multi-package.** One site can document several packages side-by-side (e.g. `react`, `python`). Each carries its own version axis. A header picker flips between them.
- **Multi-version per package.** Content under `src/content/docs/{package}/{version}/{locale}/` with a header version picker scoped to the current package.
- **Multi-locale.** Astro's native i18n. The locale picker preserves the current page when switching.
- **AI-ready.** Every page exposed as raw markdown at `/{locale}/{package}/{version}/{slug}.md`. Per-package+version `llms.txt` and `llms-full.txt`, plus root-of-package mirrors at `/{locale}/{package}/llms.txt` that always point at the current version. A site-wide `/llms.txt` for cross-package discovery. Copy-for-AI on every page and every `##` section, each carrying a source / package / version / locale context header.
- **Static search.** Pagefind, indexed at post-build, scoped per package + version via content filters.
- **Opinionated design.** Monochrome dark/light with a theme dropdown. Four CSS custom properties (`--color-bg`, `--color-bg-inner`, `--color-lines`, `--color-tree-line`) retune the entire visual system.
- **Markdown only.** No MDX. Content survives the round-trip to `.md` endpoints without compilation — exactly what AI tools expect.

## Install

```bash
npm install @rfnry/docs astro
```

Requires Astro 6. Static search (Pagefind) ships with the integration and
is indexed automatically at the end of `astro build` — no extra install or
post-build script required.

## Setup

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import rfnry from "@rfnry/docs";

export default defineConfig({
  site: "https://my-docs.example",
  integrations: [
    rfnry({
      site: {
        title: "My Docs",
        description: "Project documentation.",
        social: [
          { type: "github", href: "https://github.com/me/repo" },
          { type: "website", href: "https://example.com" },
        ],
      },
      i18n: {
        defaultLocale: "en",
        locales: [
          { code: "en", label: "English" },
          { code: "pt-br", label: "Português (Brasil)" },
        ],
      },
      packages: [
        {
          id: "core",
          label: "Core",
          versions: [{ id: "v1", label: "v1.0", current: true }],
        },
      ],
      theme: { default: "system" },
      headerLinks: [],
    }),
  ],
});
```

`src/content.config.ts`:

```ts
export { collections } from "@rfnry/docs/content";
```

That's it. Add markdown files under `src/content/docs/{package}/{version}/{locale}/`.

Multiple packages with independent versions — use when a project ships in several languages, or when you want to document a React client and a Python server in one site:

```js
packages: [
  {
    id: "react",
    label: "React",
    versions: [
      { id: "v2", label: "v2.0", current: true },
      { id: "v1", label: "v1.4" },
    ],
  },
  {
    id: "python",
    label: "Python",
    versions: [{ id: "v1", label: "v1.0", current: true }],
  },
]
```

## Authoring

```yaml
---
title: Quickstart
description: One sentence used for <meta>, llms.txt, and search.
sidebar:
  order: 1
  label: Optional override     # falls back to title
  hidden: false                # optional; omits from sidebar + AI endpoints
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
| `/` | Redirects to `/{defaultLocale}/{firstPackage}/{currentVersion}/` |
| `/{locale}/` | Redirects to `/{locale}/{firstPackage}/{currentVersion}/` |
| `/{locale}/{package}/` | Redirects to `/{locale}/{package}/{currentVersion}/` |
| `/{locale}/{package}/{version}/{slug}/` | Rendered HTML page |
| `/{locale}/{package}/{version}/{slug}.md` | Raw markdown with a source / package / version / locale context header |
| `/{locale}/{package}/{version}/llms.txt` | Index of pages in this package+version+locale |
| `/{locale}/{package}/{version}/llms-full.txt` | Every page concatenated in sidebar order |
| `/{locale}/{package}/llms.txt` | Same as above but always the current version (stable URL for AI crawlers) |
| `/{locale}/{package}/llms-full.txt` | Full concat for the current version |
| `/llms.txt` | Site-wide index listing each package's current version (cross-package discovery) |

Redirects are full HTML documents (black bg, inline JS redirect, meta-refresh fallback) — no blank flash.

## Config reference

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `site.title` | string | yes | — | Shown in the header brand |
| `site.description` | string | yes | — | Used for `<meta>` + llms.txt header |
| `site.url` | string (URL) | no | falls back to `astro.config` `site` | Canonical origin for .md / llms.txt URLs |
| `site.logo.enabled` | boolean | no | `false` | Render the logo in the header |
| `site.logo.src` | string | no | `"/logo.svg"` | Logo asset path |
| `site.logo.alt` | string | no | `""` | Logo alt text |
| `site.social` | `{type, href}[]` | no | `[]` | Social links pill in the header. `type` is `"github"`, `"website"`, or `"discord"` |
| `i18n.defaultLocale` | string | yes | — | e.g. `"en"` |
| `i18n.locales` | `{code, label}[]` | yes (non-empty) | — | Ordered list of supported locales |
| `packages` | `{id, label, versions}[]` | yes (non-empty) | — | Packages to document. Each carries its own version axis (`versions: {id, label, current?}[]`, non-empty, exactly one `current: true`) |
| `theme.default` | `"dark"\|"light"\|"system"` | no | `"system"` | Initial theme; users can override via the toggle |
| `headerLinks` | `{label, href, external?}[]` | no | `[]` | Extra links in the header right cluster |

## Theming

Override any of the four color tokens in your own CSS file, then include it in the consumer project's root layout — one of:

```css
:root {
  --color-bg: #000000;
  --color-bg-inner: #0a0a0a;
  --color-lines: #1f1f1f;
  --color-tree-line: #1e1e1e;
}
```

The integration ships sensible dark + light defaults; you only need to override the ones you want to retune.

## Scripts

Your project — wire these in your own `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

`astro build` outputs HTML and indexes the content for client-side search in a single step — the integration runs Pagefind programmatically on `astro:build:done`.

## Examples

- [`examples/minimal`](https://github.com/rfnry/docs/tree/main/examples/minimal) — one locale, one version, one guide. Smallest viable consumer.
- [`examples/i18n-versioned`](https://github.com/rfnry/docs/tree/main/examples/i18n-versioned) — two locales, nested groups, version + locale combo.

## Development

Monorepo layout:

```
packages/docs/    ← this package
examples/minimal/
examples/i18n-versioned/
```

Requires Node 20.18+ and npm 10+.

```bash
npm install
npm run typecheck -w @rfnry/docs
npm test -w @rfnry/docs
npm run build -w @example/minimal
npm run build -w @example/i18n-versioned
npm run check    # Biome — lint + format
```

## License

MIT
