import { removeBackup } from "@/lib/api/backups";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  return removeBackup((await context.params).id);
}
