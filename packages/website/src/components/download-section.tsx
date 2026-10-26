import { supportedBrowsers as browsers } from "@/lib/constants";
import styles from "./download-section.module.css";

export function DownloadSection() {
  return (
    <section id="download" className={styles["section"]}>
      <div className={styles["container"]}>
        <div className={styles["content"]}>
          <h2>Get Sift for your browser</h2>

          <div className={styles["actions"]}>
            {browsers.map((browser) => (
              <a
                key={browser.name}
                className={styles["button"]}
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={browser.logo}
                  alt={browser.name}
                  className={styles["browserLogo"]}
                />
                Add to {browser.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
