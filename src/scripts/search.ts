const MISSING_INDEX_MESSAGE = "Search index not available. Run `npm run build` to generate it.";

let loaded = false;
let pagefind: any = null;

async function loadPagefind() {
  if (loaded) return pagefind;
  try {
    const pfUrl = "/pagefind/pagefind.js";
    pagefind = await import(/* @vite-ignore */ pfUrl);
    await pagefind.options({ excerptLength: 24 });
    await pagefind.init();
    loaded = true;
    return pagefind;
  } catch (err) {
    console.warn("[search]", err);
    throw new Error(MISSING_INDEX_MESSAGE);
  }
}

export function initSearch() {
  const trigger = document.querySelector<HTMLButtonElement>("[data-search-trigger]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]");
  const input = dialog?.querySelector<HTMLInputElement>("[data-search-input]");
  const results = dialog?.querySelector<HTMLUListElement>("[data-search-results]");

  if (!trigger || !dialog || !input || !results) return;

  const version = document.documentElement.getAttribute("data-version") ?? "";

  const showMessage = (msg: string, tone: "info" | "error" = "info") => {
    const li = document.createElement("li");
    li.className = tone === "error" ? "hit-error" : "hit-info";
    li.textContent = msg;
    results.replaceChildren(li);
  };

  const open = async () => {
    dialog.showModal();
    input.focus();
    try {
      await loadPagefind();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : MISSING_INDEX_MESSAGE, "error");
    }
  };

  const close = () => {
    dialog.close();
    input.value = "";
    results.replaceChildren();
  };

  trigger.addEventListener("click", open);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (dialog.open) close();
      else void open();
    }
    if (
      e.key === "/" &&
      document.activeElement?.tagName !== "INPUT" &&
      document.activeElement?.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      void open();
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
      results!.replaceChildren();
      return;
    }
    try {
      const pf = await loadPagefind();
      const r = await pf.search(q, { filters: { version } });
      const top = await Promise.all(r.results.slice(0, 8).map((x: any) => x.data()));
      if (top.length === 0) {
        showMessage("No results.");
        return;
      }
      results!.replaceChildren(...top.map((d: any) => renderHit(d)));
    } catch (err) {
      showMessage(err instanceof Error ? err.message : MISSING_INDEX_MESSAGE, "error");
    }
  }
}

function isSafeUrl(url: string): boolean {
  return url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://");
}

function renderHit(d: any): HTMLElement {
  const li = document.createElement("li");
  const a = document.createElement("a");
  const href = typeof d.url === "string" && isSafeUrl(d.url) ? d.url : "#";
  a.href = href;

  const titleEl = document.createElement("div");
  titleEl.className = "hit-title";
  titleEl.textContent = (d.meta?.title as string) ?? href;

  const excerptEl = document.createElement("div");
  excerptEl.className = "hit-excerpt";
  excerptEl.innerHTML = typeof d.excerpt === "string" ? d.excerpt : "";

  a.append(titleEl, excerptEl);
  li.append(a);
  return li;
}
