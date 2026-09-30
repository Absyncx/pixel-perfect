export type CineCasaHealth = {
  ok: boolean;
  service: string;
  version: string;
};

export type CineCasaProfile = {
  id: number;
  name: string;
  avatar: string | null;
};

export type CatalogTitle = {
  id: number;
  type: "movie" | "series";
  title: string;
  original_title: string | null;
  year: number | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  file_count: number;
  media_file_id: number | null;
};

const DEFAULT_BASE_URL = (import.meta.env.VITE_CINECASA_SERVER_URL || "").trim().replace(/\/$/, "");

export function getCineCasaBaseUrl() {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  const stored = localStorage.getItem("cinecasa.serverUrl")?.trim();
  return (stored || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export async function cineCasaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getCineCasaBaseUrl().replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`CineCasa Server: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function checkCineCasaServer() {
  return cineCasaFetch<CineCasaHealth>("/api/health");
}

export async function getCatalog() {
  return cineCasaFetch<CatalogTitle[]>("/api/catalog");
}

export async function getProfiles() {
  return cineCasaFetch<CineCasaProfile[]>("/api/profiles");
}

export type CineCasaProgress = {
  position_seconds: number;
  duration_seconds: number | null;
  completed: number;
  updated_at: string | null;
};

export function getMediaUrl(mediaFileId: number) {
  const base = getCineCasaBaseUrl().replace(/\/$/, "");
  return `${base}/api/media/${mediaFileId}`;
}

export async function getProgress(profileId: number, mediaFileId: number) {
  return cineCasaFetch<CineCasaProgress>(`/api/progress?profileId=${profileId}&mediaFileId=${mediaFileId}`);
}

export async function saveProgress(profileId: number, mediaFileId: number, positionSeconds: number, durationSeconds: number | null, completed = false) {
  const base = getCineCasaBaseUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/progress`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, mediaFileId, positionSeconds, durationSeconds, completed }),
  });
  if (!response.ok && response.status !== 204) throw new Error(`CineCasa Server: HTTP ${response.status}`);
}


export async function getMyList(profileId: number) {
  return cineCasaFetch<CatalogTitle[]>(`/api/my-list?profileId=${profileId}`);
}

export async function addToMyList(profileId: number, titleId: number) {
  return cineCasaFetch<{ ok: boolean }>("/api/my-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, titleId }),
  });
}

export async function removeFromMyList(profileId: number, titleId: number) {
  return cineCasaFetch<{ ok: boolean }>(`/api/my-list?profileId=${profileId}&titleId=${titleId}`, {
    method: "DELETE",
  });
}
