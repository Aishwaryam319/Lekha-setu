import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, Send, Trash2, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import { dbService } from '../services/storage';
import { sendAssistantMessage } from '../services/api';

function buildOfflineFallbackReply(query: string, lang: 'en' | 'kn'): string {
  const q = query.toLowerCase();
  if (q.includes('upload') || q.includes('ಅಪ್‌ಲೋಡ್') || q.includes('pdf') || q.includes('jpg')) {
    return lang === 'kn'
      ? 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು:\n1. ಸೈಡ್‌ಬಾರ್‌ನಿಂದ "ಇಲಾಖೆ ಆಯ್ಕೆ" ತೆರೆದು ಇಲಾಖೆ, ಜಿಲ್ಲೆ, ತಾಲ್ಲೂಕು ಮತ್ತು ಕಚೇರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n2. "ದಾಖಲೆ ಅಪ್‌ಲೋಡ್" ಪುಟಕ್ಕೆ ಹೋಗಿ JPG, PNG, ಅಥವಾ PDF (ಗರಿಷ್ಠ 15 MB) ಆಯ್ಕೆಮಾಡಿ.\n3. ದಾಖಲೆಯ ಕೈಬರಹ ಭಾಷೆಯನ್ನು ಆರಿಸಿ "ಉಳಿಸಿ ಮತ್ತು OCR ಸಂಸ್ಕರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.'
      : 'To upload a document:\n1. Confirm your Department, District, Taluk, and Office in "Department Selection".\n2. Open "Upload Document" and drag-and-drop or browse a JPG, JPEG, PNG, or PDF (max 15 MB).\n3. Choose the document handwriting language and click "Save & Process OCR".';
  }
  if (q.includes('scan') || q.includes('camera') || q.includes('ಸ್ಕ್ಯಾನ್') || q.includes('ಕ್ಯಾಮೆರಾ')) {
    return lang === 'kn'
      ? 'ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು: "ದಾಖಲೆ ಸ್ಕ್ಯಾನ್" ಪುಟಕ್ಕೆ ಹೋಗಿ, "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ" ಕ್ಲಿಕ್ ಮಾಡಿ, ಸ್ಪಷ್ಟ ಬೆಳಕಿನಲ್ಲಿ ಫೋಟೋ ತೆಗೆಯಿರಿ ಮತ್ತು "ದೃಢೀಕರಿಸಿ ಮತ್ತು OCR ಸಂಸ್ಕರಿಸಿ" ಒತ್ತಿರಿ.'
      : 'To scan a document: Open "Scan Document", click "Open Camera", capture a clear photo of the handwritten page, review it, and click "Confirm & Process OCR".';
  }
  if (q.includes('verify') || q.includes('correct') || q.includes('ocr') || q.includes('ಪರಿಶೀಲ') || q.includes('ತಿದ್ದುಪಡಿ')) {
    return lang === 'kn'
      ? 'ಪರಿಶೀಲನೆ ಮತ್ತು ತಿದ್ದುಪಡಿ ಮಾಡಲು: "ಪರಿಶೀಲನೆ" ಪುಟವನ್ನು ತೆರೆಯಿರಿ. ಎಡಭಾಗದಲ್ಲಿ ಮೂಲ ದಾಖಲೆಯನ್ನು ಜೂಮ್ ಮಾಡಿ ನೋಡಬಹುದು; ಬಲಭಾಗದಲ್ಲಿ ಕೆಂಪು/ಹಳದಿ ಬಣ್ಣದ ಕಡಿಮೆ ವಿಶ್ವಾಸಾರ್ಹತೆಯ ಕ್ಷೇತ್ರಗಳನ್ನು ತಿದ್ದಿ "ಅನುಮೋದಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.'
      : 'To verify & correct OCR output: Open "Verification". Compare the zoomable original scan on the left with extracted fields on the right. Edit any low-confidence (yellow/red) fields and click "Approve & Complete Verification" to finalize the record.';
  }
  return lang === 'kn'
    ? 'ಪ್ರಸ್ತುತ ಆನ್‌ಲೈನ್ AI ಸೇವೆ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಅಂತರ್ನಿರ್ಮಿತ ಆಫ್‌ಲೈನ್ ಸಹಾಯ ತೋರಿಸಲಾಗುತ್ತಿದೆ:\n• ಇಲಾಖೆ ಮತ್ತು ಕಚೇರಿ ಆಯ್ಕೆ: "ಇಲಾಖೆ ಆಯ್ಕೆ" ಪುಟದಲ್ಲಿ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಜಿಲ್ಲೆ/ತಾಲ್ಲೂಕು ಹುಡುಕಬಹುದು.\n• ಅಪ್‌ಲೋಡ್ / ಸ್ಕ್ಯಾನ್: ನಿಮ್ಮ ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಸ್ಥಳೀಯ IndexedDB ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಯುತ್ತವೆ.\n• ಹುಡುಕಾಟ ಮತ್ತು ರಫ್ತು: "ಎಲ್ಲಾ ದಾಖಲೆಗಳು" ಮತ್ತು "ಪೂರ್ಣಗೊಂಡ ದಾಖಲೆಗಳು" ಪುಟಗಳಲ್ಲಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ CSV/JSON ರಫ್ತು ಮಾಡಬಹುದು.'
    : 'Offline Built-in Guidance (AI service currently unavailable):\n• Department & Location: Search all 31 Karnataka districts and taluks in Kannada or English via "Department Selection".\n• Upload / Scan: Files and records are stored locally in IndexedDB and remain accessible offline.\n• Verification & Export: Review records in "Verification", and export CSV/JSON/Summary reports offline from "Completed Documents" or "All Records".';
}

