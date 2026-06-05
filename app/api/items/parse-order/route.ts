import { parseItemsFromOrderImage } from "@/lib/api/ai-order-parsing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return parseItemsFromOrderImage(request);
}
