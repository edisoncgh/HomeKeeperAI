import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

describe("Docker runtime image", () => {
  it("keeps sharp optional runtime packages in the standalone image", () => {
    const dockerfile = readFileSync(join(rootDir, "Dockerfile"), "utf8");
    const nextConfig = readFileSync(join(rootDir, "next.config.ts"), "utf8");

    expect(dockerfile).toContain("npm ci --include=optional");
    expect(dockerfile).toContain("node node_modules/next/dist/bin/next build");
    expect(dockerfile).toContain("/app/node_modules/sharp ./node_modules/sharp");
    expect(dockerfile).toContain("/app/node_modules/@img ./node_modules/@img");
    expect(dockerfile).toContain("/app/node_modules/detect-libc ./node_modules/detect-libc");
    expect(dockerfile).toContain("/app/node_modules/semver ./node_modules/semver");
    expect(dockerfile).toContain("require('sharp')");
    expect(nextConfig).toContain('serverExternalPackages: ["sharp"]');
  });

  it("marks image mutation routes as dynamic for Linux standalone builds", () => {
    const imageCollectionRoute = readFileSync(
      join(rootDir, "app", "api", "items", "[id]", "images", "route.ts"),
      "utf8"
    );
    const imageMutationRoute = readFileSync(
      join(rootDir, "app", "api", "items", "[id]", "images", "[imageId]", "route.ts"),
      "utf8"
    );

    expect(imageCollectionRoute).toContain('export const dynamic = "force-dynamic"');
    expect(imageMutationRoute).toContain('export const dynamic = "force-dynamic"');
  });
});
