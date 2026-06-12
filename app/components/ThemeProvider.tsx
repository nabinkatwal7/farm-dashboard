"use client";

import { useMantineColorScheme } from "@mantine/core";
import { useEffect } from "react";

export function ThemeSync() {
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    const resolveTheme = (): "dark" | "light" => {
      if (colorScheme === "light" || colorScheme === "dark") {
        return colorScheme;
      }

      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const applyTheme = () => {
      document.documentElement.setAttribute("data-theme", resolveTheme());
    };

    applyTheme();

    if (colorScheme !== "auto") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [colorScheme]);

  return null;
}
