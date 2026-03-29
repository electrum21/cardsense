import json
import requests
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

SUPABASE_URL = "SUPABASE_URL"
SUPABASE_KEY = "SUPABASE_SERVICE_ROLE_KEY"
INPUT_FILE = "tinyfish_async_results_20260328_124339.json"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

TABLE_CASHBACK_CARDS = "cashback_cards"
TABLE_SIGNUP_OFFERS = "signup_offers"
TABLE_MERCHANT_OFFERS = "merchant_offers"
TABLE_RESTAURANT_OFFERS = "restaurant_offers"
TABLE_CARD_PROMOTIONS = "card_promotions"
TABLE_INGESTION_RUNS = "ingestion_runs"


def post_batch(table_name: str, rows: List[Dict[str, Any]], batch_size: int = 100) -> None:
    if not rows:
        print(f"ℹ️ No rows to insert into {table_name}")
        return

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table_name}",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json=batch,
            timeout=60,
        )
        if res.status_code not in (200, 201):
            print(f"❌ Error inserting into {table_name}, batch {i // batch_size + 1}: {res.text}")
        else:
            print(f"✅ Inserted batch {i // batch_size + 1} into {table_name}")


def fetch_all_cards() -> List[Dict[str, Any]]:
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE_CASHBACK_CARDS}?select=id,bank,card_name",
        headers=HEADERS,
        timeout=60,
    )
    if res.status_code != 200:
        print("❌ Failed to fetch cashback_cards lookup:", res.text)
        return []
    return res.json()


def safe_json_loads(raw: str) -> List[Dict[str, Any]]:
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def extract_offers(run: Dict[str, Any]) -> List[Dict[str, Any]]:
    final = run.get("final_run_data", {})
    result = final.get("result", {})

    if isinstance(result, dict):
        if isinstance(result.get("result"), list):
            return result["result"]
        if isinstance(result.get("cards"), list):
            return result["cards"]
        if isinstance(result.get("result"), str):
            return safe_json_loads(result["result"])

    return []


