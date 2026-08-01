"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import type { UserMessage } from "sifttypes";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";
import { API_URL, supportedPlatforms } from "../../lib/constants";

const platformOptions = supportedPlatforms.map((p) => p.name);

const privacyNote =
  "Sift doesn't collect or sell your data, it only sends movie titles to a ratings API.";

const reasons = [
  {
    reason: "Found a better alternative",
    extra: {
      id: "went-with",
      question: "What was the extension you ended up going with?",
      payloadLabel: "Went with",
    },
  },
  {
    reason: "Too slow / performance issues",
    extra: {
      id: "website",
      question: "Which website(s) did Sift give you trouble on?",
      payloadLabel: "Website(s)",
      options: platformOptions,
    },
  },
  {
    reason: "Too many incorrect ratings",
    extra: {
      id: "incorrect-ratings",
      question: "Which site and title(s) did this happen on?",
      payloadLabel: "Site/title(s)",
    },
  },
  {
    reason: "Doesn't work on my streaming platform",
    extra: {
      id: "platform",
      question: "Which platform? We'll try to support it soon.",
      payloadLabel: "Platform",
    },
  },
  {
    reason: "Privacy concerns",
    extra: {
      id: "privacy-concern",
      question: "What data are you worried about?",
      payloadLabel: "Concern",
    },
    note: privacyNote,
  },
  { reason: "No longer need it" },
  {
    reason: "Other",
    extra: {
      id: "other-details",
      question: "Anything else you want to tell us ...",
      payloadLabel: "",
    },
  },
];

export default function UninstallPage() {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>(
    {},
  );
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleReason(reason: string, extraId?: string) {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
    if (extraId) {
      setTextValues((prev) => ({ ...prev, [extraId]: "" }));
      setMultiValues((prev) => ({ ...prev, [extraId]: [] }));
    }
  }

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
                {reasons.map(({ reason, extra, note }) => {
                  const checked = selectedReasons.includes(reason);
                  return (
                    <Fragment key={reason}>
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-[9px] has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                        <label className="flex flex-1 items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReason(reason, extra?.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm text-foreground">
                            {reason}
                          </span>
                        </label>
                        {note && (
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Read our privacy policy"
                            className="group relative shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <Info className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-64 rounded-md border bg-popover p-2 text-xs font-normal text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                              {note} Click for our full privacy policy.
                            </span>
                          </Link>
                        )}
                      </div>
                      <div>
                        {extra && checked && (
                          <div className="animate-in fade-in duration-200">
                            {extra.options ? (
                              <MultiSelectDropdown
                                value={multiValues[extra.id] ?? []}
                                onChange={(value) =>
                                  setMultiValues((prev) => ({
                                    ...prev,
                                    [extra.id]: value,
                                  }))
                                }
                                options={extra.options}
                                placeholder={extra.question}
                              />
                            ) : (
                              <input
                                type="text"
                                value={textValues[extra.id] ?? ""}
                                onChange={(e) =>
                                  setTextValues((prev) => ({
                                    ...prev,
                                    [extra.id]: e.target.value,
                                  }))
                                }
                                placeholder={extra.question}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Email{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional; if you'd like us to inform you when we've fixed
                    the issues you're raising)
                  </span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-primary"
                disabled={loading || selectedReasons.length === 0}
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

    const reasonSegments = selectedReasons.map((r) => {
      const extra = reasons.find((x) => x.reason === r)?.extra;
      const value = extra
        ? extra.options
          ? (multiValues[extra.id] ?? []).join(", ")
          : (textValues[extra.id] ?? "")
        : "";
      const detail = !value
        ? ""
        : extra!.payloadLabel
          ? `${extra!.payloadLabel}: ${value}`
          : value;
      return [r, detail].filter(Boolean).join(" - ");
    });
    const reason = reasonSegments.join(" | ");

    if (!reason) {
      setError("Please select or enter a reason");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reason,
          email: email || undefined,
          category: "uninstall-reason",
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
