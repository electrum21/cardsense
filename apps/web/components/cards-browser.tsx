"use client";

import { useMemo, useState } from "react";
import type { CashbackCard } from "@/lib/data";
import Link from "next/link";

type Props = {
  cards: CashbackCard[];
};

type FeeFilter = "all" | "waived" | "paid";
type SortKey = "name" | "bank" | "highest_cashback";

function getHighestCashbackRate(card: CashbackCard): number {
  const rates = card.cashback_rates;

  if (!rates || typeof rates !== "object") {
    return 0;
  }

  const values = Object.values(rates)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values);
}

function matchesFeeFilter(annualFee: string | null, filter: FeeFilter): boolean {
  if (filter === "all") return true;

  const normalized = (annualFee ?? "").toLowerCase();
  const waived = normalized.includes("waived") || normalized.includes("free");

  if (filter === "waived") return waived;
  return !waived;
}

function cashbackSummary(card: CashbackCard): string {
  const rates = card.cashback_rates;

  if (!rates || typeof rates !== "object") {
    return "--";
  }

  const entries = Object.entries(rates);
  if (entries.length === 0) {
    return "--";
  }

  return entries
    .slice(0, 4)
    .map(([category, value]) => `${category}: ${value}%`)
    .join(" · ");
}

export function CardsBrowser({ cards }: Props) {
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("all");
  const [cardType, setCardType] = useState("all");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("highest_cashback");

  const banks = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.bank).filter(Boolean) as string[])).sort();
  }, [cards]);

  const cardTypes = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.card_type).filter(Boolean) as string[])).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = cards.filter((card) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (card.card_name ?? "").toLowerCase().includes(normalizedSearch) ||
        (card.bank ?? "").toLowerCase().includes(normalizedSearch) ||
        (card.card_type ?? "").toLowerCase().includes(normalizedSearch);

      const matchesBank = bank === "all" || card.bank === bank;
      const matchesType = cardType === "all" || card.card_type === cardType;
      const matchesFee = matchesFeeFilter(card.annual_fee, feeFilter);

      return matchesSearch && matchesBank && matchesType && matchesFee;
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.card_name ?? "").localeCompare(b.card_name ?? "");
      }

      if (sortBy === "bank") {
        return (a.bank ?? "").localeCompare(b.bank ?? "");
      }

      return getHighestCashbackRate(b) - getHighestCashbackRate(a);
    });

    return result;
  }, [bank, cardType, cards, feeFilter, search, sortBy]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm text-white/60">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search card, bank, type..."
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
            label="Card Type"
            value={cardType}
            onChange={setCardType}
            options={[
              { value: "all", label: "All types" },
              ...cardTypes.map((value) => ({ value, label: value }))
            ]}
          />

          <SelectField
            label="Annual Fee"
            value={feeFilter}
            onChange={(value) => setFeeFilter(value as FeeFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "waived", label: "Waived / Free" },
              { value: "paid", label: "Paid" }
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/55">
            Showing <span className="font-semibold text-white">{filteredCards.length}</span> cards
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/60">Sort by</label>
            <div className="w-52">
              <SelectField
                label=""
                hideLabel
                value={sortBy}
                onChange={(value) => setSortBy(value as SortKey)}
                options={[
                  { value: "highest_cashback", label: "Highest cashback" },
                  { value: "name", label: "Card name" },
                  { value: "bank", label: "Bank" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {filteredCards.map((card) => (
          <div key={card.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{card.card_name ?? "--"}</h2>
                <div className="mt-1 text-sm text-white/60">
                  {card.bank ?? "--"} · {card.card_type ?? "--"}
                </div>
              </div>

              <div className="rounded-2xl bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200">
                Up to {getHighestCashbackRate(card)}%
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-white/70">Cashback Rewards</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {cashbackSummary(card)}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-white/70">Special Conditions</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                {card.special_conditions ?? "--"}
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={`/cards/${card.id}`}
                className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                View full details
              </Link>
            </div>

          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-white/50">
            No cards matched your filters.
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
    <div>
      {!hideLabel && <label className="mb-2 block text-sm text-white/60">{label}</label>}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 pr-10 text-white outline-none focus:border-cyan-400"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900 text-white"
            >
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