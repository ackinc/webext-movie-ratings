"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function getTimeBasedTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  // Dark mode from 7 PM (19:00) to 6 AM (06:00)
  return hour >= 19 || hour < 6 ? "dark" : "light";
}
