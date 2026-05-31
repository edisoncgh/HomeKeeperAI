import { categoryTaxonomy, createTaxonomyItem, listTaxonomyItems } from "@/lib/api/taxonomy";

export const dynamic = "force-dynamic";

export async function GET() {
  return listTaxonomyItems(categoryTaxonomy);
}

export async function POST(request: Request) {
  return createTaxonomyItem(categoryTaxonomy, request);
}
