/**
 * Returns a safe Ionicons icon name.
 * Rejects emoji characters, non-ASCII strings, and known invalid names
 * that can come from AI/DB data.
 */
const ICON_BLOCKLIST = new Set([
  "brain", "yoga", "dumbbell", "meditation", "stretching",
]);

export function safeIcon(name: string | null | undefined, fallback = "star-outline"): string {
  if (!name || typeof name !== "string") return fallback;
  // Reject anything with non-ASCII (emojis, unicode symbols)
  if (/[^\x00-\x7F]/.test(name)) return fallback;
  if (ICON_BLOCKLIST.has(name)) return fallback;
  return name;
}
