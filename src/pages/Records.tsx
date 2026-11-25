import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Download, Eye, Search, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { DocumentRecord, DocumentStatus } from '../types';
import { KARNATAKA_DEPARTMENTS, KARNATAKA_DISTRICTS } from '../utils/locationSearch';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  exportDocumentsToCSV,
  exportDocumentsToJSON,
  exportSingleDocumentHtmlReport,
} from '../utils/exportUtils';

export function Records() {
  const { language, t, pick } = useLanguage();
  const { documents, deleteDocument } = useDocuments();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('newest');

  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = documents.filter((d) => {
      if (deptFilter !== 'ALL' && d.departmentId !== deptFilter) return false;
      if (districtFilter !== 'ALL' && d.districtId !== districtFilter) return false;
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!q) return true;
      const personName =
        d.fields.find((f) => f.key === 'fullName')?.value.toLowerCase() || '';
      return (
        d.id.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        personName.includes(q) ||
        d.departmentNameEn.toLowerCase().includes(q) ||
        d.departmentNameKn.toLowerCase().includes(q) ||
        d.districtNameEn.toLowerCase().includes(q) ||
        d.districtNameKn.toLowerCase().includes(q) ||
        d.talukNameEn.toLowerCase().includes(q) ||
        d.officeNameEn.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'confidence') return b.overallConfidence - a.overallConfidence;
      const diff = new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      return sortBy === 'newest' ? diff : -diff;
    });
  }, [documents, query, deptFilter, districtFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('recordsTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('recordsSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={filteredDocs.length === 0}
            onClick={() => exportDocumentsToCSV(filteredDocs, 'lekhasetu-all-records.csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            type="button"
            disabled={filteredDocs.length === 0}
            onClick={() => exportDocumentsToJSON(filteredDocs, 'lekhasetu-all-records.json')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportJson')}</span>
          </button>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchRecordsPlaceholder')}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg w-full focus:outline-none focus:border-[#173B63]"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          >
            <option value="ALL">{t('allDepartments')}</option>
            {KARNATAKA_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {language === 'kn' ? d.nameKn : d.nameEn}
              </option>
            ))}
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          >
            <option value="ALL">{t('allDistricts')}</option>
            {KARNATAKA_DISTRICTS.map((dist) => (
              <option key={dist.id} value={dist.id}>
                {language === 'kn' ? dist.nameKn : dist.nameEn}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          >
            <option value="ALL">{t('allStatuses')}</option>
            {(
              [
                'Uploaded',
                'Processing',
                'Awaiting Verification',
                'Completed',
                'Needs Correction',
                'Failed',
              ] as DocumentStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'confidence')}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          >
            <option value="newest">{t('sortNewest')}</option>
            <option value="oldest">{t('sortOldest')}</option>
            <option value="confidence">{t('sortConfidence')}</option>
          </select>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="w-9 h-9 text-slate-300 mx-auto mb-2" />
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
                  <th className="py-3 px-4 whitespace-nowrap">{t('office')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('uploadDate')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('status')}</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {doc.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[160px] truncate">
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
                    <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">
                      {language === 'kn' ? doc.officeNameKn : doc.officeNameEn}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          title={t('viewDetails')}
                          className="text-slate-600 hover:text-[#173B63] cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doc.status === 'Uploaded' || doc.status === 'Failed'
                              ? navigate(`/processing/${doc.id}`)
                              : navigate(`/verification/${doc.id}`)
                          }
                          className="font-semibold text-[#173B63] hover:underline cursor-pointer"
                        >
                          {t('editVerify')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(doc.id)}
                          title={t('deleteRecord')}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold text-slate-900">
                  {viewingDoc.id} · {viewingDoc.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingDoc.officeNameEn} · {viewingDoc.uploadedBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportSingleDocumentHtmlReport(viewingDoc)}
                  className="px-3 py-1.5 text-xs font-medium bg-[#0D9488] text-white rounded-lg cursor-pointer"
                >
                  {t('exportSummary')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
              <DocumentPreview
                dataUrl={viewingDoc.dataUrl}
                mimeType={viewingDoc.mimeType}
                fileName={viewingDoc.fileName}
                heightClass="h-[380px]"
              />
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {t('structuredFieldsLabel')}
                  </h4>
                  <dl className="divide-y divide-slate-100 border border-slate-200 rounded-lg text-xs">
                    {viewingDoc.fields.map((f) => (
                      <div key={f.key} className="px-3 py-2 flex justify-between gap-3">
                        <dt className="text-slate-500">{f.label}</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {f.value || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    {t('extractedTextLabel')}
                  </h4>
                  <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                    {viewingDoc.extractedText || pick('No text extracted yet.', 'ಇನ್ನೂ ಪಠ್ಯ ಹೊರತೆಗೆಯಲಾಗಿಲ್ಲ.')}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-display font-semibold text-slate-900">
              {t('confirmDeleteTitle')}
            </h3>
            <p className="text-sm text-slate-600">{t('confirmDeleteDesc')}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteDocument(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                {t('confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
