# Astro Docs Template — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the minimal, opinionated Astro docs template described in `plans/2026-04-17-astro-docs-template-design.md`. Multi-version, multi-locale markdown docs with first-class AI-consumption endpoints.

**Architecture:** Single Astro static site. Content collections load markdown from `src/content/docs/{version}/{locale}/`. Astro's built-in i18n handles locale routing. Versioning is a convention layered on top via a `[version]` dynamic segment. No UI framework — plain Astro components with vanilla `<script>`. Plain CSS + CSS custom properties for theming. Pagefind indexes at post-build.

**Tech Stack:** Astro 6.1+, TypeScript (strict), Shiki (bundled), `remark-gfm` alerts, Pagefind, Vitest (for pure-logic unit tests only).

**Working directory:** `/home/frndvrgs/software/rfnry/docs` — working on `main`, no worktree.

**Reference design:** `plans/2026-04-17-astro-docs-template-design.md`

---

## Conventions for this plan

- **No tests for Astro components** — they'd require browser or heavy mocking for little value. We test pure-TS modules (`src/lib/*.ts`) with Vitest.
- **Visual verification** — UI tasks end with a dev-server smoke check. The executor runs `npm run dev` in the background (tmux or `run_in_background`) and hits specific URLs.
- **Commit per task.** Each task ends with a commit. Messages are imperative, lowercase, conventional-commit-ish (`feat:`, `chore:`, `fix:`).
- **Never skip hooks.**
- **Before every task:** read the "Files" list and the task's "Expected end state" so you know what "done" looks like.

---

## Task 1: Install dependencies and wire npm scripts

**Files:**
- Modify: `package.json`

**Step 1: Install runtime dependencies**

Run:
```bash
npm install pagefind
```

Expected: exit 0, `pagefind` appears in `dependencies`.

**Step 2: Install dev dependencies for unit tests**

Run:
```bash
npm install -D vitest @types/node
```

Expected: exit 0.

**Step 3: Edit `package.json` — replace the `scripts` block**

Replace:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

With:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build && pagefind --site dist",
  "preview": "astro preview",
  "astro": "astro",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pagefind, vitest, wire scripts"
```

**Expected end state:** `npm test` runs (no tests yet, exits 0 with "no test files"). `npm run build` still works (pagefind runs on empty dist with warnings — acceptable for now).

---

## Task 2: Central config file

**Files:**
- Create: `src/config/docs.config.ts`

**Step 1: Write the config**

```ts
// src/config/docs.config.ts

export type LocaleCode = string;

export interface LocaleEntry {
  code: LocaleCode;
  label: string;
}

export interface VersionEntry {
  id: string;
  label: string;
  current?: boolean;
}

export interface HeaderLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface DocsConfig {
  site: {
    title: string;
    description: string;
    url: string;
    logo: { src: string; alt: string };
    github?: string;
  };
  i18n: {
    defaultLocale: LocaleCode;
    locales: LocaleEntry[];
  };
  versions: VersionEntry[];
  theme: { default: "dark" | "light" | "system" };
  headerLinks: HeaderLink[];
}

export const docsConfig = {
  site: {
    title: "rfnry Docs",
    description: "Documentation for the rfnry project.",
    url: "https://docs.rfnry.dev",
    logo: { src: "/logo.svg", alt: "rfnry" },
    github: undefined,
  },
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "pt-br", label: "Português (Brasil)" },
    ],
  },
  versions: [
    { id: "v1", label: "v1.0", current: true },
  ],
  theme: { default: "system" },
  headerLinks: [],
} satisfies DocsConfig;

export function getCurrentVersion(): VersionEntry {
  const current = docsConfig.versions.find((v) => v.current);
  if (!current) throw new Error("docsConfig.versions must have exactly one { current: true }");
  return current;
}

export function getLocaleLabel(code: LocaleCode): string {
  const entry = docsConfig.i18n.locales.find((l) => l.code === code);
  return entry?.label ?? code;
}
```

**Step 2: Commit**

```bash
git add src/config/docs.config.ts
git commit -m "feat: add central docs config"
```

**Expected end state:** Config file exists and type-checks.

---

## Task 3: Astro config derives from docs.config

**Files:**
- Modify: `astro.config.mjs`

**Step 1: Replace the config**

```js
// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import { docsConfig } from "./src/config/docs.config.ts";

