'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Event } from '@/lib/types';
import { formatDate } from '@/utils';
import { useAuth } from '@/components/AuthProvider';

export default function AdminEvents() {
  const { role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Cultural' as 'Flagship' | 'Cultural' | 'Technical' | 'E-Sports' | 'Other',
    dateTime: '',
    venue: '',
    rules: '',
    maxParticipants: 100,
    prizePool: '',
    coordinatorsString: '', // "Name:Phone, Name:Phone"
  });

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchEvents();
    }
  }, [authLoading, role]);

  const fetchEvents = async () => {
    const q = query(collection(db, 'events'), orderBy('dateTime', 'asc'));
    const querySnapshot = await getDocs(q);
    setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse coordinators
      const coordinators = formData.coordinatorsString.split(',').map(s => {
        const [name, phone] = s.split(':').map(p => p.trim());
        return { name, phone: phone || '' };
      }).filter(c => c.name);

      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        dateTime: new Date(formData.dateTime),
        venue: formData.venue,
        rules: formData.rules,
        maxParticipants: Number(formData.maxParticipants),
        prizePool: formData.prizePool,
        coordinators,
        createdAt: serverTimestamp(),
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id!), data);
        alert('Event updated!');
      } else {
        await addDoc(collection(db, 'events'), data);
        alert('Event created!');
      }
      
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Error saving event.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Cultural',
      dateTime: '',
      venue: '',
      rules: '',
      maxParticipants: 100,
      prizePool: '',
      coordinatorsString: '',
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const coordsStr = (event.coordinators || []).map(c => `${c.name}:${c.phone}`).join(', ');
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      dateTime: new Date((event.dateTime as any).seconds * 1000).toISOString().slice(0, 16),
      venue: event.venue,
      rules: event.rules,
      maxParticipants: event.maxParticipants,
      prizePool: event.prizePool || '',
      coordinatorsString: coordsStr,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteDoc(doc(db, 'events', id));
      fetchEvents();
    }
  };

  if (authLoading || loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Create Event
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-12">
          <h2 className="text-xl font-bold mb-6">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input 
                type="text" required className="w-full p-2 border rounded-md"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                required className="w-full p-2 border rounded-md h-24"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="Flagship">Flagship</option>
                <option value="Cultural">Cultural</option>
                <option value="Technical">Technical</option>
                <option value="E-Sports">E-Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input 
                type="datetime-local" required className="w-full p-2 border rounded-md"
                value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input 
                type="text" required className="w-full p-2 border rounded-md"
                value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Participants</label>
              <input 
                type="number" required className="w-full p-2 border rounded-md"
                value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prize Pool</label>
              <input 
                type="text" placeholder="e.g. ₹50,000" className="w-full p-2 border rounded-md"
                value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coordinators (Format: Name:Phone, Name:Phone)</label>
              <input 
                type="text" placeholder="Rahul:9876543210, Priya:9876543211" className="w-full p-2 border rounded-md"
                value={formData.coordinatorsString} onChange={e => setFormData({...formData, coordinatorsString: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Rules (Long Text)</label>
              <textarea 
                required className="w-full p-2 border rounded-md h-32"
                value={formData.rules} onChange={e => setFormData({...formData, rules: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-4">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Event</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Venue</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Prize</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{event.title}</td>
                <td className="px-6 py-4 text-sm"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{event.category}</span></td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatDate(event.dateTime)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{event.venue}</td>
                <td className="px-6 py-4 text-sm font-bold text-amber-600">{event.prizePool || '-'}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => handleEdit(event)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button>
                  <button onClick={() => handleDelete(event.id!)} className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
