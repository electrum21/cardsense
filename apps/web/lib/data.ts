import { env } from "./env";
import { createSupabaseServerClient } from "./supabase";

type SummaryPayload = {
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

type CashbackCard = {
  id: string;
  card_name: string | null;
  bank: string | null;
  card_type: string | null;
  annual_fee: string | null;
};

type SignupOffer = {
  id: string;
  card_name: string | null;
  bank: string | null;
  reward_description: string | null;
  reward_value: string | null;
  minimum_spend_to_unlock: number | null;
  spend_within_days: number | null;
};

type MerchantOffer = {
  id: string;
  merchant: string | null;
  cashback_rate: string | null;
  cashback_rate_number: number | null;
  category: string | null;
};

type CollectionsPayload = {
  cashbackCards: CashbackCard[];
  signupOffers: SignupOffer[];
  merchantOffers: MerchantOffer[];
};

export async function getSummary() {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/summary`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch API summary");
    }

    return (await response.json()) as SummaryPayload;
  } catch {
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
    } satisfies SummaryPayload;
  }
}

export async function getSupabaseCollections(): Promise<CollectionsPayload> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      cashbackCards: [],
      signupOffers: [],
      merchantOffers: []
    };
  }

  const [
    { data: cashbackCards, error: cashbackError },
    { data: signupOffers, error: signupError },
    { data: merchantOffers, error: merchantError }
  ] = await Promise.all([
    supabase.from("cashback_cards").select("*").limit(8),
    supabase.from("signup_offers").select("*").limit(8),
    supabase.from("merchant_offers").select("*").order("cashback_rate_number", { ascending: false }).limit(8)
  ]);

  console.error("cashback_cards error:", cashbackError);
  console.error("signup_offers error:", signupError);
  console.error("merchant_offers error:", merchantError);

  return {
    cashbackCards: (cashbackCards ?? []) as CashbackCard[],
    signupOffers: (signupOffers ?? []) as SignupOffer[],
    merchantOffers: (merchantOffers ?? []) as MerchantOffer[]
  };
}