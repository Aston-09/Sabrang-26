'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Coupon, CouponDiscountType } from '../../../lib/types';
import { Plus, Tag, Check, X, Edit3, Trash2, Power, AlertCircle, Percent, DollarSign, Calendar, Layers } from 'lucide-react';

const DEFAULT_SABRANG_EVENTS = [
  { id: 'panache', title: 'PANACHE - Fashion & Runway Show' },
  { id: 'echoes-of-noor', title: 'ECHOES OF NOOR - Sufi Night & Acoustics' },
  { id: 'sync', title: 'SYNC - Group Dance Showdown' },
  { id: 'step-up', title: 'STEP-UP - Solo Dance Competition' },
  { id: 'bandjam', title: 'BANDJAM - Battle of Bands' },
  { id: 'versevaad', title: 'VERSEVAAD - Literary & Slam Poetry' },
  { id: 'valorant', title: 'VALORANT SHOWDOWN - E-Sports' },
  { id: 'dj-night', title: 'CELEBRITY PRO-SHOW & DJ NIGHT' },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [availableEvents, setAvailableEvents] = useState<{ id: string; title: string }[]>(DEFAULT_SABRANG_EVENTS);
  const [loading, setLoading] = useState(true);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState<string | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(20);
  const [applyToAllEvents, setApplyToAllEvents] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventSearch, setEventSearch] = useState('');

  // 1. Fetch live coupons from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      const fetched: Coupon[] = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code || docSnap.id,
          discountType: data.discountType || (data.discountPercentage !== undefined ? 'percentage' : 'fixed'),
          discountValue: data.discountValue ?? (data.discountType === 'percentage' ? (data.discountPercentage ?? 0) : (data.amount ?? 0)),
          amount: data.amount,
          discountPercentage: data.discountPercentage,
          applicableEvents: data.applicableEvents || ['ALL'],
          expiryDate: data.expiryDate,
          maxUses: data.maxUses,
          usedCount: data.usedCount || 0,
          active: data.active !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Coupon;
      });

      // Sort by newest first
      fetched.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
        const timeB = (b.createdAt as any)?.toMillis?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
        return timeB - timeA;
      });

      setCoupons(fetched);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Fetch live events list from Firestore
  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      if (!snap.empty) {
        const dbEvents = snap.docs.map(d => ({
          id: d.id,
          title: d.data().title || d.id,
        }));
        
        // Merge with defaults to ensure all flagship events are selectable
        const merged = [...dbEvents];
        DEFAULT_SABRANG_EVENTS.forEach(defEvt => {
          if (!merged.some(e => e.title.toLowerCase() === defEvt.title.toLowerCase())) {
            merged.push(defEvt);
          }
        });
        setAvailableEvents(merged);
      }
    }, (err) => {
      console.warn("Coupons events listener notice:", err?.message);
    });

    return () => unsubEvents();
  }, []);

  // Filtered events for multi-select search
  const filteredEventOptions = useMemo(() => {
    if (!eventSearch.trim()) return availableEvents;
    const q = eventSearch.toLowerCase();
    return availableEvents.filter(e => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
  }, [availableEvents, eventSearch]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentCouponId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setApplyToAllEvents(true);
    setSelectedEvents([]);
    setExpiryDate('');
    setMaxUses('');
    setIsActive(true);
    setEventSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setIsEditing(true);
    setCurrentCouponId(coupon.id || coupon.code);
    setCode(coupon.code);
    const type: CouponDiscountType = coupon.discountType || (coupon.discountPercentage !== undefined ? 'percentage' : 'fixed');
    setDiscountType(type);
    setDiscountValue(coupon.discountValue ?? (type === 'percentage' ? (coupon.discountPercentage ?? 0) : (coupon.amount ?? 0)));
    
    const isAll = !coupon.applicableEvents || coupon.applicableEvents.length === 0 || coupon.applicableEvents.includes('ALL') || coupon.applicableEvents.includes('*');
    setApplyToAllEvents(isAll);
    setSelectedEvents(isAll ? [] : (coupon.applicableEvents || []));
    
    if (coupon.expiryDate) {
      try {
        const d = coupon.expiryDate instanceof Date 
          ? coupon.expiryDate 
          : (typeof (coupon.expiryDate as any)?.toDate === 'function' ? (coupon.expiryDate as any).toDate() : new Date(coupon.expiryDate as any));
        setExpiryDate(d.toISOString().split('T')[0]);
      } catch {
        setExpiryDate('');
      }
    } else {
      setExpiryDate('');
    }
    
    setMaxUses(coupon.maxUses !== undefined ? coupon.maxUses : '');
    setIsActive(coupon.active);
    setEventSearch('');
    setIsModalOpen(true);
  };

  const toggleEventSelection = (eventTitleOrId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventTitleOrId)) {
        return prev.filter(e => e !== eventTitleOrId);
      } else {
        return [...prev, eventTitleOrId];
      }
    });
  };

  const selectAllEvents = () => {
    setSelectedEvents(availableEvents.map(e => e.title));
  };

  const clearEventSelection = () => {
    setSelectedEvents([]);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toLowerCase();

    if (!cleanCode) return alert('Please enter a coupon code.');
    if (discountValue === '' || Number(discountValue) < 0) return alert('Please enter a valid non-negative value.');

    if (discountType === 'percentage' && (Number(discountValue) < 0 || Number(discountValue) > 100)) {
      return alert('Percentage discount must be between 0% and 100%.');
    }

    if (!applyToAllEvents && selectedEvents.length === 0) {
      return alert('Please select at least one applicable event or choose "Apply to All Events".');
    }

    const applicableEventsList = applyToAllEvents ? ['ALL'] : selectedEvents;

    setIsSubmitting(true);
    try {
      const couponPayload: any = {
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        applicableEvents: applicableEventsList,
        active: isActive,
        updatedAt: serverTimestamp(),
      };

      if (discountType === 'fixed') {
        couponPayload.amount = Number(discountValue);
      }
      if (discountType === 'percentage') {
        couponPayload.discountPercentage = Number(discountValue);
      }

      if (expiryDate) {
        couponPayload.expiryDate = new Date(expiryDate);
      } else {
        couponPayload.expiryDate = null;
      }

      if (maxUses !== '') {
        couponPayload.maxUses = Number(maxUses);
      }

      if (!isEditing) {
        couponPayload.createdAt = serverTimestamp();
        couponPayload.usedCount = 0;
        await setDoc(doc(db, 'coupons', cleanCode), couponPayload);
        await logAdminAction(
          'CREATE_COUPON',
          'coupons',
          `Created coupon ${cleanCode}: ${discountType === 'percentage' ? `${discountValue}% OFF` : `Fixed ₹${discountValue}`} for [${applicableEventsList.join(', ')}]`
        );
      } else {
        const targetId = (currentCouponId || cleanCode).trim().toLowerCase();
        await updateDoc(doc(db, 'coupons', targetId), couponPayload);
        await logAdminAction(
          'UPDATE_COUPON',
          'coupons',
          `Updated coupon ${targetId}: ${discountType === 'percentage' ? `${discountValue}% OFF` : `Fixed ₹${discountValue}`} for [${applicableEventsList.join(', ')}]`
        );
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      alert(`Failed to save coupon: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this coupon?`)) return;

    try {
      await updateDoc(doc(db, 'coupons', id), {
        active: !currentStatus,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('UPDATE_COUPON', 'coupons', `${!currentStatus ? 'Enabled' : 'Disabled'} coupon: ${id}`);
    } catch (error) {
      console.error("Error toggling coupon:", error);
      alert('Failed to update coupon status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${id}"?`)) return;

    try {
      await deleteDoc(doc(db, 'coupons', id));
      await logAdminAction('DELETE_COUPON', 'coupons', `Deleted coupon: ${id}`);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert('Failed to delete coupon.');
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Coupons & Promotional Discounts</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
            Configure percentage discounts, fixed prices, and multi-event applicability
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 w-16 text-center">S.No</th>
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount Type & Value</th>
                  <th className="p-4">Applicable Events</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {coupons.map((coupon, idx) => {
                  const isPercentage = coupon.discountType === 'percentage';
                  const isAllEvents = !coupon.applicableEvents || coupon.applicableEvents.length === 0 || coupon.applicableEvents.includes('ALL') || coupon.applicableEvents.includes('*');

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors font-medium">
                      <td className="p-4 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                            <Tag size={14} />
                          </div>
                          <span className="font-mono font-bold text-sm lowercase text-slate-900 tracking-wide">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {isPercentage ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-bold">
                            <Percent size={13} />
                            <span>{coupon.discountValue}% OFF</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold">
                            <span>Fixed ₹{Number(coupon.discountValue).toFixed(2)}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        {isAllEvents ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            All Events
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {coupon.applicableEvents?.slice(0, 2).map((evt, eIdx) => (
                              <span key={eIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[140px]" title={evt}>
                                {evt}
                              </span>
                            ))}
                            {(coupon.applicableEvents?.length || 0) > 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                +{(coupon.applicableEvents?.length || 0) - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          coupon.active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${coupon.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {coupon.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => openEditModal(coupon)}
                          title="Edit Coupon"
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(coupon.id || coupon.code, coupon.active)}
                          title={coupon.active ? 'Disable Coupon' : 'Enable Coupon'}
                          className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                            coupon.active 
                              ? 'border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50' 
                              : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          <Power size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id || coupon.code)}
                          title="Delete Coupon"
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <Tag size={28} className="text-slate-300" />
                        <p>No coupons created yet. Click "Create Coupon" to add your first promotional discount.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? `Edit Coupon (${code})` : 'Create New Coupon'}
      >
        <form onSubmit={handleSaveCoupon} className="space-y-6 text-slate-900 font-sans">
          {/* Coupon Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Coupon Code
              </label>
              <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Format: 202Xb... (lowercase)
              </span>
            </div>
            <input 
              type="text" 
              required
              disabled={isEditing}
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g. 2024btech042 or 2025bba100"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all lowercase tracking-wider font-mono placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Coupon codes are accepted in lowercase (e.g. 2024btech001, 2025bdes010, 2026bba005).
            </p>
          </div>

          {/* Discount Type Radio/Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDiscountType('percentage')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  discountType === 'percentage'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Percent size={15} />
                <span>Percentage (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  discountType === 'fixed'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>₹ Fixed Price</span>
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {discountType === 'percentage' ? 'Discount Value (%)' : 'Final Payable Price (₹)'}
            </label>
            <div className="relative">
              <input 
                type="number" 
                required
                min="0"
                max={discountType === 'percentage' ? 100 : undefined}
                step={discountType === 'percentage' ? '1' : 'any'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={discountType === 'percentage' ? 'e.g. 20 (for 20% OFF)' : 'e.g. 300 (customer pays exactly ₹300)'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {discountType === 'percentage' ? '%' : 'INR (₹)'}
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              {discountType === 'percentage' ? (
                <>Formula: Final = Original - (Original × {discountValue || 0} / 100). Example: ₹500 event with {discountValue || 0}% discount = ₹{Math.max(0, 500 - (500 * (Number(discountValue) || 0) / 100))}.</>
              ) : (
                <>Formula: Final = Fixed Price (₹{discountValue || 0}). The attendee will pay exactly ₹{discountValue || 0} (not treated as a discount deduction).</>
              )}
            </p>
          </div>

          {/* Multi-Event Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Applicable Events
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApplyToAllEvents(!applyToAllEvents)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    applyToAllEvents 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {applyToAllEvents ? '✓ All Events Enabled' : 'Select Specific Events'}
                </button>
              </div>
            </div>

            {!applyToAllEvents && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                {/* Search & Bulk Select */}
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search events..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllEvents}
                      className="text-[10px] font-bold uppercase text-purple-600 hover:text-purple-800 px-2 py-1 bg-purple-50 rounded border border-purple-200 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearEventSelection}
                      className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-800 px-2 py-1 bg-white rounded border border-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Event Checkboxes */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredEventOptions.map((evt) => {
                    const isChecked = selectedEvents.includes(evt.title) || selectedEvents.includes(evt.id);

                    return (
                      <label
                        key={evt.id}
                        className={`flex items-center gap-3 p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-50/80 text-purple-900 font-bold' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEventSelection(evt.title)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                        />
                        <span className="flex-1">{evt.title}</span>
                      </label>
                    );
                  })}

                  {filteredEventOptions.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">No matching events found.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Selected: <strong className="text-purple-600">{selectedEvents.length}</strong> event{selectedEvents.length === 1 ? '' : 's'}</span>
                  <span>Coupon only valid for checked events</span>
                </div>
              </div>
            )}
          </div>

          {/* Expiry Date (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Expiry Date (Optional)
              </label>
              <input 
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Usage Limit (Optional)
              </label>
              <input 
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Unlimited if empty"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-800">Coupon Active Status</p>
              <p className="text-[11px] text-slate-500">Enable or disable coupon redemption immediately</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Coupon')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
