"use client";

import { useMemo, useState } from "react";
import { AiAdvisor } from "@/components/ai-advisor";

export type SummaryPayload = {
  overview: {
    cashback_card_count: number;
    signup_offer_count: number;
    merchant_offer_count: number;
    restaurant_deal_count?: number;
    exclusive_signup_offer_count: number;
    max_merchant_cashback_rate: number | null;
    bank_count: number;
  };
  spotlight: {
    topMerchantOffer: Record<string, unknown> | null;
    topSignupOffer: Record<string, unknown> | null;
    topCashbackCard: Record<string, unknown> | null;
  };
};

export type CashbackCard = {
  id: string;
  card_name: string | null;
  bank: string | null;
  card_type: string | null;
  annual_fee: string | null;
};

export type SignupOffer = {
  id: string;
  card_name: string | null;
  bank: string | null;
  reward_description: string | null;
  reward_value: string | null;
  minimum_spend_to_unlock: number | null;
  spend_within_days: number | null;
};

export type MerchantOffer = {
  id: string;
  merchant: string | null;
  cashback_rate: string | null;
  cashback_rate_number: number | null;
  category: string | null;
};

export type CollectionsPayload = {
  cashbackCards: CashbackCard[];
  signupOffers: SignupOffer[];
  merchantOffers: MerchantOffer[];
};

type TabKey = "simulator" | "recommend" | "calendar" | "alerts" | "crawl";

type Props = {
  summary: SummaryPayload;
  collections: CollectionsPayload;
};

const spendCategories = [
  { key: "dining", label: "Dining", emoji: "🍽️" },
  { key: "groceries", label: "Groceries", emoji: "🥦" },
  { key: "online", label: "Online Shopping", emoji: "🛒" },
  { key: "transport", label: "Transport", emoji: "🚗" },
  { key: "petrol", label: "Petrol", emoji: "⛽" },
  { key: "travel", label: "Travel", emoji: "✈️" }
] as const;

function formatSpotlight(item: Record<string, unknown> | null) {
  if (!item) return "No live highlight available yet.";
  return `${String(item.card_name ?? item.merchant ?? "Offer")}${
    item.bank ? ` from ${String(item.bank)}` : ""
  }`;
}

function getMerchantCategory(merchant: string) {
  const normalized = merchant.toLowerCase();

  if (
    ["shake shack", "mcdonald", "kfc", "burger king", "starbucks", "toast box"].some((m) =>
      normalized.includes(m)
    )
  ) {
    return "Dining";
  }
  if (["shopee", "lazada", "amazon", "qoo10"].some((m) => normalized.includes(m))) {
    return "Online Shopping";
  }
  if (["fairprice", "sheng siong", "cold storage", "giant"].some((m) => normalized.includes(m))) {
    return "Groceries";
  }
  if (["shell", "esso", "caltex", "spc"].some((m) => normalized.includes(m))) {
    return "Petrol";
  }
  if (["grab", "gojek", "tada", "comfort"].some((m) => normalized.includes(m))) {
    return "Transport";
  }
  if (["netflix", "spotify", "disney"].some((m) => normalized.includes(m))) {
    return "Entertainment";
  }
  if (["singapore airlines", "sq", "agoda", "booking"].some((m) => normalized.includes(m))) {
    return "Travel";
  }

  return "General";
}

