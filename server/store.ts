import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { EARLY_ACCESS_DOWNLOAD_LIMIT } from "./config";

export type ClaimResult = "ok" | "missing" | "used" | "expired" | "busy";
export type IssueResult = "issued" | "existing" | "used";

type TokenRow = {
  token_hash: string;
  order_id: string;
  expires_at: number;
  used_at: number | null;
  created_at: number;
  lock_until: number | null;
  sealed_token: string | null;
  download_count: number | null;
};

export type TokenInspection = {
  status: Exclude<ClaimResult, "busy">;
  earlyAccess: boolean;
};

export type DownloadState = {
  expiresAt: number;
  downloadCount: number;
  usedAt: number | null;
};

type EarlyAccessRow = {
  email: string;
  name: string;
  order_id: string;
  email_status: string | null;
  created_at: number;
  updated_at: number;
};

export type EarlyAccessReserve =
  | { result: "created"; orderId: string; emailStatus: null }
  | { result: "exists"; orderId: string; emailStatus: string | null }
  | { result: "full" };

type OrderRow = {
  order_id: string;
  capture_id: string | null;
  payer_email: string | null;
  amount: string;
  currency: string;
  status: string;
  email_status: string | null;
  created_at: number;
  updated_at: number;
};

function asToken(row: unknown): TokenRow | null {
  if (!row || typeof row !== "object") return null;
  return row as TokenRow;
}

function asOrder(row: unknown): OrderRow | null {
  if (!row || typeof row !== "object") return null;
  return row as OrderRow;
}

function asEarlyAccess(row: unknown): EarlyAccessRow | null {
  if (!row || typeof row !== "object") return null;
  return row as EarlyAccessRow;
}

function isUniqueConstraint(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unique/i.test(message);
}

export class CommerceStore {
  constructor(private readonly db: DatabaseSync) {}

