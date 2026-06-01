import { getLlmSettings, updateLlmSettings } from "@/lib/api/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return getLlmSettings();
}

export async function PUT(request: Request) {
  return updateLlmSettings(request);
}
