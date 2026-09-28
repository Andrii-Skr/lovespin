import "server-only";

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: remoteIp,
        }),
        signal: AbortSignal.timeout(6_000),
        cache: "no-store",
      },
    );

    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    return result.success;
  } catch {
    return false;
  }
}
