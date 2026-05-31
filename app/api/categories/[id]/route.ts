import {
  categoryTaxonomy,
  deleteTaxonomyItem,
  parseRouteId,
  updateTaxonomyItem
} from "@/lib/api/taxonomy";
import { apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("分类不存在。", 404);
  }

  return updateTaxonomyItem(categoryTaxonomy, id, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("分类不存在。", 404);
  }

  return deleteTaxonomyItem(categoryTaxonomy, id);
}
