export type LLMModelId =
  | 'gemini-online'
  | 'builtin-offline-coder'
  | 'qwen2.5-coder-0.5b'
  | 'smollm2-360m'
  | 'llama-3.2-1b';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GroundingMetadata {
  sources: GroundingSource[];
  webSearchQueries?: string[];
}

export interface ModelInfo {
  id: LLMModelId;
  name: string;
  tagline: string;
  sizeMB: number;
  vramMB: number;
  isBuiltIn: boolean;
  isOnline?: boolean;
  mlcModelId?: string;
  description: string;
  recommendedFor: string;
}

export interface CodeArtifact {
  id: string;
  title: string;
  language: string;
  type: 'code' | 'html-preview' | 'svg' | 'markdown' | 'diff';
  content: string;
  originalContent?: string;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;
  artifacts?: CodeArtifact[];
  grounding?: GroundingMetadata;
  tokens?: number;
  tokensPerSec?: number;
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId: LLMModelId;
  systemPrompt?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  language: string;
  content: string;
  size: number;
  lastModified: number;
}

export interface AppSettings {
  hapticFeedback: boolean;
  fontSize: 'sm' | 'base' | 'lg';
  autoRunPreview: boolean;
  defaultModelId: LLMModelId;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  developerKeyboardBar: boolean;
  enableWebSearch: boolean;
}

export interface WebGPUStatus {
  supported: boolean;
  adapterName?: string;
  vendor?: string;
  architecture?: string;
  device?: boolean;
  error?: string;
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number;
  text: string;
  downloadedBytes?: number;
  totalBytes?: number;
}
