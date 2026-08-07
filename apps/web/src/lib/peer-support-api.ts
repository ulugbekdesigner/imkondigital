import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { PeerSupportPostOut, PeerSupportRoomOut } from './types';

export async function getPeerSupportRooms(): Promise<PeerSupportRoomOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/peer-support/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as PeerSupportRoomOut[];
}

export async function getPeerSupportRoomPosts(roomId: number): Promise<PeerSupportPostOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/peer-support/rooms/${roomId}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as PeerSupportPostOut[];
}
