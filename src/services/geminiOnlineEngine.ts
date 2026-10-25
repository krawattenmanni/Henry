import { GroundingMetadata } from '../types';

export async function runGeminiOnlineInference({
  message,
  history = [],
  enableSearch = true,
  systemInstruction,
  onToken,
  onGrounding,
  signal,
}: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  enableSearch?: boolean;
  systemInstruction?: string;
  onToken: (token: string, accumulated: string) => void;
  onGrounding?: (grounding: GroundingMetadata) => void;
  signal?: AbortSignal;
}): Promise<{ fullText: string; tokensGenerated: number; tokensPerSec: number; grounding?: GroundingMetadata }> {
  const startTime = performance.now();
  let accumulated = '';
  let tokenCount = 0;
  let groundingData: GroundingMetadata | undefined;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      enableSearch,
      systemInstruction,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Server Error (${response.status}): ${errText || response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported by browser or response body is empty.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
      if (!jsonStr) continue;

      try {
        const data = JSON.parse(jsonStr);

        if (data.type === 'delta' && data.text) {
          accumulated += data.text;
          tokenCount += Math.ceil(data.text.length / 3.8);
          onToken(data.text, accumulated);
        } else if (data.type === 'grounding') {
          groundingData = {
            sources: data.sources || [],
            webSearchQueries: data.queries || [],
          };
          onGrounding?.(groundingData);
        } else if (data.type === 'done') {
          // Stream completed cleanly
        } else if (data.type === 'error') {
          throw new Error(data.error);
        }
      } catch (e: any) {
        if (e.message && e.message.includes('Gemini API Error')) {
          throw e;
        }
      }
    }
  }

  const durationSec = Math.max(0.1, (performance.now() - startTime) / 1000);
  const tokensPerSec = Math.round(tokenCount / durationSec);

  return {
    fullText: accumulated,
    tokensGenerated: Math.max(1, tokenCount),
    tokensPerSec,
    grounding: groundingData,
  };
}
