import { Button } from "@/components/ui/button";

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

export function DownloadSection() {
  return (
    <section id="download" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Download for your browser
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Available on all major browsers. Install in seconds.
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
          </div>
        </div>
      </div>
    </section>
  );
}
