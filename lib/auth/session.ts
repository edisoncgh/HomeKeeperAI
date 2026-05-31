import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "home_storage_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "ADMIN" | "MEMBER";

export interface AuthSession {
  expiresAt: number;
  role: SessionRole;
  userId: number;
  username: string;
}

interface TokenOptions {
  now?: Date;
  secret?: string;
}

interface TokenUser {
  id: number;
  role: SessionRole;
  username: string;
}

const globalForAuth = globalThis as typeof globalThis & {
  authDevSecret?: string;
};

export function createSessionToken(user: TokenUser, options: TokenOptions = {}) {
  const now = options.now ?? new Date();
  const payload: AuthSession = {
    expiresAt: Math.floor(now.getTime() / 1000) + SESSION_MAX_AGE_SECONDS,
    role: user.role,
    userId: user.id,
    username: user.username
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, options.secret ?? getAuthSecret());

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined, options: TokenOptions = {}) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, options.secret ?? getAuthSecret());
  if (!isEqualSignature(signature, expectedSignature)) {
    return null;
  }

  const payload = parseSessionPayload(encodedPayload);
  if (!payload) {
    return null;
  }

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  return payload.expiresAt > nowSeconds ? payload : null;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(),
    maxAge: 0
  };
}

function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET 未配置，无法创建或验证认证会话。");
  }

  globalForAuth.authDevSecret ??= randomBytes(32).toString("base64url");
  return globalForAuth.authDevSecret;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function parseSessionPayload(encodedPayload: string) {
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AuthSession>;
    if (!isSessionPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isSessionPayload(payload: Partial<AuthSession>): payload is AuthSession {
  return (
    typeof payload.expiresAt === "number" &&
    (payload.role === "ADMIN" || payload.role === "MEMBER") &&
    typeof payload.userId === "number" &&
    typeof payload.username === "string"
  );
}

function isEqualSignature(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
