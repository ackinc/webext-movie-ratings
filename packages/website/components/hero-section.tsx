"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { supportedBrowsers as browsers } from "@/lib/constants";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate -mt-16 min-h-svh overflow-hidden pt-16"
    >
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/promo1.webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 -z-10 bg-black/60 min-[1201px]:bg-[linear-gradient(to_right,var(--background)_0%,var(--background)_45%,transparent_72%)]" />

      <div className="container mx-auto flex min-h-[calc(100svh-4rem)] items-center px-4">
        <div className="max-w-2xl text-center text-white min-[1201px]:w-1/2 min-[1201px]:text-left min-[1201px]:text-foreground">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white min-[1201px]:bg-accent/30 min-[1201px]:text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            Free &amp; Open Source
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl min-[1201px]:text-foreground text-balance">
            IMDB ratings on your favourite{" "}
            <span className="text-accent">streaming apps</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/85 md:text-xl min-[1201px]:mx-0 min-[1201px]:text-muted-foreground text-pretty">
            Sift adds IMDB ratings next to movies and TV shows on Netflix, Prime
            Video, and more. Choose what to watch faster.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap min-[1201px]:justify-start">
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
              className="gap-2 border-white/60 bg-black/20 px-8 text-white hover:bg-white/15 hover:text-white min-[1201px]:border-border min-[1201px]:bg-background min-[1201px]:text-foreground min-[1201px]:hover:bg-accent min-[1201px]:hover:text-accent-foreground"
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