export default defineConfig({
  site: docsConfig.site.url,
  i18n: {
    defaultLocale: docsConfig.i18n.defaultLocale,
    locales: docsConfig.i18n.locales.map((l) => l.code),
    routing: { prefixDefaultLocale: true },
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
```

**Step 2: Verify Astro starts**

Run (in background): `npm run dev`

Then: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/`

Expected: any non-500 code (likely 404 right now — that's fine; we just need Astro's i18n not to crash).

Stop the dev server.

**Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: derive astro i18n from docs config"
```

---

## Task 4: Content collection schema

**Files:**
- Create: `src/content.config.ts`

**Step 1: Write the schema**

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/docs",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sidebar: z
      .object({
        order: z.number().default(100),
        label: z.string().optional(),
        hidden: z.boolean().default(false),
      })
      .default({}),
  }),
});

export const collections = { docs };
```

**Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: define docs content collection"
```

---

## Task 5: Seed initial content

**Files:**
- Create: `src/content/docs/v1/en/index.md`
- Create: `src/content/docs/v1/en/guides/installation.md`
- Create: `src/content/docs/v1/en/guides/quickstart.md`
- Create: `src/content/docs/v1/en/guides/_group.yaml`
- Create: `src/content/docs/v1/pt-br/index.md`
- Create: `src/content/docs/v1/pt-br/guides/installation.md`
- Create: `src/content/docs/v1/pt-br/guides/_group.yaml`

**Step 1: Write `src/content/docs/v1/en/index.md`**

```md
---
title: Welcome
description: Introduction to rfnry documentation.
sidebar:
  order: 1
---

# Welcome

This is the documentation for rfnry.

## What is rfnry?

A short description of the project goes here.

## Where to go next

Head to the Installation guide to get started, or browse the reference.
```

**Step 2: Write `src/content/docs/v1/en/guides/installation.md`**

```md
---
title: Installation
description: Install and run your first build.
sidebar:
  order: 1
---

# Installation

Install the package from npm.

## Prerequisites

Node.js 22.12 or later.

## Install

```bash
npm install rfnry
```

## Verify

```bash
rfnry --version
```
```

**Step 3: Write `src/content/docs/v1/en/guides/quickstart.md`**

```md
---
title: Quickstart
description: Your first rfnry build in five minutes.
sidebar:
  order: 2
---

# Quickstart

A five-minute walkthrough.

## Step 1: Scaffold

Run the scaffold command.

## Step 2: Build

Run the build command.

## Step 3: Deploy

Deploy to your host of choice.
```

**Step 4: Write `src/content/docs/v1/en/guides/_group.yaml`**

```yaml
label: Guides
order: 2
collapsed: false
```

**Step 5: Write `src/content/docs/v1/pt-br/index.md`**

```md
---
title: Bem-vindo
description: Introdução à documentação do rfnry.
sidebar:
  order: 1
---

# Bem-vindo

Esta é a documentação do rfnry.
```

**Step 6: Write `src/content/docs/v1/pt-br/guides/installation.md`**

```md
---
title: Instalação
description: Instale e execute sua primeira build.
sidebar:
  order: 1
---

# Instalação

Instale o pacote a partir do npm.
```

**Step 7: Write `src/content/docs/v1/pt-br/guides/_group.yaml`**

```yaml
label: Guias
order: 2
collapsed: false
```

**Step 8: Commit**

```bash
git add src/content/
git commit -m "feat: seed v1 content in en and pt-br"
```

---

## Task 6: Routing helpers + unit tests

**Files:**
- Create: `src/lib/routing.ts`
- Create: `src/lib/routing.test.ts`
- Create: `vitest.config.ts`

**Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

**Step 2: Write the failing test `src/lib/routing.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseEntryId, buildDocHref, isVersion, isLocale } from "./routing";

describe("parseEntryId", () => {
  it("parses a nested path", () => {
    expect(parseEntryId("v1/en/guides/installation")).toEqual({
      version: "v1",
      locale: "en",
      slug: "guides/installation",
    });
  });

  it("parses an index entry (no slug after locale)", () => {
    expect(parseEntryId("v1/en/index")).toEqual({
      version: "v1",
      locale: "en",
      slug: "",
    });
  });

  it("handles a hyphenated locale", () => {
    expect(parseEntryId("v2/pt-br/guides/quickstart")).toEqual({
      version: "v2",
      locale: "pt-br",
      slug: "guides/quickstart",
    });
  });

  it("throws on a path too short to contain version + locale", () => {
    expect(() => parseEntryId("v1")).toThrow();
  });
});

describe("buildDocHref", () => {
  it("builds a root href with trailing slash", () => {
    expect(buildDocHref({ version: "v1", locale: "en", slug: "" })).toBe("/en/v1/");
  });

  it("builds a nested href", () => {
    expect(buildDocHref({ version: "v1", locale: "en", slug: "guides/installation" })).toBe(
      "/en/v1/guides/installation/"
    );
  });
});

describe("isVersion / isLocale", () => {
  it("recognizes configured versions and locales", () => {
    expect(isVersion("v1")).toBe(true);
    expect(isVersion("v99")).toBe(false);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });
});
```

**Step 3: Run the test — expect failure**

Run: `npm test`

Expected: FAIL, `Cannot find module './routing'`.

**Step 4: Write `src/lib/routing.ts`**

```ts
import { docsConfig } from "../config/docs.config";

export interface ParsedEntryId {
  version: string;
  locale: string;
  slug: string;
}

export function parseEntryId(id: string): ParsedEntryId {
  const parts = id.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid entry id: "${id}" (expected at least version/locale)`);
  }
  const [version, locale, ...rest] = parts;
  let slug = rest.join("/");
  if (slug === "index") slug = "";
  return { version, locale, slug };
}

export function buildDocHref(parts: ParsedEntryId): string {
  const { version, locale, slug } = parts;
  const base = `/${locale}/${version}/`;
  if (!slug) return base;
  return `${base}${slug}/`;
}

export function isVersion(id: string): boolean {
  return docsConfig.versions.some((v) => v.id === id);
}

export function isLocale(code: string): boolean {
  return docsConfig.i18n.locales.some((l) => l.code === code);
}
```

**Step 5: Run tests — expect pass**

Run: `npm test`

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/lib/routing.ts src/lib/routing.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: routing helpers with tests"
```

---

## Task 7: Styling — reset + tokens

**Files:**
- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`

**Step 1: Write `src/styles/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-fg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: inherit; text-decoration: none; }
a:hover { text-decoration: underline; }
button {
  font: inherit;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
}
img, svg { display: block; max-width: 100%; }
```

**Step 2: Write `src/styles/tokens.css`**

```css
:root {
  --color-bg: #000000;
  --color-fg: #fafafa;
  --color-muted: #a1a1aa;
  --color-subtle: #71717a;
  --color-border: #27272a;
  --color-surface: #09090b;
  --color-surface-hover: #18181b;
  --color-accent: #fafafa;
  --color-accent-fg: #000000;
  --color-link: #fafafa;

  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;

  --fs-xs: 0.75rem;
  --fs-sm: 0.875rem;
  --fs-base: 0.9375rem;
  --fs-lg: 1.125rem;
  --fs-xl: 1.5rem;
  --fs-2xl: 2rem;

  --radius: 6px;
  --radius-sm: 4px;
  --header-h: 56px;
  --content-max: 720px;
  --sidebar-w: 260px;
  --toc-w: 220px;
  --gutter: 24px;

  --z-header: 50;
  --z-dialog: 100;

  color-scheme: dark;
}

[data-theme="light"] {
  --color-bg: #ffffff;
  --color-fg: #0a0a0a;
  --color-muted: #52525b;
  --color-subtle: #71717a;
  --color-border: #e4e4e7;
  --color-surface: #fafafa;
  --color-surface-hover: #f4f4f5;
  --color-accent: #0a0a0a;
  --color-accent-fg: #ffffff;
  --color-link: #0a0a0a;

  color-scheme: light;
}
```

**Step 3: Commit**

```bash
git add src/styles/
git commit -m "feat: reset and theme tokens"
```

---

## Task 8: Prose styles

**Files:**
- Create: `src/styles/prose.css`

**Step 1: Write `src/styles/prose.css`**

```css
.prose { max-width: var(--content-max); font-size: var(--fs-base); }
.prose h1 {
  font-size: var(--fs-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 .5em;
}
.prose h2 {
  font-size: var(--fs-xl);
  font-weight: 600;
  letter-spacing: -0.015em;
  margin: 2.5em 0 .75em;
  padding-top: .5em;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: .5em;
}
.prose h3 {
  font-size: var(--fs-lg);
  font-weight: 600;
  margin: 2em 0 .5em;
}
.prose p { margin: 0 0 1em; }
.prose a { color: var(--color-link); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--color-border); }
.prose a:hover { text-decoration-color: currentColor; }
.prose ul, .prose ol { margin: 0 0 1em; padding-left: 1.5em; }
.prose li { margin: .25em 0; }
.prose code {
  font-family: var(--font-mono);
  font-size: .9em;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
}
.prose pre {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1em;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 0 0 1em;
}
.prose pre code { background: transparent; border: none; padding: 0; font-size: inherit; }
.prose blockquote {
  border-left: 2px solid var(--color-border);
  padding-left: 1em;
  margin: 0 0 1em;
  color: var(--color-muted);
}
.prose hr { border: none; border-top: 1px solid var(--color-border); margin: 2em 0; }
.prose table { width: 100%; border-collapse: collapse; margin: 0 0 1em; font-size: var(--fs-sm); }
.prose th, .prose td { border: 1px solid var(--color-border); padding: .5em .75em; text-align: left; }
.prose th { background: var(--color-surface); font-weight: 600; }
```

**Step 2: Commit**

```bash
git add src/styles/prose.css
git commit -m "feat: prose typography styles"
```

---

## Task 9: Root Layout with theme bootstrap

**Files:**
- Create: `src/layouts/Layout.astro`

**Step 1: Write the layout**

```astro
---
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/prose.css";
import { docsConfig } from "../config/docs.config";

interface Props {
  title: string;
  description: string;
  locale: string;
}

const { title, description, locale } = Astro.props;
const themeDefault = docsConfig.theme.default;
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <script is:inline define:vars={{ themeDefault }}>
      (function () {
        try {
          var stored = localStorage.getItem("theme");
          var theme = stored || themeDefault;
          if (theme === "system") {
            theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
          }
          document.documentElement.setAttribute("data-theme", theme);
        } catch (e) {
          document.documentElement.setAttribute("data-theme", "dark");
        }
      })();
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  body { min-height: 100vh; }
</style>
```

**Step 2: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: root layout with theme FOUC script"
```

---

## Task 10: Root and locale redirects

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/[locale]/index.astro`

**Step 1: Replace `src/pages/index.astro`**

```astro
---
import { docsConfig, getCurrentVersion } from "../config/docs.config";
const current = getCurrentVersion();
const target = `/${docsConfig.i18n.defaultLocale}/${current.id}/`;
return Astro.redirect(target);
---
```

**Step 2: Create `src/pages/[locale]/index.astro`**

```astro
---
import { docsConfig, getCurrentVersion } from "../../config/docs.config";
import { isLocale } from "../../lib/routing";

export function getStaticPaths() {
  return docsConfig.i18n.locales.map((l) => ({ params: { locale: l.code } }));
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect("/");
const current = getCurrentVersion();
return Astro.redirect(`/${locale}/${current.id}/`);
---
```

**Step 3: Verify redirects**

Run (background): `npm run dev`

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:4321/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:4321/en/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:4321/pt-br/
```

Expected: each returns `301` (or `302`) with a redirect URL pointing at `/en/v1/`, `/en/v1/`, `/pt-br/v1/` respectively.

Stop the dev server.

**Step 4: Commit**

```bash
git add src/pages/index.astro src/pages/[locale]/index.astro
git commit -m "feat: root and locale redirects"
```

---

## Task 11: Content page route (minimal)

**Files:**
- Create: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write the page**

```astro
---
import { getCollection, render } from "astro:content";
import Layout from "../../../layouts/Layout.astro";
import { parseEntryId, buildDocHref } from "../../../lib/routing";

export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map((entry) => {
    const parsed = parseEntryId(entry.id);
    return {
      params: {
        locale: parsed.locale,
        version: parsed.version,
        slug: parsed.slug || undefined,
      },
      props: { entry, parsed },
    };
  });
}

const { entry, parsed } = Astro.props;
const { Content, headings } = await render(entry);
---
<Layout title={entry.data.title} description={entry.data.description} locale={parsed.locale}>
  <main class="content">
    <article class="prose">
      <h1>{entry.data.title}</h1>
      <Content />
    </article>
  </main>
</Layout>

<style>
  .content {
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--gutter);
  }
</style>
```

**Step 2: Verify**

Run (background): `npm run dev`

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/guides/installation/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/pt-br/v1/guides/installation/
```

Expected: `200` for each.

Stop the dev server.

**Step 3: Commit**

```bash
git add src/pages/
git commit -m "feat: render docs content via content collection"
```

---

## Task 12: Sidebar builder + unit tests

**Files:**
- Create: `src/lib/sidebar.ts`
- Create: `src/lib/sidebar.test.ts`

**Step 1: Write the failing tests `src/lib/sidebar.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { buildSidebarTree, type SidebarEntry, type GroupMeta } from "./sidebar";

const make = (id: string, title: string, order = 100, hidden = false): SidebarEntry => ({
  id,
  title,
  order,
  hidden,
});

describe("buildSidebarTree", () => {
  it("returns a flat list when there are no folders", () => {
    const entries = [
      make("v1/en/index", "Home", 1),
      make("v1/en/about", "About", 2),
    ];
    const tree = buildSidebarTree({ version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree.map((n) => n.label)).toEqual(["Home", "About"]);
    expect(tree[0].href).toBe("/en/v1/");
    expect(tree[1].href).toBe("/en/v1/about/");
  });

  it("nests entries under folders using _group.yaml metadata", () => {
    const entries = [
      make("v1/en/index", "Home", 1),
      make("v1/en/guides/installation", "Install", 1),
      make("v1/en/guides/quickstart", "Quickstart", 2),
    ];
    const groups = new Map<string, GroupMeta>([
      ["guides", { label: "Guides", order: 2, collapsed: false }],
    ]);
    const tree = buildSidebarTree({ version: "v1", locale: "en", entries, groups });
    expect(tree).toHaveLength(2);
    expect(tree[0].label).toBe("Home");
    expect(tree[1].label).toBe("Guides");
    expect(tree[1].children?.map((c) => c.label)).toEqual(["Install", "Quickstart"]);
  });

  it("filters out hidden entries", () => {
    const entries = [
      make("v1/en/index", "Home", 1),
      make("v1/en/secret", "Secret", 2, true),
    ];
    const tree = buildSidebarTree({ version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree).toHaveLength(1);
  });

  it("humanizes folder names when no _group.yaml exists", () => {
    const entries = [make("v1/en/api-reference/client", "Client", 1)];
    const tree = buildSidebarTree({ version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree[0].label).toBe("Api reference");
  });

  it("only returns entries for the requested version and locale", () => {
    const entries = [
      make("v1/en/index", "EN Home", 1),
      make("v1/pt-br/index", "PT Home", 1),
      make("v2/en/index", "V2 Home", 1),
    ];
    const tree = buildSidebarTree({ version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe("EN Home");
  });
});
```

**Step 2: Run — expect failure**

Run: `npm test`
Expected: FAIL (module missing).

**Step 3: Write `src/lib/sidebar.ts`**

```ts
import { parseEntryId, buildDocHref } from "./routing";

export interface SidebarEntry {
  id: string;
  title: string;
  order: number;
  hidden: boolean;
}

export interface GroupMeta {
  label: string;
  order: number;
  collapsed: boolean;
}

export interface SidebarNode {
  label: string;
  href?: string;
  order: number;
  collapsed?: boolean;
  children?: SidebarNode[];
}

interface BuildArgs {
  version: string;
  locale: string;
  entries: SidebarEntry[];
  /** key = folder path relative to `{version}/{locale}/`, e.g. "guides" or "guides/advanced" */
  groups: Map<string, GroupMeta>;
}

function humanize(folder: string): string {
  const last = folder.split("/").pop() ?? folder;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

interface Bucket {
  kind: "folder";
  folderPath: string;
  children: Map<string, Bucket | Leaf>;
}
interface Leaf {
  kind: "leaf";
  entry: SidebarEntry;
  parsed: ReturnType<typeof parseEntryId>;
}

export function buildSidebarTree(args: BuildArgs): SidebarNode[] {
  const { version, locale, entries, groups } = args;

  const root: Bucket = { kind: "folder", folderPath: "", children: new Map() };

  for (const entry of entries) {
    if (entry.hidden) continue;
    const parsed = parseEntryId(entry.id);
    if (parsed.version !== version || parsed.locale !== locale) continue;

    const slugParts = parsed.slug ? parsed.slug.split("/") : [];
    let cursor = root;
    let folderPath = "";

    // For index ("" slug) we attach directly to cursor
    // For "guides/installation" we descend into "guides" then attach "installation"
    const leafKey = slugParts.length === 0 ? "__index__" : slugParts[slugParts.length - 1];
    const folderParts = slugParts.length === 0 ? [] : slugParts.slice(0, -1);

    for (const part of folderParts) {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      let next = cursor.children.get(part);
      if (!next || next.kind !== "folder") {
        next = { kind: "folder", folderPath, children: new Map() };
        cursor.children.set(part, next);
      }
      cursor = next;
    }

    cursor.children.set(leafKey, { kind: "leaf", entry, parsed });
  }

  const toNode = (bucket: Bucket | Leaf, key: string): SidebarNode => {
    if (bucket.kind === "leaf") {
      return {
        label: bucket.entry.title,
        href: buildDocHref(bucket.parsed),
        order: bucket.entry.order,
      };
    }
    const meta = groups.get(bucket.folderPath);
    const children = [...bucket.children.entries()]
      .map(([k, b]) => toNode(b, k))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    return {
      label: meta?.label ?? humanize(bucket.folderPath),
      order: meta?.order ?? 100,
      collapsed: meta?.collapsed ?? false,
      children,
    };
  };

  return [...root.children.entries()]
    .map(([k, b]) => toNode(b, k))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}
```

**Step 4: Run — expect pass**

Run: `npm test`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/sidebar.ts src/lib/sidebar.test.ts
git commit -m "feat: sidebar tree builder with tests"
```

---

## Task 13: Load _group.yaml files at build time

**Files:**
- Create: `src/lib/groups.ts`

**Step 1: Install yaml parser**

Run:
```bash
npm install yaml
```

**Step 2: Write `src/lib/groups.ts`**

```ts
import { parse } from "yaml";
import type { GroupMeta } from "./sidebar";

// Astro-native: bundler-time file discovery. Matches any _group.yaml under content/docs.
const raw = import.meta.glob("/src/content/docs/**/_group.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Returns a Map keyed by folder path relative to a given {version, locale} root.
 * Example: for path "/src/content/docs/v1/en/guides/_group.yaml" and args
 * {version:"v1", locale:"en"}, the key is "guides".
 */
export function loadGroups(version: string, locale: string): Map<string, GroupMeta> {
  const prefix = `/src/content/docs/${version}/${locale}/`;
  const map = new Map<string, GroupMeta>();
  for (const [path, body] of Object.entries(raw)) {
    if (!path.startsWith(prefix)) continue;
    const rel = path.slice(prefix.length); // e.g. "guides/_group.yaml"
    const folder = rel.replace(/\/_group\.yaml$/, "");
    if (!folder) continue;
    const data = parse(body) as Partial<GroupMeta>;
    map.set(folder, {
      label: data.label ?? folder,
      order: typeof data.order === "number" ? data.order : 100,
      collapsed: data.collapsed ?? false,
    });
  }
  return map;
}
```

**Step 3: Commit**

```bash
git add src/lib/groups.ts package.json package-lock.json
git commit -m "feat: load _group.yaml metadata via import.meta.glob"
```

---

## Task 14: Sidebar component and wire into layout

**Files:**
- Create: `src/components/Sidebar.astro`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write `src/components/Sidebar.astro`**

```astro
---
import { getCollection } from "astro:content";
import { buildSidebarTree, type SidebarNode } from "../lib/sidebar";
import { loadGroups } from "../lib/groups";

interface Props {
  locale: string;
  version: string;
  currentHref: string;
}
const { locale, version, currentHref } = Astro.props;

const entries = await getCollection("docs");
const simpleEntries = entries.map((e) => ({
  id: e.id,
  title: e.data.sidebar.label ?? e.data.title,
  order: e.data.sidebar.order,
  hidden: e.data.sidebar.hidden,
}));
const groups = loadGroups(version, locale);
const tree = buildSidebarTree({ version, locale, entries: simpleEntries, groups });

const isActive = (href?: string) => href === currentHref;
---
<nav class="sidebar" aria-label="Documentation navigation">
  <ul>
    {tree.map((node) => renderNode(node))}
  </ul>
</nav>

{/* Recursive rendering without client-side code */}
<script lang="ts">
  // no-op; recursion is done in markup below
</script>

<script is:inline>
  // No-op placeholder to silence lint; recursion done in .astro logic.
</script>

<style>
  .sidebar {
    font-size: var(--fs-sm);
    padding: var(--gutter) 0 var(--gutter) var(--gutter);
  }
  .sidebar ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sidebar .group {
    margin: 1em 0 .25em;
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--color-subtle);
  }
  .sidebar .item { padding: .25em 0; }
  .sidebar a {
    color: var(--color-muted);
    padding: .25em .5em;
    border-radius: var(--radius-sm);
    display: block;
    border-left: 2px solid transparent;
    margin-left: -.5em;
  }
  .sidebar a:hover { color: var(--color-fg); text-decoration: none; }
  .sidebar a.active {
    color: var(--color-fg);
    border-left-color: var(--color-fg);
    background: var(--color-surface);
  }
  .sidebar .children {
    padding-left: .75em;
    border-left: 1px solid var(--color-border);
    margin-left: .5em;
  }
</style>
```

The recursion in Astro is done by defining a helper component. Replace the above with a version that uses a self-referencing approach:

**Step 2: Replace `src/components/Sidebar.astro` with a recursive version**

```astro
---
import { getCollection } from "astro:content";
import { buildSidebarTree, type SidebarNode } from "../lib/sidebar";
import { loadGroups } from "../lib/groups";
import SidebarNodeView from "./SidebarNode.astro";

interface Props {
  locale: string;
  version: string;
  currentHref: string;
}
const { locale, version, currentHref } = Astro.props;

const entries = await getCollection("docs");
const simpleEntries = entries.map((e) => ({
  id: e.id,
  title: e.data.sidebar.label ?? e.data.title,
  order: e.data.sidebar.order,
  hidden: e.data.sidebar.hidden,
}));
const groups = loadGroups(version, locale);
const tree = buildSidebarTree({ version, locale, entries: simpleEntries, groups });
---
<nav class="sidebar" aria-label="Documentation navigation">
  <ul>
    {tree.map((node) => <SidebarNodeView node={node} currentHref={currentHref} />)}
  </ul>
</nav>

<style>
  .sidebar {
    font-size: var(--fs-sm);
    padding: var(--gutter) 0 var(--gutter) var(--gutter);
  }
  .sidebar ul { list-style: none; margin: 0; padding: 0; }
</style>
```

**Step 3: Create `src/components/SidebarNode.astro`**

```astro
---
import type { SidebarNode } from "../lib/sidebar";
import Self from "./SidebarNode.astro";

interface Props {
  node: SidebarNode;
  currentHref: string;
}
const { node, currentHref } = Astro.props;
const isLeaf = !!node.href;
const isActive = node.href === currentHref;
---
{isLeaf ? (
  <li class="item">
    <a href={node.href} class={isActive ? "active" : ""}>{node.label}</a>
  </li>
) : (
  <li class="group-wrap">
    <div class="group">{node.label}</div>
    <ul class="children">
      {node.children?.map((child) => <Self node={child} currentHref={currentHref} />)}
    </ul>
  </li>
)}

<style>
  .item { padding: .125em 0; }
  a {
    color: var(--color-muted);
    padding: .25em .5em;
    border-radius: var(--radius-sm);
    display: block;
    border-left: 2px solid transparent;
    margin-left: -.5em;
  }
  a:hover { color: var(--color-fg); text-decoration: none; }
  a.active {
    color: var(--color-fg);
    border-left-color: var(--color-fg);
    background: var(--color-surface);
  }
  .group {
    margin: 1em 0 .25em;
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--color-subtle);
    padding: 0 .5em;
  }
  .children {
    list-style: none;
    margin: 0;
    padding: 0 0 0 .75em;
    border-left: 1px solid var(--color-border);
    margin-left: .5em;
  }
