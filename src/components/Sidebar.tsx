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

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { t, pick } = useLanguage();
  const { preferences, updatePreferences, stats } = useDocuments();
  const collapsed = preferences.sidebarCollapsed;

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

  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[#123254] text-white select-none">
      {/* Official Karnataka Government Top Corner Logo */}
      <div className="h-16 px-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/karnataka-emblem.svg"
            alt="Government of Karnataka Emblem"
            className="w-9 h-9 shrink-0"
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0 leading-tight">
              <div className="text-[10px] font-semibold text-amber-300 tracking-wide truncate">
                {pick('GOVT. OF KARNATAKA', 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ')}
              </div>
              <div className="font-display font-bold text-sm tracking-tight text-white truncate">
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
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
            title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
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
              `flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="flex items-center gap-3 min-w-0">
              {item.icon}
              {(!collapsed || isMobile) && (
                <span className="truncate">{t(item.labelKey)}</span>
              )}
            </span>
            {(!collapsed || isMobile) && typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-amber-200 shrink-0">
                {item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 border-r border-slate-200 no-print ${
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
