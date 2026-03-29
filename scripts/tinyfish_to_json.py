import json
import time
import random
import requests
from datetime import datetime

# ==========================================
# 1. CONFIGURATION
# ==========================================
API_KEY = "TINYFISH_API_KEY"  # replace with your real TinyFish API key
BASE_URL = "https://agent.tinyfish.ai/v1"

POLL_INTERVAL_SECONDS = 5
MAX_POLLS = 120  # 10 minutes max per run

# Slow down submissions to reduce 429s
SUBMISSION_DELAY_SECONDS = 2

# Retry config for 429 / transient failures
MAX_SUBMISSION_RETRIES = 6
MAX_STATUS_RETRIES = 5

if not API_KEY or API_KEY in {"YOUR_TINYFISH_API_KEY", "API_KEY"}:
    raise ValueError("Replace API_KEY with your real TinyFish API key.")

HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# ==========================================
# 2. DEFINE ALL RUN CATEGORIES
# ==========================================
categories = [
    {
        "category_name": "BANK_CASHBACK",
        "goal": """
You are scraping a Singapore bank's credit card listing or product page.

Context:
- Region: Singapore
- Goal: Extract credit card features and cashback/rewards structure

Steps:
1. Wait for full page load.
2. Close any cookie or popup.
3. Scroll to reveal all cards.
4. Extract ALL cards shown.

For each card, return:
- cardName (string)
- bank (string)
- cardType (string): "Cashback", "Miles", "Rewards", "Petrol", "Shopping"
- cashbackRates (object): category -> percentage
- minimumMonthlySpend (number)
- monthlyCapSGD (number)
- payoutCycle (string): "Monthly", "Quarterly", "Annual"
- annualFee (string)
- incomeRequirement (number)
- specialConditions (string)
- signupBonus (string)

Rules:
- Include ALL cards
- Use highest cashback tier if multiple exist
- If a field is missing, use null
- cashbackRates keys must be lowercase
- Return raw JSON array only
""".strip(),
        "urls": [
            # "https://www.americanexpress.com/en-sg/credit-cards/",
            # "https://trustbank.sg/credit-card/",
            # "https://www.uob.com.sg/personal/cards/index.page",
            # "https://www.hsbc.com.sg/credit-cards/",
            # "https://www.cimb.com.sg/en/personal/banking-with-us/cards/credit-cards.html",
            # "https://www.ocbc.com/personal-banking/cards/credit-card.page",
            # "https://www.ocbc.com/personal-banking/cards/credit-card",
            # "https://www.gxs.com.sg/flexicard",
            # "https://www.posb.com.sg/personal/cards",
            # "https://www.maybank2u.com.sg/en/personal/cards/credit/index.page",
            "https://www1.citibank.com.sg/credit-cards",
            "https://www.sc.com/sg/credit-cards/?intcid=web_listing-sc_com_quick_tools-homepg1-staticmedia_others-sng-homepage_new-cc-acquisition-sc_com_organic-sg-en",
            "https://www.maribank.sg/product/mari-credit-card",
        ],
    },
#     {
#         "category_name": "BANK_SIGNUP",
#         "goal": """
# You are scraping a Singapore bank promotions or campaign page.

# Context:
# - Region: Singapore
# - Goal: Extract signup bonuses and welcome offers

# Steps:
# 1. Wait for full page load.
# 2. Close popups.
# 3. Scroll to load all promotions.
# 4. Extract ALL active offers.

# For each offer:
# - cardName (string)
# - bank (string)
# - cardType (string): "Cashback", "Miles", "Shopping", "Dining", "Travel"
# - rewardType (string): "Cash", "Miles", "Points", "Gift", "Voucher"
# - rewardValue (string)
# - rewardDescription (string)
# - minimumSpendToUnlock (number)
# - spendWithinDays (number)
# - promoExpiryDate (string)
# - annualFee (string)
# - isExclusive (boolean)
# - promoCode (string)

# Rules:
# - Only include active promos
# - Use highest reward tier
# - If a field is missing, use null
# - Return raw JSON array only
# """.strip(),
#         "urls": [
#             "https://www.citibank.com.sg/credit-cards/promotions/always-ahead/index.html",
#             "https://www.uob.com.sg/personal/promotions/cards/sign-up-offers/index.page",
#             "https://www.hsbc.com.sg/promotions/credit-cards/",
#             "https://cardpromotions.hsbc.com.sg/",
#             "https://www.sc.com/sg/promotions/",
#             "https://www.ocbc.com/personal-banking/cards/featured-campaign",
#             "https://www.maribank.sg/promo",
#         ],
#     },
#     {
#         "category_name": "EATIGO",
#         "goal": """
# You are scraping Eatigo Singapore's restaurant deals page.

# Steps:
# 1. Wait for listings to load.
# 2. Close login popups.
# 3. Extract all visible deals.

# For each restaurant:
# - name (string)
# - location (string)
# - cuisine (string)
# - discount (string)
# - discountPercent (number)
# - validTimes (array)
# - validDays (string)
# - eligibleCards (array)
# - expiryDate (string)
# - pricePerPax (number)
# - bookingRequired (boolean)
# - availableSlots (number)

# Rules:
# - Only active deals
# - 1-for-1 = 50%
# - eligibleCards = [] if unrestricted
# - Skip sold-out
# - Return raw JSON array only
# """.strip(),
#         "urls": [
#             "https://eatigo.com/sg/singapore/en/restaurants",
#         ],
#     },
#     {
#         "category_name": "SHOPBACK",
#         "goal": """
# You are scraping ShopBack Singapore cashback deals page.

# For each offer:
# - merchant (string)
# - cashbackRate (string)
# - cashbackRateNumber (number)
# - isUpsized (boolean)
# - regularRate (string)
# - eligibleCards (array)
# - validUntil (string)
# - minSpend (number)
# - maxCashback (number)
# - category (string)
# - promoCode (string)
# - isCardLinked (boolean)

# Rules:
# - Upsized = true when shown
# - "Up to X%" -> use X
# - If a field is missing, use null
# - Return raw JSON array only
# """.strip(),
#         "urls": [
#             "https://www.shopback.sg/food",
#         ],
#     },
#     {
#         "category_name": "MONEYSMART",
#         "goal": """
# You are scraping a MoneySmart Singapore credit card promotions article.

# Steps:
# 1. Load full article
# 2. Close popups
# 3. Extract ALL card deals mentioned (tables + text)

# For each offer:
# - cardName (string)
# - bank (string)
# - cardType (string)
# - rewardValue (string)
# - rewardDescription (string)
# - minimumSpendToUnlock (number)
# - spendWithinDays (number)
# - promoExpiryDate (string)
# - annualFee (string)
# - isExclusiveDeal (boolean)
# - exclusivePromoCode (string)
# - extraGift (string)
# - estimatedTotalValue (string)
# - sourceSection (string)

# Rules:
# - Include all cards mentioned
# - Use best available tier
# - If a field is missing, use null
# - Return raw JSON array only
# """.strip(),
#         "urls": [
#             "https://blog.moneysmart.sg/credit-cards/best-credit-card-promotions-singapore/",
#         ],
#     },
#     {
#         "category_name": "SINGSAVER",
#         "goal": """
# You are scraping SingSaver Singapore credit card listing page.

# Steps:
# 1. Wait for full page load
# 2. Close popups
# 3. Extract ALL listed offers

# For each offer:
# - cardName (string)
# - bank (string)
# - cardType (string)
# - rewardValue (string)
# - rewardDescription (string)
# - minimumSpendToUnlock (number)
# - spendWithinDays (number)
# - promoExpiryDate (string)
# - annualFee (string)
# - isExclusiveDeal (boolean)
# - exclusivePromoCode (string)
# - extraGift (string)
# - estimatedTotalValue (string)
# - applyUrl (string)

# Rules:
# - Prioritise exclusive deals
# - Include ALL cards
# - If a field is missing, use null
# - Return raw JSON array only
# """.strip(),
#         "urls": [
#             "https://www.singsaver.com.sg/credit-card/best",
#         ],
#     },
]

