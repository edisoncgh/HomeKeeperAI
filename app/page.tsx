import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getHomeOverview } from "@/lib/dashboard/overview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireCurrentUser();
  const overview = await getHomeOverview();
  return <HomeDashboard overview={overview} user={user} />;
}
