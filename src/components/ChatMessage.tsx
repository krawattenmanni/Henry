import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, CodeArtifact } from '../types';
import { GeminiSparkle } from './GeminiSparkle';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  Cpu,
  FileCode,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Globe,
  ExternalLink,
  Search,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenArtifact: (artifact: CodeArtifact) => void;
  activeArtifactId?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onOpenArtifact,
  activeArtifactId,
}) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopyMessage = () => {
    triggerHaptic(10);
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end py-3 px-3 sm:px-6">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl bg-[#282a2c] text-[#e3e3e3] px-5 py-3 border border-[#3c4043]/40 shadow-xs">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const hasSources = message.grounding && message.grounding.sources && message.grounding.sources.length > 0;
  const hasQueries = message.grounding && message.grounding.webSearchQueries && message.grounding.webSearchQueries.length > 0;

  return (
    <div className="flex flex-col py-4 px-3 sm:px-6 hover:bg-[#1e1f20]/20 transition-colors">
      <div className="max-w-4xl w-full mx-auto space-y-3">
        {/* Gemini Response Header */}
        <div className="flex items-center justify-between text-xs text-[#8e918f]">
          <div className="flex items-center gap-2">
            <GeminiSparkle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm bg-gradient-to-r from-[#4285F4] to-[#BA68C8] bg-clip-text text-transparent">
              {message.modelUsed || 'Gemini'}
            </span>
            {hasSources && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1e1f20] border border-[#4285F4]/40 text-[#a8c7fa] text-[10px] font-medium">
                <Globe className="w-3 h-3 text-[#4285F4]" />
                <span>Web Grounded</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#8e918f]">
            {message.tokensPerSec !== undefined && (
              <span className="flex items-center gap-1 font-mono text-[#a8c7fa]">
                <Zap className="w-3 h-3 text-[#4285F4]" />
                {message.tokensPerSec} t/s
              </span>
            )}
            {message.tokens !== undefined && (
              <span className="font-mono text-[#8e918f]">{message.tokens} tokens</span>
            )}
          </div>
        </div>

        {/* Collapsible Thinking Process */}
        {message.thinking && (
          <div className="border border-[#3c4043]/60 rounded-2xl bg-[#1e1f20]/60 overflow-hidden text-xs">
            <button
              onClick={() => { triggerHaptic(10); setShowThinking(!showThinking); }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-[#c4c7c5] hover:text-white transition"
            >
              <div className="flex items-center gap-2 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#9B72CF]" />
                <span>Thinking Process</span>
              </div>
              {showThinking ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showThinking && (
              <div className="px-3.5 pb-3 text-[#c4c7c5] font-mono text-[11px] leading-relaxed border-t border-[#3c4043]/40 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Formatted Content */}
        <div className="text-sm leading-relaxed text-[#e3e3e3] space-y-3.5 pl-0.5">
          {renderFormattedContent(message.content)}
        </div>

        {/* Live Web Grounding Sources & Citations */}
        {hasSources && (
          <div className="mt-3 pt-2 border-t border-[#3c4043]/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#c4c7c5]">
                <Globe className="w-3.5 h-3.5 text-[#4285F4]" />
                <span>Research Sources ({message.grounding!.sources.length})</span>
              </div>
              <button
                onClick={() => setShowSources(!showSources)}
                className="text-[11px] text-[#8e918f] hover:text-white"
              >
                {showSources ? 'Hide' : 'Show'}
              </button>
            </div>

            {hasQueries && showSources && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#8e918f] uppercase font-mono">Searched:</span>
                {message.grounding!.webSearchQueries!.map((q, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1e1f20] border border-[#3c4043] text-[11px] text-[#8e918f]"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>{q}</span>
                  </span>
                ))}
              </div>
            )}

            {showSources && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] hover:border-[#52565a] transition group text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#282a2c] group-hover:bg-[#37393b] flex items-center justify-center shrink-0 text-[#a8c7fa] mt-0.5">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-[#e3e3e3] group-hover:text-[#a8c7fa] truncate">
                          {src.title || hostname}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#8e918f] truncate">
                          <span>{hostname}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Interactive Gemini Canvas / Artifact Cards */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="space-y-2 pt-2">
            {message.artifacts.map((art) => {
              const isActive = activeArtifactId === art.id;
              const isVisual = art.type === 'html-preview' || art.type === 'svg';

              return (
                <div
                  key={art.id}
                  onClick={() => { triggerHaptic(15); onOpenArtifact(art); }}
                  className={`group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1e1f20] border-[#9B72CF] shadow-lg ring-1 ring-[#9B72CF]/50'
                      : 'bg-[#1e1f20] border-[#3c4043] hover:border-[#52565a] hover:bg-[#282a2c]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isVisual
                          ? 'bg-gradient-to-br from-[#4285F4]/20 to-[#9B72CF]/20 text-[#a8c7fa] border border-[#4285F4]/40'
                          : 'bg-[#282a2c] text-[#e3e3e3] border border-[#3c4043]'
                      }`}
                    >
                      {isVisual ? <Play className="w-4 h-4 fill-current" /> : <FileCode className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {art.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#131314] text-[#a8c7fa] border border-[#3c4043]/40">
                          {art.language}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e918f] truncate mt-0.5">
                        {isVisual ? 'Interactive app sandbox ready to run in Gemini Canvas' : 'Source code artifact'}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white shadow-xs'
                        : 'bg-[#282a2c] text-[#c4c7c5] group-hover:bg-[#37393b] group-hover:text-white'
                    }`}
                  >
                    <span>{isVisual ? 'Run in Canvas' : 'View Code'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Gemini Feedback & Action Toolbar */}
        <div className="flex items-center gap-2 pt-2 text-[#8e918f]">
          <button
            onClick={handleCopyMessage}
            className="p-1.5 rounded-full hover:bg-[#282a2c] hover:text-[#e3e3e3] transition"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { triggerHaptic(10); setLiked(liked === true ? null : true); }}
            className={`p-1.5 rounded-full hover:bg-[#282a2c] transition ${liked === true ? 'text-[#a8c7fa]' : 'hover:text-[#e3e3e3]'}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => { triggerHaptic(10); setLiked(liked === false ? null : false); }}
            className={`p-1.5 rounded-full hover:bg-[#282a2c] transition ${liked === false ? 'text-rose-400' : 'hover:text-[#e3e3e3]'}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function renderFormattedContent(text: string): React.ReactNode {
  const clean = text.replace(/<antArtifact[\s\S]*?<\/antArtifact>/gi, '').trim();
  if (!clean) return null;

  const paragraphs = clean.split('\n\n');

  return (
    <>
      {paragraphs.map((para, i) => {
        // Code block
        if (para.startsWith('```') && para.endsWith('```')) {
          const lines = para.split('\n');
          const lang = lines[0].replace('```', '') || 'code';
          const code = lines.slice(1, -1).join('\n');

          return (
            <div key={i} className="my-2.5 rounded-2xl bg-[#1e1f20] border border-[#3c4043] overflow-hidden font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#282a2c]/60 border-b border-[#3c4043] text-[#c4c7c5] text-[11px]">
                <span className="font-mono">{lang}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    triggerHaptic(10);
                  }}
                  className="hover:text-white"
                >
                  Copy code
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[#e3e3e3] leading-relaxed">{code}</pre>
            </div>
          );
        }

        // Headings
        if (para.startsWith('### ')) {
          return (
            <h4 key={i} className="text-sm font-semibold text-[#a8c7fa] pt-1">
              {para.replace('### ', '')}
            </h4>
          );
        }
        if (para.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-semibold text-white pt-1">
              {para.replace('## ', '')}
            </h3>
          );
        }

        // Bullet lists
        if (para.includes('\n- ') || para.startsWith('- ')) {
          const items = para.split('\n').filter((l) => l.trim().startsWith('- '));
          return (
            <ul key={i} className="list-disc list-inside space-y-1.5 text-[#c4c7c5] text-xs sm:text-sm pl-1">
              {items.map((it, idx) => (
                <li key={idx} className="leading-relaxed">
                  {it.replace(/^- /, '')}
                </li>
              ))}
            </ul>
          );
        }

        // Standard text
        return (
          <p key={i} className="text-[#e3e3e3] leading-relaxed text-xs sm:text-sm">
            {para}
          </p>
        );
      })}
    </>
  );
}
