import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { ExtractedField } from '../types';
import { DocumentPreview } from '../components/DocumentPreview';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { StatusBadge } from '../components/StatusBadge';
import { getConfidenceLevel } from '../utils/documentStatus';
import { TranslationKey } from '../utils/translations';

export function Verification() {
  const { id } = useParams<{ id: string }>();
  const { language, t, pick } = useLanguage();
  const {
    documents,
    saveVerificationDraft,
    approveDocument,
    markNeedsCorrection,
    processDocumentOcr,
  } = useDocuments();
  const navigate = useNavigate();

  const verifiableDocs = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.status === 'Awaiting Verification' ||
          d.status === 'Needs Correction' ||
          d.status === 'Completed'
      ),
    [documents]
  );

  const activeDoc = useMemo(() => {
    if (id) return documents.find((d) => d.id === id) || null;
    return (
      documents.find((d) => d.status === 'Awaiting Verification') ||
      documents.find((d) => d.status === 'Needs Correction') ||
      verifiableDocs[0] ||
      null
    );
  }, [id, documents, verifiableDocs]);

  const [extractedText, setExtractedText] = useState('');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [officerNotes, setOfficerNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (activeDoc) {
      setExtractedText(activeDoc.extractedText || '');
      setFields(activeDoc.fields.map((f) => ({ ...f })));
      setOfficerNotes(activeDoc.officerNotes || '');
      setCorrectionReason(activeDoc.correctionReason || '');
      setSavedNotice('');
    }
  }, [activeDoc]);

  const hasLowConfidence = useMemo(
    () => fields.some((f) => f.value.trim() !== '' && getConfidenceLevel(f.confidence) === 'low'),
    [fields]
  );

  const uncertainHints = useMemo(
    () =>
      fields
        .filter((f) => f.value.trim() !== '' && f.confidence < 85 && f.boundingHint)
        .map((f) => `${f.label}: ${f.boundingHint}`),
    [fields]
  );

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
  };

  const getFieldLabel = (field: ExtractedField) => {
    const key = `field_${field.key}` as TranslationKey;
    const translated = t(key);
    return translated !== key ? translated : field.label;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('verificationTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('verificationSubtitle')}</p>
        </div>

        {verifiableDocs.length > 0 && (
          <select
            value={activeDoc?.id || ''}
            onChange={(e) => navigate(`/verification/${e.target.value}`)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63] max-w-xs"
          >
            {verifiableDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} · {d.fileName} ({d.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {!activeDoc ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">{t('noDocsToVerify')}</p>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="mt-4 px-4 py-2 bg-[#173B63] text-white text-xs font-medium rounded-lg hover:bg-[#112d4d] cursor-pointer"
          >
            {t('actionUploadNew')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Original Handwritten Document */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-display font-semibold text-slate-900">
                    {t('originalDocument')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeDoc.id} ·{' '}
                    {language === 'kn' ? activeDoc.officeNameKn : activeDoc.officeNameEn}
                  </p>
                </div>
                <StatusBadge status={activeDoc.status} />
              </div>

              <DocumentPreview
                dataUrl={activeDoc.dataUrl}
                mimeType={activeDoc.mimeType}
                fileName={activeDoc.fileName}
                heightClass="h-[540px]"
              />

              {uncertainHints.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">
                    {pick('OCR Region Highlights to Inspect:', 'ಪರಿಶೀಲಿಸಬೇಕಾದ OCR ಭಾಗಗಳು:')}
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {uncertainHints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Extracted Text, Structured Fields, Confidence & Actions */}
          <div className="lg:col-span-6 space-y-5">
            {hasLowConfidence && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t('confidenceLow')}</p>
                  <p className="mt-0.5">{t('lowConfidenceWarning')}</p>
                </div>
              </div>
            )}

            {activeDoc.ocrNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
                <span className="font-semibold">{pick('OCR Notes: ', 'OCR ಟಿಪ್ಪಣಿ: ')}</span>
                {activeDoc.ocrNotes}
              </div>
            )}

            {savedNotice && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{savedNotice}</span>
              </div>
            )}

            {/* Structured Editable Fields */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-base font-display font-semibold text-slate-900">
                  {t('structuredFieldsLabel')}
                </h2>
                <ConfidenceBadge score={activeDoc.overallConfidence} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => {
                  const level = getConfidenceLevel(field.confidence);
                  const borderHint =
                    field.value && level === 'low'
                      ? 'border-red-300 bg-red-50/30'
                      : field.value && level === 'medium'
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-slate-300 bg-white';

                  return (
                    <div key={field.key} className={field.key === 'address' || field.key === 'subject' ? 'sm:col-span-2' : ''}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="text-xs font-medium text-slate-700">
                          {getFieldLabel(field)}
                        </label>
                        {field.confidence > 0 && <ConfidenceBadge score={field.confidence} />}
                      </div>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-[#173B63] ${borderHint}`}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Full Extracted Text */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <label className="block text-sm font-display font-semibold text-slate-900">
                {t('extractedTextLabel')}
              </label>
              <textarea
                rows={8}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63] font-sans leading-relaxed"
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('officerNotesLabel')}
                </label>
                <input
                  type="text"
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder={pick('Add verification remarks...', 'ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ...')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder={t('correctionReasonPlaceholder')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    await approveDocument(activeDoc.id, {
                      extractedText,
                      fields,
                      officerNotes,
                    });
                    setSavedNotice(t('verificationApprovedMsg'));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('approveAndComplete')}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await saveVerificationDraft(activeDoc.id, {
                      extractedText,
                      fields,
                      officerNotes,
                    });
                    setSavedNotice(pick('Draft corrections saved.', 'ಕರಡು ತಿದ್ದುಪಡಿಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.'));
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('saveDraftCorrections')}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await markNeedsCorrection(activeDoc.id, correctionReason);
                    setSavedNotice(
                      pick('Flagged as Needs Correction.', 'ತಿದ್ದುಪಡಿ ಅಗತ್ಯವೆಂದು ಗುರುತಿಸಲಾಗಿದೆ.')
                    );
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-lg cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('markNeedsCorrection')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate(`/processing/${activeDoc.id}`);
                    void processDocumentOcr(activeDoc.id);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('sendForReprocessing')}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
