type Theme = "dark" | "light" | "system";

function getStored(): Theme | null {
  const v = localStorage.getItem("theme");
  if (v === "dark" || v === "light" || v === "system") return v;
  return null;
}

function resolveSystem(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const resolved = theme === "system" ? resolveSystem() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-pref", theme);
}

export function initThemeToggle(defaultTheme: Theme) {
  const initial = getStored() ?? defaultTheme;
  apply(initial);

  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = (document.documentElement.getAttribute("data-theme-pref") as Theme) || defaultTheme;
      const next: Theme = current === "dark" ? "light" : current === "light" ? "system" : "dark";
      localStorage.setItem("theme", next);
      apply(next);
    });
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const pref = document.documentElement.getAttribute("data-theme-pref") as Theme;
    if (pref === "system") apply("system");
  });
}