def parse_date(value: Optional[str]) -> Optional[str]:
    if not value or not isinstance(value, str):
        return None

    value = value.strip()
    if not value:
        return None

    for fmt in ("%Y-%m-%d",):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def to_numeric(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace(",", "").replace("%", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def to_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None


def normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return (
        value.lower()
        .replace("®", "")
        .replace("™", "")
        .replace("credit card", "")
        .replace("card", "")
        .replace("  ", " ")
        .strip()
    )


def make_card_key(bank: Optional[str], card_name: Optional[str]) -> str:
    return f"{normalize_text(bank)}::{normalize_text(card_name)}"


def build_card_lookup(cards: List[Dict[str, Any]]) -> Dict[str, str]:
    lookup: Dict[str, str] = {}
    for card in cards:
        key = make_card_key(card.get("bank"), card.get("card_name"))
        if key and card.get("id"):
            lookup[key] = card["id"]
    return lookup


def normalize_cashback_card(run: Dict[str, Any], offer: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "bank": offer.get("bank"),
        "card_name": offer.get("cardName"),
        "card_type": offer.get("cardType"),
        "cashback_rates": offer.get("cashbackRates"),
        "minimum_monthly_spend": to_numeric(offer.get("minimumMonthlySpend")),
        "monthly_cap_sgd": to_numeric(offer.get("monthlyCapSGD")),
        "payout_cycle": offer.get("payoutCycle"),
        "annual_fee": offer.get("annualFee"),
        "income_requirement": to_numeric(offer.get("incomeRequirement")),
        "special_conditions": offer.get("specialConditions"),
        "signup_bonus": offer.get("signupBonus"),
        "raw_payload": offer,
    }


def normalize_signup_offer(run: Dict[str, Any], offer: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "bank": offer.get("bank"),
        "card_name": offer.get("cardName"),
        "card_type": offer.get("cardType"),
        "reward_value": offer.get("rewardValue"),
        "reward_description": offer.get("rewardDescription"),
        "minimum_spend_to_unlock": to_numeric(offer.get("minimumSpendToUnlock")),
        "spend_within_days": to_int(offer.get("spendWithinDays")),
        "promo_expiry_date": parse_date(offer.get("promoExpiryDate")),
        "annual_fee": offer.get("annualFee"),
        "is_exclusive_deal": offer.get("isExclusive"),
        "exclusive_promo_code": offer.get("promoCode"),
        "apply_url": run.get("url"),
        "raw_payload": offer,
    }


def normalize_card_promotion(run: Dict[str, Any], offer: Dict[str, Any], card_lookup: Dict[str, str]) -> Dict[str, Any]:
    key = make_card_key(offer.get("bank"), offer.get("cardName"))
    card_id = card_lookup.get(key)

    reward_type = offer.get("rewardType")
    promo_type = reward_type if isinstance(reward_type, str) else "Aggregator"

    return {
        "card_id": card_id,
        "source": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "bank": offer.get("bank"),
        "card_name": offer.get("cardName"),
        "card_type": offer.get("cardType"),
        "promo_type": promo_type,
        "reward_value": offer.get("rewardValue"),
        "reward_description": offer.get("rewardDescription"),
        "minimum_spend_to_unlock": to_numeric(offer.get("minimumSpendToUnlock")),
        "spend_within_days": to_int(offer.get("spendWithinDays")),
        "promo_expiry_date": parse_date(offer.get("promoExpiryDate")),
        "annual_fee": offer.get("annualFee"),
        "is_exclusive_deal": offer.get("isExclusiveDeal"),
        "exclusive_promo_code": offer.get("exclusivePromoCode"),
        "extra_gift": offer.get("extraGift"),
        "estimated_total_value": offer.get("estimatedTotalValue"),
        "source_section": offer.get("sourceSection"),
        "raw_payload": offer,
    }


def normalize_merchant_offer(run: Dict[str, Any], offer: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "category": offer.get("category"),
        "merchant": offer.get("merchant"),
        "cashback_rate": offer.get("cashbackRate"),
        "cashback_rate_number": to_numeric(offer.get("cashbackRateNumber")),
        "raw_payload": offer,
    }


def normalize_restaurant_offer(run: Dict[str, Any], offer: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "restaurant_name": offer.get("name"),
        "location": offer.get("location"),
        "cuisine": offer.get("cuisine"),
        "discount": offer.get("discount"),
        "discount_percent": to_numeric(offer.get("discountPercent")),
        "valid_times": offer.get("validTimes"),
        "valid_days": offer.get("validDays"),
        "eligible_cards": offer.get("eligibleCards"),
        "expiry_date": parse_date(offer.get("expiryDate")),
        "price_per_pax": to_numeric(offer.get("pricePerPax")),
        "booking_required": offer.get("bookingRequired"),
        "available_slots": to_int(offer.get("availableSlots")),
        "raw_payload": offer,
    }


def normalize_ingestion_run(run: Dict[str, Any], imported_count: int) -> Dict[str, Any]:
    final = run.get("final_run_data", {})
    return {
        "source_name": run.get("category_name"),
        "source_url": run.get("url"),
        "tinyfish_run_id": run.get("run_id"),
        "tinyfish_status": final.get("status"),
        "records_imported": imported_count,
        "payload": run,
    }


def main() -> None:
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Step 1: insert canonical cards first
    cashback_rows: List[Dict[str, Any]] = []
    signup_rows: List[Dict[str, Any]] = []
    merchant_rows: List[Dict[str, Any]] = []
    restaurant_rows: List[Dict[str, Any]] = []
    ingestion_rows: List[Dict[str, Any]] = []

    completed_runs = [r for r in data.get("results", []) if r.get("final_run_data", {}).get("status") == "COMPLETED"]

    for run in completed_runs:
        offers = extract_offers(run)
        imported_count = 0
        category_name = (run.get("category_name") or "").upper()

        for offer in offers:
            if category_name == "BANK_CASHBACK":
                cashback_rows.append(normalize_cashback_card(run, offer))
                imported_count += 1
            elif category_name == "BANK_SIGNUP":
                signup_rows.append(normalize_signup_offer(run, offer))
                imported_count += 1
            elif category_name == "SHOPBACK":
                merchant_rows.append(normalize_merchant_offer(run, offer))
                imported_count += 1
            elif category_name == "EATIGO":
                restaurant_rows.append(normalize_restaurant_offer(run, offer))
                imported_count += 1

        ingestion_rows.append(normalize_ingestion_run(run, imported_count))

    print(f"Prepared {len(cashback_rows)} cashback_cards rows")
    print(f"Prepared {len(signup_rows)} signup_offers rows")
    print(f"Prepared {len(merchant_rows)} merchant_offers rows")
    print(f"Prepared {len(restaurant_rows)} restaurant_offers rows")
    print(f"Prepared {len(ingestion_rows)} ingestion_runs rows")

    post_batch(TABLE_CASHBACK_CARDS, cashback_rows)
    post_batch(TABLE_SIGNUP_OFFERS, signup_rows)
    post_batch(TABLE_MERCHANT_OFFERS, merchant_rows)
    post_batch(TABLE_RESTAURANT_OFFERS, restaurant_rows)
    post_batch(TABLE_INGESTION_RUNS, ingestion_rows)

    # Step 2: build canonical lookup, then insert aggregator promotions
    existing_cards = fetch_all_cards()
    card_lookup = build_card_lookup(existing_cards)

    promotion_rows: List[Dict[str, Any]] = []

    for run in completed_runs:
        category_name = (run.get("category_name") or "").upper()
        if category_name != "MONEYSMART":
            continue

        offers = extract_offers(run)
        for offer in offers:
            promotion_rows.append(normalize_card_promotion(run, offer, card_lookup))

    print(f"Prepared {len(promotion_rows)} card_promotions rows")
    post_batch(TABLE_CARD_PROMOTIONS, promotion_rows)

    print("🎉 Done!")


if __name__ == "__main__":
    main()