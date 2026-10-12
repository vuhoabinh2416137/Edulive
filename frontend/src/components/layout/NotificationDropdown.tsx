import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { 
  Bell, Check, ExternalLink, BookOpen, 
  HelpCircle, MessageSquare, Video, Info 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { NotificationItem } from '../../types/notification';

export const NotificationDropdown: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const [list, count] = await Promise.all([
        notificationService.getRecentNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  // Kết nối WebSocket nhận thông báo Real-time
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      (window.location.host.includes(':') ? window.location.hostname + ':8088' : window.location.host) + '/ws';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/user/${user.id}`, (frame) => {
        try {
          const newNotif: NotificationItem = JSON.parse(frame.body);
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          setHasNew(true);
          setTimeout(() => setHasNew(false), 3000);
        } catch (e) {
          console.error('Lỗi parse websocket notification:', e);
        }
      });
    };

    client.activate();

    return () => {
      if (client.active) client.deactivate();
    };
  }, [isAuthenticated, user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id).catch(console.error);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ENROLLMENT':
        return <BookOpen size={16} className="text-blue-500" />;
      case 'QUIZ':
        return <HelpCircle size={16} className="text-amber-500" />;
      case 'DISCUSSION':
        return <MessageSquare size={16} className="text-emerald-500" />;
      case 'LIVE_ROOM':
        return <Video size={16} className="text-rose-500" />;
      default:
        return <Info size={16} className="text-indigo-500" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
          hasNew ? 'animate-bounce' : ''
        }`}
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 transition-all">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                Thông báo của bạn
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <Check size={12} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Bạn chưa có thông báo nào.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                    !item.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-xs truncate ${!item.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, item.id)}
                          className="text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 ml-1"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.link && (
                        <span className="flex items-center space-x-0.5 text-indigo-500">
                          <span>Xem ngay</span>
                          <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
