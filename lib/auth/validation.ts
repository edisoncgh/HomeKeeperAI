interface AuthInput {
  displayName?: unknown;
  password?: unknown;
  username?: unknown;
}

interface ParsedLoginInput {
  password: string;
  username: string;
}

interface ParsedSetupInput extends ParsedLoginInput {
  displayName: string | null;
}

type ParseResult<T> = { data: T; ok: true } | { message: string; ok: false };

const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

export function parseLoginInput(input: AuthInput): ParseResult<ParsedLoginInput> {
  const username = normalizeUsername(input.username);
  const password = normalizePassword(input.password);

  if (!username || !password) {
    return { message: "请输入用户名和密码。", ok: false };
  }

  return { data: { password, username }, ok: true };
}

export function parseSetupInput(input: AuthInput): ParseResult<ParsedSetupInput> {
  const username = normalizeUsername(input.username);
  const password = normalizePassword(input.password);

  if (!USERNAME_PATTERN.test(username)) {
    return { message: "用户名需为 3-32 位字母、数字、下划线或短横线。", ok: false };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { message: "密码至少需要 8 位。", ok: false };
  }

  return {
    data: {
      displayName: normalizeDisplayName(input.displayName),
      password,
      username
    },
    ok: true
  };
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const displayName = value.trim();
  return displayName ? displayName : null;
}
