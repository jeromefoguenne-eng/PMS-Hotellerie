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
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-9';

  return (
    <div
      className={`inline-flex items-center select-none ${
        darkText ? '' : 'bg-white px-3 py-1.5 rounded-xl shadow-xs'
      }`}
    >
      <img
        src={logoImg}
        alt="OpenHotelPMS Logo"
        className={`${heightClass} w-auto object-contain`}
      />
    </div>
  );
};
