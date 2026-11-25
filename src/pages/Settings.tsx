import React, { useRef, useState } from 'react';
import { CheckCircle2, Database, Download, Trash2, Upload } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { ActiveSelection, DocumentRecord, OfficerProfile } from '../types';
import { DepartmentLocationSelector } from '../components/DepartmentLocationSelector';
import { formatFileSize } from '../utils/documentStatus';

export function Settings() {
  const { language, setLanguage, t, pick } = useLanguage();
  const {
    documents,
    preferences,
    systemHealth,
    isOnline,
    updateOfficerProfile,
    updateActiveSelection,
    updatePreferences,
    clearAllDocuments,
    importDocumentsBackup,
    refreshHealth,
  } = useDocuments();

  const [profile, setProfile] = useState<OfficerProfile>(preferences.officerProfile);
  const [selection, setSelection] = useState<ActiveSelection>(preferences.activeSelection);
  const [profileSaved, setProfileSaved] = useState(false);
  const [officeSaved, setOfficeSaved] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateOfficerProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleExportFullBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'LEKHASETU',
      documents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lekhasetu-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.documents;
        if (!Array.isArray(list)) {
          setBackupMessage(pick('Invalid backup JSON format.', 'ಅಮಾನ್ಯ ಬ್ಯಾಕಪ್ JSON ಫೈಲ್.'));
          return;
        }
        const imported = await importDocumentsBackup(list as DocumentRecord[]);
        setBackupMessage(
          pick(`Restored ${imported} record(s) into local IndexedDB.`, `${imported} ದಾಖಲೆಗಳನ್ನು ಸ್ಥಳೀಯ ಡೇಟಾಬೇಸ್‌ಗೆ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.`)
        );
      } catch {
        setBackupMessage(pick('Failed to parse backup file.', 'ಬ್ಯಾಕಪ್ ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ.'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {t('settingsTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t('settingsSubtitle')}</p>
      </div>

      {/* Officer Profile */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-display font-semibold text-slate-900 mb-4">
          {t('profileSection')}
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('officerName')}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('officerDesignation')}
              </label>
              <input
                type="text"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('employeeId')}
              </label>
              <input
                type="text"
                value={profile.employeeId}
                onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#173B63]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSaved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                {pick('Officer profile saved.', 'ಅಧಿಕಾರಿ ವಿವರವನ್ನು ಉಳಿಸಲಾಗಿದೆ.')}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#173B63] hover:bg-[#112d4d] text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              {t('saveProfile')}
            </button>
          </div>
        </form>
      </section>

      {/* Default Department / District / Taluk / Office */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-display font-semibold text-slate-900">
          {t('activeOfficeHeader')}
        </h2>
        <DepartmentLocationSelector
          value={selection}
          onChange={(next) => {
            setSelection(next);
            setOfficeSaved(false);
          }}
          onSave={() => {
            updateActiveSelection(selection);
            setOfficeSaved(true);
            setTimeout(() => setOfficeSaved(false), 3000);
          }}
          savedBanner={officeSaved}
        />
      </section>

      {/* Interface Preferences */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-display font-semibold text-slate-900">
          {t('preferencesSection')}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-100">
          <span className="text-sm text-slate-700">{t('languageLabel')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                language === 'en'
                  ? 'bg-[#173B63] text-white border-[#173B63]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                language === 'kn'
                  ? 'bg-[#173B63] text-white border-[#173B63]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
          <span className="text-sm text-slate-700">{t('compactTablesLabel')}</span>
          <input
            type="checkbox"
            checked={preferences.compactTables}
            onChange={(e) => updatePreferences({ compactTables: e.target.checked })}
            className="w-4 h-4 accent-[#173B63]"
          />
        </label>
      </section>

      {/* Local Storage, Services & Backup */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-display font-semibold text-slate-900">
            {t('storageSection')}
          </h2>
          <button
            type="button"
            onClick={refreshHealth}
            className="text-xs font-medium text-[#173B63] hover:underline cursor-pointer"
          >
            {pick('Check Services', 'ಸೇವೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">{t('localDbConnection')}</span>
            <span className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#0D9488]" />
              {systemHealth.indexedDbConnected ? t('operational') : t('unavailable')}
            </span>
            {typeof systemHealth.storageUsedBytes === 'number' && (
              <span className="text-[11px] text-slate-500 font-mono tabular-nums mt-1 block">
                {formatFileSize(systemHealth.storageUsedBytes)} used
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">{t('ocrEngineStatus')}</span>
            <span className="font-semibold text-slate-900 mt-1 block">
              {isOnline && systemHealth.ocrEngine.status === 'online'
                ? systemHealth.ocrEngine.provider
                : t('unavailable')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">{t('ragServiceStatus')}</span>
            <span className="font-semibold text-slate-900 mt-1 block">
              {isOnline && systemHealth.ragAssistant.status === 'online'
                ? systemHealth.ragAssistant.provider
                : t('offlineFallbackActive')}
            </span>
          </div>
        </div>

        {backupMessage && (
          <p className="text-xs font-medium text-emerald-700">{backupMessage}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportFullBackup}
            disabled={documents.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportBackup')}</span>
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportBackup(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{pick('Restore Backup (JSON)', 'ಬ್ಯಾಕಪ್ ಮರುಸ್ಥಾಪಿಸಿ (JSON)')}</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={documents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-800 text-xs font-medium rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clearAllRecordsBtn')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await clearAllDocuments();
                  setConfirmClear(false);
                }}
                className="px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                {t('confirmDeleteBtn')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Application Info */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 text-xs text-slate-600 space-y-1">
        <h2 className="text-base font-display font-semibold text-slate-900 mb-2">
          {t('appInfoSection')}
        </h2>
        <p>
          <strong className="text-slate-900">LEKHASETU</strong> — {t('appTagline')}
        </p>
        <p>
          {pick(
            'Offline-first Karnataka Government Document Digitization & Verification Platform (IndexedDB + Bilingual Kannada/English OCR).',
            'ಆಫ್‌ಲೈನ್-ಫಸ್ಟ್ ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ದಾಖಲೆ ಡಿಜಿಟಲೀಕರಣ ಮತ್ತು ಪರಿಶೀಲನಾ ವೇದಿಕೆ.'
          )}
        </p>
      </section>
    </div>
  );
}
