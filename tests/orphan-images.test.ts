import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let root = "";

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "hka-orphans-"));
});

afterEach(async () => {
  if (root) {
    await rm(root, { force: true, recursive: true });
  }
});

describe("orphan image scanner", () => {
  it("lists files under item upload directories that are not referenced", async () => {
    await mkdir(path.join(root, "items", "1"), { recursive: true });
    await writeFile(path.join(root, "items", "1", "kept.jpg"), "kept");
    await writeFile(path.join(root, "items", "1", "orphan.jpg"), "orphan");

    const { scanOrphanImages } = await import("@/lib/storage/orphan-images");
    const result = await scanOrphanImages({
      referencedUrls: new Set(["/api/uploads/items/1/kept.jpg"]),
      uploadRoot: root
    });

    expect(result.summary.fileCount).toBe(1);
    expect(result.summary.totalBytes).toBe(6);
    expect(result.files[0]).toMatchObject({
      filename: "orphan.jpg",
      itemId: 1,
      relativePath: "items/1/orphan.jpg"
    });
  });

  it("skips symlinks and non-numeric item directories", async () => {
    await mkdir(path.join(root, "items", "abc"), { recursive: true });
    await mkdir(path.join(root, "items", "2"), { recursive: true });
    await writeFile(path.join(root, "items", "2", "target.jpg"), "target");
    await symlinkIfSupported(path.join(root, "items", "2", "target.jpg"), path.join(root, "items", "2", "linked.jpg"));

    const { scanOrphanImages } = await import("@/lib/storage/orphan-images");
    const result = await scanOrphanImages({ referencedUrls: new Set(), uploadRoot: root });

    expect(result.files.map((file) => file.filename)).toEqual(["target.jpg"]);
  });
});

async function symlinkIfSupported(target: string, linkPath: string) {
  try {
    await symlink(target, linkPath);
  } catch {
    // Windows without developer-mode symlink privileges still exercises the non-numeric directory branch.
  }
}
