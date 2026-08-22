'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ScannerSessionContextType {
  scannerAccount: any;
  loading: boolean;
  logout: () => Promise<void>;
}

const ScannerSessionContext = createContext<ScannerSessionContextType | null>(null);

export function ScannerSessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [scannerAccount, setScannerAccount] = useState<any>(null);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check session fallback first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sabrang_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'scanner' || parsed.role === 'admin') {
            setScannerAccount({
              name: parsed.name || parsed.email || 'Staff Scanner',
              email: parsed.email || 'scanner@sabrang.com',
              role: parsed.role,
              gate: 'Main Gate',
            });
            setLoading(false);
            return;
          }
        } catch {}
      }
    }

    if (!isFirebaseConfigured() || !auth || !db) {
      setLoading(false);
      return;
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

      setScannerAccount({
        name: user.displayName || user.email || 'Staff Scanner',
        email: user.email || 'scanner@sabrang.com',
        role: 'scanner',
        gate: 'Main Gate',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    let performer = 'Scanner';
    if (isFirebaseConfigured() && auth) {
      if (auth.currentUser) {
        performer = auth.currentUser.email || auth.currentUser.uid || 'Scanner';
      } else if (scannerAccount) {
        performer = scannerAccount.email || scannerAccount.name || 'Scanner';
      }
      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction('LOGOUT', 'sessions', `Scanner ${performer} signed out successfully`, performer);
      } catch (err) {
        console.error("Failed to log logout action:", err);
      }
      await auth.signOut();
    }
    router.push('/login');
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-[#F5F1E5] flex items-center justify-center p-6 text-center select-none font-adminBody">
        <div className="max-w-md bg-white border-4 border-brand-ink p-8 shadow-[4px_4px_0px_0px_#030404] rounded-md">
          <ShieldAlert className="text-brand-orange mx-auto mb-4" size={48} />
          <h2 className="font-adminHeading text-2xl font-black text-brand-ink mb-4 uppercase tracking-tight">Firebase Unconfigured</h2>
          <p className="text-admin-muted text-xs font-bold uppercase mb-6 leading-relaxed">
            {FIREBASE_SETUP_MESSAGE}
          </p>
          <div className="text-[10px] bg-brand-cloud p-4 border-2 border-brand-ink rounded-md text-left font-mono overflow-x-auto text-brand-ink/70">
            1. Copy .env.example to .env.local<br/>
            2. Fill in your Firebase configuration keys
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E5] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-ink mx-auto" size={48} />
          <p className="text-admin-muted text-xs font-bold uppercase tracking-widest font-adminBody">
            Verifying Scanner Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScannerSessionContext.Provider value={{ scannerAccount, loading, logout }}>
      {children}
    </ScannerSessionContext.Provider>
  );
}

export function useScannerSession() {
  const context = useContext(ScannerSessionContext);
  if (!context) {
    throw new Error('useScannerSession must be used within a ScannerSessionProvider');
  }
  return context;
}
