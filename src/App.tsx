/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  ChatMessage as ChatMessageType,
  CodeArtifact,
  ProjectFile,
  AppSettings,
  LLMModelId,
  WebGPUStatus,
  GroundingMetadata,
} from './types';
import {
  getStoredConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
  getStoredSettings,
  saveSettings,
  getStoredProjectFiles,
  saveProjectFiles,
  AVAILABLE_MODELS,
  triggerHaptic,
} from './services/storage';
import { checkWebGPUStatus } from './services/webgpu';
import { streamOfflineSynthesis, extractArtifacts } from './services/offlineSynthesizer';
import { runWebLLMInference } from './services/webllmEngine';
import { runGeminiOnlineInference } from './services/geminiOnlineEngine';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ArtifactViewer } from './components/ArtifactViewer';
import { ModelManagerModal } from './components/ModelManagerModal';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareTranscriptModal } from './components/ShareTranscriptModal';
import { ComplexityPrism } from './components/ComplexityPrism';
import {
  Sparkles,
  MessageCircle,
  Lightbulb,
  Gamepad2,
  Code2,
  Globe,
  Compass,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Gamepad2,
    color: 'text-emerald-400',
    title: 'Minecraft Bedrock Addon',
    prompt: 'Make a Minecraft Bedrock addon mod with a custom Ruby Sword, behavior pack manifest, and custom item components.',
  },
  {
    icon: Globe,
    color: 'text-sky-400',
    title: 'Live Web Research',
    prompt: 'Search the web for the latest updates on space exploration missions this year, and cite sources.',
  },
  {
    icon: Code2,
    color: 'text-pink-400',
    title: 'Interactive Web App',
    prompt: 'Build a retro arcade game in HTML5 Canvas with smooth touch controls.',
  },
  {
    icon: MessageCircle,
    color: 'text-purple-400',
    title: 'Chat & Explore',
    prompt: 'Hey! Explain the difference between quantum physics and classical mechanics in simple terms.',
  },
];

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [currentModelId, setCurrentModelId] = useState<LLMModelId>('gemini-online');
  const [webGPUStatus, setWebGPUStatus] = useState<WebGPUStatus>({ supported: false });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [projectFilesOpen, setProjectFilesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<CodeArtifact | null>(null);
  const [sharingConversation, setSharingConversation] = useState<Conversation | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initial load
  useEffect(() => {
    const loadedConvs = getStoredConversations();
    const storedActiveId = getActiveConversationId();
    const files = getStoredProjectFiles();
    const currentSettings = getStoredSettings();

    setSettings(currentSettings);
    setProjectFiles(files);
    setCurrentModelId(currentSettings.defaultModelId || 'gemini-online');

    if (loadedConvs.length > 0) {
      // Upgrade any stale default conversation from previous builds to Complexity with grounded sources
      if (
        loadedConvs.length === 1 &&
        loadedConvs[0].id === 'conv-welcome' &&
        (loadedConvs[0].title.includes('Gemini') ||
          loadedConvs[0].messages[0]?.content.includes('Gemini') ||
          !loadedConvs[0].messages[0]?.grounding)
      ) {
        const welcomeConv = createWelcomeConversation();
        setConversations([welcomeConv]);
        setActiveConvId(welcomeConv.id);
        saveConversations([welcomeConv]);
        if (welcomeConv.messages[0]?.artifacts?.[0] && window.innerWidth >= 1024) {
          setActiveArtifact(welcomeConv.messages[0].artifacts[0]);
        }
        return;
      }

      setConversations(loadedConvs);
      const matched = loadedConvs.find((c) => c.id === storedActiveId);
      if (matched) {
        setActiveConvId(matched.id);
        const lastArt = matched.messages.flatMap((m) => m.artifacts || []).pop();
        if (lastArt && window.innerWidth >= 1024) {
          setActiveArtifact(lastArt);
        }
      } else {
        setActiveConvId(loadedConvs[0].id);
      }
    } else {
      const welcomeConv = createWelcomeConversation();
      setConversations([welcomeConv]);
      setActiveConvId(welcomeConv.id);
      saveConversations([welcomeConv]);
      setActiveConversationId(welcomeConv.id);
      if (welcomeConv.messages[0]?.artifacts?.[0] && window.innerWidth >= 1024) {
        setActiveArtifact(welcomeConv.messages[0].artifacts[0]);
      }
    }

    checkWebGPUStatus().then((status) => {
      setWebGPUStatus(status);
    });
  }, []);

  useEffect(() => {
    setActiveConversationId(activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isGenerating]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      const lastArt = conv.messages.flatMap((m) => m.artifacts || []).pop();
      if (lastArt && window.innerWidth >= 1024) {
        setActiveArtifact(lastArt);
      } else {
        setActiveArtifact(null);
      }
    }
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: currentModelId,
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConvId(newConv.id);
    saveConversations(updated);
    setActiveArtifact(null);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    if (updated.length > 0) {
      setConversations(updated);
      saveConversations(updated);
      if (activeConvId === id) {
        setActiveConvId(updated[0].id);
        const lastArt = updated[0].messages.flatMap((m) => m.artifacts || []).pop();
        setActiveArtifact(lastArt && window.innerWidth >= 1024 ? lastArt : null);
      }
    } else {
      const freshConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: currentModelId,
      };
      setConversations([freshConv]);
      setActiveConvId(freshConv.id);
      saveConversations([freshConv]);
      setActiveArtifact(null);
    }
  };

  const handleClearAllConversations = () => {
    const freshConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: currentModelId,
    };
    setConversations([freshConv]);
    setActiveConvId(freshConv.id);
    saveConversations([freshConv]);
    setActiveArtifact(null);
  };

  const handleSendMessage = async (text: string, attachedFileIds: string[]) => {
    if (!text.trim() || isGenerating) return;

    let targetConv = activeConversation;
    if (!targetConv) {
      targetConv = {
        id: `conv-${Date.now()}`,
        title: text.slice(0, 32),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: currentModelId,
      };
      setConversations([targetConv, ...conversations]);
      setActiveConvId(targetConv.id);
    }

    const attachedFiles = projectFiles.filter((f) => attachedFileIds.includes(f.id));
    const userMessage: ChatMessageType = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsgId = `msg-assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessageType = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: AVAILABLE_MODELS.find((m) => m.id === currentModelId)?.name || 'Gemini 3.8 Flash',
    };

    const updatedTitle =
      targetConv.messages.length === 0
        ? text.slice(0, 34) + (text.length > 34 ? '...' : '')
        : targetConv.title;

    const newMessages = [...targetConv.messages, userMessage, initialAssistantMessage];
    const updatedConv = {
      ...targetConv,
      title: updatedTitle,
      updatedAt: Date.now(),
      messages: newMessages,
    };

    const newConversations = conversations.map((c) => (c.id === targetConv.id ? updatedConv : c));
    setConversations(newConversations);
    saveConversations(newConversations);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const selectedModel = AVAILABLE_MODELS.find((m) => m.id === currentModelId);

      let inferenceResult: {
        fullText: string;
        tokensGenerated: number;
        tokensPerSec: number;
        grounding?: GroundingMetadata;
      };

      if (currentModelId === 'gemini-online' || selectedModel?.isOnline) {
        // --- 1. Online Gemini API with Google Search Grounding & Sources ---
        let userPromptWithFiles = text;
        if (attachedFiles.length > 0) {
          userPromptWithFiles = `Attached project workspace files:\n${attachedFiles
            .map((f) => `// ${f.name}\n${f.content}`)
            .join('\n\n')}\n\nUser request: ${text}`;
        }

        const chatHistoryForOnline = targetConv.messages.slice(-8).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        let currentGrounding: GroundingMetadata | undefined;

        inferenceResult = await runGeminiOnlineInference({
          message: userPromptWithFiles,
          history: chatHistoryForOnline,
          enableSearch: settings.enableWebSearch !== false,
          systemInstruction: settings.systemPrompt,
          signal: abortControllerRef.current.signal,
          onToken: (chunk, accumulated) => {
            const parsed = extractArtifacts(accumulated);
            updateAssistantMessage(targetConv.id, assistantMsgId, {
              content: parsed.cleanedText,
              thinking: parsed.thinking,
              artifacts: parsed.artifacts,
              grounding: currentGrounding,
            });
          },
          onGrounding: (grounding) => {
            currentGrounding = grounding;
            updateAssistantMessage(targetConv.id, assistantMsgId, {
              grounding,
            });
          },
        });
      } else if (selectedModel?.isBuiltIn || !selectedModel?.mlcModelId || !webGPUStatus.supported) {
        // --- 2. Built-in Offline Fallback Engine ---
        inferenceResult = await streamOfflineSynthesis({
          prompt: text,
          conversationHistory: targetConv.messages.map((m) => ({ role: m.role, content: m.content })),
          projectFiles: attachedFiles,
          signal: abortControllerRef.current.signal,
          onToken: (chunk, accumulated) => {
            const parsed = extractArtifacts(accumulated);
            updateAssistantMessage(targetConv.id, assistantMsgId, {
              content: parsed.cleanedText,
              thinking: parsed.thinking,
              artifacts: parsed.artifacts,
            });
          },
        });
      } else {
        // --- 3. WebGPU Quantized Local Engine ---
        const systemPromptMsg = {
          role: 'system' as const,
          content: settings.systemPrompt,
        };
        const chatHistoryForModel = targetConv.messages.slice(-6).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        let userPromptWithFiles = text;
        if (attachedFiles.length > 0) {
          userPromptWithFiles = `Attached files:\n${attachedFiles
            .map((f) => `// ${f.name}\n${f.content}`)
            .join('\n\n')}\n\nUser request: ${text}`;
        }

        inferenceResult = await runWebLLMInference({
          mlcModelId: selectedModel.mlcModelId,
          messages: [systemPromptMsg, ...chatHistoryForModel, { role: 'user', content: userPromptWithFiles }],
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          signal: abortControllerRef.current.signal,
          onToken: (chunk, accumulated) => {
            const parsed = extractArtifacts(accumulated);
            updateAssistantMessage(targetConv.id, assistantMsgId, {
              content: parsed.cleanedText,
              thinking: parsed.thinking,
              artifacts: parsed.artifacts,
            });
          },
        });
      }

      const finalParsed = extractArtifacts(inferenceResult.fullText);
      updateAssistantMessage(targetConv.id, assistantMsgId, {
        content: finalParsed.cleanedText,
        thinking: finalParsed.thinking,
        artifacts: finalParsed.artifacts,
        grounding: inferenceResult.grounding,
        tokens: inferenceResult.tokensGenerated,
        tokensPerSec: inferenceResult.tokensPerSec,
      });

      if (finalParsed.artifacts.length > 0) {
        setActiveArtifact(finalParsed.artifacts[0]);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        // Generation was intentionally stopped by user
        return;
      }
      console.error('Inference error:', err);
      updateAssistantMessage(targetConv.id, assistantMsgId, {
        content: `Error: ${err?.message || 'Failed to complete request'}. Please try again.`,
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const updateAssistantMessage = (convId: string, msgId: string, partial: Partial<ChatMessageType>) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = c.messages.map((m) => {
          if (m.id !== msgId) return m;
          return { ...m, ...partial };
        });
        return { ...c, messages: msgs };
      });
      saveConversations(updated);
      return updated;
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleExportAll = () => {
    triggerHaptic(20);
    const data = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      conversations,
      projectFiles,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    triggerHaptic(20);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.conversations && Array.isArray(parsed.conversations)) {
          setConversations(parsed.conversations);
          saveConversations(parsed.conversations);
          if (parsed.conversations[0]) {
            setActiveConvId(parsed.conversations[0].id);
          }
        }
        if (parsed.projectFiles && Array.isArray(parsed.projectFiles)) {
          setProjectFiles(parsed.projectFiles);
          saveProjectFiles(parsed.projectFiles);
        }
      } catch (err) {
        console.error('Invalid backup JSON format:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveProjectFiles = (files: ProjectFile[]) => {
    setProjectFiles(files);
    saveProjectFiles(files);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d12] text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Complexity Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onShareConversation={(conv) => setSharingConversation(conv)}
        onClearAllConversations={handleClearAllConversations}
        onOpenModelManager={() => setModelManagerOpen(true)}
        onOpenProjectFiles={() => setProjectFilesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExportAll={handleExportAll}
        onImportData={handleImportData}
      />

      {/* Main Gemini Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Gemini Header */}
        <Header
          currentModelId={currentModelId}
          onSelectModel={(id) => setCurrentModelId(id)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenModelManager={() => setModelManagerOpen(true)}
          onOpenProjectFiles={() => setProjectFilesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onShareActiveConversation={() => {
            if (activeConversation) {
              setSharingConversation(activeConversation);
            }
          }}
          projectFilesCount={projectFiles.length}
          webGPUStatus={webGPUStatus}
        />

        {/* Content Area: Chat feed & Canvas Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Chat Stream */}
          <div
            className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-200 ${
              activeArtifact ? 'hidden md:flex md:w-1/2' : 'w-full'
            }`}
          >
            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeConversation && activeConversation.messages.length > 0 ? (
                <div className="pb-4">
                  {activeConversation.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onOpenArtifact={(art) => {
                        setActiveArtifact(art);
                      }}
                      activeArtifactId={activeArtifact?.id}
                      onQuickAction={(prompt) => handleSendMessage(prompt, [])}
                      isGenerating={isGenerating}
                    />
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 py-3 px-6 text-xs text-zinc-400 font-mono animate-pulse">
                      <ComplexityPrism className="w-4 h-4" size={16} />
                      <span>Complexity is synthesizing answer...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              ) : (
                /* Complexity Workspace Welcome Screen */
                <div className="h-full flex flex-col justify-center max-w-3xl mx-auto px-4 py-8">
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <ComplexityPrism className="w-7 h-7" size={28} />
                      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
                        Complexity
                      </h1>
                    </div>
                    <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                      All-rounder intelligence engine for grounded web research, Minecraft Bedrock addons, full-stack coding, and open inquiry.
                    </p>
                  </div>

                  {/* Suggestion Prompts Grid - Clean Unboxed Design */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTIONS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            triggerHaptic(15);
                            handleSendMessage(item.prompt, []);
                          }}
                          className="flex flex-col text-left p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-colors group active:scale-98"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">{item.title}</span>
                            <Icon className={`w-3.5 h-3.5 ${item.color} opacity-80 group-hover:opacity-100`} />
                          </div>
                          <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2 leading-relaxed">
                            {item.prompt}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Floating Gemini Input Bar */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGeneration={handleStopGeneration}
              projectFiles={projectFiles}
              showDevToolbar={settings.developerKeyboardBar}
            />
          </div>

          {/* Gemini Canvas Artifact Viewer */}
          {activeArtifact && (
            <ArtifactViewer
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
              isMobileSheet={true}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ModelManagerModal
        isOpen={modelManagerOpen}
        onClose={() => setModelManagerOpen(false)}
        currentModelId={currentModelId}
        onSelectModel={(id) => setCurrentModelId(id)}
        webGPUStatus={webGPUStatus}
      />

      <ProjectFilesModal
        isOpen={projectFilesOpen}
        onClose={() => setProjectFilesOpen(false)}
        files={projectFiles}
        onSaveFiles={handleSaveProjectFiles}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <ShareTranscriptModal
        conversation={sharingConversation}
        onClose={() => setSharingConversation(null)}
      />
    </div>
  );
}

function createWelcomeConversation(): Conversation {
  return {
    id: `conv-welcome`,
    title: 'Welcome to Complexity',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    modelId: 'gemini-online',
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Welcome to **Complexity**.

I'm your all-rounder AI assistant, research companion, and developer engine. Here's what we can accomplish:

- 🎮 **Minecraft Bedrock Addons & Mods**: Complete custom Behavior Packs (BP), Resource Packs (RP), custom items, weapon stats, recipes, and Android installation instructions.
- 🌐 **Live Web Research with Sources**: Current events, research papers, technology breakthroughs, and science topics with verified source citations.
- ⚡ **Full Code & Interactive Canvas**: Build and test HTML5 Canvas apps, games, utilities, and scripts in real time.
- 💬 **Open Inquiry & Problem Solving**: Deep discussions, reasoning, math, philosophy, and creative projects.
- 📱 **Offline Ready**: Toggle to offline neural engines anytime you need zero-connectivity on-device execution.

What would you like to explore or build?`,
        timestamp: Date.now(),
        tokens: 350,
        tokensPerSec: 52,
        modelUsed: 'Complexity Prime (Online + Search)',
        grounding: {
          sources: [
            {
              title: 'Minecraft Bedrock Creator Documentation — Add-Ons & Custom Items',
              url: 'https://learn.microsoft.com/en-us/minecraft/creator/documents/itemcreation',
            },
            {
              title: 'MDN Web Docs — HTML5 Canvas & WebGPU Specifications',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
            },
          ],
          webSearchQueries: [
            'minecraft bedrock addon creator documentation',
            'interactive html5 canvas web development',
          ],
        },
      },
    ],
  };
}
