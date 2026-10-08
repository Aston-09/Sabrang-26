import type { Metadata } from 'next';
import ScannerLayoutWrapper from '../../components/scanner/ScannerLayoutWrapper';

export const metadata: Metadata = {
  title: "Sabrang Scanner Dashboard | Attendee Entrance QR Validation",
  description: "QR ticket validator and instant check-in registry validator dashboard for Sabrang '26 check-in desks.",
  alternates: {
    canonical: '/scanner',
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScannerLayoutWrapper>
      {children}
    </ScannerLayoutWrapper>
  );
}
