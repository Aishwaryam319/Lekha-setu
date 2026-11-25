import { DocumentStatus } from '../types';

export const PENDING_STATUSES: DocumentStatus[] = [
  'Uploaded',
  'Processing',
  'Awaiting Verification',
  'Needs Correction',
  'Failed',
];

export function isPendingStatus(status: DocumentStatus): boolean {
  return PENDING_STATUSES.includes(status);
}

export function getStatusStyle(status: DocumentStatus): {
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotColor: string;
} {
  switch (status) {
    case 'Completed':
      return {
        textClass: 'text-emerald-800',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        dotColor: '#16A34A',
      };
    case 'Awaiting Verification':
      return {
        textClass: 'text-blue-800',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        dotColor: '#2563EB',
      };
    case 'Processing':
      return {
        textClass: 'text-teal-800',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
        dotColor: '#0D9488',
      };
    case 'Needs Correction':
      return {
        textClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        dotColor: '#D97706',
      };
    case 'Failed':
      return {
        textClass: 'text-red-800',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        dotColor: '#DC2626',
      };
    case 'Uploaded':
    default:
      return {
        textClass: 'text-slate-700',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
        dotColor: '#475569',
      };
  }
}

export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 65) return 'medium';
  return 'low';
}

export function formatPendingDuration(isoDate: string, lang: 'en' | 'kn'): string {
  const diffMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return lang === 'kn' ? 'ಈಗಷ್ಟೇ' : 'Just now';
  if (mins < 60) return lang === 'kn' ? `${mins} ನಿಮಿಷ` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'kn' ? `${hours} ಗಂಟೆ` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return lang === 'kn' ? `${days} ದಿನ` : `${days}d`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
