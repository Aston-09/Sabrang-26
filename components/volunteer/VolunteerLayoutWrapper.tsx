'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Sidebar from './Sidebar';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function VolunteerLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    let unsubAuth = () => {};

    const checkAuth = async () => {
      // 1. First check local storage session fallback
      const stored = localStorage.getItem('aarambh_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          if (session && session.uid && (session.role === 'volunteer' || session.role === 'team_leader')) {
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse local session:", e);
        }
      }

      // 2. Set up Firebase Auth listener
      unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login');
          return;
        }

        try {
          // Check role doc in Firebase Auth
          const roleDoc = await getDoc(doc(db, 'roles', user.uid));
          let hasRole = false;
          if (roleDoc.exists()) {
            const role = roleDoc.data().role;
            if (role === 'volunteer' || role === 'team_leader' || role === 'admin') {
              hasRole = true;
            }
          }

          // Check if volunteer exists in volunteers collection
          if (!hasRole) {
            const volDoc = await getDoc(doc(db, 'volunteers', user.uid));
            if (volDoc.exists()) {
              hasRole = true;
            }
          }

          if (hasRole) {
            setLoading(false);
          } else {
            router.push('/login');
          }
        } catch (err) {
          console.error("Error verifying volunteer credentials:", err);
          router.push('/login');
        }
      });
    };

    checkAuth();

    return () => unsubAuth();
  }, [router, firebaseReady]);

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
            Verifying Volunteer Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F1E5] text-brand-ink font-sans relative internal-team-portal">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full md:w-[calc(100%-16rem)] overflow-y-auto">
        {/* Global White Header Bar - Minimal Style */}
        <header className="sticky top-0 left-0 right-0 z-30 bg-white px-6 h-16 hidden md:flex items-center justify-end border-b-2 border-brand-ink flex-shrink-0">
          <span className="hidden md:inline-block font-adminHeading text-xs md:text-sm font-black uppercase tracking-widest text-brand-blue border-2 border-brand-ink bg-brand-blue/15 px-3.5 py-1.5 rounded-md shadow-[2px_2px_0px_0px_#030404]">
            Volunteer Team
          </span>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 pt-24 md:p-8 relative">
          <div 
            className="absolute inset-0 opacity-[0.25] pointer-events-none" 
            style={{
              backgroundImage: 'linear-gradient(to right, #030404 1px, transparent 1px), linear-gradient(to bottom, #030404 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
