import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Box, 
  ExternalLink 
} from 'lucide-react';
import { UserNotification, CargoBooking } from '../types';

interface NotificationCenterProps {
  notifications: UserNotification[];
  bookings: CargoBooking[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onUpdateBookingStatus?: (id: string, status: CargoBooking['status']) => void;
  canManage: boolean;
}

export default function NotificationCenter({
  notifications,
  bookings,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onUpdateBookingStatus,
  canManage,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Format date nicely
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      
      if (isNaN(diffMs)) return dateStr;
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'ទើបតែឥឡូវនេះ (Just now)';
      if (diffMins < 60) return `${diffMins} នាទីមុន (${diffMins}m ago)`;
      if (diffHours < 24) return `${diffHours} ម៉ោងមុន (${diffHours}h ago)`;
      return `${diffDays} ថ្ងៃមុន (${diffDays}d ago)`;
    } catch {
      return dateStr;
    }
  };

  // Helper to find associated booking status
  const getAssociatedBooking = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  };

  return (
    <div className="relative">
      {/* Bell Trigger Icon */}
      <button
        id="notification-bell-trigger"
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        title="សារជូនដំណឹង (Notifications)"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-bounce text-yellow-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-rose-600 rounded-full border border-slate-900 shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Portal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              id="notification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-50 transition-opacity"
            />

            {/* Sidebar Drawer Container */}
            <motion.div
              id="notification-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden text-left"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-950 p-2 rounded-lg border border-blue-900">
                    <Bell className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">មជ្ឈមណ្ឌលសារជូនដំណឹង</h2>
                    <p className="text-[10px] text-slate-400">Notification Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Action Toolbar */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold shrink-0">
                  <span className="text-slate-400 font-medium">
                    មានសារសរុប {notifications.length} ({unreadCount} មិនទាន់អាន)
                  </span>
                  <div className="flex gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllAsRead}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck className="h-3 w-3" />
                        អានទាំងអស់
                      </button>
                    )}
                    <button
                      onClick={onClearAll}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      សម្អាតទាំងអស់
                    </button>
                  </div>
                </div>
              )}

              {/* Scrollable Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/40">
                {notifications.length === 0 ? (
                  // Empty State Illustration
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                      <Bell className="h-8 w-8 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300">មិនមានសារជូនដំណឹងទេ</h3>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
                        រាល់សកម្មភាពកក់អីវ៉ាន់ថ្មីៗ និងការផ្លាស់ប្តូរស្ថានភាពការដឹកជញ្ជូននឹងត្រូវបានបង្ហាញនៅទីនេះ។
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const currentBooking = getAssociatedBooking(n.bookingId);
                    const bookingStatusInApp = currentBooking?.status || n.status;

                    return (
                      <div
                        key={n.id}
                        className={`p-3.5 rounded-xl border transition-all duration-200 relative ${
                          !n.isRead 
                            ? 'bg-slate-850 border-blue-800/60 shadow-[0_0_15px_rgba(59,130,246,0.06)]' 
                            : 'bg-slate-900/80 border-slate-800'
                        } border-l-4 ${
                          bookingStatusInApp === 'Completed'
                            ? 'border-l-emerald-500'
                            : bookingStatusInApp === 'Approved'
                            ? 'border-l-blue-500'
                            : bookingStatusInApp === 'Cancelled'
                            ? 'border-l-rose-500'
                            : 'border-l-amber-500'
                        }`}
                      >
                        {/* Status badge in top right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                            bookingStatusInApp === 'Completed'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                              : bookingStatusInApp === 'Approved'
                              ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                              : bookingStatusInApp === 'Cancelled'
                              ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                              : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                          }`}>
                            {bookingStatusInApp === 'Completed' ? 'បានបញ្ចប់' : bookingStatusInApp === 'Approved' ? 'បានអនុម័ត' : bookingStatusInApp === 'Cancelled' ? 'បានបដិសេធ' : 'រង់ចាំអនុម័ត'}
                          </span>
                        </div>

                        {/* Title and Timestamp */}
                        <div className="pr-16">
                          <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                            {bookingStatusInApp === 'Completed' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                            {bookingStatusInApp === 'Approved' && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                            {bookingStatusInApp === 'Cancelled' && <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                            {bookingStatusInApp === 'Pending' && <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-slate-500 block mt-1 font-semibold">
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>

                        {/* Message body */}
                        <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed font-medium">
                          {n.message}
                        </p>

                        {/* User Tag */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <Box className="h-3 w-3 text-slate-500" />
                            ការកក់ ID: <span className="text-slate-200 font-mono">#{n.bookingId}</span>
                          </span>
                          <span className="text-slate-400 font-medium">
                            សម្រាប់៖ <strong className="text-slate-200">{n.userName}</strong>
                          </span>
                        </div>

                        {/* Booking Details / Actions Drawer Panel Shortcut */}
                        <div className="mt-3 flex items-center justify-between gap-1">
                          {/* Left: General actions (Mark as read, delete) */}
                          <div className="flex gap-2">
                            {!n.isRead && (
                              <button
                                onClick={() => onMarkAsRead(n.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 rounded-md font-bold text-[9px] cursor-pointer transition-colors"
                              >
                                អានរួច (Read)
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteNotification(n.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                              title="លុបសារនេះ"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Right: ADMIN WORKFLOW CONTEXTUAL BUTTONS (Approve & Complete) */}
                          {canManage && onUpdateBookingStatus && currentBooking && (
                            <div className="flex gap-1.5">
                              {currentBooking.status === 'Pending' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(n.bookingId, 'Approved')}
                                  className="px-2.5 py-1 bg-blue-650 hover:bg-blue-600 text-white border border-blue-500/30 rounded-md font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                  title="អនុម័តភ្លាមៗពីទីនេះ"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                  អនុម័ត (Approve)
                                </button>
                              )}
                              {currentBooking.status === 'Approved' && (
                                <button
                                  onClick={() => alert('សូមទៅកាន់ផ្នែក "កក់អីវ៉ាន់ (Cargo Bookings)" ដើម្បីបញ្ចប់ការកក់នេះដោយភ្ជាប់ជាមួយការថតរូបភាព។ (Please go to "Cargo Bookings" tab to complete this booking with a completion photo.)')}
                                  className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-600 text-white border border-emerald-500/30 rounded-md font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                  title="សូមបញ្ចប់ការដឹកជញ្ជូនពីផ្នែកកក់អីវ៉ាន់ដើម្បីភ្ជាប់រូបភាព"
                                >
                                  <CheckCircle className="h-2.5 w-2.5" />
                                  បញ្ចប់ (Complete)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer info */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 text-center shrink-0">
                <p className="text-[9px] text-slate-500 font-semibold font-sans">
                  ប្រព័ន្ធគ្រប់គ្រងជើងឡាន &bull; Notification Hub
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
