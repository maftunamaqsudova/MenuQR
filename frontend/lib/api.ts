export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5107";
const TOKEN_KEY = "qrmenu_token";

export const tokenStore = {
  get: () =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
} | null;

function extractMessage(data: ErrorBody, status: number): string {
  if (data?.message) return data.message;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  if (status === 429) return "Too many requests. Please wait a minute and try again.";
  if (status === 401) return "Please log in again.";
  return "Something went wrong. Please try again.";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // JSON by default; file uploads (FormData) set their own content type
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Please try again.");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, extractMessage(data, res.status));

  return data as T;
}

// Images are stored as relative paths like /media/restaurant-1/abc.jpg
// This adds the backend address in front so the browser can load them.
export function imageUrl(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}