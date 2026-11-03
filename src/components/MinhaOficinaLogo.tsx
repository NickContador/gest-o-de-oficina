import React from 'react';

interface MinhaOficinaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export const MinhaOficinaLogo: React.FC<MinhaOficinaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  theme = 'light',
}) => {
  const iconDimensions = {
    sm: { w: 32, h: 22 },
    md: { w: 44, h: 30 },
    lg: { w: 60, h: 42 },
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Authentic MinhaOficina Car + Wrench Icon */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 100 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Car Silhouette */}
        <path
          d="M 12 42 C 16 30, 24 20, 36 15 C 44 11, 62 11, 74 15 C 84 19, 90 28, 94 40 C 96 44, 94 48, 88 49 C 85 49, 82 48, 80 44 C 76 34, 66 28, 54 28 C 42 28, 32 34, 28 44 C 26 48, 22 49, 18 49 C 14 49, 10 46, 12 42 Z"
          fill={isDark ? '#e2e8f0' : '#334155'}
        />
        {/* Window cutouts */}
        <path
          d="M 38 18 L 48 18 L 48 26 L 33 26 C 34 23, 36 20, 38 18 Z"
          fill={isDark ? '#0f172a' : '#f8fafc'}
          opacity="0.9"
        />
        <path
          d="M 52 18 L 70 18 C 73 20, 75 23, 76 26 L 52 26 L 52 18 Z"
          fill={isDark ? '#0f172a' : '#f8fafc'}
          opacity="0.9"
        />

        {/* Dynamic Electric Cyan Wrench forming the wheelbases & chassis: #00a2e8 */}
        {/* Left Wrench Head / Wheel */}
        <path
          d="M 24 35 C 16 35, 10 41, 10 49 C 10 57, 16 63, 24 63 C 30 63, 35 59, 37 53 L 42 53 C 41 49, 41 46, 42 45 L 37 45 C 35 39, 30 35, 24 35 Z M 24 43 C 27 43, 30 46, 30 49 C 30 52, 27 55, 24 55 C 21 55, 18 52, 18 49 C 18 46, 21 43, 24 43 Z"
          fill="#00a2e8"
        />
        {/* Right Wrench Head / Wheel */}
        <path
          d="M 76 35 C 70 35, 65 39, 63 45 L 58 45 C 59 46, 59 49, 58 53 L 63 53 C 65 59, 70 63, 76 63 C 84 63, 90 57, 90 49 C 90 41, 84 35, 76 35 Z M 76 43 C 79 43, 82 46, 82 49 C 82 52, 79 55, 76 55 C 73 55, 70 52, 70 49 C 70 46, 73 43, 76 43 Z"
          fill="#00a2e8"
        />
        {/* Center Connecting Wrench Shaft */}
        <rect x="36" y="46" width="28" height="6" rx="2" fill="#00a2e8" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              className={`font-extrabold text-lg sm:text-xl tracking-tight ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}
            >
              Minha<span className="text-[#00a2e8]">Oficina</span>
            </span>
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                isDark
                  ? 'bg-[#00a2e8]/20 text-[#00a2e8] border-[#00a2e8]/40'
                  : 'bg-[#00a2e8]/10 text-[#00a2e8] border-[#00a2e8]/30'
              }`}
            >
              PRO
            </span>
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Software de Gestão para Oficina Mecânica
          </span>
        </div>
      )}
    </div>
  );
};
