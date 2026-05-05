"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const browsers = [
  {
    name: "Chrome",
    logo: "/chrome32.png",
    url: "https://chromewebstore.google.com/detail/sift-imdb-ratings-on-vari/pfnhkljamlclkackkndllofcfhihacna",
  },
  {
    name: "Edge",
    logo: "/edge32.png",
    url: "https://microsoftedge.microsoft.com/addons/detail/sift-imdb-ratings-on-var/odgepppomekmdiifmjmocpjhopdmgjnl",
  },
  {
    name: "Firefox",
    logo: "/firefox32.png",
    url: "https://addons.mozilla.org/en-US/firefox/addon/imdb-ratings-for-various-ott/",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/30 px-4 py-2 text-sm font-medium text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            Free &amp; Open Source
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-7xl text-balance">
            IMDB ratings on your
            <br />
            <span className="text-accent">streaming apps</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl text-pretty">
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
            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
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
