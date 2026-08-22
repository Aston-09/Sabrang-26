import type { Metadata } from 'next';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Organizer administration panel for participant registrations, transactions, and logs for Sabrang 2026.",
  alternates: {
    canonical: '/admin',
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
