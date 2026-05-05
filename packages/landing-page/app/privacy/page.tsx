import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy Policy - Sift",
  description: "Privacy policy for the Sift browser extension",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to home
          </Link>

          <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                What information does this extension collect?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                As a user is browsing movies / shows on an OTT platform&apos;s
                website, this extension scrapes the web page to identify the
                movies / shows being shown to the user.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                How is this information used?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Once the movies / shows on the web page have been identified,
                their IMDB rating and related information is retrieved via a web
                request to a third-party, and the ratings are displayed to the
                user next to the movie tile.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                What information does this extension share with third-parties?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The extension sends a movie&apos;s title and year of release
                  to{" "}
                  <a
                    href="https://www.omdbapi.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-2 hover:text-foreground"
                  >
                    omdbapi.com
                  </a>
                  , which is an API service providing movie ratings from IMDB
                  and similar providers. omdbapi.com sends the IMDB rating (and
                  some related info) back.
                </p>
                <p>
                  If the user explicitly opts-in to error reporting, any errors
                  that occur during use of the extension are reported (along
                  with related details like device, OS, browser, browser
                  dimensions, etc.) to our error reporting platform -{" "}
                  <a
                    href="https://sentry.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-2 hover:text-foreground"
                  >
                    sentry.io
                  </a>
                  .
                </p>
                <p>
                  A full list of the data collected is shown to the user in the
                  extension&apos;s popup, where the user can choose whether or
                  not to opt-in to error reporting.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
