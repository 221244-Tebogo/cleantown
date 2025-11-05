// services/openai-dev.ts
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY!;
const MODEL = "gpt-4o-mini";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function openaiChatDev(messages: ChatMessage[]) {
  if (!API_KEY?.startsWith("sk-")) {
    throw new Error("Missing OpenAI key in EXPO_PUBLIC_OPENAI_KEY (sk-...).");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
