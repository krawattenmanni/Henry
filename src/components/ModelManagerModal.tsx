import React, { useState, useEffect } from 'react';
import { LLMModelId, ModelDownloadProgress, WebGPUStatus } from '../types';
import { AVAILABLE_MODELS } from '../services/storage';
import { checkCacheStorageUsage } from '../services/webgpu';
import { initWebLLMEngine, unloadCurrentModel } from '../services/webllmEngine';
import { GeminiSparkle } from './GeminiSparkle';
import {
  X,
  HardDrive,
  Cpu,
  Download,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModelId: LLMModelId;
  onSelectModel: (id: LLMModelId) => void;
  webGPUStatus: WebGPUStatus;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  currentModelId,
  onSelectModel,
  webGPUStatus,
}) => {
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: ModelDownloadProgress }>({});
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ formattedUsed: string; formattedQuota: string }>({
    formattedUsed: '...',
    formattedQuota: '...',
  });
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshStorage();
    }
  }, [isOpen]);

  const refreshStorage = async () => {
    const res = await checkCacheStorageUsage();
    setStorageInfo({
      formattedUsed: res.formattedUsed,
      formattedQuota: res.formattedQuota,
    });
  };

  if (!isOpen) return null;

  const handleDownloadModel = async (model: typeof AVAILABLE_MODELS[0]) => {
    if (!model.mlcModelId || !webGPUStatus.supported) return;

    triggerHaptic(20);
    setDownloadingModelId(model.id);

    try {
      await initWebLLMEngine(model.mlcModelId, (progress) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [model.id]: progress,
        }));
      });
      onSelectModel(model.id);
      refreshStorage();
    } catch (err: any) {
      alert(`Model initialization failed: ${err.message || 'WebGPU memory limit exceeded.'}`);
    } finally {
      setDownloadingModelId(null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear cached model weights? You can redownload them anytime.')) return;
    triggerHaptic(20);
    unloadCurrentModel();

    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      for (const k of keys) {
        if (k.includes('webllm') || k.includes('model')) {
          await caches.delete(k);
        }
      }
    }
    setCacheClearSuccess(true);
    setTimeout(() => setCacheClearSuccess(false), 3000);
    refreshStorage();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl overflow-hidden text-[#e3e3e3]">
        {/* Header */}
        <div className="p-4 border-b border-[#3c4043]/60 flex items-center justify-between shrink-0 bg-[#1e1f20]">
          <div className="flex items-center gap-2.5">
            <GeminiSparkle className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-semibold text-white">Gemini On-Device Models</h2>
              <p className="text-[11px] text-[#8e918f]">Offline neural weights & device storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* WebGPU Status Banner */}
          <div className="p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Cpu className={`w-4 h-4 shrink-0 mt-0.5 ${webGPUStatus.supported ? 'text-[#a8c7fa]' : 'text-amber-400'}`} />
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-white">Hardware Accelerator</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      webGPUStatus.supported
                        ? 'bg-[#1e1f20] text-[#a8c7fa] border border-[#4285F4]/40'
                        : 'bg-[#282a2c] text-amber-300 border border-amber-800/50'
                    }`}
                  >
                    {webGPUStatus.supported ? 'WebGPU Active' : 'Software Fallback'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8e918f] mt-1">
                  {webGPUStatus.supported
                    ? `${webGPUStatus.adapterName || 'Device GPU'} (${webGPUStatus.vendor || 'Mobile'})`
                    : webGPUStatus.error || 'WebGPU not detected. Using high-speed built-in offline engine.'}
                </p>
              </div>
            </div>

            <button
              onClick={refreshStorage}
              className="p-1.5 text-[#8e918f] hover:text-white transition shrink-0"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Device Storage Usage */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043]">
            <div>
              <span className="text-[#8e918f]">Offline Storage Used:</span>
              <span className="ml-2 font-mono font-medium text-white">{storageInfo.formattedUsed}</span>
              <span className="text-[#8e918f] text-[11px]"> (Quota: {storageInfo.formattedQuota})</span>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Cache</span>
            </button>
          </div>

          {cacheClearSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-center text-xs">
              Model cache successfully cleared!
            </div>
          )}

          {/* Models List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#8e918f] uppercase tracking-wider font-mono">
              Available Offline Engines
            </h3>

            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === currentModelId;
              const isDownloading = downloadingModelId === model.id;
              const progress = downloadProgress[model.id];

              return (
                <div
                  key={model.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#282a2c] border-[#9B72CF] shadow-md'
                      : 'bg-[#131314] border-[#3c4043] hover:border-[#52565a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{model.name}</span>
                        {model.isBuiltIn ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#1e1f20] text-[#a8c7fa] border border-[#4285F4]/40 font-mono text-[10px]">
                            Built-in (0 MB)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#1e1f20] text-[#c4c7c5] font-mono text-[10px]">
                            {model.sizeMB} MB
                          </span>
                        )}
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] text-[#a8c7fa] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8e918f] leading-relaxed">
                        {model.description}
                      </p>
                      <p className="text-[10px] text-[#8e918f]">
                        <strong>Recommended for:</strong> {model.recommendedFor}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col gap-1.5">
                      {model.isBuiltIn ? (
                        <button
                          onClick={() => {
                            triggerHaptic(15);
                            onSelectModel(model.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white shadow-xs'
                              : 'bg-[#1e1f20] text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white border border-[#3c4043]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Use Engine'}
                        </button>
                      ) : (
                        <button
                          disabled={isDownloading || !webGPUStatus.supported}
                          onClick={() => handleDownloadModel(model)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                            isDownloading
                              ? 'bg-[#1e1f20] text-[#8e918f] cursor-wait'
                              : isSelected
                              ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white'
                              : 'bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] border border-[#3c4043]'
                          }`}
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-[#a8c7fa]" />
                              <span>Loading...</span>
                            </>
                          ) : isSelected ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Load ({model.sizeMB}M)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isDownloading && progress && (
                    <div className="mt-3 pt-2.5 border-t border-[#3c4043] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8e918f]">
                        <span className="truncate max-w-[80%]">{progress.text}</span>
                        <span className="font-mono">{Math.round((progress.progress || 0) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#131314] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] transition-all duration-150"
                          style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Android Offline Instructions Card */}
          <div className="p-3.5 rounded-2xl bg-[#131314] border border-[#3c4043] space-y-1.5 text-[#c4c7c5]">
            <div className="flex items-center gap-2 text-[#a8c7fa] font-medium">
              <Smartphone className="w-4 h-4" />
              <span>Android Offline Operation</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#8e918f] leading-relaxed">
              <li>Tap <strong>Install App</strong> in the header to add Gemini to your home screen or app drawer.</li>
              <li>Service workers keep assets and weights stored locally so it works <strong>100% in airplane mode</strong>.</li>
              <li>The <strong>Gemini Nano</strong> engine runs instantly with zero download required.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#3c4043]/60 flex justify-end shrink-0 bg-[#1e1f20]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#282a2c] hover:bg-[#37393b] text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
