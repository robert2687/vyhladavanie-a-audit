export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
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
    const preview = text.trim().slice(0, 100);
    const msg =
      response.status === 404
        ? `Požadovaný koncový bod nebol nájdený (HTTP 404).`
        : `Neplatná odpoveď zo servera (HTTP ${response.status}). ${
            preview ? `Namiesto JSON prišlo: "${preview}..."` : "Odpoveď bola prázdna."
          }`;
    throw new HttpError(msg, response.status);
  }

  if (!response.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Server vrátil chybu (HTTP ${response.status})`;
    throw new HttpError(msg, response.status);
  }

  return data as T;
}
