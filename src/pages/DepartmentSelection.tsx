import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { ActiveSelection } from '../types';
import { DepartmentLocationSelector } from '../components/DepartmentLocationSelector';
import {
  KARNATAKA_DISTRICTS,
  KARNATAKA_TALUKS,
  getTaluksForDistrict,
  matchesBilingualQuery,
} from '../utils/locationSearch';

export function DepartmentSelection() {
  const { language, t, pick } = useLanguage();
  const { preferences, updateActiveSelection } = useDocuments();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ActiveSelection>(preferences.activeSelection);
  const [savedBanner, setSavedBanner] = useState(false);
  const [dirSearch, setDirSearch] = useState('');

  const handleSave = () => {
    updateActiveSelection(draft);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const directoryMatches = useMemo(() => {
    const q = dirSearch.trim();
    return KARNATAKA_DISTRICTS.map((dist) => {
      const taluks = getTaluksForDistrict(dist.id);
      const distMatched = matchesBilingualQuery(q, dist.nameEn, dist.nameKn, dist.division);
      const matchingTaluks = distMatched
        ? taluks
        : taluks.filter((tk) => matchesBilingualQuery(q, tk.nameEn, tk.nameKn));

      if (!distMatched && matchingTaluks.length === 0) return null;
      return {
        district: dist,
        taluks: matchingTaluks,
      };
    }).filter(Boolean) as {
      district: (typeof KARNATAKA_DISTRICTS)[number];
      taluks: typeof KARNATAKA_TALUKS;
    }[];
  }, [dirSearch]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('navDepartment')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {pick(
              'Select your Karnataka Government department, district, taluk, and office before uploading or scanning documents.',
              'ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಇಲಾಖೆ, ಜಿಲ್ಲೆ, ತಾಲ್ಲೂಕು ಮತ್ತು ಕಚೇರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            updateActiveSelection(draft);
            navigate('/upload');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0C2340] hover:bg-[#163B68] text-white text-sm font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{t('actionUploadNew')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cascading Department & Location Form */}
      <section className="bg-white border border-slate-300 rounded-md p-6">
        <DepartmentLocationSelector
          value={draft}
          onChange={(next) => {
            setDraft(next);
            setSavedBanner(false);
          }}
          onSave={handleSave}
          savedBanner={savedBanner}
        />
      </section>

      {/* Offline Karnataka Administrative Directory Explorer */}
      <section className="bg-white border border-slate-300 rounded-md overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-display font-bold text-[#0C2340]">
              {t('directoryCountLabel')}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
              {KARNATAKA_DISTRICTS.length} {t('district')} · {KARNATAKA_TALUKS.length} {t('taluk')} ·{' '}
              {pick('Works 100% offline', 'ಸಂಪೂರ್ಣವಾಗಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ')}
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              placeholder={t('searchDistrictPlaceholder')}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded w-72 focus:outline-none focus:border-[#0C2340]"
            />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {directoryMatches.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('noResultsFound')}</div>
          ) : (
            directoryMatches.map(({ district, taluks }) => (
              <div key={district.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#173B63]" />
                    <span className="text-sm font-semibold text-slate-900">
                      {language === 'kn' ? district.nameKn : district.nameEn}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({language === 'kn' ? district.nameEn : district.nameKn}) · {district.division}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {taluks.length} {t('taluk')}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600 pl-6">
                  {taluks.map((tk, idx) => (
                    <button
                      key={tk.id}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => ({
                          ...prev,
                          districtId: district.id,
                          talukId: tk.id,
                          officeId: '',
                          officeNameEn: '',
                          officeNameKn: '',
                        }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-[#173B63] hover:underline cursor-pointer"
                    >
                      {language === 'kn' ? tk.nameKn : tk.nameEn}
                      {idx < taluks.length - 1 ? ',' : ''}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
