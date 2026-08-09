'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, ConfirmDialog, FileInput, ProgressBar } from '@imkon/ui';
import { CloseIcon, DragIcon } from '@/components/shell-icons';
import type { LessonItem, LessonMaterialItem } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Video kutilmoqda',
  processing: 'Ishlanmoqda',
  ready: 'Video tayyor',
  failed: 'Xatolik',
};

function VideoUpload({
  lessonId,
  onUploaded,
}: {
  lessonId: number;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  function upload() {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setMessage(null);

    const form = new FormData();
    form.set('file', file);
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('loadend', () => {
      setBusy(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setMessage("Video yuklandi, ishlanmoqda — bir necha daqiqadan so'ng tayyor bo'ladi.");
        setFile(null);
        onUploaded();
      } else {
        let detail = 'Video yuklashda xatolik yuz berdi.';
        try {
          detail = JSON.parse(xhr.responseText).detail ?? detail;
        } catch {
          // javob JSON emas — standart xabar qoladi
        }
        setMessage(detail);
      }
    });
    xhr.open('POST', `/api/lessons/${lessonId}/video`);
    xhr.send(form);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <FileInput
          id={`video-${lessonId}`}
          label="Video fayl"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <Button type="button" size="sm" variant="outline" disabled={!file || busy} onClick={upload}>
          {busy ? `Yuklanmoqda · ${progress}%` : 'Video yuklash'}
        </Button>
      </div>
      {busy && (
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={progress} label={`Video yuklanmoqda · ${progress}%`} />
          <p className="font-sans text-xs text-ink-soft">
            Yuklangach subtitr avtomatik generatsiya qilinadi (Whisper)
          </p>
        </div>
      )}
      {message && (
        <p role="status" className="font-sans text-xs text-ink-soft">
          {message}
        </p>
      )}
    </div>
  );
}

function MaterialsManager({
  lessonId,
  initialMaterials,
}: {
  lessonId: number;
  initialMaterials: LessonMaterialItem[];
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('title', title);
      form.set('file', file);
      const res = await fetch(`/api/lessons/${lessonId}/materials`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Yuklashda xatolik yuz berdi.');
        return;
      }
      setMaterials((prev) => [...prev, data]);
      setTitle('');
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  async function remove(materialId: number) {
    await fetch(`/api/lesson-materials/${materialId}`, { method: 'DELETE' });
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-sans text-sm font-medium text-ink">Materiallar (slaydlar, fayllar)</p>
      {materials.length > 0 && (
        <ul className="flex flex-col gap-1">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <a
                href={m.file_url}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-primary underline-offset-4 hover:underline"
              >
                {m.title}
              </a>
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label={`${m.title} materialini o'chirish`}
                className="flex min-h-touch min-w-touch items-center justify-center rounded text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <CloseIcon width={16} height={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
        <label htmlFor={`material-title-${lessonId}`} className="sr-only">
          Material nomi
        </label>
        <input
          id={`material-title-${lessonId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Material nomi…"
          className="min-h-touch rounded border border-line bg-paper px-2 font-sans text-sm text-ink"
        />
        <FileInput
          aria-label="Material fayli"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button type="submit" size="sm" variant="outline" disabled={!file || !title.trim() || busy}>
          Qo'shish
        </Button>
      </form>
      {error && (
        <p role="alert" className="font-sans text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function SortableLessonItem({
  lesson,
  onRename,
  onDelete,
}: {
  lesson: LessonItem;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lesson-${lesson.id}`,
  });
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [descSaved, setDescSaved] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const videoStatus = videoUploaded && lesson.status === 'draft' ? 'processing' : lesson.status;
  const subtitleLabel = lesson.subtitle_url
    ? 'Subtitr'
    : videoStatus === 'processing'
      ? 'Subtitr tayyorlanmoqda'
      : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function saveDescription() {
    await fetch(`/api/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    setDescSaved(true);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 rounded border border-line bg-paper px-2 py-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Darsni surish uchun ushlab torting"
          className="flex min-h-touch min-w-touch cursor-grab items-center justify-center rounded text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <DragIcon width={16} height={16} />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== lesson.title && onRename(title)}
          aria-label="Dars nomi"
          className="min-h-touch flex-1 rounded border border-line bg-paper px-2 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <Badge variant={videoStatus === 'ready' ? 'success' : 'neutral'}>
          {STATUS_LABEL[videoStatus] ?? videoStatus}
        </Badge>
        {subtitleLabel && (
          <Badge variant={lesson.subtitle_url ? 'success' : 'neutral'}>{subtitleLabel}</Badge>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Yopish' : 'Batafsil'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-error hover:bg-error/10"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          O'chirish
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete();
        }}
        title="Darsni o'chirasizmi?"
        description={`"${lesson.title}" darsi, uning videosi va materiallari butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
        confirmLabel="O'chirish"
        destructive
      />

      {expanded && (
        <div className="ml-6 flex flex-col gap-4 border-l border-line pl-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`desc-${lesson.id}`}
              className="font-sans text-sm font-medium text-ink"
            >
              Dars tavsifi (mavzu)
            </label>
            <textarea
              id={`desc-${lesson.id}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescSaved(false);
              }}
              onBlur={() => !descSaved && saveDescription()}
              rows={2}
              placeholder="Bu darsda nima o'rgatiladi…"
              className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <VideoUpload lessonId={lesson.id} onUploaded={() => setVideoUploaded(true)} />

          <MaterialsManager lessonId={lesson.id} initialMaterials={lesson.materials} />
        </div>
      )}
    </li>
  );
}
