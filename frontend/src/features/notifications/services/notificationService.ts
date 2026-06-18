import {
  collection,
  doc,
  query,
  where,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AppNotification } from "@hrms/middleware";

/**
 * Live-subscribe to the current user's notifications for a tenant. Sorted
 * newest-first and capped client-side (two equality filters need no composite
 * index). Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  tenantId: string,
  cb: (notifications: AppNotification[]) => void
): () => void {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("tenantId", "==", tenantId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: AppNotification[] = [];
      snap.forEach((d) => list.push(d.data() as AppNotification));
      list.sort((a, b) => b.createdAt - a.createdAt);
      cb(list);
    },
    (err) => {
      console.error("[notifications] subscription error:", err);
      cb([]);
    }
  );
}

export async function markAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

export async function markAllAsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
  await batch.commit();
}
