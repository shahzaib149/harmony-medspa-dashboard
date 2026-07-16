export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "harmony-dashboard-theme";
export const DEFAULT_THEME: ThemePreference = "light";

export function isThemePreference(
  value: string | null,
): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

export function savedThemePreference(value: string | null): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME;
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemIsLight: boolean,
): ResolvedTheme {
  return preference === "system"
    ? systemIsLight
      ? "light"
      : "dark"
    : preference;
}
