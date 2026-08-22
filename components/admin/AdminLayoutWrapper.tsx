'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  useEffect(() => {
    // Check session fallback first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sabrang_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'admin' || parsed.role === 'scanner') {
            setLoading(false);
            return;
          }
        } catch {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (typeof window !== 'undefined' && sessionStorage.getItem('sabrang_auth')) {
          setLoading(false);
          return;
        }
        router.push('/login');
        return;
      }

      try {
        const [roleDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'roles', user.uid)).catch(() => null),
          getDoc(doc(db, 'users', user.uid)).catch(() => null),
        ]);

        const role = roleDoc?.exists() ? roleDoc.data()?.role : (userDoc?.exists() ? userDoc.data()?.role : 'admin');

        if (role === 'scanner') {
          router.push('/scanner');
        } else {
          setLoading(false);
        }
      } catch {
        // Safe fallback for authenticated user
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (configError) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center p-6 text-center font-adminBody">
        <div className="max-w-md bg-admin-surface border-4 border-brand-ink p-8 rounded-md shadow-[6px_6px_0px_0px_#030404]">
          <h2 className="text-2xl font-black text-brand-orange mb-4 font-adminHeading uppercase tracking-tight">Firebase Unconfigured</h2>
          <p className="text-brand-ink/75 text-sm mb-6 leading-relaxed font-bold">
            {FIREBASE_SETUP_MESSAGE}
          </p>
          <div className="text-xs bg-brand-cloud border-2 border-brand-ink p-4 rounded-md text-left font-mono overflow-x-auto text-brand-ink font-semibold">
            1. Copy .env.example to .env.local<br/>
            2. Fill in your Firebase configuration keys
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-admin-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Sidebar />
      <main className="flex-1 w-full md:w-[calc(100%-16rem)] pt-16 md:pt-0 overflow-y-auto relative bg-[#f8fafc]">
        <header className="sticky top-0 z-30 bg-white px-6 md:px-8 h-16 hidden md:flex items-center justify-between border-b border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Sabrang 2026 Management System
          </span>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>System Online</span>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
