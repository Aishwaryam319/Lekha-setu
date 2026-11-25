import React, { useEffect, useRef, useState } from 'react';
import { Bell, Database, Globe, LogOut, Menu, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { language, setLanguage, t, pick } = useLanguage();
  const { preferences, isOnline, systemHealth } = useDocuments();
  const { unreadCount } = useNotifications();
  const { signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [avatarFailed, setAvatarFailed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const formattedDateTime = now.toLocaleString(language === 'kn' ? 'kn-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const initials = preferences.officerProfile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/karnataka-emblem.svg"
            alt="Government of Karnataka"
            className="w-8 h-8 shrink-0 lg:hidden"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-[#123254] tracking-tight whitespace-nowrap lg:hidden">
                {t('appName')}
              </span>
              <span className="hidden lg:inline text-sm font-semibold text-[#123254] truncate">
                {pick('Karnataka State Document Digitization Portal', 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ದಾಖಲೆ ಡಿಜಿಟಲೀಕರಣ ಪೋರ್ಟಲ್')}
              </span>
              <span className="hidden xl:inline text-slate-300" aria-hidden="true">·</span>
              <span className="hidden xl:inline text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                {formattedDateTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Offline / Online & IndexedDB Indicators */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-600">
          <span
            className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${
              isOnline ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? t('onlineMode') : t('offlineMode')}</span>
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span
            className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${
              systemHealth.indexedDbConnected ? 'text-slate-600' : 'text-red-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{systemHealth.indexedDbConnected ? t('localDbReady') : t('localDbError')}</span>
          </span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1 hidden sm:block" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              language === 'en'
                ? 'bg-[#123254] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              language === 'kn'
                ? 'bg-[#123254] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={t('notifications')}
            className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Officer Profile + Sign Out */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          {!avatarFailed ? (
            <img
              src="/src/assets/images/officer_profile_avatar_1795616046589.jpg"
              alt={preferences.officerProfile.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#123254] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials || 'OF'}
            </div>
          )}
          <div className="hidden sm:block leading-tight min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate max-w-[125px]">
              {preferences.officerProfile.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate max-w-[125px]">
              {preferences.officerProfile.employeeId}
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            title={pick('Sign Out', 'ಲಾಗ್ ಔಟ್')}
            aria-label={pick('Sign Out', 'ಲಾಗ್ ಔಟ್')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
