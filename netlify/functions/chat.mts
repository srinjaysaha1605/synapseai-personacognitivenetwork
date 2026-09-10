import type { Config } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

function getGenAI(): GoogleGenAI {
  const apiKey =
    (typeof Netlify !== 'undefined' && Netlify.env?.get('GEMINI_API_KEY')) ||
    process.env.GEMINI_API_KEY;
  const baseUrl =
    (typeof Netlify !== 'undefined' && Netlify.env?.get('GOOGLE_GEMINI_BASE_URL')) ||
    process.env.GOOGLE_GEMINI_BASE_URL;

  const clientOptions: Record<string, any> = {};
  if (apiKey) {
    clientOptions.apiKey = apiKey;
  }
  if (baseUrl) {
    clientOptions.httpOptions = { baseUrl };
  }
  return new GoogleGenAI(clientOptions);
}

// Candidate models in descending order of capabilities
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

// Fallback quotes mapping per persona ID
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

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, persona, model: requestedModel, temperature } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid messages payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const primaryModel = requestedModel || 'gemini-3.8-flash';
  const modelsToTry = Array.from(new Set([primaryModel, ...CANDIDATE_MODELS]));
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const sendRaw = (str: string) => {
        controller.enqueue(encoder.encode(str));
      };

      try {
        const ai = getGenAI();

        let systemInstruction =
          persona?.systemInstruction || 'You are a helpful AI assistant.';
        systemInstruction += `\n\nCRITICAL SYSTEM RULES:
1. Speak in a natural, authentic tone matching your designated persona.
2. DO NOT use generic AI disclaimers ("As an AI...", "I am a language model...", "I don't have feelings").
3. DO NOT output overly formal, repetitive, or sterile bullet-point lists unless structurally required.
4. Keep answers concise, direct, and impactful unless the user explicitly requests deep detail.
5. Strictly adhere to your persona's forbidden behaviors and interaction rules.`;

        const rawMessages = Array.isArray(messages) ? messages : [];
        let formattedContents = rawMessages
          .map((m: any) => {
            const role = m.role === 'assistant' ? 'model' : 'user';
            const contentStr =
              typeof m.content === 'string'
                ? m.content.trim()
                : String(m.content || '').trim();
            if (!contentStr) return null;
            return {
              role,
              parts: [{ text: contentStr }],
            };
          })
          .filter(
            (item): item is { role: string; parts: Array<{ text: string }> } =>
              item !== null
          );

        if (formattedContents.length === 0) {
          formattedContents = [{ role: 'user', parts: [{ text: 'Hello' }] }];
        }

        let successfulStream = false;

        for (const currentModel of modelsToTry) {
          try {
            console.log(`[Synapse AI Function] Attempting model: ${currentModel}`);
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
                sendEvent({
                  type: 'meta',
                  modelUsed: currentModel,
                  personaId: persona?.id || 'default',
                  timestamp: startTime,
                });
              }

              if (chunk.text) {
                sendEvent({ chunk: chunk.text });
              }
            }

            if (streamStarted) {
              break;
            }
          } catch (modelError: any) {
            const errMsg =
              modelError?.message ||
              modelError?.status ||
              modelError?.code ||
              String(modelError);
            console.warn(
              `[Synapse AI Function] Model ${currentModel} failed: ${errMsg}. Trying next fallback model...`
            );
          }
        }

        if (!successfulStream) {
          console.error(
            '[Synapse AI Function] All candidate models unavailable. Emitting persona graceful quote.'
          );
          const personaQuote =
            persona?.fallbackQuote ||
            (persona?.id ? FALLBACK_QUOTES[persona.id] : null) ||
            DEFAULT_FALLBACK_QUOTE;

          sendEvent({
            type: 'meta',
            modelUsed: 'fallback-quote',
            personaId: persona?.id || 'default',
            timestamp: startTime,
          });
          sendEvent({ chunk: personaQuote });
        }

        const elapsedMs = Date.now() - startTime;
        sendEvent({
          type: 'end',
          thinkingTimeMs: elapsedMs,
        });
        sendRaw('data: [DONE]\n\n');
      } catch (error: any) {
        console.error('Error in Netlify chat function:', error);
        const personaQuote =
          persona?.fallbackQuote ||
          (persona?.id ? FALLBACK_QUOTES[persona.id] : null) ||
          DEFAULT_FALLBACK_QUOTE;
        sendEvent({ chunk: personaQuote });
        sendRaw('data: [DONE]\n\n');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
};

export const config: Config = {
  path: '/api/chat',
  preferStatic: false,
};
