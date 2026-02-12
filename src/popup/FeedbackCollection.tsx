import "./FeedbackCollection.css";

const mailtoHref = "mailto:anirudh.nimmagadda@gmail.com?subject=About Sift";

export default function FeedbackCollection() {
  return (
    <div className="feedback-collection">
      <a href={mailtoHref} target="_blank">
        Have feedback?
      </a>
    </div>
  );
}
