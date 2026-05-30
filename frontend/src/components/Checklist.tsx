'use client';

import { useState } from 'react';
import type { Checklist, ItemStatus } from '@/lib/types';
import { updateChecklistItem } from '@/lib/api';

const STATUS_LABEL: Record<ItemStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  done: 'Listo',
};

const STATUS_TONE: Record<ItemStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};

export default function ChecklistView({
  checklist,
  onUpdated,
}: {
  checklist: Checklist;
  onUpdated?: () => void;
}) {
  const [items, setItems] = useState(checklist.items);
  const total = items.length;
  const doneCount = items.filter((i) => i.status === 'done').length;
  const pct = total === 0 ? 0 : Math.round((100 * doneCount) / total);

  async function changeStatus(itemId: number, status: ItemStatus) {
    const prev = items;
    setItems((curr) =>
      curr.map((it) => (it.id === itemId ? { ...it, status } : it)),
    );
    try {
      await updateChecklistItem(itemId, { status });
      onUpdated?.();
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 capitalize">
            Checklist: {checklist.type}
          </h3>
          <p className="text-xs text-slate-500">
            {doneCount} / {total} ítems · {pct}% completado
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            checklist.status === 'complete'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {checklist.status === 'complete' ? 'Completo' : 'Incompleto'}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((it) => (
          <li key={it.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-800">{it.label}</span>
                  {it.is_blocking && (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">
                      Bloqueante
                    </span>
                  )}
                </div>
                {(it.evidence_text || it.evidence_url) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {it.evidence_text && <div>{it.evidence_text}</div>}
                    {it.evidence_url && (
                      <a
                        href={it.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {it.evidence_url}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <select
                value={it.status}
                onChange={(e) => changeStatus(it.id, e.target.value as ItemStatus)}
                className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${STATUS_TONE[it.status]} focus:outline-none focus:ring-2 focus:ring-brand-500`}
              >
                {(['pending', 'in_progress', 'done'] as ItemStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
