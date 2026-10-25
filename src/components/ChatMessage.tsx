import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, CodeArtifact } from '../types';
import { ComplexityPrism } from './ComplexityPrism';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  Cpu,
  FileCode,
  ThumbsUp,
  ThumbsDown,
  Globe,
  ExternalLink,
  Search,
  Volume2,
  Square,
  Loader2,
  Zap,
  ListChecks,
  BookOpen,
  Code2,
  Compass,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenArtifact: (artifact: CodeArtifact) => void;
  activeArtifactId?: string;
  onQuickAction?: (prompt: string) => void;
  isGenerating?: boolean;
}

function getContextualQuickActions(content: string): Array<{
  label: string;
  prompt: string;
  icon: React.FC<{ className?: string }>;
}> {
  const lower = content.toLowerCase();
  if (lower.includes('minecraft') || lower.includes('bedrock') || lower.includes('manifest.json')) {
    return [
      {
        label: 'Add crafting recipe',
        prompt: 'Add a shaped crafting table recipe and loot table drop for this Minecraft Bedrock addon.',
        icon: Code2,
      },
      {
        label: 'Generate Resource Pack',
        prompt: 'Generate the matching Minecraft Bedrock Resource Pack (RP) manifest, item_texture.json, and en_US.lang file.',
        icon: FileCode,
      },
      {
        label: 'Add Script API effect',
        prompt: 'Write a @minecraft/server Script API script that triggers a custom particle and potion effect on hit.',
        icon: Zap,
      },
      {
        label: 'Summarize install steps',
        prompt: 'Summarize the exact folder structure and .mcaddon installation steps in a quick checklist.',
        icon: ListChecks,
      },
    ];
  }

  return [
    {
      label: 'Summarize key points',
      prompt: 'Summarize the key points from your response into a concise, scannable bulleted list.',
      icon: ListChecks,
    },
    {
      label: 'Explain simpler',
      prompt: 'Explain this topic in simpler terms using a clear real-world analogy.',
      icon: BookOpen,
    },
    {
      label: 'Deep dive',
      prompt: 'Go deeper into the technical architecture, edge cases, and verification details of this topic.',
      icon: Compass,
    },
    {
      label: 'Code example',
      prompt: 'Provide a complete, runnable code example demonstrating this concept in practice.',
      icon: Code2,
    },
  ];
}

