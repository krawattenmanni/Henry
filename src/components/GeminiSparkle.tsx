import React from 'react';

interface GeminiSparkleProps {
  className?: string;
  size?: number;
}

export const GeminiSparkle: React.FC<GeminiSparkleProps> = ({
  className = 'w-5 h-5',
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="geminiSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="35%" stopColor="#9B72CF" />
          <stop offset="70%" stopColor="#BA68C8" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
        fill="url(#geminiSparkleGrad)"
      />
    </svg>
  );
};
