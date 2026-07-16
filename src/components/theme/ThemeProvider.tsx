"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  resolveThemePreference,
  savedThemePreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme-preference";

export type { ThemePreference } from "@/lib/theme-preference";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveThemePreference(
    preference,
    systemTheme() === "light",
  );
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] =
    useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preference = savedThemePreference(
      localStorage.getItem(THEME_STORAGE_KEY),
    );
    setThemeState(preference);
    setResolvedTheme(applyTheme(preference));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  const setTheme = useCallback((preference: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    setThemeState(preference);
    setResolvedTheme(applyTheme(preference));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, mounted }),
    [mounted, resolvedTheme, setTheme, theme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
