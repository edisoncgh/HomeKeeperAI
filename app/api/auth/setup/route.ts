import { cookies } from "next/headers";
import { apiError, apiOk } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { parseSetupInput } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userCount = await prisma.user.count();
  return apiOk({ needsSetup: userCount === 0 });
}

export async function POST(request: Request) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return apiError("管理员已初始化，请直接登录。", 409);
  }

  const parsed = parseSetupInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const user = await prisma.user.create({
    data: {
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
      username: parsed.data.username
    },
    select: {
      displayName: true,
      id: true,
      role: true,
      username: true
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(user), getSessionCookieOptions());

  return apiOk({ user }, 201);
}
