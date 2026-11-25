import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  darkText?: boolean;
}

export const OpenHotelPmsLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  darkText = false,
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-8 h-8';
  const titleClass = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} shrink-0`}
        aria-label="Open Hotel PMS Logo"
      >
        <defs>
          <linearGradient id="ohpmsGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#ohpmsGrad)" />
        {/* Stylized Hotel Keycard / Building Arch */}
        <path
          d="M11 30V15C11 11.6863 13.6863 9 17 9H23C26.3137 9 29 11.6863 29 15V30"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Timeline / Room Grid Bars inside */}
        <rect x="15" y="15" width="10" height="2.6" rx="1.3" fill="#FBBF24" />
        <rect x="15" y="20" width="6.5" height="2.6" rx="1.3" fill="white" fillOpacity="0.9" />
        <rect x="15" y="25" width="10" height="2.6" rx="1.3" fill="white" fillOpacity="0.7" />
        <circle cx="24" cy="21.3" r="1.5" fill="#34D399" />
      </svg>

      {showText && (
        <div className="min-w-0 leading-tight">
          <div className={`font-extrabold tracking-tight ${titleClass} ${darkText ? 'text-slate-900' : 'text-white'}`}>
            Open Hotel <span className="text-indigo-400">PMS</span>
          </div>
          {size !== 'sm' && (
            <div className={`text-[10px] font-medium ${darkText ? 'text-slate-500' : 'text-slate-400'}`}>
              Mews-Style Open Source PMS
            </div>
          )}
        </div>
      )}
    </div>
  );
};
