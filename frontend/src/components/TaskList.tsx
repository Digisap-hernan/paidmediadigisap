'use client';

import type { Task } from '@/lib/types';

const PRIORITY_TONE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_TONE: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-700',
};

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No hay tareas asociadas.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900">{t.title}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {t.due_date && <span>Vence: {t.due_date}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  PRIORITY_TONE[t.priority] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {t.priority}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  STATUS_TONE[t.status] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {t.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
