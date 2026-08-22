'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWardenSession } from './WardenSessionProvider';

const CustomHomeIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
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

export default function WardenSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { wardenAccount, logout } = useWardenSession();

  const navItems = [
    { name: 'Hostel Dashboard', href: '/warden', icon: CustomHomeIcon }
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-brand-ink flex items-center justify-between px-4 z-50">
        <Link href="/warden" className="flex items-center gap-2">
          <img src="/logos/Aarambh_new_logo.svg" alt="Aarambh Logo" className="h-8 w-auto object-contain" />
          <span className="font-adminHeading text-sm font-black text-brand-ink uppercase">{(wardenAccount?.hostel || '').startsWith('BH') ? 'Boys Hostel' : 'Girls Hostel'} Console</span>
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

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r-2 border-brand-ink flex flex-col transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Desktop Sidebar Logo */}
        <div className="h-16 flex items-center px-6 border-b-2 border-brand-ink bg-white hidden md:flex">
          <Link href="/warden" className="flex items-center gap-2">
            <img src="/logos/Aarambh_new_logo.svg" alt="Aarambh Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation items list */}
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
          <div className="text-[10px] font-black uppercase text-brand-ink/40 tracking-wider mb-2 text-center truncate">
            {wardenAccount?.name || 'Warden'} ({(wardenAccount?.hostel || '').startsWith('BH') ? 'Boys Hostel' : 'Girls Hostel'})
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
