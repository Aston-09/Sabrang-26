'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { SkeletonCard } from '../../components/admin/SkeletonLoader';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

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

    // 2. Client-side Firestore listener for realtime sync attached when Auth is confirmed
    let unsubRegs = () => {};
    let unsubScans = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

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
          (err) => {
            console.warn("Realtime registrations listener warning:", err.message);
          }
        );

        unsubScans = onSnapshot(
          query(collection(db, 'scanLogs'), where('timestamp', '>=', today), where('result', '==', 'accepted')),
          (snap) => {
            setStats(s => ({ ...s, totalEntriesToday: snap.size }));
          },
          (err) => {
            console.warn("Realtime scan logs listener warning:", err.message);
          }
        );
      } catch (err) {
        console.warn("Firestore listeners error:", err);
      }
    });

    return () => {
      unsubAuth();
      unsubRegs();
      unsubScans();
    };
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 text-slate-800 font-sans">
      {/* Formal Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/scanner"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
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

      {/* Registration & Attendance Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Registration & Attendance
          </h2>
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
              <span className="text-xs font-medium text-slate-500 block mb-2">Total Registrations</span>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRegistrations.toLocaleString('en-IN')}</p>
            </div>
            
            {/* Today's Registrations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <span className="text-xs font-medium text-slate-500 block mb-2">Registrations Today</span>
              <p className="text-2xl font-bold text-slate-900">{stats.todayRegistrations.toLocaleString('en-IN')}</p>
            </div>

            {/* Total Check-Ins */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <span className="text-xs font-medium text-slate-500 block mb-2">Total Check-Ins</span>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEntries.toLocaleString('en-IN')}</p>
            </div>

            {/* Entries Today */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all">
              <span className="text-xs font-medium text-slate-500 block mb-2">Gate Entries Today</span>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEntriesToday.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Financial Collections (Total Collection & Today's Collection) */}
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
              </div>
            </div>

            {/* Today's Collection */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

