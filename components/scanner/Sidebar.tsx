'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useScannerSession } from './ScannerSessionProvider';

// ============================================================================
// BESPOKE CUSTOM GEOMETRIC SVG ICONS FOR SIDEBAR (Gradient-free, Sharp, Heavy-mitre)
// ============================================================================

const CustomConsoleIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <rect x="3" y="3" width="18" height="18" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const CustomRecordsIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
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

export default function ScannerSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { scannerAccount, logout } = useScannerSession();

  const navItems = [
    { name: 'Scanner Console', href: '/scanner', icon: CustomConsoleIcon },
    { name: 'Scan Records', href: '/scanner/records', icon: CustomRecordsIcon }
  ];

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <Link href="/scanner" className="flex items-center gap-2">
          <span className="font-black text-lg text-slate-900 tracking-wider font-mono">SABRANG &apos;26</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Scanner</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-800 p-2 cursor-pointer focus:outline-none"
        >
          {isOpen ? <CustomCloseIcon size={24} /> : <CustomMenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Contents */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Desktop Sidebar Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white hidden md:flex">
          <Link href="/scanner" className="flex items-center gap-2">
            <span className="font-black text-lg text-slate-900 tracking-wider font-mono">SABRANG &apos;26</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Scanner</span>
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
          <div className="text-[9px] font-black uppercase text-brand-ink/40 tracking-wider mb-2 text-center truncate">
            {scannerAccount?.volunteerName || 'Operator'}
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-md border-2 border-transparent text-admin-muted hover:border-brand-ink hover:bg-brand-orange/15 hover:text-brand-orange hover:font-black hover:shadow-[3px_3px_0px_0px_#030404] transition-all duration-100 cursor-pointer"
          >
            <CustomLogoutIcon size={18} />
            <span className="text-sm tracking-wide uppercase font-black text-xs">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
