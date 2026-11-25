import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { getConfidenceLevel } from '../utils/documentStatus';
import { useLanguage } from '../context/LanguageContext';

export function ConfidenceBadge({ score }: { score: number }) {
  const { pick } = useLanguage();
  const level = getConfidenceLevel(score);
  const rounded = Math.round(score);

  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 tabular-nums whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        {rounded}% · {pick('High', 'ಹೆಚ್ಚು')}
      </span>
    );
  }

  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 tabular-nums whitespace-nowrap">
        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
        {rounded}% · {pick('Medium', 'ಮಧ್ಯಮ')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 tabular-nums whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
      {rounded}% · {pick('Low', 'ಕಡಿಮೆ')}
    </span>
  );
}
