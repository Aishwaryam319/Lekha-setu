import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { DocumentStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useLanguage();

  const config: Record<
    DocumentStatus,
    { label: string; colorClass: string; icon: React.ReactNode }
  > = {
    Uploaded: {
      label: t('status_Uploaded'),
      colorClass: 'text-slate-700',
      icon: <UploadCloud className="w-3.5 h-3.5 text-slate-500" />,
    },
    Processing: {
      label: t('status_Processing'),
      colorClass: 'text-teal-700',
      icon: <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />,
    },
    'Awaiting Verification': {
      label: t('status_AwaitingVerification'),
      colorClass: 'text-blue-700',
      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
    },
    Completed: {
      label: t('status_Completed'),
      colorClass: 'text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    'Needs Correction': {
      label: t('status_NeedsCorrection'),
      colorClass: 'text-amber-700',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    },
    Failed: {
      label: t('status_Failed'),
      colorClass: 'text-red-700',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
    },
  };

  const item = config[status] || config.Uploaded;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${item.colorClass}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
}
