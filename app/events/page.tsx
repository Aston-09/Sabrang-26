'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Event } from '@/lib/types';
import { formatDate } from '@/utils';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const q = query(collection(db, 'events'), orderBy('dateTime', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Event, 'id'>)
      }));
      setEvents(fetchedEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="text-center mt-20">Loading events...</div>;

  return (
    <div>
      <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight uppercase">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {event.category}
                </span>
                <span className="text-slate-500 text-xs">{formatDate(event.dateTime)}</span>
              </div>
              <h2 className="text-xl font-black mb-2 line-clamp-1 text-slate-900">{event.title}</h2>
              <p className="text-slate-600 text-sm mb-6 flex-grow line-clamp-3">{event.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-900">{event.venue}</span>
                </div>
                <Link 
                  href={`/events/${event.id}`}
                  className="text-indigo-600 font-semibold text-sm hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 col-span-full">No events found.</p>
        )}
      </div>
    </div>
  );
}
