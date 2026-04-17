const COPY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

export function initCodeCopy() {
  const blocks = document.querySelectorAll<HTMLPreElement>("article.prose pre.astro-code");
  for (const pre of blocks) {
    if (pre.dataset.codeCopyBound === "1") continue;
    pre.dataset.codeCopyBound = "1";

    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentElement?.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-icon code-copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = COPY_ICON;

    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        btn.classList.add("copied");
        btn.innerHTML = CHECK_ICON;
        window.setTimeout(() => {
          if (btn.isConnected) {
            btn.classList.remove("copied");
            btn.innerHTML = COPY_ICON;
          }
        }, 1500);
      } catch (err) {
        console.error(err);
      }
    });

    wrap.appendChild(btn);
  }
}
