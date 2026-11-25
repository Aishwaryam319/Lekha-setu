import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Camera, Check, RefreshCw, Video, VideoOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { DocumentLanguageOption } from '../types';
import { getDepartmentById } from '../utils/locationSearch';

export function ScanDocument() {
  const { language, t, pick } = useLanguage();
  const { preferences, createDocument, processDocumentOcr } = useDocuments();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileCaptureRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string>('');
  const [capturedSize, setCapturedSize] = useState<number>(0);
  const [docLanguage, setDocLanguage] = useState<DocumentLanguageOption>(
    'Bilingual (Kannada + English)'
  );
  const [saving, setSaving] = useState(false);

  const sel = preferences.activeSelection;
  const activeDept = getDepartmentById(sel.departmentId);
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setCapturedDataUrl('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(t('cameraError'));
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraError(t('cameraError'));
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);
    setCapturedSize(Math.round((dataUrl.length * 3) / 4));
    stopCamera();
  };

  const handleMobileCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedDataUrl(reader.result);
        setCapturedSize(file.size);
        setCameraError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScan = async (runOcr: boolean) => {
    if (!capturedDataUrl) return;
    if (!isOfficeComplete) {
      setCameraError(t('completeOfficeFirst'));
      return;
    }
    setSaving(true);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const doc = await createDocument({
        fileName: `scan_${stamp}.jpg`,
        fileSize: capturedSize,
        mimeType: 'image/jpeg',
        dataUrl: capturedDataUrl,
        source: 'scan',
        documentLanguage: docLanguage,
      });
      if (runOcr) {
        navigate(`/processing/${doc.id}`);
        void processDocumentOcr(doc.id);
      } else {
        navigate('/pending');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {t('scanTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t('scanSubtitle')}</p>
      </div>

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

      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="relative bg-slate-900 rounded-lg overflow-hidden h-[440px] flex items-center justify-center">
            {capturedDataUrl ? (
              <img
                src={capturedDataUrl}
                alt="Captured scan"
                className="max-w-full max-h-full object-contain"
              />
            ) : cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-300 px-6">
                <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-medium">
                  {pick('Camera viewfinder ready', 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ ಸಿದ್ಧವಾಗಿದೆ')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {pick(
                    'Click "Open Camera" below or use mobile camera capture.',
                    'ಕೆಳಗಿನ "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ" ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಸಾಧನ ಕ್ಯಾಮೆರಾ ಬಳಸಿ.'
                  )}
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {!cameraActive && !capturedDataUrl && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#173B63] hover:bg-[#112d4d] text-white text-sm font-medium rounded-lg cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>{t('startCamera')}</span>
                </button>
              )}

              {cameraActive && (
                <>
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('capturePhoto')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>{t('stopCamera')}</span>
                  </button>
                </>
              )}

              {capturedDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCapturedDataUrl('');
                    startCamera();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('retakePhoto')}</span>
                </button>
              )}
            </div>

            <div>
              <input
                ref={mobileCaptureRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMobileCapture(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => mobileCaptureRef.current?.click()}
                className="px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t('useMobileCapture')}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Language & Confirm Actions */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <h2 className="text-base font-display font-semibold text-slate-900">
              {t('documentLanguageLabel')}
            </h2>
            <p className="text-xs text-slate-500">{t('docLangHintNote')}</p>

            <div className="space-y-2">
              {(
                [
                  'Kannada',
                  'English',
                  'Bilingual (Kannada + English)',
                ] as DocumentLanguageOption[]
              ).map((langOpt) => (
                <button
                  key={langOpt}
                  type="button"
                  onClick={() => setDocLanguage(langOpt)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                    docLanguage === langOpt
                      ? 'border-[#173B63] bg-[#173B63]/5 text-[#173B63]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{langOpt}</span>
                  {docLanguage === langOpt && <Check className="w-4 h-4 text-[#0D9488]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={!capturedDataUrl || saving || !isOfficeComplete}
              onClick={() => handleSaveScan(true)}
              className="w-full px-4 py-2.5 bg-[#173B63] hover:bg-[#112d4d] disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {t('confirmAndProcess')}
            </button>
            <button
              type="button"
              disabled={!capturedDataUrl || saving || !isOfficeComplete}
              onClick={() => handleSaveScan(false)}
              className="w-full px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {t('confirmAndSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
