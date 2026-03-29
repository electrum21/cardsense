import { env } from "./env";
import { createSupabaseServerClient } from "./supabase";

export type SummaryPayload = {
  overview: {
    cashback_card_count: number;
    signup_offer_count: number;
    merchant_offer_count: number;
    restaurant_deal_count: number;
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
  source: string | null;
  source_url: string | null;
  tinyfish_run_id: string | null;
  bank: string | null;
  card_name: string | null;
  card_type: string | null;
  cashback_rates: Record<string, number> | null;
  minimum_monthly_spend: number | null;
  monthly_cap_sgd: number | null;
  payout_cycle: string | null;
  annual_fee: string | null;
  income_requirement: number | null;
  special_conditions: string | null;
  signup_bonus: string | null;
  raw_payload?: unknown;
};

export type SignupOffer = {
  id: string;
  source: string | null;
  source_url: string | null;
  tinyfish_run_id: string | null;
  bank: string | null;
  card_name: string | null;
  card_type: string | null;
  reward_value: string | null;
  reward_description: string | null;
  minimum_spend_to_unlock: number | null;
  spend_within_days: number | null;
  promo_expiry_date: string | null;
  annual_fee: string | null;
  is_exclusive_deal: boolean | null;
  exclusive_promo_code: string | null;
  apply_url: string | null;
  raw_payload?: unknown;
};

export type MerchantOffer = {
  id: string;
  source: string | null;
  source_url: string | null;
  tinyfish_run_id: string | null;
  category: string | null;
  merchant: string | null;
  cashback_rate: string | null;
  cashback_rate_number: number | null;
  raw_payload?: unknown;
};

export type CardPromotion = {
  id: string;
  card_id: string | null;
  source: string | null;
  source_url: string | null;
  tinyfish_run_id: string | null;
  bank: string | null;
  card_name: string | null;
  card_type: string | null;
  promo_type: string | null;
  reward_value: string | null;
  reward_description: string | null;
  minimum_spend_to_unlock: number | null;
  spend_within_days: number | null;
  promo_expiry_date: string | null;
  annual_fee: string | null;
  is_exclusive_deal: boolean | null;
  exclusive_promo_code: string | null;
  extra_gift: string | null;
  estimated_total_value: string | null;
  source_section: string | null;
  raw_payload?: unknown;
};

export async function getPromotionsForCard(cardId: string): Promise<CardPromotion[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("card_promotions")
    .select("*")
    .eq("card_id", cardId)
    .order("promo_expiry_date", { ascending: true });

  if (error) {
    console.error("getPromotionsForCard error:", error);
    return [];
  }

  return (data ?? []) as CardPromotion[];
}

export type CollectionsPayload = {
  cashbackCards: CashbackCard[];
  signupOffers: SignupOffer[];
  merchantOffers: MerchantOffer[];
};

function emptySummary(): SummaryPayload {
  return {
    overview: {
      cashback_card_count: 0,
      signup_offer_count: 0,
      merchant_offer_count: 0,
      restaurant_deal_count: 0,
      exclusive_signup_offer_count: 0,
      max_merchant_cashback_rate: null,
      bank_count: 0
    },
    spotlight: {
      topMerchantOffer: null,
      topSignupOffer: null,
      topCashbackCard: null
    }
  };
}

export async function getSummary(): Promise<SummaryPayload> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/summary`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch API summary: ${response.status}`);
    }

    return (await response.json()) as SummaryPayload;
  } catch (error) {
    console.error("getSummary error:", error);
    return emptySummary();
  }
}

export async function getAllCards(): Promise<CashbackCard[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("cashback_cards")
    .select("*")
    .order("bank", { ascending: true });

  if (error) {
    console.error("getAllCards error:", error);
    return [];
  }

  return (data ?? []) as CashbackCard[];
}

export async function getAllSignupOffers(): Promise<SignupOffer[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("signup_offers")
    .select("*")
    .order("bank", { ascending: true });

  if (error) {
    console.error("getAllSignupOffers error:", error);
    return [];
  }

  return (data ?? []) as SignupOffer[];
}

export async function getAllMerchantOffers(): Promise<MerchantOffer[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("merchant_offers")
    .select("*")
    .order("cashback_rate_number", { ascending: false });

  if (error) {
    console.error("getAllMerchantOffers error:", error);
    return [];
  }

  return (data ?? []) as MerchantOffer[];
}

export async function getSupabaseCollections(): Promise<CollectionsPayload> {
  const [cashbackCards, signupOffers, merchantOffers] = await Promise.all([
    getAllCards(),
    getAllSignupOffers(),
    getAllMerchantOffers()
  ]);

  return {
    cashbackCards: cashbackCards.slice(0, 8),
    signupOffers: signupOffers.slice(0, 8),
    merchantOffers: merchantOffers.slice(0, 8)
  };
}