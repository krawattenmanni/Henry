import React from 'react';

interface ComplexityPrismProps {
  className?: string;
  size?: number;
}

export const ComplexityPrism: React.FC<ComplexityPrismProps> = ({
  className = 'w-6 h-6',
  size = 24,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Background radiant ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 via-indigo-500/25 to-pink-500/25 blur-sm rounded-full transform scale-125 pointer-events-none" />

      {/* Isometric Complexity Hypercube / Prism SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_12px_rgba(79,172,254,0.45)]"
      >
        <defs>
          <linearGradient id="prism-grad-top" x1="12" y1="8" x2="36" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#4FACFE" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="prism-grad-left" x1="8" y1="20" x2="24" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4FACFE" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="prism-grad-right" x1="24" y1="20" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#D946EF" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="prism-core" x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Top Facet */}
        <path
          d="M24 6L40 15L24 24L8 15L24 6Z"
          fill="url(#prism-grad-top)"
          opacity="0.95"
        />

        {/* Left Facet */}
        <path
          d="M8 15L24 24V42L8 33V15Z"
          fill="url(#prism-grad-left)"
          opacity="0.9"
        />

        {/* Right Facet */}
        <path
          d="M24 24L40 15V33L24 42V24Z"
          fill="url(#prism-grad-right)"
          opacity="0.95"
        />

        {/* Inner Luminous Core Lines */}
        <path
          d="M24 16L32 20.5L24 25L16 20.5L24 16Z"
          fill="url(#prism-core)"
          opacity="0.75"
        />
        <path
          d="M24 25V34"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M24 16V25"
          stroke="#00F2FE"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M16 20.5L24 25L32 20.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.7"
        />

        {/* Outer Highlight Rim */}
        <path
          d="M24 6L40 15V33L24 42L8 33V15L24 6Z"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
