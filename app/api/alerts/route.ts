import { listAlerts } from "@/lib/api/alerts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listAlerts(request);
}
