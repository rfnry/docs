# rfnry-docs

Monorepo for **rfnry-docs** — an Astro integration for minimal, opinionated documentation sites with versioning, i18n, and first-class AI-consumption endpoints.

## Layout

```
packages/
  rfnry-docs/           ← the published npm package (see its README)
examples/
  minimal/              ← one locale, one version, one guide
  i18n-versioned/       ← two locales, nested groups, full feature matrix
docs/
  plans/                ← design + migration plans (local-only)
```

## Quick start (hacking on the integration)

Repo uses native npm `workspaces`, so any package manager works.

**pnpm** (maintainer default, committed lockfile):

```bash
pnpm install
pnpm --filter rfnry-docs typecheck
pnpm --filter rfnry-docs test
pnpm --filter @example/minimal build
pnpm --filter @example/i18n-versioned build
```

**npm**:

```bash
npm install
npm run typecheck -w rfnry-docs
npm test -w rfnry-docs
npm run build -w @example/minimal
npm run build -w @example/i18n-versioned
```

**yarn** (classic or berry):

```bash
yarn install
yarn workspace rfnry-docs typecheck
yarn workspace rfnry-docs test
yarn workspace @example/minimal build
yarn workspace @example/i18n-versioned build
```

Only `pnpm-lock.yaml` is committed. npm/yarn users generate their own lockfile locally (`package-lock.json`, `yarn.lock` — both gitignored). CI uses pnpm.

## Using rfnry-docs in your own project

See [`packages/rfnry-docs/README.md`](./packages/rfnry-docs/README.md). Consumers can use any package manager — the published package works the same.

Short version:

```bash
npm install rfnry-docs astro
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import rfnry from "rfnry-docs";

export default defineConfig({
  site: "https://my-docs.example",
  integrations: [rfnry({ site: {...}, i18n: {...}, versions: [...] })],
});
```

```ts
// src/content.config.ts
export { collections } from "rfnry-docs/content";
```

Drop markdown into `src/content/docs/{version}/{locale}/`.

## Scripts

Root only has the Biome scripts (work with any package manager):

| Script | What |
|---|---|
| `check` | Biome — lint + format check |
| `check:fix` | Auto-apply safe fixes |
| `format` | Format with Biome |

Per-workspace scripts (`typecheck`, `test`, `build`) live in each package's `package.json`. Invoke them via your chosen package manager's workspace filter — see the quick-start table above.

## License

MIT — see [LICENSE](./LICENSE).
