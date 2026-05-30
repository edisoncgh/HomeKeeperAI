import { cookies } from "next/headers";
import { apiOk } from "@/lib/api/response";
import {
  getExpiredSessionCookieOptions,
  SESSION_COOKIE_NAME
} from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", getExpiredSessionCookieOptions());

  return apiOk({ loggedOut: true });
}
