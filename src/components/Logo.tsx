import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, variant = 'dark', size = 'md' }) => {
  const isDark = variant === 'dark';
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const barClasses = {
    sm: 'h-0.5 mb-0.5',
    md: 'h-1 mb-1',
    lg: 'h-1.5 mb-1.5',
  };

  return (
    <div className={cn("flex flex-col items-start font-sans", className)}>
      <div className={cn("bg-[#10B981] w-full", barClasses[size])} />
      <div className={cn(
        "font-black tracking-tighter leading-none flex items-baseline gap-1",
        sizeClasses[size],
        isDark ? "text-[#0A192F]" : "text-white"
      )}>
        <span>GH</span>
        <span className="font-light">DUTOS</span>
      </div>
      <p className={cn(
        "uppercase tracking-[0.2em] font-bold mt-1",
        size === 'sm' ? 'text-[7px]' : size === 'md' ? 'text-[9px]' : 'text-[12px]',
        isDark ? "text-[#0A192F]/60" : "text-white/60"
      )}>
        ENGENHARIA E MANUTENÇÃO
      </p>
    </div>
  );
};

export default Logo;
