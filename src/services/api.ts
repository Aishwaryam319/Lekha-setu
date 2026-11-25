import axios from 'axios';
import { ChatMessage, ExtractedField } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export interface AuthStatusResponse {
  envConfigured: boolean;
  claimed: boolean;
  claimedEmployeeId: string | null;
}

export interface OfficerSessionInfo {
  employeeId: string;
  officerName: string;
  designation: string;
}

export interface AuthResponse {
  token: string;
  officer: OfficerSessionInfo;
}

export interface HealthResponse {
  server: string;
  ocrEngine: {
    status: 'online' | 'unavailable';
    provider: string;
    kannadaSupport: boolean;
    englishSupport: boolean;
  };
  ragAssistant: {
    status: 'online' | 'unavailable';
    provider: string;
  };
  timestamp: string;
}

export interface OcrApiResponse {
  detectedLanguage: string;
  extractedText: string;
  overallConfidence: number;
  notes?: string;
  fields: ExtractedField[];
  provider: string;
  processedAt: string;
}

export interface ChatApiResponse {
  reply: string;
  provider: string;
  timestamp: string;
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  const { data } = await apiClient.get<AuthStatusResponse>('/auth/status', { timeout: 5000 });
  return data;
}

export async function setupOfficerAccount(payload: {
  employeeId: string;
  officerName: string;
  designation: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>('/auth/setup', payload);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMsg = (err.response?.data as { error?: string } | undefined)?.error;
      throw new Error(serverMsg || err.message || 'Officer setup failed.');
    }
    throw err;
  }
}

export async function loginOfficer(payload: {
  employeeId: string;
  password: string;
  officerName?: string;
  designation?: string;
}): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMsg = (err.response?.data as { error?: string } | undefined)?.error;
      throw new Error(serverMsg || err.message || 'Sign in failed.');
    }
    throw err;
  }
}

export async function logoutOfficer(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await apiClient.post(
      '/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    // Ignore logout transport errors
  }
}

export async function fetchSystemHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health', { timeout: 5000 });
  return data;
}

export async function runDocumentOcr(
  payload: {
    dataUrl: string;
    mimeType: string;
    fileName: string;
    languageHint: string;
    department: string;
    district: string;
    taluk: string;
    office: string;
  },
  token: string | null
): Promise<OcrApiResponse> {
  try {
    const { data } = await apiClient.post<OcrApiResponse>('/ocr', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMsg = (err.response?.data as { error?: string } | undefined)?.error;
      throw new Error(serverMsg || err.message || 'OCR request failed.');
    }
    throw err;
  }
}

export async function sendAssistantMessage(
  payload: {
    message: string;
    history: Pick<ChatMessage, 'role' | 'content'>[];
    uiLanguage: 'en' | 'kn';
    contextSummary: {
      department?: string;
      district?: string;
      taluk?: string;
      office?: string;
      totalDocuments: number;
      pendingDocuments: number;
      completedDocuments: number;
    };
  },
  token: string | null
): Promise<ChatApiResponse> {
  try {
    const { data } = await apiClient.post<ChatApiResponse>('/chat', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMsg = (err.response?.data as { error?: string } | undefined)?.error;
      throw new Error(serverMsg || err.message || 'AI Assistant unavailable.');
    }
    throw err;
  }
}
