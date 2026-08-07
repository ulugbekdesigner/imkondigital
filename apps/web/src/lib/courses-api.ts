import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type {
  CatalogPage,
  Category,
  CourseCard,
  CourseDetail,
  CourseGalleryItem,
  CourseProgress,
  LiveLessonOut,
  MyEnrollment,
} from './types';

export async function getCatalog(params: {
  step?: number;
  categoryId?: number;
  q?: string;
  isFree?: boolean;
  regionId?: number;
  cursor?: number;
  limit?: number;
}): Promise<CatalogPage> {
  const search = new URLSearchParams();
  if (params.step !== undefined) search.set('step', String(params.step));
  if (params.categoryId !== undefined) search.set('category_id', String(params.categoryId));
  if (params.q) search.set('q', params.q);
  if (params.isFree !== undefined) search.set('is_free', String(params.isFree));
  if (params.regionId !== undefined) search.set('region_id', String(params.regionId));
  if (params.cursor !== undefined) search.set('cursor', String(params.cursor));
  if (params.limit !== undefined) search.set('limit', String(params.limit));

  const res = await fetch(`${API_INTERNAL_URL}/v1/courses?${search.toString()}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return { items: [], next_cursor: null };
  return (await res.json()) as CatalogPage;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/categories`, {
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as Category[];
}

export async function getCourse(slug: string): Promise<CourseDetail | null> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CourseDetail;
}

export async function getCourseGallery(courseId: number): Promise<CourseGalleryItem[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/${courseId}/gallery`, {
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as CourseGalleryItem[];
}

export async function getCourseLiveLessons(courseId: number): Promise<LiveLessonOut[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/${courseId}/live-lessons`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as LiveLessonOut[];
}

/** Auth bo'lsa foydalanuvchi progressi; aks holda null. */
export async function getCourseProgress(courseId: number): Promise<CourseProgress | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/${courseId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CourseProgress;
}

/** Ustozning o'z kurslari (kurs konstruktori uchun) — holatdan qat'i nazar. */
export async function getMyCourses(): Promise<CourseCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/courses`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as CourseCard[];
}

/** O'quvchining o'zi yozilgan kurslardagi progressi (Profil → Faoliyat). */
export async function getMyEnrollments(): Promise<MyEnrollment[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/enrollments`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as MyEnrollment[];
}

/** Kurs konstruktori uchun — egasi qoralamani ham ko'ra oladi. */
export async function getOwnedCourseDetail(courseId: number): Promise<CourseDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/by-id/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CourseDetail;
}
