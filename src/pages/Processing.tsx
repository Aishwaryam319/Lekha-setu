import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { DocumentPreview } from '../components/DocumentPreview';
import { StatusBadge } from '../components/StatusBadge';

export function Processing() {
  const { id } = useParams<{ id: string }>();
  const { t, pick } = useLanguage();
  const { documents, processingState, processDocumentOcr, isOnline } = useDocuments();
  const navigate = useNavigate();

  const queueDocs = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.status === 'Uploaded' ||
          d.status === 'Processing' ||
          d.status === 'Failed' ||
          d.status === 'Awaiting Verification'
      ),
    [documents]
  );

  const selectedDoc = useMemo(() => {
    if (id) return documents.find((d) => d.id === id) || null;
    return (
      documents.find(
        (d) => d.status === 'Processing' || d.status === 'Uploaded' || d.status === 'Failed'
      ) ||
      queueDocs[0] ||
      null
    );
  }, [id, documents, queueDocs]);

  const stages = [
    t('stage1'),
    t('stage2'),
    t('stage3'),
    t('stage4'),
    t('stage5'),
    t('stage6'),
    t('stage7'),
  ];

  const currentStageIndex = useMemo(() => {
    if (!selectedDoc) return 0;
    if (processingState && processingState.documentId === selectedDoc.id) {
      return processingState.stageIndex;
    }
    if (selectedDoc.status === 'Awaiting Verification' || selectedDoc.status === 'Completed') {
      return 7;
    }
    if (selectedDoc.status === 'Processing') return 4;
    if (selectedDoc.status === 'Uploaded') return 1;
    return 0;
  }, [selectedDoc, processingState]);

  const progressPercent =
    selectedDoc?.status === 'Awaiting Verification' || selectedDoc?.status === 'Completed'
      ? 100
      : Math.round((currentStageIndex / 7) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('processingTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('processingSubtitle')}</p>
        </div>

        {queueDocs.length > 0 && (
          <select
            value={selectedDoc?.id || ''}
            onChange={(e) => navigate(`/processing/${e.target.value}`)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63] max-w-xs"
          >
            {queueDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} · {d.fileName} ({d.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedDoc ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">{t('noDocsToProcess')}</p>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="mt-4 px-4 py-2 bg-[#173B63] text-white text-xs font-medium rounded-lg hover:bg-[#112d4d] cursor-pointer"
          >
            {t('actionUploadNew')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Pipeline Stages & Actions */}
          <div className="lg:col-span-6 space-y-5">
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-500">{selectedDoc.id}</p>
                  <h2 className="text-base font-display font-semibold text-slate-900 truncate">
                    {selectedDoc.fileName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDoc.departmentNameEn} · {selectedDoc.documentLanguage}
                  </p>
                </div>
                <StatusBadge status={selectedDoc.status} />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">
                    {pick('Pipeline Progress', 'ಸಂಸ್ಕರಣಾ ಪ್ರಗತಿ')}
                  </span>
                  <span className="font-mono font-semibold text-[#173B63] tabular-nums">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`h-full transition-all duration-300 ${
                      selectedDoc.status === 'Failed'
                        ? 'bg-red-600'
                        : selectedDoc.status === 'Awaiting Verification'
                          ? 'bg-emerald-600'
                          : 'bg-[#0D9488]'
                    }`}
                  />
                </div>
              </div>

              <ol className="space-y-2.5 pt-2">
                {stages.map((stageLabel, idx) => {
                  const stageNum = idx + 1;
                  const isDone =
                    selectedDoc.status === 'Awaiting Verification' ||
                    selectedDoc.status === 'Completed' ||
                    (currentStageIndex > stageNum && selectedDoc.status !== 'Failed');
                  const isActive =
                    selectedDoc.status === 'Processing' && currentStageIndex === stageNum;
                  const isFailedHere =
                    selectedDoc.status === 'Failed' && currentStageIndex === stageNum;

                  return (
                    <li
                      key={stageLabel}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                        isFailedHere
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : isDone
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                            : isActive
                              ? 'border-teal-200 bg-teal-50 text-teal-900 font-semibold'
                              : 'border-slate-100 bg-slate-50/50 text-slate-500'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="font-mono tabular-nums w-4 text-center">{stageNum}.</span>
                        <span>{stageLabel}</span>
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {isActive && <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />}
                      {isFailedHere && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    </li>
                  );
                })}
              </ol>

              {selectedDoc.status === 'Failed' && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t('processingFailed')}</span>
                  </div>
                  <p>{selectedDoc.errorMessage || 'Unknown OCR backend error.'}</p>
                </div>
              )}

              {selectedDoc.status === 'Awaiting Verification' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {t('processingComplete')} ({selectedDoc.overallConfidence}%{' '}
                    {pick('overall confidence', 'ಒಟ್ಟು ವಿಶ್ವಾಸಾರ್ಹತೆ')})
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                {(selectedDoc.status === 'Uploaded' || selectedDoc.status === 'Failed') && (
                  <button
                    type="button"
                    disabled={!isOnline}
                    onClick={() => processDocumentOcr(selectedDoc.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#173B63] hover:bg-[#112d4d] disabled:bg-slate-300 text-white text-sm font-medium rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  >
                    {selectedDoc.status === 'Failed' ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>{t('retryOcr')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{t('startOcrProcessing')}</span>
                      </>
                    )}
                  </button>
                )}

                {selectedDoc.status === 'Awaiting Verification' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/verification/${selectedDoc.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <span>{t('goToVerification')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {selectedDoc.status === 'Awaiting Verification' && (
                  <button
                    type="button"
                    disabled={!isOnline}
                    onClick={() => processDocumentOcr(selectedDoc.id)}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('sendForReprocessing')}</span>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-6">
            <DocumentPreview
              dataUrl={selectedDoc.dataUrl}
              mimeType={selectedDoc.mimeType}
              fileName={selectedDoc.fileName}
              heightClass="h-[560px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
