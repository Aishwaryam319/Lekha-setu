import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { DocumentStatus } from '../types';
import { formatPendingDuration, isPendingStatus } from '../utils/documentStatus';
import { StatusBadge } from '../components/StatusBadge';

export function PendingDocuments() {
  const { language, t, pick } = useLanguage();
  const { documents } = useDocuments();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'ALL' | DocumentStatus>('ALL');
  const [query, setQuery] = useState('');

  const pendingDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (!isPendingStatus(d.status)) return false;
      if (filter !== 'ALL' && d.status !== filter) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.departmentNameEn.toLowerCase().includes(q) ||
        d.districtNameEn.toLowerCase().includes(q) ||
        d.talukNameEn.toLowerCase().includes(q)
      );
    });
  }, [documents, filter, query]);

  const filterButtons: { key: 'ALL' | DocumentStatus; label: string }[] = [
    { key: 'ALL', label: t('allStatuses') },
    { key: 'Uploaded', label: t('status_Uploaded') },
    { key: 'Processing', label: t('status_Processing') },
    { key: 'Awaiting Verification', label: t('status_AwaitingVerification') },
    { key: 'Needs Correction', label: t('status_NeedsCorrection') },
    { key: 'Failed', label: t('status_Failed') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {t('pendingTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t('pendingSubtitle')}</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setFilter(btn.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === btn.key
                    ? 'bg-white text-[#173B63] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchRecordsPlaceholder')}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg w-full sm:w-72 focus:outline-none focus:border-[#173B63]"
            />
          </div>
        </div>

        {pendingDocs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">{t('emptyRecords')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">{t('docId')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('docName')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('department')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('district')} / {t('taluk')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('uploadDate')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('status')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('pendingDuration')}</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pendingDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {doc.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                      {doc.fileName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {language === 'kn' ? doc.departmentNameKn : doc.departmentNameEn}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {language === 'kn' ? doc.districtNameKn : doc.districtNameEn}
                      {doc.talukNameEn
                        ? ` · ${language === 'kn' ? doc.talukNameKn : doc.talukNameEn}`
                        : ''}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {formatPendingDuration(doc.uploadDate, language)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            doc.status === 'Uploaded' ||
                            doc.status === 'Failed' ||
                            doc.status === 'Processing'
                          ) {
                            navigate(`/processing/${doc.id}`);
                          } else {
                            navigate(`/verification/${doc.id}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#173B63] hover:bg-[#112d4d] text-white text-xs font-medium rounded-md cursor-pointer"
                      >
                        {doc.status === 'Uploaded'
                          ? pick('Process OCR', 'OCR ಸಂಸ್ಕರಿಸಿ')
                          : doc.status === 'Failed'
                            ? pick('Retry', 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ')
                            : doc.status === 'Processing'
                              ? pick('View Progress', 'ಪ್ರಗತಿ ನೋಡಿ')
                              : pick('Continue Verification', 'ಪರಿಶೀಲನೆ ಮುಂದುವರಿಸಿ')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
