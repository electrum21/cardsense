"use client";

import { useState } from "react";
import { env } from "@/lib/env";

type RecommendationResponse =
  | {
      recommendation?: string;
      summary?: string;
      recommendations?: string[] | Array<{
        title?: string;
        cardName?: string;
        bank?: string;
        reason?: string;
      }>;
      [key: string]: unknown;
    }
  | Record<string, unknown>;

function formatResponse(data: RecommendationResponse): string {
  if (typeof data.recommendation === "string" && data.recommendation.trim()) {
    return data.recommendation;
  }

  if (typeof data.summary === "string" && data.summary.trim()) {
    return data.summary;
  }

  if (Array.isArray(data.recommendations)) {
    return data.recommendations
      .map((item, index) => {
        if (typeof item === "string") {
          return `${index + 1}. ${item}`;
        }

        const title = item.title ?? item.cardName ?? "Recommendation";
        const bank = item.bank ? ` (${item.bank})` : "";
        const reason = item.reason ? ` — ${item.reason}` : "";
        return `${index + 1}. ${title}${bank}${reason}`;
      })
      .join("\n");
  }

  return JSON.stringify(data, null, 2);
}

export function AiAdvisor() {
  const [preferences, setPreferences] = useState(
    "I spend heavily on dining, online shopping, and one regional trip a quarter. I prefer waived annual fees and strong signup gifts."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(`${env.apiBaseUrl}/api/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ preferences })
      });

      const data = (await response.json()) as RecommendationResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recommendation.");
      }

      setResult(formatResponse(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while generating a recommendation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
        AI Concierge
      </div>

      <h2 className="text-2xl font-semibold">Describe your monthly spend, preferred reward type, annual fee preference, and travel habits...</h2>

      <div className="mt-6">
        <textarea
          id="advisor-preferences"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-400"
          placeholder="Describe your monthly spend, preferred reward type, annual fee preference, and travel habits..."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || preferences.trim().length < 10}
          className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Recommendation"}
        </button>

        <button
          type="button"
          onClick={() =>
            setPreferences(
              "I mainly spend on groceries, dining, and petrol. I want strong cashback and I prefer low or waived annual fees."
            )
          }
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white/80 hover:bg-white/10"
        >
          Use sample prompt
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-3 text-sm font-medium text-white/60">Recommendation</div>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/90">
            {result}
          </pre>
        </div>
      ) : null}
    </div>
  );
}