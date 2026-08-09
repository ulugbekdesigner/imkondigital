import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { SuccessStoryOut } from './success-stories-api';
import type {
  AdminAiUsageOverview,
  AdminCompanyPage,
  AdminCoursePage,
  AdminDisputePage,
  AdminInstructorDetail,
  AdminInstructorPage,
  AdminOverview,
  AdminUserPage,
  AdminUserStats,
  AuditLogPage,
  DisabilityQueueItem,
  ExternalJobsSyncStatus,
  FeatureFlagOut,
  RegistrationsDaily,
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

export function getAdminOverview(): Promise<AdminOverview | null> {
  return authedGet<AdminOverview>('/v1/analytics/admin/overview');
}

// `null` — yuklab bo'lmadi (xato), `{items: [], ...}` — haqiqatan bo'sh natija.
// Sahifa komponenti bu ikkalasini ATAYLAB farqlaydi (ErrorState vs bo'sh holat).
export function getAdminUsers(params: {
  cursor?: number;
  search?: string;
  role?: string;
  userStatus?: string;
}): Promise<AdminUserPage | null> {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set('cursor', String(params.cursor));
  if (params.search) qs.set('search', params.search);
  if (params.role) qs.set('role', params.role);
  if (params.userStatus) qs.set('user_status', params.userStatus);
  return authedGet<AdminUserPage>(`/v1/admin/users?${qs.toString()}`);
}

export function getAdminUserStats(): Promise<AdminUserStats | null> {
  return authedGet<AdminUserStats>('/v1/admin/users/stats');
}

export function getAuditLog(cursor?: number): Promise<AuditLogPage | null> {
  const qs = cursor ? `?cursor=${cursor}` : '';
  return authedGet<AuditLogPage>(`/v1/admin/audit-log${qs}`);
}

export function getAdminCourses(cursor?: number): Promise<AdminCoursePage> {
  const qs = cursor ? `?cursor=${cursor}` : '';
  return authedGet<AdminCoursePage>(`/v1/admin/courses${qs}`).then(
    (page) => page ?? { items: [], next_cursor: null },
  );
}

// Bo'sh navbat va yuklab bo'lmadi holatlarini ajratish uchun ATAYLAB `null`
// qaytariladi (kompaniyalar/foydalanuvchilar sahifa ro'yxatlaridan farqli —
// dashboard'dagi navbat vidjetlari xato holatini alohida ko'rsatadi).
export function getPendingCourses(): Promise<AdminCoursePage | null> {
  return authedGet<AdminCoursePage>('/v1/admin/courses/pending');
}

export function getOpenDisputes(): Promise<AdminDisputePage | null> {
  return authedGet<AdminDisputePage>('/v1/admin/disputes');
}

export function getModerationQueue(): Promise<DisabilityQueueItem[]> {
  return authedGet<DisabilityQueueItem[]>('/v1/moderation/disability-profiles').then(
    (items) => items ?? [],
  );
}

export function getAdminInstructors(params: {
  cursor?: number;
  search?: string;
}): Promise<AdminInstructorPage | null> {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set('cursor', String(params.cursor));
  if (params.search) qs.set('search', params.search);
  return authedGet<AdminInstructorPage>(`/v1/admin/instructors?${qs.toString()}`);
}

export function getAdminInstructorDetail(id: number): Promise<AdminInstructorDetail | null> {
  return authedGet<AdminInstructorDetail>(`/v1/admin/instructors/${id}`);
}

export function getAdminCompanies(params: {
  cursor?: number;
  verified?: boolean;
  limit?: number;
}): Promise<AdminCompanyPage | null> {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set('cursor', String(params.cursor));
  if (params.verified !== undefined) qs.set('verified', String(params.verified));
  if (params.limit) qs.set('limit', String(params.limit));
  return authedGet<AdminCompanyPage>(`/v1/admin/companies?${qs.toString()}`);
}

export function getRegistrationsDaily(): Promise<RegistrationsDaily | null> {
  return authedGet<RegistrationsDaily>('/v1/analytics/admin/registrations-daily');
}

export function getAdminAiUsage(): Promise<AdminAiUsageOverview | null> {
  return authedGet<AdminAiUsageOverview>('/v1/analytics/admin/ai-usage');
}

export function getAdminFeatureFlags(): Promise<FeatureFlagOut[] | null> {
  return authedGet<FeatureFlagOut[]>('/v1/feature-flags/admin');
}

export function getExternalJobsSyncStatus(): Promise<ExternalJobsSyncStatus | null> {
  return authedGet<ExternalJobsSyncStatus>('/v1/admin/external-jobs/status');
}

export function getAdminSuccessStories(): Promise<SuccessStoryOut[]> {
  return authedGet<SuccessStoryOut[]>('/v1/admin/success-stories').then((items) => items ?? []);
}
