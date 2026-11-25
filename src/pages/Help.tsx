import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function Help() {
  const { language, t } = useLanguage();

  const sections =
    language === 'kn'
      ? [
          {
            title: '1. ಸರ್ಕಾರಿ ಇಲಾಖೆ, ಜಿಲ್ಲೆ, ತಾಲ್ಲೂಕು ಮತ್ತು ಕಚೇರಿ ಆಯ್ಕೆ',
            body: 'ಸೈಡ್‌ಬಾರ್‌ನಿಂದ "ಇಲಾಖೆ ಆಯ್ಕೆ" ತೆರೆಯಿರಿ. ಪೊಲೀಸ್ ಠಾಣೆ, ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ, ಮಹಾನಗರ ಪಾಲಿಕೆ, ಆರ್‌ಟಿಒ, ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಥವಾ ಇತರೆ ಇಲಾಖೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನಂತರ ಕರ್ನಾಟಕದ 31 ಜಿಲ್ಲೆಗಳು ಮತ್ತು ತಾಲ್ಲೂಕುಗಳನ್ನು ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಹುಡುಕಬಹುದು. ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ ಸ್ಥಳೀಯ ಡೇಟಾಸೆಟ್ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
          },
          {
            title: '2. ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು ಹೇಗೆ',
            body: '"ದಾಖಲೆ ಅಪ್‌ಲೋಡ್" ಪುಟಕ್ಕೆ ಹೋಗಿ. JPG, JPEG, PNG, ಅಥವಾ PDF (ಗರಿಷ್ಠ 15 MB) ಫೈಲ್‌ಗಳನ್ನು ಎಳೆದು ಬಿಡಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಿ. ದಾಖಲೆಯಲ್ಲಿರುವ ಕೈಬರಹ ಭಾಷೆಯನ್ನು (ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಅಥವಾ ದ್ವಿಭಾಷಾ) ಆಯ್ಕೆಮಾಡಿ "ಉಳಿಸಿ ಮತ್ತು OCR ಸಂಸ್ಕರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.',
          },
          {
            title: '3. ಕ್ಯಾಮೆರಾ ಮೂಲಕ ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡುವುದು ಹೇಗೆ',
            body: '"ದಾಖಲೆ ಸ್ಕ್ಯಾನ್" ಪುಟವನ್ನು ತೆರೆಯಿರಿ, "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ" ಒತ್ತಿ ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನೀಡಿ. ದಾಖಲೆಯ ಸ್ಪಷ್ಟ ಚಿತ್ರವನ್ನು ಸೆರೆಹಿಡಿದು "ದೃಢೀಕರಿಸಿ ಮತ್ತು OCR ಸಂಸ್ಕರಿಸಿ" ಆಯ್ಕೆಮಾಡಿ.',
          },
          {
            title: '4. OCR ಸಂಸ್ಕರಣೆ ಮತ್ತು ಪರಿಶೀಲನೆ',
            body: '"ದಾಖಲೆ ಸಂಸ್ಕರಣೆ" ಪುಟವು 7 ಹಂತಗಳಲ್ಲಿ ಕೈಬರಹ ಪಠ್ಯ ಮತ್ತು ವಿವರಗಳನ್ನು ಹೊರತೆಗೆಯುತ್ತದೆ. ನಂತರ "ಪರಿಶೀಲನೆ" ಪುಟದಲ್ಲಿ ಎಡಭಾಗದಲ್ಲಿ ಮೂಲ ದಾಖಲೆಯನ್ನು ಜೂಮ್ ಮಾಡಿ ಬಲಭಾಗದ ಪಠ್ಯ ಮತ್ತು ಕ್ಷೇತ್ರಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ. ಹಸಿರು (≥85%), ಹಳದಿ (65-84%), ಕೆಂಪು (<65%) ವಿಶ್ವಾಸಾರ್ಹತೆ ಸೂಚಕಗಳನ್ನು ಗಮನಿಸಿ "ಅನುಮೋದಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.',
          },
          {
            title: '5. ದಾಖಲೆಗಳ ಹುಡುಕಾಟ, ರಫ್ತು ಮತ್ತು AI ಸಹಾಯಕ',
            body: '"ಪೂರ್ಣಗೊಂಡ ದಾಖಲೆಗಳು" ಮತ್ತು "ಎಲ್ಲಾ ದಾಖಲೆಗಳು" ಪುಟಗಳಿಂದ CSV, JSON ಅಥವಾ ಮುದ್ರಿಸಬಹುದಾದ ಸಾರಾಂಶವನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದು. ಯಾವುದೇ ಸಂದೇಹಗಳಿದ್ದರೆ "AI ಚಾಟ್ ಸಹಾಯಕ" ಬಳಸಿ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೇಳಿ.',
          },
        ]
      : [
          {
            title: '1. Selecting Department, Karnataka District, Taluk & Office',
            body: 'Open "Department Selection" from the sidebar. Choose from Police Station, Tahsildar Office, City Corporation, RTO, Gram Panchayat, or Other Government Departments. Search all 31 Karnataka districts and their taluks in either English or Kannada (e.g., "Mysuru" or "ಮೈಸೂರು"). Location search works 100% offline.',
          },
          {
            title: '2. Uploading Handwritten Documents',
            body: 'Navigate to "Upload Document". Drag and drop or browse JPG, JPEG, PNG, or PDF files up to 15 MB. Select the handwritten language inside the document (independent of the app interface language), verify the associated office, and click "Save & Process OCR".',
          },
          {
            title: '3. Scanning Documents via Camera',
            body: 'Open "Scan Document", click "Open Camera" to start your device camera, frame the handwritten sheet in even lighting, capture the image, retake if needed, and click "Confirm & Process OCR".',
          },
          {
            title: '4. OCR Processing & Split-Screen Verification',
            body: '"Process Documents" runs the 7-stage OCR pipeline and transitions the document to "Awaiting Verification". In "Verification", inspect the zoomable original scan on the left and edit extracted fields on the right. Review Green (≥85%), Yellow (65–84%), and Red (<65%) confidence indicators, then click "Approve & Complete Verification". Only verified documents count as Completed.',
          },
          {
            title: '5. Exporting Records & Using the AI Chat Assistant',
            body: 'Export verified records offline as CSV, JSON, or printable HTML summaries from "Completed Documents" or "All Records". Use "AI Chat Assistant" anytime to ask workflow questions in Kannada, English, or mixed Kannada-English.',
          },
        ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {t('helpTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t('helpSubtitle')}</p>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <section
            key={sec.title}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-2"
          >
            <h2 className="text-base font-display font-semibold text-[#173B63]">{sec.title}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{sec.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
