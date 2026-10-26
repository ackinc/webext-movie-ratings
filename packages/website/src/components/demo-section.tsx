"use client";
import styles from "./demo-section.module.css";

export function DemoSection() {
  return (
    <section id="demo" className="section">
      <div className="container">
        <div className={`section-content ${styles["content"]}`}>
          <div className={`section-heading ${styles["heading"]}`}>
            <h2 className="section-title">See it in action</h2>
          </div>

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
    </section>
  );
}
