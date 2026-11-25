import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActiveSelection,
  DocumentLanguageOption,
  DocumentRecord,
  DocumentStatus,
  ExtractedField,
  OfficerProfile,
  SystemHealth,
  UserPreferences,
} from '../types';
import { dbService, loadPreferences, savePreferences } from '../services/storage';
import { fetchSystemHealth, runDocumentOcr } from '../services/api';
import {
  getDepartmentById,
  getDistrictById,
  getTalukById,
} from '../utils/locationSearch';
import { isPendingStatus } from '../utils/documentStatus';
import { getInitialSeedDocuments } from '../data/seedDocuments';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';

export interface ProcessingProgressState {
  documentId: string;
  stageIndex: number; // 1..7
  error?: string;
}

interface DocumentStats {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  awaitingVerification: number;
  needsCorrection: number;
  failed: number;
  uploaded: number;
  completionPercentage: number;
  averageConfidence: number;
  receivedToday: number;
  processedToday: number;
  verifiedToday: number;
  pendingToday: number;
}

interface CreateDocumentInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  source: 'upload' | 'scan' | 'sample';
  documentLanguage: DocumentLanguageOption;
}

interface DocumentContextValue {
  documents: DocumentRecord[];
  loadingDocs: boolean;
  preferences: UserPreferences;
  isOnline: boolean;
  systemHealth: SystemHealth;
  processingState: ProcessingProgressState | null;
  stats: DocumentStats;
  refreshHealth: () => Promise<void>;
  updateActiveSelection: (selection: ActiveSelection) => void;
  updateOfficerProfile: (profile: OfficerProfile) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  createDocument: (input: CreateDocumentInput) => Promise<DocumentRecord>;
  processDocumentOcr: (docId: string) => Promise<DocumentRecord | null>;
  saveVerificationDraft: (
    docId: string,
    updates: {
      extractedText: string;
      fields: ExtractedField[];
      officerNotes?: string;
    }
  ) => Promise<void>;
  approveDocument: (
    docId: string,
    updates: {
      extractedText: string;
      fields: ExtractedField[];
      officerNotes?: string;
    }
  ) => Promise<void>;
  markNeedsCorrection: (docId: string, reason: string) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  clearAllDocuments: () => Promise<void>;
  importDocumentsBackup: (records: DocumentRecord[]) => Promise<number>;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

const SEEDED_FLAG_KEY = 'lekhasetu_seeded_v1';

const DEFAULT_FIELDS: ExtractedField[] = [
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
];

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [processingState, setProcessingState] = useState<ProcessingProgressState | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    server: 'checking',
    ocrEngine: {
      status: 'unavailable',
      provider: 'Checking...',
      kannadaSupport: false,
      englishSupport: false,
    },
    ragAssistant: {
      status: 'unavailable',
      provider: 'Checking...',
    },
    indexedDbConnected: true,
  });

  const { addNotification } = useNotifications();
  const { token, officer } = useAuth();

  // Keep officer profile synced when logged in
  useEffect(() => {
    if (officer) {
      setPreferences((prev) => {
        if (
          prev.officerProfile.employeeId === officer.employeeId &&
          prev.officerProfile.name === officer.officerName
        ) {
          return prev;
        }
        const next: UserPreferences = {
          ...prev,
          officerProfile: {
            name: officer.officerName,
            designation: officer.designation,
            employeeId: officer.employeeId,
          },
        };
        savePreferences(next);
        return next;
      });
    }
  }, [officer]);

  const refreshHealth = useCallback(async () => {
    const dbOk = await dbService.checkConnection();
    const est = await dbService.getStorageEstimate();

    if (est && est.quota > 0 && est.usage / est.quota > 0.85) {
      addNotification({
        type: 'warning',
        titleEn: 'Local Storage Warning',
        titleKn: 'ಸ್ಥಳೀಯ ಸಂಗ್ರಹ ಎಚ್ಚರಿಕೆ',
        messageEn: 'Browser IndexedDB storage is over 85% capacity. Consider exporting records.',
        messageKn: 'ಬ್ರೌಸರ್ IndexedDB ಸಂಗ್ರಹ 85% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಭರ್ತಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ದಾಖಲೆಗಳನ್ನು ರಫ್ತು ಮಾಡಿ.',
        targetRoute: '/settings',
      });
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSystemHealth({
        server: 'offline',
        ocrEngine: {
          status: 'offline',
          provider: 'Offline Mode',
          kannadaSupport: false,
          englishSupport: false,
        },
        ragAssistant: {
          status: 'offline',
          provider: 'Offline Fallback Guide',
        },
        indexedDbConnected: dbOk,
        storageUsedBytes: est?.usage,
        storageQuotaBytes: est?.quota,
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    try {
      const health = await fetchSystemHealth();
      setSystemHealth({
        server: 'online',
        ocrEngine: health.ocrEngine,
        ragAssistant: health.ragAssistant,
        indexedDbConnected: dbOk,
        storageUsedBytes: est?.usage,
        storageQuotaBytes: est?.quota,
        checkedAt: health.timestamp,
      });
    } catch {
      setSystemHealth({
        server: 'offline',
        ocrEngine: {
          status: 'offline',
          provider: 'Server Unreachable',
          kannadaSupport: false,
          englishSupport: false,
        },
        ragAssistant: {
          status: 'offline',
          provider: 'Offline Fallback Guide',
        },
        indexedDbConnected: dbOk,
        storageUsedBytes: est?.usage,
        storageQuotaBytes: est?.quota,
        checkedAt: new Date().toISOString(),
      });
    }
  }, [addNotification]);

  useEffect(() => {
    (async () => {
      try {
        const existing = await dbService.getAllDocuments();
        if (existing.length === 0 && !localStorage.getItem(SEEDED_FLAG_KEY)) {
          const seeds = getInitialSeedDocuments();
          for (const doc of seeds) {
            await dbService.saveDocument(doc);
          }
          localStorage.setItem(SEEDED_FLAG_KEY, '1');
          setDocuments(seeds);
        } else {
          setDocuments(existing);
        }
      } catch (err) {
        console.error('Failed to load documents from IndexedDB:', err);
      } finally {
        setLoadingDocs(false);
      }
    })();

    refreshHealth();

    const handleOnline = () => {
      setIsOnline(true);
      refreshHealth();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshHealth();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshHealth]);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      return next;
    });
  }, []);

  const updateActiveSelection = useCallback((activeSelection: ActiveSelection) => {
    setPreferences((prev) => {
      const next = { ...prev, activeSelection };
      savePreferences(next);
      return next;
    });
  }, []);

  const updateOfficerProfile = useCallback((officerProfile: OfficerProfile) => {
    setPreferences((prev) => {
      const next = { ...prev, officerProfile };
      savePreferences(next);
      return next;
    });
  }, []);

  const persistDoc = useCallback(async (doc: DocumentRecord) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.map((d) => (d.id === doc.id ? doc : d));
      }
      return [doc, ...prev];
    });
    await dbService.saveDocument(doc);
  }, []);

  const createDocument = useCallback(
    async (input: CreateDocumentInput): Promise<DocumentRecord> => {
      const sel = preferences.activeSelection;
      const dept = getDepartmentById(sel.departmentId);
      const dist = getDistrictById(sel.districtId);
      const taluk = sel.talukId ? getTalukById(sel.talukId) : undefined;
      const officeEn = sel.customOfficeName.trim() || sel.officeNameEn || 'Unspecified Office';
      const officeKn = sel.customOfficeName.trim() || sel.officeNameKn || officeEn;

      const now = new Date().toISOString();
      const seq = String(Date.now()).slice(-6);
      const doc: DocumentRecord = {
        id: `LS-${new Date().getFullYear()}-${seq}`,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        dataUrl: input.dataUrl,
        source: input.source,
        documentLanguage: input.documentLanguage,
        departmentId: sel.departmentId,
        departmentNameEn: dept?.nameEn || 'Other Government Departments',
        departmentNameKn: dept?.nameKn || 'ಇತರೆ ಸರ್ಕಾರಿ ಇಲಾಖೆಗಳು',
        districtId: sel.districtId,
        districtNameEn: dist?.nameEn || '',
        districtNameKn: dist?.nameKn || '',
        talukId: taluk?.id || '',
        talukNameEn: taluk?.nameEn || '',
        talukNameKn: taluk?.nameKn || '',
        officeId: sel.officeId,
        officeNameEn: officeEn,
        officeNameKn: officeKn,
        uploadedBy: preferences.officerProfile.name,
        uploadDate: now,
        updatedAt: now,
        status: 'Uploaded',
        extractedText: '',
        fields: DEFAULT_FIELDS.map((f) => ({ ...f })),
        overallConfidence: 0,
      };

      await persistDoc(doc);
      await addNotification({
        type: 'info',
        titleEn: 'New Document Uploaded',
        titleKn: 'ಹೊಸ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ',
        messageEn: `${doc.id} (${doc.fileName}) queued for ${doc.officeNameEn}.`,
        messageKn: `${doc.id} (${doc.fileName}) ${doc.officeNameKn} ಗಾಗಿ ಸರದಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
        documentId: doc.id,
        targetRoute: `/processing/${doc.id}`,
      });

      return doc;
    },
    [preferences, persistDoc, addNotification]
  );

  const processDocumentOcr = useCallback(
    async (docId: string): Promise<DocumentRecord | null> => {
      const target =
        documents.find((d) => d.id === docId) ||
        (await dbService.getAllDocuments()).find((d) => d.id === docId);
      if (!target) return null;

      const startTime = new Date().toISOString();
      const processingDoc: DocumentRecord = {
        ...target,
        status: 'Processing',
        errorMessage: undefined,
        updatedAt: startTime,
      };
      await persistDoc(processingDoc);
      setProcessingState({ documentId: docId, stageIndex: 1 });

      await addNotification({
        type: 'info',
        titleEn: 'OCR Processing Started',
        titleKn: 'OCR ಸಂಸ್ಕರಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ',
        messageEn: `Analyzing handwriting for ${target.id} (${target.documentLanguage}).`,
        messageKn: `${target.id} ದಾಖಲೆಯ ಕೈಬರಹ ವಿಶ್ಲೇಷಣೆ ನಡೆಯುತ್ತಿದೆ.`,
        documentId: target.id,
        targetRoute: `/processing/${target.id}`,
      });

      const advanceStage = async (stage: number, delayMs: number) => {
        await new Promise((r) => setTimeout(r, delayMs));
        setProcessingState((curr) =>
          curr && curr.documentId === docId ? { ...curr, stageIndex: stage } : curr
        );
      };

      try {
        await advanceStage(2, 220);
        await advanceStage(3, 220);
        await advanceStage(4, 240);

        const ocrResult = await runDocumentOcr(
          {
            dataUrl: target.dataUrl,
            mimeType: target.mimeType,
            fileName: target.fileName,
            languageHint: target.documentLanguage,
            department: target.departmentNameEn,
            district: target.districtNameEn,
            taluk: target.talukNameEn,
            office: target.officeNameEn,
          },
          token
        );

        await advanceStage(5, 220);
        await advanceStage(6, 220);

        const mergedFields: ExtractedField[] = DEFAULT_FIELDS.map((def) => {
          const found = ocrResult.fields?.find((f) => f.key === def.key);
          return found
            ? {
                key: def.key,
                label: def.label,
                value: found.value || '',
                confidence: Number.isFinite(found.confidence) ? Math.round(found.confidence) : 0,
                boundingHint: found.boundingHint,
              }
            : { ...def };
        });

        const completedOcrDoc: DocumentRecord = {
          ...processingDoc,
          status: 'Awaiting Verification',
          detectedLanguage: ocrResult.detectedLanguage || target.documentLanguage,
          extractedText: ocrResult.extractedText || '',
          fields: mergedFields,
          overallConfidence: Math.round(ocrResult.overallConfidence || 0),
          ocrNotes: ocrResult.notes || '',
          ocrProvider: ocrResult.provider,
          updatedAt: new Date().toISOString(),
        };

        await persistDoc(completedOcrDoc);
        setProcessingState({ documentId: docId, stageIndex: 7 });

        await addNotification({
          type: 'success',
          titleEn: 'OCR Completed — Ready for Verification',
          titleKn: 'OCR ಪೂರ್ಣಗೊಂಡಿದೆ — ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ',
          messageEn: `${target.id} extracted with ${completedOcrDoc.overallConfidence}% confidence. Verify fields now.`,
          messageKn: `${target.id} ${completedOcrDoc.overallConfidence}% ವಿಶ್ವಾಸಾರ್ಹತೆಯೊಂದಿಗೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಈಗ ಪರಿಶೀಲಿಸಿ.`,
          documentId: target.id,
          targetRoute: `/verification/${target.id}`,
        });

        return completedOcrDoc;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OCR engine failed to process document.';
        const failedDoc: DocumentRecord = {
          ...processingDoc,
          status: 'Failed',
          errorMessage: message,
          updatedAt: new Date().toISOString(),
        };
        await persistDoc(failedDoc);
        setProcessingState({ documentId: docId, stageIndex: 4, error: message });

        await addNotification({
          type: 'error',
          titleEn: 'OCR Processing Failed',
          titleKn: 'OCR ಸಂಸ್ಕರಣೆ ವಿಫಲವಾಗಿದೆ',
          messageEn: `${target.id} failed: ${message}`,
          messageKn: `${target.id} ವಿಫಲವಾಗಿದೆ: ${message}`,
          documentId: target.id,
          targetRoute: `/processing/${target.id}`,
        });

        return failedDoc;
      }
    },
    [documents, persistDoc, addNotification, token]
  );

  const saveVerificationDraft = useCallback(
    async (
      docId: string,
      updates: { extractedText: string; fields: ExtractedField[]; officerNotes?: string }
    ) => {
      const target = documents.find((d) => d.id === docId);
      if (!target) return;

      const updated: DocumentRecord = {
        ...target,
        extractedText: updates.extractedText,
        fields: updates.fields,
        officerNotes: updates.officerNotes,
        updatedAt: new Date().toISOString(),
      };
      await persistDoc(updated);
      await addNotification({
        type: 'info',
        titleEn: 'Draft Corrections Saved',
        titleKn: 'ತಿದ್ದುಪಡಿ ಕರಡು ಉಳಿಸಲಾಗಿದೆ',
        messageEn: `Edits saved locally for ${target.id}.`,
        messageKn: `${target.id} ತಿದ್ದುಪಡಿಗಳನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.`,
        documentId: target.id,
        targetRoute: `/verification/${target.id}`,
      });
    },
    [documents, persistDoc, addNotification]
  );

  const approveDocument = useCallback(
    async (
      docId: string,
      updates: { extractedText: string; fields: ExtractedField[]; officerNotes?: string }
    ) => {
      const target = documents.find((d) => d.id === docId);
      if (!target) return;

      const now = new Date().toISOString();
      const updated: DocumentRecord = {
        ...target,
        status: 'Completed',
        extractedText: updates.extractedText,
        fields: updates.fields,
        officerNotes: updates.officerNotes,
        correctionReason: undefined,
        completedDate: now,
        updatedAt: now,
      };
      await persistDoc(updated);
      await addNotification({
        type: 'success',
        titleEn: 'Document Successfully Verified',
        titleKn: 'ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ',
        messageEn: `${target.id} verified by ${preferences.officerProfile.name} and archived.`,
        messageKn: `${target.id} ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಪೂರ್ಣಗೊಂಡ ದಾಖಲೆಗಳಿಗೆ ಉಳಿಸಲಾಗಿದೆ.`,
        documentId: target.id,
        targetRoute: '/completed',
      });
    },
    [documents, preferences.officerProfile.name, persistDoc, addNotification]
  );

  const markNeedsCorrection = useCallback(
    async (docId: string, reason: string) => {
      const target = documents.find((d) => d.id === docId);
      if (!target) return;

      const updated: DocumentRecord = {
        ...target,
        status: 'Needs Correction',
        correctionReason: reason || 'Flagged for manual correction by officer.',
        completedDate: undefined,
        updatedAt: new Date().toISOString(),
      };
      await persistDoc(updated);
      await addNotification({
        type: 'warning',
        titleEn: 'Document Requires Correction',
        titleKn: 'ದಾಖಲೆಗೆ ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿದೆ',
        messageEn: `${target.id} marked as Needs Correction.`,
        messageKn: `${target.id} ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ.`,
        documentId: target.id,
        targetRoute: `/verification/${target.id}`,
      });
    },
    [documents, persistDoc, addNotification]
  );

  const deleteDocument = useCallback(async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await dbService.deleteDocument(docId);
  }, []);

  const clearAllDocuments = useCallback(async () => {
    setDocuments([]);
    localStorage.setItem(SEEDED_FLAG_KEY, '1');
    await dbService.clearDocuments();
  }, []);

  const importDocumentsBackup = useCallback(
    async (records: DocumentRecord[]): Promise<number> => {
      let count = 0;
      for (const rec of records) {
        if (rec && rec.id && rec.fileName) {
          await persistDoc(rec);
          count += 1;
        }
      }
      return count;
    },
    [persistDoc]
  );

  const stats: DocumentStats = useMemo(() => {
    const total = documents.length;
    const completed = documents.filter((d) => d.status === 'Completed').length;
    const processing = documents.filter((d) => d.status === 'Processing').length;
    const awaitingVerification = documents.filter(
      (d) => d.status === 'Awaiting Verification'
    ).length;
    const needsCorrection = documents.filter((d) => d.status === 'Needs Correction').length;
    const failed = documents.filter((d) => d.status === 'Failed').length;
    const uploaded = documents.filter((d) => d.status === 'Uploaded').length;
    const pending = documents.filter((d) => isPendingStatus(d.status)).length;

    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const scoredDocs = documents.filter((d) => d.overallConfidence > 0);
    const averageConfidence =
      scoredDocs.length > 0
        ? Math.round(
            scoredDocs.reduce((sum, d) => sum + d.overallConfidence, 0) / scoredDocs.length
          )
        : 0;

    const todayStr = new Date().toDateString();
    const isToday = (iso?: string) => (iso ? new Date(iso).toDateString() === todayStr : false);

    const receivedToday = documents.filter((d) => isToday(d.uploadDate)).length;
    const processedToday = documents.filter(
      (d) =>
        isToday(d.updatedAt) &&
        (['Awaiting Verification', 'Completed', 'Needs Correction'] as DocumentStatus[]).includes(
          d.status
        )
    ).length;
    const verifiedToday = documents.filter(
      (d) => d.status === 'Completed' && isToday(d.completedDate)
    ).length;
    const pendingToday = documents.filter(
      (d) => isToday(d.uploadDate) && isPendingStatus(d.status)
    ).length;

    return {
      total,
      completed,
      pending,
      processing,
      awaitingVerification,
      needsCorrection,
      failed,
      uploaded,
      completionPercentage,
      averageConfidence,
      receivedToday,
      processedToday,
      verifiedToday,
      pendingToday,
    };
  }, [documents]);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loadingDocs,
        preferences,
        isOnline,
        systemHealth,
        processingState,
        stats,
        refreshHealth,
        updateActiveSelection,
        updateOfficerProfile,
        updatePreferences,
        createDocument,
        processDocumentOcr,
        saveVerificationDraft,
        approveDocument,
        markNeedsCorrection,
        deleteDocument,
        clearAllDocuments,
        importDocumentsBackup,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return ctx;
}
