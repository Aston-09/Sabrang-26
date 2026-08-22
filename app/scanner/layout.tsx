import type { Metadata } from 'next';
import ScannerSidebar from '../../components/scanner/Sidebar';
import { ScannerSessionProvider } from '../../components/scanner/ScannerSessionProvider';

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
    <ScannerSessionProvider>
      <div className="flex min-h-screen bg-[#F5F1E5] text-brand-ink font-sans relative internal-team-portal">
        <ScannerSidebar />
        <div className="flex-1 flex flex-col min-h-screen w-full md:w-[calc(100%-16rem)] overflow-y-auto">
          
          {/* Global White Header Bar - Minimal Style */}
          <header className="sticky top-0 left-0 right-0 z-30 bg-white px-6 h-16 flex items-center justify-end border-b-2 border-brand-ink flex-shrink-0">
            <span className="hidden md:inline-block font-adminHeading text-xs md:text-sm font-black uppercase tracking-widest text-brand-orange border-2 border-brand-ink bg-brand-orange/15 px-3.5 py-1.5 rounded-md shadow-[2px_2px_0px_0px_#030404]">
              Scanner Team
            </span>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-6 md:p-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#030404_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ScannerSessionProvider>
  );
}
