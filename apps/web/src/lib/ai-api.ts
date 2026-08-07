import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type {
  CareerCoachMessageOut,
  CaseStorySessionCard,
  CaseStorySessionDetail,
  GeneratedCvOut,
  InterviewSessionCard,
  InterviewSessionDetail,
  PlacementTestSessionCard,
  PlacementTestSessionDetail,
  StudyBuddyMessageOut,
} from './types';

export async function getCareerCoachHistory(): Promise<CareerCoachMessageOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/career-coach/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as CareerCoachMessageOut[];
}

export async function getMyCv(): Promise<GeneratedCvOut | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/cv`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as GeneratedCvOut;
}

export async function getInterviewSessions(): Promise<InterviewSessionCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/interview/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as InterviewSessionCard[];
}

export async function getInterviewSession(id: number): Promise<InterviewSessionDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/interview/sessions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as InterviewSessionDetail;
}

export async function getCaseStorySessions(): Promise<CaseStorySessionCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/case-story/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as CaseStorySessionCard[];
}

export async function getCaseStorySession(id: number): Promise<CaseStorySessionDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/case-story/sessions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CaseStorySessionDetail;
}

export async function getPlacementTestSessions(): Promise<PlacementTestSessionCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/placement-test/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as PlacementTestSessionCard[];
}

export async function getPlacementTestSession(
  id: number,
): Promise<PlacementTestSessionDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/placement-test/sessions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as PlacementTestSessionDetail;
}

export async function getStudyBuddyHistory(lessonId: number): Promise<StudyBuddyMessageOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/study-buddy/${lessonId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as StudyBuddyMessageOut[];
}
