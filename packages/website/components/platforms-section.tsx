import { supportedPlatforms as platforms } from "@/lib/constants";

export function PlatformsSection() {
  return (
    <section id="platforms" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-12 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Works where you watch
          </h2>

          <div className="grid grid-cols-1 items-center justify-items-center gap-12 sm:grid-cols-3 md:grid-cols-4">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform.name}
                className="grayscale opacity-60 transition-all hover:grayscale-0 hover:opacity-100"
              >
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="h-16 w-auto"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
