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
            choices: [{ message: { content: "OK" } }],
          }),
      };
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("callAIProvider DeepSeek payloads", () => {
  it("sends system and user messages for deepseek-chat", async () => {
    await callAIProvider({
      provider: "deepseek",
      apiKey: "dummy-key",
      model: "deepseek-chat",
      systemInstruction: "You are a helpful assistant.",
      prompt: "Hello world",
    });

    expect(lastFetchCall).toBeTruthy();
    const chatBody = JSON.parse(lastFetchCall!.options.body);
    expect(chatBody.model).toBe("deepseek-chat");
    expect(chatBody.messages).toEqual([
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello world" },
    ]);
  });

  it("merges system instruction into the user prompt for deepseek-reasoner", async () => {
    await callAIProvider({
      provider: "deepseek",
      apiKey: "dummy-key",
      model: "deepseek-reasoner",
      systemInstruction: "You are a reasoning assistant.",
      prompt: "Solve this math problem",
    });

    expect(lastFetchCall).toBeTruthy();
    const reasonerBody = JSON.parse(lastFetchCall!.options.body);
    expect(reasonerBody.model).toBe("deepseek-reasoner");
    expect(reasonerBody.messages).toEqual([
      {
        role: "user",
        content: "You are a reasoning assistant.\n\nSolve this math problem",
      },
    ]);
  });

  it("omits empty system instructions for deepseek-reasoner", async () => {
    await callAIProvider({
      provider: "deepseek",
      apiKey: "dummy-key",
      model: "deepseek-reasoner",
      systemInstruction: "",
      prompt: "Solve this without system instruction",
    });

    expect(lastFetchCall).toBeTruthy();
    const reasonerBody = JSON.parse(lastFetchCall!.options.body);
    expect(reasonerBody.model).toBe("deepseek-reasoner");
    expect(reasonerBody.messages).toEqual([
      {
        role: "user",
        content: "Solve this without system instruction",
      },
    ]);
  });
});
