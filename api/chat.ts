import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// 1. Inlined helper logic & SDK initialization (zero relative local imports)
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI(apiKey ? { apiKey } : {});
  }
  return aiClient;
}

// Candidate models in preference order (only 3.8 flash and 3.7 flash)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
];

// Fallback quotes mapping per persona ID in case of offline/unavailable model
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

// 2. Vercel Serverless Default Handler
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Safely parse body if sent as string or object
  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    body = {};
  }

  const { messages, persona, model: requestedModel, temperature } = body;

  // Set SSE response headers for real-time streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const startTime = Date.now();
  const personaQuote =
    persona?.fallbackQuote ||
    (persona?.id ? FALLBACK_QUOTES[persona.id] : null) ||
    DEFAULT_FALLBACK_QUOTE;

  // Gracefully handle missing GEMINI_API_KEY
  if (!process.env.GEMINI_API_KEY) {
    res.write(
      `data: ${JSON.stringify({
        type: 'meta',
        modelUsed: 'offline-mode',
        personaId: persona?.id || 'default',
        timestamp: startTime,
      })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ chunk: personaQuote })}\n\n`);
    res.write(
      `data: ${JSON.stringify({
        type: 'end',
        thinkingTimeMs: Date.now() - startTime,
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const ai = getGenAI();

    // Construct system instruction combining persona attributes & guardrails
    let systemInstruction = persona?.systemInstruction || 'You are an insightful AI assistant.';
    systemInstruction += `\n\nCRITICAL SYSTEM RULES:
1. Speak in a natural, authentic tone matching your designated persona.
2. DO NOT use generic AI disclaimers ("As an AI...", "I am a language model...").
3. DO NOT output overly formal or sterile bullet lists unless explicitly requested.
4. Keep answers concise, direct, and impactful.
5. Strictly adhere to your persona's interaction style and reasoning principles.`;

    // Format conversation history for Gemini SDK
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

    if (formattedContents.length === 0) {
      formattedContents = [{ role: 'user', parts: [{ text: 'Hello' }] }];
    }

    // Determine candidate models (only gemini-3.8-flash and gemini-3.7-flash)
    const validModels = ['gemini-3.8-flash', 'gemini-3.7-flash'];
    const primaryModel = validModels.includes(requestedModel) ? requestedModel : 'gemini-3.8-flash';
    const modelsToTry = [primaryModel, primaryModel === 'gemini-3.8-flash' ? 'gemini-3.7-flash' : 'gemini-3.8-flash'];

    let successfulStream = false;

    for (const currentModel of modelsToTry) {
      try {
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
          break; // Stream succeeded with currentModel
        }
      } catch (err: any) {
        console.warn(`[Synapse AI /api/chat] Model ${currentModel} failed:`, err?.message || err);
      }
    }

    // If all models failed, emit fallback persona response
    if (!successfulStream) {
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
    return res.end();
  } catch (error: any) {
    console.error('[Synapse AI /api/chat] Handler error:', error);
    res.write(`data: ${JSON.stringify({ chunk: personaQuote })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }
}
