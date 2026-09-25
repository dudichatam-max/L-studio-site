import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { APPROVED_APK_SHA256, type CommerceConfig } from "./config";

const MAX_APK_BYTES = 80 * 1024 * 1024;

export type ApkStatus = "loading" | "ready" | "missing" | "checksum_mismatch" | "unreadable";

type ApkState = {
  status: ApkStatus;
  filePath?: string;
  size?: number;
  mtimeMs?: number;
};

let state: ApkState = { status: "loading" };
let pending: Promise<void> | null = null;

export function apkStatus(): ApkStatus {
  return state.status;
}

export function resetApkForTests() {
  state = { status: "loading" };
  pending = null;
}

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function isBlockedPublicPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const blocked = [path.resolve(process.cwd(), "dist", "public"), path.resolve(process.cwd(), "client", "public"), path.resolve(process.cwd(), "assets")];
  return blocked.some((dir) => resolved === dir || resolved.startsWith(dir + path.sep));
}

async function fetchToPrivateFile(sourceUrl: string, dest: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("invalid_apk_source_url");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("apk_source_url_must_be_https");
  }
  const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(120000) });
  if (!response.ok || !response.body) {
    throw new Error("apk_fetch_failed");
  }
  const temp = `${dest}.partial`;
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(temp, { flags: "w", mode: 0o600 });
  let received = 0;
  try {
    const reader = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream<Uint8Array>);
    for await (const chunk of reader) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buf.length;
      if (received > MAX_APK_BYTES) {
        throw new Error("apk_too_large");
      }
      if (!file.write(buf)) {
        await new Promise<void>((resolve) => file.once("drain", () => resolve()));
      }
    }
    await new Promise<void>((resolve, reject) => {
      file.end(() => resolve());
      file.on("error", reject);
    });
    await fs.promises.rename(temp, dest);
  } catch (error) {
    file.destroy();
    await fs.promises.rm(temp, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function acceptFile(filePath: string, expectedSha: string): Promise<void> {
  if (isBlockedPublicPath(filePath)) {
    state = { status: "unreadable" };
    console.error("commerce apk refused: path is inside a public web directory");
    return;
  }
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    state = { status: "missing" };
    return;
  }
  if (!stat.isFile()) {
    state = { status: "unreadable" };
    return;
  }
  const digest = await sha256File(filePath);
  if (digest !== expectedSha) {
    state = { status: "checksum_mismatch" };
    console.error(
      `commerce apk checksum mismatch (expected ${expectedSha === APPROVED_APK_SHA256 ? "approved build" : "APK_SHA256"})`,
    );
    return;
  }
  state = { status: "ready", filePath, size: stat.size, mtimeMs: stat.mtimeMs };
  console.log(`commerce apk ready (${stat.size} bytes)`);
}

async function prepare(config: CommerceConfig): Promise<void> {
  state = { status: "loading" };
  await fs.promises.mkdir(config.dataDir, { recursive: true });
  if (!/^[a-f0-9]{64}$/.test(config.apkSha256)) {
    state = { status: "checksum_mismatch" };
    console.error("commerce apk refused: APK_SHA256 is not a sha256 hex digest");
    return;
  }
  try {
    if (config.apkPath) {
      await acceptFile(path.resolve(config.apkPath), config.apkSha256);
      return;
    }
    if (config.apkSourceUrl) {
      const dest = path.join(config.dataDir, "l-studio-pro.apk");
      let reuse = false;
      try {
        const existing = await fs.promises.stat(dest);
        if (existing.isFile()) {
          const digest = await sha256File(dest);
          reuse = digest === config.apkSha256;
        }
      } catch {
        reuse = false;
      }
      if (!reuse) {
        console.log("commerce apk fetch started into private data dir");
        await fetchToPrivateFile(config.apkSourceUrl, dest);
        console.log("commerce apk fetch finished");
      }
      await acceptFile(dest, config.apkSha256);
      return;
    }
    state = { status: "missing" };
    console.error("commerce apk missing: set APK_PATH or APK_SOURCE_URL");
  } catch (error) {
    state = { status: "unreadable" };
    console.error(`commerce apk prepare failed: ${error instanceof Error ? error.message : "error"}`);
  }
}

export function ensureApk(config: CommerceConfig): Promise<void> {
  if (!pending) {
    pending = prepare(config).finally(() => {
      if (state.status === "loading") state = { status: "unreadable" };
    });
  }
  return pending;
}

export async function openApk(config: CommerceConfig): Promise<{ stream: fs.ReadStream; size: number } | null> {
  await ensureApk(config);
  if (state.status !== "ready" || !state.filePath || state.size == null) return null;
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(state.filePath);
  } catch {
    state = { status: "missing" };
    return null;
  }
  if (stat.size !== state.size || stat.mtimeMs !== state.mtimeMs) {
    pending = null;
    await ensureApk(config);
    if (state.status !== "ready" || !state.filePath || state.size == null) return null;
  }
  return { stream: fs.createReadStream(state.filePath), size: state.size };
}
