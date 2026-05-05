import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="logo128.png"
              alt="Sift logo"
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-lg font-semibold text-foreground">Sift</span>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              IMDB ratings powered by the{" "}
              <a
                href="https://www.patreon.com/join/omdb"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-accent transition-colors"
              >
                OMDB API
              </a>
              . Consider supporting the project!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ackinc/webext-movie-ratings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
