import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type {
  FinalAssessmentStatus,
  MentorReviewQueueItem,
  MySubmissionOut,
  SubmissionOut,
} from './types';

async function authedGet<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as T;
}

export function getFinalStatus(courseId: number): Promise<FinalAssessmentStatus | null> {
  return authedGet<FinalAssessmentStatus>(`/v1/courses/${courseId}/final-status`);
}

export function getMySubmissions(courseId: number): Promise<SubmissionOut[]> {
  return authedGet<SubmissionOut[]>(`/v1/courses/${courseId}/my-submissions`).then(
    (items) => items ?? [],
  );
}

export function getMySubmissionsAll(): Promise<MySubmissionOut[]> {
  return authedGet<MySubmissionOut[]>('/v1/me/submissions').then((items) => items ?? []);
}

export function getMentorReviewQueue(pendingOnly = true): Promise<MentorReviewQueueItem[]> {
  return authedGet<MentorReviewQueueItem[]>(
    `/v1/me/mentor/assessments?pending_only=${pendingOnly}`,
  ).then((items) => items ?? []);
}
