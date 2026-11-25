import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Bot,
  Building2,
  Camera,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  FileCheck2,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDocuments } from '../context/DocumentContext';
import { TranslationKey } from '../utils/translations';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  badgeCount?: number;
}

export const KARNATAKA_LOGO_URL =
  '/assets/aistudio/AdobeExpressPhotos_7d9301e4c6d743bcae7e9a579044405d_CopyEdited_31ac62a6.png';

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { t, pick } = useLanguage();
  const { preferences, updatePreferences, stats } = useDocuments();
  const collapsed = preferences.sidebarCollapsed;
  const [avatarFailed, setAvatarFailed] = React.useState(false);

  const navItems: NavItem[] = [
    { to: '/', labelKey: 'navDashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { to: '/department', labelKey: 'navDepartment', icon: <Building2 className="w-4 h-4 shrink-0" /> },
    { to: '/upload', labelKey: 'navUpload', icon: <Upload className="w-4 h-4 shrink-0" /> },
    { to: '/scan', labelKey: 'navScan', icon: <Camera className="w-4 h-4 shrink-0" /> },
    { to: '/processing', labelKey: 'navProcessing', icon: <Cpu className="w-4 h-4 shrink-0" /> },
    {
      to: '/verification',
      labelKey: 'navVerification',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
      badgeCount: stats.awaitingVerification,
    },
    {
      to: '/pending',
      labelKey: 'navPending',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      badgeCount: stats.pending,
    },
    {
      to: '/completed',
      labelKey: 'navCompleted',
      icon: <FileCheck2 className="w-4 h-4 shrink-0" />,
      badgeCount: stats.completed,
    },
    { to: '/records', labelKey: 'navRecords', icon: <Archive className="w-4 h-4 shrink-0" /> },
    { to: '/assistant', labelKey: 'navAssistant', icon: <Bot className="w-4 h-4 shrink-0" /> },
    { to: '/reports', labelKey: 'navReports', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { to: '/settings', labelKey: 'navSettings', icon: <Settings className="w-4 h-4 shrink-0" /> },
    { to: '/help', labelKey: 'navHelp', icon: <HelpCircle className="w-4 h-4 shrink-0" /> },
  ];

  const initials = preferences.officerProfile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[#0C2340] text-white border-r border-[#08192E] select-none">
      {/* Top-Left Government of Karnataka Logo + LEKHASETU Brand */}
      <div className="px-3.5 pt-3.5 pb-3 border-b border-white/15 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={KARNATAKA_LOGO_URL}
              alt="Government of Karnataka Logo"
              className="w-10 h-10 rounded-full bg-white p-0.5 object-contain shrink-0 border border-[#EAB308]/60"
            />
            {(!collapsed || isMobile) && (
              <div className="min-w-0 leading-tight">
                <div className="text-[11px] font-medium text-[#FDE047] truncate">
                  {pick('Government of Karnataka', 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ')}
                </div>
                <div className="font-display font-bold text-base tracking-tight text-white truncate">
                  LEKHASETU
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="p-1.5 rounded text-white/80 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
              title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
              className="p-1.5 rounded text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {(!collapsed || isMobile) && (
          <p className="mt-2.5 text-[11px] text-slate-300 truncate">
            {t('appTagline')}
          </p>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => {
              if (isMobile) onCloseMobile();
            }}
            title={collapsed && !isMobile ? t(item.labelKey) : undefined}
            className={({ isActive }) =>
              `flex items-center justify-between gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#184172] text-white border border-white/20'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
              }`
            }
          >
            <span className="flex items-center gap-2.5 min-w-0">
              {item.icon}
              {(!collapsed || isMobile) && (
                <span className="truncate">{t(item.labelKey)}</span>
              )}
            </span>
            {(!collapsed || isMobile) && typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-slate-200 shrink-0">
                {item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Officer Profile Footer */}
      <div className="p-3 border-t border-white/15 bg-[#091C34] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {!avatarFailed ? (
            <img
              src="/src/assets/images/officer_profile_avatar_1795616046589.jpg"
              alt={preferences.officerProfile.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-8 h-8 rounded object-cover border border-white/25 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-[#184172] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials || 'OF'}
            </div>
          )}
          {(!collapsed || isMobile) && (
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-semibold text-white truncate">
                {preferences.officerProfile.name}
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                {preferences.officerProfile.designation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 no-print ${
          collapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[82vw] h-full z-10">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
