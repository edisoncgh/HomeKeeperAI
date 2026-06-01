import { checkAiHealth } from "@/lib/api/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return checkAiHealth();
}
