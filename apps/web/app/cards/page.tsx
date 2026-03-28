import { getAllCards } from "@/lib/data";
import { CardsBrowser } from "@/components/cards-browser";

export default async function CardsPage() {
  const cards = await getAllCards();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Cards</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Browse all cards in the CardSense database and filter by bank, card type,
          annual fee, and reward profile.
        </p>
      </div>

      <CardsBrowser cards={cards} />
    </main>
  );
}