import React, { useState } from 'react';
import { LLMModelId, WebGPUStatus } from '../types';
import { AVAILABLE_MODELS } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { ComplexityPrism } from './ComplexityPrism';
import {
  Menu,
  ChevronDown,
  FolderCode,
  SlidersHorizontal,
  HardDrive,
  Share2,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface HeaderProps {
  currentModelId: LLMModelId;
  onSelectModel: (id: LLMModelId) => void;
  onToggleSidebar: () => void;
  onOpenModelManager: () => void;
  onOpenProjectFiles: () => void;
  onOpenSettings: () => void;
  onShareActiveConversation?: () => void;
  projectFilesCount: number;
  webGPUStatus: WebGPUStatus;
}

export const Header: React.FC<HeaderProps> = ({
  currentModelId,
  onSelectModel,
  onToggleSidebar,
  onOpenModelManager,
  onOpenProjectFiles,
  onOpenSettings,
  onShareActiveConversation,
  projectFilesCount,
  webGPUStatus,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === currentModelId) || AVAILABLE_MODELS[0];

  return (
    <header className="h-14 px-3 sm:px-4 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Hamburger & Complexity Brand Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { triggerHaptic(10); onToggleSidebar(); }}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition active:scale-95"
          title="Open drawer menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onToggleSidebar}>
          <ComplexityPrism className="w-5 h-5 hover:scale-105 transition-transform" size={22} />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-zinc-100">
              Complexity
            </span>
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
              · studio
            </span>
          </div>
        </div>
      </div>

      {/* Center: Model Selector */}
      <div className="relative">
        <button
          onClick={() => { triggerHaptic(10); setShowModelMenu(!showModelMenu); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition active:scale-95 max-w-[180px] sm:max-w-[260px]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span className="truncate">{currentModel.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        </button>

        {showModelMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModelMenu(false)}
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-2xl z-50 text-zinc-200 space-y-1">
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-400">
                Neural & Online Engines
              </div>
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === currentModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      triggerHaptic(15);
                      onSelectModel(model.id);
                      setShowModelMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-zinc-800 text-white border border-zinc-700/60'
                        : 'hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className={isSelected ? 'text-zinc-100 font-semibold' : ''}>{model.name}</span>
                      {model.isBuiltIn ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-800">
                          0 MB
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-800">
                          WebGPU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 line-clamp-1">
                      {model.tagline}
                    </span>
                  </button>
                );
              })}

              <div className="pt-1.5 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setShowModelMenu(false);
                    onOpenModelManager();
                  }}
                  className="w-full text-center py-2 text-xs text-zinc-300 hover:text-white font-medium flex items-center justify-center gap-1.5 rounded-lg hover:bg-zinc-800"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Model Weights & Storage</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions, Share, Offline Indicator, Project Files, Settings, Install */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <OfflineIndicator />

        {onShareActiveConversation && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onShareActiveConversation();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
            title="Share conversation transcript"
            aria-label="Share conversation transcript"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        {/* Project Files Toggle Button */}
        <button
          onClick={() => { triggerHaptic(10); onOpenProjectFiles(); }}
          className="relative p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
          title="Project Workspace Files"
        >
          <FolderCode className="w-4 h-4" />
          {projectFilesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-600 text-[9px] font-mono font-bold text-white flex items-center justify-center">
              {projectFilesCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => { triggerHaptic(10); onOpenSettings(); }}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
          title="Complexity Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </header>
  );
};
