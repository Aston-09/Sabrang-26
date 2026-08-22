'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Bespoke geometric SVG icons
const CustomDashboardIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const CustomDutyIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const CustomCalendarIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="7" y="13" width="2" height="2" />
    <rect x="11" y="13" width="2" height="2" />
    <rect x="15" y="13" width="2" height="2" />
  </svg>
);

const CustomLogoutIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M10 22H3V2H10" />
    <path d="M21 12H9" />
    <path d="M16 7L21 12L16 17" />
  </svg>
);

const CustomMenuIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CustomCloseIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    className={className}
  >
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
);

export default function VolunteerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (isOpen) {
        setIsVisible(true);
        return;
      }

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Scroll down
      } else {
        setIsVisible(true); // Scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isOpen]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth || !db) return;

    let unsubFirestore: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = undefined;
      }

      let activeUid = '';
      if (user) {
        activeUid = user.uid;
      } else {
        const stored = localStorage.getItem('aarambh_session');
        if (stored) {
          try {
            const session = JSON.parse(stored);
            activeUid = session.uid;
            if (session.role === 'team_leader') {
              setIsTeamLeader(true);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (activeUid) {
        unsubFirestore = onSnapshot(doc(db, 'volunteers', activeUid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsTeamLeader(data.role === 'Team Leader');
          }
        }, (err) => {
          console.warn("Sidebar volunteer snapshot listener error:", err);
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const handleLogout = async () => {
    let performer = 'Volunteer';
    try {
      const sessionStr = localStorage.getItem('aarambh_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        performer = session.email || session.name || session.uid || 'Volunteer';
      } else if (isFirebaseConfigured() && auth && auth.currentUser) {
        performer = auth.currentUser.email || auth.currentUser.uid || 'Volunteer';
      }
    } catch (e) {
      console.error("Failed to parse local session:", e);
    }
    try {
      const { logAdminAction } = await import('../../lib/audit');
      await logAdminAction('LOGOUT', 'sessions', `Volunteer ${performer} signed out successfully`, performer);
    } catch (err) {
      console.error("Failed to log logout action:", err);
    }
    if (isFirebaseConfigured() && auth) {
      await auth.signOut();
    }
    localStorage.removeItem('aarambh_session');
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/volunteer', icon: CustomDashboardIcon },
    { name: 'My Schedule', href: '/volunteer/schedule', icon: CustomCalendarIcon },
    ...(isTeamLeader ? [{ name: 'Duty Assignment', href: '/volunteer/duty-assignment', icon: CustomDutyIcon }] : [])
  ];

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-brand-ink flex items-center justify-between px-4 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Link href="/volunteer" className="flex items-center gap-2">
          <img src="/logos/Aarambh_new_logo.svg" alt="Aarambh Logo" className="h-8 w-auto object-contain" />
          <span className="font-adminHeading text-md font-black text-brand-ink hidden">Volunteer</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-brand-ink p-2 cursor-pointer focus:outline-none"
        >
          {isOpen ? <CustomCloseIcon size={24} /> : <CustomMenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-[#030404]/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Contents */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r-2 border-brand-ink flex flex-col transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Desktop Sidebar Logo */}
        <div className="h-16 flex items-center px-6 border-b-2 border-brand-ink bg-white hidden md:flex">
          <Link href="/volunteer" className="flex items-center gap-2">
            <img src="/logos/Aarambh_new_logo.svg" alt="Aarambh Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 bg-white">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 border-2 transition-all duration-100 ${
                  isActive 
                    ? 'bg-brand-cloud border-brand-ink text-brand-ink font-black shadow-[3px_3px_0px_0px_#030404] rounded-md translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent text-admin-muted hover:bg-admin-bg hover:text-brand-ink hover:border-brand-ink hover:rounded-md'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm tracking-wide uppercase font-black text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t-2 border-brand-ink bg-white">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md border-2 border-transparent text-admin-muted hover:border-brand-ink hover:bg-brand-orange/15 hover:text-brand-orange hover:font-black hover:shadow-[3px_3px_0px_0px_#030404] transition-all duration-100 cursor-pointer"
          >
            <CustomLogoutIcon size={18} />
            <span className="text-sm tracking-wide uppercase font-black text-xs">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
