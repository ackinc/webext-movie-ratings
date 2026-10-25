"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { supportedBrowsers as browsers } from "@/lib/constants";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-svh overflow-hidden bg-[#090a0d] pt-16"
    >
      <video
        className="hero-background-video absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/promo2.webm" type="video/webm" />
      </video>
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,5,8,0.96)_0%,rgba(4,5,8,0.78)_42%,rgba(4,5,8,0.35)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(4,5,8,0.94)_0%,transparent_45%)]"
        aria-hidden="true"
      />

      <div className="container mx-auto flex min-h-[calc(100svh-4rem)] items-center px-4 py-16 sm:py-20">
        <div className="max-w-3xl text-left">
          <div className="mb-8 inline-flex items-center gap-3 border-y border-white/20 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
            Free &amp; Open Source
          </div>

          <h1 className="mb-7 max-w-2xl text-5xl font-bold uppercase leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl md:text-8xl text-balance">
            IMDB ratings on your favourite{" "}
            <span className="text-primary">streaming apps.</span>
          </h1>

          <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl text-pretty">
            Sift adds IMDB ratings next to movies and TV shows on Netflix, Prime
            Video, and more. Choose what to watch faster.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {browsers.map((browser) => (
              <Button
                key={browser.name}
                size="lg"
                className="h-12 justify-center gap-2 rounded-none px-6 text-sm font-bold uppercase tracking-wide shadow-[0_10px_35px_rgba(0,0,0,0.3)]"
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
              className="h-12 justify-center gap-2 rounded-none border-white/35 bg-black/20 px-6 text-sm font-bold uppercase tracking-wide text-white hover:border-white hover:bg-white/10 hover:text-white"
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
