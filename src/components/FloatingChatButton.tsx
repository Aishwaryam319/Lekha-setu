import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function FloatingChatButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (location.pathname === '/assistant') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/assistant')}
      aria-label={t('navAssistant')}
      className="fixed bottom-4 right-5 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded border border-white/25 bg-[#0C2340] hover:bg-[#184172] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer no-print"
    >
      <Bot className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">{t('navAssistant')}</span>
    </button>
  );
}
