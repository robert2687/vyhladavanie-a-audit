import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { app } from "./server";

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        baseUrl = `http://127.0.0.1:${address.port}`;
      } else {
        baseUrl = "http://127.0.0.1:3000";
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
});

async function postJson(path: string, body: any, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function getJson(path: string, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  return { status: response.status, data };
}

describe("Backend API Endpoints Verification", () => {
  it("GET /api/key-status returns status of provider API keys", async () => {
    const { status, data } = await getJson("/api/key-status");
    expect(status).toBe(200);
    expect(data).toHaveProperty("gemini");
    expect(data).toHaveProperty("anthropic");
    expect(data).toHaveProperty("perplexity");
    expect(data).toHaveProperty("nemotron");
    expect(data).toHaveProperty("deepseek");
    expect(data).toHaveProperty("openai");
    expect(data).toHaveProperty("grok");
    expect(data).toHaveProperty("hasEnvKey");
  });

  it("GET /api/system-instruction returns universal system prompt", async () => {
    const { status, data } = await getJson("/api/system-instruction");
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.systemInstruction).toBe("string");
    expect(data.systemInstruction).toContain("B2B Lead Generation");
  });

  it("POST /api/leads/search returns prospects (live or fallback)", async () => {
    const { status, data } = await postJson("/api/leads/search", {
      region: "Bratislavský kraj",
      industry: "Stavebníctvo",
      count: 2,
      language: "sk",
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.prospects)).toBe(true);
    expect(data.prospects.length).toBeGreaterThan(0);
    const prospect = data.prospects[0];
    expect(prospect).toHaveProperty("companyName");
    expect(prospect).toHaveProperty("website");
    expect(prospect).toHaveProperty("coldOutreach");
  });

  it("POST /api/audit/company performs deep company audit", async () => {
    const { status, data } = await postJson("/api/audit/company", {
      urlOrName: "https://www.in-vest.sk",
      industry: "Stavebníctvo",
      language: "sk",
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prospect).toBeDefined();
    expect(data.prospect.companyName).toBeDefined();
    expect(data.prospect.identifiedWebSignals.length).toBeGreaterThan(0);
  });

  it("POST /api/leads/refine-pitch returns refined cold pitch draft", async () => {
    const { status, data } = await postJson("/api/leads/refine-pitch", {
      companyName: "IN VEST s.r.o.",
      decisionMaker: "Ing. Peter Kováč",
      valueProposition: "Automatizovaný B2B intake formulár",
      tone: "direct",
      language: "sk",
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.subject).toBeDefined();
    expect(data.body).toBeDefined();
  });

  it("POST /api/validate-key handles invalid key gracefully with 400", async () => {
    const { status, data } = await postJson("/api/validate-key", {
      provider: "gemini",
      apiKey: "invalid_key_sample",
    });
    expect(status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.message).toBeDefined();
  });

  it("GET /api/export/python-script returns Python script", async () => {
    const response = await fetch(`${baseUrl}/api/export/python-script`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-python");
    const text = await response.text();
    expect(text).toContain("SYSTEM_INSTRUCTION");
  });
});
