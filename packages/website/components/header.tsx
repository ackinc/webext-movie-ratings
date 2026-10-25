"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Header({ overlay = false }: { overlay?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const updateScrollPosition = () => setIsScrolled(window.scrollY > 12);
    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, [overlay]);

  const isOverHero = overlay && !isScrolled;
  const navigationClass = isOverHero
    ? "text-white/70 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  return (
    <header
      className={`top-0 z-50 w-full border-b transition-colors motion-reduce:transition-none ${
        overlay ? "fixed" : "sticky"
      } ${
        isOverHero
          ? "border-white/15 bg-transparent"
          : "border-border bg-background/90 backdrop-blur-md"
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
            className={`text-xl font-bold tracking-tight ${
              isOverHero ? "text-white" : "text-foreground"
            }`}
          >
            Sift
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className={`text-sm font-medium transition-colors motion-reduce:transition-none ${navigationClass}`}
          >
            Features
          </Link>
          <Link
            href="/#demo"
            className={`text-sm font-medium transition-colors motion-reduce:transition-none ${navigationClass}`}
          >
            Demo
          </Link>
          <Link
            href="/privacy"
            className={`text-sm font-medium transition-colors motion-reduce:transition-none ${navigationClass}`}
          >
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
