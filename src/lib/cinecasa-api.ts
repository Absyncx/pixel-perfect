export type CineCasaHealth = {
  ok: boolean;
  service: string;
  version: string;
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
};

const DEFAULT_BASE_URL = "";

export function getCineCasaBaseUrl() {
  return localStorage.getItem("cinecasa.serverUrl") || DEFAULT_BASE_URL;
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
