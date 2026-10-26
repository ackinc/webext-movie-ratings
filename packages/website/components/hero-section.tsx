"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { supportedBrowsers as browsers } from "@/lib/constants";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current!;

    video.addEventListener("timeupdate", helper);
    return () => video.removeEventListener("timeupdate", helper);

    function helper() {
      // Freeze before the video's terminal black frames.
      if (video.duration && video.currentTime >= video.duration - 0.25) {
        video.currentTime = video.duration - 0.25;
        video.pause();

        // if we don't remove the event listener here, it is getting called
        //   in some kind of infinite loop causing high CPU usage
        video.removeEventListener("timeupdate", helper);
      }
    }
  }, []);

  return (
    <section
      id="hero"
      className="relative isolate -mt-16 min-h-svh overflow-hidden pt-16"
    >
      <video
        ref={videoRef}
        className="hero-background-video absolute -z-20 object-cover"
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/promo2.webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 -z-10 bg-black/65" aria-hidden="true" />

      <div className="container mx-auto flex min-h-[calc(100svh-4rem)] items-center px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            Free &amp; Open Source
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl text-balance">
            IMDB ratings on your favourite{" "}
            <span className="text-accent">streaming apps</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/85 md:text-xl text-pretty">
            Sift adds IMDB ratings next to movies and TV shows on Netflix, Prime
            Video, and more. Choose what to watch faster.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row flex-wrap">
            {browsers.map((browser) => (
              <Button
                key={browser.name}
                size="lg"
                className="gap-2 px-8"
                asChild
              >
                <a href={browser.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={browser.logo}
                    alt={browser.name}
                    className="h-5 w-5"
                  />
                  Add to {browser.name}
                </a>
              </Button>
            ))}
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/60 bg-black/20 px-8 text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <a
                href="https://github.com/ackinc/webext-movie-ratings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
