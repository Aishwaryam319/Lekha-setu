export type LanguageCode = 'en' | 'kn';

export type DocumentLanguageOption = 'Kannada' | 'English' | 'Bilingual (Kannada + English)';

export type DocumentStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Awaiting Verification'
  | 'Completed'
  | 'Needs Correction'
  | 'Failed';

export type DepartmentId =
  | 'police_station'
  | 'tahsildar_office'
  | 'city_corporation'
  | 'rto'
  | 'gram_panchayat'
  | 'other';

export interface DepartmentDef {
  id: DepartmentId;
  nameEn: string;
  nameKn: string;
  descriptionEn: string;
  descriptionKn: string;
  requiresTaluk: boolean;
  officeType: 'police_station' | 'tahsildar_office' | 'city_corporation' | 'rto' | 'gram_panchayat' | 'manual_or_list';
}

export interface DistrictDef {
  id: string;
  nameEn: string;
  nameKn: string;
  division: string;
  headquarters: string;
}

export interface TalukDef {
  id: string;
  districtId: string;
  nameEn: string;
  nameKn: string;
}

export interface OfficeLocationDef {
  id: string;
  departmentId: DepartmentId;
  districtId: string;
  talukId?: string;
  nameEn: string;
  nameKn: string;
  code?: string;
}

export interface ActiveSelection {
  departmentId: DepartmentId;
  districtId: string;
  talukId: string;
  officeId: string;
  officeNameEn: string;
  officeNameKn: string;
  customOfficeName: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  boundingHint?: string;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  source: 'upload' | 'scan' | 'sample';
  documentLanguage: DocumentLanguageOption;
  detectedLanguage?: string;
  departmentId: DepartmentId;
  departmentNameEn: string;
  departmentNameKn: string;
  districtId: string;
  districtNameEn: string;
  districtNameKn: string;
  talukId: string;
  talukNameEn: string;
  talukNameKn: string;
  officeId: string;
  officeNameEn: string;
  officeNameKn: string;
  uploadedBy: string;
  uploadDate: string;
  updatedAt: string;
  completedDate?: string;
  status: DocumentStatus;
  extractedText: string;
  fields: ExtractedField[];
  overallConfidence: number;
  ocrNotes?: string;
  ocrProvider?: string;
  errorMessage?: string;
  officerNotes?: string;
  correctionReason?: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  titleEn: string;
  titleKn: string;
  messageEn: string;
  messageKn: string;
  createdAt: string;
  read: boolean;
  documentId?: string;
  targetRoute?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  isOfflineFallback?: boolean;
}

export interface OfficerProfile {
  name: string;
  designation: string;
  employeeId: string;
}

export interface UserPreferences {
  language: LanguageCode;
  sidebarCollapsed: boolean;
  compactTables: boolean;
  officerProfile: OfficerProfile;
  activeSelection: ActiveSelection;
}

export interface SystemHealth {
  server: 'online' | 'offline' | 'checking';
  ocrEngine: {
    status: 'online' | 'unavailable' | 'offline';
    provider: string;
    kannadaSupport: boolean;
    englishSupport: boolean;
  };
  ragAssistant: {
    status: 'online' | 'unavailable' | 'offline';
    provider: string;
  };
  indexedDbConnected: boolean;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  checkedAt?: string;
}
