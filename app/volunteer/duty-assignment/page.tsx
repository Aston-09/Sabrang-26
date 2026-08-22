'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Search, 
  Filter, 
  Plus, 
  RotateCcw 
} from 'lucide-react';
import { SCHEDULE_DATA } from '@/constants/events';
import { SearchableVenueSelect } from '@/components/ui/SearchableVenueSelect';

// ============================================================================
// CONSTANTS, CONFIGURATION & HELPERS
// ============================================================================

// Dynamic mapping from schedule day dates (e.g. "July 14") to ISO strings ("2026-07-14")
const mapScheduleDateToISO = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return '';
  const monthName = parts[0];
  const dayNum = parseInt(parts[1], 10);
  
  const months: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  const monthNum = months[monthName.toLowerCase()];
  if (!monthNum || isNaN(dayNum)) return '';
  
  return `2026-${monthNum}-${String(dayNum).padStart(2, '0')}`;
};

// Convert 12-hour formatted time (e.g. "7:30 AM") to 24-hour time (e.g. "07:30")
const convert12to24 = (time12: string) => {
  if (!time12) return '';
  const clean = time12.trim();
  const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

// Parse time string in "HH:MM" format to minutes since midnight
const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

// Parse single/range event times
const parseEventTimes = (timeRangeStr: string) => {
  if (!timeRangeStr) return { from: '09:00', to: '10:00' };
  
  const cleanStr = timeRangeStr.trim().toLowerCase();
  if (cleanStr.includes('all day')) {
    return { from: '00:00', to: '23:59' };
  }

  const parts = timeRangeStr.split('-');
  if (parts.length === 2) {
    const from24 = convert12to24(parts[0]);
    const to24 = convert12to24(parts[1]);
    return {
      from: from24 || '09:00',
      to: to24 || '10:00'
    };
  } else {
    const from24 = convert12to24(timeRangeStr);
    if (from24) {
      const [h, m] = from24.split(':').map(Number);
      const toHour = (h + 1) % 24;
      const to24 = `${String(toHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return { from: from24, to: to24 };
    }
  }
  return { from: '09:00', to: '10:00' };
};

// Find event locations that overlap with the selected time slot on the selected date
const getOverlappingEventLocations = (events: any[], start: string, end: string) => {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin >= endMin) return [];

  const locations: string[] = [];
  events.forEach((evt) => {
    if (!evt.location) return;
    const evtTimes = parseEventTimes(evt.time);
    const evtStartMin = parseTimeToMinutes(evtTimes.from);
    const evtEndMin = parseTimeToMinutes(evtTimes.to);

    // Overlap formula: startA < endB && endA > startB
    if (startMin < evtEndMin && endMin > evtStartMin) {
      if (!locations.includes(evt.location)) {
        locations.push(evt.location);
      }
    }
  });
  return locations;
};

const VENUES = [
  'Tech Lawn',
  'Tech Block',
  'Sabrang Ground',
  'IET Amphitheatre',
  'IM Amphiitheatre',
  'LRC Stairs'
];

const DUTY_DATES = [
  { value: '2026-07-12', label: 'July 12' },
  { value: '2026-07-13', label: 'July 13' },
  { value: '2026-07-14', label: 'July 14 (Day 01)' },
  { value: '2026-07-15', label: 'July 15 (Day 02)' },
  { value: '2026-07-16', label: 'July 16 (Day 03)' },
  { value: '2026-07-17', label: 'July 17 (Day 04)' },
  { value: '2026-07-18', label: 'July 18 (Day 05)' },
  { value: '2026-07-19', label: 'July 19 (Day 06)' },
  { value: '2026-07-20', label: 'July 20 (Day 07)' },
  { value: '2026-07-21', label: 'July 21 (Day 08)' }
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeamLeaderDutyAssignment() {
  const router = useRouter();
  
  // Auth and Profile States
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // DB Collections States
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [dutyAssignments, setDutyAssignments] = useState<any[]>([]);
  const [dutiesLoading, setDutiesLoading] = useState(true);

  // Form State
  const [selectedDate, setSelectedDate] = useState('2026-07-14');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<any[]>([]);
  const [timeFrom, setTimeFrom] = useState('09:00');
  const [timeTo, setTimeTo] = useState('13:00');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  
  // Volunteer Search State
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [editingDuty, setEditingDuty] = useState<any>(null);
  const [deletingDuty, setDeletingDuty] = useState<any>(null);

  // Edit Form Fields State
  const [editDate, setEditDate] = useState('');
  const [editTimeFrom, setEditTimeFrom] = useState('');
  const [editTimeTo, setEditTimeTo] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editEventTitle, setEditEventTitle] = useState('');

  // Validation Warnings
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [editWarning, setEditWarning] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // AUTH GUARD & REAL-TIME DATA SYNCRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth || !db) {
      setAuthLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;
    let unsubVolunteers: (() => void) | undefined;
    let unsubDuties: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      let activeUid = '';
      let isLocalTL = false;
      if (user) {
        activeUid = user.uid;
      } else {
        const stored = localStorage.getItem('aarambh_session');
        if (stored) {
          try {
            const session = JSON.parse(stored);
            activeUid = session.uid;
            if (session.role === 'team_leader') {
              isLocalTL = true;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (!activeUid) {
        router.push('/login');
        return;
      }

      if (isLocalTL) {
        setIsAuthorized(true);
      }

      // Profile real-time snapshot
      unsubProfile = onSnapshot(doc(db, 'volunteers', activeUid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          if (data.role === 'Team Leader') {
            setIsAuthorized(true);
          } else {
            router.push('/volunteer');
          }
        } else {
          router.push('/login');
        }
        setAuthLoading(false);
      }, (err) => {
        console.error("Auth guard check failed:", err);
        router.push('/login');
        setAuthLoading(false);
      });

      // Synchronize Volunteers
      unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
        setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn("Volunteers snapshot listener error:", err);
      });

      // Synchronize Duties
      unsubDuties = onSnapshot(collection(db, 'dutyAssignments'), (snap) => {
        setDutyAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setDutiesLoading(false);
      }, (err) => {
        console.warn("Duties snapshot listener error:", err);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubVolunteers) unsubVolunteers();
      if (unsubDuties) unsubDuties();
    };
  }, [router]);

  // Dynamically compute unique teams/committees from fetched volunteers (excluding 'Organizing Head')
  const dynamicTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    volunteers.forEach((v) => {
      if (v.team && v.team.toLowerCase() !== 'organizing head') {
        teamsSet.add(v.team);
      }
    });
    return Array.from(teamsSet).sort();
  }, [volunteers]);

  // Get events scheduled for the currently selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    if (isNaN(dateObj.getTime())) return [];
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthStr = monthNames[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    const formattedDate = `${monthStr} ${dayNum}`;
    
    const daySchedule = SCHEDULE_DATA.find(
      (d) => d.date.trim().toLowerCase() === formattedDate.trim().toLowerCase()
    );
    return daySchedule ? daySchedule.events : [];
  }, [selectedDate]);

  // Get events scheduled for the currently editing date
  const eventsForEditDate = useMemo(() => {
    if (!editDate) return [];
    const dateObj = new Date(editDate);
    if (isNaN(dateObj.getTime())) return [];
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthStr = monthNames[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    const formattedDate = `${monthStr} ${dayNum}`;
    
    const daySchedule = SCHEDULE_DATA.find(
      (d) => d.date.trim().toLowerCase() === formattedDate.trim().toLowerCase()
    );
    return daySchedule ? daySchedule.events : [];
  }, [editDate]);

  // Dynamically computed venue options based on overlap with selected date & times
  const { suggestedVenues, standardVenues } = useMemo(() => {
    const overlappingLocs = getOverlappingEventLocations(eventsForSelectedDate, timeFrom, timeTo);
    const std = VENUES.filter(v => !overlappingLocs.includes(v));
    return {
      suggestedVenues: overlappingLocs,
      standardVenues: std
    };
  }, [eventsForSelectedDate, timeFrom, timeTo]);

  const isCustomVenue = useMemo(() => {
    return !!(selectedVenue && !suggestedVenues.includes(selectedVenue) && !standardVenues.includes(selectedVenue));
  }, [selectedVenue, suggestedVenues, standardVenues]);

  // Dynamically computed venue options for edit modal
  const { editSuggestedVenues, editStandardVenues } = useMemo(() => {
    const overlappingLocs = getOverlappingEventLocations(eventsForEditDate, editTimeFrom, editTimeTo);
    const std = VENUES.filter(v => !overlappingLocs.includes(v));
    return {
      editSuggestedVenues: overlappingLocs,
      editStandardVenues: std
    };
  }, [eventsForEditDate, editTimeFrom, editTimeTo]);

  const isEditCustomVenue = useMemo(() => {
    return !!(editVenue && !editSuggestedVenues.includes(editVenue) && !editStandardVenues.includes(editVenue));
  }, [editVenue, editSuggestedVenues, editStandardVenues]);

  // --------------------------------------------------------------------------
  // TIME VALIDATION & DUPLICATION CHECKS
  // --------------------------------------------------------------------------

  const checkOverlappingDuty = (volId: string, date: string, start: string, end: string, excludeId?: string) => {
    const startMin = parseTimeToMinutes(start);
    const endMin = parseTimeToMinutes(end);

    if (startMin >= endMin) {
      return "End time must be after start time.";
    }

    const overlap = dutyAssignments.find((duty) => {
      if (duty.volunteerId !== volId || duty.dutyDate !== date) return false;
      if (excludeId && duty.id === excludeId) return false;

      const dutyStart = parseTimeToMinutes(duty.timeFrom);
      const dutyEnd = parseTimeToMinutes(duty.timeTo);

      return startMin < dutyEnd && endMin > dutyStart;
    });

    if (overlap) {
      return `Overlap detected: ${overlap.volunteerName} is already assigned to "${overlap.venue}" from ${overlap.timeFrom} to ${overlap.timeTo} on this date.`;
    }

    return null;
  };

  // --------------------------------------------------------------------------
  // ACTIONS / HANDLERS
  // --------------------------------------------------------------------------
  const handleAssignDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormWarning(null);

    if (!selectedDate) return setFormWarning("Please select a date.");
    if (!selectedTeam) return setFormWarning("Please select a team.");
    if (selectedVolunteers.length === 0) return setFormWarning("Please select at least one volunteer.");
    if (!selectedVenue) return setFormWarning("Please select a venue.");

    // Perform overlap checks
    for (const vol of selectedVolunteers) {
      const overlapError = checkOverlappingDuty(vol.id, selectedDate, timeFrom, timeTo);
      if (overlapError) {
        setFormWarning(overlapError);
        return;
      }
    }

    try {
      const batch = writeBatch(db);
      const tlEmail = profile?.email || auth?.currentUser?.email || auth?.currentUser?.uid || 'Team Leader';

      selectedVolunteers.forEach((vol) => {
        const docRef = doc(collection(db, 'dutyAssignments'));
        batch.set(docRef, {
          volunteerId: vol.id,
          volunteerName: vol.name,
          team: vol.team,
          dutyDate: selectedDate,
          timeFrom,
          timeTo,
          venue: selectedVenue,
          notes: notes.trim(),
          eventTitle: selectedEventTitle,
          assignedBy: tlEmail,
          status: 'upcoming',
          createdAt: serverTimestamp()
        });

        // Add real-time notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          volunteerId: vol.id,
          title: selectedEventTitle ? 'New Event Duty Assigned' : 'New Duty Assigned',
          message: selectedEventTitle 
            ? `You have been assigned to "${selectedEventTitle}" at "${selectedVenue}" on ${formatDateFriendly(selectedDate)} from ${formatTime12hr(timeFrom)} to ${formatTime12hr(timeTo)}.`
            : `You have been assigned to "${selectedVenue}" on ${formatDateFriendly(selectedDate)} from ${formatTime12hr(timeFrom)} to ${formatTime12hr(timeTo)}.`,
          read: false,
          timestamp: serverTimestamp()
        });
      });

      await batch.commit();

      // Log action
      const volNames = selectedVolunteers.map(v => v.name).join(', ');
      await logAdminAction(
        'CREATE_DUTY_ASSIGNMENTS', 
        'dutyAssignments', 
        `Assigned duties to: [${volNames}] at ${selectedVenue} on ${selectedDate}${selectedEventTitle ? ` (Event: ${selectedEventTitle})` : ''}`,
        tlEmail
      );

      // Reset form fields
      setSelectedVolunteers([]);
      setNotes('');
      setSearchMemberQuery('');
    } catch (err: any) {
      console.error(err);
      setFormWarning(`Failed to assign duties: ${err.message}`);
    }
  };

  const handleResetForm = () => {
    setSelectedDate('2026-07-14');
    setSelectedTeam('');
    setSelectedVolunteers([]);
    setTimeFrom('09:00');
    setTimeTo('13:00');
    setSelectedVenue('');
    setNotes('');
    setSearchMemberQuery('');
    setSelectedEventTitle('');
    setFormWarning(null);
  };

  const handleMarkCompleted = async (duty: any) => {
    try {
      await updateDoc(doc(db, 'dutyAssignments', duty.id), {
        status: 'completed'
      });
      const performer = profile?.email || 'Team Leader';
      await logAdminAction(
        'COMPLETE_DUTY_ASSIGNMENT', 
        `dutyAssignments/${duty.id}`, 
        `Marked duty as completed for ${duty.volunteerName}`,
        performer
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenEditModal = (duty: any) => {
    setEditingDuty(duty);
    setEditDate(duty.dutyDate);
    setEditTimeFrom(duty.timeFrom);
    setEditTimeTo(duty.timeTo);
    setEditVenue(duty.venue);
    setEditStatus(duty.status);
    setEditNotes(duty.notes || '');
    setEditEventTitle(duty.eventTitle || '');
    setEditWarning(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditWarning(null);

    const overlapError = checkOverlappingDuty(
      editingDuty.volunteerId,
      editDate,
      editTimeFrom,
      editTimeTo,
      editingDuty.id
    );

    if (overlapError) {
      setEditWarning(overlapError);
      return;
    }

    try {
      await updateDoc(doc(db, 'dutyAssignments', editingDuty.id), {
        dutyDate: editDate,
        timeFrom: editTimeFrom,
        timeTo: editTimeTo,
        venue: editVenue,
        eventTitle: editEventTitle,
        status: editStatus,
        notes: editNotes.trim()
      });

      // Add real-time notification
      await addDoc(collection(db, 'notifications'), {
        volunteerId: editingDuty.volunteerId,
        title: editEventTitle ? 'Event Duty Assignment Updated' : 'Duty Assignment Updated',
        message: editEventTitle 
          ? `Your duty assignment for ${formatDateFriendly(editDate)} at "${editVenue}" ("${editEventTitle}") has been updated. Status: ${editStatus}.`
          : `Your duty assignment for ${formatDateFriendly(editDate)} at "${editVenue}" has been updated. Status: ${editStatus}.`,
        read: false,
        timestamp: serverTimestamp()
      });

      const performer = profile?.email || 'Team Leader';
      await logAdminAction(
        'EDIT_DUTY_ASSIGNMENT', 
        `dutyAssignments/${editingDuty.id}`, 
        `Updated duty details for ${editingDuty.volunteerName}${editEventTitle ? ` (Event: ${editEventTitle})` : ''}`,
        performer
      );

      setEditingDuty(null);
    } catch (err: any) {
      setEditWarning(`Failed to save edits: ${err.message}`);
    }
  };

  const handleDeleteDuty = async () => {
    if (!deletingDuty) return;

    try {
      await deleteDoc(doc(db, 'dutyAssignments', deletingDuty.id));

      // Add real-time notification
      await addDoc(collection(db, 'notifications'), {
        volunteerId: deletingDuty.volunteerId,
        title: 'Duty Assignment Removed',
        message: `Your duty assignment on ${formatDateFriendly(deletingDuty.dutyDate)} at "${deletingDuty.venue}" has been removed.`,
        read: false,
        timestamp: serverTimestamp()
      });

      const performer = profile?.email || 'Team Leader';
      await logAdminAction(
        'DELETE_DUTY_ASSIGNMENT', 
        `dutyAssignments/${deletingDuty.id}`, 
        `Removed duty for ${deletingDuty.volunteerName}`,
        performer
      );
      setDeletingDuty(null);
    } catch (err: any) {
      alert(`Error deleting duty: ${err.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // VOLUNTEER SELECTION FILTER & MULTISELECT
  // --------------------------------------------------------------------------
  const availableVolunteers = useMemo(() => {
    if (!selectedTeam) return [];
    return volunteers.filter(v => v.team === selectedTeam);
  }, [volunteers, selectedTeam]);

  // Exclude all Team Leaders (v.role !== 'Team Leader') except cohort leaders and organizing heads
  const teamMembers = useMemo(() => {
    const seen = new Set();
    const unique = [];
    const list = availableVolunteers.filter(v => 
      v.role?.toLowerCase() !== 'team leader' || 
      v.team?.toLowerCase() === 'organizing head' ||
      v.team?.toLowerCase() === 'cohort leader'
    );
    for (const v of list) {
      const key = v.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(v);
      }
    }
    return unique;
  }, [availableVolunteers]);

  // Filtered by Search Queries
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(v => 
      v.name.toLowerCase().includes(searchMemberQuery.toLowerCase())
    );
  }, [teamMembers, searchMemberQuery]);

  const toggleVolunteerSelection = (vol: any) => {
    const isSelected = selectedVolunteers.some(v => v.id === vol.id);
    if (isSelected) {
      setSelectedVolunteers(selectedVolunteers.filter(v => v.id !== vol.id));
    } else {
      setSelectedVolunteers([...selectedVolunteers, vol]);
    }
  };

  const handleRemoveVolunteer = (volId: string) => {
    setSelectedVolunteers(selectedVolunteers.filter(v => v.id !== volId));
  };

  // --------------------------------------------------------------------------
  // TABLE FILTERING & SEARCH
  // --------------------------------------------------------------------------
  const filteredDuties = useMemo(() => {
    return dutyAssignments.filter((duty) => {
      const matchesSearch = duty.volunteerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (duty.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTeam = teamFilter === 'all' || duty.team === teamFilter;
      const matchesDate = !dateFilter || duty.dutyDate === dateFilter;
      const matchesStatus = statusFilter === 'all' || duty.status === statusFilter;

      return matchesSearch && matchesTeam && matchesDate && matchesStatus;
    });
  }, [dutyAssignments, searchQuery, teamFilter, dateFilter, statusFilter]);

  // Utility to format 24-hr time format to 12-hr display
  const formatTime12hr = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${mStr} ${suffix}`;
  };

  // Formatting utility for displaying date strings
  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-10 select-none font-adminBody">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-adminHeading text-3xl font-black uppercase tracking-tight text-brand-ink mb-1.5">Duty Assignment</h1>
          <p className="text-admin-muted font-bold text-xs uppercase tracking-wider">Assign operational duties to volunteers for AARAMBH’26</p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DUTY ASSIGNMENT FORM CARD */}
      {/* ==================================================================== */}
      <div className="bg-white border-4 border-brand-ink p-8 rounded-md shadow-[6px_6px_0px_0px_#030404]">
        <h2 className="text-xs font-black uppercase tracking-widest text-brand-orange mb-6 border-b-2 border-brand-ink/10 pb-2">
          New Duty Assignment Form
        </h2>

        {formWarning && (
          <div className="mb-6 p-4 bg-brand-orange/15 text-brand-ink text-xs font-bold border-2 border-brand-ink rounded-md flex gap-3 items-center">
            <AlertCircle className="text-brand-orange shrink-0" size={18} />
            <span className="uppercase tracking-wide leading-relaxed">{formWarning}</span>
          </div>
        )}

        <form onSubmit={handleAssignDuty} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* STEP 1: Select Date */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider">
                Step 1 — Select Duty Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={16} />
                <select
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedEventTitle('');
                  }}
                  className="w-full bg-brand-cloud/45 border-2 border-brand-ink rounded-md py-3 pl-11 pr-4 text-sm text-brand-ink font-bold focus:outline-none focus:border-brand-orange focus:bg-white shadow-[2px_2px_0px_0px_#030404] transition-colors cursor-pointer"
                >
                  {DUTY_DATES.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Step: Link to Event */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider">
                Event (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={16} />
                <select
                  value={selectedEventTitle}
                  onChange={(e) => {
                    const title = e.target.value;
                    setSelectedEventTitle(title);
                    if (title) {
                      const eventObj = eventsForSelectedDate.find(evt => evt.title === title);
                      if (eventObj) {
                        const times = parseEventTimes(eventObj.time);
                        setTimeFrom(times.from);
                        setTimeTo(times.to);
                        if (eventObj.location) {
                          setSelectedVenue(eventObj.location);
                        }
                      }
                    }
                  }}
                  className="w-full bg-brand-cloud/45 border-2 border-brand-ink rounded-md py-3 pl-11 pr-4 text-sm text-brand-ink font-bold focus:outline-none focus:border-brand-orange focus:bg-white shadow-[2px_2px_0px_0px_#030404] transition-colors cursor-pointer"
                >
                  <option value="">No Event / General Duty</option>
                  {eventsForSelectedDate.length === 0 ? (
                    <option value="" disabled>No events scheduled on this date</option>
                  ) : (
                    eventsForSelectedDate.map((evt, idx) => (
                      <option key={idx} value={evt.title}>
                        {evt.title} ({evt.time})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* STEP 2: Select Team */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider">
                Step 2 — Select Team
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={16} />
                <select
                  required
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setSelectedVolunteers([]);
                    setSearchMemberQuery('');
                  }}
                  className="w-full bg-brand-cloud/45 border-2 border-brand-ink rounded-md py-3 pl-11 pr-4 text-sm text-brand-ink font-bold focus:outline-none focus:border-brand-orange focus:bg-white shadow-[2px_2px_0px_0px_#030404] transition-colors cursor-pointer"
                >
                  <option value="">Choose Team...</option>
                  {dynamicTeams.map((teamName) => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* STEP 3: Select Team Member only */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider">
                Step 3 — Select Volunteer(s)
              </label>

              {/* Pills Container for Selected Volunteers */}
              {selectedVolunteers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 bg-brand-cloud/25 p-3 border-2 border-brand-ink border-dashed rounded-md">
                  {selectedVolunteers.map((vol) => (
                    <div 
                      key={vol.id}
                      className="flex items-center gap-1.5 bg-[#ffffff] border-2 border-brand-ink rounded-md px-2.5 py-1 text-xs font-bold text-brand-ink shadow-[2px_2px_0px_0px_#030404]"
                    >
                      <User size={12} className="text-brand-blue" />
                      <span>{vol.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVolunteer(vol.id)}
                        className="text-admin-muted hover:text-brand-orange focus:outline-none transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!selectedTeam ? (
                <div className="p-8 text-center text-xs font-black uppercase tracking-wider text-admin-muted border-2 border-dashed border-brand-ink/15 rounded-md bg-brand-cloud/10">
                  Please select a Team first in Step 2 to view and assign volunteers.
                </div>
              ) : (
                <div className="bg-white border-2 border-brand-ink rounded-md shadow-[3px_3px_0px_0px_#030404] p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black uppercase text-brand-blue tracking-widest flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-blue border border-brand-ink inline-block" />
                      Volunteers
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-brand-cloud border border-brand-ink px-2 py-0.5 rounded-md shadow-[1px_1px_0px_0px_#030404]">
                      {selectedVolunteers.length} Selected
                    </span>
                  </div>

                  {/* Search box for Members */}
                  <div className="relative mb-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={13} />
                    <input
                      type="text"
                      placeholder="Search volunteer by name..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      className="w-full bg-brand-cloud/30 border-2 border-brand-ink rounded-md py-1.5 pl-8 pr-3 text-xs text-brand-ink font-bold placeholder:text-brand-ink/30 focus:outline-none focus:border-brand-orange focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Excel Grid Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 border-2 border-brand-ink rounded-md bg-brand-cloud/10">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((vol) => {
                        const isAssigned = selectedVolunteers.some(v => v.id === vol.id);
                        return (
                          <button
                            key={vol.id}
                            type="button"
                            onClick={() => toggleVolunteerSelection(vol)}
                            className={`p-3 border-2 border-brand-ink text-[10px] font-black uppercase rounded-md text-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_#030404] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#030404] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[44px] flex items-center justify-center break-words leading-tight ${
                              isAssigned 
                                ? 'bg-brand-blue text-white shadow-none translate-x-[1px] translate-y-[1px]'
                                : 'bg-white hover:bg-brand-cloud text-brand-ink'
                            }`}
                          >
                            {vol.name}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-6 text-center text-xs font-bold text-admin-muted uppercase tracking-wider">
                        No volunteers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: Duty Details - Timings */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider mb-2">
                Step 4 — Timing Slots
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-admin-muted uppercase">From</span>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" size={14} />
                    <input
                      type="time"
                      required
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md py-2.5 pl-9 pr-3 text-xs text-brand-ink font-bold focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-admin-muted uppercase">To</span>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" size={14} />
                    <input
                      type="time"
                      required
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md py-2.5 pl-9 pr-3 text-xs text-brand-ink font-bold focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: Venue Selection */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider mb-2">
                Venue Selection
              </label>
              <div className="space-y-1">
                <span className="hidden md:block text-[10px] font-black text-transparent uppercase select-none">Spacer</span>
                <SearchableVenueSelect
                  required
                  value={selectedVenue}
                  onChange={setSelectedVenue}
                  suggestedVenues={suggestedVenues}
                  standardVenues={standardVenues}
                  theme="cloud"
                  hasIcon={true}
                />
              </div>
            </div>

            {/* Step 4: Additional Notes (Full Width) */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider">
                Additional notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Bring official badge, check-in at main desk 10m early..."
                className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md p-3 text-xs text-brand-ink font-bold placeholder:text-brand-ink/30 focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner transition-colors resize-none"
              />
            </div>
          </div>

          {/* STEP 5: ACTION BUTTONS */}
          <div className="flex gap-4 pt-4 justify-end border-t-2 border-brand-ink/10">
            <button
              type="button"
              onClick={handleResetForm}
              className="bg-[#ffffff] hover:bg-brand-cloud border-2 border-brand-ink font-black py-3 px-6 shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 flex items-center gap-2 cursor-pointer rounded-md text-xs uppercase tracking-wider"
            >
              <RotateCcw size={14} /> Reset Form
            </button>
            <button
              type="submit"
              className="bg-brand-orange hover:bg-[#E68A00] text-white font-black py-3 px-6 border-2 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 flex items-center gap-2 cursor-pointer rounded-md text-xs uppercase tracking-wider"
            >
              <Plus size={14} /> Assign Duty
            </button>
          </div>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* FILTER & SEARCH SECTION */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-adminHeading text-2xl font-black uppercase tracking-tight text-brand-ink">Assigned Duties</h2>
          <p className="text-admin-muted font-bold text-xs uppercase tracking-wider mt-1">Operational volunteer schedule overview</p>
        </div>
      </div>

      <div className="bg-white border-4 border-brand-ink p-6 rounded-md shadow-[4px_4px_0px_0px_#030404] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md py-3 pl-11 pr-4 text-sm text-brand-ink font-bold placeholder:text-brand-ink/40 shadow-inner focus:outline-none focus:border-brand-orange focus:bg-white transition-all uppercase tracking-wider"
            placeholder="Search Volunteer Name..."
          />
        </div>
        
        {/* Filter dropdowns */}
        <div className="w-full md:w-auto grid grid-cols-2 gap-3 md:flex md:items-center">
          <div className="p-2.5 border-2 border-brand-ink bg-brand-cloud text-brand-ink rounded-md hidden md:block">
            <Filter size={16} />
          </div>
          
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-auto bg-white border-2 border-brand-ink rounded-md py-2.5 px-3 text-xs text-brand-ink font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404] focus:outline-none cursor-pointer hover:bg-brand-cloud transition-colors order-1 md:order-none"
          >
            <option value="">All Dates</option>
            {DUTY_DATES.map((dt) => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full col-span-2 order-3 md:order-none md:col-auto bg-white border-2 border-brand-ink rounded-md md:py-3 md:px-4 py-2.5 px-3 text-xs text-brand-ink font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404] focus:outline-none cursor-pointer hover:bg-brand-cloud transition-colors md:w-auto"
          >
            <option value="all">All Teams</option>
            {dynamicTeams.map((teamName) => (
              <option key={teamName} value={teamName}>{teamName}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full order-2 md:order-none bg-white border-2 border-brand-ink rounded-md py-3 px-4 text-xs text-brand-ink font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#030404] focus:outline-none cursor-pointer hover:bg-brand-cloud transition-colors md:w-auto"
          >
            <option value="all">Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ASSIGNED DUTIES TABLE */}
      {/* ==================================================================== */}
      {dutiesLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <div className="bg-white border-4 border-brand-ink rounded-md shadow-[6px_6px_0px_0px_#030404] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-cloud border-b-2 border-brand-ink text-brand-ink text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 w-16 text-center border-r-2 border-brand-ink/15">S.No</th>
                  <th className="p-4 max-w-[140px] whitespace-normal">Volunteer Name</th>
                  <th className="p-4 max-w-[130px] whitespace-normal">Team</th>
                  <th className="p-4 whitespace-normal">Date</th>
                  <th className="p-4 whitespace-normal">Time Window</th>
                  <th className="p-4 max-w-[150px] whitespace-normal">Venue</th>
                  <th className="p-4 max-w-[200px] whitespace-normal">Event</th>
                  <th className="p-4 text-center whitespace-normal">Status</th>
                  <th className="p-4 text-right whitespace-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink/10">
                {filteredDuties.map((duty, idx) => (
                  <tr key={duty.id} className="hover:bg-brand-cloud/45 transition-colors text-xs font-bold text-brand-ink">
                    <td className="p-4 text-center border-r-2 border-brand-ink/15 text-admin-muted font-black">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-black max-w-[140px] whitespace-normal break-words">{duty.volunteerName}</td>
                    <td className="p-4 text-brand-ink/90 font-semibold max-w-[130px] whitespace-normal break-words">{duty.team}</td>
                    <td className="p-4 text-admin-muted font-bold whitespace-normal">
                      {formatDateFriendly(duty.dutyDate)}
                    </td>
                    <td className="p-4 text-brand-ink/90 font-bold whitespace-normal">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-brand-blue" />
                        <span>{formatTime12hr(duty.timeFrom)} - {formatTime12hr(duty.timeTo)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-brand-ink/90 max-w-[150px] whitespace-normal break-words">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-brand-orange" />
                        {duty.venue}
                      </span>
                    </td>
                    <td className="p-4 max-w-[200px] whitespace-normal">
                      {duty.eventTitle ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-blue/15 text-brand-blue border-2 border-brand-ink rounded-md text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#030404] whitespace-normal max-w-full break-words">
                          {duty.eventTitle}
                        </span>
                      ) : (
                        <span className="text-admin-muted/60 font-semibold italic text-[11px]">None</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 border-2 border-brand-ink rounded-md text-[9px] font-black uppercase tracking-wider ${
                        duty.status === 'completed'
                          ? 'bg-brand-orange/15 text-brand-orange shadow-[1px_1px_0px_0px_#030404]'
                          : duty.status === 'active'
                          ? 'bg-brand-blue/15 text-brand-blue shadow-[1px_1px_0px_0px_#030404]'
                          : 'bg-brand-orange/15 text-brand-orange shadow-[1px_1px_0px_0px_#030404]'
                      }`}>
                        {duty.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {duty.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkCompleted(duty)}
                            className="p-1.5 border-2 border-transparent hover:border-brand-ink hover:bg-green-50 text-green-700 rounded-md transition-all cursor-pointer focus:outline-none"
                            title="Mark Completed"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(duty)}
                          className="p-1.5 border-2 border-transparent hover:border-brand-ink hover:bg-brand-cloud text-brand-ink rounded-md transition-all cursor-pointer focus:outline-none"
                          title="Edit Duty"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingDuty(duty)}
                          className="p-1.5 border-2 border-transparent hover:border-brand-ink hover:bg-brand-orange/10 text-brand-orange rounded-md transition-all cursor-pointer focus:outline-none"
                          title="Remove Duty"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDuties.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-admin-muted font-black text-xs uppercase tracking-wider">
                      No duty assignments found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EDIT DUTY MODAL */}
      {/* ==================================================================== */}
      <Modal 
        isOpen={!!editingDuty} 
        onClose={() => setEditingDuty(null)} 
        title={`Edit Duty for ${editingDuty?.volunteerName}`}
      >
        {editingDuty && (
          <form onSubmit={handleSaveEdit} className="space-y-5 text-brand-ink">
            {editWarning && (
              <div className="p-3 bg-brand-orange/15 text-brand-ink text-xs font-bold border-2 border-brand-ink rounded-md flex gap-2 items-center">
                <AlertCircle className="text-brand-orange shrink-0" size={16} />
                <span className="uppercase tracking-wide">{editWarning}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Duty Date</label>
              <select
                required
                value={editDate}
                onChange={(e) => {
                  setEditDate(e.target.value);
                  setEditEventTitle('');
                }}
                className="w-full bg-white border-2 border-brand-ink rounded-md py-2 px-3 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange shadow-[1px_1px_0px_0px_#030404] transition-colors cursor-pointer"
              >
                {DUTY_DATES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Event (Optional)</label>
              <select
                value={editEventTitle}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditEventTitle(title);
                  if (title) {
                    const eventObj = eventsForEditDate.find(evt => evt.title === title);
                    if (eventObj) {
                      const times = parseEventTimes(eventObj.time);
                      setEditTimeFrom(times.from);
                      setEditTimeTo(times.to);
                      if (eventObj.location) {
                        setEditVenue(eventObj.location);
                      }
                    }
                  }
                }}
                className="w-full bg-white border-2 border-brand-ink rounded-md py-2 px-3 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange shadow-[1px_1px_0px_0px_#030404]"
              >
                <option value="">No Event / General Duty</option>
                {eventsForEditDate.length === 0 ? (
                  <option value="" disabled>No events scheduled on this date</option>
                ) : (
                  eventsForEditDate.map((evt, idx) => (
                    <option key={idx} value={evt.title}>
                      {evt.title} ({evt.time})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Time From</label>
                <input
                  type="time"
                  required
                  value={editTimeFrom}
                  onChange={(e) => setEditTimeFrom(e.target.value)}
                  className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md py-2 px-3 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Time To</label>
                <input
                  type="time"
                  required
                  value={editTimeTo}
                  onChange={(e) => setEditTimeTo(e.target.value)}
                  className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md py-2 px-3 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Venue</label>
              <SearchableVenueSelect
                required
                value={editVenue}
                onChange={setEditVenue}
                suggestedVenues={editSuggestedVenues}
                standardVenues={editStandardVenues}
                theme="white"
                hasIcon={false}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Status</label>
              <select
                required
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-white border-2 border-brand-ink rounded-md py-2 px-3 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange shadow-[1px_1px_0px_0px_#030404]"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-admin-muted tracking-wider">Additional Notes (Optional)</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full bg-brand-cloud/40 border-2 border-brand-ink rounded-md p-2.5 text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-orange focus:bg-white shadow-inner resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t-2 border-brand-ink/10">
              <button 
                type="button" 
                onClick={() => setEditingDuty(null)} 
                className="px-4 py-2 border-2 border-transparent text-admin-muted hover:text-brand-ink text-xs uppercase font-black transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-brand-orange text-white font-black px-5 py-2.5 border-2 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all text-xs uppercase tracking-wider rounded-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      <Modal 
        isOpen={!!deletingDuty} 
        onClose={() => setDeletingDuty(null)} 
        title="Delete Duty Assignment"
      >
        <div className="space-y-6 text-brand-ink">
          <div className="flex items-center gap-4 text-brand-orange bg-brand-orange/10 p-4 border-2 border-brand-ink rounded-md">
            <AlertCircle size={28} className="shrink-0" />
            <p className="text-xs font-bold uppercase leading-relaxed">
              Are you sure you want to remove the duty assignment for <strong>{deletingDuty?.volunteerName}</strong> at <strong>{deletingDuty?.venue}</strong>? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setDeletingDuty(null)} 
              className="px-4 py-2 border-2 border-transparent text-admin-muted hover:text-brand-ink text-xs uppercase font-black transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteDuty} 
              className="bg-brand-orange text-white font-black px-5 py-2.5 border-2 border-brand-ink shadow-[3px_3px_0px_0px_#030404] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all text-xs uppercase tracking-wider rounded-md"
            >
              Remove Duty
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
