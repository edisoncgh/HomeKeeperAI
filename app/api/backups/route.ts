import { createBackup, listBackups } from "@/lib/api/backups";

export const dynamic = "force-dynamic";

export async function GET() {
  return listBackups();
}

export async function POST() {
  return createBackup();
}
