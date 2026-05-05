'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide Navbar for admin and scanner routes
  if (pathname && pathname.startsWith('/admin')) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/events', label: 'Events' },
    { href: '/highlights', label: 'Highlights' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/team', label: 'Our Team' },
    { href: '/faq', label: 'FAQ' },
    { href: '/sponsor', label: 'Why Sponsor Us?' },
    { href: '/contact', label: 'Contact Us' },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
            SABRANG <span className="text-indigo-600">2026</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 text-sm font-bold uppercase tracking-wide text-slate-600">
            {role !== 'admin' && navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {!loading && (
              <>
                {user ? (
                  <>
                    {role !== 'admin' && (
                      <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                        Dashboard
                      </Link>
                    )}
                    {role === 'scanner' && (
                      <Link href="/admin" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
                        Entry Portal
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hover:text-indigo-600 transition-colors">
                      Login
                    </Link>
                    <Link 
                      href="/register" 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-3">
            {role !== 'admin' && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {!loading && (
              <>
                <div className="border-t pt-3 mt-3">
                  {user ? (
                    <div className="space-y-3">
                      {role !== 'admin' && (
                        <Link href="/dashboard" className="block py-2 text-slate-600 hover:text-indigo-600 font-bold">
                          Dashboard
                        </Link>
                      )}
                      {role === 'scanner' && (
                        <Link href="/admin" className="block py-2 text-red-600 font-bold">
                          Entry Portal
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left py-2 text-red-600 font-bold"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/login" className="block py-2 text-slate-600 hover:text-indigo-600 font-bold">
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="block w-full text-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 font-bold"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
