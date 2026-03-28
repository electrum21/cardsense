import { getAllSignupOffers } from "@/lib/data";

export default async function SignupOffersPage() {
  const offers = await getAllSignupOffers();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Signup Offers</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Explore signup campaigns across banks, including reward values, minimum spend
          requirements, exclusivity, and promo details.
        </p>
      </div>

      <div className="grid gap-5">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{offer.card_name ?? "--"}</h2>
                <div className="mt-1 text-sm text-white/60">
                  {offer.bank ?? "--"} · {offer.card_type ?? "--"}
                </div>
              </div>

              {offer.is_exclusive_deal ? (
                <div className="rounded-2xl bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200">
                  Exclusive
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="Reward Value" value={offer.reward_value ?? "--"} />
              <InfoItem
                label="Minimum Spend"
                value={
                  offer.minimum_spend_to_unlock
                    ? `S$${offer.minimum_spend_to_unlock.toLocaleString()}`
                    : "--"
                }
              />
              <InfoItem
                label="Spend Window"
                value={offer.spend_within_days ? `${offer.spend_within_days} days` : "--"}
              />
              <InfoItem label="Annual Fee" value={offer.annual_fee ?? "--"} />
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-white/70">Reward Description</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {offer.reward_description ?? "--"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoItem label="Promo Expiry" value={offer.promo_expiry_date ?? "--"} />
              <InfoItem label="Promo Code" value={offer.exclusive_promo_code ?? "--"} />
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-white/50">
            No signup offers available.
          </div>
        )}
      </div>
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