/**
 * Base URL for the Express API (GraphQL, /api/*, /auth/*).
 * Set VITE_BACKEND_URL at build time when the API is not at http://localhost:3000.
 */
export function getBackendBaseUrl(): string {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    "";
  const base = (raw || "http://localhost:3000").replace(/\/$/, "");
  return base;
}
