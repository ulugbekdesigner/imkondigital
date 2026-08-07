import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { MentorCard, MentorshipDetail, MentorshipOut } from './types';

export async function getMentors(): Promise<MentorCard[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/mentors`, { cache: 'no-store' }).catch(
    () => null,
  );
  if (!res || !res.ok) return [];
  return (await res.json()) as MentorCard[];
}

export async function getMyMentorships(): Promise<MentorshipOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/mentorships`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as MentorshipOut[];
}

export async function getMentorshipDetail(id: number): Promise<MentorshipDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/mentorships/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as MentorshipDetail;
}
