import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { triggerHaptic } from '../services/storage';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic(20);
    await install();
  };

  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] hover:opacity-90 text-white shadow-sm transition active:scale-95"
        title="Install Gemini Local on Android"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border border-[#3c4043] text-[#c4c7c5] hover:bg-[#282a2c] transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#a8c7fa]" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-[#1e1f20] border border-[#3c4043] p-6 shadow-2xl text-[#e3e3e3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">Install on Device</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#8e918f] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#c4c7c5] leading-relaxed space-y-2">
                To install Gemini Local on your mobile device:<br />
                1. Tap the <strong>Share</strong> icon in the browser toolbar.<br />
                2. Tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white text-xs font-medium hover:opacity-90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
