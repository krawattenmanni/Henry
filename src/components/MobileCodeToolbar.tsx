import React from 'react';
import { triggerHaptic } from '../services/storage';

interface MobileCodeToolbarProps {
  onInsertSymbol: (symbol: string) => void;
  hapticEnabled?: boolean;
}

const PROGRAMMING_SYMBOLS = [
  { label: 'Tab', val: '  ' },
  { label: '{', val: '{' },
  { label: '}', val: '}' },
  { label: '(', val: '(' },
  { label: ')', val: ')' },
  { label: '[', val: '[' },
  { label: ']', val: ']' },
  { label: '<', val: '<' },
  { label: '>', val: '>' },
  { label: '=', val: '=' },
  { label: '=>', val: ' => ' },
  { label: '"', val: '"' },
  { label: "'", val: "'" },
  { label: ':', val: ':' },
  { label: ';', val: ';' },
  { label: '_', val: '_' },
  { label: '$', val: '$' },
  { label: '/', val: '/' },
  { label: '\\', val: '\\' },
  { label: '|', val: '|' },
  { label: '&', val: '&' },
  { label: '!', val: '!' },
  { label: '#', val: '#' },
];

export const MobileCodeToolbar: React.FC<MobileCodeToolbarProps> = ({
  onInsertSymbol,
  hapticEnabled = true,
}) => {
  const handleClick = (e: React.MouseEvent, val: string) => {
    e.preventDefault();
    if (hapticEnabled) triggerHaptic(10);
    onInsertSymbol(val);
  };

  return (
    <div className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1f20]/95 border-b border-[#3c4043]/60 overflow-x-auto no-scrollbar touch-pan-x">
      <span className="text-[10px] font-mono text-[#8e918f] uppercase tracking-wider shrink-0 select-none px-1">
        DEV KEYS
      </span>
      {PROGRAMMING_SYMBOLS.map((sym) => (
        <button
          key={sym.label}
          type="button"
          onMouseDown={(e) => handleClick(e, sym.val)}
          className="shrink-0 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-[#282a2c] hover:bg-[#37393b] text-[#e3e3e3] border border-[#3c4043]/40 active:scale-95 active:bg-[#9B72CF] active:text-white transition-all select-none"
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
};
