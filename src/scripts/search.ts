let loaded = false;
let pagefind: any = null;

async function loadPagefind() {
  if (loaded) return pagefind;
  const pfUrl = "/pagefind/pagefind.js";
  pagefind = await import(/* @vite-ignore */ pfUrl);
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
      results!.innerHTML = "";
      return;
    }
    const pf = await loadPagefind();
    const r = await pf.search(q, { filters: { version } });
    const top = await Promise.all(r.results.slice(0, 8).map((x: any) => x.data()));
    results!.replaceChildren(...top.map((d: any) => renderHit(d)));
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
