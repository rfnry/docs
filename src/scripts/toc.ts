export function initTOC() {
  const toc = document.querySelector<HTMLElement>("[data-toc]");
  if (!toc) return;
  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((a) => {
    links.set(a.getAttribute("href")!.slice(1), a);
  });

  const setActive = (id: string) => {
    toc.querySelectorAll("a.active").forEach((a) => a.classList.remove("active"));
    links.get(id)?.classList.add("active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      setActive(top.target.id);
    },
    { rootMargin: "0px 0px -70% 0px", threshold: 0 }
  );

  document.querySelectorAll<HTMLElement>("article.prose h2[id], article.prose h3[id]").forEach((h) => {
    observer.observe(h);
  });
}
