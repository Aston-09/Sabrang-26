'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { normalizeReferralCode } from '../../../lib/referralClientHelper';
import { 
  Users, 
  UserCheck, 
  Search, 
  Download, 
  Award, 
  Share2, 
  Calendar, 
  TrendingUp,
  Tag
} from 'lucide-react';

interface ReferralRecord {
  id: string;
  referrerId?: string;
  referrerRoll: string;
  referrerName?: string;
  referredUserId?: string;
  referredRoll: string;
  referredName?: string;
  referralCode: string;
  createdAt?: any;
  timestamp?: string;
}

export default function ReferralsAdminPage() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'leaderboard'>('logs');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // 1. Fetch live referrals stream from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'referrals'), orderBy('createdAt', 'desc'), limit(1500)),
      (snap) => {
        const fetched = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as ReferralRecord[];
        setReferrals(fetched);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Compute Aggregates & Leaderboard
  const { totalReferred, activeReferrersCount, topReferrer, leaderboard } = useMemo(() => {
    const countsMap = new Map<string, {
      referrerRoll: string;
      referrerName: string;
      referralCode: string;
      count: number;
    }>();

    referrals.forEach(ref => {
      const code = normalizeReferralCode(ref.referralCode || ref.referrerRoll);
      if (!code) return;

      const existing = countsMap.get(code) || {
        referrerRoll: (ref.referrerRoll || code).toUpperCase(),
        referrerName: ref.referrerName || 'Participant',
        referralCode: code, // strict lowercase
        count: 0,
      };

      existing.count += 1;
      countsMap.set(code, existing);
    });

    const sortedLeaderboard = Array.from(countsMap.values()).sort((a, b) => b.count - a.count);
    const top = sortedLeaderboard.length > 0 ? sortedLeaderboard[0] : null;

    return {
      totalReferred: referrals.length,
      activeReferrersCount: countsMap.size,
      topReferrer: top,
      leaderboard: sortedLeaderboard,
    };
  }, [referrals]);

  // Filtered Referral Records
  const filteredReferrals = useMemo(() => {
    if (!searchQuery.trim()) return referrals;
    const q = searchQuery.toLowerCase().trim();

    return referrals.filter(r => 
      (r.referrerRoll || '').toLowerCase().includes(q) ||
      (r.referrerName || '').toLowerCase().includes(q) ||
      (r.referredRoll || '').toLowerCase().includes(q) ||
      (r.referredName || '').toLowerCase().includes(q) ||
      (r.referralCode || '').toLowerCase().includes(q)
    );
  }, [referrals, searchQuery]);

  // Filtered Leaderboard
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase().trim();

    return leaderboard.filter(l => 
      l.referrerRoll.toLowerCase().includes(q) ||
      l.referrerName.toLowerCase().includes(q) ||
      l.referralCode.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReferrals.slice(start, start + itemsPerPage);
  }, [filteredReferrals, currentPage]);

  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  const exportExcel = async () => {
    if (referrals.length === 0) return alert('No referral records to export.');

    const headers = ['S.No', 'Referrer Roll', 'Referrer Name', 'Referred Roll', 'Referred Name', 'Referral Code (Lowercase)', 'Date'];
    const rows = referrals.map((r, index) => {
      const dateStr = r.createdAt?.toDate 
        ? r.createdAt.toDate().toLocaleDateString('en-IN') 
        : (r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-IN') : 'N/A');

      return [
        index + 1,
        (r.referrerRoll || 'N/A').toUpperCase(),
        r.referrerName || 'Participant',
        (r.referredRoll || 'N/A').toUpperCase(),
        r.referredName || 'Participant',
        normalizeReferralCode(r.referralCode || r.referrerRoll),
        dateStr,
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_referral_tracking_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Referrals',
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-8 text-slate-800 font-sans">
      {/* Formal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referral Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor participant referral codes, successful student invites, and top referrers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics (3 Formal Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Referred Participants */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Referred Participants</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalReferred.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-2">Successful registrations via referral</p>
        </div>

        {/* Active Referrers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Active Referrers</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Share2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeReferrersCount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-2">Students who successfully invited peers</p>
        </div>

        {/* Top Referrer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Top Referrer</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Award size={16} />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 truncate">
            {topReferrer ? topReferrer.referrerRoll : 'None yet'}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-2">
            {topReferrer ? `${topReferrer.count} peer referrals (${topReferrer.referralCode})` : 'Waiting for referral activity'}
          </p>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Tab Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Referral Logs ({filteredReferrals.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'leaderboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Referrer Counts ({filteredLeaderboard.length})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roll, name, code..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : activeTab === 'logs' ? (
        /* 1. Referral Logs Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Referrer</th>
                  <th className="p-4">Referred Participant</th>
                  <th className="p-4">Referral Code (Lowercase)</th>
                  <th className="p-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedLogs.map((log, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const dateStr = log.createdAt?.toDate 
                    ? log.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : (log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 text-center text-slate-400 font-mono font-medium">
                        {globalIdx}
                      </td>

                      {/* Referrer */}
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900 font-mono">
                            {(log.referrerRoll || 'N/A').toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {log.referrerName || 'Participant'}
                          </p>
                        </div>
                      </td>

                      {/* Referred Participant */}
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900 font-mono">
                            {(log.referredRoll || 'N/A').toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {log.referredName || 'Participant'}
                          </p>
                        </div>
                      </td>

                      {/* Referral Code (Strict Lowercase) */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-mono text-xs font-semibold">
                          <Tag size={12} className="text-purple-600" />
                          <span>{normalizeReferralCode(log.referralCode || log.referrerRoll)}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-right text-slate-500 font-medium">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}

                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                      No referral records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredReferrals.length} records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. Referrer Counts / Leaderboard Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">Rank</th>
                  <th className="p-4">Referrer Participant</th>
                  <th className="p-4">Own Referral Code (Lowercase)</th>
                  <th className="p-4 text-right">Total Referrals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeaderboard.map((item, idx) => {
                  return (
                    <tr key={item.referralCode} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 text-center font-bold text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900 font-mono">
                            {item.referrerRoll}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.referrerName}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-mono text-xs font-semibold">
                          <Tag size={12} className="text-slate-500" />
                          <span>{item.referralCode}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
                          <TrendingUp size={13} />
                          <span>{item.count}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                      No referrers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