# ==========================================
# 3. HELPERS
# ==========================================
def parse_retry_after(response):
    value = response.headers.get("Retry-After")
    if not value:
        return None
    try:
        return max(1, int(value))
    except ValueError:
        return None


def backoff_sleep(attempt, response=None):
    retry_after = parse_retry_after(response) if response is not None else None
    if retry_after is not None:
        wait = retry_after
    else:
        wait = min(60, (2 ** attempt) + random.uniform(0, 1))
    print(f"⏳ Backing off for {wait:.1f}s")
    time.sleep(wait)


def flatten_jobs(categories_list):
    jobs = []
    for cat in categories_list:
        for url in cat["urls"]:
            jobs.append({
                "category_name": cat["category_name"],
                "url": url,
                "goal": cat["goal"],
            })
    return jobs


def submit_async_run(url, goal):
    """
    Submit one TinyFish run.
    """
    endpoint = f"{BASE_URL}/automation/run-async"
    payload = {
        "url": url,
        "goal": goal,
    }

    for attempt in range(MAX_SUBMISSION_RETRIES):
        response = requests.post(endpoint, headers=HEADERS, json=payload, timeout=120)

        if response.ok:
            return response.json()

        if response.status_code == 429:
            print(f"⚠ 429 on submit for {url}")
            print(response.text)
            backoff_sleep(attempt, response)
            continue

        print(f"❌ Submit failed for {url}: {response.status_code}")
        print(response.text)
        response.raise_for_status()

    raise RuntimeError(f"Exceeded max submission retries for {url}")


