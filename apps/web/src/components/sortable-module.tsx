'use client';

import { useState } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, ConfirmDialog, Input } from '@imkon/ui';
import { DragIcon, PlusIcon } from '@/components/shell-icons';
import type { ModuleItem } from '@/lib/types';
import { ModuleExercisesManager } from './module-exercises-manager';
import { SortableLessonItem } from './sortable-lesson-item';

export function SortableModule({
  module,
  onRenameModule,
  onDeleteModule,
  onAddLesson,
  onRenameLesson,
  onDeleteLesson,
  onReorderLessons,
}: {
  module: ModuleItem;
  onRenameModule: (title: string) => void;
  onDeleteModule: () => void;
  onAddLesson: (title: string) => void;
  onRenameLesson: (lessonId: number, title: string) => void;
  onDeleteLesson: (lessonId: number) => void;
  onReorderLessons: (orderedLessonIds: number[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `module-${module.id}`,
  });
  const [title, setTitle] = useState(module.title);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleLessonDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = module.lessons.map((l) => `lesson-${l.id}`);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const reordered = arrayMove(module.lessons, oldIndex, newIndex);
    onReorderLessons(reordered.map((l) => l.id));
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 rounded-lg border border-line bg-mint/30 p-4"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Modulni surish uchun ushlab torting"
          className="flex min-h-touch min-w-touch cursor-grab items-center justify-center rounded text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <DragIcon width={18} height={18} />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== module.title && onRenameModule(title)}
          aria-label="Modul nomi"
          className="min-h-touch flex-1 rounded border border-line bg-paper px-2 font-display text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <Badge variant="neutral">{module.lessons.length} ta dars</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-error hover:bg-error/10"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Modulni o'chirish
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDeleteModule();
        }}
        title="Modulni o'chirasizmi?"
        description={`"${module.title}" moduli va undagi ${module.lessons.length} ta dars butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
        confirmLabel="O'chirish"
        destructive
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext
          items={module.lessons.map((l) => `lesson-${l.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2 pl-6">
            {module.lessons.map((lesson) => (
              <SortableLessonItem
                key={lesson.id}
                lesson={lesson}
                onRename={(t) => onRenameLesson(lesson.id, t)}
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLessonTitle.trim()) return;
          onAddLesson(newLessonTitle);
          setNewLessonTitle('');
        }}
        className="ml-6 flex gap-2 rounded-lg border-2 border-dashed border-line p-2"
      >
        <Input
          aria-label="Yangi dars nomi"
          placeholder="Yangi dars nomi…"
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
        />
        <Button type="submit" variant="outline" size="sm">
          <PlusIcon width={16} height={16} aria-hidden="true" />
          Dars qo'shish
        </Button>
      </form>

      <ModuleExercisesManager
        moduleId={module.id}
        initialAssignments={module.assignments}
        initialQuiz={module.quiz}
      />
    </li>
  );
}
