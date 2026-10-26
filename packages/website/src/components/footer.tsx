import { Github } from "lucide-react";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles["footer"]}>
      <div className={styles["container"]}>
        <div className={styles["inner"]}>
          <div className={styles["brand"]}>
            <img
              src="/images/logo128.png"
              alt="Sift logo"
              className={styles["logo"]}
            />
            <span>Sift</span>
          </div>

          <div className={styles["copy"]}>
            <p>
              IMDB ratings powered by the{" "}
              <a
                href="https://www.patreon.com/join/omdb"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["omdbLink"]}
              >
                OMDB API
              </a>
              . Consider supporting the project!
            </p>
          </div>

          <div className={styles["source"]}>
            <a
              href="https://github.com/ackinc/webext-movie-ratings"
              target="_blank"
              rel="noopener noreferrer"
              className={styles["sourceLink"]}
            >
              <Github />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
