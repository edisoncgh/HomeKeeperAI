import { createItem, listItems } from "@/lib/api/items";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listItems(request);
}

export async function POST(request: Request) {
  return createItem(request);
}
