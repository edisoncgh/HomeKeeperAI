import { getStatsDistribution } from "@/lib/api/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return getStatsDistribution(request);
}