</style>
```

**Step 4: Modify `src/pages/[locale]/[version]/[...slug].astro` to include the sidebar**

Replace body with a two-column layout that includes the sidebar:

```astro
---
import { getCollection, render } from "astro:content";
import Layout from "../../../layouts/Layout.astro";
import Sidebar from "../../../components/Sidebar.astro";
import { parseEntryId, buildDocHref } from "../../../lib/routing";

export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map((entry) => {
    const parsed = parseEntryId(entry.id);
    return {
      params: {
        locale: parsed.locale,
        version: parsed.version,
        slug: parsed.slug || undefined,
      },
      props: { entry, parsed },
    };
  });
}

const { entry, parsed } = Astro.props;
const { Content } = await render(entry);
const currentHref = buildDocHref(parsed);
---
<Layout title={entry.data.title} description={entry.data.description} locale={parsed.locale}>
  <div class="shell">
    <aside class="col-sidebar">
      <Sidebar locale={parsed.locale} version={parsed.version} currentHref={currentHref} />
    </aside>
    <main class="col-content">
      <article class="prose">
        <h1>{entry.data.title}</h1>
        <Content />
      </article>
    </main>
  </div>
</Layout>

<style>
  .shell {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    max-width: 1280px;
    margin: 0 auto;
    min-height: 100vh;
  }
  .col-sidebar {
    border-right: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    align-self: start;
    max-height: 100vh;
    overflow-y: auto;
  }
  .col-content {
    padding: var(--gutter);
    min-width: 0;
  }
