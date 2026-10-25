"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";
import { supportedBrowsers as browsers } from "@/lib/constants";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b border-white/10 bg-[#11110f] py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:3rem_3rem]" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" />

      <div className="container relative mx-auto grid items-center gap-12 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div>
          <div className="mb-7 flex items-center gap-3 text-xs font-bold tracking-[0.2em] text-accent uppercase">
            <span className="h-px w-10 bg-accent" />
            The better way to browse
          </div>

          <h1 className="max-w-xl text-5xl font-bold tracking-[-0.06em] text-foreground md:text-7xl lg:text-8xl">
            Know before you <span className="text-accent">play.</span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground md:text-xl">
            Sift puts IMDB ratings next to every title on the streaming services
            you already use. Less browsing. Better picks.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {browsers.map((browser) => (
              <Button
                key={browser.name}
                size="lg"
                className="gap-2 px-7"
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
            <Button size="lg" variant="outline" className="gap-2 px-7" asChild>
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

        <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl" />
          <div className="showcase-video relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-black p-2 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-x-2 top-2 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 py-4 text-xs font-medium tracking-[0.14em] text-white/80 uppercase">
              <span>Now browsing</span>
              <span className="flex items-center gap-1.5 text-accent">
                <Star className="h-3.5 w-3.5 fill-current" /> 8.4
              </span>
            </div>
            <video
              className="aspect-[4/3] w-full rounded-[1.25rem] object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src="/videos/promo1.webm" type="video/webm" />
            </video>
          </div>
          <div className="absolute -bottom-5 -left-5 border border-white/10 bg-[#1c1b18] px-4 py-3 text-sm text-muted-foreground shadow-xl">
            <span className="font-bold text-foreground">11 platforms</span>{" "}
            supported
          </div>
        </div>
      </div>
    </section>
  );
}
