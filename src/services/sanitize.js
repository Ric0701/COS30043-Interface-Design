/**
 * Simple client-side sanitizer to prevent raw HTML, script injections, and malformed tags
 * from reaching the database.
 */
export function sanitizeString(val) {
  if (typeof val !== "string") {
    return val;
  }
  // Strip script tags and HTML tags
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
