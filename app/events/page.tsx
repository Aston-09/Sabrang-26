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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Flagship', 'Cultural', 'Technical', 'E-Sports', 'Other'];

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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="text-center mt-20">Loading events...</div>;

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Upcoming Events</h1>
          <p className="text-slate-500 font-medium">Discover and register for the best festival experiences.</p>
        </div>
        
        <div className="w-full md:w-auto relative">
          <input 
            type="text" 
            placeholder="Search events..." 
            className="w-full md:w-80 p-3 pl-10 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>

      <div className="mb-10 flex items-center gap-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col h-full hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider">
                  {event.category}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(event.dateTime)}</span>
              </div>
              
              <h2 className="text-2xl font-black mb-3 line-clamp-1 text-slate-900 group-hover:text-indigo-600 transition-colors">
                {event.title}
              </h2>
              <p className="text-slate-500 text-sm mb-8 flex-grow line-clamp-3 leading-relaxed">
                {event.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Venue</span>
                  <span className="text-sm font-bold text-slate-700">{event.venue}</span>
                </div>
                <Link 
                  href={`/events/${event.id}`}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-600 transition-all hover:scale-105"
                >
                  Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-slate-300 mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No events match your criteria</h3>
            <p className="text-slate-500">Try adjusting your search or category filters.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}
              className="mt-6 text-indigo-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
