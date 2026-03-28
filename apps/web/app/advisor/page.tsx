import { AiAdvisor } from "@/components/ai-advisor";

export default function AdvisorPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Advisor</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Describe your spending habits and CardSense will generate a recommendation
          using your backend AI workflow.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <AiAdvisor />
      </div>
    </main>
  );
}