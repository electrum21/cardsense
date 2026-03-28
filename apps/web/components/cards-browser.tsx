"use client";

import { useMemo, useState } from "react";
import type { CashbackCard } from "@/lib/data";

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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Bank</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            >
              <option value="all">All banks</option>
              {banks.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Card Type</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            >
              <option value="all">All types</option>
              {cardTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Annual Fee</label>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value as FeeFilter)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            >
              <option value="all">All</option>
              <option value="waived">Waived / Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/55">
            Showing <span className="font-semibold text-white">{filteredCards.length}</span> cards
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/60">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 outline-none"
            >
              <option value="highest_cashback">Highest cashback</option>
              <option value="name">Card name</option>
              <option value="bank">Bank</option>
            </select>
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
                value={
                  card.income_requirement
                    ? `S$${card.income_requirement.toLocaleString()}`
                    : "--"
                }
              />
              <InfoItem
                label="Minimum Monthly Spend"
                value={
                  card.minimum_monthly_spend
                    ? `S$${card.minimum_monthly_spend.toLocaleString()}`
                    : "--"
                }
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-2 text-sm text-white/85">{value}</div>
    </div>
  );
}