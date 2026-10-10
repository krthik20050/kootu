"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const storageKey = "kootu-dashboard-theme";
const changeEvent = "kootu-dashboard-theme-change";
let unsavedPreference: Theme | null = null;

function readTheme(): Theme {
  if (unsavedPreference) return unsavedPreference;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* Use the system preference when storage is unavailable. */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onChange);
  };
}

export function useDashboardTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, (): Theme => "light");
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
      unsavedPreference = null;
    } catch { unsavedPreference = next; }
    window.dispatchEvent(new Event(changeEvent));
  }
  return { theme, toggleTheme };
}
