import Link from "next/link";
import {
  getSummary,
  getSupabaseCollections,
  type CashbackCard,
  type MerchantOffer,
  type SignupOffer
} from "@/lib/data";

function formatSpotlight(item: Record<string, unknown> | null): string {
  if (!item) return "No live highlight available yet.";
  return `${String(item.card_name ?? item.merchant ?? "Offer")}${
    item.bank ? ` from ${String(item.bank)}` : ""
  }`;
}

function PreviewCard({
  title,
  description,
  href,
  children
}: {
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>

      <div className="mb-5">{children}</div>

      <Link
        href={href}
        className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
      >
        Find out more
      </Link>
    </div>
  );
}

function MiniCardTable({ cards }: { cards: CashbackCard[] }) {
  return (
    <div className="space-y-3">
      {cards.length > 0 ? (
        cards.slice(0, 3).map((card) => (
          <div key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">{card.card_name ?? "--"}</div>
            <div className="text-sm text-white/60">
              {card.bank ?? "--"} · {card.card_type ?? "--"}
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-white/50">No card previews available.</div>
      )}
    </div>
  );
}

function MiniSignupTable({ offers }: { offers: SignupOffer[] }) {
  return (
    <div className="space-y-3">
      {offers.length > 0 ? (
        offers.slice(0, 3).map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">{offer.card_name ?? "--"}</div>
            <div className="text-sm text-white/60">{offer.bank ?? "--"}</div>
            <div className="mt-2 text-sm text-white/80">
              {offer.reward_value ?? offer.reward_description ?? "--"}
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-white/50">No signup offer previews available.</div>
      )}
    </div>
  );
}

function MiniMerchantTable({ offers }: { offers: MerchantOffer[] }) {
  return (
    <div className="space-y-3">
      {offers.length > 0 ? (
        offers.slice(0, 3).map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">{offer.merchant ?? "--"}</div>
            <div className="text-sm text-white/60">{offer.category ?? "--"}</div>
            <div className="mt-2 text-sm text-cyan-300">{offer.cashback_rate ?? "--"}</div>
          </div>
        ))
      ) : (
        <div className="text-sm text-white/50">No merchant offer previews available.</div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [summary, collections] = await Promise.all([
    getSummary(),
    getSupabaseCollections()
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            CardSense
          </div>

          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white md:text-6xl">
            Singapore card intelligence, turned into a product.
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-white/65">
            Explore cashback cards, signup campaigns, and merchant offers in one place,
            then use CardSense to compare options and make better decisions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cards"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-900"
            >
              Explore Cards
            </Link>
            <Link
              href="/advisor"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white/85 hover:bg-white/10"
            >
              Try AI Advisor
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-white/45">Cashback Cards</div>
              <div className="mt-2 text-3xl font-bold">{summary.overview.cashback_card_count}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-white/45">Signup Offers</div>
              <div className="mt-2 text-3xl font-bold">{summary.overview.signup_offer_count}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-white/45">Merchant Cashback High</div>
              <div className="mt-2 text-3xl font-bold">
                {summary.overview.max_merchant_cashback_rate
                  ? `${summary.overview.max_merchant_cashback_rate}%`
                  : "--"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-white/45">Exclusive Offers</div>
              <div className="mt-2 text-3xl font-bold">
                {summary.overview.exclusive_signup_offer_count}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
            Top Cashback Card
          </div>
          <h2 className="text-2xl font-semibold">{formatSpotlight(summary.spotlight.topCashbackCard)}</h2>
          <p className="mt-3 text-sm text-white/60">
            Browse cards by bank, card type, annual fee, income requirement, and reward profile.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
            Top Signup Promo
          </div>
          <h2 className="text-2xl font-semibold">{formatSpotlight(summary.spotlight.topSignupOffer)}</h2>
          <p className="mt-3 text-sm text-white/60">
            Track reward values, minimum spend rules, exclusivity, and promotional details.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
            Merchant Boost
          </div>
          <h2 className="text-2xl font-semibold">{formatSpotlight(summary.spotlight.topMerchantOffer)}</h2>
          <p className="mt-3 text-sm text-white/60">
            Compare live merchant cashback opportunities and identify strong stacking ideas.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <h2 className="text-3xl font-bold">Explore the platform</h2>
          <p className="mt-2 text-white/60">
            Preview the data here, then jump into the full page for all records and details.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PreviewCard
            title="Cards"
            description="Browse all cards in the database with filters and sorting."
            href="/cards"
          >
            <MiniCardTable cards={collections.cashbackCards} />
          </PreviewCard>

          <PreviewCard
            title="Signup Offers"
            description="See current signup campaigns and compare reward mechanics."
            href="/signup-offers"
          >
            <MiniSignupTable offers={collections.signupOffers} />
          </PreviewCard>

          <PreviewCard
            title="Merchant Offers"
            description="View merchant cashback opportunities and category trends."
            href="/merchant-offers"
          >
            <MiniMerchantTable offers={collections.merchantOffers} />
          </PreviewCard>
        </div>
      </section>
    </main>
  );
}