</style>
```

**Step 5: Verify**

Run (background): `npm run dev`
Visit `/en/v1/` and `/en/v1/guides/installation/` and confirm a sidebar with "Welcome" and "Guides > Install / Quickstart" appears, and the current page is highlighted.

Run: `curl -s http://localhost:4321/en/v1/guides/installation/ | grep -c "Guides"`

Expected: `>= 1`.

Stop the dev server.

**Step 6: Commit**

```bash
git add src/components/ src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: sidebar with folder tree and active highlight"
```

---

## Task 15: TOC component with scroll-spy

**Files:**
- Create: `src/components/TOC.astro`
- Create: `src/scripts/toc.ts`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write `src/scripts/toc.ts`**

```ts
export function initTOC() {
  const toc = document.querySelector<HTMLElement>("[data-toc]");
  if (!toc) return;
  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((a) => {
    links.set(a.getAttribute("href")!.slice(1), a);
  });

  const setActive = (id: string) => {
    toc.querySelectorAll("a.active").forEach((a) => a.classList.remove("active"));
    links.get(id)?.classList.add("active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      setActive(top.target.id);
    },
    { rootMargin: "0px 0px -70% 0px", threshold: 0 }
  );

  document.querySelectorAll<HTMLElement>("article.prose h2[id], article.prose h3[id]").forEach((h) => {
    observer.observe(h);
  });
}
```

**Step 2: Write `src/components/TOC.astro`**

```astro
---
interface Heading { depth: number; slug: string; text: string; }
interface Props { headings: Heading[]; }
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
<aside class="toc" aria-label="On this page" data-toc>
  {items.length > 0 && (
    <>
      <div class="title">On this page</div>
      <ul>
        {items.map((h) => (
          <li class:list={["lvl-" + h.depth]}>
            <a href={`#${h.slug}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </>
  )}
</aside>

<script>
  import { initTOC } from "../scripts/toc.ts";
  initTOC();
</script>

<style>
  .toc {
    position: sticky;
    top: var(--header-h);
    padding: var(--gutter);
    font-size: var(--fs-sm);
    max-height: calc(100vh - var(--header-h));
    overflow-y: auto;
  }
  .title {
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--color-subtle);
    margin-bottom: .5em;
  }
  ul { list-style: none; margin: 0; padding: 0; }
  li { padding: .125em 0; }
  .lvl-3 { padding-left: 1em; }
  a {
    color: var(--color-muted);
    display: block;
    padding: .125em 0;
  }
  a:hover { color: var(--color-fg); text-decoration: none; }
  a.active { color: var(--color-fg); }
</style>
```

**Step 3: Update `src/pages/[locale]/[version]/[...slug].astro` to three-column**

Replace:

```astro
---
import { getCollection, render } from "astro:content";
import Layout from "../../../layouts/Layout.astro";
import Sidebar from "../../../components/Sidebar.astro";
import TOC from "../../../components/TOC.astro";
import { parseEntryId, buildDocHref } from "../../../lib/routing";

export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map((entry) => {
    const parsed = parseEntryId(entry.id);
    return {
      params: {
        locale: parsed.locale,
        version: parsed.version,
        slug: parsed.slug || undefined,
      },
      props: { entry, parsed },
    };
  });
}

const { entry, parsed } = Astro.props;
const { Content, headings } = await render(entry);
const currentHref = buildDocHref(parsed);
---
<Layout title={entry.data.title} description={entry.data.description} locale={parsed.locale}>
  <div class="shell">
    <aside class="col-sidebar">
      <Sidebar locale={parsed.locale} version={parsed.version} currentHref={currentHref} />
    </aside>
    <main class="col-content">
      <article class="prose">
        <h1>{entry.data.title}</h1>
        <Content />
      </article>
    </main>
    <aside class="col-toc">
      <TOC headings={headings} />
    </aside>
  </div>
</Layout>

<style>
  .shell {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr var(--toc-w);
    max-width: 1280px;
    margin: 0 auto;
    min-height: 100vh;
  }
  .col-sidebar {
    border-right: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    align-self: start;
    max-height: 100vh;
    overflow-y: auto;
  }
  .col-content {
    padding: var(--gutter);
    min-width: 0;
  }
  .col-toc {
    border-left: 1px solid var(--color-border);
  }
  @media (max-width: 1024px) {
    .shell { grid-template-columns: var(--sidebar-w) 1fr; }
    .col-toc { display: none; }
  }
  @media (max-width: 768px) {
    .shell { grid-template-columns: 1fr; }
    .col-sidebar { display: none; }
  }
</style>
```

**Step 4: Verify**

Run (background): `npm run dev`
Visit `/en/v1/guides/installation/` and confirm a right-sidebar "On this page" lists "Prerequisites", "Install", "Verify" and the current section highlights while scrolling.

Stop the dev server.

**Step 5: Commit**

```bash
git add src/components/TOC.astro src/scripts/toc.ts src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: on-this-page TOC with scroll-spy"
```

---

## Task 16: Theme toggle

**Files:**
- Create: `src/scripts/theme.ts`
- Create: `src/components/ThemeToggle.astro`

**Step 1: Write `src/scripts/theme.ts`**

```ts
type Theme = "dark" | "light" | "system";

function getStored(): Theme | null {
  const v = localStorage.getItem("theme");
  if (v === "dark" || v === "light" || v === "system") return v;
  return null;
}

function resolveSystem(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const resolved = theme === "system" ? resolveSystem() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-pref", theme);
}

export function initThemeToggle(defaultTheme: Theme) {
  const initial = getStored() ?? defaultTheme;
  apply(initial);

  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = (document.documentElement.getAttribute("data-theme-pref") as Theme) || defaultTheme;
      const next: Theme = current === "dark" ? "light" : current === "light" ? "system" : "dark";
      localStorage.setItem("theme", next);
      apply(next);
    });
  });

  // React to system changes when pref is "system"
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const pref = document.documentElement.getAttribute("data-theme-pref") as Theme;
    if (pref === "system") apply("system");
  });
}
```

**Step 2: Write `src/components/ThemeToggle.astro`**

```astro
---
import { docsConfig } from "../config/docs.config";
const defaultTheme = docsConfig.theme.default;
---
<button type="button" data-theme-toggle aria-label="Toggle theme">
  <span class="icon icon-dark" aria-hidden="true">🌙</span>
  <span class="icon icon-light" aria-hidden="true">☀</span>
  <span class="icon icon-system" aria-hidden="true">◐</span>
</button>

<script define:vars={{ defaultTheme }}>
  import("../scripts/theme.ts").then((m) => m.initThemeToggle(defaultTheme));
</script>

<style>
  button {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-muted);
  }
  button:hover { background: var(--color-surface-hover); color: var(--color-fg); }
  .icon { display: none; font-size: 14px; }
  :global([data-theme-pref="dark"]) .icon-dark { display: inline; }
  :global([data-theme-pref="light"]) .icon-light { display: inline; }
  :global([data-theme-pref="system"]) .icon-system { display: inline; }
</style>
```

**Step 3: Commit**

```bash
git add src/scripts/theme.ts src/components/ThemeToggle.astro
git commit -m "feat: tri-state theme toggle"
```

---

## Task 17: Locale and Version pickers (CSS-only)

**Files:**
- Create: `src/components/LocalePicker.astro`
- Create: `src/components/VersionPicker.astro`

**Step 1: Write `src/components/LocalePicker.astro`**

```astro
---
import { docsConfig } from "../config/docs.config";
import { getCurrentVersion } from "../config/docs.config";

