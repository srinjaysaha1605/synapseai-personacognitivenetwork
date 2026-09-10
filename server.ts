import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for GoogleGenAI SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set!');
    }
    const clientOptions: Record<string, any> = {};
    if (apiKey) clientOptions.apiKey = apiKey;
    if (baseUrl) clientOptions.httpOptions = { baseUrl };
    aiClient = new GoogleGenAI(clientOptions);
  }
  return aiClient;
}

// Top candidate models list in descending order of capabilities & recency
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Fallback quotes mapping per persona ID in case all API model calls fail
const FALLBACK_QUOTES: Record<string, string> = {
  devils_advocate:
    'Even the most resilient systems encounter points of friction. Let us re-examine our assumptions while the network stabilizes.',
  socratic:
    'Silence, too, is a space for contemplation. What questions arise when the immediate answer is paused?',
  skeptic:
    'Signal variance detected across primary channels. Data stream temporarily interrupted; maintaining observational baseline.',
  strategist:
    'Every sound strategy accounts for unexpected bottlenecks. Regrouping computational resources for the next execution phase.',
  philosopher:
    'In the brief pause between inquiry and response, understanding matures. Patience remains the discipline of reason.',
  cybernetic:
    'Feedback loop saturation detected in primary node. Rerouting network packets through secondary channels.',
};
const DEFAULT_FALLBACK_QUOTE =
  'Signal temporarily disrupted. Stand by while memory channels synchronize.';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Chat Streaming API Route (SSE)
app.post('/api/chat', async (req, res) => {
  const { messages, persona, model: requestedModel, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages payload' });
  }

  // Model selection hierarchy (start with requested model, then top available candidates)
  const primaryModel = requestedModel || 'gemini-3.8-flash';
  const modelsToTry = Array.from(new Set([primaryModel, ...CANDIDATE_MODELS]));

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const startTime = Date.now();

  try {
    const ai = getGenAI();

    // Construct system instruction combining persona attributes
    let systemInstruction = persona?.systemInstruction || 'You are a helpful AI assistant.';

    // Append strict behavioral guardrails
    systemInstruction += `\n\nCRITICAL SYSTEM RULES:
1. Speak in a natural, authentic tone matching your designated persona.
2. DO NOT use generic AI disclaimers ("As an AI...", "I am a language model...", "I don't have feelings").
3. DO NOT output overly formal, repetitive, or sterile bullet-point lists unless structurally required.
4. Keep answers concise, direct, and impactful unless the user explicitly requests deep detail.
5. Strictly adhere to your persona's forbidden behaviors and interaction rules.`;

    // Format conversation history for Gemini API
    const rawMessages = Array.isArray(messages) ? messages : [];
    let formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = rawMessages
      .map((m: any) => {
        const role = m.role === 'assistant' ? 'model' : 'user';
        const contentStr = typeof m.content === 'string' ? m.content.trim() : String(m.content || '').trim();
        if (!contentStr) return null;
        return {
          role,
          parts: [{ text: contentStr }],
        };
      })
      .filter((item): item is { role: string; parts: Array<{ text: string }> } => item !== null);

    // Ensure contents is never empty
    if (formattedContents.length === 0) {
      formattedContents = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }],
        },
      ];
    }

    let successfulStream = false;

    // Loop through fallback models sequence
    for (const currentModel of modelsToTry) {
      try {
        console.log(`[Synapse AI] Attempting model: ${currentModel}`);
        const responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
          },
        });

        let streamStarted = false;
        for await (const chunk of responseStream) {
          if (!streamStarted) {
            streamStarted = true;
            successfulStream = true;

            // Send initial metadata event with active model
            res.write(
              `data: ${JSON.stringify({
                type: 'meta',
                modelUsed: currentModel,
                personaId: persona?.id || 'default',
                timestamp: startTime,
              })}\n\n`
            );
          }

          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          }
        }

        if (streamStarted) {
          break; // Successfully completed stream with currentModel
        }
      } catch (modelError: any) {
        const errMsg = modelError?.message || modelError?.status || modelError?.code || String(modelError);
        console.warn(
          `[Synapse AI] Model ${currentModel} failed: ${errMsg}. Trying next fallback model...`
        );
      }
    }

    // Graceful fallback if ALL models fail / high demand
    if (!successfulStream) {
      console.error('[Synapse AI] All candidate models unavailable. Emitting persona graceful quote.');
      const personaQuote =
        persona?.fallbackQuote ||
        (persona?.id ? FALLBACK_QUOTES[persona.id] : null) ||
        DEFAULT_FALLBACK_QUOTE;

      res.write(
        `data: ${JSON.stringify({
          type: 'meta',
          modelUsed: 'fallback-quote',
          personaId: persona?.id || 'default',
          timestamp: startTime,
        })}\n\n`
      );

      res.write(`data: ${JSON.stringify({ chunk: personaQuote })}\n\n`);
    }

    const elapsedMs = Date.now() - startTime;
    res.write(
      `data: ${JSON.stringify({
        type: 'end',
        thinkingTimeMs: elapsedMs,
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat handler:', error);
    const personaQuote =
      persona?.fallbackQuote ||
      (persona?.id ? FALLBACK_QUOTES[persona.id] : null) ||
      DEFAULT_FALLBACK_QUOTE;

    res.write(`data: ${JSON.stringify({ chunk: personaQuote })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Synapse AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
