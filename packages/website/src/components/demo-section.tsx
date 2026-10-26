"use client";
import styles from "./demo-section.module.css";

export function DemoSection() {
  return (
    <section id="demo" className={styles["section"]}>
      <div className={styles["container"]}>
        <div className={styles["content"]}>
          <div className={styles["heading"]}>
            <h2>See it in action</h2>
            <p>
              Watch how Sift seamlessly adds IMDB ratings to your favorite
              streaming platforms
            </p>
          </div>

          <div className={styles["videoFrame"]}>
            <div className={styles["videoAspect"]}>
              <iframe
                src="https://www.youtube.com/embed/0nacMtjRhk4?rel=0"
                title="Sift Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles["video"]}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
