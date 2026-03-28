import { getSummary, getSupabaseCollections } from "@/lib/data";
import DashboardShell, {
  type CollectionsPayload,
  type SummaryPayload
} from "@/components/dashboard-shell";

export default async function HomePage() {
  const [summary, collections] = await Promise.all([
    getSummary(),
    getSupabaseCollections()
  ]);

  return (
    <DashboardShell
      summary={summary as SummaryPayload}
      collections={collections as CollectionsPayload}
    />
  );
}