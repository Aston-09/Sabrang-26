'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Download, Filter, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SystemErrors() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    // Synchronize latest 500 error logs in realtime
    const q = query(
      collection(db, 'systemErrors'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore systemErrors stream failed:", error);
      // Fallback query to auditLogs for legacy compatibility
      const fallbackQuery = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      onSnapshot(fallbackQuery, (snap) => {
        const errs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((l: any) => l.action === 'SYSTEM_ERROR' || l.action === 'ERROR');
        setLogs(errs);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter date range
      if (log.timestamp && log.timestamp.toDate) {
        const logDate = log.timestamp.toDate();
        if (filterDateFrom) {
          const from = new Date(filterDateFrom);
          from.setHours(0, 0, 0, 0);
          if (logDate < from) return false;
        }
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) return false;
        }
      }
      return true;
    });
  }, [logs, filterDateFrom, filterDateTo]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDateFrom, filterDateTo]);

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportExcel = async () => {
    if (filteredLogs.length === 0) return alert('No system errors to export.');
    const headers = ['S.No', 'Timestamp', 'Target Module', 'Component / Performer', 'Error Details'];
    const rows = filteredLogs.map((log, index) => {
      const timeStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('en-IN') : 'N/A';
      return [
        index + 1,
        timeStr,
        log.targetEntity || 'System',
        log.performedBy || 'System Error',
        log.details || 'N/A'
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_system_errors_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'System Errors',
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Errors</h1>
          <p className="text-sm text-slate-500 mt-1">Chronological record of application errors and backend exceptions</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={filteredLogs.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-40"
        >
          <Download size={14} />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex items-center justify-between text-slate-800 text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span>Search & Filter Errors</span>
          </div>
          <span className="text-xs text-purple-600 font-bold">
            {isMobileFiltersOpen ? 'Hide' : 'Show'}
          </span>
        </button>
      </div>

      {/* Filter Card */}
      <div className={`grid transition-all duration-200 md:grid-rows-[1fr] md:opacity-100 ${isMobileFiltersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-slate-700 w-full lg:w-auto mb-1">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle size={15} />
              </div>
              <span className="text-xs font-semibold">Filter Errors</span>
            </div>

            {/* Date From */}
            <div className="flex-grow min-w-[140px]">
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">From Date</label>
              <input 
                type="date" 
                value={filterDateFrom} 
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Date To */}
            <div className="flex-grow min-w-[140px]">
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">To Date</label>
              <input 
                type="date" 
                value={filterDateTo} 
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Clear buttons */}
            <button 
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Component / Performer</th>
                  <th className="p-4">Target Node</th>
                  <th className="p-4">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors text-slate-700">
                    <td className="p-4 text-center text-slate-400 font-mono font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {log.timestamp && log.timestamp.toDate ? (
                        <div>
                          <div className="font-semibold text-slate-900">{log.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {log.timestamp.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{log.performedBy || 'System'}</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">{log.targetEntity || 'N/A'}</td>
                    <td className="p-4 whitespace-normal min-w-[280px] max-w-lg text-rose-700 font-mono text-[11px] leading-relaxed bg-rose-50/40 rounded">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium text-xs">
                      No system error logs recorded. System healthy!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLogs.length} entries)
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
