import { DocumentRecord } from '../types';

function createHandwrittenScanSvgDataUrl(lines: string[], headerTitle: string): string {
  const escapedLines = lines
    .map(
      (line, idx) =>
        `<text x="48" y="${120 + idx * 32}" font-family="Georgia, serif" font-size="16" fill="#1e3a8a">${line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</text>`
    )
    .join('');

  const ruledLines = Array.from({ length: 18 }, (_, i) => {
    const y = 96 + i * 32;
    return `<line x1="36" y1="${y}" x2="564" y2="${y}" stroke="#cbd5e1" stroke-width="1" />`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720">
    <rect width="600" height="720" fill="#fcfcfa" />
    <rect x="20" y="20" width="560" height="680" fill="none" stroke="#94a3b8" stroke-width="1" />
    <line x1="78" y1="20" x2="78" y2="700" stroke="#fca5a5" stroke-width="1.2" />
    ${ruledLines}
    <text x="300" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${headerTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</text>
    ${escapedLines}
    <rect x="405" y="585" width="140" height="54" rx="4" fill="none" stroke="#1e40af" stroke-width="1.2" stroke-dasharray="3 2" />
    <text x="475" y="610" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">OFFICE RECEIPT</text>
    <text x="475" y="625" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">GOVT OF KARNATAKA</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getInitialSeedDocuments(): DocumentRecord[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  return [
    {
      id: 'LS-2026-104201',
      fileName: 'residence_certificate_rajesh_mysuru.jpg',
      fileSize: 284120,
      mimeType: 'image/jpeg',
      dataUrl: '/src/assets/images/sample_kannada_application_1795616046727.jpg',
      source: 'sample',
      documentLanguage: 'Bilingual (Kannada + English)',
      detectedLanguage: 'Bilingual (Kannada + English)',
      departmentId: 'tahsildar_office',
      departmentNameEn: 'Tahsildar Office',
      departmentNameKn: 'ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ',
      districtId: 'mysuru',
      districtNameEn: 'Mysuru',
      districtNameKn: 'ಮೈಸೂರು',
      talukId: 'mysuru_mysuru',
      talukNameEn: 'Mysuru',
      talukNameKn: 'ಮೈಸೂರು',
      officeId: 'tahsildar_mysuru_mysuru',
      officeNameEn: 'Office of the Tahsildar, Mysuru',
      officeNameKn: 'ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ, ಮೈಸೂರು',
      uploadedBy: 'Siddharth Rao',
      uploadDate: hoursAgo(26),
      updatedAt: hoursAgo(4),
      completedDate: hoursAgo(4),
      status: 'Completed',
      overallConfidence: 94,
      ocrProvider: 'Verified Sample Record',
      extractedText:
        'ರಾಜೇಶ್ ಕುಮಾರ್ / Rajesh Kumar\nತಂದೆಯ ಹೆಸರು: ಬಸವರಾಜು ಎಸ್ / Father Name: Basavaraju S\nವಿಳಾಸ: 42, ಎಂ.ಜಿ. ರಸ್ತೆ, ಕುವೆಂಪುನಗರ / Address: 42, MG Road, Kuvempunagar\nಗ್ರಾಮ: ಬೋಗಾದಿ / Village: Bogadi\nತಾಲ್ಲೂಕು: ಮೈಸೂರು / Taluk: Mysuru\nಜಿಲ್ಲೆ: ಮೈಸೂರು / District: Mysuru\nಪಿನ್ ಕೋಡ್: 570026\nವಿಷಯ: ವಾಸಸ್ಥಳ ದೃಢೀಕರಣ ಪತ್ರಕ್ಕಾಗಿ ಅರ್ಜಿ / Subject: Application for Residence Certificate',
      fields: [
        { key: 'fullName', label: 'Full Name', value: 'Rajesh Kumar / ರಾಜೇಶ್ ಕುಮಾರ್', confidence: 96 },
        { key: 'fatherName', label: "Father's Name", value: 'Basavaraju S / ಬಸವರಾಜು ಎಸ್', confidence: 94 },
        { key: 'address', label: 'Address', value: '42, MG Road, Kuvempunagar', confidence: 93 },
        { key: 'village', label: 'Village / Ward', value: 'Bogadi / ಬೋಗಾದಿ', confidence: 95 },
        { key: 'taluk', label: 'Taluk', value: 'Mysuru', confidence: 97 },
        { key: 'district', label: 'District', value: 'Mysuru', confidence: 98 },
        { key: 'date', label: 'Date', value: '24/11/2026', confidence: 91 },
        { key: 'pinCode', label: 'PIN Code', value: '570026', confidence: 96 },
        { key: 'subject', label: 'Subject / Purpose', value: 'Application for Residence Certificate', confidence: 94 },
        { key: 'documentNumber', label: 'Reference / Application No.', value: 'MYS-TH-2026-8841', confidence: 89 },
      ],
      officerNotes: 'Verified against original handwritten application and address proof.',
    },
    {
      id: 'LS-2026-104202',
      fileName: 'khata_transfer_petition_bbmp.svg',
      fileSize: 194500,
      mimeType: 'image/svg+xml',
      dataUrl: createHandwrittenScanSvgDataUrl(
        [
          'ಗೆ, ಸಹಾಯಕ ಕಂದಾಯ ಅಧಿಕಾರಿಗಳು, ಬಿಬಿಎಂಪಿ (ಬೆಂಗಳೂರು ನಗರ)',
          'ಅರ್ಜಿದಾರರು: ಅನುಷಾ ಎನ್. ಗೌಡ (Anusha N Gowda)',
          'ತಂದೆ / ಪತಿ ಹೆಸರು: ನಾಗರಾಜ್ ಕೆ. (Nagaraj K)',
          'ವಿಳಾಸ: #18, 4ನೇ ಕ್ರಾಸ್, ಜಯನಗರ 3ನೇ ಬ್ಲಾಕ್, ಬೆಂಗಳೂರು',
          'ಜಿಲ್ಲೆ: ಬೆಂಗಳೂರು ನಗರ | ಪಿನ್ ಕೋಡ್: 560011',
          'ವಿಷಯ: ಇ-ಖಾತಾ ವರ್ಗಾವಣೆ ಅರ್ಜಿ (Khata Transfer Petition)',
          'ದಿನಾಂಕ: 25/11/2026 | ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ: BBMP-JYN-4412',
          'ಸಹಿ: ಅನುಷಾ ಎನ್. ಗೌಡ',
        ],
        'BBMP REVENUE OFFICE — KHATA TRANSFER APPLICATION'
      ),
      source: 'sample',
      documentLanguage: 'Bilingual (Kannada + English)',
      detectedLanguage: 'Bilingual (Kannada + English)',
      departmentId: 'city_corporation',
      departmentNameEn: 'City Corporation',
      departmentNameKn: 'ಮಹಾನಗರ ಪಾಲಿಕೆ',
      districtId: 'bengaluru_urban',
      districtNameEn: 'Bengaluru Urban',
      districtNameKn: 'ಬೆಂಗಳೂರು ನಗರ',
      talukId: '',
      talukNameEn: '',
      talukNameKn: '',
      officeId: 'cc_bbmp',
      officeNameEn: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
      officeNameKn: 'ಬೃಹತ್ ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ (ಬಿಬಿಎಂಪಿ)',
      uploadedBy: 'Siddharth Rao',
      uploadDate: hoursAgo(5),
      updatedAt: hoursAgo(2),
      status: 'Awaiting Verification',
      overallConfidence: 83,
      ocrNotes: 'Check ward number and handwritten signature date in Jayanagar application.',
      extractedText:
        'ಗೆ, ಸಹಾಯಕ ಕಂದಾಯ ಅಧಿಕಾರಿಗಳು, ಬಿಬಿಎಂಪಿ\nಅರ್ಜಿದಾರರು: ಅನುಷಾ ಎನ್. ಗೌಡ (Anusha N Gowda)\nತಂದೆ ಹೆಸರು: ನಾಗರಾಜ್ ಕೆ. (Nagaraj K)\nವಿಳಾಸ: #18, 4ನೇ ಕ್ರಾಸ್, ಜಯನಗರ 3ನೇ ಬ್ಲಾಕ್, ಬೆಂಗಳೂರು - 560011\nವಿಷಯ: ಇ-ಖಾತಾ ವರ್ಗಾವಣೆ ಅರ್ಜಿ (Khata Transfer Petition)\nದಿನಾಂಕ: 25/11/2026',
      fields: [
        { key: 'fullName', label: 'Full Name', value: 'Anusha N Gowda / ಅನುಷಾ ಎನ್. ಗೌಡ', confidence: 91 },
        { key: 'fatherName', label: "Father's Name", value: 'Nagaraj K / ನಾಗರಾಜ್ ಕೆ.', confidence: 88 },
        { key: 'address', label: 'Address', value: '#18, 4th Cross, Jayanagar 3rd Block', confidence: 82, boundingHint: 'Middle block line slightly faint' },
        { key: 'village', label: 'Village / Ward', value: 'Jayanagar Ward', confidence: 79 },
        { key: 'taluk', label: 'Taluk', value: '', confidence: 0 },
        { key: 'district', label: 'District', value: 'Bengaluru Urban', confidence: 95 },
        { key: 'date', label: 'Date', value: '25/11/2026', confidence: 87 },
        { key: 'pinCode', label: 'PIN Code', value: '560011', confidence: 74, boundingHint: 'Last digit 1 requires visual confirmation' },
        { key: 'subject', label: 'Subject / Purpose', value: 'Khata Transfer Petition / ಇ-ಖಾತಾ ವರ್ಗಾವಣೆ ಅರ್ಜಿ', confidence: 90 },
        { key: 'documentNumber', label: 'Reference / Application No.', value: 'BBMP-JYN-4412', confidence: 61, boundingHint: 'Reference digits partially smudged' },
      ],
    },
    {
      id: 'LS-2026-104203',
      fileName: 'rto_rc_renewal_dakshina_kannada.svg',
      fileSize: 176800,
      mimeType: 'image/svg+xml',
      dataUrl: createHandwrittenScanSvgDataUrl(
        [
          'To: Regional Transport Officer, KA-19 Mangaluru',
          'Applicant Name: Prakash Shetty',
          'Father Name: Raghavendra Shetty',
          'Address: Door No. 3-14, Bejai Main Road, Mangaluru',
          'District: Dakshina Kannada | PIN: 575004',
          'Subject: Renewal of Vehicle Registration (KA-19-MG-4821)',
          'Date: 23/11/2026',
        ],
        'KARNATAKA MOTOR VEHICLES — RC RENEWAL FORM'
      ),
      source: 'sample',
      documentLanguage: 'English',
      detectedLanguage: 'English',
      departmentId: 'rto',
      departmentNameEn: 'Regional Transport Office (RTO)',
      departmentNameKn: 'ಪ್ರಾದೇಶಿಕ ಸಾರಿಗೆ ಕಚೇರಿ (ಆರ್‌ಟಿಒ)',
      districtId: 'dakshina_kannada',
      districtNameEn: 'Dakshina Kannada',
      districtNameKn: 'ದಕ್ಷಿಣ ಕನ್ನಡ',
      talukId: '',
      talukNameEn: '',
      talukNameKn: '',
      officeId: 'rto_ka19',
      officeNameEn: 'KA-19 Mangaluru RTO',
      officeNameKn: 'KA-19 ಮಂಗಳೂರು ಆರ್‌ಟಿಒ',
      uploadedBy: 'Siddharth Rao',
      uploadDate: hoursAgo(12),
      updatedAt: hoursAgo(6),
      status: 'Needs Correction',
      overallConfidence: 68,
      correctionReason: 'Door number and vehicle registration digits need verification against RC copy.',
      extractedText:
        'To: Regional Transport Officer, KA-19 Mangaluru\nApplicant Name: Prakash Shetty\nFather Name: Raghavendra Shetty\nAddress: Door No. 3-14, Bejai Main Road, Mangaluru\nDistrict: Dakshina Kannada | PIN: 575004\nSubject: Renewal of Vehicle Registration (KA-19-MG-4821)',
      fields: [
        { key: 'fullName', label: 'Full Name', value: 'Prakash Shetty', confidence: 92 },
        { key: 'fatherName', label: "Father's Name", value: 'Raghavendra Shetty', confidence: 86 },
        { key: 'address', label: 'Address', value: 'Door No. 3-14, Bejai Main Road, Mangaluru', confidence: 62, boundingHint: 'Door number digits unclear' },
        { key: 'village', label: 'Village / Ward', value: 'Bejai', confidence: 81 },
        { key: 'taluk', label: 'Taluk', value: '', confidence: 0 },
        { key: 'district', label: 'District', value: 'Dakshina Kannada', confidence: 94 },
        { key: 'date', label: 'Date', value: '23/11/2026', confidence: 89 },
        { key: 'pinCode', label: 'PIN Code', value: '575004', confidence: 76 },
        { key: 'subject', label: 'Subject / Purpose', value: 'Renewal of Vehicle Registration (KA-19-MG-4821)', confidence: 64, boundingHint: 'Vehicle number suffix 4821 low contrast' },
        { key: 'documentNumber', label: 'Reference / Application No.', value: 'KA19-RTO-2026-119', confidence: 58 },
      ],
    },
    {
      id: 'LS-2026-104204',
      fileName: 'gram_panchayat_water_connection_bogadi.svg',
      fileSize: 162400,
      mimeType: 'image/svg+xml',
      dataUrl: createHandwrittenScanSvgDataUrl(
        [
          'ಗೆ, ಪಂಚಾಯಿತಿ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿಗಳು, ಬೋಗಾದಿ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ',
          'ಅರ್ಜಿದಾರರು: ಮಹೇಶ್ ಕುಮಾರ್ ಬಿ. (Mahesh Kumar B)',
          'ತಂದೆಯ ಹೆಸರು: ಬಸವಣ್ಣ (Basavanna)',
          'ಗ್ರಾಮ: ಬೋಗಾದಿ, ಮೈಸೂರು ತಾಲ್ಲೂಕು, ಮೈಸೂರು ಜಿಲ್ಲೆ',
          'ಪಿನ್ ಕೋಡ್: 570026 | ದಿನಾಂಕ: 25/11/2026',
          'ವಿಷಯ: ಹೊಸ ಕುಡಿಯುವ ನೀರಿನ ನಲ್ಲಿ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಅರ್ಜಿ',
        ],
        'GRAM PANCHAYAT — DRINKING WATER CONNECTION PETITION'
      ),
      source: 'sample',
      documentLanguage: 'Kannada',
      departmentId: 'gram_panchayat',
      departmentNameEn: 'Gram Panchayat',
      departmentNameKn: 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ',
      districtId: 'mysuru',
      districtNameEn: 'Mysuru',
      districtNameKn: 'ಮೈಸೂರು',
      talukId: 'mysuru_mysuru',
      talukNameEn: 'Mysuru',
      talukNameKn: 'ಮೈಸೂರು',
      officeId: 'gp_mys_bogadi',
      officeNameEn: 'Bogadi Gram Panchayat',
      officeNameKn: 'ಬೋಗಾದಿ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ',
      uploadedBy: 'Siddharth Rao',
      uploadDate: hoursAgo(1),
      updatedAt: hoursAgo(1),
      status: 'Uploaded',
      overallConfidence: 0,
      extractedText: '',
      fields: [
        { key: 'fullName', label: 'Full Name', value: '', confidence: 0 },
        { key: 'fatherName', label: "Father's Name", value: '', confidence: 0 },
        { key: 'address', label: 'Address', value: '', confidence: 0 },
        { key: 'village', label: 'Village / Ward', value: '', confidence: 0 },
        { key: 'taluk', label: 'Taluk', value: '', confidence: 0 },
        { key: 'district', label: 'District', value: '', confidence: 0 },
        { key: 'date', label: 'Date', value: '', confidence: 0 },
        { key: 'pinCode', label: 'PIN Code', value: '', confidence: 0 },
        { key: 'subject', label: 'Subject / Purpose', value: '', confidence: 0 },
        { key: 'documentNumber', label: 'Reference / Application No.', value: '', confidence: 0 },
      ],
    },
  ];
}