export default function DashboardShell({ summary, collections }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("simulator");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [rewardPreference, setRewardPreference] = useState<"cashback" | "miles" | "both">("cashback");
  const [income, setIncome] = useState(60000);
  const [spendProfile, setSpendProfile] = useState<Record<string, number>>({
    dining: 300,
    groceries: 250,
    online: 200,
    transport: 120,
    petrol: 80,
    travel: 100
  });

  const totalSpend = useMemo(
    () => Object.values(spendProfile).reduce((sum, value) => sum + value, 0),
    [spendProfile]
  );

  const simulatorCategory = merchant ? getMerchantCategory(merchant) : "—";

  const simulatedCards = useMemo(() => {
    const numericAmount = typeof amount === "number" ? amount : 0;
    if (!merchant || !numericAmount) return [];

    return collections.cashbackCards.slice(0, 5).map((card, index) => {
      const baseRate = [8, 6, 5, 4, 3][index] ?? 1;
      const estimatedReward = Number(((numericAmount * baseRate) / 100).toFixed(2));

      return {
        ...card,
        estimatedReward,
        baseRate
      };
    });
  }, [amount, collections.cashbackCards, merchant]);

  const recommendedCards = useMemo(() => {
    return collections.cashbackCards.slice(0, 3).map((card, index) => ({
      ...card,
      reason:
        index === 0
          ? "Strong overall fit for your spending mix."
          : index === 1
            ? "Useful secondary option for category coverage."
            : "Worth considering if you want broader flexibility."
    }));
  }, [collections.cashbackCards]);

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20 text-2xl">
              🐟
            </div>
            <div>
              <div className="text-xl font-bold">TinyFish</div>
              <div className="text-sm text-white/60">SG Card Optimizer</div>
            </div>
          </div>

          <div className="hidden items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 md:flex">
            <StatMini label="Cards" value={summary.overview.cashback_card_count} />
            <StatMini label="Banks" value={summary.overview.bank_count} />
            <StatMini label="Offers" value={summary.overview.signup_offer_count} />
          </div>

          <div className="hidden gap-2 md:flex">
            <Badge text="OpenAI" />
            <Badge text="TinyFish Live" live />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1020]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4">
          <TabButton active={activeTab === "simulator"} onClick={() => setActiveTab("simulator")} label="Spend Simulator" />
          <TabButton active={activeTab === "recommend"} onClick={() => setActiveTab("recommend")} label="Card Recommender" />
          <TabButton active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} label="Promo Calendar" />
          <TabButton active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} label="Alerts" />
          <TabButton active={activeTab === "crawl"} onClick={() => setActiveTab("crawl")} label="Data Crawl" />
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "simulator" && (
          <section className="space-y-6">
            <PageHeader
              title="Spend Scenario Simulator"
              subtitle="Type a merchant + amount — preview which cards are likely to reward you best."
            />

            <GlassCard>
              <div className="grid gap-4 md:grid-cols-[1fr_180px_160px]">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Merchant</label>
                  <input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Shake Shack, Shopee, FairPrice"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Amount (S$)</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    type="number"
                    min={1}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900">
                    Simulate
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["Shake Shack", 45],
                  ["Shopee", 120],
                  ["FairPrice", 200],
                  ["Shell", 80],
                  ["Netflix", 18]
                ].map(([name, value]) => (
                  <button
                    key={String(name)}
                    onClick={() => {
                      setMerchant(String(name));
                      setAmount(Number(value));
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60">Resolved Category</div>
                  <div className="text-2xl font-bold">{simulatorCategory}</div>
                </div>
                <div className="text-sm text-white/60">
                  Merchant recognition here is local UI logic for now. You can later back it with embeddings/API.
                </div>
              </div>

              <div className="grid gap-4">
                {simulatedCards.length > 0 ? (
                  simulatedCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <div className="font-semibold">{card.card_name ?? "--"}</div>
                        <div className="text-sm text-white/60">{card.bank ?? "--"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60">Estimated reward</div>
                        <div className="text-xl font-bold text-cyan-300">
                          S${card.estimatedReward.toFixed(2)} ({card.baseRate}%)
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-white/55">
                    Enter a merchant and amount to simulate results.
                  </div>
                )}
              </div>
            </GlassCard>
          </section>
        )}

        {activeTab === "recommend" && (
          <section className="space-y-6">
            <PageHeader
              title="New Card Recommender"
              subtitle="Tell us how you spend — we’ll surface strong card options and keep your AI concierge below."
            />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <GlassCard>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Monthly Spend</h2>
                  <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-cyan-200">
                    S${totalSpend} / mo
                  </div>
                </div>

                <div className="space-y-5">
                  {spendCategories.map((category) => (
                    <div key={category.key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>
                          {category.emoji} {category.label}
                        </span>
                        <span>S${spendProfile[category.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1500}
                        step={10}
                        value={spendProfile[category.key]}
                        onChange={(e) =>
                          setSpendProfile((prev) => ({
                            ...prev,
                            [category.key]: Number(e.target.value)
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <h2 className="mb-5 text-xl font-semibold">Preferences</h2>

                <div className="mb-5 grid grid-cols-3 gap-2">
                  {(["cashback", "miles", "both"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setRewardPreference(value)}
                      className={`rounded-2xl px-3 py-3 text-sm font-medium ${
                        rewardPreference === value
                          ? "bg-cyan-400 text-slate-900"
                          : "border border-white/10 bg-white/5 text-white/80"
                      }`}
                    >
                      {value === "cashback" ? "💰 Cashback" : value === "miles" ? "✈️ Miles" : "⚡ Best"}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Annual Income</span>
                    <span>S${income.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={200000}
                    step={5000}
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  {recommendedCards.map((card) => (
                    <div key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-semibold">{card.card_name ?? "--"}</div>
                      <div className="text-sm text-white/60">{card.bank ?? "--"}</div>
                      <p className="mt-2 text-sm text-white/75">{card.reason}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <GlassCard>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">AI Concierge</h2>
                <p className="mt-1 text-sm text-white/60">
                  This keeps your existing AI flow, just placed inside the new tabbed interface.
                </p>
              </div>
              <AiAdvisor />
            </GlassCard>
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="space-y-6">
            <PageHeader
              title="Promo Calendar"
              subtitle="A first-pass timeline view using your live merchant offers."
            />

            <div className="grid gap-4">
              {collections.merchantOffers.length > 0 ? (
                collections.merchantOffers.map((offer) => (
                  <GlassCard key={offer.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{offer.merchant ?? "--"}</div>
                        <div className="text-sm text-white/60">{offer.category ?? "--"}</div>
                      </div>
                      <div className="rounded-full bg-cyan-400/15 px-4 py-2 text-cyan-200">
                        {offer.cashback_rate ?? "--"}
                      </div>
                    </div>
                  </GlassCard>
                ))
              ) : (
                <GlassCard>No merchant offers available yet.</GlassCard>
              )}
            </div>
          </section>
        )}

        {activeTab === "alerts" && (
          <section className="space-y-6">
            <PageHeader
              title="Alert Center"
              subtitle="Use this as a UI shell first, then wire diff crawl results later."
            />

            <div className="grid gap-4">
              <GlassCard>
                <div className="font-semibold">Promo spike detected</div>
                <p className="mt-2 text-sm text-white/70">
                  A merchant cashback rate appears higher than baseline. You can later connect this to TinyFish diff runs.
                </p>
              </GlassCard>

              <GlassCard>
                <div className="font-semibold">Signup campaign changed</div>
                <p className="mt-2 text-sm text-white/70">
                  A bank signup reward changed in the latest ingestion batch.
                </p>
              </GlassCard>
            </div>
          </section>
        )}

        {activeTab === "crawl" && (
          <section className="space-y-6">
            <PageHeader
              title="Data Crawl Control"
              subtitle="A polished control surface for future TinyFish-trigger endpoints."
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <GlassCard>
                <div className="mb-3 text-lg font-semibold">Tier 1 — Official Banks</div>
                <p className="mb-5 text-sm text-white/65">
                  DBS, OCBC, UOB, Citi, HSBC and more.
                </p>
                <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900">
                  Crawl Banks
                </button>
              </GlassCard>

              <GlassCard>
                <div className="mb-3 text-lg font-semibold">Tier 2 — Aggregators</div>
                <p className="mb-5 text-sm text-white/65">
                  MoneySmart, SingSaver, Seedly and similar sources.
                </p>
                <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900">
                  Crawl Aggregators
                </button>
              </GlassCard>

              <GlassCard>
                <div className="mb-3 text-lg font-semibold">Tier 3 — Promo Pages</div>
                <p className="mb-5 text-sm text-white/65">
                  Deeper promo windows and limited-time offer pages.
                </p>
                <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900">
                  Crawl Promos
                </button>
              </GlassCard>
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-6 xl:grid-cols-2">
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Cards</h2>
              <span className="text-sm text-white/50">Supabase</span>
            </div>
            <SimpleTable
              headers={["Card", "Bank", "Type", "Annual Fee"]}
              rows={collections.cashbackCards.map((card) => [
                card.card_name ?? "--",
                card.bank ?? "--",
                card.card_type ?? "--",
                card.annual_fee ?? "--"
              ])}
              emptyText="No cashback cards available."
            />
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Signup Offers</h2>
              <span className="text-sm text-white/50">Supabase</span>
            </div>
            <SimpleTable
              headers={["Card", "Bank", "Reward", "Spend Rule"]}
              rows={collections.signupOffers.map((offer) => [
                offer.card_name ?? "--",
                offer.bank ?? "--",
                offer.reward_description ?? offer.reward_value ?? "--",
                offer.minimum_spend_to_unlock
                  ? `S$${offer.minimum_spend_to_unlock} in ${offer.spend_within_days ?? "--"} days`
                  : "--"
              ])}
              emptyText="No signup offers available."
            />
          </GlassCard>
        </section>
      </div>
    </main>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-white/60">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-white/55">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">TypeScript</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Next.js</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Supabase</span>
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">{children}</div>;
}

function Badge({ text, live = false }: { text: string; live?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
      {live && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
      {text}
    </span>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-cyan-400 text-slate-900" : "border border-white/10 bg-white/5 text-white/75"
      }`}
    >
      {label}
    </button>
  );
}

function SimpleTable({
  headers,
  rows,
  emptyText
}: {
  headers: string[];
  rows: string[][];
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 text-sm font-medium text-white/55">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="bg-white/5">
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="rounded-xl px-3 py-3 text-sm text-white/85">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-3 py-6 text-sm text-white/45">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}