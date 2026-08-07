import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getPeerSupportRoomPosts, getPeerSupportRooms } from '@/lib/peer-support-api';
import { PeerSupportFeed } from '@/components/peer-support-feed';
import { ArrowLeftIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: "Tengdosh ko'magi",
  robots: { index: false },
};

export default async function PeerSupportRoomPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/tengdosh-yordami/${params.id}`);

  const roomId = Number(params.id);
  const [rooms, posts] = await Promise.all([
    getPeerSupportRooms(),
    getPeerSupportRoomPosts(roomId),
  ]);
  const room = rooms.find((r) => r.id === roomId);
  if (!room) notFound();

  const isModerator = me.roles.includes('moderator') || me.roles.includes('admin');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/tengdosh-yordami"
        className="inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} />
        Barcha davralar
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-ink">{room.title}</h1>
      <p className="mt-1 font-sans text-base text-ink-soft">{room.description}</p>

      <div className="mt-4">
        <PeerSupportFeed roomId={room.id} initialPosts={posts} isModerator={isModerator} />
      </div>
    </div>
  );
}
