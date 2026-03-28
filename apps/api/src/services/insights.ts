import { env } from "../config.js";
import { openai } from "../lib/openai.js";
import { supabaseAdmin } from "../lib/supabase.js";

export async function fetchDashboardData() {
  const [{ data: cashbackCards, error: cashbackError }, { data: signupOffers, error: signupError }, { data: merchantOffers, error: merchantError }] =
    await Promise.all([
      supabaseAdmin.from("cashback_cards").select("*").limit(50),
      supabaseAdmin.from("signup_offers").select("*").limit(50),
      supabaseAdmin.from("merchant_offers").select("*").limit(50)
    ]);

  if (cashbackError) throw cashbackError;
  if (signupError) throw signupError;
  if (merchantError) throw merchantError;

  return {
    cashbackCards: cashbackCards ?? [],
    signupOffers: signupOffers ?? [],
    merchantOffers: merchantOffers ?? []
  };
}

export async function buildAiRecommendation(preferences: string) {
  const snapshot = await fetchDashboardData();

  if (!openai) {
    return {
      fallback: true,
      answer:
        "OpenAI is not configured yet. Add OPENAI_API_KEY to the backend and this endpoint will generate a personalized recommendation from your Supabase data."
    };
  }

  const completion = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content:
          "You are a Singapore credit card strategist. Use the provided JSON data to recommend the best cards and promos. Be practical and concise."
      },
      {
        role: "user",
        content: `User preferences: ${preferences}\n\nData snapshot:\n${JSON.stringify(snapshot).slice(0, 12000)}`
      }
    ]
  });

  return {
    fallback: false,
    answer: completion.output_text
  };
}

