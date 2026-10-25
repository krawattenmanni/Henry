import { Conversation, ProjectFile, AppSettings, LLMModelId, ModelInfo } from '../types';

const CONVERSATIONS_KEY = 'gemini_offline_conversations';
const ACTIVE_CONV_KEY = 'gemini_offline_active_conv';
const SETTINGS_KEY = 'gemini_offline_settings';
const PROJECT_FILES_KEY = 'gemini_offline_project_files';

export const DEFAULT_SETTINGS: AppSettings = {
  hapticFeedback: true,
  fontSize: 'base',
  autoRunPreview: true,
  defaultModelId: 'gemini-online',
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 3000,
  developerKeyboardBar: true,
  enableWebSearch: true,
  systemPrompt: `You are Complexity, a versatile all-rounder AI assistant, research companion, and master developer with live Google Search capabilities. You excel at natural conversations, complex explanations, gaming (especially Minecraft Bedrock addons, mods, behavior packs, resource packs, and scripting), creative writing, math, science, and coding. When the user asks for code, web apps, or Minecraft addons, provide complete, working code and wrap major files into interactive artifacts with filenames. When performing web research, seamlessly integrate facts and cite sources.`,
};

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-online',
    name: 'Complexity Prime (Online + Search)',
    tagline: 'Live Web Research • Verified Citations • All-Rounder',
    sizeMB: 0,
    vramMB: 0,
    isBuiltIn: false,
    isOnline: true,
    description: 'Connected with live Google Search Grounding. Answers any question, conducts research with clickable source links, and builds Minecraft Bedrock mods, web apps, and scripts.',
    recommendedFor: 'Real-time research, Minecraft Bedrock modding, gaming, live events, deep Q&A, and full-stack coding.',
  },
  {
    id: 'builtin-offline-coder',
    name: 'Complexity Nano (Offline Built-in)',
    tagline: '100% Offline • 0 MB Download • Airplane Mode Ready',
    sizeMB: 0,
    vramMB: 0,
    isBuiltIn: true,
    isOnline: false,
    description: 'Instant zero-download on-device intelligence. Conversational chatting, questions, and code synthesis with zero internet connection.',
    recommendedFor: 'When disconnected, traveling, in airplane mode, or on low battery.',
  },
  {
    id: 'qwen2.5-coder-0.5b',
    name: 'Complexity Qwen Coder (WebGPU)',
    tagline: '350 MB • Local Neural LLM • Offline Code Engine',
    sizeMB: 350,
    vramMB: 650,
    isBuiltIn: false,
    isOnline: false,
    mlcModelId: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
    description: 'Local quantized model running inside your mobile browser via WebGPU. High precision coding and technical reasoning cached on your phone.',
    recommendedFor: 'Android phones with WebGPU (Chrome 121+). Offline local model inference.',
  },
  {
    id: 'smollm2-360m',
    name: 'Complexity Smol 360M (WebGPU)',
    tagline: '210 MB • Ultra-compact • Low Battery Usage',
    sizeMB: 210,
    vramMB: 400,
    isBuiltIn: false,
    isOnline: false,
    mlcModelId: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    description: 'Compact mobile on-device LLM. Quick conversational responses with minimal memory footprint.',
    recommendedFor: 'Lightweight Android devices and fast offline chatting.',
  },
  {
    id: 'llama-3.2-1b',
    name: 'Complexity Llama 1B (WebGPU)',
    tagline: '750 MB • Meta Local LLM • Deep Reasoning',
    sizeMB: 750,
    vramMB: 1200,
    isBuiltIn: false,
    isOnline: false,
    mlcModelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    description: 'Comprehensive mobile instruction-following model with rich conversational depth and creative text generation.',
    recommendedFor: 'Mid-to-high-end Android phones with 4GB+ RAM and WebGPU.',
  },
];

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load conversations:', err);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations:', err);
  }
}

export function getActiveConversationId(): string | null {
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

export function setActiveConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_CONV_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONV_KEY);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredProjectFiles(): ProjectFile[] {
  try {
    const raw = localStorage.getItem(PROJECT_FILES_KEY);
    if (!raw) return getDefaultStarterFiles();
    return JSON.parse(raw);
  } catch (err) {
    return getDefaultStarterFiles();
  }
}

export function saveProjectFiles(files: ProjectFile[]): void {
  try {
    localStorage.setItem(PROJECT_FILES_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Failed to save project files:', err);
  }
}

export function triggerHaptic(duration = 15): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore unsupported
  }
}

function getDefaultStarterFiles(): ProjectFile[] {
  return [
    {
      id: 'file-bedrock-manifest',
      name: 'manifest.json',
      language: 'json',
      size: 420,
      lastModified: Date.now(),
      content: `{
  "format_version": 2,
  "header": {
    "name": "Custom Gem Mod (BP)",
    "description": "Custom Bedrock Behavior Pack with new items and mechanics",
    "uuid": "4f9d4538-9281-4328-9843-f6d8924b1234",
    "version": [1, 0, 0],
    "min_engine_version": [1, 20, 0]
  },
  "modules": [
    {
      "type": "data",
      "uuid": "9c8e1245-8142-4912-8412-a7d9124c5678",
      "version": [1, 0, 0]
    }
  ]
}`,
    },
    {
      id: 'file-utils-py',
      name: 'algorithms.py',
      language: 'python',
      size: 450,
      lastModified: Date.now(),
      content: `"""
Useful Algorithms & Utilities
"""
from typing import List, Dict, Any

def quick_sort(arr: List[int]) -> List[int]:
    """In-place style recursive quicksort."""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

if __name__ == '__main__':
    sample = [42, 17, 93, 8, 24, 65, 3]
    print("Sorted:", quick_sort(sample))`,
    },
  ];
}
