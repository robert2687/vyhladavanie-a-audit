import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callAIProvider } from "../server";

let lastFetchCall: { url: string; options: any } | null = null;

beforeEach(() => {
  lastFetchCall = null;
  vi.stubGlobal(
    "fetch",
    async (url: string, options: any) => {
      lastFetchCall = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "Nemotron Response",
                  reasoning_content: "Thought process for GPU computing",
                },
              },
            ],
          }),
      };
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("callAIProvider Nemotron/NVIDIA payloads", () => {
  it("sends custom NVIDIABuild-Autogen-33 payloads", async () => {
    const resultAutogen = await callAIProvider({
      provider: "nemotron",
      apiKey: "nvapi-test-key",
      model: "NVIDIABuild-Autogen-33",
      systemInstruction: "You are a helpful assistant.",
      prompt: "Test prompt for Autogen model",
    });

    expect(lastFetchCall).toBeTruthy();
    expect(lastFetchCall!.url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    const autogenBody = JSON.parse(lastFetchCall!.options.body);
    expect(autogenBody.model).toBe("NVIDIABuild-Autogen-33");
    expect(resultAutogen.model).toBe("NVIDIABuild-Autogen-33");
    expect(resultAutogen.provider).toBe("nemotron");
    expect(resultAutogen.text).toBe("Nemotron Response");
    expect(lastFetchCall!.options.headers.Authorization).toBe("Bearer nvapi-test-key");
  });

  it("uses the default Nemotron 3.5 reasoning payload", async () => {
    const result = await callAIProvider({
      provider: "nemotron",
      apiKey: "nvapi-test-key",
      systemInstruction: "You are a helpful assistant.",
      prompt: "Write a limerick about GPU computing",
    });

    expect(lastFetchCall).toBeTruthy();
    expect(lastFetchCall!.url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");

    const body = JSON.parse(lastFetchCall!.options.body);
    expect(body.model).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
    expect(body.max_tokens).toBe(16384);
    expect(body.extra_body).toEqual({
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: 16384,
    });
    expect(result.model).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
    expect(result.text).toBe("Nemotron Response");
  });

  it("uses the legacy Nemotron 70B payload without reasoning extras", async () => {
    const result = await callAIProvider({
      provider: "nemotron",
      apiKey: "nvapi-test-key",
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
      systemInstruction: "You are a helpful assistant.",
      prompt: "Hello Nemotron 70B",
    });

    expect(lastFetchCall).toBeTruthy();
    const body = JSON.parse(lastFetchCall!.options.body);
    expect(body.model).toBe("nvidia/llama-3.1-nemotron-70b-instruct");
    expect(body.max_tokens).toBe(4096);
    expect(body.extra_body).toBeUndefined();
    expect(result.model).toBe("nvidia/llama-3.1-nemotron-70b-instruct");
  });
});
