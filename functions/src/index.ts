// functions/src/index.ts

import cors from "cors";
import express from "express";
import * as functions from "firebase-functions";
import OpenAI from "openai";

// Keep the key in Firebase config, not in code!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY env var");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// POST /chat  { messages: [{role: 'user'|'assistant'|'system', content: string}] }
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // Cheap, fast, good: gpt-4o-mini (supports tools/vision later if you need)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    res.json({ reply: text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
});
export { assignReport, updateReportStatus } from "./reports";

export const api = functions
  .region("us-central1")
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onRequest(app);
