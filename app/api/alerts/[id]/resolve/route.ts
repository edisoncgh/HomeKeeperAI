import { apiError } from "@/lib/api/response";
import { parseRouteId } from "@/lib/api/items";
import { resolveAlert } from "@/lib/api/alerts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("预警不存在。", 404);
  }

  return resolveAlert(id);
}
