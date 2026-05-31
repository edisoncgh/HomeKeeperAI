import { apiError } from "@/lib/api/response";
import { deleteItem, getItem, parseRouteId, updateItem } from "@/lib/api/items";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("物品不存在。", 404);
  }

  return getItem(id);
}

export async function PUT(request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("物品不存在。", 404);
  }

  return updateItem(id, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("物品不存在。", 404);
  }

  return deleteItem(id);
}
