import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';

export async function logAdminAction(action: string, targetEntity: string, details: string, performedByOverride?: string) {
  try {
    if (!isFirebaseConfigured() || !db || !auth) return;
    let performer = performedByOverride;
    if (!performer && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('sabrang_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          performer = parsed.email || parsed.role || 'Admin';
        }
      } catch {}
    }
    const user = auth?.currentUser;
    const performedBy = performer || user?.email || user?.uid || 'Admin';

    await addDoc(collection(db, 'auditLogs'), {
      action,
      performedBy,
      targetEntity,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
