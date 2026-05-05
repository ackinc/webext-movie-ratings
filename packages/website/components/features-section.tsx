import Link from "next/link";
import { Star, ExternalLink, Code2, ShieldCheck } from "lucide-react";

const features: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}[] = [
  {
    icon: Star,
    title: "Instant Ratings",
    description:
      "IMDB ratings appear directly next to movie and TV show tiles as you browse. No extra clicks needed.",
  },
  {
    icon: ExternalLink,
    title: "Quick Access to IMDB",
    description:
      "Click any rating to open the full IMDB page in a new tab for reviews, cast info, and more.",
  },
  {
    icon: Code2,
    title: "Open Source",
    description:
      "Fully transparent codebase. Review it, contribute to it, or fork it on GitHub.",
    link: "https://github.com/ackinc/webext-movie-ratings",
    linkText: "Source code",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description:
      "No user data collected by default. Opt-in to error reporting if you choose.",
    link: "/privacy",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Simple. Fast. Transparent.
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to make better viewing decisions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-accent hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
                {feature.link && (
                  <Link
                    href={feature.link}
                    className="mt-3 inline-flex items-center text-sm font-medium text-accent hover:underline"
                  >
                    {feature.linkText ?? "Learn more"}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
