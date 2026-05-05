'use client';

import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function AdminTopBar() {
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center h-16 px-10 w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
      <div className="flex items-center gap-6">
        <div className="relative w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
            placeholder="Search registration ID..." 
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg">
          <Bell size={20} />
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg">
          <Settings size={20} />
        </button>
        <div className="h-8 w-8 rounded-lg bg-primary-container overflow-hidden border border-outline-variant ml-2">
          {user?.photoURL ? (
            <img alt="Admin Profile" className="w-full h-full object-cover" src={user.photoURL} />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
