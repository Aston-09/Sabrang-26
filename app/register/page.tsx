'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignIn from '@/components/GoogleSignIn';
import { validateName, validateEmail, sanitizeInput } from '@/utils';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      // Validate first name
      const firstNameValidation = validateName(firstName);
      if (!firstNameValidation.isValid) {
        setError(`First Name: ${firstNameValidation.error}`);
        setLoading(false);
        return;
      }

      // Validate last name
      const lastNameValidation = validateName(lastName);
      if (!lastNameValidation.isValid) {
        setError(`Last Name: ${lastNameValidation.error}`);
        setLoading(false);
        return;
      }

      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Invalid email');
        setLoading(false);
        return;
      }

      // Sanitize inputs
      const sanitizedFirstName = sanitizeInput(firstName);
      const sanitizedLastName = sanitizeInput(lastName);
      const sanitizedEmail = emailValidation.email || email.trim().toLowerCase();

      // Validate password length
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const user = userCredential.user;

      // Combine first and last name
      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim();

      await updateProfile(user, { displayName: fullName });

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: fullName,
        email: sanitizedEmail,
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">First Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-md"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Last Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-md"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              suppressHydrationWarning
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            suppressHydrationWarning
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
            suppressHydrationWarning
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
