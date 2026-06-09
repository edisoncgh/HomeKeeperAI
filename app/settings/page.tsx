import { BackupMaintenancePanel } from "@/components/settings/backup-maintenance-panel";
import { LlmSettingsPanel } from "@/components/settings/llm-settings-panel";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listDatabaseBackups } from "@/lib/backups/sqlite";
import { getLlmSettingsView } from "@/lib/settings/llm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCurrentUser();
  const settings = await getLlmSettingsView();
  const backups = await listDatabaseBackups();

  return (
    <div className="flex flex-col gap-6">
      <LlmSettingsPanel initialSettings={settings} />
      <BackupMaintenancePanel initialBackups={backups} />
    </div>
  );
}
