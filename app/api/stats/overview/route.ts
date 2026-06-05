import { getStatsOverview } from "@/lib/api/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return getStatsOverview();
}
