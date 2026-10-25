import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Globe, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-400 select-none px-1" title={isOnline ? 'Connected to internet & Google Search' : 'Offline Mode active'}>
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-amber-400'
        }`}
      />
      <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};
