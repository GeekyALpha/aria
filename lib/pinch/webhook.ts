import "server-only";
import crypto from "node:crypto";

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  ts?: number;
}

/**
 * Verify a Pinch webhook signature header `pinch-signature: t=<epoch>,v2=<hex hmac>`.
 * HMAC-SHA256 over `${t}.${rawBody}` keyed with the webhook secret (whsec_…),
 * compared in constant time, with a clock-skew tolerance window.
 */
export function verifyPinchSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  toleranceMs = 300_000,
): VerifyResult {
  if (!signatureHeader) return { ok: false, reason: "missing pinch-signature header" };

  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((kv) => kv.trim().split("="))
      .filter((p): p is [string, string] => p.length === 2 && !!p[0] && !!p[1]),
  );
  const t = Number(parts.t);
  const v2 = parts.v2;
  if (!Number.isFinite(t) || !v2) return { ok: false, reason: "malformed signature" };

  if (Math.abs(Date.now() - t * 1000) > toleranceMs) {
    return { ok: false, reason: "timestamp outside tolerance" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v2);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid hmac" };
  }
  return { ok: true, ts: t };
}

export function getWebhookSecret(): string {
  const secret = process.env.PINCH_WEBHOOK_SECRET;
  if (!secret) throw new Error("PINCH_WEBHOOK_SECRET is not set");
  return secret;
}
