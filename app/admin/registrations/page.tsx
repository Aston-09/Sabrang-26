'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';

// ============================================================================
// BESPOKE CUSTOM GEOMETRIC SVG ICONS (Gradient-free, Sharp, Heavy-mitre)
// ============================================================================

const CustomUsersIcon = ({ className = '', size = 20 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="14" width="7" height="7" />
    <circle cx="6.5" cy="7.5" r="3.5" />
    <rect x="14" y="14" width="7" height="7" />
    <circle cx="17.5" cy="7.5" r="3.5" />
  </svg>
);

const CustomDownloadIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CustomSheetIcon = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CustomEyeIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CustomSearchIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="10" cy="10" r="6" />
    <line x1="14.5" y1="14.5" x2="21" y2="21" />
  </svg>
);

const CustomFilterIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CustomMailIcon = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// ============================================================================
// REGISTRATIONS VIEW Component
// ============================================================================

export default function Registrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending' | 'declined'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'unsent'>('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [emailSendingState, setEmailSendingState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [emailSendingMessage, setEmailSendingMessage] = useState('');
  const [serviceEnabled, setServiceEnabled] = useState(true);

  const [reconciling, setReconciling] = useState(false);
  const [reconMessage, setReconMessage] = useState('');
  const [reconState, setReconState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  const handleTriggerReconcile = async () => {
    if (!confirm('Are you sure you want to run the 9 PM reconciliation sync now?')) return;
    setReconState('running');
    setReconMessage('Starting reconciliation...');
    setReconciling(true);
    try {
      const res = await fetch('/api/admin/reconcile-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReconState('done');
        setReconMessage(data.message || 'Reconciliation completed successfully!');
      } else {
        setReconState('error');
        setReconMessage(data.error || data.message || 'Reconciliation failed.');
      }
    } catch (err: any) {
      setReconState('error');
      setReconMessage(err.message || 'An error occurred.');
    } finally {
      setReconciling(false);
      setTimeout(() => {
        setReconState('idle');
        setReconMessage('');
      }, 6000);
    }
  };

  // 1. Fetch Registrations Data& Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 50;

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'registrations'), orderBy('registeredAt', 'desc')),
      (snap) => {
        const allRegs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const validRegs = allRegs.filter((reg: any) => reg.name && reg.name.trim() !== '');
        setRegistrations(validRegs);
        setLoading(false);
      },
      (err) => {
        console.warn("Registrations listener restricted:", err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 1. Apply search and dropdown filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesSearch = 
        (reg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.phone || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'entered' && reg.hasEntered) ||
        (statusFilter === 'pending' && !reg.hasEntered && reg.status !== 'declined') ||
        (statusFilter === 'declined' && reg.status === 'declined');

      const matchesEmail = 
        emailFilter === 'all' ||
        (emailFilter === 'sent' && reg.emailSent) ||
        (emailFilter === 'unsent' && !reg.emailSent);

      return matchesSearch && matchesStatus && matchesEmail;
    });
  }, [registrations, searchQuery, statusFilter, emailFilter]);

  // Reset pagination on search query or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, emailFilter]);

  // 2. Apply sorting
  const sortedRegistrations = useMemo(() => {
    const sorted = [...filteredRegistrations].sort((a, b) => {
      // Prioritize test registrations at the top
      if (a.isTest && !b.isTest) return -1;
      if (!a.isTest && b.isTest) return 1;

      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'registeredAt') {
        valA = valA?.toMillis() || 0;
        valB = valB?.toMillis() || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRegistrations, sortField, sortOrder]);

  // 3. Paginate
  const paginatedRegistrations = sortedRegistrations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sortedRegistrations.length / itemsPerPage);

  // Calculate Today's Registrations
  const todaysRegistrationsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return registrations.filter(reg => {
      if (!reg.registeredAt) return false;
      const regDate = reg.registeredAt.toDate();
      return regDate >= today;
    }).length;
  }, [registrations]);

  // Excel (.xlsx) export
  const exportExcel = async () => {
    const headers = [
      'S.No',
      'Registration Number', 
      'Student Name', 
      'Gender', 
      'Application Number', 
      'Phone Number', 
      'Parent Name', 
      'Parent Phone', 
      'Student Email', 
      'Parent Email', 
      'Pincode', 
      'State',
      'Course', 
      'Payment Amount', 
      'Received Amount', 
      'Date Of Payment', 
      'UTR No.', 
      'Bank Reference No.', 
      'Settlement ID', 
      'Transaction ID'
    ];

    const formatSinglePhone = (phone: string): string => {
      if (!phone) return '';
      if (phone.includes(':') || phone.includes('|')) return phone;
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `+91 ${digits.slice(-10)}`;
      }
      return phone;
    };

    const rows = sortedRegistrations
      .filter(r => !r.isTest)
      .map((r, index) => {
        const pin = r.pincode || (r.address ? (r.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');
        const state = r.region || r.state || 'N/A';
        const formattedDate = r.dateOfPayment || (r.registeredAt ? r.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-') : 'N/A');
        const payAmount = r.paymentAmount ? `₹ ${r.paymentAmount}` : '₹ 2500';
        const recAmount = r.receivedAmount ? `₹ ${r.receivedAmount}` : '₹ 2500';

        return [
          index + 1,
          r.rollNumber || r.registrationNumber || 'N/A',
          r.name || '',
          r.gender || 'N/A',
          r.rollNumber || '',
          formatSinglePhone(r.phone || ''),
          r.parentName || r.fatherName || '',
          formatSinglePhone(r.parentPhone || r.fatherMobile || ''),
          r.email || '',
          r.parentEmail || r.fatherEmail || 'N/A',
          pin,
          state,
          r.course || 'N/A',
          payAmount,
          recAmount,
          formattedDate,
          r.paymentId || 'N/A',
          r.paymentId || 'N/A',
          r.settlementId || 'N/A',
          r.orderId || 'N/A'
        ];
      });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_registrations_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Registrations',
      headers,
      rows,
    });

    await logAdminAction('EXPORT_REGISTRATIONS_EXCEL', 'registrations', `Exported ${registrations.length} registrations to Excel (.xlsx)`);
  };

  const handleSyncSheet = async () => {
    setSyncState('syncing');
    setSyncMessage('Starting Google Sheet sync...');
    
    let totalSynced = 0;
    let totalFailed = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const res = await fetch('/api/admin/sync-sheet', { method: 'POST' });
        const result = await res.json();
        if (!res.ok) {
          setSyncState('error');
          setSyncMessage(result.error || 'Sync failed');
          return;
        }
        totalSynced += result.synced || 0;
        totalFailed += result.failed || 0;
        hasMore = !!result.hasMore;

        if (hasMore) {
          setSyncMessage(`Synced ${totalSynced} registrations. Continuing sync...`);
        } else {
          setSyncState('done');
          setSyncMessage(`Sheet sync completed: ${totalSynced} synced successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}.`);
        }
      }
    } catch (err: any) {
      setSyncState('error');
      setSyncMessage(err.message || 'Network error');
    } finally {
      setTimeout(() => { setSyncState('idle'); setSyncMessage(''); }, 6000);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'settlementReconciler');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setServiceEnabled(docSnap.data().enabled !== false);
        } else {
          await setDoc(docRef, { enabled: true, updatedAt: serverTimestamp() });
          setServiceEnabled(true);
        }
      } catch (err) {
        console.error('Failed to fetch settlement settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleService = async () => {
    const newValue = !serviceEnabled;
    setServiceEnabled(newValue);
    try {
      const docRef = doc(db, 'settings', 'settlementReconciler');
      await setDoc(docRef, {
        enabled: newValue,
        updatedAt: serverTimestamp(),
        updatedBy: 'Admin Console'
      }, { merge: true });
      await logAdminAction(
        'SETTLEMENT_TOGGLE',
        'settings/settlementReconciler',
        `Daily settlement reconciler service toggled ${newValue ? 'ON' : 'OFF'}`
      );
    } catch (err) {
      console.error('Failed to update service status:', err);
      setServiceEnabled(!newValue);
    }
  };

  const unsentCount = useMemo(() => {
    return registrations.filter(reg => !reg.emailSent).length;
  }, [registrations]);

  const unsyncedCount = useMemo(() => {
    return registrations.filter(reg => !reg.sheetSynced).length;
  }, [registrations]);

  const handleSendUnsentEmails = async () => {
    if (confirm(`Are you sure you want to send confirmation emails to all ${unsentCount} unsent users?`)) {
      setEmailSendingState('sending');
      setEmailSendingMessage(`Starting email dispatch for ${unsentCount} users...`);
      
      let totalSent = 0;
      let totalFailed = 0;
      let hasMore = true;

      try {
        while (hasMore) {
          const res = await fetch('/api/admin/resend-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sendAllUnsent: true })
          });
          const result = await res.json();
          if (!res.ok) {
            setEmailSendingState('error');
            setEmailSendingMessage(result.error || 'Failed to send emails.');
            return;
          }
          totalSent += result.sentCount || 0;
          totalFailed += result.failedCount || 0;
          hasMore = !!result.hasMore;

          if (hasMore) {
            setEmailSendingMessage(`Sent ${totalSent} emails. Continuing dispatch...`);
          } else {
            setEmailSendingState('done');
            setEmailSendingMessage(`Email dispatch complete: ${totalSent} sent successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}.`);
          }
        }
      } catch (err: any) {
        setEmailSendingState('error');
        setEmailSendingMessage(err.message || 'Network error');
      } finally {
        setTimeout(() => {
          setEmailSendingState('idle');
          setEmailSendingMessage('');
        }, 6000);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800">
      {/* Live Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Registrations</h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {loading ? '-' : registrations.length.toLocaleString('en-IN')}
          </p>
          {filteredRegistrations.length !== registrations.length && (
            <p className="text-[11px] font-medium text-purple-700 mt-2 bg-purple-50 px-2.5 py-1 border border-purple-200 rounded-md inline-block">
              Filtered matches: {filteredRegistrations.length}
            </p>
          )}
        </div>
        
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today&apos;s Registrations</h2>
          <p className="text-3xl font-bold tracking-tight text-blue-600">
            {loading ? '-' : todaysRegistrationsCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">New signups recorded today</p>
        </div>
      </div>

      {/* Main Title & Action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registration Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Verified festival participant passes and settlement records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {unsentCount > 0 && (
            <button
              onClick={handleSendUnsentEmails}
              disabled={loading || emailSendingState === 'sending'}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              {emailSendingState === 'sending' ? (
                <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              ) : (
                <CustomMailIcon size={14} />
              )}
              <span>Send Unsent ({unsentCount})</span>
            </button>
          )}
          <a 
            href="https://docs.google.com/spreadsheets/d/1Pfh7eZaknrvPEqcTjwgK1ludGjsT_OOA-KUnubzYxMc/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <CustomSheetIcon size={14} /> <span>Google Sheet</span>
          </a>
          {unsyncedCount > 0 && (
            <button
              onClick={handleSyncSheet}
              disabled={loading || syncState === 'syncing'}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              {syncState === 'syncing' ? (
                <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              ) : (
                <CustomSheetIcon size={14} />
              )}
              <span>Sync Sheet ({unsyncedCount})</span>
            </button>
          )}
          <button 
            onClick={exportExcel}
            disabled={loading || registrations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <CustomDownloadIcon size={14} /> <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Sync status feedback banner */}
      {syncState !== 'idle' && (
        <div className={`border rounded-xl px-4 py-3 text-xs font-semibold shadow-xs ${
          syncState === 'syncing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
          syncState === 'done' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Email sending status feedback banner */}
      {emailSendingState !== 'idle' && (
        <div className={`border rounded-xl px-4 py-3 text-xs font-semibold shadow-xs ${
          emailSendingState === 'sending' ? 'bg-blue-50 text-blue-800 border-blue-200' :
          emailSendingState === 'done' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {emailSendingMessage}
        </div>
      )}

      {/* Structured Filters Option Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <CustomSearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            placeholder="Search Name, Application Number, or Email..."
          />
        </div>
        
        <div className="flex items-center gap-2.5 min-w-[280px]">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Filter: All Status</option>
            <option value="entered">Checked-In</option>
            <option value="pending">Pending Check-In</option>
            <option value="declined">Declined / Blocked</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e: any) => setEmailFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Email: All</option>
            <option value="sent">Email: Sent</option>
            <option value="unsent">Email: Unsent</option>
          </select>
        </div>
      </div>

      {/* Main Table Segment */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('rollNumber')}>
                    Roll / App No {sortField === 'rollNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('email')}>
                    Contact {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('registeredAt')}>
                    Registered {sortField === 'registeredAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4">Entry Status</th>
                  <th className="p-4">Email Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedRegistrations.map((reg, idx) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-mono font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {reg.name}
                      {reg.isTest && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-medium">
                          Test
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-800 font-semibold">{reg.rollNumber || 'N/A'}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 lowercase">{reg.email}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{reg.phone}</div>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {reg.registeredAt && reg.registeredAt.toDate ? (
                        <div>
                          <div className="font-semibold text-slate-800">{reg.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-[10px] text-slate-400">{reg.registeredAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        reg.hasEntered 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : (reg.status === 'declined' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200')
                      }`}>
                        {reg.hasEntered ? 'Entered' : (reg.status === 'declined' ? 'Declined' : 'Pending')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        reg.emailSent 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {reg.emailSent ? 'Sent' : 'Unsent'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedReg(reg)} 
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <CustomEyeIcon size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium text-xs">
                      No matching registration logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredRegistrations.length} registrations)
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Details */}
      <Modal isOpen={!!selectedReg} onClose={() => setSelectedReg(null)} title="Registration Details">
        {selectedReg && (
          <div className="space-y-5 text-slate-800 text-xs">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Student Details */}
              <div className="col-span-2 border-b border-slate-200 pb-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Student Credentials</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Full Name</p>
                <p className="font-bold text-sm text-slate-900 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">{selectedReg.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Application / Roll Number</p>
                <p className="font-bold text-sm text-slate-900 bg-slate-50 p-2.5 border border-slate-200 rounded-lg font-mono">{selectedReg.rollNumber}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-xs text-slate-800 bg-slate-50 p-2.5 border border-slate-200 rounded-lg break-all lowercase">{selectedReg.email}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Phone Number</p>
                <p className="font-bold text-sm text-slate-900 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">{selectedReg.phone}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Gender</p>
                <p className="font-semibold text-xs text-slate-800 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">{selectedReg.gender || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Course</p>
                <p className="font-semibold text-xs text-slate-800 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">{selectedReg.course || 'N/A'}</p>
              </div>
              
              {/* Payment Details */}
              <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment & Security</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Payment Amount</p>
                <p className="font-bold text-slate-900 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
                  {selectedReg.paymentAmount ? `₹ ${selectedReg.paymentAmount}` : '₹ 2,500'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Transaction / Order ID</p>
                <p className="font-mono text-xs text-slate-700 bg-slate-50 p-2.5 border border-slate-200 rounded-lg break-all">{selectedReg.orderId || selectedReg.paymentId || 'N/A'}</p>
              </div>

              {/* QR Code */}
              <div className="col-span-2 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Ticket QR Code</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${selectedReg.id}`} 
                  alt="Registration QR Code" 
                  className="w-28 h-28 bg-white border border-slate-200 p-1.5 rounded-lg shadow-xs"
                />
              </div>
              
              {/* Actions */}
              <div className="col-span-2 border-t border-slate-200 pt-4 mt-2 flex flex-col sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Resend confirmation email to ${selectedReg.name} (${selectedReg.email})?`)) {
                      try {
                        const res = await fetch('/api/admin/resend-emails', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [selectedReg.id] })
                        });
                        const result = await res.json();
                        if (res.ok) {
                          alert('Email sent successfully!');
                          setSelectedReg((prev: any) => ({ ...prev, emailSent: true }));
                        } else {
                          alert(`Failed to send email: ${result.error}`);
                        }
                      } catch (err: any) {
                        alert(`Network error: ${err.message}`);
                      }
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Resend Confirmation Email
                </button>
                <a 
                  href={`/api/receipt?id=${selectedReg.id}`}
                  download
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Download Receipt PDF
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
