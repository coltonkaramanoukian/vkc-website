// Start/stop a local `next start` for verification scripts.
import { spawn, type ChildProcess } from "node:child_process";

export async function waitForServer(base: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/robots.txt`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server at ${base} did not come up within ${timeoutMs}ms`);
}

export async function startServer(
  port: number,
  env: Record<string, string | undefined> = {},
): Promise<{ base: string; child: ChildProcess; logs: string[] }> {
  const logs: string[] = [];
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => logs.push(String(d)));
  child.stderr?.on("data", (d) => logs.push(String(d)));
  const base = `http://localhost:${port}`;
  await waitForServer(base);
  return { base, child, logs };
}

export function stopServer(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 5000);
  });
}