  issueToken(input: {
    orderId: string;
    captureId: string;
    payerEmail: string;
    amount: string;
    currency: string;
    tokenHash: string;
    sealedToken: string;
    ttlMs: number;
    now?: number;
  }): { result: IssueResult; sealedToken: string | null; tokenHash: string | null } {
    const now = input.now ?? Date.now();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existingOrder = asOrder(this.db.prepare("SELECT * FROM orders WHERE order_id = ?").get(input.orderId));
      if (existingOrder) {
        this.db
          .prepare(
            `UPDATE orders
             SET capture_id = ?, payer_email = ?, amount = ?, currency = ?, status = ?, updated_at = ?
             WHERE order_id = ?`,
          )
          .run(input.captureId, input.payerEmail, input.amount, input.currency, "paid", now, input.orderId);
      } else {
        this.db
          .prepare(
            `INSERT INTO orders (order_id, capture_id, payer_email, amount, currency, status, email_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'paid', NULL, ?, ?)`,
          )
          .run(input.orderId, input.captureId, input.payerEmail, input.amount, input.currency, now, now);
      }

      const reissue = this.allowsEarlyAccessReissue(input.orderId, input.currency, input.captureId);
      if (!reissue) {
        const active = asToken(
          this.db
            .prepare(
              `SELECT * FROM download_tokens
               WHERE order_id = ? AND used_at IS NULL AND expires_at > ?
               ORDER BY created_at DESC LIMIT 1`,
            )
            .get(input.orderId, now),
        );
        if (active) {
          this.db.exec("COMMIT");
          return { result: "existing", sealedToken: active.sealed_token, tokenHash: active.token_hash };
        }

        const used = this.db.prepare("SELECT token_hash FROM download_tokens WHERE order_id = ? AND used_at IS NOT NULL LIMIT 1").get(input.orderId);
        if (used) {
          this.db.exec("COMMIT");
          return { result: "used", sealedToken: null, tokenHash: null };
        }
      } else {
        // A failed phone download can mark the link used before the APK is saved.
        // Replace earlier Early Access tokens so the same signup can receive a new link.
        this.db
          .prepare(
            `UPDATE download_tokens
             SET used_at = ?, lock_until = NULL, sealed_token = NULL
             WHERE order_id = ? AND used_at IS NULL`,
          )
          .run(now, input.orderId);
      }

      this.db
        .prepare(
          `INSERT INTO download_tokens (token_hash, order_id, expires_at, used_at, created_at, lock_until, sealed_token)
           VALUES (?, ?, ?, NULL, ?, NULL, ?)`,
        )
        .run(input.tokenHash, input.orderId, now + input.ttlMs, now, input.sealedToken);
      this.db.exec("COMMIT");
      return { result: "issued", sealedToken: input.sealedToken, tokenHash: input.tokenHash };
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  setEmailStatus(orderId: string, status: string) {
    this.db.prepare("UPDATE orders SET email_status = ?, updated_at = ? WHERE order_id = ?").run(status, Date.now(), orderId);
  }

  getEmailStatus(orderId: string): string | null {
    const row = asOrder(this.db.prepare("SELECT * FROM orders WHERE order_id = ?").get(orderId));
    return row?.email_status ?? null;
  }

  claim(tokenHash: string, lockMs: number, now = Date.now()): ClaimResult {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = asToken(this.db.prepare("SELECT * FROM download_tokens WHERE token_hash = ?").get(tokenHash));
      if (!row) {
        this.db.exec("COMMIT");
        return "missing";
      }
      if (row.used_at != null) {
        this.db.exec("COMMIT");
        return "used";
      }
      if (row.expires_at <= now) {
        this.db.exec("COMMIT");
        return "expired";
      }
      // Phone Chrome often opens the file twice. An Early Access lock from the
      // first attempt must not turn the retry into "busy".
      if (this.isEarlyAccessOrder(row.order_id)) {
        if (row.lock_until != null) {
          this.db.prepare("UPDATE download_tokens SET lock_until = NULL WHERE token_hash = ?").run(tokenHash);
        }
        this.db.exec("COMMIT");
        return "ok";
      }
      if (row.lock_until != null && row.lock_until > now) {
        this.db.exec("COMMIT");
        return "busy";
      }
      this.db.prepare("UPDATE download_tokens SET lock_until = ? WHERE token_hash = ?").run(now + lockMs, tokenHash);
      this.db.exec("COMMIT");
      return "ok";
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  inspect(tokenHash: string, now = Date.now()): TokenInspection {
    const row = asToken(this.db.prepare("SELECT * FROM download_tokens WHERE token_hash = ?").get(tokenHash));
    if (!row) return { status: "missing", earlyAccess: false };
    const earlyAccess = this.isEarlyAccessOrder(row.order_id);
    if (row.used_at != null) return { status: "used", earlyAccess };
    if (row.expires_at <= now) return { status: "expired", earlyAccess };
    return { status: "ok", earlyAccess };
  }

  downloadState(tokenHash: string): DownloadState | null {
    const row = asToken(this.db.prepare("SELECT * FROM download_tokens WHERE token_hash = ?").get(tokenHash));
    if (!row) return null;
    return {
      expiresAt: row.expires_at,
      downloadCount: Number(row.download_count ?? 0),
      usedAt: row.used_at,
    };
  }

  complete(tokenHash: string) {
    this.db
      .prepare("UPDATE download_tokens SET used_at = ?, lock_until = NULL, sealed_token = NULL WHERE token_hash = ? AND used_at IS NULL")
      .run(Date.now(), tokenHash);
  }

  noteSuccessfulDownload(tokenHash: string, now = Date.now()) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = asToken(this.db.prepare("SELECT * FROM download_tokens WHERE token_hash = ?").get(tokenHash));
      if (!row || row.used_at != null) {
        this.db.exec("COMMIT");
        return;
      }
      if (this.isEarlyAccessOrder(row.order_id)) {
        const count = Number(row.download_count ?? 0) + 1;
        if (count >= EARLY_ACCESS_DOWNLOAD_LIMIT) {
          this.db
            .prepare(
              `UPDATE download_tokens
               SET used_at = ?, download_count = ?, lock_until = NULL, sealed_token = NULL
               WHERE token_hash = ? AND used_at IS NULL`,
            )
            .run(now, count, tokenHash);
        } else {
          this.db
            .prepare(
              `UPDATE download_tokens
               SET download_count = ?, lock_until = NULL
               WHERE token_hash = ? AND used_at IS NULL`,
            )
            .run(count, tokenHash);
        }
      } else {
        this.db
          .prepare(
            "UPDATE download_tokens SET used_at = ?, lock_until = NULL, sealed_token = NULL WHERE token_hash = ? AND used_at IS NULL",
          )
          .run(now, tokenHash);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  release(tokenHash: string) {
    this.db.prepare("UPDATE download_tokens SET lock_until = NULL WHERE token_hash = ? AND used_at IS NULL").run(tokenHash);
  }

  countEarlyAccess(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS n FROM early_access_signups").get() as { n?: number } | undefined;
    return Number(row?.n ?? 0);
  }

  reserveEarlyAccess(input: { email: string; name: string; orderId: string; limit: number; now?: number }): EarlyAccessReserve {
    const now = input.now ?? Date.now();
    const email = input.email.trim().toLowerCase();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = asEarlyAccess(this.db.prepare("SELECT * FROM early_access_signups WHERE email = ?").get(email));
      if (existing) {
        this.db.exec("COMMIT");
        return { result: "exists", orderId: existing.order_id, emailStatus: existing.email_status };
      }
      if (this.countEarlyAccess() >= input.limit) {
        this.db.exec("COMMIT");
        return { result: "full" };
      }
      this.db
        .prepare(
          `INSERT INTO early_access_signups (email, name, order_id, email_status, created_at, updated_at)
           VALUES (?, ?, ?, NULL, ?, ?)`,
        )
        .run(email, input.name, input.orderId, now, now);
      this.db.exec("COMMIT");
      return { result: "created", orderId: input.orderId, emailStatus: null };
    } catch (error) {
      this.rollback();
      if (isUniqueConstraint(error)) {
        const existing = asEarlyAccess(this.db.prepare("SELECT * FROM early_access_signups WHERE email = ?").get(email));
        if (existing) return { result: "exists", orderId: existing.order_id, emailStatus: existing.email_status };
      }
      throw error;
    }
  }

  setEarlyAccessEmailStatus(email: string, status: string) {
    this.db.prepare("UPDATE early_access_signups SET email_status = ?, updated_at = ? WHERE email = ?").run(status, Date.now(), email.trim().toLowerCase());
  }

  private isEarlyAccessOrder(orderId: string): boolean {
    const order = asOrder(this.db.prepare("SELECT * FROM orders WHERE order_id = ?").get(orderId));
    if (!order) return false;
    return this.allowsEarlyAccessReissue(orderId, order.currency, order.capture_id || "");
  }

  private allowsEarlyAccessReissue(orderId: string, currency: string, captureId: string): boolean {
    if (currency === "EARLY" || captureId === "early-access") return true;
    const signup = this.db.prepare("SELECT 1 AS present FROM early_access_signups WHERE order_id = ?").get(orderId);
    return Boolean(signup);
  }

  private rollback() {
    try {
      this.db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
  }
}

let singleton: CommerceStore | null = null;

export function getStore(dataDir: string): CommerceStore {
  if (singleton) return singleton;
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "commerce.sqlite"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      capture_id TEXT,
      payer_email TEXT,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      email_status TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS download_tokens (
      token_hash TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      lock_until INTEGER,
      sealed_token TEXT,
      download_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_download_tokens_order ON download_tokens(order_id);
    CREATE TABLE IF NOT EXISTS early_access_signups (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      order_id TEXT NOT NULL UNIQUE,
      email_status TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  const tokenColumns = db.prepare("PRAGMA table_info(download_tokens)").all() as Array<{ name?: string }>;
  if (!tokenColumns.some((column) => column.name === "download_count")) {
    db.exec("ALTER TABLE download_tokens ADD COLUMN download_count INTEGER NOT NULL DEFAULT 0");
  }
  singleton = new CommerceStore(db);
  return singleton;
}

export function resetStoreForTests() {
  singleton = null;
}
