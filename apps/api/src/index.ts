import cors from "cors";
import express from "express";
import { z } from "zod";
import { env } from "./config.js";
import { supabaseAdmin } from "./lib/supabase.js";
import { ingestTinyFishPayload } from "./services/ingest.js";
import { buildAiRecommendation, fetchDashboardData } from "./services/insights.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/health/db", async (_request, response) => {
  const { error } = await supabaseAdmin.from("cashback_cards").select("id").limit(1);

  response.json({
    ok: !error,
    supabase: error ? "error" : "connected"
  });
});

app.get("/api/summary", async (_request, response, next) => {
  try {
    const [{ data: overview, error }, snapshot] = await Promise.all([
      supabaseAdmin.from("dashboard_overview").select("*").single(),
      fetchDashboardData()
    ]);

    if (error) throw error;

    response.json({
      overview,
      spotlight: {
        topMerchantOffer: snapshot.merchantOffers[0] ?? null,
        topSignupOffer: snapshot.signupOffers[0] ?? null,
        topCashbackCard: snapshot.cashbackCards[0] ?? null
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/recommendations", async (request, response, next) => {
  const bodySchema = z.object({
    preferences: z.string().min(10)
  });

  try {
    const body = bodySchema.parse(request.body);
    const recommendation = await buildAiRecommendation(body.preferences);
    response.json(recommendation);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  response.status(500).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
