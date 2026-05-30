import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    select: {
      displayName: true,
      id: true,
      role: true,
      username: true
    },
    where: { id: session.userId }
  });
}

export async function requireCurrentUser() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}
