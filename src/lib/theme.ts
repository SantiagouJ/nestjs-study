"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeName = "dark" | "light";

const KEY = "nestjs-study:theme";

function currentTheme(): ThemeName {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeName) {
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
  window.localStorage.setItem(KEY, theme);
  window.dispatchEvent(new Event("theme-change"));
}

/** Tema claro/oscuro. El primer render es oscuro para no desalinear el HTML. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener("theme-change", sync);
    return () => window.removeEventListener("theme-change", sync);
  }, []);

  const toggle = useCallback(() => {
    applyTheme(currentTheme() === "light" ? "dark" : "light");
  }, []);

  return { theme, toggle };
}
