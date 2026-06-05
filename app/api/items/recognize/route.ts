import { recognizeItemsFromPhoto } from "@/lib/api/ai-recognition";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return recognizeItemsFromPhoto(request);
}
