'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span>October 10-12, 2025 • JK Lakshmipat University</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6 uppercase">
            SABRANG <span className="text-indigo-600">2025</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Experience the grandest cultural & techno-management fest of Rajasthan. 
            Competing for a <span className="font-bold text-slate-900">₹2.5 Lakh+ Prize Pool</span> 
            across 50+ high-octane events.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/events" 
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-200"
            >
              Explore Events
            </Link>
            {!user ? (
              <Link 
                href="/register" 
                className="px-10 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold text-lg hover:border-indigo-600 transition-all"
              >
                Sign Up Now
              </Link>
            ) : (
              <Link 
                href="/dashboard" 
                className="px-10 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold text-lg hover:border-indigo-600 transition-all"
              >
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">What is Sabrang?</h2>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                <p>
                  Sabrang is the annual flagship festival of JK Lakshmipat University, 
                  celebrating the vibrant colors of talent, innovation, and culture.
                </p>
                <p>
                  From flagship events like <span className="font-bold text-slate-900">Panache</span> 
                  to intense e-sports battles and soulful musical nights, Sabrang offers a 
                  platform for students nationwide to showcase their prowess.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6 text-center">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-black text-indigo-600">50+</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Events</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-black text-indigo-600">3 Days</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Festival</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] shadow-2xl overflow-hidden flex items-center justify-center p-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="text-white">
                    <div className="text-2xl font-bold mb-1">Unforgettable Nights</div>
                    <div className="text-sm text-indigo-100 font-medium">Join us for the most awaited college festival of the year.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Festival Highlights</h2>
            <p className="text-slate-500 font-medium">Why you shouldn't miss Sabrang '25</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Flagship Events", 
                desc: "Elite competitions like Panache (Fashion), Bandjam (Battle of Bands), and Step-Up (Dance).",
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
              },
              { 
                title: "Professional Shows", 
                desc: "Groove to the beats of celebrity artists, live bands, and explosive DJ nights.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></svg>
              },
              { 
                title: "Huge Cash Prizes", 
                desc: "Total prize pool exceeding ₹2.5 Lakhs distributed across all technical and cultural wins.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
