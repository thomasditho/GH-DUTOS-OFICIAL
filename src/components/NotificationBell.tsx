import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { fetchApi } from '../services/api';
import { cn } from '../lib/utils';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await fetchApi('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#0A192F] hover:bg-slate-100 transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[#0A192F] uppercase tracking-widest">Notificações</h3>
              <span className="text-[8px] font-bold text-[#9CA3AF] uppercase">{unreadCount} não lidas</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 border-b border-[#F3F4F6] hover:bg-slate-50 transition-colors",
                      !n.read && "bg-blue-50/30"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-[11px] font-black text-[#0A192F] uppercase tracking-tight">{n.title}</h4>
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-1 text-[#3A8D8F] hover:bg-emerald-100 transition-all"
                          title="Marcar como lida"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[8px] text-[#9CA3AF] mt-2 block font-bold uppercase">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
