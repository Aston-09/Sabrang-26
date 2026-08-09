'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LiquidMetalButton } from '@/components/ui/liquid-metal';
import { X, ArrowRight, LogOut, User as UserIcon, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll direction listener to hide on scroll-down & show instantly on scroll-up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Scrolling DOWN -> Hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP -> Show instantly
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Hide Navbar for admin and scanner routes
  if (pathname && pathname.startsWith('/admin')) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/events', label: 'Events' },
    { href: '/highlights', label: 'Highlights' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/team', label: 'Our Team' },
    { href: '/faq', label: 'FAQ' },
    { href: '/sponsor', label: 'Why Sponsor Us?' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const chromeMetalConfig = {
    colorBack: '#444446',
    colorTint: '#ffffff',
    speed: 0.4,
    repetition: 4,
    distortion: 0.15,
    scale: 1,
  };

  return (
    <>
      {/* Top Floating Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center transition-all duration-300 ease-out ${
          isVisible || isOpen
            ? 'translate-y-0 opacity-100 pointer-events-none'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Left: Sabrang Logo Liquid Metal Pill */}
        <div className="pointer-events-auto">
          <Link href="/">
            <LiquidMetalButton
              borderWidth={4}
              size="md"
              metalConfig={chromeMetalConfig}
              icon={
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-white/90 rounded-[4px]" />
                </div>
              }
            >
              <span className="text-base font-semibold tracking-tight text-white">
                Sabrang 2026
              </span>
            </LiquidMetalButton>
          </Link>
        </div>

        {/* Top Right: Cylindrical Menu Liquid Metal Pill */}
        <div className="pointer-events-auto">
          <LiquidMetalButton
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            borderWidth={4}
            size="md"
            metalConfig={chromeMetalConfig}
            icon={
              isOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <div className="flex flex-col gap-1 w-4 items-center justify-center">
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                </div>
              )
            }
          >
            <span className="text-base font-semibold tracking-tight text-white">
              Menu
            </span>
          </LiquidMetalButton>
        </div>
      </header>

      {/* Full-Screen Navigation Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between p-6 md:p-12 overflow-y-auto ${
          isOpen
            ? 'opacity-100 pointer-events-auto scale-100'
            : 'opacity-0 pointer-events-none scale-98'
        }`}
      >
        <div className="max-w-4xl mx-auto w-full pt-24 pb-8 flex flex-col justify-center min-h-[80vh]">
          {/* Navigation Links */}
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
            {role !== 'admin' &&
              navLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.07] hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-400 font-semibold">
                        0{idx + 1}
                      </span>
                      <span className="text-lg md:text-xl font-bold tracking-wide">
                        {link.label}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
          </nav>

          {/* User Auth Section */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex flex-wrap items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.displayName || 'User'}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {role !== 'admin' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="px-5 py-2.5 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 font-semibold text-sm transition-all"
                        >
                          Dashboard
                        </Link>
                      )}
                      {role === 'scanner' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="px-5 py-2.5 rounded-full bg-red-950/50 border border-red-700 text-red-200 hover:bg-red-900/50 font-semibold text-sm transition-all flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" /> Entry Portal
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="px-5 py-2.5 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 font-semibold text-sm transition-all flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-sm text-white/50">Ready to join Sabrang 2026?</p>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="relative group px-6 py-3 rounded-full bg-white text-black font-bold text-sm tracking-wide shadow-lg hover:bg-neutral-200 active:scale-95 transition-all"
                    >
                      Register Now
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
