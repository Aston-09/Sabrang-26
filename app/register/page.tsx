'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignIn from '@/components/GoogleSignIn';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      <h1 className="text-3xl font-black mb-6 text-center text-slate-900">Join Sabrang</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Full Name</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Password</label>
          <input
            type="password"
            required
            className="w-full p-2 border rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <GoogleSignIn />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="text-indigo-600">Login</Link>
      </p>
    </div>
  );
}
