import { Button } from "@/components/ui/button";
import { supportedBrowsers as browsers } from "@/lib/constants";

export function DownloadSection() {
  return (
    <section id="download" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Get Sift for your browser
          </h2>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row flex-wrap">
            {browsers.map((browser) => (
              <Button
                key={browser.name}
                size="lg"
                className="w-48 gap-2 px-8"
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
          </div>
        </div>
      </div>
    </section>
  );
}
