import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { KARNATAKA_DEPARTMENTS, KARNATAKA_DISTRICTS } from '../utils/locationSearch';
import { exportDocumentsToCSV, exportDocumentsToJSON } from '../utils/exportUtils';
import { isPendingStatus } from '../utils/documentStatus';

const CHART_COLORS = ['#173B63', '#0D9488', '#2563EB', '#D97706', '#16A34A', '#DC2626'];

export function Reports() {
  const { language, t, pick } = useLanguage();
  const { documents } = useDocuments();

  const [deptFilter, setDeptFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [langFilter, setLangFilter] = useState('ALL');

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (deptFilter !== 'ALL' && d.departmentId !== deptFilter) return false;
      if (districtFilter !== 'ALL' && d.districtId !== districtFilter) return false;
      if (langFilter !== 'ALL' && d.documentLanguage !== langFilter) return false;
      return true;
    });
  }, [documents, deptFilter, districtFilter, langFilter]);

  const kpis = useMemo(() => {
    const total = filteredDocs.length;
    const completed = filteredDocs.filter((d) => d.status === 'Completed').length;
    const pending = filteredDocs.filter((d) => isPendingStatus(d.status)).length;
    const processing = filteredDocs.filter((d) => d.status === 'Processing').length;
    const awaiting = filteredDocs.filter((d) => d.status === 'Awaiting Verification').length;
    const correction = filteredDocs.filter((d) => d.status === 'Needs Correction').length;
    return { total, completed, pending, processing, awaiting, correction };
  }, [filteredDocs]);

  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    filteredDocs.forEach((d) => {
      const name = language === 'kn' ? d.departmentNameKn : d.departmentNameEn;
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filteredDocs, language]);

  const districtData = useMemo(() => {
    const map = new Map<string, number>();
    filteredDocs.forEach((d) => {
      const name = language === 'kn' ? d.districtNameKn : d.districtNameEn;
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredDocs, language]);

  const languageData = useMemo(() => {
    const map = new Map<string, number>();
    filteredDocs.forEach((d) => {
      map.set(d.documentLanguage, (map.get(d.documentLanguage) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDocs]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    filteredDocs.forEach((d) => {
      map.set(d.status, (map.get(d.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filteredDocs]);

  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string; received: number; verified: number }>();
    filteredDocs.forEach((d) => {
      const day = new Date(d.uploadDate).toLocaleDateString('en-CA');
      const curr = map.get(day) || { date: day, received: 0, verified: 0 };
      curr.received += 1;
      if (d.status === 'Completed') curr.verified += 1;
      map.set(day, curr);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredDocs]);

  const confidenceBuckets = useMemo(() => {
    const buckets = [
      { range: '85-100% (High)', count: 0 },
      { range: '65-84% (Medium)', count: 0 },
      { range: '<65% (Low)', count: 0 },
      { range: 'Not Run', count: 0 },
    ];
    filteredDocs.forEach((d) => {
      if (d.overallConfidence <= 0) buckets[3].count += 1;
      else if (d.overallConfidence >= 85) buckets[0].count += 1;
      else if (d.overallConfidence >= 65) buckets[1].count += 1;
      else buckets[2].count += 1;
    });
    return buckets;
  }, [filteredDocs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('reportsTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('reportsSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={filteredDocs.length === 0}
            onClick={() => exportDocumentsToCSV(filteredDocs, 'lekhasetu-analytics-report.csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            type="button"
            disabled={filteredDocs.length === 0}
            onClick={() => exportDocumentsToJSON(filteredDocs, 'lekhasetu-analytics-report.json')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportJson')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
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
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
        >
          <option value="ALL">{t('allDistricts')}</option>
          {KARNATAKA_DISTRICTS.map((dist) => (
            <option key={dist.id} value={dist.id}>
              {language === 'kn' ? dist.nameKn : dist.nameEn}
            </option>
          ))}
        </select>

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
      </section>

      {/* Summary Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t('totalDocsReceived'), val: kpis.total, color: 'text-[#173B63]' },
          { label: t('completedDocs'), val: kpis.completed, color: 'text-emerald-700' },
          { label: t('pendingDocs'), val: kpis.pending, color: 'text-amber-700' },
          { label: t('currentlyProcessing'), val: kpis.processing, color: 'text-teal-700' },
          { label: t('awaitingVerification'), val: kpis.awaiting, color: 'text-blue-700' },
          { label: t('needsCorrection'), val: kpis.correction, color: 'text-red-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 truncate">{item.label}</p>
            <p className={`text-xl font-display font-bold mt-1 tabular-nums ${item.color}`}>
              {item.val}
            </p>
          </div>
        ))}
      </section>

      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">{t('noChartData')}</p>
          <p className="text-xs text-slate-500 mt-1">
            {pick(
              'Analytics charts populate automatically from real uploaded and verified records.',
              'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಮತ್ತು ಪರಿಶೀಲಿಸಿದ ನೈಜ ದಾಖಲೆಗಳಿಂದ ವಿಶ್ಲೇಷಣಾ ಚಾರ್ಟ್‌ಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನವೀಕರಣಗೊಳ್ಳುತ್ತವೆ.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('deptDistribution')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#173B63" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('districtDistribution')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('languageBreakdown')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {languageData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('statusBreakdown')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('dailyProcessingTrend')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="received" stroke="#173B63" strokeWidth={2} />
                  <Line type="monotone" dataKey="verified" stroke="#16A34A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-display font-semibold text-slate-900 mb-4">
              {t('confidenceDistribution')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
