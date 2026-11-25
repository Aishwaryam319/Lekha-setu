import React from 'react';

interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  accentClass: string;
  iconBgClass: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  count,
  icon,
  accentClass,
  iconBgClass,
  onClick,
}: StatCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-300 rounded-md p-4 transition-colors ${
        onClick ? 'hover:border-[#0D2647] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600 leading-snug">{label}</p>
          <p className={`text-2xl font-display font-bold mt-2 tabular-nums ${accentClass}`}>
            {count}
          </p>
        </div>
        <div className={`w-8 h-8 rounded border border-slate-200 flex items-center justify-center shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
      </div>
    </Wrapper>
  );
}
