'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Layers,
  Phone,
  Mail,
  Locate
} from 'lucide-react';

export default function VolunteerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [duties, setDuties] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);


  // 1. Fetch Volunteer Profile, Duties, and Notifications
  useEffect(() => {
    let activeUid = '';
    const user = auth?.currentUser;
    if (user) {
      activeUid = user.uid;
    } else {
      const stored = localStorage.getItem('aarambh_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          activeUid = session.uid;
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!activeUid) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    // Real-time subscription to Profile
    const unsubProfile = onSnapshot(doc(db, 'volunteers', activeUid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setError("Volunteer profile not found.");
      }
    }, (err) => {
      console.warn("Profile snapshot listener error:", err);
    });

    // Real-time subscription to Duties
    const dutiesQuery = query(
      collection(db, 'dutyAssignments'), 
      where('volunteerId', '==', activeUid)
    );
    const unsubDuties = onSnapshot(dutiesQuery, (snap) => {
      const parsedDuties = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDuties(parsedDuties);
      setLoading(false);
    }, (err) => {
      console.warn("Duties snapshot listener error:", err);
    });

    // Real-time subscription to Notifications (sorted in-memory to avoid custom index creation requirement)
    const notifQuery = query(
      collection(db, 'notifications'),
      where('volunteerId', '==', activeUid)
    );
    const unsubNotif = onSnapshot(notifQuery, (snap) => {
      const parsedNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort descending by timestamp
      parsedNotifs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setNotifications(parsedNotifs);
    }, (err) => {
      console.warn("Notifications snapshot listener error:", err);
    });

    return () => {
      unsubProfile();
      unsubDuties();
      unsubNotif();
    };
  }, []);


  // Sort all duties by date and time for the timeline
  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const dateDiff = a.dutyDate.localeCompare(b.dutyDate);
      if (dateDiff !== 0) return dateDiff;
      return a.timeFrom.localeCompare(b.timeFrom);
    });
  }, [duties]);

  // Handle marking single notification as read
  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true
      });
      const performer = profile?.email || profile?.name || profile?.uid || 'Volunteer';
      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction('VOLUNTEER_READ_NOTIFICATION', `notifications/${notifId}`, `Marked notification as read`, performer);
      } catch (err) {
        console.error("Failed to log notification read:", err);
      }
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  // Handle clearing all notifications
  const handleClearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        batch.delete(doc(db, 'notifications', notif.id));
      });
      await batch.commit();
      const performer = profile?.email || profile?.name || profile?.uid || 'Volunteer';
      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction('VOLUNTEER_CLEAR_NOTIFICATIONS', 'notifications', `Cleared all ${notifications.length} notifications`, performer);
      } catch (err) {
        console.error("Failed to log notifications clear:", err);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  // Formatting helpers
  const formatTime12hr = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${mStr} ${suffix}`;
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-1/3 bg-white border-2 border-brand-ink rounded-md animate-pulse shadow-[2px_2px_0px_0px_#030404]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-white border-4 border-brand-ink rounded-md animate-pulse shadow-[6px_6px_0px_0px_#030404]" />
            <div className="h-72 bg-white border-4 border-brand-ink rounded-md animate-pulse shadow-[6px_6px_0px_0px_#030404]" />
          </div>
          <div className="space-y-6">
            <div className="h-56 bg-white border-4 border-brand-ink rounded-md animate-pulse shadow-[6px_6px_0px_0px_#030404]" />
            <div className="h-64 bg-white border-4 border-brand-ink rounded-md animate-pulse shadow-[6px_6px_0px_0px_#030404]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-orange/15 border-4 border-brand-ink p-8 rounded-md shadow-[6px_6px_0px_0px_#030404] max-w-xl mx-auto mt-10">
        <div className="flex gap-4 items-center">
          <AlertCircle className="text-brand-orange shrink-0" size={32} />
          <div>
            <h2 className="font-adminHeading text-xl font-black uppercase text-brand-ink">Authentication Error</h2>
            <p className="text-xs uppercase font-bold text-admin-muted mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-adminBody">
      {/* Title Header */}
      <div className="flex justify-between items-start sm:items-center relative gap-4">
        <div>
          <h1 className="font-adminHeading text-3xl font-black uppercase tracking-tight text-brand-ink mb-1.5">
            Volunteer Dashboard
          </h1>
          <p className="text-admin-muted font-bold text-xs uppercase tracking-wider">
            Welcome back, {profile?.name || 'Volunteer'}
          </p>
        </div>

        {/* Floating Notification Bell */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 border-2 border-brand-ink rounded-md shadow-[2px_2px_0px_0px_#030404] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all relative cursor-pointer ${
              unreadCount > 0 ? 'bg-brand-orange text-white' : 'bg-white text-brand-ink hover:bg-brand-cloud'
            }`}
            title="Notifications"
          >
            <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-orange border-2 border-brand-ink rounded-full" />
            )}
          </button>

          {showNotifications && (
            <>
              {/* Click outside to close */}
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              
              {/* Notifications Dropdown */}
              <div className="absolute right-0 mt-2.5 w-80 bg-white border-4 border-brand-ink rounded-md shadow-[6px_6px_0px_0px_#030404] z-50 p-4 max-h-96 overflow-y-auto space-y-3">
                <div className="flex justify-between items-center border-b-2 border-brand-ink/10 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand-orange flex items-center gap-1.5">
                    <Bell size={13} className="text-brand-orange" />
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => {
                        handleClearAllNotifications();
                        setShowNotifications(false);
                      }}
                      className="text-[9px] font-black uppercase text-brand-orange hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {notifications.map((notif) => {
                    const dateStr = notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Now';
                    
                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          if (!notif.read) handleMarkNotificationRead(notif.id);
                        }}
                        className={`p-2.5 border-2 border-brand-ink rounded-md transition-colors relative cursor-pointer text-left ${
                          notif.read 
                            ? 'bg-white text-admin-muted border-brand-ink/20' 
                            : 'bg-brand-cloud text-brand-ink hover:bg-brand-cloud/80 shadow-[1.5px_1.5px_0px_0px_#030404]'
                        }`}
                      >
                        {!notif.read && (
                          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-orange rounded-full" />
                        )}
                        <h4 className="text-[11px] font-black uppercase tracking-wide pr-3">{notif.title}</h4>
                        <p className="text-[10px] font-bold mt-0.5 leading-relaxed text-brand-ink/80">{notif.message}</p>
                        <span className="text-[8px] font-black uppercase text-admin-muted/65 block mt-2 text-right">{dateStr}</span>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="py-6 text-center text-admin-muted">
                      <Bell size={20} className="mx-auto mb-2 text-admin-muted/20" />
                      <span className="text-[10px] font-black uppercase tracking-wider block text-brand-ink/50">No notifications</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-3xl space-y-8">
        
        {/* ASSIGNED DUTIES TIMELINE */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-orange mb-4 border-b-2 border-brand-ink/10 pb-1">
            Assigned Duties Timeline
          </h2>

          {sortedDuties.length > 0 ? (
            <div className="relative border-l-4 border-brand-ink ml-4 pl-8 space-y-8">
              {sortedDuties.map((duty) => {
                const isCompleted = duty.status === 'completed';
                const isActive = duty.status === 'active';
                const isUpcoming = duty.status === 'upcoming';
                
                return (
                  <div key={duty.id} className="relative">
                    {/* Timeline node marker */}
                    <span className={`absolute -left-[42px] top-1.5 w-6 h-6 border-4 border-brand-ink rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_#030404] ${
                      isCompleted ? 'bg-brand-orange' : isActive ? 'bg-brand-blue' : 'bg-brand-orange'
                    }`}>
                      <div className="w-1.5 h-1.5 bg-brand-ink rounded-full" />
                    </span>
                    
                    {/* Duty Card */}
                    <div className="bg-white border-4 border-brand-ink p-5 rounded-md shadow-[4px_4px_0px_0px_#030404] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#030404]">
                      <div className="flex justify-between items-start gap-4 flex-wrap mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
                            {formatDateFriendly(duty.dutyDate)}
                          </span>
                          {duty.eventTitle && (
                            <div className="text-[9px] font-black uppercase tracking-widest text-brand-blue mt-0.5">
                              Event: {duty.eventTitle}
                            </div>
                          )}
                          <h3 className="text-base font-black uppercase tracking-wide text-brand-ink flex items-center gap-1.5 mt-1">
                            <MapPin size={14} className="text-brand-orange" />
                            {duty.venue}
                          </h3>
                        </div>
                        <span className={`inline-block px-2.5 py-1 border-2 border-brand-ink rounded-md text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#030404] ${
                          isCompleted
                            ? 'bg-brand-orange/15 text-brand-orange'
                            : isActive
                            ? 'bg-brand-blue/15 text-brand-blue'
                            : 'bg-brand-orange/15 text-brand-orange'
                        }`}>
                          {duty.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-black uppercase text-admin-muted tracking-wider mb-3">
                        <Clock size={12} className="text-brand-blue" />
                        <span>{formatTime12hr(duty.timeFrom)} - {formatTime12hr(duty.timeTo)}</span>
                      </div>

                      {duty.notes && (
                        <p className="bg-brand-cloud/45 border-2 border-brand-ink border-dashed p-3 rounded-md text-xs font-bold text-brand-ink/90 leading-relaxed">
                          {duty.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border-4 border-brand-ink p-8 rounded-md text-center text-admin-muted shadow-[4px_4px_0px_0px_#030404]">
              <Clock className="mx-auto mb-2 text-admin-muted/30" size={32} />
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink/65">No Duties Found</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted/75 mt-0.5">You have no duties assigned to your schedule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
