import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, Code2 } from 'lucide-react';
import { MobileCodeToolbar } from './MobileCodeToolbar';
import { ProjectFile } from '../types';
import { triggerHaptic } from '../services/storage';

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
    <div className="w-full bg-[#131314] px-3 sm:px-6 pb-3 pt-1">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Selected Workspace Files Attached as Context */}
        {selectedFileIds.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 flex-wrap">
            <span className="text-[10px] text-[#8e918f] uppercase font-mono">Attached Context:</span>
            {selectedFileIds.map((id) => {
              const file = projectFiles.find((f) => f.id === id);
              if (!file) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1e1f20] border border-[#3c4043] text-[#a8c7fa] text-xs font-mono"
                >
                  <Code2 className="w-3 h-3 text-[#4285F4]" />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleFileAttachment(id)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Gemini Floating Rounded-3xl Input Box */}
        <div className="relative rounded-3xl bg-[#1e1f20] border border-[#3c4043] focus-within:border-[#52565a] transition-all shadow-md overflow-hidden">
          {/* Mobile Code Quick Keys Bar */}
          {showDevToolbar && (
            <MobileCodeToolbar onInsertSymbol={handleInsertSymbol} hapticEnabled={true} />
          )}

          <form onSubmit={handleSubmit} className="p-2 sm:p-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini anything, chat, or generate code offline..."
              className="w-full bg-transparent text-[#e3e3e3] placeholder-[#8e918f] text-sm focus:outline-none resize-none px-3 py-1.5 max-h-48 min-h-[44px] leading-relaxed select-text"
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${
                      selectedFileIds.length > 0
                        ? 'bg-[#282a2c] text-[#a8c7fa] border border-[#4285F4]/40'
                        : 'text-[#c4c7c5] hover:text-white hover:bg-[#282a2c]'
                    }`}
                    title="Attach workspace file"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Attach Code</span>
                  </button>
                )}

                {text.length > 0 && (
                  <span className="text-[11px] font-mono text-[#8e918f] select-none pl-1">
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
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#282a2c] hover:bg-[#37393b] text-white transition active:scale-95"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition ${
                      text.trim()
                        ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white shadow-xs active:scale-95'
                        : 'bg-[#282a2c] text-[#52565a] cursor-not-allowed'
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

        <div className="text-center">
          <p className="text-[10px] text-[#8e918f]">
            Gemini Local runs 100% on-device in your Android browser sandbox.
          </p>
        </div>
      </div>
    </div>
  );
};
