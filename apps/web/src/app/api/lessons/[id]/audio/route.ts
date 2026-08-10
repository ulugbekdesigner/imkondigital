import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

/** Mehmon (bepul kurs) va autentifikatsiyalangan foydalanuvchi (pullik/ro'yxatdan
 * o'tgan) uchun ham ishlaydi — backend get_current_user_optional bilan qaror qiladi. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/lessons/${params.id}/audio`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
