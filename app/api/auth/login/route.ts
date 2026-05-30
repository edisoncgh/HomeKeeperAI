import { cookies } from "next/headers";
import { apiError, apiOk } from "@/lib/api/response";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { parseLoginInput } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = parseLoginInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username }
  });
  const canLogin = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;

  if (!user || !canLogin) {
    return apiError("用户名或密码不正确。", 401);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(user), getSessionCookieOptions());

  return apiOk({
    user: {
      displayName: user.displayName,
      id: user.id,
      role: user.role,
      username: user.username
    }
  });
}
