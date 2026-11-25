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
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-[#173B63] hover:bg-[#0D9488] text-white text-sm font-medium shadow-lg transition-colors cursor-pointer no-print"
    >
      <Bot className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">{t('navAssistant')}</span>
    </button>
  );
}
