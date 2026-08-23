'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // 1. Instant check from sessionStorage
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('sabrang_auth') : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin' || parsed.role === 'scanner') {
          setIsAuthenticated(true);
          return;
        }
      } catch {}
    }

    // 2. Firebase Auth fallback
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (typeof window !== 'undefined' && sessionStorage.getItem('sabrang_auth')) {
          setIsAuthenticated(true);
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
          router.push('/admin/scanner');
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Firebase Configuration Required</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {FIREBASE_SETUP_MESSAGE}
          </p>
          <div className="text-xs bg-slate-100 border border-slate-200 p-3 rounded-lg text-left font-mono text-slate-800">
            1. Copy .env.example to .env.local<br/>
            2. Fill in your Firebase configuration keys
          </div>
        </div>
      </div>
    );
  }

  // Consistent SSR / Initial client render avoids hydration mismatch
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={36} />
      </div>
    );
  }

  return (
    <div className="admin-portal-scope flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Sidebar />
      <main className="flex-1 w-full md:w-[calc(100%-16rem)] pt-16 md:pt-0 overflow-y-auto relative bg-[#f8fafc]">
        <header className="sticky top-0 z-30 bg-white px-6 md:px-8 h-16 hidden md:flex items-center justify-between border-b border-slate-200 shadow-xs">
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

      {/* Scoped style specifically for Admin Portal ensuring standard browser cursor */}
      <style jsx global>{`
        .admin-portal-scope,
        .admin-portal-scope *,
        html:has(.admin-portal-scope),
        body:has(.admin-portal-scope),
        body:has(.admin-portal-scope) * {
          cursor: auto !important;
        }
        .admin-portal-scope a,
        .admin-portal-scope button,
        .admin-portal-scope [role="button"],
        .admin-portal-scope select,
        .admin-portal-scope .cursor-pointer,
        body:has(.admin-portal-scope) a,
        body:has(.admin-portal-scope) button,
        body:has(.admin-portal-scope) [role="button"],
        body:has(.admin-portal-scope) select,
        body:has(.admin-portal-scope) .cursor-pointer {
          cursor: pointer !important;
        }
        .admin-portal-scope input,
        .admin-portal-scope textarea,
        body:has(.admin-portal-scope) input,
        body:has(.admin-portal-scope) textarea {
          cursor: text !important;
        }
        .admin-portal-scope button:disabled,
        .admin-portal-scope .cursor-not-allowed,
        body:has(.admin-portal-scope) button:disabled,
        body:has(.admin-portal-scope) .cursor-not-allowed {
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  );
}
