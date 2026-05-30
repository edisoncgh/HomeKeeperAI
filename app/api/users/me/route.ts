import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("请先登录。", 401);
  }

  return apiOk({ user });
}
