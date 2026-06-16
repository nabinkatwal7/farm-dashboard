"use client";

import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/app/lib/query-client";
import { ThemeSync } from "./ThemeProvider";

const colorSchemeManager = localStorageColorSchemeManager({
  key: "farmos-theme",
});

const theme = createTheme({
  primaryColor: "farmGreen",
  primaryShade: { light: 6, dark: 4 },
  fontFamily: "var(--font-sans)",
  headings: {
    fontFamily: "var(--font-sans)",
    fontWeight: "700",
  },
  colors: {
    farmGreen: [
      "#f3f5f4",
      "#e2eae3",
      "#c5d2c7",
      "#849688",
      "#4ade80",
      "#22c55e",
      "#2d5339",
      "#213d29",
      "#172a1d",
      "#0b0f0c",
    ],
  },
  black: "#0b0f0c",
  white: "#ffffff",
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        bg: "var(--bg-card)",
        c: "var(--text-primary)",
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: { blur: 3 },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        colorSchemeManager={colorSchemeManager}
        defaultColorScheme="auto"
        theme={theme}
      >
        <Notifications position="top-right" />
        <ThemeSync />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
