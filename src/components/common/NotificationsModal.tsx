import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Clock, Calendar, FileText, Pill } from 'lucide-react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-sky-600" />;
      case 'prescription':
        return <Pill className="w-4 h-4 text-teal-600" />;
      case 'record':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">Notifications</h3>
          </div>
          <div className="flex items-center gap-3">
            {notifications.some(n => n.is_read === 0) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No notifications</p>
              <p className="text-xs text-slate-500 mt-1">You are all caught up on hospital updates.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg transition-colors flex items-start gap-3 ${
                  n.is_read ? 'bg-white opacity-80' : 'bg-teal-50/50'
                }`}
              >
                <div className="mt-0.5 p-1.5 bg-white rounded-md border border-slate-200 shadow-xs shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[11px] font-mono tabular-nums text-slate-600 shrink-0">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {n.is_read === 0 && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-900"
                      >
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                    {n.link && onNavigate && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigate(n.link!);
                        }}
                        className="text-[11px] font-medium text-sky-700 hover:text-sky-900 underline"
                      >
                        View details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
