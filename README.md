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

## Quick start (on the integration itself)

```bash
pnpm install
pnpm --filter rfnry-docs typecheck
pnpm --filter rfnry-docs test
pnpm --filter @example/minimal build
pnpm --filter @example/i18n-versioned build
```

Workspace package manager: [pnpm](https://pnpm.io/) (version pinned in root `package.json`).

## Using rfnry-docs in your own project

See [`packages/rfnry-docs/README.md`](./packages/rfnry-docs/README.md).

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

| Script | What |
|---|---|
| `pnpm build` | Build every workspace package that exposes a `build` script |
| `pnpm typecheck` | Run `typecheck` across all packages |
| `pnpm test` | Run the package's unit tests (`packages/rfnry-docs`) |
| `pnpm check` | Biome — formatter + linter |
| `pnpm check:fix` | Auto-apply safe fixes |
| `pnpm format` | Format with Biome |

## License

MIT — see [LICENSE](./LICENSE).
