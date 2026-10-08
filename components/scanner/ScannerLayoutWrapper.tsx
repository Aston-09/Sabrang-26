'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import { Loader2, LogOut } from 'lucide-react';

export default function ScannerLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }

      try {
        const [roleDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'roles', user.uid)).catch(() => null),
          getDoc(doc(db, 'users', user.uid)).catch(() => null),
        ]);

        const role = roleDoc?.exists() ? roleDoc.data()?.role : (userDoc?.exists() ? userDoc.data()?.role : 'admin');

        // We allow admin and scanner roles to view this page.
        if (role === 'scanner' || role === 'admin') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
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
        </div>
      </div>
    );
  }

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={36} />
      </div>
    );
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sabrang_auth');
    }
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  return (
    <div className="admin-portal-scope flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <main className="flex-1 w-full overflow-y-auto relative bg-[#f8fafc]">
        {/* Simple header with logout button instead of a full menu */}
        <header className="sticky top-0 z-30 bg-white px-6 md:px-8 h-16 flex items-center justify-between border-b border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Sabrang 2026 Scanner
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors text-xs font-medium cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </header>
        <div className="p-4 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>

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
