import 'dotenv/config';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

// Server-side session signing secret (ephemeral random fallback if SESSION_SECRET is unset)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface ClaimedOfficerAccount {
  employeeId: string;
  officerName: string;
  designation: string;
  salt: string;
  passwordHash: string;
  claimedAt: string;
}

let claimedAccount: ClaimedOfficerAccount | null = null;
const activeTokens = new Map<
  string,
  { employeeId: string; officerName: string; designation: string; expiresAt: number }
>();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyScryptPassword(password: string, salt: string, expectedHex: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function issueSessionToken(officer: {
  employeeId: string;
  officerName: string;
  designation: string;
}): string {
  const raw = crypto.randomBytes(24).toString('hex');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('hex');
  const token = `${raw}.${sig}`;
  activeTokens.set(token, {
    ...officer,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  });
  return token;
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Officer authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const session = activeTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    activeTokens.delete(token);
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  next();
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isAllowedLocalServiceUrl(rawUrl: string | undefined): URL | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

const ALLOWED_OCR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

interface OcrRequestBody {
  dataUrl?: string;
  mimeType?: string;
  fileName?: string;
  languageHint?: string;
  department?: string;
  district?: string;
  taluk?: string;
  office?: string;
}

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatMessageInput[];
  uiLanguage?: 'en' | 'kn';
  contextSummary?: {
    department?: string;
    district?: string;
    taluk?: string;
    office?: string;
    totalDocuments?: number;
    pendingDocuments?: number;
    completedDocuments?: number;
  };
}

const LEKHASETU_KNOWLEDGE_BASE = `
LEKHASETU Official Application Guide & Knowledge Base:
- Purpose: LEKHASETU is an offline-first bilingual (Kannada and English) government document digitization platform built for Karnataka government departments.
- Supported Departments:
  1. Police Station (ಪೊಲೀಸ್ ಠಾಣೆ) - requires District, Taluk, and Police Station selection.
  2. Tahsildar Office (ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ) - requires District, Taluk, and Tahsildar Office selection.
  3. City Corporation (ಮಹಾನಗರ ಪಾಲಿಕೆ) - requires District and City Corporation selection (e.g., BBMP, Mysuru City Corporation, Mangaluru City Corporation, Hubballi-Dharwad).
  4. Regional Transport Office / RTO (ಪ್ರಾದೇಶಿಕ ಸಾರಿಗೆ ಕಚೇರಿ) - requires District and RTO Office (e.g., KA-01 Koramangala, KA-09 Mysuru West).
  5. Gram Panchayat (ಗ್ರಾಮ ಪಂಚಾಯಿತಿ) - requires District, Taluk, and Gram Panchayat selection.
  6. Other Government Departments (ಇತರೆ ಸರ್ಕಾರಿ ಇಲಾಖೆಗಳು) - allows District and manual or directory office selection.
- Step-by-step Workflows:
  1. Department & Location Setup: Open "Department Selection" from the sidebar, choose Department -> Karnataka District -> Taluk (if applicable) -> Government Office. All dropdowns support typing in both English and Kannada (e.g., "Mysuru" or "ಮೈಸೂರು").
  2. Uploading Documents: Open "Upload Document", drag and drop or browse JPG, JPEG, PNG, or PDF files (up to 15 MB), choose the document's handwritten language (Kannada, English, or Bilingual), verify the associated office, and click "Save & Process OCR".
  3. Scanning Documents: Open "Scan Document", allow camera access, capture the handwritten document photo, review or retake, then confirm and save or process immediately.
  4. OCR Processing: "Process Documents" shows the 7 pipeline stages: Document received, Image preprocessing, Language detection, Handwriting recognition, Text extraction, Structured information extraction, Ready for verification.
  5. Verification: Open "Verification" for a split-screen view: Left shows the original handwritten scan with zoom/rotation controls; Right shows extracted text and editable structured fields (Full Name, Father's Name, Address, Village, District, Taluk, Date, PIN Code, Subject) with Green (>=85%), Yellow (65-84%), and Red (<65%) confidence indicators. A document only counts as "Completed" after an officer reviews and clicks "Approve & Complete Verification".
  6. Records & Export: "Pending Documents" tracks Uploaded, Processing, Awaiting Verification, Needs Correction, and Failed items. "Completed Documents" holds verified records with CSV, JSON, and Printable Summary exports. "All Records" provides full search, sort, edit, view, and delete with confirmation.
  7. Offline Storage: Documents, notifications, and chat history are stored locally in the browser's IndexedDB ("lekhasetu_db"), and user preferences are saved in LocalStorage. District, taluk, department, and office datasets work completely offline.
  8. Strict Policy: Do not invent Karnataka government circulars, statutory rules, fees, or legal advice. Only explain verified LEKHASETU features and general document digitization guidance. If asked about legal or statutory rules not in this guide, clearly advise the officer to consult their official department manual or Karnataka Government circular.
`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Auth status endpoint (never exposes secrets or hashes)
  app.get('/api/auth/status', (_req: Request, res: Response) => {
    const envPasscode = (process.env.OFFICER_PASSCODE || '').trim();
    const envConfigured = envPasscode.length > 0;
    res.json({
      envConfigured,
      claimed: Boolean(claimedAccount),
      claimedEmployeeId: claimedAccount?.employeeId || null,
    });
  });

  // One-time first-run officer setup when OFFICER_PASSCODE is not configured
  app.post('/api/auth/setup', (req: Request, res: Response) => {
    const envPasscode = (process.env.OFFICER_PASSCODE || '').trim();
    if (envPasscode.length > 0) {
      res.status(403).json({
        error: 'Officer passcode is managed via server environment configuration. Please use Sign In.',
      });
      return;
    }
    if (claimedAccount) {
      res.status(409).json({
        error: 'Officer access is already claimed. Please sign in with your credentials.',
      });
      return;
    }

    const { employeeId, officerName, designation, password } = req.body as {
      employeeId?: string;
      officerName?: string;
      designation?: string;
      password?: string;
    };

    const cleanId = (employeeId || '').trim();
    const cleanName = (officerName || '').trim();
    const cleanDesig = (designation || 'Revenue / Administrative Officer').trim();
    const cleanPass = password || '';

    if (!cleanId || !cleanName) {
      res.status(400).json({ error: 'Employee ID and Officer Name are required.' });
      return;
    }
    if (cleanPass.length < 6) {
      res.status(400).json({ error: 'Passcode must be at least 6 characters.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(cleanPass, salt);
    claimedAccount = {
      employeeId: cleanId,
      officerName: cleanName,
      designation: cleanDesig,
      salt,
      passwordHash,
      claimedAt: new Date().toISOString(),
    };

    const officer = {
      employeeId: claimedAccount.employeeId,
      officerName: claimedAccount.officerName,
      designation: claimedAccount.designation,
    };
    const token = issueSessionToken(officer);
    res.json({ token, officer });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { employeeId, password, officerName, designation } = req.body as {
      employeeId?: string;
      password?: string;
      officerName?: string;
      designation?: string;
    };

    const cleanId = (employeeId || '').trim();
    const cleanPass = password || '';

    if (!cleanId || !cleanPass) {
      res.status(400).json({ error: 'Employee ID and Passcode are required.' });
      return;
    }

    const envPasscode = (process.env.OFFICER_PASSCODE || '').trim();
    if (envPasscode.length > 0) {
      if (!safeEqualStrings(cleanPass, envPasscode)) {
        res.status(401).json({ error: 'Invalid Employee ID or Passcode.' });
        return;
      }
      const officer = {
        employeeId: cleanId,
        officerName: (officerName || '').trim() || `Officer ${cleanId}`,
        designation: (designation || '').trim() || 'Karnataka Government Officer',
      };
      const token = issueSessionToken(officer);
      res.json({ token, officer });
      return;
    }

    if (!claimedAccount) {
      res.status(400).json({
        error: 'Officer access has not been initialized yet. Complete first-run setup.',
      });
      return;
    }

    const idMatches = claimedAccount.employeeId.toLowerCase() === cleanId.toLowerCase();
    const passMatches = verifyScryptPassword(
      cleanPass,
      claimedAccount.salt,
      claimedAccount.passwordHash
    );

    if (!idMatches || !passMatches) {
      res.status(401).json({ error: 'Invalid Employee ID or Passcode.' });
      return;
    }

    const officer = {
      employeeId: claimedAccount.employeeId,
      officerName: claimedAccount.officerName,
      designation: claimedAccount.designation,
    };
    const token = issueSessionToken(officer);
    res.json({ token, officer });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      activeTokens.delete(authHeader.slice(7).trim());
    }
    res.json({ ok: true });
  });

  app.get('/api/health', async (_req: Request, res: Response) => {
    const localOcrUrl = isAllowedLocalServiceUrl(process.env.LOCAL_OCR_URL);
    const localRagUrl = isAllowedLocalServiceUrl(process.env.LOCAL_RAG_URL);
    const geminiAvailable = Boolean(getGeminiClient());

    let localOcrOnline = false;
    let localRagOnline = false;

    if (localOcrUrl) {
      try {
        const resp = await fetch(`${localOcrUrl.origin}/health`, {
          signal: AbortSignal.timeout(1500),
        });
        localOcrOnline = resp.ok;
      } catch {
        localOcrOnline = false;
      }
    }

    if (localRagUrl) {
      try {
        const resp = await fetch(`${localRagUrl.origin}/health`, {
          signal: AbortSignal.timeout(1500),
        });
        localRagOnline = resp.ok;
      } catch {
        localRagOnline = false;
      }
    }

    const ocrReady = localOcrOnline || geminiAvailable;
    const chatReady = localRagOnline || geminiAvailable;

    res.json({
      server: 'online',
      ocrEngine: {
        status: ocrReady ? 'online' : 'unavailable',
        provider: localOcrOnline
          ? 'Local Python OCR'
          : geminiAvailable
            ? 'Gemini Vision OCR (gemini-4-hydrogen)'
            : 'Not configured',
        kannadaSupport: ocrReady,
        englishSupport: ocrReady,
      },
      ragAssistant: {
        status: chatReady ? 'online' : 'unavailable',
        provider: localRagOnline
          ? 'Local Python RAG'
          : geminiAvailable
            ? 'Gemini Document Assistant (gemini-4-hydrogen)'
            : 'Offline Fallback Guide',
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/ocr', requireAuth, async (req: Request, res: Response) => {
    try {
      const body = req.body as OcrRequestBody;
      const { dataUrl, mimeType, fileName, languageHint, department, district, taluk, office } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'Missing document image or PDF payload.' });
        return;
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      const resolvedMime = (match?.[1] || mimeType || '').toLowerCase();
      const normalizedMime = resolvedMime === 'image/jpg' ? 'image/jpeg' : resolvedMime;
      const base64Data = match?.[2] || dataUrl;

      if (!ALLOWED_OCR_MIME_TYPES.has(normalizedMime)) {
        res.status(400).json({
          error: `Unsupported file type (${normalizedMime || 'unknown'}). Allowed: JPG, PNG, WEBP, PDF.`,
        });
        return;
      }

      if (base64Data.length > 22 * 1024 * 1024) {
        res.status(413).json({ error: 'Document exceeds maximum processing size (15 MB).' });
        return;
      }

      const localOcrUrl = isAllowedLocalServiceUrl(process.env.LOCAL_OCR_URL);
      if (localOcrUrl) {
        try {
          const pyRes = await fetch(`${localOcrUrl.origin}/ocr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              mimeType: normalizedMime,
              fileName,
              languageHint,
              department,
              district,
              taluk,
              office,
            }),
            signal: AbortSignal.timeout(30000),
          });
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            res.json({ ...pyData, provider: 'Local Python OCR' });
            return;
          }
        } catch {
          // Fall through to Gemini OCR if configured
        }
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'OCR engine is not configured on the server. Set GEMINI_API_KEY or LOCAL_OCR_URL to enable document digitization.',
        });
        return;
      }

      const prompt = `You are a high-precision bilingual Kannada and English handwritten government document OCR and structured extraction engine for Karnataka Government departments.

Context provided by the officer:
- File Name: ${fileName || 'Unknown'}
- Expected Document Language: ${languageHint || 'Auto-detect (Kannada / English)'}
- Department: ${department || 'Unspecified'}
- District: ${district || 'Unspecified'}
- Taluk: ${taluk || 'Unspecified'}
- Office: ${office || 'Unspecified'}

Instructions:
1. Transcribe ALL visible text (both Kannada script and English script) faithfully and verbatim into "extractedText". Preserve line breaks. Do NOT invent or hallucinate text that is not visible in the document.
2. Detect the actual script(s) present: "Kannada", "English", or "Bilingual (Kannada + English)".
3. Extract structured fields where present in the document. For fields not present in the document, set value to "" and confidence to 0. Always include these field keys in the "fields" array:
   - fullName (label: "Full Name")
   - fatherName (label: "Father's Name")
   - address (label: "Address")
   - village (label: "Village / Ward")
   - taluk (label: "Taluk")
   - district (label: "District")
   - date (label: "Date")
   - pinCode (label: "PIN Code")
   - subject (label: "Subject / Purpose")
   - documentNumber (label: "Reference / Application No.")
4. Provide realistic calibrated confidence scores (0-100) per field and overallConfidence (0-100) based on handwriting clarity, ink contrast, and ambiguity. Use lower confidence (<70) if handwriting is faint, smudged, or partially cut off.
5. In "notes", note any illegible lines, stamp marks, or low-confidence areas the officer should verify carefully.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              extractedText: { type: Type.STRING },
              overallConfidence: { type: Type.NUMBER },
              notes: { type: Type.STRING },
              fields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    boundingHint: { type: Type.STRING },
                  },
                  required: ['key', 'label', 'value', 'confidence'],
                },
              },
            },
            required: ['detectedLanguage', 'extractedText', 'overallConfidence', 'fields'],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'OCR engine returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({
        ...parsed,
        provider: `Gemini Vision OCR (${MODEL_NAME})`,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR processing failed.';
      console.error('OCR route error:', message);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/chat', requireAuth, async (req: Request, res: Response) => {
    try {
      const body = req.body as ChatRequestBody;
      const userMessage = body.message?.trim();

      if (!userMessage) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }

      const localRagUrl = isAllowedLocalServiceUrl(process.env.LOCAL_RAG_URL);
      if (localRagUrl) {
        try {
          const ragRes = await fetch(`${localRagUrl.origin}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(25000),
          });
          if (ragRes.ok) {
            const ragData = await ragRes.json();
            res.json({ ...ragData, provider: 'Local Python RAG' });
            return;
          }
        } catch {
          // Fall through to Gemini assistant if configured
        }
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI Assistant service is unavailable. Check GEMINI_API_KEY or LOCAL_RAG_URL.',
        });
        return;
      }

      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const historyText = history
        .map((m) => `${m.role === 'user' ? 'Officer' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const ctx = body.contextSummary || {};
      const systemInstruction = `You are the LEKHASETU AI Assistant helping Karnataka government employees digitize and verify handwritten Kannada and English documents.

Rules:
- Respond clearly, politely, and concisely in the language the officer uses (Kannada if asked in Kannada, English if asked in English, or clear bilingual Kannada+English if asked in mixed Kanglish). Current UI language preference: ${body.uiLanguage === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}.
- Ground all answers strictly in the LEKHASETU Knowledge Base below and the officer's current workspace context.
- NEVER invent government rules, statutory fees, legal procedures, or official circulars not provided in the knowledge base. If asked about legal/statutory rules outside LEKHASETU, state honestly that you do not have official government rulebooks loaded and advise consulting the department's official circular or senior officer.
- Provide actionable step-by-step instructions referencing the exact sidebar menus in LEKHASETU.

Officer's Current Workspace Context:
- Selected Department: ${ctx.department || 'Not selected yet'}
- District: ${ctx.district || 'Not selected'}
- Taluk: ${ctx.taluk || 'Not selected'}
- Office: ${ctx.office || 'Not selected'}
- Total Documents: ${ctx.totalDocuments ?? 0}
- Pending Documents: ${ctx.pendingDocuments ?? 0}
- Completed Documents: ${ctx.completedDocuments ?? 0}

${LEKHASETU_KNOWLEDGE_BASE}`;

      const fullPrompt = historyText
        ? `Previous conversation:\n${historyText}\n\nOfficer's new question: ${userMessage}`
        : userMessage;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: fullPrompt,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'Assistant returned an empty response.' });
        return;
      }

      res.json({
        reply,
        provider: `Gemini Document Assistant (${MODEL_NAME})`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI Chat request failed.';
      console.error('Chat route error:', message);
      res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));
  if (isProd) {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LEKHASETU server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LEKHASETU server:', err);
  process.exit(1);
});
