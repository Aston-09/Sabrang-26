'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useWardenSession } from '../../components/warden/WardenSessionProvider';
import { Search, Loader2, Home as HomeIcon, CheckCircle2, AlertCircle, X, ShieldAlert, Phone, Mail, MapPin } from 'lucide-react';

export default function WardenDashboard() {
  const { wardenAccount } = useWardenSession();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all'); // all, assigned, unassigned
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [assigningStudent, setAssigningStudent] = useState<any | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const wardenHostel = wardenAccount?.hostel || 'BH1';
  const isBoysHostel = wardenHostel.startsWith('BH');
  const hostelDisplayName = isBoysHostel ? 'Boys Hostel' : 'Girls Hostel';

  useEffect(() => {
    // Read only checked-in registrations in real time
    const q = query(collection(db, 'registrations'), where('hasEntered', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRegs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Filter by hostel gender requirement
      // Boys Hostel wardens (BH1, BH2) manage Males. Girls Hostel wardens (GH1, GH2) manage Females.
      const filteredByGender = allRegs.filter((reg: any) => {
        const gender = (reg.gender || '').trim().toLowerCase();
        if (isBoysHostel) {
          return gender === 'male';
        } else {
          return gender === 'female';
        }
      });

      setStudents(filteredByGender);
      setLoading(false);
    }, (err) => {
      console.error("Error reading registrations for warden portal:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isBoysHostel]);



  // Handle Hostel Assignment and Room Allocation
  const handleAssignRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processingAction || !assigningStudent) return;
    setProcessingAction(true);
    setActionError('');

    try {
      const trimmedRoom = roomNumberInput.trim();
      if (!trimmedRoom) {
        setActionError('Please enter a valid room number.');
        setProcessingAction(false);
        return;
      }

      await updateDoc(doc(db, 'registrations', assigningStudent.id), {
        hostelAssignment: selectedHostel,
        roomNumber: trimmedRoom
      });

      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction(
          'WARDEN_ROOM_ALLOCATE',
          `registrations/${assigningStudent.id}`,
          `Assigned ${assigningStudent.name} to ${selectedHostel} Room ${trimmedRoom}`,
          wardenAccount.email || wardenHostel
        );
      } catch (logErr) {
        console.error("Audit log failed for room assignment:", logErr);
      }

      setIsAssignOpen(false);
      setAssigningStudent(null);
      setRoomNumberInput('');
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to assign room.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRemoveRoom = async (student: any) => {
    if (!confirm(`Are you sure you want to remove room allocation for ${student.name}?`)) return;
    try {
      await updateDoc(doc(db, 'registrations', student.id), {
        hostelAssignment: null,
        roomNumber: null
      });

      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction(
          'WARDEN_ROOM_DEALLOCATE',
          `registrations/${student.id}`,
          `Removed room assignment for ${student.name} from ${hostelDisplayName}`,
          wardenAccount.email || wardenHostel
        );
      } catch (logErr) {
        console.error("Audit log failed for room deallocation:", logErr);
      }
    } catch (err) {
      console.error("Failed to remove room assignment:", err);
      alert("Failed to remove room assignment.");
    }
  };

  // Filter logic
  const filteredStudents = students.filter((student) => {
    // Search filter (Name, App Number, mobile)
    const nameMatch = (student.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const appNum = (student.registrationNumber || student.rollNumber || '').toLowerCase();
    const idMatch = appNum.includes(searchQuery.toLowerCase()) || student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (student.phone || student.mobile || '').includes(searchQuery);
    const matchesSearch = nameMatch || idMatch || phoneMatch;

    let matchesRoom = true;
    if (roomFilter === 'assigned') {
      matchesRoom = !!(student.hostelAssignment && student.roomNumber);
    } else if (roomFilter === 'unassigned') {
      matchesRoom = !(student.hostelAssignment && student.roomNumber);
    }

    return matchesSearch && matchesRoom;
  });

  // Stats calculation
  const totalCount = students.length;
  const assignedCount = students.filter(s => s.hostelAssignment && s.roomNumber).length;
  const unassignedCount = totalCount - assignedCount;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-ink mx-auto" size={40} />
          <p className="text-admin-muted text-xs font-bold uppercase tracking-widest font-adminBody">
            Loading student records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-adminBody">
      
      {/* Title Header */}
      <div>
        <h1 className="font-adminHeading text-3xl font-black uppercase tracking-tight text-brand-ink mb-1.5">Warden Dashboard</h1>
        <p className="text-admin-muted font-bold text-xs uppercase tracking-wider">Manage {hostelDisplayName} Room Allocations</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="bg-admin-surface border-4 border-brand-ink p-6 rounded-md shadow-[4px_4px_0px_0px_#030404] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#030404] border-l-green-600">
          <div className="mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-admin-muted">Checked In at Gate ({isBoysHostel ? 'Boys' : 'Girls'})</h3>
          </div>
          <p className="font-adminHeading text-4xl font-black text-green-700 leading-none">{totalCount}</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-admin-surface border-4 border-brand-ink p-6 rounded-md shadow-[4px_4px_0px_0px_#030404] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#030404] border-l-brand-blue">
          <div className="mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-admin-muted">Room Assigned in {hostelDisplayName}</h3>
          </div>
          <p className="font-adminHeading text-4xl font-black text-brand-blue leading-none">{assignedCount}</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-admin-surface border-4 border-brand-ink p-6 rounded-md shadow-[4px_4px_0px_0px_#030404] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#030404] border-l-brand-orange">
          <div className="mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-admin-muted">Pending Room Assignment</h3>
          </div>
          <p className="font-adminHeading text-4xl font-black text-brand-orange leading-none">{unassignedCount}</p>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-admin-surface border-4 border-brand-ink p-6 rounded-md shadow-[4px_4px_0px_0px_#030404] space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={18} />
            <input
              type="text"
              placeholder="Search by student name, application number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-cloud/45 border-2 border-brand-ink rounded-md py-3 pl-11 pr-4 focus:outline-none focus:border-brand-orange text-sm font-bold placeholder:text-brand-ink/30 transition-colors shadow-inner"
            />
          </div>

          {/* Room Allocation status filter dropdown */}
          <div className="w-full md:w-64">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full bg-white text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-[11px] rounded-md py-3 px-4 shadow-[3px_3px_0px_0px_#030404] transition-all cursor-pointer outline-none"
            >
              <option value="all">All Room Assignments</option>
              <option value="assigned">Rooms Assigned ({hostelDisplayName})</option>
              <option value="unassigned">Unassigned Rooms</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Student Records Table */}
      <div className="bg-admin-surface border-4 border-brand-ink rounded-md shadow-[4px_4px_0px_0px_#030404] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-ink text-white font-adminHeading text-[10px] tracking-wider uppercase border-b-2 border-brand-ink">
                <th className="py-4 px-4 w-16 text-center border-r-2 border-brand-ink/20">S.No</th>
                <th className="py-4 px-4 font-black">Student Details</th>
                <th className="py-4 px-4 font-black">Application No.</th>
                <th className="py-4 px-4 font-black">Course</th>
                <th className="py-4 px-4 font-black">Room Assignment</th>
                <th className="py-4 px-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-brand-ink/10 text-brand-ink font-bold text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const isAssigned = !!(student.hostelAssignment && student.roomNumber);
                  
                  return (
                    <tr key={student.id} className="hover:bg-brand-cloud/20 transition-colors">
                      <td className="py-4 px-4 text-center border-r-2 border-brand-ink/10 text-admin-muted font-black">
                        {idx + 1}
                      </td>
                      {/* Name Details */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-sm uppercase">{student.name}</div>
                      </td>
                      
                      {/* Application Number */}
                      <td className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-admin-muted">
                        {student.registrationNumber || student.rollNumber || student.id}
                      </td>
                      
                      {/* Course */}
                      <td className="py-4 px-4 uppercase">{student.course || 'N/A'}</td>
                      

                      {/* Room and Hostel details */}
                      <td className="py-4 px-4">
                        {isAssigned ? (
                          <div>
                            <span className="font-extrabold text-brand-blue uppercase">{student.hostelAssignment}</span>
                            <span className="text-admin-muted font-bold block text-[10px]">Room: {student.roomNumber}</span>
                          </div>
                        ) : student.hostelAssignment ? (
                          <div>
                            <span className="font-extrabold text-slate-500 uppercase">{student.hostelAssignment}</span>
                            <span className="text-slate-400 font-bold block text-[10px]">Room: {student.roomNumber || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="text-admin-muted/65 italic">Not Allocated</span>
                        )}
                      </td>
                      
                      {/* Actions column */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {/* View details */}
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDetailOpen(true);
                            }}
                            className="bg-white hover:bg-brand-cloud text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-[9px] shadow-[4px_4px_0px_0px_#030404] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-2.5 py-1.5 transition-all cursor-pointer"
                          >
                            Details
                          </button>

                          {/* Allocate room */}
                          <button
                            onClick={() => {
                              setAssigningStudent(student);
                              setRoomNumberInput(student.roomNumber || '');
                              setSelectedHostel(student.hostelAssignment || (isBoysHostel ? 'Boys Hostel 1' : 'Girls Hostel 1'));
                              setIsAssignOpen(true);
                            }}
                            className="bg-brand-orange text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-[9px] shadow-[4px_4px_0px_0px_#030404] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-2.5 py-1.5 transition-all cursor-pointer"
                          >
                            {isAssigned ? 'Update Room' : 'Assign Room'}
                          </button>

                          {/* Deallocate Room (if allocated) */}
                          {isAssigned && (
                            <button
                              onClick={() => handleRemoveRoom(student)}
                              className="bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-700 font-adminHeading uppercase tracking-wider text-[9px] shadow-[4px_4px_0px_0px_#b91c1c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#b91c1c] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-2.5 py-1.5 transition-all cursor-pointer"
                            >
                              Deallocate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-admin-muted uppercase tracking-widest">
                    No matching student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {isDetailOpen && selectedStudent && (
        <div className="fixed inset-0 bg-[#030404]/50 backdrop-blur-sm flex justify-center items-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white border-4 border-brand-ink w-full max-w-lg rounded-md shadow-comic p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => {
                setIsDetailOpen(false);
                setSelectedStudent(null);
              }}
              className="absolute top-4 right-4 p-1 border-2 border-brand-ink rounded hover:bg-brand-cloud text-brand-ink transition-colors"
            >
              <X size={18} />
            </button>

            <div className="border-b-2 border-brand-ink/10 pb-4 mb-6">
              <h2 className="font-adminHeading text-2xl font-black uppercase text-brand-ink">{selectedStudent.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-admin-muted mt-1">
                ID: {selectedStudent.id}
              </p>
            </div>

            <div className="space-y-6">
              {/* Student details */}
              <div className="bg-brand-cloud/45 p-4 border-2 border-brand-ink rounded-md space-y-3">
                <h3 className="text-xs font-black uppercase text-brand-orange tracking-widest border-b border-brand-ink/10 pb-1.5">Student Info</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Application No.</span>
                    <span className="font-bold">{selectedStudent.registrationNumber || selectedStudent.rollNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Course / Branch</span>
                    <span className="font-bold uppercase">{selectedStudent.course || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Gender</span>
                    <span className="font-bold">{selectedStudent.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Mobile Number</span>
                    <span className="font-bold">{selectedStudent.phone || selectedStudent.mobile || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Parents details */}
              <div className="bg-brand-cloud/45 p-4 border-2 border-brand-ink rounded-md space-y-3">
                <h3 className="text-xs font-black uppercase text-brand-orange tracking-widest border-b border-brand-ink/10 pb-1.5">Parents Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Parent&apos;s Name</span>
                    <span className="font-bold">{selectedStudent.parentName || selectedStudent.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Parent&apos;s Phone</span>
                    <span className="font-bold">{selectedStudent.parentPhone || selectedStudent.fatherMobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Parent&apos;s Email</span>
                    <span className="font-bold break-all lowercase">{selectedStudent.parentEmail || selectedStudent.fatherEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Residential details */}
              <div className="bg-brand-cloud/45 p-4 border-2 border-brand-ink rounded-md space-y-3">
                <h3 className="text-xs font-black uppercase text-brand-orange tracking-widest border-b border-brand-ink/10 pb-1.5">Address Details</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Region / State</span>
                    <span className="font-bold">{selectedStudent.region || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Pincode</span>
                    <span className="font-bold">{selectedStudent.pincode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Full Address</span>
                    <p className="font-bold whitespace-pre-wrap mt-0.5 leading-relaxed">{selectedStudent.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="bg-brand-cloud/45 p-4 border-2 border-brand-ink rounded-md space-y-3">
                <h3 className="text-xs font-black uppercase text-brand-orange tracking-widest border-b border-brand-ink/10 pb-1.5">Check-in Status</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Gate Entry</span>
                    <span className="font-bold">{selectedStudent.hasEntered ? 'CHECKED IN' : 'PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Hostel Assignment</span>
                    <span className="font-bold">{selectedStudent.hostelAssignment ? `${selectedStudent.hostelAssignment} (Room: ${selectedStudent.roomNumber || 'Not Specified'})` : 'NOT ASSIGNED'}</span>
                  </div>
                  {selectedStudent.hasEntered && (
                    <>
                      <div>
                        <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Checked In At</span>
                        <span className="font-bold">{selectedStudent.enteredAt ? new Date(selectedStudent.enteredAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-admin-muted uppercase tracking-wider block">Checked In By</span>
                        <span className="font-bold">{selectedStudent.enteredBy || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedStudent(null);
                }}
                className="bg-brand-ink hover:bg-brand-ink/90 text-white font-adminHeading uppercase tracking-wider text-xs border-2 border-brand-ink shadow-comic-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-6 py-2.5 transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN ROOM MODAL */}
      {isAssignOpen && assigningStudent && (
        <div className="fixed inset-0 bg-[#030404]/50 backdrop-blur-sm flex justify-center items-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white border-4 border-brand-ink w-full max-w-md rounded-md shadow-comic p-6 relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => {
                setIsAssignOpen(false);
                setAssigningStudent(null);
                setRoomNumberInput('');
                setActionError('');
              }}
              className="absolute top-4 right-4 p-1 border-2 border-brand-ink rounded hover:bg-brand-cloud text-brand-ink transition-colors"
            >
              <X size={18} />
            </button>

             <div className="border-b-2 border-brand-ink/10 pb-4 mb-6">
              <h2 className="font-adminHeading text-xl font-black uppercase text-brand-ink">Room Assignment</h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-admin-muted mt-1">
                Assign room for {assigningStudent.name} inside {hostelDisplayName}
              </p>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold border-2 border-red-700 rounded-md flex gap-2 items-center">
                <AlertCircle className="shrink-0" size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleAssignRoom} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider mb-2">
                  Hostel Block
                </label>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="w-full bg-white border-2 border-brand-ink rounded-md py-3 px-4 text-sm text-brand-ink font-bold outline-none focus:border-brand-orange shadow-inner"
                >
                  {isBoysHostel ? (
                    <>
                      <option value="Boys Hostel 1">Boys Hostel 1</option>
                      <option value="Boys Hostel 2">Boys Hostel 2</option>
                    </>
                  ) : (
                    <>
                      <option value="Girls Hostel 1">Girls Hostel 1</option>
                      <option value="Girls Hostel 2">Girls Hostel 2</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-brand-ink/65 tracking-wider mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 102, F-4, A-22"
                  value={roomNumberInput}
                  onChange={(e) => setRoomNumberInput(e.target.value)}
                  className="w-full bg-white border-2 border-brand-ink rounded-md py-3 px-4 text-sm text-brand-ink font-bold placeholder:text-brand-ink/35 outline-none focus:border-brand-orange shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-brand-ink/10 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignOpen(false);
                    setAssigningStudent(null);
                    setRoomNumberInput('');
                    setActionError('');
                  }}
                  className="bg-white hover:bg-brand-cloud text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-xs shadow-comic-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-5 py-2.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="bg-brand-orange text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-xs shadow-comic-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#030404] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded px-5 py-2.5 transition-all cursor-pointer disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-comic-sm disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-comic-sm"
                >
                  {processingAction ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
