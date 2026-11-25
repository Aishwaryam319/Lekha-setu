import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BellOff, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-300 rounded-md shadow-md z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-300 bg-[#F1F5F9]">
        <h3 className="text-sm font-semibold text-slate-900">{t('notifications')}</h3>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-[#173B63] hover:underline cursor-pointer"
              >
                {t('markAllRead')}
              </button>
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
              >
                {t('clearAll')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500 flex flex-col items-center gap-2">
            <BellOff className="w-6 h-6 text-slate-400" />
            <p className="text-sm">{t('noNotifications')}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                markAsRead(n.id);
                if (n.targetRoute) {
                  navigate(n.targetRoute);
                }
                onClose();
              }}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                n.read ? 'bg-white' : 'bg-blue-50/40'
              }`}
            >
              {getIcon(n.type)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                    {language === 'kn' ? n.titleKn : n.titleEn}
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                  {language === 'kn' ? n.messageKn : n.messageEn}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
