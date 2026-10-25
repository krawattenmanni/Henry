import React, { useState } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/storage';
import { ComplexityPrism } from './ComplexityPrism';
import {
  X,
  SlidersHorizontal,
  Vibrate,
  Keyboard,
  RotateCcw,
  Save,
  Check,
  Globe,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    triggerHaptic(15);
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    triggerHaptic(15);
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <ComplexityPrism className="w-5 h-5" size={20} />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Complexity Settings</h2>
              <p className="text-[11px] text-zinc-400">Online web research, models & keyboard preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Google Web Search Grounding Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1e1f20] flex items-center justify-center text-[#4285F4]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white">Google Web Search Grounding</span>
                <p className="text-[11px] text-[#8e918f]">
                  Conduct live web research and attach clickable citations & sources
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.enableWebSearch !== false}
              onChange={(e) => {
                triggerHaptic(10);
                setLocalSettings({ ...localSettings, enableWebSearch: e.target.checked });
              }}
              className="w-4 h-4 accent-[#4285F4] rounded cursor-pointer"
            />
          </div>

          {/* Mobile Developer Keyboard Bar Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1e1f20] flex items-center justify-center text-[#a8c7fa]">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white">Developer Keyboard Bar</span>
                <p className="text-[11px] text-[#8e918f]">
                  Quick keys for programming symbols: {"{ } ( ) [ ] < > = => \" ' ; $ _ /"}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.developerKeyboardBar}
              onChange={(e) => {
                triggerHaptic(10);
                setLocalSettings({ ...localSettings, developerKeyboardBar: e.target.checked });
              }}
              className="w-4 h-4 accent-[#4285F4] rounded cursor-pointer"
            />
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1e1f20] flex items-center justify-center text-[#BA68C8]">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white">Android Haptic Feedback</span>
                <p className="text-[11px] text-[#8e918f]">
                  Subtle vibration ticks when typing code keys and interacting
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.hapticFeedback}
              onChange={(e) => {
                triggerHaptic(10);
                setLocalSettings({ ...localSettings, hapticFeedback: e.target.checked });
              }}
              className="w-4 h-4 accent-[#4285F4] rounded cursor-pointer"
            />
          </div>

          {/* Temperature Slider */}
          <div className="p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Creativity & Temperature</span>
              <span className="font-mono text-[#a8c7fa] font-medium">{localSettings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-[#4285F4] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8e918f] font-mono">
              <span>0.0 (Precise / Code)</span>
              <span>1.0 (Creative Chat)</span>
            </div>
          </div>

          {/* Custom System Instruction Prompt */}
          <div className="p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">System Instructions & Persona</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-[#8e918f] hover:text-[#a8c7fa] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
              className="w-full bg-[#1e1f20] text-[#e3e3e3] p-3 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#52565a] resize-none leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#3c4043]/60 flex items-center justify-between shrink-0 bg-[#1e1f20]">
          <div className="text-[11px] text-[#8e918f]">
            Gemini Online · Google Search Grounded
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[#8e918f] hover:text-white transition text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] hover:opacity-90 text-white font-medium text-xs shadow-xs transition active:scale-95"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
