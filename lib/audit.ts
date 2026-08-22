import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';

export async function logAdminAction(action: string, targetEntity: string, details: string, performedByOverride?: string) {
  try {
    if (!isFirebaseConfigured() || !db || !auth) return;
    const user = auth.currentUser;
    const performedBy = performedByOverride || user?.email || user?.uid || 'System';

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
