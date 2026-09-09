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
    throw new Error(
      `Neplatná odpoveď zo servera (HTTP ${response.status}). ${
        preview ? `Namiesto JSON prišlo: "${preview}..."` : "Odpoveď bola prázdna."
      }`
    );
  }

  if (!response.ok && data?.success === false) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Server vrátil chybu (HTTP ${response.status})`
    );
  }

  return data as T;
}
