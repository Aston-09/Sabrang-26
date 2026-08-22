'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Info,
  AlertCircle
} from 'lucide-react';

const SCHEDULE_DATES = [
  { value: '2026-07-12', title: 'Prep', dateDisplay: 'JULY 12' },
  { value: '2026-07-13', title: 'Setup', dateDisplay: 'JULY 13' },
  { value: '2026-07-14', title: 'Day 01', dateDisplay: 'JULY 14' },
  { value: '2026-07-15', title: 'Day 02', dateDisplay: 'JULY 15' },
  { value: '2026-07-16', title: 'Day 03', dateDisplay: 'JULY 16' },
  { value: '2026-07-17', title: 'Day 04', dateDisplay: 'JULY 17' },
  { value: '2026-07-18', title: 'Day 05', dateDisplay: 'JULY 18' },
  { value: '2026-07-19', title: 'Day 06', dateDisplay: 'JULY 19' },
  { value: '2026-07-20', title: 'Day 07', dateDisplay: 'JULY 20' },
  { value: '2026-07-21', title: 'Day 08', dateDisplay: 'JULY 21' },
];

export default function VolunteerSchedule() {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected date state defaulting to today if within dates, else Day 01
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    const validDates = SCHEDULE_DATES.map(d => d.value);
    return validDates.includes(today) ? today : '2026-07-14';
  });

  // 1. Fetch Duties Realtime
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

    const dutiesQuery = query(
      collection(db, 'dutyAssignments'), 
      where('volunteerId', '==', activeUid)
    );

    const unsubscribe = onSnapshot(dutiesQuery, (snap) => {
      setDuties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to fetch schedule data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Map duties to a date lookup dictionary
  const dutiesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    duties.forEach(duty => {
      const date = duty.dutyDate;
      if (!map[date]) map[date] = [];
      map[date].push(duty);
    });
    return map;
  }, [duties]);

  // Selected date duties
  const selectedDuties = useMemo(() => {
    return dutiesByDate[selectedDateStr] || [];
  }, [dutiesByDate, selectedDateStr]);

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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-28 h-24 bg-white border-4 border-brand-ink rounded-xl animate-pulse shadow-[4px_4px_0px_0px_#030404] shrink-0" />
          ))}
        </div>
        <div className="h-64 max-w-3xl bg-white border-4 border-brand-ink rounded-md animate-pulse shadow-[6px_6px_0px_0px_#030404]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-orange/15 border-4 border-brand-ink p-8 rounded-md shadow-[6px_6px_0px_0px_#030404] max-w-xl mx-auto mt-10">
        <div className="flex gap-4 items-center">
          <AlertCircle className="text-brand-orange shrink-0" size={32} />
          <div>
            <h2 className="font-adminHeading text-xl font-black uppercase text-brand-ink">Schedule Error</h2>
            <p className="text-xs uppercase font-bold text-admin-muted mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-adminBody">
      {/* Title Header */}
      <div>
        <h1 className="font-adminHeading text-3xl font-black uppercase tracking-tight text-brand-ink mb-1.5">
          My Schedule
        </h1>
        <p className="text-admin-muted font-bold text-xs uppercase tracking-wider">
          Tap on a date to view your assigned duties
        </p>
      </div>

      {/* Horizontal Scrollable Date Selector */}
      <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex flex-nowrap gap-4 min-w-max pb-2">
          {SCHEDULE_DATES.map((dateObj) => {
            const isSelected = dateObj.value === selectedDateStr;
            const hasDuty = dutiesByDate[dateObj.value] && dutiesByDate[dateObj.value].length > 0;
            return (
              <button
                key={dateObj.value}
                onClick={() => setSelectedDateStr(dateObj.value)}
                className={`flex-shrink-0 w-28 h-24 border-4 border-brand-ink rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand-orange text-white shadow-[4px_4px_0px_0px_#030404] -translate-x-[2px] -translate-y-[2px]'
                    : 'bg-white text-brand-ink hover:bg-brand-cloud shadow-[4px_4px_0px_0px_#030404] hover:-translate-x-[1px] hover:-translate-y-[1px]'
                }`}
              >
                <span className="text-sm font-black uppercase tracking-wide mb-1">{dateObj.title}</span>
                <span className={`text-[10px] font-bold tracking-wider ${isSelected ? 'text-white/80' : 'text-admin-muted'}`}>
                  {dateObj.dateDisplay}
                </span>
                {hasDuty && (
                  <span className={`w-2.5 h-2.5 rounded-full border border-brand-ink mt-2 ${
                    isSelected ? 'bg-white' : 'bg-brand-orange animate-pulse'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="max-w-3xl bg-white border-4 border-brand-ink p-6 rounded-md shadow-[6px_6px_0px_0px_#030404]">
        <h2 className="text-xs font-black uppercase tracking-widest text-brand-orange mb-6 border-b-2 border-brand-ink/10 pb-2 flex items-center gap-1.5">
          <CalendarIcon size={14} />
          Schedule Details — {formatDateFriendly(selectedDateStr)}
        </h2>

        <div className="space-y-4">
          {selectedDuties.length > 0 ? (
            selectedDuties.map((duty) => (
              <div 
                key={duty.id} 
                className="bg-brand-cloud/45 border-2 border-brand-ink p-5 rounded-md shadow-[2px_2px_0px_0px_#030404] space-y-3"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="bg-white border-2 border-brand-ink px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#030404]">
                    Status: {duty.status}
                  </span>
                </div>

                {duty.eventTitle && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-blue">
                    Event: {duty.eventTitle}
                  </div>
                )}

                <h3 className="font-black uppercase text-base text-brand-ink flex items-center gap-1.5">
                  <MapPin size={16} className="text-brand-orange shrink-0" />
                  {duty.venue}
                </h3>

                <div className="flex items-center gap-1.5 text-xs font-black text-admin-muted uppercase tracking-wider pt-1">
                  <Clock size={13} className="text-brand-blue shrink-0" />
                  <span>{formatTime12hr(duty.timeFrom)} - {formatTime12hr(duty.timeTo)}</span>
                </div>

                {duty.notes && (
                  <div className="mt-3 bg-white border-2 border-brand-ink border-dashed p-3 rounded-md text-xs font-bold text-brand-ink/80 leading-relaxed flex gap-2 items-start">
                    <Info size={16} className="text-brand-blue shrink-0 mt-0.5" />
                    <span>{duty.notes}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-admin-muted border-2 border-dashed border-brand-ink/10 rounded-md">
              <CalendarIcon size={36} className="mx-auto mb-3 text-admin-muted/30" />
              <span className="text-sm font-black uppercase tracking-wider block text-brand-ink/75">
                No Duties Assigned
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted/60 mt-1">
                You are free on this date!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
