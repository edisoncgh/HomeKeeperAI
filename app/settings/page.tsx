import { BackupMaintenancePanel } from "@/components/settings/backup-maintenance-panel";
import { LlmSettingsPanel } from "@/components/settings/llm-settings-panel";
import { OrphanImageMaintenancePanel } from "@/components/settings/orphan-image-maintenance-panel";
import { SettingsMaintenanceHub } from "@/components/settings/settings-maintenance-hub";
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
      <SettingsMaintenanceHub />
      <OrphanImageMaintenancePanel />
      <BackupMaintenancePanel initialBackups={backups} />
    </div>
  );
}
