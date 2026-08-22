'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import { Loader2, ShieldAlert } from 'lucide-react';

interface WardenSessionContextType {
  wardenAccount: any;
  loading: boolean;
  logout: () => Promise<void>;
}

const WardenSessionContext = createContext<WardenSessionContextType | null>(null);

export function WardenSessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [wardenAccount, setWardenAccount] = useState<any>(null);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth || !db) {
      setLoading(false);
      setConfigError(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const roleDoc = await getDoc(doc(db, 'roles', user.uid));
        if (roleDoc.exists() && roleDoc.data().role === 'warden') {
          const accountDoc = await getDoc(doc(db, 'wardenAccounts', user.uid));
          if (accountDoc.exists()) {
            setWardenAccount(accountDoc.data());
          } else {
            // Fallback object from role mapping if no wardenAccounts document exists
            setWardenAccount({
              wardenId: user.uid,
              email: user.email,
              hostel: roleDoc.data().hostel || 'BH1',
              name: roleDoc.data().name || `Warden (${roleDoc.data().hostel || 'BH1'})`
            });
          }
          setLoading(false);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error("Warden portal authorization guard error:", err);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    let performer = 'Warden';
    if (isFirebaseConfigured() && auth) {
      if (auth.currentUser) {
        performer = auth.currentUser.email || auth.currentUser.uid || 'Warden';
      } else if (wardenAccount) {
        performer = wardenAccount.email || wardenAccount.name || 'Warden';
      }
      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction('LOGOUT', 'sessions', `Warden ${performer} signed out successfully`, performer);
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
            Verifying Warden Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WardenSessionContext.Provider value={{ wardenAccount, loading, logout }}>
      {children}
    </WardenSessionContext.Provider>
  );
}

export function useWardenSession() {
  const context = useContext(WardenSessionContext);
  if (!context) {
    throw new Error('useWardenSession must be used within a WardenSessionProvider');
  }
  return context;
}
