import { API_INTERNAL_URL } from './api-config';
import type { CourseReviewOut } from './types';

export async function getCourseReviews(courseId: number): Promise<CourseReviewOut[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/courses/${courseId}/reviews`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as CourseReviewOut[];
}
