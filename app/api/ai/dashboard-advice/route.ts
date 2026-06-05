import { createDashboardAdvice } from "@/lib/api/ai-dashboard-advice";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createDashboardAdvice(request);
}
