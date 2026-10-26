"use client";

import { useEffect, useState } from "react";
import styles from "./header.module.css";

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
  return (
    <header
      className={`${styles["header"]} ${
        isOverlayingHero ? styles["overlay"] : styles["solid"]
      }`}
    >
      <div className={`${styles["inner"]} container`}>
        <a href="/" className={styles["brand"]}>
          <img
            src="/images/logo128.png"
            alt="Sift logo"
            className={styles["logo"]}
          />
          <span className={styles["brandName"]}>Sift</span>
        </a>

        <nav className={styles["nav"]}>
          <a href="/privacy" className={styles["link"]}>
            Privacy
          </a>
        </nav>
      </div>
    </header>
  );
}
