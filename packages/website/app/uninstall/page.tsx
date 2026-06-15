"use client";

import { useState } from "react";
import Link from "next/link";
import type { UserMessage } from "sifttypes";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { API_URL } from "../../lib/constants";

const reasons = [
  {
    reason: "Found a better alternative",
    detailsPlaceholder: "What was the extension you ended up going with?",
  },
  {
    reason: "Too slow / performance issues",
    detailsPlaceholder: "Which website did Sift give you trouble on?",
  },
  {
    reason: "Doesn't work on my streaming platform",
    detailsPlaceholder: "Tell us which one and we'll try to support it ASAP!",
  },
  { reason: "Privacy concerns" },
  { reason: "No longer need it" },
  { reason: "Other" },
];
const defaultDetailsPlaceholder = "Anything else you want to tell us ...";

export default function UninstallPage() {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-xl px-4 py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to home
          </Link>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Sorry to see you go
          </h1>
          <p className="mb-8 text-muted-foreground">
            Help us improve by sharing why you're uninstalling Sift.
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
              <div className="space-y-3">
                {reasons.map(({ reason }) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">{reason}</span>
                  </label>
                ))}
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    reasons.find(({ reason }) => reason === selectedReason)
                      ?.detailsPlaceholder ?? defaultDetailsPlaceholder
                  }
                  rows={3}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Email{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional - so we can inform you when we fix the issues
                    you've raised!)
                  </span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
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

    const reason = [selectedReason, details].filter((x) => x).join(": ");

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
