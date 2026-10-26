"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Header({ overlay = false }: { overlay?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const updateScrollPosition = () => setIsScrolled(window.scrollY > 8);
    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, [overlay]);

  const isOverlayingHero = overlay && !isScrolled;
  const navigationClass = isOverlayingHero
    ? "text-white/75 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  return (
    <header
      className={`sticky top-0 z-50 w-full  transition-colors ${
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
      </div>
    </header>
  );
}
