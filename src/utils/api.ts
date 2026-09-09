export interface ApiError extends Error {
  status?: number;
  rawText?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    const trimmed = text.trim();
    const isHtmlOr404Page =
      response.status === 404 ||
      trimmed.includes("NOT_FOUND") ||
      trimmed.includes("The page could not be found") ||
      trimmed.toLowerCase().includes("<!doctype html>") ||
      trimmed.toLowerCase().includes("<html");

    const errMessage = isHtmlOr404Page
      ? `Serverový API endpoint nebol nájdený (HTTP 404). Backend server nie je spustený alebo API trasa neexistuje.`
      : `Neplatná odpoveď zo servera (HTTP ${response.status}). ${
          trimmed ? `Odpoveď neobsahuje platný JSON format.` : "Odpoveď bola prázdna."
        }`;

    const err: ApiError = new Error(errMessage);
    err.status = response.status;
    err.rawText = text;
    throw err;
  }

  if (!response.ok || data?.success === false) {
    const err: ApiError = new Error(
      data?.error ||
        data?.message ||
        `Server vrátil chybu (HTTP ${response.status})`
    );
    err.status = response.status;
    throw err;
  }

  return data as T;
}