function extractSpeakableText(raw: string): string {
  return raw
    .replace(/<antArtifact[\s\S]*?<\/antArtifact>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onOpenArtifact,
  activeArtifactId,
  onQuickAction,
  isGenerating = false,
}) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourcesCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTtsState('idle');
  };

  const playWithBrowserSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsState('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setTtsState('playing');
      utterance.onend = () => setTtsState('idle');
      utterance.onerror = () => setTtsState('idle');

      setTtsState('playing');
      window.speechSynthesis.speak(utterance);
    } catch {
      setTtsState('idle');
    }
  };

  const handleToggleSpeech = async () => {
    triggerHaptic(10);

    if (ttsState === 'playing' || ttsState === 'loading') {
      stopSpeech();
      return;
    }

    const speakable = extractSpeakableText(message.content);
    if (!speakable) return;

    // Stop any other active speech before starting
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTtsState('loading');
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: speakable.slice(0, 1800), voiceName: 'Kore' }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.audioBase64) {
            const mime = data.mimeType || 'audio/wav';
            const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
            audioRef.current = audio;
            audio.onended = () => {
              setTtsState('idle');
              audioRef.current = null;
            };
            audio.onerror = () => {
              audioRef.current = null;
              playWithBrowserSpeech(speakable);
            };
            setTtsState('playing');
            await audio.play();
            return;
          }
        }
      } catch {
        // Fall through to browser Web Speech API
      }
    }

    playWithBrowserSpeech(speakable);
  };

  const handleCopyMessage = () => {
    triggerHaptic(10);
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end py-3 px-3 sm:px-6">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-zinc-900 text-zinc-100 px-4 py-3 border border-zinc-800 shadow-xs">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const hasSources = Boolean(message.grounding && message.grounding.sources && message.grounding.sources.length > 0);
  const hasQueries = Boolean(
    message.grounding && message.grounding.webSearchQueries && message.grounding.webSearchQueries.length > 0
  );
  const quickActions = getContextualQuickActions(message.content);

  return (
    <div className="flex flex-col py-4 px-3 sm:px-6 hover:bg-zinc-900/20 transition-colors">
      <div className="max-w-4xl w-full mx-auto space-y-3">
        {/* Complexity Response Header - Clean unboxed metadata with dot separators */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ComplexityPrism className="w-4 h-4 shrink-0" size={16} />
            <span className="font-semibold text-xs text-zinc-200">
              {message.modelUsed || 'Complexity'}
            </span>
            {hasSources && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSources(true);
                    sourcesCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition font-medium"
                >
                  <Globe className="w-3 h-3" />
                  <span>{message.grounding!.sources.length} Sources</span>
                </button>
              </>
            )}
            {message.tokensPerSec !== undefined && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono text-zinc-400">{message.tokensPerSec} t/s</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            {message.tokens !== undefined && (
              <span>{message.tokens} tokens</span>
            )}
          </div>
        </div>

        {/* Collapsible Thinking Process */}
        {message.thinking && (
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden text-xs">
            <button
              onClick={() => { triggerHaptic(10); setShowThinking(!showThinking); }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-zinc-400 hover:text-zinc-200 transition"
            >
              <div className="flex items-center gap-2 font-medium">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span>Thinking Process</span>
              </div>
              {showThinking ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showThinking && (
              <div className="px-3.5 pb-3 text-zinc-400 font-mono text-[11px] leading-relaxed border-t border-zinc-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Formatted Content */}
        <div className="text-sm leading-relaxed text-zinc-200 space-y-3.5 pl-0.5">
          {renderFormattedContent(message.content)}
        </div>

        {/* Grounded Search Results — Dedicated 'Sources' Card & Links */}
        {hasSources && (
          <div
            ref={sourcesCardRef}
            className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/65 p-3 sm:p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-semibold text-zinc-100">
                  Sources
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  ({message.grounding!.sources.length})
                </span>
                {!showSources && message.grounding!.sources[0] && (
                  <a
                    href={message.grounding!.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 truncate inline-flex items-center gap-1 ml-1"
                  >
                    <span className="truncate max-w-[180px] sm:max-w-[260px]">
                      {message.grounding!.sources[0].title}
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setShowSources(!showSources);
                }}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition shrink-0"
              >
                {showSources ? 'Hide sources' : 'View sources'}
              </button>
            </div>

            {showSources && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.grounding!.sources.map((src, idx) => {
                    let hostname = '';
                    try {
                      hostname = new URL(src.url).hostname.replace('www.', '');
                    } catch {
                      hostname = 'web';
                    }

                    return (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-950/70 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-zinc-700 transition group text-left"
                      >
                        <div className="w-5 h-5 rounded-md bg-zinc-800 group-hover:bg-cyan-950/80 border border-zinc-700/70 group-hover:border-cyan-500/40 flex items-center justify-center shrink-0 text-[10px] font-mono font-semibold text-cyan-400 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <div className="text-xs font-medium text-zinc-200 group-hover:text-cyan-300 truncate">
                            {src.title || hostname}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate mt-0.5">
                            <span className="truncate">{hostname}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60 group-hover:opacity-100 transition" />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {hasQueries && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/70 text-xs text-zinc-400">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Search queries:</span>
                    {message.grounding!.webSearchQueries!.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => {
                          if (onQuickAction) {
                            triggerHaptic(10);
                            onQuickAction(`Search the web and provide a detailed analysis on: ${q}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 hover:text-cyan-300 font-mono transition disabled:opacity-50"
                        title={`Run follow-up search for "${q}"`}
                      >
                        <Search className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Interactive Complexity Canvas / Artifact Cards */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="space-y-2 pt-2">
            {message.artifacts.map((art) => {
              const isActive = activeArtifactId === art.id;
              const isVisual = art.type === 'html-preview' || art.type === 'svg';

              return (
                <div
                  key={art.id}
                  onClick={() => { triggerHaptic(15); onOpenArtifact(art); }}
                  className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-900 border-cyan-500/70 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isVisual
                          ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isVisual ? <Play className="w-4 h-4 fill-current" /> : <FileCode className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-100 truncate">
                          {art.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          · {art.language}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {isVisual ? 'Interactive app sandbox ready in Complexity Canvas' : 'Source code artifact'}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-200 group-hover:bg-zinc-700 group-hover:text-white'
                    }`}
                  >
                    <span>{isVisual ? 'Open Canvas' : 'View Code'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions Bar */}
        {onQuickAction && message.content.trim().length > 0 && (
          <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    triggerHaptic(12);
                    onQuickAction(action.prompt);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback & Actions Toolbar */}
        <div className="flex items-center gap-1.5 pt-1 text-zinc-500 flex-wrap">
          <button
            type="button"
            onClick={handleToggleSpeech}
            disabled={!message.content.trim()}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              ttsState === 'playing'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : ttsState === 'loading'
                ? 'bg-zinc-800 text-zinc-300'
                : 'hover:bg-zinc-800 hover:text-zinc-200 text-zinc-400'
            }`}
            title={ttsState === 'playing' ? 'Stop reading aloud' : 'Listen to response'}
            aria-label={ttsState === 'playing' ? 'Stop reading aloud' : 'Listen to response'}
          >
            {ttsState === 'loading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Loading audio...</span>
              </>
            ) : ttsState === 'playing' ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </>
            )}
          </button>

          {hasSources && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setShowSources((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                showSources
                  ? 'bg-zinc-800/90 text-cyan-300 border border-zinc-700'
                  : 'hover:bg-zinc-800 hover:text-zinc-200 text-zinc-400'
              }`}
              title="Toggle grounded search sources"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sources ({message.grounding!.sources.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyMessage}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="Copy response"
            aria-label="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic(10); setLiked(liked === true ? null : true); }}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition ${liked === true ? 'text-cyan-400' : 'hover:text-zinc-200'}`}
            title="Helpful response"
            aria-label="Helpful response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic(10); setLiked(liked === false ? null : false); }}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition ${liked === false ? 'text-rose-400' : 'hover:text-zinc-200'}`}
            title="Unhelpful response"
            aria-label="Unhelpful response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function renderInlineMarkdown(text: string): React.ReactNode {
  // Split on **bold** and `inline code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[12px] text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderFormattedContent(text: string): React.ReactNode {
  const clean = text.replace(/<antArtifact[\s\S]*?<\/antArtifact>/gi, '').trim();
  if (!clean) return null;

  // First split by fenced code blocks
  const segments = clean.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {segments.map((segment, segIdx) => {
        const trimmedSeg = segment.trim();
        if (!trimmedSeg) return null;

        if (trimmedSeg.startsWith('```') && trimmedSeg.endsWith('```')) {
          const lines = trimmedSeg.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');

          return (
            <div
              key={segIdx}
              className="my-2.5 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden font-mono text-xs shadow-xs"
            >
              <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 text-[11px]">
                <span className="font-mono">{lang}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    triggerHaptic(10);
                  }}
                  className="hover:text-zinc-100 transition"
                >
                  Copy code
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-zinc-200 leading-relaxed">{code}</pre>
            </div>
          );
        }

        // Process non-code blocks line-by-line or paragraph-by-paragraph
        const blocks = trimmedSeg.split(/\n\n+/);
        return (
          <React.Fragment key={segIdx}>
            {blocks.map((block, bIdx) => {
              const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
              if (lines.length === 0) return null;

              return (
                <div key={bIdx} className="space-y-1.5">
                  {lines.map((line, lIdx) => {
                    if (line.startsWith('### ')) {
                      return (
                        <h4 key={lIdx} className="text-sm font-semibold text-cyan-400 pt-1">
                          {renderInlineMarkdown(line.replace(/^###\s+/, ''))}
                        </h4>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={lIdx} className="text-base font-semibold text-zinc-100 pt-1">
                          {renderInlineMarkdown(line.replace(/^##\s+/, ''))}
                        </h3>
                      );
                    }
                    if (line.startsWith('# ')) {
                      return (
                        <h2 key={lIdx} className="text-lg font-semibold text-zinc-100 pt-1">
                          {renderInlineMarkdown(line.replace(/^#\s+/, ''))}
                        </h2>
                      );
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-2 pl-1 text-zinc-300 text-xs sm:text-sm leading-relaxed">
                          <span className="text-cyan-400 select-none mt-0.5">•</span>
                          <span className="flex-1">{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</span>
                        </div>
                      );
                    }
                    if (/^\d+\.\s+/.test(line)) {
                      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
                      if (numMatch) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2 pl-1 text-zinc-300 text-xs sm:text-sm leading-relaxed">
                            <span className="text-cyan-400 font-mono text-xs select-none mt-0.5">{numMatch[1]}</span>
                            <span className="flex-1">{renderInlineMarkdown(numMatch[2])}</span>
                          </div>
                        );
                      }
                    }

                    return (
                      <p key={lIdx} className="text-zinc-200 leading-relaxed text-xs sm:text-sm">
                        {renderInlineMarkdown(line)}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
