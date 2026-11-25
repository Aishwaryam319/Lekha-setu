import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Database, Globe, LogOut, Menu, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationPanel } from './NotificationPanel';
import { KARNATAKA_LOGO_URL } from './Sidebar';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { language, setLanguage, t, pick } = useLanguage();
  const { preferences, isOnline, systemHealth } = useDocuments();
  const { unreadCount } = useNotifications();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
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

  const routePageTitle = (() => {
    const p = location.pathname;
    if (p === '/') return t('navDashboard');
    if (p.startsWith('/department')) return t('navDepartment');
    if (p.startsWith('/upload')) return t('navUpload');
    if (p.startsWith('/scan')) return t('navScan');
    if (p.startsWith('/processing')) return t('navProcessing');
    if (p.startsWith('/verification')) return t('navVerification');
    if (p.startsWith('/pending')) return t('navPending');
    if (p.startsWith('/completed')) return t('navCompleted');
    if (p.startsWith('/records')) return t('navRecords');
    if (p.startsWith('/assistant')) return t('navAssistant');
    if (p.startsWith('/reports')) return t('navReports');
    if (p.startsWith('/settings')) return t('navSettings');
    if (p.startsWith('/help')) return t('navHelp');
    return t('navDashboard');
  })();

  const formattedDateTime = now.toLocaleString(language === 'kn' ? 'kn-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const activeOfficeLabel =
    preferences.activeSelection.customOfficeName.trim() ||
    (language === 'kn'
      ? preferences.activeSelection.officeNameKn
      : preferences.activeSelection.officeNameEn) ||
    t('navDepartment');

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-300 px-4 lg:px-6 h-14 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src={KARNATAKA_LOGO_URL}
          alt="Government of Karnataka"
          className="w-8 h-8 rounded-full bg-white object-contain shrink-0 lg:hidden"
        />

        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="font-display font-bold text-[#0C2340] whitespace-nowrap">
            LEKHASETU
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">{routePageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Active Office quick link */}
        <button
          type="button"
          onClick={() => navigate('/department')}
          title={activeOfficeLabel}
          className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 max-w-[220px] cursor-pointer"
        >
          <span className="truncate">{activeOfficeLabel}</span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300">
          <Globe className="w-3.5 h-3.5 text-slate-600 ml-1.5 mr-1 hidden sm:block" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap cursor-pointer ${
              language === 'en'
                ? 'bg-[#0C2340] text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap cursor-pointer ${
              language === 'kn'
                ? 'bg-[#0C2340] text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Connectivity & DB indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50 text-xs">
          <span
            className={`inline-flex items-center gap-1 font-medium whitespace-nowrap ${
              isOnline ? 'text-emerald-800' : 'text-amber-800'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? t('onlineMode') : t('offlineMode')}</span>
          </span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span
            className={`inline-flex items-center gap-1 font-medium whitespace-nowrap ${
              systemHealth.indexedDbConnected ? 'text-slate-700' : 'text-red-700'
            }`}
            title={formattedDateTime}
          >
            <Database className="w-3.5 h-3.5 text-[#0F766E]" />
            <span className="hidden lg:inline">IndexedDB</span>
          </span>
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={t('notifications')}
            className="relative p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-sm bg-[#B91C1C] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={signOut}
          title={pick('Sign Out', 'ಲಾಗ್ ಔಟ್')}
          aria-label={pick('Sign Out', 'ಲಾಗ್ ಔಟ್')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-red-50 hover:text-red-800 hover:border-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{pick('Sign Out', 'ಲಾಗ್ ಔಟ್')}</span>
        </button>
      </div>
    </header>
  );
}
