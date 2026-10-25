import React from 'react';
import { Conversation } from '../types';
import { GeminiSparkle } from './GeminiSparkle';
import {
  Plus,
  MessageSquare,
  Trash2,
  HardDrive,
  FolderCode,
  SlidersHorizontal,
  Download,
  Upload,
  X,
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
  onOpenModelManager,
  onOpenProjectFiles,
  onOpenSettings,
  onExportAll,
  onImportData,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

      {/* Gemini Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#1e1f20] border-r border-[#3c4043]/50 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-[#3c4043]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GeminiSparkle className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-tight text-white">
              Gemini Local
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button (Gemini Pill) */}
        <div className="p-3">
          <button
            onClick={() => {
              triggerHaptic(15);
              onNewConversation();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-full bg-[#131314] hover:bg-[#282a2c] text-[#e3e3e3] hover:text-white text-xs font-medium flex items-center gap-2.5 border border-[#3c4043]/80 transition active:scale-98 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#a8c7fa]" />
            <span>New chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 select-none">
          <div className="px-3 py-1.5 text-[11px] font-medium text-[#8e918f]">
            Recent
          </div>

          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-[#8e918f] text-xs italic">
              No offline chats yet. Ask a question or start coding!
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-full text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-[#282a2c] text-white font-medium'
                      : 'text-[#c4c7c5] hover:text-white hover:bg-[#282a2c]/50'
                  }`}
                  onClick={() => {
                    triggerHaptic(10);
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#a8c7fa]' : 'text-[#8e918f]'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(15);
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8e918f] hover:text-rose-400 rounded-full transition"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#3c4043]/50 space-y-1 bg-[#1e1f20] text-xs">
          <button
            onClick={() => { onClose(); onOpenProjectFiles(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition"
          >
            <FolderCode className="w-4 h-4 text-[#a8c7fa]" />
            <span>Workspace Code Files</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenModelManager(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition"
          >
            <HardDrive className="w-4 h-4 text-[#BA68C8]" />
            <span>Models & Offline Storage</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenSettings(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#D96570]" />
            <span>Settings & Preferences</span>
          </button>

          {/* Backup & Restore */}
          <div className="pt-2 border-t border-[#3c4043]/50 flex items-center gap-1.5">
            <button
              onClick={onExportAll}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#131314] hover:bg-[#282a2c] text-[11px] text-[#c4c7c5] hover:text-white border border-[#3c4043]/40 transition"
              title="Export all offline chats to JSON"
            >
              <Download className="w-3 h-3" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#131314] hover:bg-[#282a2c] text-[11px] text-[#c4c7c5] hover:text-white border border-[#3c4043]/40 transition"
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
