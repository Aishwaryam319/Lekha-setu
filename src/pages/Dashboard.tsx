import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  Bot,
  Building2,
  Camera,
  CheckSquare,
  Clock,
  Cpu,
  FileCheck2,
  FileText,
  Loader2,
  Search,
  Upload,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import {
  getDepartmentById,
  getDistrictById,
  getTalukById,
} from '../utils/locationSearch';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentStatus } from '../types';

export function Dashboard() {
  const { language, t, pick } = useLanguage();
  const { documents, preferences, stats } = useDocuments();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const activeSel = preferences.activeSelection;
  const activeDept = getDepartmentById(activeSel.departmentId);
  const activeDist = getDistrictById(activeSel.districtId);
  const activeTaluk = activeSel.talukId ? getTalukById(activeSel.talukId) : undefined;
  const activeOffice =
    activeSel.customOfficeName.trim() ||
    (language === 'kn' ? activeSel.officeNameKn : activeSel.officeNameEn) ||
    pick('Not selected', 'ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ');

  const filteredRecent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = documents.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.departmentNameEn.toLowerCase().includes(q) ||
        d.districtNameEn.toLowerCase().includes(q) ||
        d.talukNameEn.toLowerCase().includes(q) ||
        d.officeNameEn.toLowerCase().includes(q)
      );
    });

    const sorted = [...list].sort((a, b) => {
      const diff = new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      return sortBy === 'newest' ? diff : -diff;
    });
    return sorted.slice(0, 8);
  }, [documents, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Official Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-amber-800 tracking-wide">
            {pick('GOVERNMENT OF KARNATAKA · DOCUMENT REGISTRY', 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ · ದಾಖಲೆ ನೋಂದಣಿ')}
          </p>
          <h1 className="text-2xl font-display font-bold text-[#123254] tracking-tight mt-0.5">
            {t('welcomeOfficer')}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{t('dashboardSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#123254]" />
            <span>{t('actionScanDoc')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#123254] hover:bg-[#0d2642] text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t('actionUploadNew')}</span>
          </button>
        </div>
      </div>

      {/* A. Active Department & Office Information */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#123254]/10 text-[#123254] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{t('activeOfficeHeader')}</p>
              <h2 className="text-base font-display font-semibold text-slate-900 mt-0.5 truncate">
                {activeOffice}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mt-1">
                <span>
                  {t('department')}:{' '}
                  <strong className="font-medium text-slate-800">
                    {activeDept
                      ? language === 'kn'
                        ? activeDept.nameKn
                        : activeDept.nameEn
                      : '—'}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t('district')}:{' '}
                  <strong className="font-medium text-slate-800">
                    {activeDist
                      ? language === 'kn'
                        ? activeDist.nameKn
                        : activeDist.nameEn
                      : '—'}
                  </strong>
                </span>
                {activeDept?.requiresTaluk && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t('taluk')}:{' '}
                      <strong className="font-medium text-slate-800">
                        {activeTaluk
                          ? language === 'kn'
                            ? activeTaluk.nameKn
                            : activeTaluk.nameEn
                          : '—'}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/department')}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t('changeSelection')}
          </button>
        </div>
      </section>

      {/* B. Six Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label={t('totalDocsReceived')}
          count={stats.total}
          icon={<FileText className="w-4 h-4 text-[#123254]" />}
          accentClass="text-[#123254]"
          iconBgClass="bg-[#123254]/10"
          onClick={() => navigate('/records')}
        />
        <StatCard
          label={t('completedDocs')}
          count={stats.completed}
          icon={<FileCheck2 className="w-4 h-4 text-emerald-700" />}
          accentClass="text-emerald-700"
          iconBgClass="bg-emerald-50"
          onClick={() => navigate('/completed')}
        />
        <StatCard
          label={t('pendingDocs')}
          count={stats.pending}
          icon={<Clock className="w-4 h-4 text-amber-700" />}
          accentClass="text-amber-700"
          iconBgClass="bg-amber-50"
          onClick={() => navigate('/pending')}
        />
        <StatCard
          label={t('currentlyProcessing')}
          count={stats.processing}
          icon={<Loader2 className="w-4 h-4 text-teal-700" />}
          accentClass="text-teal-700"
          iconBgClass="bg-teal-50"
          onClick={() => navigate('/processing')}
        />
        <StatCard
          label={t('awaitingVerification')}
          count={stats.awaitingVerification}
          icon={<CheckSquare className="w-4 h-4 text-blue-700" />}
          accentClass="text-blue-700"
          iconBgClass="bg-blue-50"
          onClick={() => navigate('/verification')}
        />
        <StatCard
          label={t('needsCorrection')}
          count={stats.needsCorrection}
          icon={<AlertTriangle className="w-4 h-4 text-red-700" />}
          accentClass="text-red-700"
          iconBgClass="bg-red-50"
          onClick={() => navigate('/pending')}
        />
      </section>

      {/* C. Progress Overview & F. Daily Work Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900">
                {t('progressOverview')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t('completionFormulaNote')}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-[#123254] tabular-nums">
                {stats.completionPercentage}%
              </span>
              <p className="text-xs text-slate-500">{t('overallCompletion')}</p>
            </div>
          </div>

          <div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {stats.total > 0 && (
                <>
                  <div
                    style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                    className="bg-emerald-600 transition-all duration-300"
                    title={t('completedDocs')}
                  />
                  <div
                    style={{ width: `${(stats.awaitingVerification / stats.total) * 100}%` }}
                    className="bg-blue-600 transition-all duration-300"
                    title={t('awaitingVerification')}
                  />
                  <div
                    style={{ width: `${(stats.processing / stats.total) * 100}%` }}
                    className="bg-teal-600 transition-all duration-300"
                    title={t('currentlyProcessing')}
                  />
                  <div
                    style={{
                      width: `${((stats.needsCorrection + stats.failed + stats.uploaded) / stats.total) * 100}%`,
                    }}
                    className="bg-amber-500 transition-all duration-300"
                    title={t('pendingDocs')}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">{t('totalDocsReceived')}</span>
                <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                  {stats.total}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('completedDocs')}</span>
                <span className="font-mono font-semibold text-emerald-700 text-sm tabular-nums">
                  {stats.completed}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('pendingDocs')}</span>
                <span className="font-mono font-semibold text-amber-700 text-sm tabular-nums">
                  {stats.pending}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('currentlyProcessing')}</span>
                <span className="font-mono font-semibold text-teal-700 text-sm tabular-nums">
                  {stats.processing}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('awaitingVerification')}</span>
                <span className="font-mono font-semibold text-blue-700 text-sm tabular-nums">
                  {stats.awaitingVerification}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('needsCorrection')}</span>
                <span className="font-mono font-semibold text-red-700 text-sm tabular-nums">
                  {stats.needsCorrection}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Work Summary integrated cleanly */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              {t('dailyWorkSummary')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">{t('receivedToday')}</p>
                <p className="text-lg font-display font-bold text-slate-900 mt-0.5 tabular-nums">
                  {stats.receivedToday}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('processedToday')}</p>
                <p className="text-lg font-display font-bold text-teal-700 mt-0.5 tabular-nums">
                  {stats.processedToday}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('verifiedToday')}</p>
                <p className="text-lg font-display font-bold text-emerald-700 mt-0.5 tabular-nums">
                  {stats.verifiedToday}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('pendingToday')}</p>
                <p className="text-lg font-display font-bold text-amber-700 mt-0.5 tabular-nums">
                  {stats.pendingToday}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* D. Quick Actions */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-display font-semibold text-slate-900 mb-3.5">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {[
              { label: t('actionUploadNew'), to: '/upload', icon: <Upload className="w-4 h-4" /> },
              { label: t('actionScanDoc'), to: '/scan', icon: <Camera className="w-4 h-4" /> },
              { label: t('actionProcessDocs'), to: '/processing', icon: <Cpu className="w-4 h-4" /> },
              {
                label: t('actionContinuePending'),
                to: '/pending',
                icon: <Clock className="w-4 h-4" />,
              },
              {
                label: t('actionVerifyDocs'),
                to: '/verification',
                icon: <CheckSquare className="w-4 h-4" />,
              },
              {
                label: t('actionViewRecords'),
                to: '/records',
                icon: <Archive className="w-4 h-4" />,
              },
              {
                label: t('actionOpenAssistant'),
                to: '/assistant',
                icon: <Bot className="w-4 h-4" />,
              },
            ].map((act) => (
              <button
                key={act.to}
                type="button"
                onClick={() => navigate(act.to)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-[#123254] hover:bg-slate-50 text-left text-xs font-medium text-slate-800 transition-colors cursor-pointer"
              >
                <span className="text-[#123254] shrink-0">{act.icon}</span>
                <span className="truncate">{act.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* E. Recent Documents */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-base font-display font-semibold text-slate-900">
            {t('recentDocuments')}
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchRecordsPlaceholder')}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-60 focus:outline-none focus:border-[#123254]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
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
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
            </select>
          </div>
        </div>

        {filteredRecent.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">{t('emptyRecords')}</p>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="mt-3 px-4 py-2 bg-[#123254] text-white text-xs font-medium rounded-lg hover:bg-[#0d2642] cursor-pointer"
            >
              {t('actionUploadNew')}
            </button>
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
                  <th className="py-3 px-4 whitespace-nowrap">{t('languageLabel')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('uploadDate')}</th>
                  <th className="py-3 px-4 whitespace-nowrap">{t('status')}</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecent.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
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
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {doc.documentLanguage}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
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
                        className="text-xs font-semibold text-[#123254] hover:text-[#0F766E] cursor-pointer"
                      >
                        {doc.status === 'Uploaded' || doc.status === 'Failed'
                          ? pick('Process', 'ಸಂಸ್ಕರಿಸಿ')
                          : doc.status === 'Completed'
                            ? t('viewDetails')
                            : t('editVerify')}
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