interface Props {
  currentLocale: string;
  currentVersion: string;
  currentSlug: string;
}
const { currentLocale, currentVersion, currentSlug } = Astro.props;
const currentLabel = docsConfig.i18n.locales.find((l) => l.code === currentLocale)?.label ?? currentLocale;
---
<details class="picker">
  <summary>
    <span class="label">{currentLabel}</span>
    <span class="chev" aria-hidden="true">▾</span>
  </summary>
  <ul class="menu">
    {docsConfig.i18n.locales.map((l) => {
      const href = `/${l.code}/${currentVersion}/${currentSlug}${currentSlug ? "/" : ""}`;
      return (
        <li>
          <a href={href} class={l.code === currentLocale ? "active" : ""}>{l.label}</a>
        </li>
      );
    })}
  </ul>
</details>

<style>
  .picker { position: relative; }
  summary {
    list-style: none;
    cursor: pointer;
    padding: .375em .75em;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: .5em;
    font-size: var(--fs-sm);
    color: var(--color-muted);
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover { color: var(--color-fg); border-color: var(--color-muted); }
  .chev { font-size: 10px; }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    list-style: none;
    margin: 0;
    padding: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    min-width: 180px;
    z-index: var(--z-header);
  }
  .menu a {
    display: block;
    padding: .375em .75em;
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
    color: var(--color-muted);
  }
  .menu a:hover { background: var(--color-surface-hover); color: var(--color-fg); text-decoration: none; }
  .menu a.active { color: var(--color-fg); }
</style>
```

**Step 2: Write `src/components/VersionPicker.astro`**

```astro
---
import { docsConfig } from "../config/docs.config";

interface Props {
  currentLocale: string;
  currentVersion: string;
}
const { currentLocale, currentVersion } = Astro.props;
const currentLabel = docsConfig.versions.find((v) => v.id === currentVersion)?.label ?? currentVersion;
---
<details class="picker">
  <summary>
    <span class="label">{currentLabel}</span>
    <span class="chev" aria-hidden="true">▾</span>
  </summary>
  <ul class="menu">
    {docsConfig.versions.map((v) => (
      <li>
        <a href={`/${currentLocale}/${v.id}/`} class={v.id === currentVersion ? "active" : ""}>
          {v.label}{v.current ? " (current)" : ""}
        </a>
      </li>
    ))}
  </ul>
</details>

<style>
  /* Same shell as LocalePicker — duplicated for scoping clarity. */
  .picker { position: relative; }
  summary {
    list-style: none;
    cursor: pointer;
    padding: .375em .75em;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: .5em;
    font-size: var(--fs-sm);
    color: var(--color-muted);
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover { color: var(--color-fg); border-color: var(--color-muted); }
  .chev { font-size: 10px; }
  .menu {
    position: absolute;
    left: 0;
    top: calc(100% + 4px);
    list-style: none;
    margin: 0;
    padding: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    min-width: 140px;
    z-index: var(--z-header);
  }
  .menu a {
    display: block;
    padding: .375em .75em;
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
    color: var(--color-muted);
  }
  .menu a:hover { background: var(--color-surface-hover); color: var(--color-fg); text-decoration: none; }
  .menu a.active { color: var(--color-fg); }
</style>
```

**Step 3: Commit**

```bash
git add src/components/LocalePicker.astro src/components/VersionPicker.astro
git commit -m "feat: locale and version pickers"
```

---

## Task 18: Header with placeholder search slot

**Files:**
- Create: `src/components/Header.astro`
- Modify: `src/layouts/Layout.astro`

**Step 1: Write `src/components/Header.astro`**

```astro
---
import { docsConfig } from "../config/docs.config";
import LocalePicker from "./LocalePicker.astro";
import VersionPicker from "./VersionPicker.astro";
import ThemeToggle from "./ThemeToggle.astro";

interface Props {
  currentLocale: string;
  currentVersion: string;
  currentSlug: string;
}
const { currentLocale, currentVersion, currentSlug } = Astro.props;
---
<header class="header">
  <div class="inner">
    <div class="left">
      <a href={`/${currentLocale}/${currentVersion}/`} class="brand">
        <img src={docsConfig.site.logo.src} alt={docsConfig.site.logo.alt} class="logo" />
        <span class="brand-text">{docsConfig.site.title}</span>
      </a>
      <VersionPicker currentLocale={currentLocale} currentVersion={currentVersion} />
    </div>
    <div class="middle">
      <div class="search-slot">
        <slot name="search" />
      </div>
    </div>
    <div class="right">
      {docsConfig.headerLinks.map((l) => (
        <a href={l.href} class="link" target={l.external ? "_blank" : undefined} rel={l.external ? "noopener" : undefined}>
          {l.label}
        </a>
      ))}
      {docsConfig.site.github && (
        <a href={docsConfig.site.github} class="link" target="_blank" rel="noopener" aria-label="GitHub">GitHub</a>
      )}
      <LocalePicker currentLocale={currentLocale} currentVersion={currentVersion} currentSlug={currentSlug} />
      <ThemeToggle />
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    height: var(--header-h);
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }
  .inner {
    max-width: 1280px;
    margin: 0 auto;
    height: 100%;
    padding: 0 var(--gutter);
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--gutter);
    align-items: center;
  }
  .left, .right { display: flex; align-items: center; gap: 12px; }
  .middle { min-width: 0; display: flex; justify-content: center; }
  .search-slot { width: 100%; max-width: 420px; }
  .brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
  .brand:hover { text-decoration: none; }
  .logo { width: 20px; height: 20px; }
  .link {
    font-size: var(--fs-sm);
    color: var(--color-muted);
    padding: .375em .5em;
  }
  .link:hover { color: var(--color-fg); text-decoration: none; }
  @media (max-width: 768px) {
    .brand-text { display: none; }
    .middle { display: none; }
  }
</style>
```

**Step 2: Modify `src/layouts/Layout.astro`** to accept header props and render the header

Replace `Layout.astro` with:

```astro
---
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/prose.css";
import { docsConfig } from "../config/docs.config";
import Header from "../components/Header.astro";

interface Props {
  title: string;
  description: string;
  locale: string;
  version?: string;
  slug?: string;
}

const { title, description, locale, version, slug = "" } = Astro.props;
const themeDefault = docsConfig.theme.default;
const showHeader = !!version;
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <script is:inline define:vars={{ themeDefault }}>
      (function () {
        try {
          var stored = localStorage.getItem("theme");
          var pref = stored || themeDefault;
          var theme = pref;
          if (pref === "system") {
            theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
          }
          document.documentElement.setAttribute("data-theme", theme);
          document.documentElement.setAttribute("data-theme-pref", pref);
        } catch (e) {
          document.documentElement.setAttribute("data-theme", "dark");
          document.documentElement.setAttribute("data-theme-pref", "dark");
        }
      })();
    </script>
  </head>
  <body>
    {showHeader && (
      <Header currentLocale={locale} currentVersion={version!} currentSlug={slug} />
    )}
    <slot />
  </body>
</html>

<style is:global>
  body { min-height: 100vh; }
</style>
```

**Step 3: Modify `src/pages/[locale]/[version]/[...slug].astro`** to pass version and slug to Layout

In the component's frontmatter, pass extra props to `<Layout>`:

```astro
<Layout
  title={entry.data.title}
  description={entry.data.description}
  locale={parsed.locale}
  version={parsed.version}
  slug={parsed.slug}
>
```

(Only the `<Layout ...>` opening tag changes — keep the rest as in Task 15.)

**Step 4: Verify**

Run (background): `npm run dev`
Visit `/en/v1/guides/installation/`. Confirm:
- Sticky header with logo, version "v1.0", empty-center (search comes next), locale "English", theme toggle
- Version dropdown lists v1.0 (current)
- Locale dropdown switches to `/pt-br/v1/guides/installation/`
- Theme toggle cycles dark → light → system and persists on reload

Stop the dev server.

**Step 5: Commit**

```bash
git add src/components/Header.astro src/layouts/Layout.astro src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: header with pickers, links, theme toggle"
```

---

## Task 19: Add a logo asset

**Files:**
- Create: `public/logo.svg`

**Step 1: Write a placeholder logo**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <rect x="2" y="2" width="20" height="20" rx="4"/>
</svg>
```

**Step 2: Commit**

```bash
git add public/logo.svg
git commit -m "chore: placeholder logo"
```

---

## Task 20: AI-content helpers + unit tests

**Files:**
- Create: `src/lib/ai-content.ts`
- Create: `src/lib/ai-content.test.ts`

**Step 1: Write the failing tests `src/lib/ai-content.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  sliceSections,
  buildContextHeader,
  stripFrontmatter,
} from "./ai-content";

describe("stripFrontmatter", () => {
  it("removes YAML frontmatter block at the top", () => {
    const input = "---\ntitle: x\n---\n\n# Hello\n\nBody.";
    expect(stripFrontmatter(input)).toBe("# Hello\n\nBody.");
  });

  it("is a no-op when no frontmatter is present", () => {
    expect(stripFrontmatter("# Hello")).toBe("# Hello");
  });
});

describe("sliceSections", () => {
  it("returns one section per ## heading, including up to the next ##", () => {
    const md = [
      "# Title",
      "",
      "Intro paragraph.",
      "",
      "## Install",
      "",
      "Run npm install.",
      "",
      "### Options",
      "",
      "More detail.",
      "",
      "## Verify",
      "",
      "Run verify.",
    ].join("\n");
    const sections = sliceSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Install");
    expect(sections[0].anchor).toBe("install");
    expect(sections[0].markdown).toContain("### Options");
    expect(sections[0].markdown).not.toContain("## Verify");
    expect(sections[1].heading).toBe("Verify");
  });

  it("returns an empty array when no ## headings exist", () => {
    const md = "# Title\n\nOnly intro.";
    expect(sliceSections(md)).toEqual([]);
  });

  it("slugs heading text lowercase with hyphens", () => {
    const md = "# T\n\n## Getting Started With rfnry\n\nText.";
    const sections = sliceSections(md);
    expect(sections[0].anchor).toBe("getting-started-with-rfnry");
  });
});

describe("buildContextHeader", () => {
  it("includes source, version, locale", () => {
    const header = buildContextHeader({
      url: "https://docs.example/en/v1/guides/installation/",
      version: "v1",
      locale: "en",
    });
    expect(header).toContain("Source: https://docs.example/en/v1/guides/installation/");
    expect(header).toContain("Version: v1");
    expect(header).toContain("Locale: en");
  });

  it("includes an anchor when provided", () => {
    const header = buildContextHeader({
      url: "https://docs.example/en/v1/x/",
      version: "v1",
      locale: "en",
      anchor: "verify",
    });
    expect(header).toContain("Anchor: #verify");
  });
});
```

