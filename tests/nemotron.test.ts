import { callAIProvider } from "../server";
import assert from "node:assert";

let lastFetchCall: { url: string; options: any } | null = null;

globalThis.fetch = (async (url: string, options: any) => {
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
}) as any;

async function runNemotronTests() {
  console.log("Testing callAIProvider Nemotron payloads...");

  // Test 1: NVIDIABuild-Autogen-33 model
  lastFetchCall = null;
  const resultAutogen = await callAIProvider({
    provider: "nemotron",
    apiKey: "nvapi-test-key",
    model: "NVIDIABuild-Autogen-33",
    systemInstruction: "You are a helpful assistant.",
    prompt: "Test prompt for Autogen model",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  assert.strictEqual(
    lastFetchCall!.url,
    "https://integrate.api.nvidia.com/v1/chat/completions"
  );
  const autogenBody = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(autogenBody.model, "NVIDIABuild-Autogen-33");
  assert.strictEqual(resultAutogen.model, "NVIDIABuild-Autogen-33");
  assert.strictEqual(resultAutogen.provider, "nemotron");
  assert.strictEqual(resultAutogen.text, "Nemotron Response");
  assert.strictEqual(
    lastFetchCall!.options.headers["Authorization"],
    "Bearer nvapi-test-key"
  );
  console.log("✓ NVIDIABuild-Autogen-33 nemotron test passed");

  // Test 2: Default Nemotron model (nvidia/nemotron-3.5-lightning-30b-a3b)
  lastFetchCall = null;
  const res1 = await callAIProvider({
    provider: "nemotron",
    apiKey: "nvapi-test-key",
    systemInstruction: "You are a helpful assistant.",
    prompt: "Write a limerick about GPU computing",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  assert.strictEqual(lastFetchCall!.url, "https://integrate.api.nvidia.com/v1/chat/completions");

  const body1 = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(body1.model, "nvidia/nemotron-3.5-lightning-30b-a3b");
  assert.strictEqual(body1.max_tokens, 16384);
  assert.deepStrictEqual(body1.extra_body, {
    chat_template_kwargs: { enable_thinking: true },
    reasoning_budget: 16384,
  });
  assert.strictEqual(res1.model, "nvidia/nemotron-3.5-lightning-30b-a3b");
  assert.strictEqual(res1.text, "Nemotron Response");
  console.log("✓ nemotron-3.5-lightning-30b-a3b default payload test passed");

  // Test 3: Legacy Nemotron model (nvidia/llama-3.1-nemotron-70b-instruct)
  lastFetchCall = null;
  const res2 = await callAIProvider({
    provider: "nemotron",
    apiKey: "nvapi-test-key",
    model: "nvidia/llama-3.1-nemotron-70b-instruct",
    systemInstruction: "You are a helpful assistant.",
    prompt: "Hello Nemotron 70B",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  const body2 = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(body2.model, "nvidia/llama-3.1-nemotron-70b-instruct");
  assert.strictEqual(body2.max_tokens, 4096);
  assert.strictEqual(body2.extra_body, undefined);
  assert.strictEqual(res2.model, "nvidia/llama-3.1-nemotron-70b-instruct");
  console.log("✓ llama-3.1-nemotron-70b-instruct payload test passed");

  console.log("ALL NEMOTRON TESTS PASSED!");
  process.exit(0);
}

runNemotronTests().catch((err) => {
  console.error("Nemotron Test failed:", err);
  process.exit(1);
});
