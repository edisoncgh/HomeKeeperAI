import { apiError } from "@/lib/api/response";
import { restoreBackup } from "@/lib/api/backups";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.clone().json().catch(() => null);
  const id = body && typeof body === "object" && "id" in body ? body.id : null;
  if (typeof id !== "string") {
    return apiError("请选择要恢复的备份。", 400);
  }

  return restoreBackup(id, request);
}
