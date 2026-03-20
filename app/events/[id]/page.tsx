'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Event } from '@/lib/types';
import { formatDate, generateId, generateReferralCode } from '@/utils';
import { useAuth } from '@/components/AuthProvider';

export default function EventDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, 'events', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...(docSnap.data() as Omit<Event, 'id'>) });
        
        if (user) {
          // Check if already registered
          const q = query(
            collection(db, 'registrations'), 
            where('userId', '==', user.uid),
            where('eventId', '==', id)
          );
          const regSnap = await getDocs(q);
          setIsRegistered(!regSnap.empty);
        }
      }
      setLoading(false);
    };

    fetchEvent();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setRegistering(true);
    try {
      const qrCode = generateId();
      const referralCode = generateReferralCode();
      await addDoc(collection(db, 'registrations'), {
        userId: user.uid,
        eventId: id,
        qrCode,
        referralCode,
        attended: false,
        createdAt: serverTimestamp(),
      });
      setIsRegistered(true);
      alert('Registered successfully!');
    } catch (err) {
      console.error(err);
      alert('Error registering for event.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="text-center mt-20">Loading event...</div>;
  if (!event) return <div className="text-center mt-20">Event not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block">
              {event.category}
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{event.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-900">{formatDate(event.dateTime)}</div>
            <div className="text-slate-500 font-medium">{event.venue}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">About the Event</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-3">Rules & Guidelines</h2>
              <div className="bg-slate-50 p-6 rounded-xl text-slate-700 text-sm whitespace-pre-line border border-slate-100 italic">
                {event.rules}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white text-center">
              <div className="text-sm opacity-80 mb-2">Maximum Participants</div>
              <div className="text-4xl font-bold mb-4">{event.maxParticipants}</div>
              
              {event.prizePool && (
                <div className="mb-6">
                  <div className="text-sm opacity-80 mb-1">Total Prize Pool</div>
                  <div className="text-2xl font-extrabold text-amber-300 uppercase tracking-wider">{event.prizePool}</div>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={isRegistered || registering}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${
                  isRegistered 
                    ? 'bg-indigo-500 text-white cursor-not-allowed opacity-50' 
                    : 'bg-white text-indigo-600 hover:scale-105 active:scale-95'
                }`}
              >
                {registering ? 'Processing...' : isRegistered ? 'Already Registered' : 'Register Now'}
              </button>
              {isRegistered && (
                <p className="mt-3 text-xs text-indigo-100 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Check dashboard for QR code
                </p>
              )}
            </div>
            
            <div className="border border-slate-100 rounded-2xl p-6">
              <h3 className="font-bold mb-4 text-slate-900">Event Coordinators</h3>
              <div className="space-y-4">
                {event.coordinators && event.coordinators.length > 0 ? (
                  event.coordinators.map((c, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900">{c.name}</span>
                      <a href={`tel:${c.phone}`} className="text-xs text-indigo-600 font-medium hover:underline">
                        {c.phone}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">Contact venue for details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
