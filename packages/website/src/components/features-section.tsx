import { Star, ExternalLink, Code2, ShieldCheck } from "lucide-react";
import styles from "./features-section.module.css";

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
    <section id="features" className={styles["section"]}>
      <div className={styles["container"]}>
        <div className={styles["content"]}>
          <div className={styles["heading"]}>
            <h2>Simple. Fast. Transparent.</h2>
            <p>Everything you need to make better viewing decisions</p>
          </div>

          <div className={styles["grid"]}>
            {features.map((feature) => (
              <div key={feature.title} className={styles["card"]}>
                <div className={styles["icon"]}>
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                {feature.link && (
                  <a href={feature.link} className={styles["link"]}>
                    {feature.linkText ?? "Learn more"}
                    <ExternalLink />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
