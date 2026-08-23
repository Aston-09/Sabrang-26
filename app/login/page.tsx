"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
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

      // Secure Firebase Client Authentication (no hardcoded passwords)
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      let role = "admin";
      let name = user.displayName || "Administrator";

      try {
        const [userDoc, roleDoc] = await Promise.all([
          getDoc(doc(db, "users", user.uid)).catch(() => null),
          getDoc(doc(db, "roles", user.uid)).catch(() => null),
        ]);

        if (userDoc?.exists()) {
          role = userDoc.data()?.role || "admin";
          name = userDoc.data()?.name || name;
        } else if (roleDoc?.exists()) {
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

      if (role === "scanner") {
        router.push("/admin/scanner");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Authentication failed:", err?.code || err?.message);
      setError("Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal-scope min-h-screen bg-[#07070a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Sabrang Portal
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Authorized Access Only</p>
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
              placeholder="Enter your email"
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
            {loading ? "Verifying..." : "Sign In"}
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
