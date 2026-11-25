import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileCheck2, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  exportDocumentsToCSV,
  exportDocumentsToJSON,
  exportSingleDocumentHtmlReport,
} from '../utils/exportUtils';

export function CompletedDocuments() {
  const { language, t } = useLanguage();
  const { documents } = useDocuments();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState('ALL');

  const completedDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (d.status !== 'Completed') return false;
      if (langFilter !== 'ALL' && d.documentLanguage !== langFilter) return false;
      if (!q) return true;
      const personName =
        d.fields.find((f) => f.key === 'fullName')?.value.toLowerCase() || '';
      return (
        d.id.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        personName.includes(q) ||
        d.departmentNameEn.toLowerCase().includes(q) ||
        d.districtNameEn.toLowerCase().includes(q) ||
        d.talukNameEn.toLowerCase().includes(q)
      );
    });
  }, [documents, query, langFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('completedTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('completedSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={completedDocs.length === 0}
            onClick={() => exportDocumentsToCSV(completedDocs, 'lekhasetu-completed.csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            type="button"
            disabled={completedDocs.length === 0}
            onClick={() => exportDocumentsToJSON(completedDocs, 'lekhasetu-completed.json')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportJson')}</span>
          </button>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchRecordsPlaceholder')}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg w-72 focus:outline-none focus:border-[#173B63]"
            />
          </div>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          >
            <option value="ALL">{t('allLanguages')}</option>
            <option value="Kannada">Kannada</option>
            <option value="English">English</option>
            <option value="Bilingual (Kannada + English)">Bilingual (Kannada + English)</option>
          </select>
        </div>

        {completedDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
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
                  <th className="py-3 px-4 whitespace-nowrap">{t('completionDate')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('status')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('languageLabel')}</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {completedDocs.map((doc) => (
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
                      {doc.completedDate ? new Date(doc.completedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {doc.documentLanguage}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/verification/${doc.id}`)}
                        className="font-semibold text-[#173B63] hover:underline cursor-pointer"
                      >
                        {t('viewDetails')}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportSingleDocumentHtmlReport(doc)}
                        className="font-semibold text-[#0D9488] hover:underline cursor-pointer"
                      >
                        {t('exportSummary')}
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
