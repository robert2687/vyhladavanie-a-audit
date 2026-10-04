export interface ApiError extends Error {
  status?: number;
  rawText?: string;
import { readLanguage, translator } from '../i18n';
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
  const t = translator(readLanguage());
  const headers = new Headers(init?.headers);
  headers.set('x-ui-language', readLanguage());
  const url = typeof input === 'string' && input.startsWith('/api/') ? `${process.env.REACT_APP_BACKEND_URL}${input}` : input;
  const response = await fetch(url, { credentials: "include", ...init, headers });
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
    const msg = readLanguage() === 'en'
      ? `Invalid server response (HTTP ${response.status}). Please try again.`
      : `Neplatná odpoveď zo servera (HTTP ${response.status}). Skúste znova.`;
    throw new HttpError(msg, response.status);
  }

  if (!response.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (readLanguage() === 'en' ? `Server error (HTTP ${response.status})` : `Server vrátil chybu (HTTP ${response.status})`);
    throw new HttpError(t(msg), response.status);
  }

  return data as T;
}
