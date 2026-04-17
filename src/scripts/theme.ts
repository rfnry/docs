type Theme = "dark" | "light" | "system";

function isTheme(v: unknown): v is Theme {
  return v === "dark" || v === "light" || v === "system";
}

function resolveSystem(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const resolved = theme === "system" ? resolveSystem() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-pref", theme);
}

export function initTheme(defaultTheme: Theme) {
  const stored = localStorage.getItem("theme");
  const initial: Theme = isTheme(stored) ? stored : defaultTheme;
  apply(initial);

  document.querySelectorAll<HTMLButtonElement>("[data-theme-set]").forEach((btn) => {
    if (btn.dataset.themeBound === "1") return;
    btn.dataset.themeBound = "1";
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-theme-set");
      if (!isTheme(next)) return;
      localStorage.setItem("theme", next);
      apply(next);
    });
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const pref = document.documentElement.getAttribute("data-theme-pref");
    if (pref === "system") apply("system");
  });
}
