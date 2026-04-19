const FEEDBACK_TEXT = "Copied";
const FEEDBACK_DURATION = 1200;

export function initShare() {
  document.querySelectorAll<HTMLButtonElement>("[data-share-action]").forEach((btn) => {
    if (btn.dataset.shareBound === "1") return;
    btn.dataset.shareBound = "1";
    const labelEl = btn.querySelector<HTMLElement>("[data-share-label]") ?? btn;
    const originalLabel = labelEl.textContent ?? "";

    btn.addEventListener("click", async () => {
      const action = btn.dataset.shareAction;
      const url = action === "ai" ? computeLlmsUrl() : window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        labelEl.textContent = FEEDBACK_TEXT;
        window.setTimeout(() => {
          if (btn.isConnected) labelEl.textContent = originalLabel;
        }, FEEDBACK_DURATION);
      } catch (err) {
        console.error(err);
      }
    });
  });
}

function computeLlmsUrl(): string {
  const locale = document.documentElement.getAttribute("lang") ?? "";
  const version = document.documentElement.getAttribute("data-version") ?? "";
  const origin = window.location.origin;
  if (locale && version) {
    return `${origin}/${locale}/${version}/llms.txt`;
  }
  return `${origin}/llms.txt`;
}
