import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, Code2, Globe, Gamepad2, Compass, Zap } from 'lucide-react';
import { MobileCodeToolbar } from './MobileCodeToolbar';
import { ProjectFile } from '../types';
import { triggerHaptic } from '../services/storage';

const INPUT_QUICK_ACTIONS = [
  {
    label: 'Web Research',
    icon: Globe,
    prompt: 'Search the web for the latest breakthroughs in renewable energy and solid-state batteries, with cited sources.',
  },
  {
    label: 'Bedrock Addon',
    icon: Gamepad2,
    prompt: 'Make a Minecraft Bedrock addon mod with a custom Ruby Sword, behavior pack manifest, and crafting recipe.',
  },
  {
    label: 'HTML5 Canvas App',
    icon: Code2,
    prompt: 'Build an interactive HTML5 Canvas particle physics simulation with mouse and touch controls.',
  },
  {
    label: 'Deep Explain',
    icon: Compass,
    prompt: 'Explain how transformer neural networks and attention mechanisms work with clear examples.',
  },
];

interface ChatInputProps {
  onSendMessage: (text: string, attachedFileIds: string[]) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  projectFiles: ProjectFile[];
  showDevToolbar: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  projectFiles,
  showDevToolbar,
}) => {
  const [text, setText] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isGenerating) return;

    triggerHaptic(20);
    onSendMessage(text.trim(), selectedFileIds);
    setText('');
    setSelectedFileIds([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (window.innerWidth >= 768) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    setText(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 0);
  };

  const toggleFileAttachment = (fileId: string) => {
    triggerHaptic(10);
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const estimatedTokens = Math.ceil(text.length / 4);

  return (
    <div className="w-full bg-[#0c0d12] px-3 sm:px-6 pb-3 pt-1">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick Actions Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 shrink-0 pr-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Quick Actions:</span>
          </span>
          {INPUT_QUICK_ACTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  triggerHaptic(12);
                  onSendMessage(item.prompt, selectedFileIds);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Workspace Files Attached as Context */}
        {selectedFileIds.length > 0 && (
          <div className="flex items-center gap-2 px-1 flex-wrap text-xs text-zinc-400">
            <span className="font-mono text-[11px] uppercase text-zinc-500">Context:</span>
            {selectedFileIds.map((id) => {
              const file = projectFiles.find((f) => f.id === id);
              if (!file) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-xs font-mono"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleFileAttachment(id)}
                    className="hover:text-white ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Complexity Engineered Input Box */}
        <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 transition-colors shadow-sm overflow-hidden">
          {/* Mobile Code Quick Keys Bar */}
          {showDevToolbar && (
            <MobileCodeToolbar onInsertSymbol={handleInsertSymbol} hapticEnabled={true} />
          )}

          <form onSubmit={handleSubmit} className="p-2 sm:p-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Complexity, build a Minecraft Bedrock addon, or search the web..."
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none px-2.5 py-1.5 max-h-48 min-h-[44px] leading-relaxed select-text"
            />

            <div className="flex items-center justify-between pt-1 px-1">
              {/* File Attachment & Token Counter */}
              <div className="flex items-center gap-2">
                {projectFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (projectFiles[0]) toggleFileAttachment(projectFiles[0].id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      selectedFileIds.length > 0
                        ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                    title="Attach workspace file"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Attach Code</span>
                  </button>
                )}

                {text.length > 0 && (
                  <span className="text-[11px] font-mono text-zinc-500 select-none pl-1">
                    ~{estimatedTokens} tokens
                  </span>
                )}
              </div>

              {/* Submit or Stop Button */}
              <div>
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(15); onStopGeneration(); }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition active:scale-95"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition ${
                      text.trim()
                        ? 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-sm active:scale-95'
                        : 'bg-zinc-800/60 text-zinc-600 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="text-center pt-0.5">
          <p className="text-[11px] text-zinc-500">
            Complexity Studio · Grounded research, game modding, & interactive canvas
          </p>
        </div>
      </div>
    </div>
  );
};
