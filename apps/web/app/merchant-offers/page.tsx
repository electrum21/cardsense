import { getAllMerchantOffers } from "@/lib/data";

export default async function MerchantOffersPage() {
  const offers = await getAllMerchantOffers();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Merchant Offers</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Compare merchant cashback offers across categories and sort through the
          highest-value opportunities in the database.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{offer.merchant ?? "--"}</h2>
                <div className="mt-1 text-sm text-white/60">{offer.category ?? "--"}</div>
              </div>

              <div className="rounded-2xl bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200">
                {offer.cashback_rate ?? "--"}
              </div>
            </div>

            <div className="grid gap-4">
              <InfoItem label="Category" value={offer.category ?? "--"} />
              <InfoItem
                label="Numeric Rate"
                value={
                  offer.cashback_rate_number !== null && offer.cashback_rate_number !== undefined
                    ? `${offer.cashback_rate_number}%`
                    : "--"
                }
              />
              <InfoItem label="Source" value={offer.source ?? "--"} />
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-white/50">
            No merchant offers available.
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