"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api, actionError, ApiError } from "@/lib/api";
import { setSession, homeFor } from "@/lib/session";

// Only allow same-site relative paths as post-login targets.
const safeNext = (next, role) =>
  typeof next === "string" && next.startsWith(`/${role === "admin" ? "admin" : "employee"}`) && !next.startsWith("//") ? next : null;

export async function login(_prev, formData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const h = await headers();
  const clientIp = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || undefined;
  let res;
  try {
    res = await api("/auth/login", { method: "POST", body: { identifier, password }, token: null, clientIp });
  } catch (err) {
    // A 401 here means bad credentials, not an expired session, so don't use actionError's redirect.
    if (err instanceof ApiError) return { ok: false, error: err.message, fields: err.fields };
    throw err;
  }
  await setSession(res.token, res.user.role);
  if (res.user.mustChangePassword) redirect("/change-password");
  redirect(safeNext(formData.get("next"), res.user.role) ?? homeFor(res.user.role));
}

export async function changePassword(_prev, formData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword !== String(formData.get("confirmPassword") ?? "")) {
    return { ok: false, error: "Passwords don't match", fields: { confirmPassword: "Doesn't match the new password" } };
  }
  let res;
  try {
    res = await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
  } catch (err) {
    return actionError(err);
  }
  await setSession(res.token, res.user.role);
  redirect(`${homeFor(res.user.role)}?welcome=1`);
}
