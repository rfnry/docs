const COPIED_TITLE = "Link copied";
const COPIED_DURATION = 1500;

export function initShareAI() {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-share-ai]");
  for (const btn of buttons) {
    if (btn.dataset.shareAiBound === "1") continue;
    btn.dataset.shareAiBound = "1";
    const originalTitle = btn.title;
    btn.addEventListener("click", async () => {
      const url = computeLlmsUrl();
      try {
        await navigator.clipboard.writeText(url);
        btn.classList.add("copied");
        btn.title = COPIED_TITLE;
        window.setTimeout(() => {
          if (btn.isConnected) {
            btn.classList.remove("copied");
            btn.title = originalTitle;
          }
        }, COPIED_DURATION);
      } catch (err) {
        console.error(err);
      }
    });
  }
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
