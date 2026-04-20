# @rfnry/docs — agent notes

## View Transitions convention

The site ships `<ClientRouter />` in `Layout.astro` for SPA-like navigation. Every component `<script>` must either:

- **Module scripts** (with `import`): register an `astro:page-load` listener alongside the immediate init call.
  ```astro
  <script>
    import { initX } from "../scripts/x.ts";
    document.addEventListener("astro:page-load", initX);
    initX();
  </script>
  ```
  The module runs once; the listener fires on every navigation (including initial) so re-binds happen cleanly. `initX` must be idempotent — use a `dataset.*Bound === "1"` guard on elements you've already wired.

- **Inline scripts** (`<script is:inline>` or `<script define:vars={...}>`, no imports): add `data-astro-rerun` to the tag.
  ```astro
  <script define:vars={{ mdUrl }} data-astro-rerun>
    ...
  </script>
  ```
  Do **not** use `data-astro-rerun` on module scripts — ClientRouter re-injects them without `type="module"`, throwing `SyntaxError: import declarations may only appear at top level of a module`.

If a new component has interactive JS and forgets this, its bindings will silently break after the first client-side navigation (first load works, second click stops responding). The compiler won't flag it.

## Persisting `<html>` attributes across navigations

ClientRouter replaces `<html>` attributes with whatever the new page SSR'd. Runtime-set attributes (like the theme preference written by the inline theme bootstrap) are wiped on every navigation.

For anything that must survive navigation, re-apply inside an `astro:after-swap` listener (fires after the DOM swap, before paint — no visual flash). See `Layout.astro`'s theme bootstrap for the pattern.
