import { DocumentRecord } from '../types';

function escapeCsvCell(value: string | number | undefined): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function exportDocumentsToCSV(records: DocumentRecord[], filename = 'lekhasetu-records.csv') {
  const headers = [
    'Document ID',
    'File Name',
    'Department',
    'District',
    'Taluk',
    'Office',
    'Document Language',
    'Detected Language',
    'Status',
    'Overall Confidence (%)',
    'Full Name',
    'Fathers Name',
    'Address',
    'Village',
    'PIN Code',
    'Subject',
    'Upload Date',
    'Completed Date',
    'Extracted Text',
  ];

  const getFieldVal = (doc: DocumentRecord, key: string) =>
    doc.fields.find((f) => f.key === key)?.value || '';

  const rows = records.map((doc) => [
    doc.id,
    doc.fileName,
    doc.departmentNameEn,
    doc.districtNameEn,
    doc.talukNameEn,
    doc.officeNameEn,
    doc.documentLanguage,
    doc.detectedLanguage || '',
    doc.status,
    doc.overallConfidence,
    getFieldVal(doc, 'fullName'),
    getFieldVal(doc, 'fatherName'),
    getFieldVal(doc, 'address'),
    getFieldVal(doc, 'village'),
    getFieldVal(doc, 'pinCode'),
    getFieldVal(doc, 'subject'),
    doc.uploadDate,
    doc.completedDate || '',
    doc.extractedText,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))].join(
      '\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportDocumentsToJSON(records: DocumentRecord[], filename = 'lekhasetu-records.json') {
  const sanitized = records.map(({ dataUrl: _dataUrl, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(sanitized, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  triggerDownload(blob, filename);
}

export function exportSingleDocumentHtmlReport(doc: DocumentRecord) {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const fieldRows = doc.fields
    .map(
      (f) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:600;background:#f8fafc;width:30%;">${escapeHtml(f.label)}</td>
        <td style="padding:8px 12px;border:1px solid #cbd5e1;">${escapeHtml(f.value || '—')}</td>
        <td style="padding:8px 12px;border:1px solid #cbd5e1;width:15%;text-align:right;">${Math.round(f.confidence)}%</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LEKHASETU Record - ${escapeHtml(doc.id)}</title>
</head>
<body style="font-family:Arial,sans-serif;max-width:820px;margin:32px auto;color:#0f172a;line-height:1.5;">
  <div style="border-bottom:3px solid #173B63;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="margin:0;color:#173B63;font-size:22px;">LEKHASETU — Digitized Government Document Record</h1>
    <p style="margin:4px 0 0;color:#475569;font-size:13px;">Document ID: ${escapeHtml(doc.id)} · Status: ${escapeHtml(doc.status)} · Verified By: ${escapeHtml(doc.uploadedBy)}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
    <tr>
      <td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Department</td>
      <td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(doc.departmentNameEn)} (${escapeHtml(doc.departmentNameKn)})</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Location</td>
      <td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(doc.districtNameEn)}${doc.talukNameEn ? ` / ${escapeHtml(doc.talukNameEn)}` : ''}</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Office</td>
      <td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(doc.officeNameEn)}</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Upload / Completion Date</td>
      <td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(new Date(doc.uploadDate).toLocaleString())} ${doc.completedDate ? `→ ${escapeHtml(new Date(doc.completedDate).toLocaleString())}` : ''}</td>
    </tr>
  </table>
  <h2 style="font-size:16px;color:#173B63;margin:20px 0 8px;">Verified Structured Information</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
    <thead>
      <tr>
        <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#173B63;color:#fff;text-align:left;">Field</th>
        <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#173B63;color:#fff;text-align:left;">Extracted Value</th>
        <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#173B63;color:#fff;text-align:right;">Confidence</th>
      </tr>
    </thead>
    <tbody>${fieldRows}</tbody>
  </table>
  <h2 style="font-size:16px;color:#173B63;margin:20px 0 8px;">Extracted Full Text</h2>
  <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #cbd5e1;padding:14px;font-size:13px;">${escapeHtml(doc.extractedText || 'No text extracted')}</pre>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  triggerDownload(blob, `${doc.id}-verified-record.html`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
