'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckCircle2, 
  Ticket, 
  Users, 
  HelpCircle, 
  LogOut,
  Plus
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Events', icon: CalendarDays },
    { href: '/admin/check-in', label: 'Check-in', icon: CheckCircle2 },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/registrations', label: 'Registrations', icon: Users },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant flex flex-col p-6 gap-2 z-40">
      <div className="flex flex-col gap-1 mb-8 px-2">
        <h1 className="font-h3 text-h3 font-bold text-primary">Sabrang 2026</h1>
        <p className="text-sm text-on-secondary-container opacity-60 font-medium">Festival Admin</p>
      </div>

      <nav className="flex-grow flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group hover-scale ${
                isActive 
                  ? 'bg-primary text-on-primary font-semibold shadow-sm' 
                  : 'text-on-secondary-container hover:bg-surface-variant'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Link 
          href="/admin/events"
          className="bg-primary text-on-primary w-full py-4 rounded-lg font-semibold mb-4 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 hover-scale"
        >
          <Plus size={18} />
          Create New Event
        </Link>
        <Link 
          href="/support"
          className="flex items-center gap-3 px-4 py-3 text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg text-sm font-medium"
        >
          <HelpCircle size={20} />
          <span>Support</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg text-sm w-full font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
