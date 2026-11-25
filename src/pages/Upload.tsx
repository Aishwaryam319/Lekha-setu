import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Sparkles,
  Trash2,
  Upload as UploadIcon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { DocumentLanguageOption } from '../types';
import { formatFileSize } from '../utils/documentStatus';
import { getDepartmentById, getDistrictById, getTalukById } from '../utils/locationSearch';
import { DocumentPreview } from '../components/DocumentPreview';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export function Upload() {
  const { language, t, pick } = useLanguage();
  const { preferences, createDocument, processDocumentOcr } = useDocuments();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    dataUrl: string;
    source: 'upload' | 'sample';
  } | null>(null);
  const [docLanguage, setDocLanguage] = useState<DocumentLanguageOption>(
    'Bilingual (Kannada + English)'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sel = preferences.activeSelection;
  const activeDept = getDepartmentById(sel.departmentId);
  const activeDist = getDistrictById(sel.districtId);
  const activeTaluk = sel.talukId ? getTalukById(sel.talukId) : undefined;
  const officeDisplay =
    sel.customOfficeName.trim() ||
    (language === 'kn' ? sel.officeNameKn : sel.officeNameEn) ||
    '';

  const isOfficeComplete = Boolean(
    sel.departmentId &&
      sel.districtId &&
      (!activeDept?.requiresTaluk || sel.talukId) &&
      officeDisplay
  );

  const validateAndLoadFile = (file: File) => {
    setErrorMsg('');
    const mime = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExt = ['jpg', 'jpeg', 'png', 'pdf'].includes(ext);

    if (!ALLOWED_TYPES.includes(mime) && !validExt) {
      setErrorMsg(t('invalidFileType'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(t('fileTooLarge'));
      return;
    }

    const resolvedMime =
      mime || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedFile({
          name: file.name,
          size: file.size,
          mimeType: resolvedMime,
          dataUrl: reader.result,
          source: 'upload',
        });
      }
    };
    reader.onerror = () => {
      setErrorMsg(pick('Failed to read selected file.', 'ಆಯ್ಕೆ ಮಾಡಿದ ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ.'));
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = async () => {
    setErrorMsg('');
    try {
      const resp = await fetch('/src/assets/images/sample_kannada_application_1795616046727.jpg');
      if (!resp.ok) throw new Error('Sample asset not found');
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedFile({
            name: 'sample_residence_certificate_application.jpg',
            size: blob.size,
            mimeType: 'image/jpeg',
            dataUrl: reader.result,
            source: 'sample',
          });
          setDocLanguage('Bilingual (Kannada + English)');
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setErrorMsg(pick('Unable to load sample document image.', 'ಮಾದರಿ ದಾಖಲೆ ಚಿತ್ರವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.'));
    }
  };

  const handleSubmit = async (processImmediately: boolean) => {
    if (!selectedFile) return;
    if (!isOfficeComplete) {
      setErrorMsg(t('completeOfficeFirst'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const doc = await createDocument({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.mimeType,
        dataUrl: selectedFile.dataUrl,
        source: selectedFile.source,
        documentLanguage: docLanguage,
      });

      if (processImmediately) {
        navigate(`/processing/${doc.id}`);
        void processDocumentOcr(doc.id);
      } else {
        navigate('/pending');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save document.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {t('uploadTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t('uploadSubtitle')}</p>
      </div>

      {/* Associated Office Summary */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#173B63]">{t('activeOfficeHeader')}:</span>
          <span>
            {activeDept ? (language === 'kn' ? activeDept.nameKn : activeDept.nameEn) : '—'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {activeDist ? (language === 'kn' ? activeDist.nameKn : activeDist.nameEn) : '—'}
          </span>
          {activeDept?.requiresTaluk && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {activeTaluk ? (language === 'kn' ? activeTaluk.nameKn : activeTaluk.nameEn) : '—'}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-medium text-slate-900">{officeDisplay || '—'}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/department')}
          className="text-xs font-semibold text-[#173B63] hover:underline cursor-pointer"
        >
          {t('changeSelection')}
        </button>
      </section>

      {!isOfficeComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 text-sm text-amber-900">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('completeOfficeFirst')}</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/department')}
            className="px-3 py-1.5 bg-amber-800 text-white text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
          >
            {t('navDepartment')}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload & Language Controls */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndLoadFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#0D9488] bg-teal-50/50'
                  : 'border-slate-300 hover:border-[#173B63] bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndLoadFile(file);
                  e.target.value = '';
                }}
              />
              <div className="w-11 h-11 rounded-full bg-[#173B63]/10 text-[#173B63] flex items-center justify-center mx-auto mb-3">
                <UploadIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{t('dragDropTitle')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('dragDropSubtitle')}</p>
              <span className="inline-block mt-3 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700">
                {t('browseFiles')}
              </span>
              <p className="text-[11px] text-slate-400 mt-3">{t('supportedFormats')}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLoadSample}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-teal-300 bg-teal-50/70 hover:bg-teal-100/70 text-teal-900 text-xs font-medium transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('loadSampleDoc')}</span>
              </button>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#173B63] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-[#173B63] hover:underline cursor-pointer"
                  >
                    {t('replaceFile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    aria-label={t('removeFile')}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Document Language Selection */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                {t('documentLanguageLabel')}
              </label>
              <p className="text-xs text-slate-500 mt-0.5">{t('docLangHintNote')}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    value: 'Kannada',
                    labelEn: 'Kannada (ಕನ್ನಡ)',
                    labelKn: 'ಕನ್ನಡ ಕೈಬರಹ',
                  },
                  {
                    value: 'English',
                    labelEn: 'English',
                    labelKn: 'ಇಂಗ್ಲಿಷ್ ಕೈಬರಹ',
                  },
                  {
                    value: 'Bilingual (Kannada + English)',
                    labelEn: 'Bilingual (Kannada + English)',
                    labelKn: 'ದ್ವಿಭಾಷಾ (ಕನ್ನಡ + ಇಂಗ್ಲಿಷ್)',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocLanguage(opt.value)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    docLanguage === opt.value
                      ? 'border-[#173B63] bg-[#173B63]/5 text-[#173B63]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{language === 'kn' ? opt.labelKn : opt.labelEn}</span>
                  {docLanguage === opt.value && <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />}
                </button>
              ))}
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={!selectedFile || submitting || !isOfficeComplete}
                onClick={() => handleSubmit(true)}
                className="flex-1 px-4 py-2.5 bg-[#173B63] hover:bg-[#112d4d] disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {t('saveAndProcess')}
              </button>
              <button
                type="button"
                disabled={!selectedFile || submitting || !isOfficeComplete}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {t('saveForLater')}
              </button>
            </div>
          </section>
        </div>

        {/* Right: Document Preview */}
        <div className="lg:col-span-7">
          {selectedFile ? (
            <DocumentPreview
              dataUrl={selectedFile.dataUrl}
              mimeType={selectedFile.mimeType}
              fileName={selectedFile.name}
              heightClass="h-[520px]"
            />
          ) : (
            <div className="h-[520px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                {pick('Document preview will appear here', 'ದಾಖಲೆಯ ಪೂರ್ವವೀಕ್ಷಣೆ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {pick(
                  'Select a file or load the sample bilingual application to inspect before OCR.',
                  'OCR ಗೂ ಮೊದಲು ಪರಿಶೀಲಿಸಲು ಫೈಲ್ ಆರಿಸಿ ಅಥವಾ ಮಾದರಿ ಅರ್ಜಿಯನ್ನು ಲೋಡ್ ಮಾಡಿ.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
