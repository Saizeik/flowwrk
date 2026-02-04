export type Theme = "light" | "dark";
export type ThemeMode = Theme | "system";

const STORAGE_KEY = "theme-mode";

/** System preference (no storage). */
export function getSystemTheme(): Theme {
    const saved = localStorage.getItem("theme") as Theme | null;
    return saved ?? "dark";
  }

/** Reads saved mode. Defaults to "system". */
export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  return saved ?? "system";
}

/** Computes actual theme from mode. */
export function resolveTheme(mode: ThemeMode): Theme {
  return mode === "system" ? getSystemTheme() : mode;
}

/** Applies Tailwind's `dark` class to <html>. */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const theme = resolveTheme(mode);

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

/** Saves user preference (or clears if system). */
export function setThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  if (mode === "system") localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}
