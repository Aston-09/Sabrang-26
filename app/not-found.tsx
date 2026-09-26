import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Sabrang 2026",
  description: "The page you are looking for does not exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#040207] text-white flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0.05) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto space-y-6">
        <div className="inline-block px-3.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-xs uppercase tracking-widest">
          Error 404
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white">
          Page Not Found
        </h1>

        <p className="text-white/60 text-sm sm:text-base leading-relaxed">
          The link you followed may be broken, or the page may have been moved or removed. Explore the official sections of Sabrang 2026 below:
        </p>

        {/* Quick Recovery Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-colors"
          >
            Festival Home
          </Link>
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Events &amp; Showcases
          </Link>
          <Link
            href="/schedule"
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Schedule
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Get Passes
          </Link>
        </div>

        <div className="pt-8 border-t border-white/10 text-xs text-white/40">
          Looking for help?{" "}
          <Link href="/contact" className="text-purple-400 hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
