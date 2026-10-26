"use client";

import { useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { supportedBrowsers as browsers } from "@/lib/constants";
import styles from "./hero-section.module.css";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current!;

    video.addEventListener("timeupdate", helper);
    return () => video.removeEventListener("timeupdate", helper);

    function helper() {
      // Freeze before the video's terminal black frames.
      if (video.duration && video.currentTime >= video.duration - 0.25) {
        video.pause();

        // if we don't remove the event listener here, it is getting called
        //   in an infinite loop due to the currentTime assignment above
        //   causing a "seek" and dispatching a new timeupdate event
        video.removeEventListener("timeupdate", helper);
      }
    }
  }, []);

  return (
    <section id="hero" className={styles["hero"]}>
      <video
        ref={videoRef}
        className={`hero-background-video ${styles["video"]}`}
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/promo.webm" type="video/webm" />
      </video>
      <div className={styles["overlay"]} aria-hidden="true" />

      <div className={styles["inner"]}>
        <div className={styles["content"]}>
          <div className={styles["badge"]}>
            <span className={styles["status"]} />
            Free &amp; Open Source
          </div>

          <h1>
            IMDB ratings on your favourite <span>streaming apps</span>
          </h1>

          <p className={styles["description"]}>
            Sift adds IMDB ratings next to movies and TV shows on Netflix, Prime
            Video, and more. Choose what to watch faster.
          </p>

          <div className={styles["actions"]}>
            {browsers.map((browser) => (
              <a
                key={browser.name}
                className={styles["primaryButton"]}
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={browser.logo}
                  alt={browser.name}
                  className={styles["browserLogo"]}
                />
                Add to {browser.name}
              </a>
            ))}
            <a
              className={styles["githubButton"]}
              href="https://github.com/ackinc/webext-movie-ratings"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
