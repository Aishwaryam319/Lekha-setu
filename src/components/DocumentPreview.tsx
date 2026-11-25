import React, { useState } from 'react';
import { FileText, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DocumentPreviewProps {
  dataUrl: string;
  mimeType: string;
  fileName: string;
  heightClass?: string;
}

export function DocumentPreview({
  dataUrl,
  mimeType,
  fileName,
  heightClass = 'h-[480px]',
}: DocumentPreviewProps) {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-100 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200">
        <span className="text-xs font-medium text-slate-600 truncate max-w-[220px]">
          {fileName}
        </span>
        {!isPdf && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              title={t('zoomOut')}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono tabular-nums text-slate-600 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              title={t('zoomIn')}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title={t('rotate')}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
              title={t('resetView')}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={`${heightClass} overflow-auto flex items-center justify-center p-4 bg-slate-100`}>
        {isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <iframe
              src={dataUrl}
              title={fileName}
              className="w-full h-full rounded border border-slate-200 bg-white"
            />
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={fileName}
            referrerPolicy="no-referrer"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            className="max-w-full max-h-full object-contain transition-transform duration-150 shadow-sm bg-white"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-2">
            <FileText className="w-10 h-10" />
            <span className="text-sm">{fileName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
