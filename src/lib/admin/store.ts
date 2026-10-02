// Where a save lands. Facts stay in content/*.json so every published guard
// (numbers, staffing, claims, fr) keeps running on them — there is no database
// to bypass the constitution. Node-only (the save route is `runtime = "nodejs"`);
// never imported by the Edge middleware.
//
//  - dev / local:  write the file on disk; `next dev` recompiles the JSON import
//                  and the public page re-renders with the new value.
//  - production:   commit the file through the GitHub Contents API, which lands
//                  on the deploy branch and triggers Vercel — the site rebuilds
//                  with the new content. This is the intended "edit → publish".

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PersistenceMode = "fs" | "github" | "none";

interface GithubConfig {
  token: string;
  repo: string; // owner/name
  branch: string;
  authorName: string;
  authorEmail: string;
}

function githubConfig(): GithubConfig | null {
  const token = process.env.ADMIN_GITHUB_TOKEN;
  const repo = process.env.ADMIN_GITHUB_REPO;
  if (!token || !repo) return null;
  return {
    token,
    repo,
    branch: process.env.ADMIN_GITHUB_BRANCH ?? "main",
    authorName: process.env.ADMIN_GITHUB_AUTHOR_NAME ?? "VKC content editor",
    authorEmail: process.env.ADMIN_GITHUB_AUTHOR_EMAIL ?? "content@vkcpackaging.com",
  };
}

export function persistenceMode(): PersistenceMode {
  if (githubConfig()) return "github";
  if (process.env.NODE_ENV !== "production") return "fs";
  return "none";
}

function contentDir(): string {
  return process.env.ADMIN_CONTENT_DIR ?? path.join(process.cwd(), "content");
}

/** Canonical on-disk form: 2-space indent + trailing newline, matching the seeded files. */
function serialize(content: unknown): string {
  return `${JSON.stringify(content, null, 2)}\n`;
}

async function writeToDisk(file: string, content: unknown): Promise<void> {
  await writeFile(path.join(contentDir(), `${file}.json`), serialize(content), "utf8");
}

async function githubRequest(config: GithubConfig, pathSuffix: string, init: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com/repos/${config.repo}/${pathSuffix}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "vkc-content-editor",
      ...(init.headers ?? {}),
    },
  });
}

async function commitToGithub(config: GithubConfig, file: string, content: unknown): Promise<void> {
  const filePath = `content/${file}.json`;

  // Current blob sha is required to update an existing file.
  const existing = await githubRequest(config, `contents/${filePath}?ref=${encodeURIComponent(config.branch)}`, { method: "GET" });
  let sha: string | undefined;
  if (existing.ok) {
    const json = (await existing.json()) as { sha?: string };
    sha = json.sha;
  } else if (existing.status !== 404) {
    throw new Error(`GitHub read failed (${existing.status}): ${await existing.text()}`);
  }

  const body = {
    message: `content: update ${file} via admin editor`,
    content: Buffer.from(serialize(content), "utf8").toString("base64"),
    branch: config.branch,
    committer: { name: config.authorName, email: config.authorEmail },
    ...(sha ? { sha } : {}),
  };

  const result = await githubRequest(config, `contents/${filePath}`, { method: "PUT", body: JSON.stringify(body) });
  if (!result.ok) throw new Error(`GitHub write failed (${result.status}): ${await result.text()}`);
}

/** Persist one section's content. Throws with a clear message when no store is configured. */
export async function writeSection(file: string, content: unknown): Promise<void> {
  const mode = persistenceMode();
  if (mode === "github") {
    const config = githubConfig();
    if (!config) throw new Error("GitHub persistence selected but not configured.");
    await commitToGithub(config, file, content);
    return;
  }
  if (mode === "fs") {
    await writeToDisk(file, content);
    return;
  }
  throw new Error("No content store is configured. Set ADMIN_GITHUB_TOKEN and ADMIN_GITHUB_REPO to save in production.");
}

/** Read the current on-disk content for a section (dev/local prefill fallback). */
export async function readSectionFromDisk(file: string): Promise<unknown> {
  const raw = await readFile(path.join(contentDir(), `${file}.json`), "utf8");
  return JSON.parse(raw);
}

/**
 * Read a collection's CURRENT content (not the build-time bundle) so a save does
 * a true read-modify-write: from disk in dev, from GitHub in prod. This is what
 * keeps an upsert correct in production between deploys.
 */
export async function readCollectionCurrent(file: string): Promise<unknown[]> {
  const mode = persistenceMode();
  if (mode === "github") {
    const config = githubConfig();
    if (!config) throw new Error("GitHub persistence selected but not configured.");
    const response = await githubRequest(config, `contents/content/${file}.json?ref=${encodeURIComponent(config.branch)}`, { method: "GET" });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`GitHub read failed (${response.status}): ${await response.text()}`);
    const json = (await response.json()) as { content?: string };
    const decoded = Buffer.from(json.content ?? "", "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  }
  if (mode === "fs") {
    try {
      const parsed = await readSectionFromDisk(file);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  throw new Error("No content store is configured.");
}
