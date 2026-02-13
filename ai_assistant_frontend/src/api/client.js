/**
 * API client utilities for the FastAPI backend.
 *
 * NOTE: The currently published OpenAPI spec only includes GET / (health check).
 * This file is structured so we can add more endpoint wrappers as soon as the backend
 * publishes them (e.g., /assistant/query, /places/search, /directions, etc.).
 */

const DEFAULT_BASE_URL = "";

/**
 * Resolve API base URL.
 * - If REACT_APP_BACKEND_URL is set, use it (recommended for deployments).
 * - Otherwise fall back to same-origin (useful when dev server proxies requests).
 */
function getApiBaseUrl() {
  return process.env.REACT_APP_BACKEND_URL || DEFAULT_BASE_URL;
}

/**
 * Perform a fetch with sensible defaults and robust error messaging.
 */
async function apiFetch(path, init = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  let res;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  } catch (e) {
    throw new Error("Network error while contacting backend.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Backend error (${res.status}): ${text || res.statusText || "Unknown error"}`,
    );
  }

  // Health endpoint returns {} in current spec; attempt JSON but tolerate empty
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

// PUBLIC_INTERFACE
export async function apiHealthCheck() {
  /** Check backend availability. Returns parsed response or throws. */
  return apiFetch("/", { method: "GET" });
}
