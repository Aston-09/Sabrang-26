'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (role !== 'admin' && role !== 'scanner'))) {
      router.push('/');
    }
  }, [user, role, loading, router]);

  if (loading) return <div className="text-center mt-20">Verifying permissions...</div>;
  if (!user || (role !== 'admin' && role !== 'scanner')) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{role === 'admin' ? 'Super Admin Panel' : 'Entry Manager'}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {role === 'admin' && (
          <>
            <Link 
              href="/admin/events" 
              className="bg-white p-8 rounded-2xl border hover:border-indigo-600 transition-colors shadow-sm group"
            >
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Manage Events</h2>
              <p className="text-slate-500 text-sm">Create, edit, or delete college festival events.</p>
            </Link>

            <Link 
              href="/admin/registrations" 
              className="bg-white p-8 rounded-2xl border hover:border-emerald-600 transition-colors shadow-sm group"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Registrations</h2>
              <p className="text-slate-500 text-sm">View all event registrations and checked-in details.</p>
            </Link>

            <Link 
              href="/admin/coupons" 
              className="bg-white p-8 rounded-2xl border hover:border-purple-600 transition-colors shadow-sm group"
            >
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="2" x2="22" y1="15" y2="15"/></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Discount Coupons</h2>
              <p className="text-slate-500 text-sm">Create and manage promo codes for event tickets.</p>
            </Link>
          </>
        )}

        <Link 
          href="/admin/check-in" 
          className="bg-white p-8 rounded-2xl border hover:border-amber-600 transition-colors shadow-sm group"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v-3a2 2 0 0 0-2-2h-3"/><path d="M11 10h1"/><path d="M16 10h1"/><path d="M11 14h3"/><path d="M18 14h3"/><path d="M11 18h1"/><path d="M11 21h1"/><path d="M14 21h1"/><path d="M18 21h1"/><path d="M21 11h-3a2 2 0 0 0-2 2v3"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">QR Check-in</h2>
          <p className="text-slate-500 text-sm">Scan attendee QR codes and mark attendance.</p>
        </Link>
      </div>
    </div>
  );
}