**Step 2: Run — expect failure**

Run: `npm test`
Expected: FAIL.

**Step 3: Write `src/lib/ai-content.ts`**

```ts
export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) return markdown;
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) return markdown;
  const rest = markdown.slice(end + 4);
  return rest.replace(/^\s*\n/, "");
}

export interface Section {
  heading: string;
  anchor: string;
  markdown: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Splits markdown into sections at H2 boundaries.
 * Each section includes its H2 line and all content up to the next H2 (exclusive).
 * Content above the first H2 is ignored (belongs to the page intro, not a section).
 * Fenced code blocks are respected — a "## " inside a code fence is not a heading.
 */
export function sliceSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let inFence = false;
  let current: { heading: string; anchor: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (/^```|^~~~/.test(line)) inFence = !inFence;

    if (!inFence && /^##\s+/.test(line)) {
      if (current) {
        sections.push({
          heading: current.heading,
          anchor: current.anchor,
          markdown: current.lines.join("\n").trimEnd(),
        });
      }
      const heading = line.replace(/^##\s+/, "").trim();
      current = { heading, anchor: slugify(heading), lines: [line] };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) {
    sections.push({
      heading: current.heading,
      anchor: current.anchor,
      markdown: current.lines.join("\n").trimEnd(),
    });
  }

  return sections;
}

export interface ContextArgs {
  url: string;
  version: string;
  locale: string;
  anchor?: string;
}

export function buildContextHeader(args: ContextArgs): string {
  const lines = [
    `> Source: ${args.url}`,
    `> Version: ${args.version} · Locale: ${args.locale}`,
  ];
  if (args.anchor) lines.push(`> Anchor: #${args.anchor}`);
  lines.push("");
  return lines.join("\n");
}
```

**Step 4: Run — expect pass**

Run: `npm test`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/ai-content.ts src/lib/ai-content.test.ts
git commit -m "feat: ai-content helpers (frontmatter, sections, context header)"
```

---

## Task 21: Per-page `.md` endpoint

**Files:**
- Create: `src/pages/[locale]/[version]/[...slug].md.ts`

**Step 1: Write the endpoint**

```ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
import { stripFrontmatter, buildContextHeader } from "../../../lib/ai-content";
import { docsConfig } from "../../../config/docs.config";

export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map((entry) => {
    const parsed = parseEntryId(entry.id);
    return {
      params: {
        locale: parsed.locale,
        version: parsed.version,
        slug: parsed.slug || undefined,
      },
      props: { entry, parsed },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { entry, parsed } = props as any;
  const body = entry.body as string;
  const url = docsConfig.site.url + buildDocHref(parsed);
  const header = buildContextHeader({ url, version: parsed.version, locale: parsed.locale });
  const title = `# ${entry.data.title}\n\n`;
  const content = header + title + stripFrontmatter(body);
  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
```

**Step 2: Verify**

Run (background): `npm run dev`

```bash
curl -s http://localhost:4321/en/v1/guides/installation.md | head -20
```

Expected: starts with:
```
> Source: https://docs.rfnry.dev/en/v1/guides/installation/
> Version: v1 · Locale: en

# Installation

Install the package from npm.

## Prerequisites
...
```

Stop the dev server.

**Step 3: Commit**

```bash
git add src/pages/[locale]/[version]/[...slug].md.ts
git commit -m "feat: per-page raw markdown endpoint"
```

---

## Task 22: llms.txt and llms-full.txt endpoints

**Files:**
- Create: `src/pages/[locale]/[version]/llms.txt.ts`
- Create: `src/pages/[locale]/[version]/llms-full.txt.ts`

**Step 1: Write `llms.txt.ts`**

```ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
import { docsConfig } from "../../../config/docs.config";

export async function getStaticPaths() {
  return docsConfig.versions.flatMap((v) =>
    docsConfig.i18n.locales.map((l) => ({
      params: { locale: l.code, version: v.id },
    }))
  );
}

export const GET: APIRoute = async ({ params }) => {
  const { locale, version } = params as { locale: string; version: string };
  const entries = await getCollection("docs");
  const scoped = entries
    .map((e) => ({ e, p: parseEntryId(e.id) }))
    .filter((x) => x.p.version === version && x.p.locale === locale && !x.e.data.sidebar.hidden)
    .sort((a, b) => a.e.data.sidebar.order - b.e.data.sidebar.order);

  const site = docsConfig.site;
  const lines: string[] = [];
  lines.push(`# ${site.title}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(`Version: ${version} · Locale: ${locale}`);
  lines.push("");
  lines.push("## Pages");
  lines.push("");
  for (const { e, p } of scoped) {
    const url = site.url + buildDocHref(p);
    lines.push(`- [${e.data.title}](${url}): ${e.data.description}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
```

**Step 2: Write `llms-full.txt.ts`**

```ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
import { stripFrontmatter } from "../../../lib/ai-content";
import { docsConfig } from "../../../config/docs.config";

export async function getStaticPaths() {
  return docsConfig.versions.flatMap((v) =>
    docsConfig.i18n.locales.map((l) => ({
      params: { locale: l.code, version: v.id },
    }))
  );
}

export const GET: APIRoute = async ({ params }) => {
  const { locale, version } = params as { locale: string; version: string };
  const entries = await getCollection("docs");
  const scoped = entries
    .map((e) => ({ e, p: parseEntryId(e.id) }))
    .filter((x) => x.p.version === version && x.p.locale === locale && !x.e.data.sidebar.hidden)
    .sort((a, b) => a.e.data.sidebar.order - b.e.data.sidebar.order);

  const site = docsConfig.site;
  const chunks: string[] = [];
  chunks.push(`# ${site.title} — ${version} (${locale})\n\n${site.description}\n`);
  for (const { e, p } of scoped) {
    const url = site.url + buildDocHref(p);
    chunks.push(`\n\n---\n\n`);
    chunks.push(`# ${e.data.title}\n\n`);
    chunks.push(`Source: ${url}\n\n`);
    chunks.push(stripFrontmatter(e.body as string));
  }

  return new Response(chunks.join(""), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
```

**Step 3: Verify**

Run (background): `npm run dev`

```bash
curl -s http://localhost:4321/en/v1/llms.txt | head
curl -s http://localhost:4321/en/v1/llms-full.txt | head -20
curl -s http://localhost:4321/pt-br/v1/llms.txt | head
```

Expected: non-empty plain-text responses, scoped to the right locale+version.

Stop the dev server.

**Step 4: Commit**

```bash
git add src/pages/[locale]/[version]/llms.txt.ts src/pages/[locale]/[version]/llms-full.txt.ts
git commit -m "feat: llms.txt and llms-full.txt endpoints"
```

---

## Task 23: CopyForAI component (page-level)

**Files:**
- Create: `src/scripts/copy-ai.ts`
- Create: `src/components/CopyForAI.astro`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write `src/scripts/copy-ai.ts`**

```ts
export function initCopyForAI() {
  document.querySelectorAll<HTMLButtonElement>("[data-copy-ai]").forEach((btn) => {
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const url = btn.getAttribute("data-copy-ai-url");
      if (!url) return;
      const originalText = btn.textContent;
      try {
        btn.disabled = true;
        btn.textContent = "Copying…";
        const res = await fetch(url, { headers: { Accept: "text/markdown" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const markdown = await res.text();

        const anchor = btn.getAttribute("data-copy-ai-anchor");
        const finalText = anchor
          ? transformForSection(markdown, anchor)
          : markdown;

        await navigator.clipboard.writeText(finalText);
        btn.textContent = "Copied";
      } catch (err) {
        console.error(err);
        btn.textContent = "Failed";
      } finally {
        setTimeout(() => {
          if (btn.isConnected) {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        }, 1500);
      }
    });
  });
}

/**
 * Given the page-level markdown (with context header and all sections),
 * extract the section identified by anchor and return it with an
 * amended context header that includes the anchor.
 */
function transformForSection(fullMarkdown: string, anchor: string): string {
  const scriptTag = document.getElementById(`section-md-${anchor}`);
  if (scriptTag) {
    return scriptTag.textContent ?? fullMarkdown;
  }
  return fullMarkdown;
}
```

**Step 2: Write `src/components/CopyForAI.astro`**

```astro
---
interface Props {
  url: string;          // endpoint to fetch raw markdown
  anchor?: string;      // optional: section slug when used on a ## heading
  label?: string;       // optional button text
}
const { url, anchor, label = "Copy for AI" } = Astro.props;
---
<button
  type="button"
  class="copy-ai"
  data-copy-ai
  data-copy-ai-url={url}
  data-copy-ai-anchor={anchor}
  aria-label="Copy this content as markdown for an AI assistant"
>
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
  <span>{label}</span>
</button>

<style>
  .copy-ai {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-xs);
    padding: .375em .75em;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-muted);
  }
  .copy-ai:hover { color: var(--color-fg); border-color: var(--color-muted); background: var(--color-surface-hover); }
  .copy-ai:disabled { opacity: .6; cursor: wait; }
</style>
```

**Step 3: Modify the content page to include the page-level button + boot the script**

In `src/pages/[locale]/[version]/[...slug].astro`, update imports and the article section:

Add imports:
```ts
import CopyForAI from "../../../components/CopyForAI.astro";
```

After the `<h1>`, insert:
```astro
<div class="page-actions">
  <CopyForAI url={`${buildDocHref(parsed).replace(/\/$/, "")}.md`} />
</div>
```

(Note: content page URL is `/en/v1/guides/installation/`; the `.md` endpoint is `/en/v1/guides/installation.md` — so trim trailing slash and append `.md`.)

And at the bottom of the file (outside the Layout block) add:

```astro
<script>
  import { initCopyForAI } from "../../../scripts/copy-ai.ts";
  initCopyForAI();
</script>
```

Add scoped styles:
```css
.page-actions { display: flex; gap: 8px; margin: -0.5em 0 1.5em; }
```

**Step 4: Verify**

Run (background): `npm run dev`
Open `/en/v1/guides/installation/`, click "Copy for AI", then paste into a text field to confirm the clipboard has the markdown content with the context header.

Stop the dev server.

**Step 5: Commit**

```bash
git add src/scripts/copy-ai.ts src/components/CopyForAI.astro src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: page-level copy-for-ai button"
```

---

## Task 24: Section-level copy buttons via rehype

**Files:**
- Create: `src/lib/remark/section-anchors.ts`
- Modify: `astro.config.mjs`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`
- Modify: `src/styles/prose.css`

**Step 1: Install rehype deps**

```bash
npm install rehype-slug
```

(Astro already adds IDs to headings via `rehype-slug` by default in recent versions; we install explicitly to be safe and to assert ordering in the pipeline.)

**Step 2: Write `src/lib/remark/section-anchors.ts`** — a rehype plugin that attaches a data attribute to each H2 so our client script can find it.

```ts
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin: marks every H2 with data-section-heading="<anchor>" so
 * client JS can attach a Copy-for-AI button next to it.
 * Relies on rehype-slug having already assigned `id` to headings.
 */
export default function rehypeSectionAnchors() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      node.properties = {
        ...(node.properties ?? {}),
        "data-section-heading": id,
      };
    });
  };
}
```

Run:
```bash
npm install unist-util-visit
```

**Step 3: Modify `astro.config.mjs`** — register the plugin after `rehype-slug`

```js
// @ts-check
import { defineConfig } from "astro/config";
import rehypeSlug from "rehype-slug";
import rehypeSectionAnchors from "./src/lib/remark/section-anchors.ts";
import { docsConfig } from "./src/config/docs.config.ts";

export default defineConfig({
  site: docsConfig.site.url,
  i18n: {
    defaultLocale: docsConfig.i18n.defaultLocale,
    locales: docsConfig.i18n.locales.map((l) => l.code),
    routing: { prefixDefaultLocale: true },
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
    rehypePlugins: [rehypeSlug, rehypeSectionAnchors],
  },
});
```

**Step 4: Modify the content page** to inline each section's markdown as JSON and enhance `<h2>`s with buttons client-side.

In `src/pages/[locale]/[version]/[...slug].astro`:

Add import:
```ts
import { sliceSections } from "../../../lib/ai-content";
```

Compute sections in the frontmatter:
```ts
const sections = sliceSections(entry.body as string);
const mdUrl = `${buildDocHref(parsed).replace(/\/$/, "")}.md`;
```

In the body, for each section, inline a `<script type="application/json">`:

```astro
{sections.map((s) => (
  <script type="application/json" id={`section-md-${s.anchor}`} set:html={
    `> Source: ${Astro.site}${buildDocHref(parsed).replace(/\/$/, "/")}\n` +
    `> Version: ${parsed.version} · Locale: ${parsed.locale}\n` +
    `> Anchor: #${s.anchor}\n\n` +
    s.markdown
  } is:inline></script>
))}
```

Add a bottom script that augments each H2 with a Copy-for-AI button:

```astro
<script define:vars={{ mdUrl }}>
  document.querySelectorAll("article.prose h2[data-section-heading]").forEach((h2) => {
    const anchor = h2.getAttribute("data-section-heading");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-ai section";
    btn.setAttribute("data-copy-ai", "");
    btn.setAttribute("data-copy-ai-url", mdUrl);
    btn.setAttribute("data-copy-ai-anchor", anchor);
    btn.setAttribute("aria-label", `Copy section "${h2.textContent}" for AI`);
    btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    h2.appendChild(btn);
  });
  // Re-init copy-ai for new buttons
  import("../../../scripts/copy-ai.ts").then((m) => m.initCopyForAI());