export function ChatAssistantPage() {
  const { language, t, pick } = useLanguage();
  const { preferences, stats, isOnline, systemHealth } = useDocuments();
  const { token } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dbService
      .getChatHistory()
      .then((history) => setMessages(history))
      .catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const suggestedPrompts =
    language === 'kn'
      ? [
          'ಕೈಬರಹದ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮತ್ತು OCR ಮಾಡುವುದು ಹೇಗೆ?',
          'OCR ತಪ್ಪುಗಳನ್ನು ಸರಿಪಡಿಸಿ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸುವುದು ಹೇಗೆ?',
          'ನನ್ನ ಜಿಲ್ಲೆ, ತಾಲ್ಲೂಕು ಮತ್ತು ಕಚೇರಿಯನ್ನು ಹೇಗೆ ಹುಡುಕಬೇಕು?',
          'ಪೂರ್ಣಗೊಂಡ ದಾಖಲೆಗಳನ್ನು CSV ಗೆ ರಫ್ತು ಮಾಡುವುದು ಹೇಗೆ?',
        ]
      : [
          'How do I upload and process a handwritten Kannada document?',
          'How do I correct low-confidence OCR fields and verify a record?',
          'How do I search for my district, taluk, and office in Kannada or English?',
          'How do I export completed documents offline?',
        ];

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    if (!textOverride) setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    await dbService.saveChatMessage(userMsg);

    setSending(true);
    try {
      const sel = preferences.activeSelection;
      const resp = await sendAssistantMessage(
        {
          message: text,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          uiLanguage: language,
          contextSummary: {
            department: sel.departmentId,
            district: sel.districtId,
            taluk: sel.talukId,
            office: sel.customOfficeName || sel.officeNameEn,
            totalDocuments: stats.total,
            pendingDocuments: stats.pending,
            completedDocuments: stats.completed,
          },
        },
        token
      );

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: resp.reply,
        timestamp: resp.timestamp || new Date().toISOString(),
        provider: resp.provider,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await dbService.saveChatMessage(assistantMsg);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: buildOfflineFallbackReply(text, language),
        timestamp: new Date().toISOString(),
        isOfflineFallback: true,
        provider: 'Offline Help Guide',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      await dbService.saveChatMessage(fallbackMsg);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setMessages([]);
    await dbService.clearChatHistory();
  };

  const aiUnavailable = !isOnline || systemHealth.ragAssistant.status !== 'online';

  return (
    <div className="max-w-4xl space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {t('assistantTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{t('assistantSubtitle')}</p>
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={messages.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('clearChat')}</span>
        </button>
      </div>

      {aiUnavailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-900 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{t('assistantOfflineBanner')}</span>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 max-w-xl mx-auto space-y-5">
              <div className="text-center space-y-2">
                <div className="w-11 h-11 rounded-full bg-[#173B63]/10 text-[#173B63] flex items-center justify-center mx-auto">
                  <Bot className="w-5 h-5" />
                </div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  {pick('How can I help you today, Officer?', 'ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?')}
                </h2>
                <p className="text-xs text-slate-500">
                  {pick(
                    'Ask in Kannada, English, or mixed Kannada-English about LEKHASETU workflows.',
                    'ಲೇಖಸೇತು ಪ್ರಕ್ರಿಯೆಗಳ ಬಗ್ಗೆ ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಮಿಶ್ರ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ.'
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {t('suggestedQuestions')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedPrompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="p-3 text-left text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-[#173B63] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#173B63] text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div
                    className={`mt-1.5 text-[11px] flex items-center gap-2 ${
                      msg.role === 'user' ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    <span className="font-mono tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.provider && <span>· {msg.provider}</span>}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {sending && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-lg bg-[#173B63] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <span>{t('assistantTyping')}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#173B63] hover:bg-[#112d4d] disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
