import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from './firebase';

function requireDb(): Firestore {
  if (!isFirebaseConfigured() || !db) throw new Error(FIREBASE_SETUP_MESSAGE);
  return db;
}

// Registrations
export const registerUser = async (userData: any) => {
  return await addDoc(collection(requireDb(), 'registrations'), {
    ...userData,
    timestamp: serverTimestamp(),
    status: 'pending'
  });
};

// Attendance/Check-in
export const checkInUser = async (userId: string, eventId: string) => {
  const attendanceRef = collection(requireDb(), 'attendance');
  return await addDoc(attendanceRef, {
    userId,
    eventId,
    timestamp: serverTimestamp(),
    status: 'checked-in'
  });
};

// Volunteer Assignments
export const getVolunteerAssignments = async (userId: string) => {
  const q = query(collection(requireDb(), 'volunteers'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Feedback
export { isFirebaseConfigured, FIREBASE_SETUP_MESSAGE };

export const submitFeedback = async (feedbackData: Record<string, unknown>) => {
  return await addDoc(collection(requireDb(), 'feedback'), {
    ...feedbackData,
    submittedAt: serverTimestamp(),
  });
};

export const submitContactMessage = async (contactData: Record<string, unknown>) => {
  return await addDoc(collection(requireDb(), 'contact_messages'), {
    ...contactData,
    submittedAt: serverTimestamp(),
  });
};

