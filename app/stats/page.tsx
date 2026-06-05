import { StatsDashboard } from "@/components/stats";
import { queryStatsDistribution, queryStatsOverview } from "@/lib/api/stats";
import { requireCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await requireCurrentUser();
  const [overview, distribution] = await Promise.all([queryStatsOverview(), queryStatsDistribution()]);

  return <StatsDashboard distribution={distribution} overview={overview} />;
}
