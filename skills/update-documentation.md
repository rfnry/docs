# Update documentation (for `@rfnry/docs` sites)

Companion to [`create-documentation.md`](./create-documentation.md). That skill teaches the shape. This one teaches how to modify existing content without churn.

Assume you already know the frontmatter + `_group.yaml` contract from the create skill. This document only covers what's different for updates.

---

## 1 — Read before editing

Before touching any file, read:

- The section's current content — every `.md` file and `_group.yaml` under the relevant `{section}/`.
- The project's current `README.md`, `package.json`, and public API surface.

Diff them mentally. List what changed in the project versus what the docs say. Only edit pages where reality has diverged from the docs.

## 2 — Minimize diff

- Don't rewrite passages that still read correctly and describe behavior that still exists.
- Don't restructure H2 order unless the API itself reorganized.
- Don't "improve the prose" if the user didn't ask for a rewrite.
- Preserve exact identifier names, option keys, and file paths as the source uses them — update only when the source changed.

When in doubt, edit the smallest spans that make the page accurate again.

## 3 — Preserve `sidebar.order`

Existing `order` values are contracts. Sibling pages depend on their neighbors' order.

- **Inserting between existing pages:** use a gap. If existing orders are `10, 20, 30`, insert at `15` or `25`. Do not renumber `20 → 25` to make room.
- **Removing a page:** leave the gap. Do not compact.
- **Intentional reorganization:** only if the user explicitly asks. Renumber the whole section in 10-step increments and call it out in the commit message.

Same rule applies to `_group.yaml` `order`.

## 4 — Version boundaries

When the documented project ships a breaking change (e.g. v1 → v2):

- **Edit in place** if the site tracks only the latest version and older docs aren't a reference consumers depend on. Most small projects.
- **Branch into a new version folder** (`src/content/docs/v2/{locale}/{section}/`) if the site is versioned and old-version users still need their docs. Check `astro.config.mjs` `versions[]` — if multiple entries exist and the old one is no longer `current: true`, the site is versioned.

When branching, copy-then-edit: start from the old version's section as a base, apply changes. Don't rewrite from scratch.

## 5 — Deprecation vs deletion

- **Feature renamed or moved:** update the identifier in the docs. Don't leave the old name behind as a tombstone.
- **Feature removed:** delete the subsection or page. No "was removed in vX" notes unless the user asks for a migration guide.
- **Feature deprecated but still works:** add a short note at the top of the relevant `##` — e.g. `> Deprecated in v1.3. Use {alternative} instead.` — and keep the content.
- **Page no longer relevant:** delete the file. If it had anchors that moved elsewhere, grep the site for links to those anchors and update them.

## 6 — Silent-rot sweep

On every update pass, re-verify against current source:

- Install commands match the project's `package.json` `name`.
- Version constraints in examples match what the project itself recommends.
- Imported identifier names match current `exports` / `main` / `types`.
- Code examples don't reference removed or renamed symbols.

These are the things that drift without anyone noticing — the prose stays plausible long after the code moved on.

## 7 — Scope discipline

When the user says "update the docs for project A", do **not** freshen the entire section. Scope the pass to:

- Pages that name a changed identifier, flag, file, or command.
- Pages whose code examples no longer run.
- Pages whose described behavior diverges from current source.

If a page could be clearer but isn't wrong, skip it unless the user asked for a rewrite.

## 8 — Checklist before finishing

- [ ] Every edited page still has valid frontmatter (`title`, `description`, `sidebar.order`).
- [ ] No `sidebar.order` was renumbered on a sibling that didn't need it.
- [ ] No unrelated prose was rewritten.
- [ ] Install commands, import paths, and identifier names match current source.
- [ ] Removed pages or anchors don't leave broken internal links — grep for old paths.
- [ ] If branching to a new version folder, `astro.config.mjs` `versions[]` was extended accordingly.
- [ ] `astro build` completes cleanly.
