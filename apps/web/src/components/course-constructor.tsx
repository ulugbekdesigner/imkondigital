'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Input, buttonVariants, cn } from '@imkon/ui';
import { BookIcon, PlusIcon } from '@/components/shell-icons';
import type { CourseDetail, ModuleItem } from '@/lib/types';
import { CourseFinalAssessmentManager } from './course-final-assessment-manager';
import { SortableModule } from './sortable-module';

async function patchJson(path: string, body: object) {
  await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function CourseConstructor({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleItem[]>(course.modules);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    const res = await fetch(`/api/courses/${course.id}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newModuleTitle, sort: modules.length }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: number };
      setModules((prev) => [
        ...prev,
        {
          id: data.id,
          title: newModuleTitle,
          sort: prev.length,
          lessons: [],
          assignments: [],
          quiz: null,
        },
      ]);
      setNewModuleTitle('');
    }
  }

  async function renameModule(moduleId: number, title: string) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)));
    await patchJson(`/api/modules/${moduleId}`, { title });
  }

  async function deleteModule(moduleId: number) {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
  }

  async function addLesson(moduleId: number, title: string) {
    const module = modules.find((m) => m.id === moduleId);
    const sort = module ? module.lessons.length : 0;
    const res = await fetch(`/api/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, sort }),
    });
    if (res.ok) {
      const data = await res.json();
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: [
                  ...m.lessons,
                  {
                    id: data.id,
                    title,
                    description: '',
                    hls_url: null,
                    subtitle_url: null,
                    transcript: null,
                    duration: null,
                    status: 'draft',
                    sort,
                    materials: [],
                  },
                ],
              }
            : m,
        ),
      );
    }
  }

  async function renameLesson(moduleId: number, lessonId: number, title: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, title } : l)) }
          : m,
      ),
    );
    await patchJson(`/api/lessons/${lessonId}`, { title });
  }

  async function deleteLesson(moduleId: number, lessonId: number) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
      ),
    );
    await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
  }

  async function reorderLessons(moduleId: number, orderedLessonIds: number[]) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const byId = new Map(m.lessons.map((l) => [l.id, l]));
        return { ...m, lessons: orderedLessonIds.map((id, i) => ({ ...byId.get(id)!, sort: i })) };
      }),
    );
    await Promise.all(
      orderedLessonIds.map((id, i) => patchJson(`/api/lessons/${id}`, { sort: i })),
    );
  }

  async function handleModuleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = modules.map((m) => `module-${m.id}`);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const reordered = arrayMove(modules, oldIndex, newIndex);
    setModules(reordered);
    await Promise.all(reordered.map((m, i) => patchJson(`/api/modules/${m.id}`, { sort: i })));
  }

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/courses/${course.id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPublishError(data.detail ?? 'Chop etishda xatolik yuz berdi.');
        return;
      }
      router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {course.status !== 'published' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <a
              href={`/kurslar/${course.slug}`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'border border-line text-ink')}
            >
              Ko'rib chiqish
            </a>
            <Button disabled={publishing || modules.length === 0} onClick={publish}>
              {publishing ? 'Chop etilmoqda…' : 'Nashr qilish'}
            </Button>
          </div>
          {publishError && (
            <p role="alert" className="font-sans text-sm text-error">
              {publishError}
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Modullar</h2>

        {modules.length === 0 ? (
          <div className="imk-empty">
            <span className="imk-empty__icon" aria-hidden="true">
              <BookIcon width={22} height={22} />
            </span>
            <p className="font-sans text-base font-medium text-ink">Hali modul yo'q</p>
            <p className="max-w-sm font-sans text-sm text-ink-soft">
              Pastdagi maydondan birinchi modulni qo'shing.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleModuleDragEnd}
          >
            <SortableContext
              items={modules.map((m) => `module-${m.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-4">
                {modules.map((m) => (
                  <SortableModule
                    key={m.id}
                    module={m}
                    onRenameModule={(title) => renameModule(m.id, title)}
                    onDeleteModule={() => deleteModule(m.id)}
                    onAddLesson={(title) => addLesson(m.id, title)}
                    onRenameLesson={(lessonId, title) => renameLesson(m.id, lessonId, title)}
                    onDeleteLesson={(lessonId) => deleteLesson(m.id, lessonId)}
                    onReorderLessons={(ids) => reorderLessons(m.id, ids)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <form
          onSubmit={addModule}
          className="mt-4 flex gap-2 rounded-lg border-2 border-dashed border-line p-3"
        >
          <Input
            aria-label="Yangi modul nomi"
            placeholder="Yangi modul nomi…"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
          />
          <Button type="submit" variant="outline">
            <PlusIcon width={18} height={18} aria-hidden="true" />
            Modul qo'shish
          </Button>
        </form>
      </div>

      <CourseFinalAssessmentManager
        courseId={course.id}
        initialFinalExamBrief={course.final_exam_brief}
        initialFinalQuiz={course.final_quiz}
      />
    </div>
  );
}
