"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Set as ImmutableSet } from "immutable";
import { Info } from "lucide-react";
import type { UserMessage } from "sifttypes";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";
import { API_URL, supportedPlatforms } from "../../lib/constants";

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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to home
          </Link>
        </div>
        <div className="container mx-auto max-w-3xl px-4 pb-16 pt-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Sorry to see you go!
          </h1>
          <p className="mb-8 text-muted-foreground">
            Mind sharing why? It helps us fix things.
          </p>

          {submitted ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-lg font-medium text-foreground">
                Thank you for your feedback!
              </p>
              <p className="mt-2 text-muted-foreground">
                We'll use it to make Sift better.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 items-start gap-x-8 gap-y-3">
                {reasons.map(({ id, desc, note, question }) => {
                  const checked = selectedReasons.has(id);
                  return (
                    <Fragment key={id}>
                      <div className="uninstall-reason flex items-center gap-2 rounded-lg border has-checked:border-primary has-checked:bg-accent/50">
                        <label className="px-3 py-2.25 flex flex-1 items-center gap-3 cursor-pointer">
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
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm text-foreground">
                            {desc}
                          </span>
                          {note && (
                            <Link
                              href={note.href ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Read our privacy policy"
                              className="ml-auto group relative shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <Info className="h-3.5 w-3.5" />
                              <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-64 rounded-md border bg-popover p-2 text-xs font-normal text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                {note.text}
                              </span>
                            </Link>
                          )}
                        </label>
                      </div>

                      <div className="uninstall-reason-details">
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
                              className="disabled:bg-gray-200 placeholder-gray-400 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                          ))}
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              <div>
                <label className="flex flex-col text-xs font-medium text-gray-400">
                  <input
                    name="email"
                    autoComplete="on"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="mb-1 w-[calc(50%-1rem)] rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                  <span className="pl-4">
                    ^ optional. If you'd like us to inform you when we've fixed
                    the issues you're raising.
                  </span>
                </label>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="block w-[calc(50%-1rem)] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-primary"
                disabled={loading || selectedReasons.size === 0}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
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
