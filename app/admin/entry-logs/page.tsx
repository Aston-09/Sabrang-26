'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { normalizeEventKey } from '../../../lib/couponHelper';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Download, 
  Ticket, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface EntryLogItem {
  id: string;
  ticketId?: string;
  registrationId?: string;
  eventId?: string;
  eventTitle?: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeeRoll?: string;
  entryTime?: any;
  scannedBy?: string;
  scannerId?: string;
  status?: string;
  createdAt?: string;
}

const DEFAULT_EVENTS = [
  'PANACHE - RAMPWALK',
  'BANDJAM - BATTLE OF BANDS',
  'STEP UP - SOLO DANCE',
  'SYNC - GROUP DANCE',
  'ECHOES OF NOOR - SUFI NIGHT',
  'VERSEVAAD - SLAM POETRY',
  'VALORANT SHOWDOWN',
  'GENERAL FEST ENTRY'
];

export default function EventEntryLogsPage() {
  const [entryLogs, setEntryLogs] = useState<EntryLogItem[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // 1. Fetch live Entry Logs from Firestore
  useEffect(() => {
    const unsubLogs = onSnapshot(
      query(collection(db, 'entryLogs'), orderBy('entryTime', 'desc'), limit(2000)),
      (snap) => {
        const fetched = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as EntryLogItem[];
        setEntryLogs(fetched);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubLogs();
  }, []);

  // 2. Fetch live Registrations for accurate Registered / Entered / Not Entered stats
  useEffect(() => {
    const unsubRegs = onSnapshot(collection(db, 'registrations'), (snap) => {
      const regs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllRegistrations(regs);

      // Dynamically extract any event names from registrations
      const foundEvents = new Set<string>(DEFAULT_EVENTS);
      regs.forEach((r: any) => {
        const evt = r.eventName || r.eventTitle || r.event;
        if (evt && typeof evt === 'string' && evt.trim()) {
          foundEvents.add(evt.trim().toUpperCase());
        }
      });
      setAvailableEvents(Array.from(foundEvents));
    }, () => {});

    return () => unsubRegs();
  }, []);

  // Compute Event Entry Statistics
  const eventStats = useMemo(() => {
    let relevantRegs = allRegistrations;
    let relevantLogs = entryLogs;

    if (selectedEvent !== 'all') {
      const targetKey = normalizeEventKey(selectedEvent);
      relevantRegs = allRegistrations.filter(r => {
        const evtName = r.eventName || r.eventTitle || r.event || '';
        const regKey = normalizeEventKey(evtName);
        return regKey.includes(targetKey) || targetKey.includes(regKey);
      });

      relevantLogs = entryLogs.filter(l => {
        const evtName = l.eventTitle || l.eventId || '';
        const logKey = normalizeEventKey(evtName);
        return logKey.includes(targetKey) || targetKey.includes(logKey);
      });
    }

    const registered = relevantRegs.length || relevantLogs.length;
    // Count distinct attendees who entered
    const enteredSet = new Set<string>();
    relevantLogs.forEach(l => {
      if (l.registrationId) enteredSet.add(l.registrationId);
      else if (l.ticketId) enteredSet.add(l.ticketId);
      else if (l.id) enteredSet.add(l.id);
    });

    const entered = Math.max(enteredSet.size, relevantRegs.filter(r => r.hasEntered || r.attended).length);
    const notEntered = Math.max(0, registered - entered);

    return {
      registered,
      entered,
      notEntered,
      attendanceRate: registered > 0 ? Math.round((entered / registered) * 100) : 0,
    };
  }, [allRegistrations, entryLogs, selectedEvent]);

  // Filter Entry Logs dynamically
  const filteredLogs = useMemo(() => {
    return entryLogs.filter((log) => {
      // 1. Event filter
      if (selectedEvent !== 'all') {
        const targetKey = normalizeEventKey(selectedEvent);
        const logKey = normalizeEventKey(log.eventTitle || log.eventId || '');
        const isMatch = logKey.includes(targetKey) || targetKey.includes(logKey);
        if (!isMatch) return false;
      }

      // 2. Search Query (matches name, ticketId, regId, rollNumber, email, staff)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (log.attendeeName || '').toLowerCase().includes(q) ||
          (log.ticketId || '').toLowerCase().includes(q) ||
          (log.registrationId || '').toLowerCase().includes(q) ||
          (log.attendeeRoll || '').toLowerCase().includes(q) ||
          (log.attendeeEmail || '').toLowerCase().includes(q) ||
          (log.scannedBy || '').toLowerCase().includes(q) ||
          (log.eventTitle || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 3. Date Range Filter
      const logMillis = log.entryTime?.toMillis 
        ? log.entryTime.toMillis() 
        : (log.createdAt ? new Date(log.createdAt).getTime() : 0);

      if (filterDateFrom && logMillis < new Date(filterDateFrom).getTime()) {
        return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logMillis > toDate.getTime()) return false;
      }

      return true;
    });
  }, [entryLogs, selectedEvent, searchQuery, filterDateFrom, filterDateTo]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEvent, searchQuery, filterDateFrom, filterDateTo]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportExcel = async () => {
    if (filteredLogs.length === 0) return alert('No entry logs to export.');
    const headers = ['S.No', 'Attendee Name', 'Roll Number', 'Email', 'Event', 'Ticket ID', 'Registration ID', 'Entry Time', 'Scanned By'];
    const rows = filteredLogs.map((l, index) => {
      const timeStr = l.entryTime?.toDate ? l.entryTime.toDate().toLocaleString('en-IN') : (l.createdAt || 'N/A');
      return [
        index + 1,
        l.attendeeName || 'N/A',
        l.attendeeRoll || 'N/A',
        l.attendeeEmail || 'N/A',
        l.eventTitle || 'General Fest Entry',
        l.ticketId || 'N/A',
        l.registrationId || 'N/A',
        timeStr,
        l.scannedBy || 'Staff',
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_event_entry_logs_${selectedEvent === 'all' ? 'all_events' : selectedEvent.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`,
      sheetName: 'Entry Logs',
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-8 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Event Entry Logs</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
            Real-time feed of attendees who have entered each event
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer"
          >
            <Download size={15} /> Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Entry Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registered */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{eventStats.registered.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedEvent === 'all' ? 'Total festival registrations' : `Registered for ${selectedEvent}`}
          </p>
        </div>

        {/* Entered */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entered (Checked-In)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{eventStats.entered.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {eventStats.attendanceRate}% turn-out rate
          </p>
        </div>

        {/* Not Entered */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Not Entered</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <UserX size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{eventStats.notEntered.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Formula: Registered - Entered</p>
        </div>

        {/* Active Filter Scope */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selected Event</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 truncate" title={selectedEvent}>
            {selectedEvent === 'all' ? 'All Events (Global)' : selectedEvent}
          </p>
          <p className="text-[11px] text-purple-600 mt-1 font-semibold">
            {filteredLogs.length} verified entry records
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ticket ID, roll..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
            />
          </div>

          {/* Event Filter Dropdown */}
          <div>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-400 focus:bg-white"
            >
              <option value="all">All Events (Global)</option>
              {availableEvents.map((evt) => (
                <option key={evt} value={evt}>{evt}</option>
              ))}
            </select>
          </div>

          {/* Date Range Picker From */}
          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-400 focus:bg-white"
              title="From Date"
            />
          </div>

          {/* Date Range Picker To */}
          <div>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-400 focus:bg-white"
              title="To Date"
            />
          </div>
        </div>

        {(searchQuery || selectedEvent !== 'all' || filterDateFrom || filterDateTo) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong>{filteredLogs.length}</strong> entered attendees
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEvent('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="text-purple-600 font-bold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4">Attendee</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Entry Time</th>
                  <th className="p-4 text-right">Scanned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedLogs.map((log, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const entryDate = log.entryTime?.toDate 
                    ? log.entryTime.toDate() 
                    : (log.createdAt ? new Date(log.createdAt) : new Date());

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-medium">
                      <td className="p-4 text-center text-slate-400 font-bold">
                        {globalIdx}
                      </td>

                      {/* Attendee */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-sm">
                            {log.attendeeName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {log.attendeeRoll && log.attendeeRoll !== 'N/A' ? log.attendeeRoll : (log.attendeeEmail || 'N/A')}
                          </p>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-bold text-xs">
                          <Calendar size={13} className="text-purple-600" />
                          <span>{log.eventTitle || 'General Fest Entry'}</span>
                        </span>
                      </td>

                      {/* Ticket ID */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                          <Ticket size={14} className="text-slate-400" />
                          <span>{log.ticketId || log.registrationId || 'TKT-VALID'}</span>
                        </div>
                      </td>

                      {/* Entry Time */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {entryDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </td>

                      {/* Scanned By */}
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck size={13} />
                          <span>{log.scannedBy || log.scannerId || 'Staff Member'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <UserCheck size={28} className="text-slate-300" />
                        <p>No entered attendees found for the selected event filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLogs.length} total entries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
