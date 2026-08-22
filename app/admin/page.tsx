'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { SkeletonCard } from '../../components/admin/SkeletonLoader';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  QrCode, 
  ShieldCheck, 
  ArrowUpRight, 
  TrendingUp,
  CreditCard,
  Tag,
  Share2,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    todayRegistrations: 0,
    totalEntriesToday: 0,
    totalEntries: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    loading: true
  });

  useEffect(() => {
    // 1. Fetch server-side stats via Admin SDK API
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setStats({
            totalRegistrations: data.totalRegistrations || 0,
            todayRegistrations: data.todayRegistrations || 0,
            totalEntriesToday: data.totalEntriesToday || 0,
            totalEntries: data.totalEntries || 0,
            totalRevenue: data.totalRevenue || 0,
            todayRevenue: data.todayRevenue || 0,
            loading: false,
          });
        } else {
          setStats(s => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        setStats(s => ({ ...s, loading: false }));
      });

    // 2. Client-side Firestore listener for realtime sync
    let unsubRegs = () => {};
    let unsubScans = () => {};

    if (auth && auth.currentUser) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        unsubRegs = onSnapshot(
          collection(db, 'registrations'),
          (snap) => {
            const allRegs = snap.docs.map(d => d.data());
            const validRegs = allRegs.filter((reg: any) => reg.name && reg.name.trim() !== '' && reg.isTest !== true);
            
            let totalRev = 0;
            let todayRev = 0;
            let todayCount = 0;

            validRegs.forEach((reg: any) => {
              const amountNum = parseFloat(reg.receivedAmount || reg.paymentAmount || reg.amount || reg.price || '0') || 0;
              totalRev += amountNum;

              if (reg.registeredAt || reg.createdAt) {
                const regDate = reg.registeredAt?.toDate ? reg.registeredAt.toDate() : new Date(reg.registeredAt || reg.createdAt);
                if (regDate >= today) {
                  todayCount++;
                  todayRev += amountNum;
                }
              }
            });

            const checkedInCount = validRegs.filter((reg: any) => reg.hasEntered === true || reg.attended === true).length;

            setStats(s => ({
              ...s,
              totalRegistrations: validRegs.length,
              todayRegistrations: todayCount,
              totalEntries: checkedInCount,
              totalRevenue: totalRev,
              todayRevenue: todayRev,
              loading: false,
            }));
          },
          () => {}
        );

        unsubScans = onSnapshot(
          query(collection(db, 'scanLogs'), where('timestamp', '>=', today), where('result', '==', 'accepted')),
          (snap) => {
            setStats(s => ({ ...s, totalEntriesToday: snap.size }));
          },
          () => {}
        );
      } catch {
        // Fallback handled via API
      }
    }

    return () => {
      unsubRegs();
      unsubScans();
    };
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const quickLinks = [
    {
      title: 'Ticket Scanner',
      desc: 'Scan gate QR codes to verify entrance passes',
      href: '/admin/scanner',
      icon: QrCode,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Registrations',
      desc: 'View participant records & download Excel (.xlsx)',
      href: '/admin/registrations',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Entry Logs',
      desc: 'Real-time check-in stream filtered by event',
      href: '/admin/entry-logs',
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Referrals',
      desc: 'Student referral tracking, codes & leaderboard',
      href: '/admin/referrals',
      icon: Share2,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Coupons',
      desc: 'Manage discount codes, fixed pricing & limits',
      href: '/admin/coupons',
      icon: Tag,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Audit Logs',
      desc: 'System mutation logs and security records',
      href: '/admin/audit',
      icon: FileText,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
    },
  ];

  return (
    <div className="space-y-8 text-slate-800 font-sans">
      {/* Formal Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of festival registrations, entrance check-ins, and financial metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/scanner"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <QrCode size={14} />
            <span>Open Scanner</span>
          </Link>
          <Link
            href="/admin/registrations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Registrations</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Top Row: Key Activity Metrics (4 Formal Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Registration & Attendance
          </h2>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span> Live Sync
          </span>
        </div>

        {stats.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Registrations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Total Registrations</span>
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <Users size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRegistrations.toLocaleString('en-IN')}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                <span>●</span> All verified passes
              </p>
            </div>
            
            {/* Today's Registrations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Registrations Today</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserCheck size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.todayRegistrations.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 mt-2">New signups today</p>
            </div>

            {/* Total Check-Ins */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Total Check-Ins</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEntries.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 mt-2">Verified festival attendees</p>
            </div>

            {/* Entries Today */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Gate Entries Today</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <QrCode size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEntriesToday.toLocaleString('en-IN')}</p>
              <p className="text-xs text-purple-600 mt-2 font-medium">Scans recorded today</p>
            </div>
          </div>
        )}
      </div>

      {/* Middle Section: Quick Access Portals (Easy To Access) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Navigation & Portals
          </h2>
          <span className="text-xs text-slate-400 font-medium">Direct Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="group bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${link.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {link.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Financial Collection Cards (2 Formal Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Financial Collections
          </h2>
          <span className="text-xs text-slate-400 font-medium">INR (₹)</span>
        </div>

        {stats.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Collection */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Collection
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xl font-bold text-slate-500">₹</span>
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {stats.totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Gross cumulative revenue collected from festival registrations.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
                  <TrendingUp size={22} />
                </div>
              </div>
            </div>

            {/* Today's Collection */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Today's Collection
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                      {todayFormatted}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xl font-bold text-slate-500">₹</span>
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {stats.todayRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Payments successfully processed during today's window.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl">
                  <CreditCard size={22} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
