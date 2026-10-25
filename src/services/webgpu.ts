import { WebGPUStatus } from '../types';

export async function checkWebGPUStatus(): Promise<WebGPUStatus> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return {
      supported: false,
      error: 'WebGPU is not exposed on this browser or platform. Modern Chrome on Android 121+ supports WebGPU.',
    };
  }

  try {
    const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<any> } }).gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'WebGPU is supported by browser, but no compatible GPU adapter was found.',
      };
    }

    let adapterInfo: any = {};
    if (adapter.requestAdapterInfo) {
      try {
        adapterInfo = await adapter.requestAdapterInfo();
      } catch {
        // requestAdapterInfo might be deprecated or restricted
      }
    }

    return {
      supported: true,
      adapterName: adapterInfo.device || adapterInfo.description || 'Hardware WebGPU Device',
      vendor: adapterInfo.vendor || 'Mobile GPU',
      architecture: adapterInfo.architecture || 'On-Device Accelerator',
      device: true,
    };
  } catch (err: any) {
    return {
      supported: false,
      error: err?.message || 'Error initializing WebGPU subsystem.',
    };
  }
}

export async function checkCacheStorageUsage(): Promise<{ usedBytes: number; quotaBytes: number; formattedUsed: string; formattedQuota: string }> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;

      return {
        usedBytes: used,
        quotaBytes: quota,
        formattedUsed: formatBytes(used),
        formattedQuota: formatBytes(quota),
      };
    } catch {
      // Fallback
    }
  }

  return {
    usedBytes: 0,
    quotaBytes: 0,
    formattedUsed: '0 MB',
    formattedQuota: 'Unknown',
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
