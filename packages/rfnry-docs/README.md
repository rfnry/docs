# rfnry-docs

Astro integration for minimal, opinionated documentation sites. Versioning, i18n, search, and first-class AI-consumption endpoints — drop in content, done.

## Features

- **Multi-version.** Content under `src/content/docs/{version}/{locale}/` with a header version picker.
- **Multi-locale.** Astro's native i18n. The locale picker preserves the current page when switching.
- **AI-ready.** Every page exposed as raw markdown at `/{locale}/{version}/{slug}.md`. Per-version `llms.txt` and `llms-full.txt`. A root `/llms.txt` for discovery. Copy-for-AI button on every page + every `##` section, each copying the content with a source/version/locale context header.
- **Static search.** Pagefind, indexed at post-build, scoped per version via content filters.
- **Opinionated design.** Monochrome dark/light with a theme dropdown. Four CSS custom properties (`--color-bg`, `--color-bg-inner`, `--color-lines`, `--color-tree-line`) retune the entire visual system.
- **Markdown only.** No MDX. Content survives the round-trip to `.md` endpoints without compilation — exactly what AI tools expect.

## Install

```bash
npm install rfnry-docs astro
# or
pnpm add rfnry-docs astro
```

Requires Astro 6.

## Setup

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import rfnryDocs from "rfnry-docs";

export default defineConfig({
  site: "https://my-docs.example",
  integrations: [
    rfnryDocs({
      site: {
        title: "My Docs",
        description: "Project documentation.",
        github: "https://github.com/me/repo",
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
      headerLinks: [],
    }),
  ],
});
```

`src/content.config.ts`:

```ts
export { collections } from "rfnry-docs/content";
```

That's it. Add markdown files under `src/content/docs/{version}/{locale}/`.

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
| `/` | Redirects to `/{defaultLocale}/{currentVersion}/` |
| `/{locale}/` | Redirects to `/{locale}/{currentVersion}/` |
| `/{locale}/{version}/{slug}/` | Rendered HTML page |
| `/{locale}/{version}/{slug}.md` | Raw markdown with a source / version / locale context header |
| `/{locale}/{version}/llms.txt` | Index of pages in this version+locale |
| `/{locale}/{version}/llms-full.txt` | Every page concatenated in sidebar order |
| `/llms.txt` | Index for the default locale + current version (discovery endpoint) |

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
| `site.github` | string (URL) | no | — | GitHub icon link in the header |
| `i18n.defaultLocale` | string | yes | — | e.g. `"en"` |
| `i18n.locales` | `{code, label}[]` | yes (non-empty) | — | Ordered list of supported locales |
| `versions` | `{id, label, current?}[]` | yes (non-empty, exactly one current) | — | Version axis |
| `theme.default` | `"dark"\|"light"\|"system"` | no | `"system"` | Initial theme; users can override via the toggle |
| `headerLinks` | `{label, href, external?}[]` | no | `[]` | Extra links in the header right cluster |

## Theming

Override any of the four color tokens in your own CSS file, then include it in the consumer project's root layout — one of:

```css
:root {
  --color-bg: #000000;
  --color-bg-inner: #0a0a0a;
  --color-lines: #1f1f1f;
  --color-tree-line: #2e2e2e;
}
```

The integration ships sensible dark + light defaults; you only need to override the ones you want to retune.

## Scripts

Your project — wire these in your own `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview"
  }
}
```

`astro build` outputs HTML; running `pagefind --site dist` after indexes the content for client-side search.

## Examples

- [`examples/minimal`](https://github.com/rfnry/docs/tree/main/examples/minimal) — one locale, one version, one guide. Smallest viable consumer.
- [`examples/i18n-versioned`](https://github.com/rfnry/docs/tree/main/examples/i18n-versioned) — two locales, nested groups, version + locale combo.

## License

MIT
