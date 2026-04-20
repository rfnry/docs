const FEEDBACK_TEXT = "Copied";
const FEEDBACK_DURATION = 1200;

export function initShare() {
  document.querySelectorAll<HTMLButtonElement>("[data-share-action]").forEach((btn) => {
    if (btn.dataset.shareBound === "1") return;
    btn.dataset.shareBound = "1";
    const labelEl = btn.querySelector<HTMLElement>("[data-share-label]") ?? btn;
    const originalLabel = labelEl.textContent ?? "";

    btn.addEventListener("click", async () => {
      const raw = btn.dataset.shareUrl;
      const url = raw ? new URL(raw, window.location.origin).toString() : window.location.href;
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
