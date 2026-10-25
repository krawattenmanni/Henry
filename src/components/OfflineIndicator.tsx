import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Globe, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#c4c7c5]">
      {isOnline ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1f20] border border-[#3c4043] text-[#a8c7fa] text-[11px] font-medium shadow-xs">
          <Globe className="w-3 h-3 text-[#4285F4] animate-pulse" />
          <span>Online & Search</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#282a2c] border border-purple-500/40 text-purple-300 text-[11px] font-medium shadow-xs">
          <WifiOff className="w-3 h-3 text-purple-400" />
          <span>Offline Ready</span>
        </span>
      )}
    </div>
  );
};
