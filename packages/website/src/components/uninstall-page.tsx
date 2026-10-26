"use client";

import { Fragment, useState } from "react";
import { Set as ImmutableSet } from "immutable";
import { Info } from "lucide-react";
import type { UserMessage } from "siftcore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";
import { API_URL, supportedPlatforms } from "@/lib/constants";
import styles from "./uninstall-page.module.css";

const platformOptions = supportedPlatforms.map((p) => p.name).sort();

interface UninstallReason {
  id: string;
  desc: string;
  question?: {
    text: string;
    readOnly?: boolean;
    options?: string[];
  };
  note?: {
    text: string;
    href?: string;
  };
}
const reasons: UninstallReason[] = [
  {
    id: "found-better-alternative",
    desc: "Found a better alternative",
    question: {
      text: "Unbelievable. What tool did you like more?",
    },
  },
  {
    id: "too-slow-perf-issues",
    desc: "Too slow / performance issues",
    question: {
      text: "Argh. Which site(s) did you have trouble on?",
      options: platformOptions,
    },
  },
  {
    id: "incorrect-ratings",
    desc: "Too many incorrect ratings",
    question: {
      text: "Ergh. Which site(s) was this on?",
      options: platformOptions,
    },
  },
  {
    id: "doesnt-work-on-desired-website",
    desc: "Doesn't support my desired streaming website",
    question: {
      text: "Ugh. What site(s) should we add support for?",
    },
  },
  {
    id: "doesnt-support-preferred-ratings-provider",
    desc: "Doesn't support the ratings provider I prefer",
    question: {
      text: "Rats. Is it Rotten Tomatoes?",
    },
  },
  {
    id: "privacy-concerns",
    desc: "Privacy concerns",
    question: {
      text: "Huh. Any data in particular you're concerned about?",
    },
    note: {
      text: "Sift doesn't collect or sell your data, it only sends movie titles to a ratings API. Click for our full privacy policy.",
      href: "/privacy",
    },
  },
  {
    id: "no-longer-need-it",
    desc: "No longer need it",
    question: {
      text: "Impossible. Everyone needs Sift! Everyone!",
      readOnly: true,
    },
  },
  {
    id: "other",
    desc: "Some other reason",
    question: {
      text: "Hmm. What did we miss?",
    },
  },
];

export default function UninstallPage() {
  const [selectedReasons, setSelectedReasons] =
    useState<ImmutableSet<UninstallReason["id"]>>(ImmutableSet());
  const [textValues, setTextValues] = useState<
    Record<UninstallReason["id"], string>
  >({});
  const [multiValues, setMultiValues] = useState<
    Record<UninstallReason["id"], string[]>
  >({});
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className={styles["page"]}>
      <Header />
      <main>
        <div className={styles["backContainer"]}>
          <a href="/" className={styles["backLink"]}>
            &larr; Back to home
          </a>
        </div>
        <div className={styles["content"]}>
          <h1>Sorry to see you go!</h1>
          <p className={styles["intro"]}>
            Mind sharing why? It helps us fix things.
          </p>

          {submitted ? (
            <div className={styles["thankYou"]}>
              <p>Thank you for your feedback!</p>
              <p>We'll use it to make Sift better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles["form"]}>
              <div className={styles["reasonGrid"]}>
                {reasons.map(({ id, desc, note, question }) => {
                  const checked = selectedReasons.has(id);
                  return (
                    <Fragment key={id}>
                      <div
                        className={`${styles["reason"]} ${checked ? styles["reasonChecked"] : ""}`}
                      >
                        <label className={styles["reasonLabel"]}>
                          <input
                            name={`reason-${id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedReasons(
                                selectedReasons.has(id)
                                  ? selectedReasons.delete(id)
                                  : selectedReasons.add(id),
                              )
                            }
                            className={styles["reasonInput"]}
                          />
                          <span className={styles["reasonText"]}>{desc}</span>
                          {note && (
                            <a
                              href={note.href ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Read our privacy policy"
                              className={styles["noteLink"]}
                            >
                              <Info />
                              <span className={styles["noteTooltip"]}>
                                {note.text}
                              </span>
                            </a>
                          )}
                        </label>
                      </div>

                      <div className={styles["reasonDetails"]}>
                        {checked &&
                          question &&
                          (question.options ? (
                            <MultiSelectDropdown
                              defaultOpen={true}
                              value={multiValues[id] ?? []}
                              onChange={(value) =>
                                setMultiValues((prev) => ({
                                  ...prev,
                                  [id]: value,
                                }))
                              }
                              options={question.options}
                              placeholder={question.text}
                            />
                          ) : (
                            <input
                              autoFocus={!question.readOnly}
                              name={`reason-${id}-details`}
                              type="text"
                              value={textValues[id] ?? ""}
                              onChange={(e) =>
                                setTextValues((prev) => ({
                                  ...prev,
                                  [id]: e.target.value,
                                }))
                              }
                              placeholder={question.text}
                              disabled={question.readOnly}
                              className={styles["textInput"]}
                            />
                          ))}
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              <div>
                <label className={styles["emailLabel"]}>
                  <input
                    name="email"
                    autoComplete="on"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className={styles["emailInput"]}
                  />
                  <span>
                    ^ optional. If you'd like us to inform you when we've fixed
                    the issues you're raising.
                  </span>
                </label>
              </div>

              {error && <p className={styles["error"]}>{error}</p>}

              <button
                type="submit"
                className={styles["submit"]}
                disabled={loading || selectedReasons.size === 0}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");

    if (selectedReasons.size === 0) {
      setError("Please select at least one of the options above.");
      return;
    }

    const message = Array.from(selectedReasons)
      .map((rId) => {
        return [rId, multiValues[rId]?.join(", "), textValues[rId]]
          .filter(Boolean)
          .join(": ");
      })
      .join("\n");

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "uninstall-reason",
          message,
          ...(email ? { email } : {}),
        } satisfies UserMessage),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
}
