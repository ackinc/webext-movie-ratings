import { supportedPlatforms as platforms } from "@/lib/constants";
import styles from "./platforms-section.module.css";

export function PlatformsSection() {
  return (
    <section id="platforms" className={styles["section"]}>
      <div className={styles["container"]}>
        <div className={styles["content"]}>
          <h2>Works where you watch</h2>

          <div className={styles["grid"]}>
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform.name}
                className={styles["platform"]}
              >
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className={styles["logo"]}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
