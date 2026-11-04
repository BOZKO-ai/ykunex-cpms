"use client";

import { useCallback, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggle = useCallback(() => {
    setTheme(current => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("yakunex-theme", next);
      return next;
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("yakunex-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    const handleShortcut = () => toggle();
    window.addEventListener("yakunex:toggle-theme", handleShortcut);
    return () => window.removeEventListener("yakunex:toggle-theme", handleShortcut);
  }, [toggle]);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      className="btn-theme-toggle"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
