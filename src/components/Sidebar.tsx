import React, { useState } from 'react';
import { Conversation } from '../types';
import { ComplexityPrism } from './ComplexityPrism';
import { formatConversationTranscript } from './ShareTranscriptModal';
import {
  Plus,
  MessageSquare,
  Trash2,
  Share2,
  HardDrive,
  FolderCode,
  SlidersHorizontal,
  Download,
  Upload,
  X,
  Check,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onShareConversation: (conv: Conversation) => void;
  onClearAllConversations?: () => void;
  onOpenModelManager: () => void;
  onOpenProjectFiles: () => void;
  onOpenSettings: () => void;
  onExportAll: () => void;
  onImportData: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onShareConversation,
  onClearAllConversations,
  onOpenModelManager,
  onOpenProjectFiles,
  onOpenSettings,
  onExportAll,
  onImportData,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [copiedConvId, setCopiedConvId] = useState<string | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShareClick = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    triggerHaptic(15);
    const transcript = formatConversationTranscript(conv);
    navigator.clipboard?.writeText(transcript).catch(() => {});
    setCopiedConvId(conv.id);
    setTimeout(() => {
      setCopiedConvId((prev) => (prev === conv.id ? null : prev));
    }, 2000);
    onShareConversation(conv);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Complexity Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#0c0d12] border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ComplexityPrism className="w-5 h-5" size={20} />
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              Complexity
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              triggerHaptic(15);
              onNewConversation();
              onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 text-zinc-100 text-xs font-medium flex items-center justify-between border border-zinc-800 hover:border-zinc-700 transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>New chat</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">⌘K</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1 select-none">
          <div className="px-2 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 font-mono">
              Recent Chats ({conversations.length})
            </span>

            {conversations.length > 0 && onClearAllConversations && (
              confirmClearAll ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      onClearAllConversations();
                      setConfirmClearAll(false);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-[10px] font-medium transition"
                  >
                    <Check className="w-3 h-3" />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    setConfirmClearAll(true);
                  }}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 transition flex items-center gap-1"
                  title="Delete all recent chats"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              )
            )}
          </div>

          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-zinc-500 text-xs">
              No recent chats yet. Start a conversation!
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isCopied = copiedConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between pl-3 pr-1.5 py-2 rounded-lg text-xs cursor-pointer transition border ${
                    isActive
                      ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border-transparent'
                  }`}
                  onClick={() => {
                    triggerHaptic(10);
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="truncate">{conv.title || 'New Chat'}</span>
                  </div>

                  {/* Individual Chat Actions: Share Transcript & Delete */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleShareClick(e, conv)}
                      className={`p-1.5 rounded-md transition ${
                        isCopied
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                      title="Share plain-text transcript"
                      aria-label={`Share chat ${conv.title}`}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(15);
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition"
                      title="Delete chat"
                      aria-label={`Delete chat ${conv.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-zinc-800/80 space-y-1 bg-zinc-950/60 text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenProjectFiles();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition"
          >
            <FolderCode className="w-4 h-4 text-cyan-400" />
            <span>Workspace Code Files</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenModelManager();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition"
          >
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Models & Offline Storage</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Settings & Preferences</span>
          </button>

          {/* Backup & Restore */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
            <button
              onClick={onExportAll}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-zinc-100 border border-zinc-800 transition"
              title="Export all chats to JSON"
            >
              <Download className="w-3 h-3" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-zinc-100 border border-zinc-800 transition"
              title="Restore chats from backup JSON"
            >
              <Upload className="w-3 h-3" />
              <span>Restore</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </aside>
    </>
  );
};
