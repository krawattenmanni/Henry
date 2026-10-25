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
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 shadow-xs transition active:scale-95"
        title="Install Complexity on Android"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-zinc-100">Install on Device</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed space-y-2">
                To install Complexity on your mobile device:<br />
                1. Tap the <strong>Share</strong> icon in the browser toolbar.<br />
                2. Tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition"
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
