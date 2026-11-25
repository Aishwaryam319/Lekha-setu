import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
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
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import {
  getDepartmentById,
  getDistrictById,
  getTalukById,
} from '../utils/locationSearch';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentStatus } from '../types';

export function Dashboard() {
  const { language, t, pick } = useLanguage();
  const { documents, preferences, stats } = useDocuments();
  const navigate = useNavigate();

  const [chartRange, setChartRange] = useState<'weekly' | 'monthly'>('weekly');
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

  const overviewChartData = useMemo(() => {
    if (chartRange === 'weekly') {
      const days: { label: string; digitized: number; verified: number }[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const key = dt.toDateString();
        const label = dt.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
          weekday: 'short',
        });
        const digitized = documents.filter(
          (d) => new Date(d.uploadDate).toDateString() === key
        ).length;
        const verified = documents.filter(
          (d) => d.status === 'Completed' && d.completedDate && new Date(d.completedDate).toDateString() === key
        ).length;
        days.push({ label, digitized, verified });
      }
      return days;
    }

    const monthsMap = new Map<string, { label: string; digitized: number; verified: number }>();
    documents.forEach((d) => {
      const dt = new Date(d.uploadDate);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const label = dt.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
        month: 'short',
        year: '2-digit',
      });
      const entry = monthsMap.get(key) || { label, digitized: 0, verified: 0 };
      entry.digitized += 1;
      if (d.status === 'Completed') entry.verified += 1;
      monthsMap.set(key, entry);
    });
    return Array.from(monthsMap.values());
  }, [documents, chartRange, language]);

  const statCards = [
    {
      label: t('totalDocsReceived'),
      count: stats.total,
      sub: pick('Stored in local IndexedDB', 'ಸ್ಥಳೀಯ IndexedDB ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ'),
      subColor: 'text-slate-600',
      icon: <FileText className="w-4 h-4 text-[#0C2340]" />,
      to: '/records',
    },
    {
      label: t('completedDocs'),
      count: stats.completed,
      sub: `${stats.completionPercentage}% ${pick('verified rate', 'ಪರಿಶೀಲಿತ ದರ')}`,
      subColor: 'text-emerald-800',
      icon: <FileCheck2 className="w-4 h-4 text-emerald-800" />,
      to: '/completed',
    },
    {
      label: t('pendingDocs'),
      count: stats.pending,
      sub: pick('Requires officer action', 'ಅಧಿಕಾರಿ ಕ್ರಮ ಅಗತ್ಯವಿದೆ'),
      subColor: 'text-amber-800',
      icon: <Clock className="w-4 h-4 text-amber-800" />,
      to: '/pending',
    },
    {
      label: t('currentlyProcessing'),
      count: stats.processing,
      sub: pick('Active OCR queue', 'ಸಕ್ರಿಯ OCR ಸರದಿ'),
      subColor: 'text-teal-800',
      icon: <Loader2 className="w-4 h-4 text-teal-800" />,
      to: '/processing',
    },
    {
      label: t('awaitingVerification'),
      count: stats.awaitingVerification,
      sub: pick('Requires officer review', 'ಅಧಿಕಾರಿ ಪರಿಶೀಲನೆ ಅಗತ್ಯ'),
      subColor: 'text-[#0C2340]',
      icon: <CheckSquare className="w-4 h-4 text-[#0C2340]" />,
      to: '/verification',
    },
    {
      label: t('needsCorrection'),
      count: stats.needsCorrection,
      sub: pick('Flagged for correction', 'ತಿದ್ದುಪಡಿಗಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ'),
      subColor: 'text-red-800',
      icon: <AlertTriangle className="w-4 h-4 text-red-800" />,
      to: '/pending',
    },
  ];

  const quickActionsList = [
    {
      title: t('actionUploadNew'),
      desc: pick('Upload JPG, PNG or PDF records', 'JPG, PNG ಅಥವಾ PDF ದಾಖಲೆ ಅಪ್‌ಲೋಡ್'),
      to: '/upload',
      icon: <Upload className="w-4 h-4 text-[#0C2340]" />,
    },
    {
      title: t('actionScanDoc'),
      desc: pick('Capture handwritten page via camera', 'ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಕೈಬರಹ ಸ್ಕ್ಯಾನ್'),
      to: '/scan',
      icon: <Camera className="w-4 h-4 text-[#0C2340]" />,
    },
    {
      title: t('actionVerifyDocs'),
      desc: pick('Review & approve extracted fields', 'ಹೊರತೆಗೆದ ವಿವರ ಪರಿಶೀಲಿಸಿ'),
      to: '/verification',
      icon: <CheckSquare className="w-4 h-4 text-[#0C2340]" />,
    },
    {
      title: t('actionProcessDocs'),
      desc: pick('Run Kannada & English OCR', 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ OCR'),
      to: '/processing',
      icon: <Cpu className="w-4 h-4 text-[#0C2340]" />,
    },
    {
      title: t('actionViewRecords'),
      desc: pick('Search, filter & export records', 'ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ರಫ್ತು ಮಾಡಿ'),
      to: '/records',
      icon: <Archive className="w-4 h-4 text-[#0C2340]" />,
    },
    {
      title: t('actionOpenAssistant'),
      desc: pick('Bilingual Kannada & English help', 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ AI ಸಹಾಯ'),
      to: '/assistant',
      icon: <Bot className="w-4 h-4 text-[#0C2340]" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Official Karnataka Government Portal Hero Banner */}
      <section className="rounded-md overflow-hidden bg-[#0C2340] text-white border border-[#08192E] border-b-2 border-b-[#EAB308]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Hero Copy & Actions */}
          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center">
            <p className="text-xs text-[#FDE047] font-semibold tracking-wide">
              {pick(
                'GOVERNMENT OF KARNATAKA · OFFLINE-FIRST DOCUMENT REGISTRY',
                'ಕರ್ನಾಟಕ ಸರ್ಕಾರ · ಆಫ್‌ಲೈನ್-ಫಸ್ಟ್ ದಾಖಲೆ ನೋಂದಣಿ'
              )}
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white mt-2">
              {pick('Welcome to LEKHASETU', 'ಲೇಖಸೇತುಗೆ ಸ್ವಾಗತ')}
            </h1>
            <p className="text-sm sm:text-base text-slate-100 mt-1.5 font-medium">
              {pick(
                'Smart Document Intelligence for Karnataka Government',
                'ಕರ್ನಾಟಕ ಸರ್ಕಾರಕ್ಕಾಗಿ ಸ್ಮಾರ್ಟ್ ದಾಖಲೆ ಬುದ್ಧಿವಂತಿಕೆ ವೇದಿಕೆ'
              )}
            </p>
            <p className="text-xs text-slate-300 mt-2">
              {pick(
                'Digitize · Verify · Track · Search · Manage',
                'ಡಿಜಿಟಲೀಕರಿಸಿ · ಪರಿಶೀಲಿಸಿ · ಟ್ರ್ಯಾಕ್ ಮಾಡಿ · ಹುಡುಕಿ · ನಿರ್ವಹಿಸಿ'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-[#0C2340] text-sm font-semibold rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>{t('actionScanDoc')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#163B68] hover:bg-[#1E4B82] border border-white/25 text-white text-sm font-medium rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{t('actionUploadNew')}</span>
              </button>
            </div>
          </div>

          {/* Right Vidhana Soudha Monument Photograph */}
          <div className="lg:col-span-5 relative h-[220px] sm:h-[250px] lg:h-[265px] overflow-hidden border-t lg:border-t-0 lg:border-l border-white/20">
            <img
              src="/assets/aistudio/AdobeExpressPhotos_e5e60e6cd3ce4f1eb29a216fd07a4cb2_CopyEdited_946aa2c9.png"
              alt="Vidhana Soudha, Government of Karnataka"
              className="w-full h-full object-cover object-[center_12%]"
            />
          </div>
        </div>
      </section>

      {/* Active Department & Office Strip */}
      <section className="bg-white border border-slate-300 rounded-md px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-300 text-[#0C2340] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
              <span>{t('activeOfficeHeader')}:</span>
              <strong className="text-slate-900 font-semibold text-sm truncate">
                {activeOffice}
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600 mt-0.5">
              <span>
                {activeDept ? (language === 'kn' ? activeDept.nameKn : activeDept.nameEn) : '—'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {activeDist ? (language === 'kn' ? activeDist.nameKn : activeDist.nameEn) : '—'}
              </span>
              {activeDept?.requiresTaluk && activeTaluk && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{language === 'kn' ? activeTaluk.nameKn : activeTaluk.nameEn}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/department')}
          className="px-3.5 py-2 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {t('changeSelection')}
        </button>
      </section>

      {/* Six Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => navigate(card.to)}
            className="text-left bg-white border border-slate-300 hover:border-[#0C2340] rounded-md p-4 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 leading-snug">
                {card.label}
              </span>
              <span className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {card.icon}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-[#0C2340] mt-2 tabular-nums">
              {card.count}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${card.subColor}`}>
              {card.sub}
            </p>
          </button>
        ))}
      </section>

      {/* Overview Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Document Processing Overview */}
        <section className="lg:col-span-8 bg-white border border-slate-300 rounded-md overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-display font-bold text-[#0C2340]">
                {t('progressOverview')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {pick(
                  'Digitization vs officer verification trend & completion progress',
                  'ಡಿಜಿಟಲೀಕರಣ ಮತ್ತು ಅಧಿಕಾರಿ ಪರಿಶೀಲನಾ ಪ್ರವೃತ್ತಿ'
                )}
              </p>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-300">
              <button
                type="button"
                onClick={() => setChartRange('weekly')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                  chartRange === 'weekly'
                    ? 'bg-[#0C2340] text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {pick('Weekly', 'ವಾರದ')}
              </button>
              <button
                type="button"
                onClick={() => setChartRange('monthly')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                  chartRange === 'monthly'
                    ? 'bg-[#0C2340] text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {pick('Monthly', 'ತಿಂಗಳ')}
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between gap-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overviewChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="digitized"
                    name={pick('Received / Digitized', 'ಸ್ವೀಕರಿಸಿದ ದಾಖಲೆಗಳು')}
                    stroke="#0C2340"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="verified"
                    name={pick('Officer Verified', 'ಅಧಿಕಾರಿ ಪರಿಶೀಲಿಸಿದ')}
                    stroke="#0F766E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Completion Progress Bar + Daily Summary */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700">
                  {t('overallCompletion')} ({stats.completed}/{stats.total})
                </span>
                <span className="font-mono font-semibold text-[#0C2340] tabular-nums">
                  {stats.completionPercentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-sm overflow-hidden">
                <div
                  style={{ width: `${stats.completionPercentage}%` }}
                  className="h-full bg-[#0F766E] transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-600 block">{t('receivedToday')}</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {stats.receivedToday}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block">{t('processedToday')}</span>
                  <span className="font-mono font-semibold text-teal-800 tabular-nums">
                    {stats.processedToday}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block">{t('verifiedToday')}</span>
                  <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                    {stats.verifiedToday}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block">{t('pendingToday')}</span>
                  <span className="font-mono font-semibold text-amber-800 tabular-nums">
                    {stats.pendingToday}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Quick Actions Card */}
        <section className="lg:col-span-4 bg-white border border-slate-300 rounded-md overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200">
            <h2 className="text-sm font-display font-bold text-[#0C2340]">
              {t('quickActions')}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {pick(
                'Digitize · Verify · Track · Search · Manage',
                'ಡಿಜಿಟಲೀಕರಿಸಿ · ಪರಿಶೀಲಿಸಿ · ಟ್ರ್ಯಾಕ್ ಮಾಡಿ · ಹುಡುಕಿ'
              )}
            </p>
          </div>

          <div className="p-4 space-y-2 flex-1">
            {quickActionsList.map((act) => (
              <button
                key={act.to}
                type="button"
                onClick={() => navigate(act.to)}
                className="w-full flex items-center justify-between gap-3 p-2.5 rounded border border-slate-200 hover:border-[#0C2340] hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {act.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">{act.desc}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Documents Table */}
      <section className="bg-white border border-slate-300 rounded-md overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-sm font-display font-bold text-[#0C2340]">
            {t('recentDocuments')}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchRecordsPlaceholder')}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded w-60 focus:outline-none focus:border-[#0C2340]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0C2340]"
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
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0C2340]"
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
              className="mt-3 px-4 py-2 bg-[#0C2340] text-white text-xs font-medium rounded hover:bg-[#163B68] cursor-pointer"
            >
              {t('actionUploadNew')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-[#EEF2F6] text-xs font-semibold text-slate-800">
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('docId')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('docName')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('department')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">
                    {t('district')} / {t('taluk')}
                  </th>
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('languageLabel')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('uploadDate')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">{t('status')}</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredRecent.map((doc) => (
                  <tr key={doc.id} className="even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {doc.id}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                      {doc.fileName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                      {language === 'kn' ? doc.departmentNameKn : doc.departmentNameEn}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                      {language === 'kn' ? doc.districtNameKn : doc.districtNameEn}
                      {doc.talukNameEn
                        ? ` · ${language === 'kn' ? doc.talukNameKn : doc.talukNameEn}`
                        : ''}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                      {doc.documentLanguage}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
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
                        className="text-xs font-semibold text-[#0C2340] hover:underline cursor-pointer"
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
