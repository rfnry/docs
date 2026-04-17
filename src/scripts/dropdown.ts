const GLOBAL_FLAG = "__dropdownGlobalBound";

export function initDropdowns() {
  document.querySelectorAll<HTMLElement>("[data-dropdown]").forEach((dd) => {
    if (dd.dataset.dropdownBound === "1") return;
    dd.dataset.dropdownBound = "1";

    const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
    const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.hidden) {
        closeAll(dd);
        open(trigger, menu);
      } else {
        close(trigger, menu);
      }
    });

    menu.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-dropdown-close]")) {
        close(trigger, menu);
      }
    });
  });

  const win = window as unknown as Record<string, unknown>;
  if (!win[GLOBAL_FLAG]) {
    win[GLOBAL_FLAG] = true;
    document.addEventListener("click", (e) => {
      document.querySelectorAll<HTMLElement>("[data-dropdown]").forEach((dd) => {
        if (dd.contains(e.target as Node)) return;
        const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
        const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
        if (trigger && menu) close(trigger, menu);
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll<HTMLElement>("[data-dropdown] [data-dropdown-menu]:not([hidden])").forEach((menu) => {
        const dd = menu.closest<HTMLElement>("[data-dropdown]");
        const trigger = dd?.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
        if (trigger) {
          close(trigger, menu);
          trigger.focus();
        }
      });
    });
  }
}

function open(trigger: HTMLButtonElement, menu: HTMLElement) {
  trigger.setAttribute("aria-expanded", "true");
  menu.hidden = false;
}

function close(trigger: HTMLButtonElement, menu: HTMLElement) {
  trigger.setAttribute("aria-expanded", "false");
  menu.hidden = true;
}

function closeAll(except: HTMLElement) {
  document.querySelectorAll<HTMLElement>("[data-dropdown]").forEach((dd) => {
    if (dd === except) return;
    const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
    const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
    if (trigger && menu) close(trigger, menu);
  });
}