def get_run_status(run_id):
    endpoint = f"{BASE_URL}/runs/{run_id}"

    for attempt in range(MAX_STATUS_RETRIES):
        response = requests.get(endpoint, headers=HEADERS, timeout=60)

        if response.ok:
            return response.json()

        if response.status_code == 429:
            print(f"⚠ 429 while polling run {run_id}")
            print(response.text)
            backoff_sleep(attempt, response)
            continue

        print(f"❌ Poll failed for run {run_id}: {response.status_code}")
        print(response.text)
        response.raise_for_status()

    raise RuntimeError(f"Exceeded max polling retries for run {run_id}")


def wait_for_run_completion(run_id, category_name, url):
    for attempt in range(1, MAX_POLLS + 1):
        run_data = get_run_status(run_id)
        status = str(run_data.get("status", "")).upper()

        print(f"[{category_name}] {url} | Poll {attempt}/{MAX_POLLS} -> {status}")

        if status in {"COMPLETED", "FAILED", "CANCELLED"}:
            return run_data

        time.sleep(POLL_INTERVAL_SECONDS)

    return {
        "run_id": run_id,
        "status": "TIMEOUT",
        "error": f"Run did not finish after {MAX_POLLS} polls."
    }


# ==========================================
# 4. MAIN
# ==========================================
def run_tinyfish(categories_list):
    jobs = flatten_jobs(categories_list)
    submitted = []
    final_output = []

    print(f"Submitting {len(jobs)} runs sequentially...")

    for idx, job in enumerate(jobs, start=1):
        category_name = job["category_name"]
        url = job["url"]
        goal = job["goal"]

        print(f"\n🚀 [{idx}/{len(jobs)}] Submitting {category_name} | {url}")

        try:
            submit_response = submit_async_run(url, goal)
            run_id = submit_response.get("run_id") or submit_response.get("id")

            submitted.append({
                "category_name": category_name,
                "url": url,
                "goal": goal,
                "run_id": run_id,
                "submit_response": submit_response,
            })

            print(f"✅ Submitted | run_id={run_id}")

        except Exception as e:
            final_output.append({
                "category_name": category_name,
                "url": url,
                "submission_error": str(e),
            })
            print(f"❌ Submission failed: {e}")

        time.sleep(SUBMISSION_DELAY_SECONDS)

    print(f"\nPolling {len(submitted)} submitted runs...")

    for item in submitted:
        category_name = item["category_name"]
        url = item["url"]
        run_id = item["run_id"]

        if not run_id:
            final_output.append({
                "category_name": category_name,
                "url": url,
                "error": "No run_id returned from submission response.",
                "submit_response": item["submit_response"],
            })
            continue

        try:
            result_data = wait_for_run_completion(run_id, category_name, url)
            final_output.append({
                "category_name": category_name,
                "url": url,
                "run_id": run_id,
                "submit_response": item["submit_response"],
                "final_run_data": result_data,
            })
        except Exception as e:
            final_output.append({
                "category_name": category_name,
                "url": url,
                "run_id": run_id,
                "submit_response": item["submit_response"],
                "polling_error": str(e),
            })
            print(f"❌ Polling failed for {run_id}: {e}")

    return {
        "results": final_output,
    }


if __name__ == "__main__":
    started_at = datetime.now().isoformat()
    output = run_tinyfish(categories)
    output["started_at"] = started_at
    output["finished_at"] = datetime.now().isoformat()
    output["total_categories"] = len(categories)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"tinyfish_async_results_{timestamp}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("-" * 50)
    print(f"Done! Results saved to: {filename}")
