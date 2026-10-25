import React, { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { X, Copy, Check, Share2, FileText } from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ShareTranscriptModalProps {
  conversation: Conversation | null;
  onClose: () => void;
}

export function formatConversationTranscript(conv: Conversation): string {
  const dateStr = new Date(conv.updatedAt || conv.createdAt).toLocaleString();
  const header = [
    `COMPLEXITY — CONVERSATION TRANSCRIPT`,
    `Title: ${conv.title || 'New Chat'}`,
    `Date: ${dateStr}`,
    `Messages: ${conv.messages.length}`,
    `========================================`,
    ``,
  ].join('\n');

  if (!conv.messages || conv.messages.length === 0) {
    return `${header}(No messages in this conversation yet.)\n`;
  }

  const body = conv.messages
    .map((m) => {
      const speaker = m.role === 'user' ? 'USER' : `COMPLEXITY (${m.modelUsed || 'Assistant'})`;
      const time = new Date(m.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      let text = (m.content || '').replace(/<antArtifact[\s\S]*?<\/antArtifact>/gi, '').trim();

      if (m.artifacts && m.artifacts.length > 0) {
        const artifactBlocks = m.artifacts
          .map(
            (art) =>
              `\n--- Artifact: ${art.title} (${art.language}) ---\n${art.content}\n--- End Artifact ---`
          )
          .join('\n');
        text = text ? `${text}\n${artifactBlocks}` : artifactBlocks.trim();
      }

      return `[${time}] ${speaker}:\n${text}`;
    })
    .join('\n\n----------------------------------------\n\n');

  return `${header}${body}\n`;
}

export const ShareTranscriptModal: React.FC<ShareTranscriptModalProps> = ({
  conversation,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (conversation) {
      const transcript = formatConversationTranscript(conversation);
      navigator.clipboard?.writeText(transcript).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // User can click Copy button manually
      });
    }
  }, [conversation]);

  if (!conversation) return null;

  const transcript = formatConversationTranscript(conversation);

  const handleCopy = async () => {
    triggerHaptic(15);
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = transcript;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl bg-[#0c0d12] border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">
                Share Conversation Transcript
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                Plain-text transcript for &ldquo;{conversation.title || 'New Chat'}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plain-text Transcript Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>{conversation.messages.length} messages · Plain Text (.txt)</span>
            </span>

            {copied && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Copied to clipboard</span>
              </span>
            )}
          </div>

          <textarea
            readOnly
            value={transcript}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            className="w-full h-72 sm:h-80 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-cyan-500/60 selection:bg-cyan-500/20"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 border border-zinc-800 transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
