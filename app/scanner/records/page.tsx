'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AlertCircle, Search, Check, X } from 'lucide-react';
import { useScannerSession } from '../../../components/scanner/ScannerSessionProvider';

export default function ScanRecordsView() {
  const { scannerAccount } = useScannerSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Real-time Subscription to Scan Logs for active operator
  useEffect(() => {
    if (!db || !scannerAccount?.scannerId) return;

    const q = query(
      collection(db, 'scanLogs'),
      where('scannerId', '==', scannerAccount.scannerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in-memory to avoid needing firestore index files
      parsedLogs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setLogs(parsedLogs);
    }, (err) => {
      console.warn("Scanner records snapshot listener error:", err);
    });

    return () => unsubscribe();
  }, [scannerAccount?.scannerId]);

  // 2. Compute Stats
  const stats = useMemo(() => {
    const scopedLogs = logs.filter(l => l.scannerId === scannerAccount?.scannerId);
    const total = scopedLogs.length;
    const approved = scopedLogs.filter(l => l.result === 'accepted').length;
    const declined = scopedLogs.filter(l => l.result === 'declined').length;
    return { total, approved, declined };
  }, [logs, scannerAccount?.scannerId]);

  // 3. Filter Logs based on Search Query
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Scoping security check: only show logs matching the active scanner's ID
      if (log.scannerId !== scannerAccount?.scannerId) {
        return false;
      }
      const nameMatch = log.attendeeName?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = log.registrationID?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || idMatch;
    });
  }, [logs, searchQuery, scannerAccount?.scannerId]);

  // Format timestamp helper
  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 select-none font-adminBody animate-in fade-in duration-200">
      
      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Scans Card */}
        <div className="bg-white border-4 border-brand-ink p-5 rounded-md shadow-[4px_4px_0px_0px_#030404]">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-admin-muted mb-2">Total Tickets Scanned</h3>
          <p className="font-adminHeading text-3xl font-black text-brand-ink">{stats.total}</p>
        </div>

        {/* Total Approved Card */}
        <div className="bg-white border-4 border-brand-ink p-5 rounded-md shadow-[4px_4px_0px_0px_#030404]">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-green-600 mb-2">Approved Check-ins</h3>
          <p className="font-adminHeading text-3xl font-black text-green-600">{stats.approved}</p>
        </div>

        {/* Total Declined Card */}
        <div className="bg-white border-4 border-brand-ink p-5 rounded-md shadow-[4px_4px_0px_0px_#030404]">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-orange mb-2">Declined Entries</h3>
          <p className="font-adminHeading text-3xl font-black text-brand-orange">{stats.declined}</p>
        </div>
      </div>

      {/* Filter and Records Panel */}
      <div className="bg-white border-4 border-brand-ink p-6 rounded-md shadow-[6px_6px_0px_0px_#030404] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-ink/10 pb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-orange">
            Processed Ticket Records
          </h2>

          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-cloud/45 border-2 border-brand-ink rounded-md px-3.5 py-1.5 pl-9 text-xs font-bold text-brand-ink placeholder:text-admin-muted/65 focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_#030404]"
            />
            <Search className="absolute left-3 top-2 text-admin-muted/70" size={14} />
          </div>
        </div>

        {/* Records Log Table/List */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-bold">
            <thead>
              <tr className="border-b-2 border-brand-ink uppercase text-[10px] text-admin-muted tracking-wider">
                <th className="pb-3 w-12 text-center border-r-2 border-brand-ink/10">S.No</th>
                <th className="pb-3 pr-4 font-black">Attendee Info</th>
                <th className="pb-3 px-4 font-black">Registration ID</th>
                <th className="pb-3 px-4 font-black">Result</th>
                <th className="pb-3 px-4 font-black">Verified At</th>
                <th className="pb-3 pl-4 font-black text-right">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink/5">
              {filteredLogs.map((log, idx) => {
                const isAccepted = log.result === 'accepted';
                
                return (
                  <tr key={log.id} className="group hover:bg-brand-cloud/20 transition-colors">
                    <td className="py-3.5 text-center border-r-2 border-brand-ink/10 text-admin-muted font-black">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="font-black text-brand-ink text-sm uppercase">{log.attendeeName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-brand-ink/75 uppercase font-black">{log.registrationID}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase border px-2 py-0.5 rounded-sm shadow-[1.5px_1.5px_0px_0px_#030404] ${
                        isAccepted 
                          ? 'text-green-600 border-green-600/30 bg-green-50 shadow-green-600/40' 
                          : 'text-brand-orange border-brand-orange/30 bg-brand-orange/5 shadow-brand-orange/40'
                      }`}>
                        {isAccepted ? <Check size={10} className="stroke-[3]" /> : <X size={10} className="stroke-[3]" />}
                        {isAccepted ? 'Approved' : 'Declined'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-admin-muted uppercase tracking-wide">{formatTimestamp(log.timestamp)}</td>
                    <td className="py-3.5 pl-4 text-right text-brand-ink font-mono text-[10px] uppercase">
                      {log.volunteerName || 'Operator'}
                      <span className="block text-[8px] text-admin-muted font-bold mt-0.5">ID: {log.scannerId}</span>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-admin-muted">
                    <AlertCircle className="mx-auto mb-2 text-admin-muted/30" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-wider block text-brand-ink/50">No verification records found</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider block text-admin-muted/60 mt-1">
                      {searchQuery ? 'Try refining your search keyword' : 'Check-in scanning logs will show up here'}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