</script>
```

**Step 5: Style section buttons** — add to `src/styles/prose.css`:

```css
.prose h2 .copy-ai {
  margin-left: auto;
  font-size: var(--fs-xs);
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-subtle);
  background: transparent;
  opacity: 0;
  transition: opacity .15s;
  cursor: pointer;
}
.prose h2:hover .copy-ai,
.prose h2 .copy-ai:focus-visible { opacity: 1; }
.prose h2 .copy-ai:hover { color: var(--color-fg); border-color: var(--color-muted); }
```

**Step 6: Verify**

Run (background): `npm run dev`
Open `/en/v1/guides/installation/`. Hover over "## Prerequisites". A small copy button appears in the heading. Click it; paste into a text field. The clipboard content should contain ONLY the "Prerequisites" section with the context header including `> Anchor: #prerequisites`.

Stop the dev server.

**Step 7: Commit**

```bash
git add astro.config.mjs src/lib/remark/ src/pages/[locale]/[version]/[...slug].astro src/styles/prose.css package.json package-lock.json
git commit -m "feat: section-level copy-for-ai buttons"
```

---

## Task 25: Pagefind search UI

**Files:**
- Create: `src/components/Search.astro`
- Create: `src/scripts/search.ts`
- Modify: `src/components/Header.astro`
- Modify: `src/pages/[locale]/[version]/[...slug].astro` (add pagefind filter attributes)

**Step 1: Write `src/scripts/search.ts`**

```ts
let loaded = false;
let pagefind: any = null;

async function loadPagefind() {
  if (loaded) return pagefind;
  // @ts-expect-error runtime dynamic import
  pagefind = await import("/pagefind/pagefind.js");
  await pagefind.options({ excerptLength: 24 });
  await pagefind.init();
  loaded = true;
  return pagefind;
}

export function initSearch() {
  const trigger = document.querySelector<HTMLButtonElement>("[data-search-trigger]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]");
  const input = dialog?.querySelector<HTMLInputElement>("[data-search-input]");
  const results = dialog?.querySelector<HTMLUListElement>("[data-search-results]");

  if (!trigger || !dialog || !input || !results) return;

  const version = document.documentElement.getAttribute("data-version") ?? "";
  const locale = document.documentElement.getAttribute("lang") ?? "";

  const open = async () => {
    dialog.showModal();
    input.focus();
    await loadPagefind();
  };

  const close = () => {
    dialog.close();
    input.value = "";
    results.innerHTML = "";
  };

  trigger.addEventListener("click", open);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (dialog.open) close();
      else open();
    }
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      open();
    }
    if (e.key === "Escape" && dialog.open) close();
  });

  let timer: number | undefined;
  input.addEventListener("input", () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => void runSearch(), 120);
  });

  async function runSearch() {
    const q = input!.value.trim();
    if (!q) {
      results!.innerHTML = "";
      return;
    }
    const pf = await loadPagefind();
    const r = await pf.search(q, {
      filters: { version, language: locale },
    });
    const top = await Promise.all(r.results.slice(0, 8).map((x: any) => x.data()));
    results!.innerHTML = top
      .map((d: any) => {
        const title = d.meta?.title ?? d.url;
        const excerpt = (d.excerpt as string) ?? "";
        return `<li><a href="${d.url}"><div class="hit-title">${title}</div><div class="hit-excerpt">${excerpt}</div></a></li>`;
      })
      .join("");
  }
}
```

**Step 2: Write `src/components/Search.astro`**

```astro
---
---
<button type="button" class="trigger" data-search-trigger aria-label="Search">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
  </svg>
  <span>Search…</span>
  <kbd>Ctrl K</kbd>
</button>

<dialog class="dialog" data-search-dialog>
  <div class="box">
    <div class="input-row">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
      </svg>
      <input type="search" placeholder="Search docs" data-search-input aria-label="Search docs" />
    </div>
    <ul class="results" data-search-results></ul>
  </div>
</dialog>

<script>
  import { initSearch } from "../scripts/search.ts";
  initSearch();
</script>

<style>
  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 320px;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-muted);
    font-size: var(--fs-sm);
    background: var(--color-surface);
  }
  .trigger span { flex: 1; text-align: left; }
  .trigger kbd {
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 1px 5px;
    background: var(--color-bg);
  }
  .trigger:hover { color: var(--color-fg); border-color: var(--color-muted); }

  .dialog {
    padding: 0;
    border: none;
    background: transparent;
    max-width: 640px;
    width: calc(100vw - 32px);
    margin: 10vh auto 0;
  }
  .dialog::backdrop { background: rgba(0,0,0,.6); backdrop-filter: blur(4px); }
  .box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-muted);
  }
  .input-row input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-fg);
    font: inherit;
    font-size: var(--fs-base);
  }
  .results {
    list-style: none;
    margin: 0;
    padding: 6px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .results li a {
    display: block;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    color: var(--color-fg);
  }
  .results li a:hover { background: var(--color-surface-hover); text-decoration: none; }
  .hit-title { font-weight: 500; }
  .hit-excerpt { font-size: var(--fs-sm); color: var(--color-muted); margin-top: 2px; }
</style>
```

