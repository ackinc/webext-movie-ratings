"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { getTimeBasedTheme } from "@/components/theme-provider";

export function Header({ overlay = false }: { overlay?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set time-based theme on first load if no stored preference
    if (!localStorage.getItem("sift-theme")) {
      setTheme(getTimeBasedTheme());
    }
  }, [setTheme]);

  useEffect(() => {
    if (!overlay) return;

    const updateScrollPosition = () => setIsScrolled(window.scrollY > 8);
    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, [overlay]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isOverlayingHero = overlay && !isScrolled;
  const navigationClass = isOverlayingHero
    ? "text-white/75 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors ${
        isOverlayingHero
          ? "border-white/20 bg-transparent text-white"
          : "border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="images/logo128.png"
            alt="Sift logo"
            className="h-8 w-8 rounded-lg"
          />
          <span
            className={`text-xl font-bold ${isOverlayingHero ? "text-white" : "text-foreground"}`}
          >
            Sift
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className={`text-sm font-medium transition-colors ${navigationClass}`}
          >
            Features
          </Link>
          <Link
            href="/#demo"
            className={`text-sm font-medium transition-colors ${navigationClass}`}
          >
            Demo
          </Link>
          <Link
            href="/privacy"
            className={`text-sm font-medium transition-colors ${navigationClass}`}
          >
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`h-9 w-9 ${isOverlayingHero ? "text-white hover:bg-white/15 hover:text-white" : ""}`}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
