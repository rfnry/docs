export function initMobileSidebar() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-nav-toggle]");
  if (!toggle) return;
  const target = document.body;
  toggle.addEventListener("click", () => {
    const open = target.getAttribute("data-sidebar-open") === "true";
    target.setAttribute("data-sidebar-open", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
  });
}
