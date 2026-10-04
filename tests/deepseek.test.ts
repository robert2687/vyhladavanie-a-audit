import { callAIProvider } from "../server";
import assert from "node:assert";

// Mock global fetch to inspect request body payload sent to DeepSeek API
let lastFetchCall: { url: string; options: any } | null = null;

globalThis.fetch = (async (url: string, options: any) => {
  lastFetchCall = { url, options };
  return {
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        choices: [{ message: { content: "OK" } }],
      }),
  };
}) as any;

async function runTests() {
  console.log("Testing callAIProvider DeepSeek payloads...");

  // Test 1: deepseek-chat model (standard system & user messages)
  lastFetchCall = null;
  await callAIProvider({
    provider: "deepseek",
    apiKey: "dummy-key",
    model: "deepseek-chat",
    systemInstruction: "You are a helpful assistant.",
    prompt: "Hello world",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  const chatBody = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(chatBody.model, "deepseek-chat");
  assert.deepStrictEqual(chatBody.messages, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello world" },
  ]);
  console.log("✓ deepseek-chat test passed");

  // Test 2: deepseek-reasoner model (systemInstruction merged into user prompt)
  lastFetchCall = null;
  await callAIProvider({
    provider: "deepseek",
    apiKey: "dummy-key",
    model: "deepseek-reasoner",
    systemInstruction: "You are a reasoning assistant.",
    prompt: "Solve this math problem",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  const reasonerBody = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(reasonerBody.model, "deepseek-reasoner");
  assert.deepStrictEqual(reasonerBody.messages, [
    {
      role: "user",
      content: "You are a reasoning assistant.\n\nSolve this math problem",
    },
  ]);
  console.log("✓ deepseek-reasoner test passed");

  // Test 3: deepseek-reasoner without systemInstruction
  lastFetchCall = null;
  await callAIProvider({
    provider: "deepseek",
    apiKey: "dummy-key",
    model: "deepseek-reasoner",
    systemInstruction: "",
    prompt: "Solve this without system instruction",
  });

  assert.ok(lastFetchCall, "fetch should have been called");
  const reasonerBodyNoSys = JSON.parse(lastFetchCall!.options.body);
  assert.strictEqual(reasonerBodyNoSys.model, "deepseek-reasoner");
  assert.deepStrictEqual(reasonerBodyNoSys.messages, [
    {
      role: "user",
      content: "Solve this without system instruction",
    },
  ]);
  console.log("✓ deepseek-reasoner without system instruction test passed");

  console.log("ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
