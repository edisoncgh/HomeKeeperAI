import { createTaxonomyItem, listTaxonomyItems, locationTaxonomy } from "@/lib/api/taxonomy";

export const dynamic = "force-dynamic";

export async function GET() {
  return listTaxonomyItems(locationTaxonomy);
}

export async function POST(request: Request) {
  return createTaxonomyItem(locationTaxonomy, request);
}
