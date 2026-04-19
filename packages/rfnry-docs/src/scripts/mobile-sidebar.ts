export function initMobileSidebar() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-nav-toggle]");
  if (!toggle) return;
  const body = document.body;
  toggle.addEventListener("click", () => {
    const next = body.getAttribute("data-sidebar-open") !== "true";
    body.setAttribute("data-sidebar-open", String(next));
    toggle.setAttribute("aria-expanded", String(next));
    body.style.overflow = next ? "hidden" : "";
  });
}