**Step 3: Modify `Header.astro`** to use `<Search />` in the search slot area

In `src/components/Header.astro`:

Replace the `<slot name="search" />` line with:
```astro
<Search />
```

And add the import at the top:
```ts
import Search from "./Search.astro";
```

Remove `<div class="search-slot"><slot name="search" /></div>` wrapping; put `<Search />` directly inside `<div class="middle">`.

**Step 4: Modify content page to expose version/language to Pagefind**

In `src/pages/[locale]/[version]/[...slug].astro`, add Pagefind filter attributes to the content wrapper:

Replace the `<main class="col-content">` line with:
```astro
<main class="col-content" data-pagefind-body data-pagefind-filter={`version:${parsed.version}`} lang={parsed.locale}>
```

Also add to `Layout.astro` — put `data-version` on `<html>` so the search script can read it:

In `src/layouts/Layout.astro`, change `<html lang={locale}>` to `<html lang={locale} data-version={version ?? ""}>`.

**Step 5: Build and verify**

Run: `npm run build`

Expected: Astro builds, then pagefind runs and reports "Indexed N pages" for each language.

Run: `npm run preview` (background)
Open `/en/v1/guides/installation/`. Press `Ctrl+K`, type "install". Hits appear. Check hits are scoped to the current version (only v1 results; if you add v2 content later, they should be filtered out).

Stop the preview.

**Step 6: Commit**

```bash
git add src/components/Search.astro src/scripts/search.ts src/components/Header.astro src/pages/[locale]/[version]/[...slug].astro src/layouts/Layout.astro
git commit -m "feat: pagefind search with version/locale filters"
```

---

## Task 26: 404 page

**Files:**
- Create: `src/pages/404.astro`

**Step 1: Write `src/pages/404.astro`**

```astro
---
import Layout from "../layouts/Layout.astro";
import { docsConfig, getCurrentVersion } from "../config/docs.config";
const current = getCurrentVersion();
const homeHref = `/${docsConfig.i18n.defaultLocale}/${current.id}/`;
---
<Layout title="Not found" description="The page you were looking for was not found." locale={docsConfig.i18n.defaultLocale}>
  <main class="nf">
    <h1>404</h1>
    <p>We couldn't find that page.</p>
    <a href={homeHref}>Go home</a>
  </main>
</Layout>

<style>
  .nf {
    max-width: var(--content-max);
    margin: 20vh auto;
    padding: var(--gutter);
    text-align: center;
  }
  .nf h1 { font-size: 4rem; margin: 0; }
  .nf p { color: var(--color-muted); margin: .5em 0 1em; }
  .nf a {
    display: inline-block;
    padding: .5em 1em;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }
</style>
```

**Step 2: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: 404 page"
```

---

## Task 27: Prev/Next navigation

**Files:**
- Create: `src/components/PrevNext.astro`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write `src/components/PrevNext.astro`**

```astro
---
import { getCollection } from "astro:content";
import { buildSidebarTree, type SidebarNode } from "../lib/sidebar";
import { loadGroups } from "../lib/groups";

interface Props {
  locale: string;
  version: string;
  currentHref: string;
}
const { locale, version, currentHref } = Astro.props;

const entries = await getCollection("docs");
const simpleEntries = entries.map((e) => ({
  id: e.id,
  title: e.data.sidebar.label ?? e.data.title,
  order: e.data.sidebar.order,
  hidden: e.data.sidebar.hidden,
}));
const tree = buildSidebarTree({
  version,
  locale,
  entries: simpleEntries,
  groups: loadGroups(version, locale),
});

const flat: { href: string; label: string }[] = [];
const walk = (nodes: SidebarNode[]) => {
  for (const n of nodes) {
    if (n.href) flat.push({ href: n.href, label: n.label });
    if (n.children) walk(n.children);
  }
};
walk(tree);

const idx = flat.findIndex((f) => f.href === currentHref);
const prev = idx > 0 ? flat[idx - 1] : null;
const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
---
<nav class="prevnext" aria-label="Previous and next page">
  {prev ? (
    <a href={prev.href} class="side prev">
      <span class="dir">Previous</span>
      <span class="ttl">{prev.label}</span>
    </a>
  ) : <div />}
  {next ? (
    <a href={next.href} class="side next">
      <span class="dir">Next</span>
      <span class="ttl">{next.label}</span>
    </a>
  ) : <div />}
</nav>

<style>
  .prevnext {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 3em 0 1em;
    padding-top: 2em;
    border-top: 1px solid var(--color-border);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    color: var(--color-fg);
  }
  .side:hover { border-color: var(--color-muted); text-decoration: none; }
  .next { text-align: right; }
  .dir { font-size: var(--fs-xs); color: var(--color-subtle); text-transform: uppercase; letter-spacing: .05em; }
  .ttl { font-weight: 500; }
</style>
```

**Step 2: Modify `src/pages/[locale]/[version]/[...slug].astro`** — add PrevNext below the article

Add import:
```ts
import PrevNext from "../../../components/PrevNext.astro";
```

After the closing `</article>`, add:
```astro
<PrevNext locale={parsed.locale} version={parsed.version} currentHref={currentHref} />
```

**Step 3: Verify**

Run (background): `npm run dev`
Visit `/en/v1/guides/installation/`. Confirm "Previous: Welcome" and "Next: Quickstart" links are present and go to the right places.

Stop the dev server.

**Step 4: Commit**

```bash
git add src/components/PrevNext.astro src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: prev/next page navigation"
```

---

## Task 28: Mobile sidebar toggle

**Files:**
- Create: `src/scripts/mobile-sidebar.ts`
- Modify: `src/components/Header.astro`
- Modify: `src/pages/[locale]/[version]/[...slug].astro`

**Step 1: Write `src/scripts/mobile-sidebar.ts`**

```ts
export function initMobileSidebar() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-nav-toggle]");
  if (!toggle) return;
  const target = document.body;
  toggle.addEventListener("click", () => {
    const open = target.getAttribute("data-sidebar-open") === "true";
    target.setAttribute("data-sidebar-open", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
  });
}
```

**Step 2: Modify `Header.astro`** — add a hamburger button on the left, visible on mobile

In the `.left` div, before the brand, add:
```astro
<button type="button" class="hamburger" data-mobile-nav-toggle aria-label="Toggle navigation" aria-expanded="false">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
</button>
```

In the style block, add:
```css
.hamburger { display: none; padding: 6px; color: var(--color-muted); }
.hamburger:hover { color: var(--color-fg); }
@media (max-width: 768px) { .hamburger { display: inline-flex; } }
```

And a script at the bottom:
```astro
<script>
  import { initMobileSidebar } from "../scripts/mobile-sidebar.ts";
  initMobileSidebar();
</script>
```

**Step 3: Modify content page** CSS so sidebar shows as overlay when `data-sidebar-open=true`

In `src/pages/[locale]/[version]/[...slug].astro` scoped styles, update the narrow-screen sidebar rules:

```css
@media (max-width: 768px) {
  .shell { grid-template-columns: 1fr; }
  .col-sidebar {
    display: none;
    position: fixed;
    inset: var(--header-h) 0 0 0;
    background: var(--color-bg);
    z-index: calc(var(--z-header) - 1);
    max-height: none;
    overflow-y: auto;
    border-right: none;
  }
  :global(body[data-sidebar-open="true"]) .col-sidebar {
    display: block;
  }
}
```

**Step 4: Verify**

Run (background): `npm run dev`. In a narrow browser window (< 768px), the hamburger appears; clicking it reveals the sidebar as an overlay; clicking again hides it.

Stop the dev server.

**Step 5: Commit**

```bash
git add src/scripts/mobile-sidebar.ts src/components/Header.astro src/pages/[locale]/[version]/[...slug].astro
git commit -m "feat: mobile sidebar toggle"
```

---

## Task 29: Full build + smoke verification

**Files:** none new.

**Step 1: Clean build**

```bash
rm -rf dist
npm run build
```

Expected: Astro build completes with no errors. Pagefind runs and reports indexed pages per language.

**Step 2: Preview + smoke test**

Run (background): `npm run preview`

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/pt-br/v1/guides/installation/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/guides/installation.md
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/llms.txt
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/en/v1/llms-full.txt
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/does-not-exist
```

Expected: `200 200 200 200 200 200 404`.

Stop preview.

**Step 3: Run test suite**

```bash
npm test
```

Expected: All tests pass.

**Step 4: Commit nothing (sanity checkpoint only)**

No commit needed. If anything fails, diagnose and fix before ending this task. Each fix is a separate commit.

---

## Task 30: Update README

**Files:**
- Modify: `README.md`

**Step 1: Replace `README.md`**

```md
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project README for the docs template"
```

---

## End state

After Task 30:

- `npm run dev` serves a fully-working docs template at `http://localhost:4321`.
- `/en/v1/`, `/pt-br/v1/` and nested pages render with sidebar, TOC, header.
- Version, locale, theme pickers work.
- `Ctrl+K` opens Pagefind search, filtered to the current version.
- Page-level and section-level "Copy for AI" buttons populate the clipboard with the right markdown + context header.
- `/{locale}/{version}/{slug}.md`, `llms.txt`, `llms-full.txt` all return clean text.
- `npm run build` produces a fully-static `dist/` with a Pagefind index.
- `npm test` passes (routing, sidebar, ai-content unit tests).

## Follow-ups (deferred, not in this plan)

- Draft support in frontmatter with build-time filtering.
- Fallback-locale rendering when a translation is missing (Astro's `i18n.fallback`).
- Visual regression snapshots (Playwright) once the design is locked.
- A `bump-version` script that duplicates `src/content/docs/v{N}/` to `v{N+1}/`.
