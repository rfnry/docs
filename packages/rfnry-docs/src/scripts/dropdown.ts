const GLOBAL_FLAG = "__dropdownGlobalBound";

export function initDropdowns() {
  for (const dd of document.querySelectorAll<HTMLElement>("[data-dropdown]")) {
    if (dd.dataset.dropdownBound === "1") continue;
    dd.dataset.dropdownBound = "1";

    const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
    const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
    if (!trigger || !menu) continue;

    for (const item of getItems(menu)) item.setAttribute("role", "menuitem");

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.hidden) {
        closeAll(dd);
        open(trigger, menu);
      } else {
        close(trigger, menu);
      }
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (menu.hidden) {
          closeAll(dd);
          open(trigger, menu);
        }
        queueMicrotask(() => focusAt(menu, 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (menu.hidden) {
          closeAll(dd);
          open(trigger, menu);
        }
        queueMicrotask(() => focusAt(menu, -1));
      }
    });

    menu.addEventListener("keydown", (e) => {
      const items = getItems(menu);
      if (items.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? items.indexOf(active) : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (e.key === "Tab") {
        close(trigger, menu);
      }
    });

    menu.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-dropdown-close]")) {
        close(trigger, menu);
      }
    });
  }

  const win = window as unknown as Record<string, unknown>;
  if (!win[GLOBAL_FLAG]) {
    win[GLOBAL_FLAG] = true;
    document.addEventListener("click", (e) => {
      for (const dd of document.querySelectorAll<HTMLElement>("[data-dropdown]")) {
        if (dd.contains(e.target as Node)) continue;
        const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
        const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
        if (trigger && menu) close(trigger, menu);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      for (const menu of document.querySelectorAll<HTMLElement>("[data-dropdown] [data-dropdown-menu]:not([hidden])")) {
        const dd = menu.closest<HTMLElement>("[data-dropdown]");
        const trigger = dd?.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
        if (trigger) {
          close(trigger, menu);
          trigger.focus();
        }
      }
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
  for (const dd of document.querySelectorAll<HTMLElement>("[data-dropdown]")) {
    if (dd === except) continue;
    const trigger = dd.querySelector<HTMLButtonElement>("[data-dropdown-trigger]");
    const menu = dd.querySelector<HTMLElement>("[data-dropdown-menu]");
    if (trigger && menu) close(trigger, menu);
  }
}

function getItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>("a, button"));
}

function focusAt(menu: HTMLElement, index: number) {
  const items = getItems(menu);
  if (items.length === 0) return;
  const i = index < 0 ? items.length + index : index;
  items[i]?.focus();
}
