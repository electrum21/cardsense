"use client";

import { useMemo, useState } from "react";
import type { SignupOffer } from "@/lib/data";

type Props = {
  offers: SignupOffer[];
};

type ExclusiveFilter = "all" | "exclusive" | "non_exclusive";
type SignupSortKey = "bank" | "card_name" | "reward_value" | "expiry";

function parseRewardValue(value: string | null): number {
  if (!value) return 0;

  const cleaned = value.replace(/,/g, "");
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;

  return Number(match[1]);
}

function parseDateValue(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function SignupOffersBrowser({ offers }: Props) {
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("all");
  const [rewardType, setRewardType] = useState("all");
  const [exclusiveFilter, setExclusiveFilter] = useState<ExclusiveFilter>("all");
  const [sortBy, setSortBy] = useState<SignupSortKey>("expiry");

  const banks = useMemo(() => {
    return Array.from(new Set(offers.map((offer) => offer.bank).filter(Boolean) as string[])).sort();
  }, [offers]);

  const rewardTypes = useMemo(() => {
    return Array.from(
      new Set(
        offers
          .map((offer) => {
            const raw = offer.raw_payload as Record<string, unknown> | undefined;
            return typeof raw?.rewardType === "string" ? raw.rewardType : null;
          })
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = offers.filter((offer) => {
      const raw = offer.raw_payload as Record<string, unknown> | undefined;
      const rawRewardType = typeof raw?.rewardType === "string" ? raw.rewardType : null;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        (offer.card_name ?? "").toLowerCase().includes(normalizedSearch) ||
        (offer.bank ?? "").toLowerCase().includes(normalizedSearch) ||
        (offer.reward_description ?? "").toLowerCase().includes(normalizedSearch) ||
        (offer.reward_value ?? "").toLowerCase().includes(normalizedSearch);

      const matchesBank = bank === "all" || offer.bank === bank;
      const matchesRewardType = rewardType === "all" || rawRewardType === rewardType;

      const matchesExclusive =
        exclusiveFilter === "all" ||
        (exclusiveFilter === "exclusive" && offer.is_exclusive_deal === true) ||
        (exclusiveFilter === "non_exclusive" && offer.is_exclusive_deal !== true);

      return matchesSearch && matchesBank && matchesRewardType && matchesExclusive;
    });

    result.sort((a, b) => {
      if (sortBy === "bank") {
        return (a.bank ?? "").localeCompare(b.bank ?? "");
      }

      if (sortBy === "card_name") {
        return (a.card_name ?? "").localeCompare(b.card_name ?? "");
      }

      if (sortBy === "reward_value") {
        return parseRewardValue(b.reward_value) - parseRewardValue(a.reward_value);
      }

      return parseDateValue(a.promo_expiry_date) - parseDateValue(b.promo_expiry_date);
    });

    return result;
  }, [bank, exclusiveFilter, offers, rewardType, search, sortBy]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <label className="mb-2 block text-sm text-white/60">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search card, bank, reward..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
            />
          </div>

          <SelectField
            label="Bank"
            value={bank}
            onChange={setBank}
            options={[
              { value: "all", label: "All banks" },
              ...banks.map((value) => ({ value, label: value }))
            ]}
          />

          <SelectField
            label="Reward Type"
            value={rewardType}
            onChange={setRewardType}
            options={[
              { value: "all", label: "All reward types" },
              ...rewardTypes.map((value) => ({ value, label: value }))
            ]}
          />

          <SelectField
            label="Exclusivity"
            value={exclusiveFilter}
            onChange={(value) => setExclusiveFilter(value as ExclusiveFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "exclusive", label: "Exclusive only" },
              { value: "non_exclusive", label: "Non-exclusive only" }
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/55">
            Showing <span className="font-semibold text-white">{filteredOffers.length}</span> offers
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/60">Sort by</label>
            <div className="w-56">
              <SelectField
                label=""
                hideLabel
                value={sortBy}
                onChange={(value) => setSortBy(value as SignupSortKey)}
                options={[
                  { value: "expiry", label: "Nearest expiry" },
                  { value: "reward_value", label: "Highest reward" },
                  { value: "bank", label: "Bank" },
                  { value: "card_name", label: "Card name" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {filteredOffers.map((offer) => (
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
              <InfoItem label="Promo Expiry" value={offer.promo_expiry_date ?? "--"} />
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-white/70">Reward Description</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {offer.reward_description ?? "--"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoItem label="Annual Fee" value={offer.annual_fee ?? "--"} />
              <InfoItem label="Promo Code" value={offer.exclusive_promo_code ?? "--"} />
            </div>
          </div>
        ))}

        {filteredOffers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-white/50">
            No signup offers matched your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hideLabel = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hideLabel?: boolean;
}) {
  return (
    <div className="xl:col-span-2">
      {!hideLabel && <label className="mb-2 block text-sm text-white/60">{label}</label>}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-[160px] appearance-none rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 pr-10 text-white outline-none focus:border-cyan-400"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-white">
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/50">
          ▼
        </div>
      </div>
    </div>
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