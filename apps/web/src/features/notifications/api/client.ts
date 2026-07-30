import { api } from '@/lib/api';

export async function getUnreadNotifications() {
  const res = await api.api.notifications.unread.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }
  const json = await res.json();
  return json.data;
}

export async function markAsRead(id: number) {
  const res = await api.api.notifications[':id'].read.$post({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error('Failed to mark as read');
  }
  const json = await res.json();
  return json.data;
}
