import { LlmSettingsPanel } from "@/components/settings/llm-settings-panel";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getLlmSettingsView } from "@/lib/settings/llm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCurrentUser();
  const settings = await getLlmSettingsView();

  return <LlmSettingsPanel initialSettings={settings} />;
}
