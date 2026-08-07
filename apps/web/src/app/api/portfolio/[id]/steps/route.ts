import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

/** multipart/form-data (fayl bilan) — xom oqim sifatida backend'ga uzatiladi. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ detail: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }
  const contentType = request.headers.get('content-type') ?? '';
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/portfolio/${params.id}/steps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
    body: request.body,
    // @ts-expect-error - Node fetch ReadableStream body uchun duplex talab qiladi
    duplex: 'half',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
