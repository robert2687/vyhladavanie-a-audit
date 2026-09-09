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
        choices: [{ message: { content: "OK from Nemotron" } }],
      }),
  };
}) as any;

async function runTests() {
  console.log("Testing callAIProvider Nemotron/NVIDIA payloads...");

  // Test 1: nemotron provider with NVIDIABuild-Autogen-33 model
  lastFetchCall = null;
  const result = await callAIProvider({
    provider: "nemotron",
    apiKey: "dummy-key",
    model: "NVIDIABuild-Autogen-33",
    systemInstruction: "You are a helpful assistant.",
    prompt: "Test prompt for Autogen model",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  assert.strictEqual(
    lastFetchCall!.url,
    "https://integrate.api.nvidia.com/v1/chat/completions"
  );

  const reqBody = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(reqBody.model, "NVIDIABuild-Autogen-33");
  assert.strictEqual(result.model, "NVIDIABuild-Autogen-33");
  assert.strictEqual(result.provider, "nemotron");
  assert.strictEqual(result.text, "OK from Nemotron");

  const authHeader = lastFetchCall!.options.headers["Authorization"];
  assert.strictEqual(
    authHeader,
    "Bearer dummy-key"
  );

  console.log("✓ NVIDIABuild-Autogen-33 nemotron test passed");
  console.log("ALL NEMOTRON TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
