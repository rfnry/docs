# Create documentation (for `@rfnry/docs` sites)

You are authoring content for a documentation site built with `@rfnry/docs` — an Astro integration. Your job: take one or more existing codebases and produce markdown pages that slot into the site's content tree. This skill teaches you the shape, not the project.

Do not invent APIs, flags, command names, or examples. Every identifier and every code block must trace back to real source (README, `package.json`, exported symbols, tests).

---

## 1 — Inspect the target site first

Before writing anything, read:

- `astro.config.mjs` — get `i18n.defaultLocale`, `i18n.locales`, the list of `packages[]` with each package's `id` / `label` / `versions[].id`, and whichever version has `current: true` per package. Write content against the current version of each package and the default locale (add other versions or locales only if asked).
- `src/content/docs/{package}/{version}/{locale}/` — enumerate existing section folders. Your new section must not collide. Note the existing `_group.yaml` ordering so new sections can be placed sensibly.

## 2 — Inspect each project to be documented

For every project the user wants documented, read:

- `README.md` — the canonical pitch, install command, minimum usage example.
- `package.json` — the exact npm name (use it verbatim in install snippets), `exports` / `main` / `bin`, listed scripts.
- Source entry points — what is exported, what types the public API takes, what a call actually looks like.
- Tests or examples — real invocations you can copy.

Summarize in one sentence: what the project is, who it's for. That sentence seeds the section intro and the first `description` frontmatter.

---

## 3 — Where content lives

```
src/content/docs/{package}/{version}/{locale}/{section}/
```

- `{package}` — the `packages[].id` the content belongs to (`react`, `python`, …). Each package has its own version axis.
- `{version}` — e.g. `v1`, read from `astro.config.mjs` — scoped to the parent package.
- `{locale}` — e.g. `en`, read from `astro.config.mjs`.
- `{section}` — one folder per project you're documenting. Use the package's short name (`chat`, `rag`, `cli-tools`, etc.).

When the user says "document project A and project B", create **two sibling sections**: `{locale}/a/` and `{locale}/b/`. Never merge projects into one section.

## 4 — Shape of a section

**Minimal** (one intro page):

```
{section}/
  _group.yaml
  index.md
```

**Typical** (intro + guides + reference):

```
{section}/
  _group.yaml
  index.md              ← introduction + install + smallest working example
  guides/
    _group.yaml
    getting-started.md
    {task}.md
  reference/
    _group.yaml
    api.md
    types.md
```

Use the minimal shape when the project has a small surface. Add `guides/` and `reference/` only when the material justifies them.

---

## 5 — `_group.yaml` (sidebar folder metadata)

Every folder under the locale root needs one:

```yaml
label: Reference
order: 3
collapsed: false
```

- `label` — shown in the sidebar. Use sentence case.
- `order` — integer. Lower sorts first. Use gaps (10, 20, 30) so later insertions don't cascade-renumber.
- `collapsed` — starts collapsed if `true`. Groups containing the current page auto-expand regardless.

## 6 — Page frontmatter (every `.md` file)

```yaml
---
title: Quickstart
description: One sentence used for <meta>, llms.txt, and search results.
sidebar:
  order: 1
  label: Optional override     # defaults to title
  hidden: false                # optional — omits the page from sidebar + AI endpoints
---
```

- `title` — the page H1. Browser tab shows `{title} | {site.title}`.
- `description` — exactly one sentence that stands alone. It is the SEO meta, the `llms.txt` entry, and the search result excerpt. Rewrite until it reads fine in isolation.
- `sidebar.order` — lower first.
- `sidebar.label` — use when the title is too long for the sidebar.

---

## 7 — Writing style (non-negotiable)

1. **Lead with what it is.** First paragraph: one sentence naming the thing, one sentence naming the problem it solves. Do not open with "This guide will…" or "In this section…".
2. **Install first, then usage.** Copy the install command from the project's `package.json` name. Immediately follow with the smallest snippet that produces a visible result.
3. **H2 sections are the atomic unit.** Every `##` heading is copyable via the per-section copy button. Write each H2 so a reader pasting it into an AI gets useful, self-contained context. Don't start an H2 with "And then", "Next", etc.
4. **Short sentences. No filler.** Strip "comprehensive guide to", "in this section we will", "it's worth noting that", "simply", "just".
5. **Code blocks are language-tagged** (` ```ts`, ` ```bash`, ` ```yaml`) for syntax highlighting.
6. **Plain markdown only.** No MDX, no JSX, no component imports. Content must survive round-tripping to the `.md` endpoints.
7. **No emoji** unless the target project's own docs and README use them.
8. **Use exact identifier names.** `createIndex()` not "the index creator function".

---

## 8 — Templates

### Introduction page (`{section}/index.md`)

```md
---
title: {project display name}
description: {one sentence — what it is + who it's for}.
sidebar:
  order: 1
  label: Introduction
---

{One paragraph: what it is, what problem it solves, who uses it.}

## Install

​```bash
{exact install command from the project's package.json name}
​```

## Quickstart

​```{lang}
{smallest working example, copied from README or tests}
​```

## Scope

- {capability 1}
- {capability 2}
- {capability 3}
```

### API reference page

```md
---
title: API
description: Public API of {project}.
sidebar:
  order: 10
---

Reference for every exported symbol of `{package-name}`.

## `{symbolName}()`

{One sentence describing what it does.}

​```ts
{exact signature from source}
​```

**Parameters**
- `{name}` — {type}. {one sentence}.

**Returns** — {type}. {one sentence}.

**Example**

​```ts
{real example from tests or README}
​```

## `{nextSymbol}()`

{repeat}
```

### Guide page (task-oriented)

```md
---
title: {Doing the specific thing}
description: {The task}, in one sentence.
sidebar:
  order: 20
---

{One sentence: when you'd do this + what the result is.}

## Prerequisites

- {real prerequisite}

## Steps

1. {Imperative verb}. {what to do}.
2. ...

## Verification

{How the reader knows it worked — expected output or observable state.}
```

---

## 9 — Ordering inside a section

Typical top-to-bottom flow:

1. Introduction / `index.md` — order `1`
2. Quickstart (if distinct from intro) — order `5`
3. Guides (task-oriented) — group order `10`
4. Concepts (background) — group order `20`
5. Reference (API / CLI / types) — group order `30`
6. Changelog / migration — group order `90`

Leave gaps.

---

## 10 — Checklist before finishing

- [ ] Every `.md` file has `title`, `description`, and `sidebar.order`.
- [ ] Every folder under the locale root has `_group.yaml`.
- [ ] Every install command matches the project's real `package.json` `name`.
- [ ] Every code example traces to real source (README, tests, or exported symbols).
- [ ] No MDX, no JSX, no component imports.
- [ ] No emoji unless the project's own docs use them.
- [ ] Each `description` is a single self-contained sentence.
- [ ] Internal links use absolute paths from the content root (e.g., `/en/v1/chat/reference/api/`).
- [ ] Running `astro build` in the site repo completes cleanly — no missing-collection warnings, no broken links in the log.

---

## Out of scope

This skill does **not** cover:

- Setting up a new `@rfnry/docs` site (see the package README).
- Modifying the theme, adding social link types, or changing the component layer (consumer-level changes to `astro.config.mjs` and CSS tokens).
- Writing the copy for the site's own overview or homepage — this skill is for project-documentation sections only.
