"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import LiquidBackground from "../../components/admin/LiquidBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Secure Firebase Client Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      let role = "admin";
      let name = user.displayName || "Administrator";

      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const [userDoc, roleDoc] = await Promise.all([
          Promise.race([getDoc(doc(db, "users", user.uid)), timeout]).catch(() => null),
          Promise.race([getDoc(doc(db, "roles", user.uid)), timeout]).catch(() => null),
        ]);

        if (userDoc && 'exists' in userDoc && userDoc.exists()) {
          role = userDoc.data()?.role || "admin";
          name = userDoc.data()?.name || name;
        } else if (roleDoc && 'exists' in roleDoc && roleDoc.exists()) {
          role = roleDoc.data()?.role || "admin";
        }
      } catch {
        // Fallback to token default
      }

      sessionStorage.setItem(
        "sabrang_auth",
        JSON.stringify({
          email: user.email || cleanEmail,
          role: role,
          name: name,
          uid: user.uid,
        })
      );

      // Lock UI into redirecting state BEFORE navigating
      setRedirecting(true);

      if (role === "scanner") {
        router.push("/scanner");
      } else {
        router.push("/admin");
      }
      return;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Login failed: ${err.message || "Please verify your credentials"}`);
      setRedirecting(false);
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col items-center gap-4 bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
          <img 
            src="/sabrang-logo/Sabrang_Logo.png" 
            alt="Sabrang 2026" 
            className="h-16 w-auto object-contain drop-shadow-sm animate-pulse" 
          />
          <div className="flex items-center gap-2.5 text-slate-700 mt-2">
            <Loader2 size={18} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-widest font-space-grotesk">
              Redirecting to Dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal-scope min-h-screen bg-slate-50/70 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      <LiquidBackground />

      {/* Atmospheric Background Layer: Fine Engineering Grid */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.45] mix-blend-multiply"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)'
        }}
      />

      {/* Concentric Modernist Orbital Rings Centered Around the Login Box */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {/* Outer Ring */}
        <div className="w-[880px] h-[880px] rounded-full border border-indigo-200/50 [stroke-dasharray:6_6] animate-[spin_160s_linear_infinite]" />
        {/* Middle Ring */}
        <div className="absolute w-[680px] h-[680px] rounded-full border border-purple-200/60" />
        {/* Inner Ring with Subtle Gradient Accent */}
        <div className="absolute w-[500px] h-[500px] rounded-full border border-pink-200/50" />
        {/* Ambient Center Glow */}
        <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-indigo-300/20 via-purple-300/20 to-pink-300/20 blur-3xl" />
      </div>

      {/* Subtle Floating Decorative Festival Character Badges in the Distance */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block">
        {/* Top-Left Floating Tag */}
        <div className="absolute top-12 left-12 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xs text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sabrang 2026 • Live</span>
        </div>

        {/* Top-Right Floating Tag */}
        <div className="absolute top-12 right-12 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xs text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          JK Lakshmipat University
        </div>

        {/* Bottom-Left Metric Chip */}
        <div className="absolute bottom-12 left-12 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/70 shadow-xs">
          <p className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold">Annual Cultural Fest</p>
          <p className="text-xs font-extrabold text-slate-800 font-space-grotesk tracking-tight">The Festival of Colors & Rhythm</p>
        </div>

        {/* Bottom-Right Coordinates Chip */}
        <div className="absolute bottom-12 right-12 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/70 shadow-xs text-right">
          <p className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold">Jaipur, Rajasthan</p>
          <p className="text-xs font-mono text-slate-700 font-bold tracking-wider">26°50'N • 75°47'E</p>
        </div>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-[420px] bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[32px] p-7 sm:p-10 shadow-[0_24px_70px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.04] relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Branding Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="group mb-4 inline-block transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none">
            <img
              src="/sabrang-logo/Sabrang_Logo.png"
              alt="Sabrang 2026 Logo"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm transition-all"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-space-grotesk">
            Sabrang Portal
          </h1>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-space-grotesk">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="coordinator@sabrang.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-space-grotesk">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-black active:scale-[0.98] text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all shadow-[0_10px_25px_rgba(15,23,42,0.12)] hover:shadow-[0_15px_30px_rgba(15,23,42,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-space-grotesk"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors font-space-grotesk tracking-wide group"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Return to Sabrang 2026 Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
