import React, { useState } from 'react';
import { LLMModelId, WebGPUStatus } from '../types';
import { AVAILABLE_MODELS } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { GeminiSparkle } from './GeminiSparkle';
import {
  Menu,
  ChevronDown,
  FolderCode,
  SlidersHorizontal,
  HardDrive,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface HeaderProps {
  currentModelId: LLMModelId;
  onSelectModel: (id: LLMModelId) => void;
  onToggleSidebar: () => void;
  onOpenModelManager: () => void;
  onOpenProjectFiles: () => void;
  onOpenSettings: () => void;
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
  projectFilesCount,
  webGPUStatus,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === currentModelId) || AVAILABLE_MODELS[0];

  return (
    <header className="h-14 px-3 sm:px-4 bg-[#131314] border-b border-[#3c4043]/40 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Hamburger & Gemini Brand Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { triggerHaptic(10); onToggleSidebar(); }}
          className="p-2 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition active:scale-95"
          title="Open drawer menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={onToggleSidebar}>
          <GeminiSparkle className="w-5 h-5 animate-pulse" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-base sm:text-lg tracking-tight bg-gradient-to-r from-[#4285F4] via-[#9B72CF] to-[#D96570] bg-clip-text text-transparent">
              Gemini
            </span>
            <span className="text-[10px] text-[#8e918f] font-mono uppercase tracking-wider">
              Offline
            </span>
          </div>
        </div>
      </div>

      {/* Center: Gemini Model Dropdown Pill */}
      <div className="relative">
        <button
          onClick={() => { triggerHaptic(10); setShowModelMenu(!showModelMenu); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043]/70 text-[#e3e3e3] text-xs font-medium transition active:scale-95 max-w-[170px] sm:max-w-[240px]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] shrink-0" />
          <span className="truncate">{currentModel.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] shrink-0" />
        </button>

        {showModelMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModelMenu(false)}
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-[#1e1f20] border border-[#3c4043] p-2 shadow-2xl z-50 text-[#e3e3e3] space-y-1">
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-[#8e918f]">
                Gemini On-Device Models
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
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-[#282a2c] text-white ring-1 ring-[#9B72CF]/50'
                        : 'hover:bg-[#282a2c]/60 text-[#c4c7c5]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className={isSelected ? 'text-[#a8c7fa] font-semibold' : ''}>{model.name}</span>
                      {model.isBuiltIn ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#131314] text-[#a8c7fa] border border-[#3c4043]/50">
                          0 MB
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#131314] text-[#c4c7c5] border border-[#3c4043]/50">
                          WebGPU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8e918f] line-clamp-1">
                      {model.tagline}
                    </span>
                  </button>
                );
              })}

              <div className="pt-1.5 border-t border-[#3c4043]/60">
                <button
                  onClick={() => {
                    setShowModelMenu(false);
                    onOpenModelManager();
                  }}
                  className="w-full text-center py-2 text-xs text-[#a8c7fa] hover:text-[#d3e3fd] font-medium flex items-center justify-center gap-1.5 rounded-lg hover:bg-[#282a2c]"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Model Weights & Storage</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions, Offline Indicator, Project Files, Settings, Install */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <OfflineIndicator />

        {/* Project Files Toggle Button */}
        <button
          onClick={() => { triggerHaptic(10); onOpenProjectFiles(); }}
          className="relative p-2 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition"
          title="Project Workspace Files"
        >
          <FolderCode className="w-4 h-4" />
          {projectFilesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-[9px] font-mono font-bold text-white flex items-center justify-center">
              {projectFilesCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => { triggerHaptic(10); onOpenSettings(); }}
          className="p-2 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] rounded-full transition"
          title="Gemini Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </header>
  );
};
