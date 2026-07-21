import "server-only";

const TOKEN_URL = "https://auth.getpinch.com.au/connect/token";

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

export function isPinchConfigured(): boolean {
  return !!(process.env.PINCH_CLIENT_ID && process.env.PINCH_SECRET_KEY);
}

export async function getPinchToken(): Promise<string> {
  const clientId = process.env.PINCH_CLIENT_ID;
  const secretKey = process.env.PINCH_SECRET_KEY;
  if (!clientId || !secretKey) {
    throw new Error(
      "Pinch is not configured — set PINCH_CLIENT_ID and PINCH_SECRET_KEY in .env.local",
    );
  }

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  // Pinch OAuth2 client-credentials: Basic auth = Application ID : Secret Key
  const credentials = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "api1",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinch auth failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 3600) - 120) * 1000,
  };
  return cached.token;
}
