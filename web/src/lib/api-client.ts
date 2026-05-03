// Client-side API helper for web dashboard
// Uses Clerk's session token for auth (same Bearer token as mobile)

export async function apiRequest(
  path: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let err;
    try {
      err = JSON.parse(text);
    } catch {
      err = { error: text || `HTTP ${res.status}` };
    }
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

export async function uploadImage(
  file: File,
  getToken: () => Promise<string | null>,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const data = await apiRequest("/api/upload", { method: "POST", body: form }, getToken);
  return data.url;
}

export async function generatePhotoshoot(
  params: {
    jewellery_image_url: string;
    template_id: string;
    prompt: string;
    additional_notes?: string;
    aspect_ratio: string;
    quality: string;
  },
  getToken: () => Promise<string | null>,
): Promise<{ image_url: string; job_id: string }> {
  return apiRequest(
    "/api/photoshoot",
    { method: "POST", body: JSON.stringify(params) },
    getToken,
  );
}

export async function listJobs(
  getToken: () => Promise<string | null>,
) {
  const data = await apiRequest("/api/jobs", {}, getToken);
  return data.jobs;
}

export async function getTokenBalance(
  getToken: () => Promise<string | null>,
): Promise<{ plan: string; tokens_granted: number; tokens_used: number; tokens_balance: number }> {
  return apiRequest("/api/tokens", {}, getToken);
}

export async function listFavorites(
  getToken: () => Promise<string | null>,
): Promise<string[]> {
  const data = await apiRequest("/api/favorites", {}, getToken);
  return data.favorites ?? [];
}

export async function toggleFavoriteDB(
  templateId: string,
  getToken: () => Promise<string | null>,
): Promise<{ action: "added" | "removed"; template_id: string }> {
  return apiRequest(
    "/api/favorites",
    { method: "POST", body: JSON.stringify({ template_id: templateId }) },
    getToken,
  );
}
