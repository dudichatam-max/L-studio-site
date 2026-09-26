import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

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

  complete(tokenHash: string) {
    this.db
      .prepare("UPDATE download_tokens SET used_at = ?, lock_until = NULL, sealed_token = NULL WHERE token_hash = ? AND used_at IS NULL")
      .run(Date.now(), tokenHash);
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
      sealed_token TEXT
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
  singleton = new CommerceStore(db);
  return singleton;
}

export function resetStoreForTests() {
  singleton = null;
}
