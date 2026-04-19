export function initCopyForAI() {
  document.querySelectorAll<HTMLButtonElement>("[data-copy-ai]").forEach((btn) => {
    if (btn.dataset.copyAiBound === "1") return;
    btn.dataset.copyAiBound = "1";
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const url = btn.getAttribute("data-copy-ai-url");
      if (!url) return;
      const labelSpan = btn.querySelector<HTMLElement>("[data-copy-ai-label]");
      const originalText = labelSpan?.textContent ?? btn.textContent ?? "";
      const setLabel = (text: string) => {
        if (labelSpan) labelSpan.textContent = text;
        else btn.textContent = text;
      };
      try {
        btn.disabled = true;
        setLabel("Copying…");
        const anchor = btn.getAttribute("data-copy-ai-anchor");
        const finalText = anchor
          ? (readSectionMarkdown(anchor) ?? (await fetchMarkdown(url)))
          : await fetchMarkdown(url);

        await navigator.clipboard.writeText(finalText);
        setLabel("Copied");
      } catch (err) {
        console.error(err);
        setLabel("Failed");
      } finally {
        setTimeout(() => {
          if (btn.isConnected) {
            btn.disabled = false;
            setLabel(originalText);
          }
        }, 1500);
      }
    });
  });
}

async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch(url, { headers: { Accept: "text/markdown" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function readSectionMarkdown(anchor: string): string | null {
  const el = document.getElementById(`section-md-${anchor}`);
  const raw = el?.getAttribute("data-payload");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string;
  } catch {
    return null;
  }
}
