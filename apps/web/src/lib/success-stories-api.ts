import 'server-only';
import { API_INTERNAL_URL } from './api-config';

export interface SuccessStoryOut {
  id: number;
  step: number;
  full_name: string;
  profession: string;
  quote: string;
  photo_url: string | null;
  status: string;
  created_at: string;
}

export function getSuccessStories(): Promise<SuccessStoryOut[]> {
  return fetch(`${API_INTERNAL_URL}/v1/success-stories`, { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<SuccessStoryOut[]>) : []))
    .catch(() => []);
}
