import React from 'react';
import logoImg from '../assets/logo-openhotelpms.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  darkText?: boolean;
}

export const OpenHotelPmsLogo: React.FC<LogoProps> = ({
  size = 'md',
  darkText = false,
}) => {
  const heightClass =
    size === 'sm'
      ? 'h-9 sm:h-11'
      : size === 'lg'
      ? 'h-14 sm:h-16'
      : 'h-11 sm:h-12';

  return (
    <div
      className={`inline-flex items-center select-none shrink-0 ${
        darkText ? '' : 'bg-white px-3.5 py-2 rounded-xl shadow-xs'
      }`}
    >
      <img
        src={logoImg}
        alt="OpenHotelPMS Logo"
        className={`${heightClass} w-auto max-w-[200px] sm:max-w-[260px] object-contain`}
      />
    </div>
  );
};
