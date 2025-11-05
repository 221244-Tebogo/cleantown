export function nameFromEmail(email?: string | null) {
  if (!email) return null;
  const raw = email.split("@")[0] ?? "";
  if (!raw) return null;
  return raw
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
