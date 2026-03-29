import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getPromotionsForCard, type CardPromotion, type CashbackCard } from "@/lib/data";

async function getCardById(id: string): Promise<CashbackCard | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cashback_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getCardById error:", error);
    return null;
  }

  return data as CashbackCard;
}

function cashbackSummary(card: CashbackCard): string {
  const rates = card.cashback_rates;
  if (!rates || typeof rates !== "object") return "--";

  const entries = Object.entries(rates);
  if (entries.length === 0) return "--";

  return entries.map(([key, value]) => `${key}: ${value}%`).join(" · ");
}

export default async function CardDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  const promotions = await getPromotionsForCard(id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-3 text-sm text-cyan-200">{card.bank ?? "--"}</div>
        <h1 className="text-4xl font-bold">{card.card_name ?? "--"}</h1>
        <p className="mt-2 text-white/60">{card.card_type ?? "--"}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Annual Fee" value={card.annual_fee ?? "--"} />
          <InfoItem
            label="Income Requirement"
            value={card.income_requirement ? `S$${card.income_requirement.toLocaleString()}` : "--"}
          />
          <InfoItem
            label="Minimum Monthly Spend"
            value={card.minimum_monthly_spend ? `S$${card.minimum_monthly_spend.toLocaleString()}` : "--"}
          />
          <InfoItem
            label="Monthly Cap"
            value={card.monthly_cap_sgd ? `S$${card.monthly_cap_sgd}` : "--"}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 text-sm font-medium text-white/70">Official Cashback Structure</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
            {cashbackSummary(card)}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-sm font-medium text-white/70">Special Conditions</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            {card.special_conditions ?? "--"}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Linked Promotions & Aggregator Highlights</h2>

        <div className="grid gap-4">
          {promotions.length > 0 ? (
            promotions.map((promo: CardPromotion) => (
              <div key={promo.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-cyan-200">{promo.source ?? "--"}</div>
                    <div className="mt-1 text-xl font-semibold">{promo.reward_value ?? "Promotion"}</div>
                  </div>

                  {promo.is_exclusive_deal ? (
                    <div className="rounded-2xl bg-cyan-400/15 px-4 py-2 text-sm text-cyan-200">
                      Exclusive
                    </div>
                  ) : null}
                </div>

                <p className="text-sm text-white/80">{promo.reward_description ?? "--"}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoItem
                    label="Minimum Spend"
                    value={promo.minimum_spend_to_unlock ? `S$${promo.minimum_spend_to_unlock}` : "--"}
                  />
                  <InfoItem
                    label="Spend Window"
                    value={promo.spend_within_days ? `${promo.spend_within_days} days` : "--"}
                  />
                  <InfoItem label="Promo Code" value={promo.exclusive_promo_code ?? "--"} />
                  <InfoItem label="Expiry" value={promo.promo_expiry_date ?? "--"} />
                </div>

                {(promo.extra_gift || promo.estimated_total_value || promo.source_section) ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <InfoItem label="Extra Gift" value={promo.extra_gift ?? "--"} />
                    <InfoItem label="Estimated Total Value" value={promo.estimated_total_value ?? "--"} />
                    <InfoItem label="Source Section" value={promo.source_section ?? "--"} />
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-white/50">
              No linked promotions found for this card yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-2 text-sm text-white/85">{value}</div>
    </div>
  );
}