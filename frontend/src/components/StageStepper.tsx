'use client';

import { useState } from 'react';
import { STAGES, STAGE_LABEL } from '@/constants/stages';
import type { Stage } from '@/lib/types';
import { advanceCampaignStage } from '@/lib/api';

export default function StageStepper({
  campaignId,
  currentStage,
  onAdvanced,
}: {
  campaignId: number;
  currentStage: Stage;
  onAdvanced?: (next: Stage) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentIdx = STAGES.indexOf(currentStage);
  const isLast = currentIdx === STAGES.length - 1;

  async function handleAdvance() {
    setError(null);
    setLoading(true);
    try {
      const res = await advanceCampaignStage(campaignId);
      onAdvanced?.(res.stage as Stage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                  active
                    ? 'bg-brand-600 text-white'
                    : done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    active ? 'bg-white/20' : done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                {STAGE_LABEL[s]}
              </div>
              {i < STAGES.length - 1 && (
                <span className="h-px w-6 bg-slate-200" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Etapa actual: <strong>{STAGE_LABEL[currentStage]}</strong>
        </div>
        <button
          type="button"
          onClick={handleAdvance}
          disabled={isLast || loading}
          className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLast ? 'Última etapa' : loading ? 'Avanzando…' : 'Avanzar a siguiente etapa'}
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
