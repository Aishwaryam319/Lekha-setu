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
      className={`w-full text-left bg-white border border-slate-200 rounded-xl p-4 transition-colors ${
        onClick ? 'hover:border-[#173B63]/40 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600 leading-snug">{label}</p>
          <p className={`text-2xl font-display font-bold mt-2 tabular-nums ${accentClass}`}>
            {count}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
      </div>
    </Wrapper>
  );
}
