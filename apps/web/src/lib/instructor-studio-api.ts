import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type {
  CourseStatsOut,
  InstructorDashboardOut,
  InstructorReviewItem,
  InstructorStudentItem,
  InstructorSubmissionItem,
  LiveLessonOut,
  StudentProgressItem,
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

export function getCourseStudents(courseId: number): Promise<StudentProgressItem[]> {
  return authedGet<StudentProgressItem[]>(`/v1/courses/${courseId}/students`).then(
    (items) => items ?? [],
  );
}

export function getCourseStats(courseId: number): Promise<CourseStatsOut | null> {
  return authedGet<CourseStatsOut>(`/v1/courses/${courseId}/stats`);
}

export function getInstructorDashboard(): Promise<InstructorDashboardOut | null> {
  return authedGet<InstructorDashboardOut>('/v1/instructor/dashboard');
}

export function getInstructorStudents(): Promise<InstructorStudentItem[]> {
  return authedGet<InstructorStudentItem[]>('/v1/instructor/students').then(
    (items) => items ?? [],
  );
}

export function getInstructorSubmissions(
  statusFilter?: string,
): Promise<InstructorSubmissionItem[]> {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return authedGet<InstructorSubmissionItem[]>(`/v1/instructor/submissions${query}`).then(
    (items) => items ?? [],
  );
}

export function getInstructorReviews(): Promise<InstructorReviewItem[]> {
  return authedGet<InstructorReviewItem[]>('/v1/instructor/reviews').then((items) => items ?? []);
}

export function getInstructorLiveLessons(): Promise<LiveLessonOut[]> {
  return authedGet<LiveLessonOut[]>('/v1/instructor/live-lessons').then((items) => items ?? []);
}
