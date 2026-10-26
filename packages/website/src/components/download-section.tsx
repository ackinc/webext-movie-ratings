import { supportedBrowsers as browsers } from "@/lib/constants";
import styles from "./download-section.module.css";

export function DownloadSection() {
  return (
    <section id="download" className="section">
      <div className="container">
        <div className={`section-content ${styles["content"]}`}>
          <div className={`section-heading ${styles["heading"]}`}>
            <h2 className={`section-title ${styles["title"]}`}>
              Get Sift for your browser
            </h2>
          </div>

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
