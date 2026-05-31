import { apiError } from "@/lib/api/response";
import {
  deleteTaxonomyItem,
  locationTaxonomy,
  parseRouteId,
  updateTaxonomyItem
} from "@/lib/api/taxonomy";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("位置不存在。", 404);
  }

  return updateTaxonomyItem(locationTaxonomy, id, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = parseRouteId((await context.params).id);
  if (!id) {
    return apiError("位置不存在。", 404);
  }

  return deleteTaxonomyItem(locationTaxonomy, id);
}
