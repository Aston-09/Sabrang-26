"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Check default demo credentials
      if (
        (cleanEmail === "admin@sabrang.com" && password === "AdminPass123!") ||
        (cleanEmail.startsWith("scanner") && password.length >= 6) ||
        (cleanEmail === "adminsabrang@jklu.edu.in" && password === "181723891188")
      ) {
        const role = cleanEmail.includes("scanner") ? "scanner" : "admin";
        sessionStorage.setItem(
          "sabrang_auth",
          JSON.stringify({
            email: cleanEmail,
            role: role,
            name: "Sabrang Administrator",
          })
        );

        // Try Firebase Client Auth in parallel if available
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch {
          // Fallback handled via sessionStorage
        }

        window.location.href = "/admin";
        return;
      }

      // Standard Firebase Client Authentication
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.exists() ? (userDoc.data()?.role || "admin") : "admin";
          sessionStorage.setItem(
            "sabrang_auth",
            JSON.stringify({
              email: cleanEmail,
              role: role,
              name: user.displayName || "Administrator",
            })
          );
        } catch {
          sessionStorage.setItem(
            "sabrang_auth",
            JSON.stringify({
              email: cleanEmail,
              role: "admin",
              name: "Administrator",
            })
          );
        }

        window.location.href = "/admin";
        return;
      } catch (clientErr: any) {
        console.warn("Client authentication failed:", clientErr);
        throw new Error("Invalid email or password. Use demo credentials or verify your Firebase account.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Sabrang Portal
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Admin & Staff Access</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@sabrang.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a26] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a26] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link href="/" className="text-xs text-neutral-400 hover:text-white transition-colors">
            ← Return to Sabrang 2026 Home
          </Link>
        </div>
      </div>
    </div>
  );
}
