'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import Header from '@/components/Header';
import HealthBadge from '@/components/HealthBadge';
import StageStepper from '@/components/StageStepper';
import ChecklistView from '@/components/Checklist';
import TaskList from '@/components/TaskList';
import { SeverityBadge, StatusBadge } from '@/components/IncidentBadges';
import UTMBuilder from '@/components/UTMBuilder';
import {
  createChangelogEntry,
  getCampaign,
  listCampaignChecklists,
  listChangelog,
  listIncidents,
  listTasks,
} from '@/lib/api';
import type {
  Campaign,
  ChangelogEntry,
  Checklist,
  Incident,
  Task,
} from '@/lib/types';

type Tab = 'summary' | 'checklists' | 'tasks' | 'incidents' | 'changelog' | 'utm';

export default function CampaignDetailPage() {
  const params = useParams<{ campaignId: string }>();
  const id = Number(params.campaignId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [tab, setTab] = useState<Tab>('summary');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, ch, tk, inc, cl] = await Promise.all([
        getCampaign(id),
        listCampaignChecklists(id),
        listTasks({ campaign_id: id }),
        listIncidents({ campaign_id: id }),
        listChangelog(id),
      ]);
      setCampaign(c);
      setChecklists(ch);
      setTasks(tk);
      setIncidents(inc);
      setChangelog(cl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [id]);

  useEffect(() => {
    if (Number.isNaN(id)) notFound();
    refresh();
  }, [id, refresh]);

  if (error && !campaign) {
    return (
      <div className="p-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }
  if (!campaign) return <div className="p-8 text-sm text-slate-500">Cargando…</div>;

  return (
    <>
      <Header
        title={campaign.name}
        subtitle={`${campaign.platform} · ${campaign.campaign_type} · ${campaign.objective}`}
        actions={
          <div className="flex items-center gap-3">
            <HealthBadge score={campaign.health_score} />
            <Link
              href="/campaigns"
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              ← Volver
            </Link>
          </div>
        }
      />
      <div className="p-8 space-y-6">
        <StageStepper
          campaignId={campaign.id}
          currentStage={campaign.stage}
          onAdvanced={() => refresh()}
        />

        <div className="flex gap-1 border-b border-slate-200">
          {(
            [
              ['summary', 'Resumen'],
              ['checklists', 'Checklists / QA'],
              ['tasks', 'Tareas'],
              ['incidents', 'Incidentes'],
              ['changelog', 'Changelog'],
              ['utm', 'UTM Builder'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'summary' && <SummaryTab campaign={campaign} checklists={checklists} />}
        {tab === 'checklists' && (
          <div className="space-y-4">
            {checklists.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Esta campaña no tiene checklists.
              </div>
            ) : (
              checklists.map((c) => (
                <ChecklistView key={c.id} checklist={c} onUpdated={refresh} />
              ))
            )}
          </div>
        )}
        {tab === 'tasks' && <TaskList tasks={tasks} />}
        {tab === 'incidents' && <IncidentsTab incidents={incidents} />}
        {tab === 'changelog' && (
          <ChangelogTab
            campaignId={campaign.id}
            entries={changelog}
            onCreated={refresh}
          />
        )}
        {tab === 'utm' && <UTMBuilder defaultCampaign={campaign.name} />}
      </div>
    </>
  );
}

function SummaryTab({
  campaign,
  checklists,
}: {
  campaign: Campaign;
  checklists: Checklist[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Info label="Plataforma" value={campaign.platform} />
      <Info label="Tipo de campaña" value={campaign.campaign_type} />
      <Info label="Objetivo" value={campaign.objective} />
      <Info label="Status" value={campaign.status} />
      <Info
        label="Budget total"
        value={campaign.budget_total ? `$${campaign.budget_total}` : '—'}
      />
      <Info
        label="Vigencia"
        value={`${campaign.start_date ?? '—'} → ${campaign.end_date ?? '—'}`}
      />
      <div className="md:col-span-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Estado de checklists</h3>
          <ul className="mt-3 space-y-2">
            {checklists.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-700">{c.type}</span>
                <span className="text-slate-500">
                  {c.completion_pct}% · {c.status}
                </span>
              </li>
            ))}
            {checklists.length === 0 && (
              <li className="text-sm text-slate-500">Sin checklists</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function IncidentsTab({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Sin incidentes para esta campaña.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {incidents.map((i) => (
          <li key={i.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">{i.title}</div>
                {i.description && (
                  <div className="mt-0.5 text-xs text-slate-500">{i.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={i.severity} />
                <StatusBadge status={i.status} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangelogTab({
  campaignId,
  entries,
  onCreated,
}: {
  campaignId: number;
  entries: ChangelogEntry[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    change_type: 'budget',
    description: '',
    hypothesis: '',
    expected_impact: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createChangelogEntry(campaignId, form);
      setForm({ ...form, description: '', hypothesis: '', expected_impact: '' });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Nueva entrada de changelog</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">change_type</span>
            <input
              value={form.change_type}
              onChange={(e) => setForm({ ...form, change_type: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="budget, creative, audience, keywords…"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">description *</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">hypothesis</span>
            <input
              value={form.hypothesis}
              onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">expected_impact</span>
            <input
              value={form.expected_impact}
              onChange={(e) => setForm({ ...form, expected_impact: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </form>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Sin entradas de changelog.
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-slate-200 pl-4">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <div className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-brand-500" />
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">{e.change_type}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-700">{e.description}</p>
                {e.hypothesis && (
                  <p className="mt-1 text-xs text-slate-500">
                    <strong>Hipótesis:</strong> {e.hypothesis}
                  </p>
                )}
                {e.expected_impact && (
                  <p className="text-xs text-slate-500">
                    <strong>Impacto esperado:</strong> {e.expected_impact}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
