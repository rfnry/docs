const SCROLL_OFFSET = 100;

export function initTOC() {
  const toc = document.querySelector<HTMLElement>("[data-toc]");
  if (!toc) return;

  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((a) => {
    links.set(a.getAttribute("href")!.slice(1), a);
  });

  const headings = Array.from(document.querySelectorAll<HTMLElement>("article.prose h2[id], article.prose h3[id]"));
  if (headings.length === 0) return;

  const setActive = (id: string | null) => {
    for (const a of toc.querySelectorAll("a.active")) a.classList.remove("active");
    if (id) links.get(id)?.classList.add("active");
  };

  const update = () => {
    let activeId: string | null = headings[0].id;
    for (const h of headings) {
      if (h.getBoundingClientRect().top - SCROLL_OFFSET <= 0) {
        activeId = h.id;
      } else {
        break;
      }
    }
    setActive(activeId);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}
