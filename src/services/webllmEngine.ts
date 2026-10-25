import { ModelDownloadProgress } from '../types';

let webllmModule: any = null;
let currentEngine: any = null;
let currentLoadedModel: string | null = null;

export async function getWebLLM() {
  if (!webllmModule) {
    webllmModule = await import('@mlc-ai/web-llm');
  }
  return webllmModule;
}

export async function isModelLoaded(modelId: string): Promise<boolean> {
  return currentLoadedModel === modelId && currentEngine !== null;
}

export async function initWebLLMEngine(
  mlcModelId: string,
  onProgress?: (progress: ModelDownloadProgress) => void
): Promise<any> {
  if (currentEngine && currentLoadedModel === mlcModelId) {
    return currentEngine;
  }

  const wllm = await getWebLLM();

  const initProgressCallback = (report: any) => {
    if (onProgress) {
      let progressVal = 0;
      if (typeof report.progress === 'number') {
        progressVal = Math.min(1, Math.max(0, report.progress));
      }
      onProgress({
        modelId: mlcModelId,
        progress: progressVal,
        text: report.text || 'Preparing model...',
      });
    }
  };

  try {
    currentEngine = await wllm.CreateMLCEngine(mlcModelId, {
      initProgressCallback,
      logLevel: 'WARN',
    });
    currentLoadedModel = mlcModelId;
    return currentEngine;
  } catch (err: any) {
    currentEngine = null;
    currentLoadedModel = null;
    throw new Error(err?.message || 'Failed to initialize WebGPU local model.');
  }
}

export async function runWebLLMInference({
  mlcModelId,
  messages,
  temperature = 0.3,
  topP = 0.9,
  maxTokens = 2048,
  onToken,
  signal,
}: {
  mlcModelId: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  onToken: (token: string, accumulated: string) => void;
  signal?: AbortSignal;
}): Promise<{ fullText: string; tokensGenerated: number; tokensPerSec: number }> {
  const engine = await initWebLLMEngine(mlcModelId);

  const startTime = performance.now();
  let accumulated = '';
  let tokenCount = 0;

  const asyncChunkGenerator = await engine.chat.completions.create({
    messages,
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of asyncChunkGenerator) {
    if (signal?.aborted) {
      break;
    }
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      accumulated += delta;
      tokenCount += 1;
      onToken(delta, accumulated);
    }
  }

  const durationSec = (performance.now() - startTime) / 1000;
  const tokensPerSec = durationSec > 0 ? Math.round(tokenCount / durationSec) : tokenCount;

  return {
    fullText: accumulated,
    tokensGenerated: tokenCount,
    tokensPerSec,
  };
}

export function unloadCurrentModel(): void {
  if (currentEngine && currentEngine.unload) {
    try {
      currentEngine.unload();
    } catch {
      // Ignore unload error
    }
  }
  currentEngine = null;
  currentLoadedModel = null;
}
