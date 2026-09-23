import "server-only";
import { redirect } from "next/navigation";
import { getToken } from "./session";

function resolveApiUrl() {
  let url = (process.env.LASAN_API_URL ?? "http://localhost:4000").trim().replace(/\/+$/, "");
  // Tolerate a bare host like "api.example.com": assume https (http for localhost).
  if (!/^https?:\/\//i.test(url)) url = `${/^(localhost|127\.0\.0\.1)(:|$)/.test(url) ? "http" : "https"}://${url}`;
  return url;
}
const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? `Request failed (${status})`);
    this.status = status;
    this.code = body?.error?.code;
    this.fields = body?.error?.fields ?? {};
  }
}

/**
 * Server-side call to the Hono API with the session token attached.
 * The browser never talks to the API directly, so front and back can live on different hosts.
 */
export async function api(path, { method = "GET", body, token, query, clientIp } = {}) {
  const auth = token === undefined ? await getToken() : token;
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(auth ? { authorization: `Bearer ${auth}` } : {}),
        // The API only sees this server's address; pass the visitor's on for rate limiting.
        ...(clientIp ? { "x-lasan-client-ip": clientIp } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, { error: { message: "Can't reach the server right now. Please try again shortly.", code: "unreachable" } });
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

/**
 * For page loads: turns auth failures into redirects so pages only handle the happy path.
 */
export async function load(path, options) {
  try {
    return await api(path, options);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) redirect("/logout");
      if (err.code === "password_change_required") redirect("/change-password");
      if (err.status === 403 && /revoked/i.test(err.message)) redirect("/logout?reason=revoked");
    }
    throw err;
  }
}

/** Standard shape returned by server actions to useActionState. */
export function actionError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) redirect("/logout");
    return { ok: false, error: err.message, fields: err.fields };
  }
  throw err;
}
