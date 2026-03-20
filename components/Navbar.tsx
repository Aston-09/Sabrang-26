'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
          SABRANG <span className="text-indigo-600">2025</span>
        </Link>

        <div className="flex items-center space-x-6 text-sm font-bold uppercase tracking-wide text-slate-600">
          <Link href="/#about" className="hover:text-indigo-600 transition-colors">
            About
          </Link>
          <Link href="/events" className="hover:text-indigo-600 transition-colors">
            Events
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                    Dashboard
                  </Link>
                  {(role === 'admin' || role === 'scanner') && (
                    <Link href="/admin" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
                      {role === 'admin' ? 'Super Admin' : 'Entry Portal'}
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
      </div>
    </nav>
  );
}
