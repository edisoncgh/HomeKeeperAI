import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const parsed = parsePasswordHash(passwordHash);
  if (!parsed) {
    return false;
  }

  const candidateKey = (await scryptAsync(password, parsed.salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(parsed.hash, "base64url");

  return storedKey.length === candidateKey.length && timingSafeEqual(storedKey, candidateKey);
}

function parsePasswordHash(passwordHash: string) {
  const [prefix, salt, hash] = passwordHash.split("$");

  if (prefix !== HASH_PREFIX || !salt || !hash) {
    return null;
  }

  return { hash, salt };
}
