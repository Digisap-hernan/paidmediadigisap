'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import HealthBadge from '@/components/HealthBadge';
import {
  STAGES,
  STAGE_LABEL,
  PLATFORMS,
  PLATFORM_LABEL,
  CAMPAIGN_STATUS_LABEL,
} from '@/constants/stages';
import { createCampaign, listCampaigns, listClients } from '@/lib/api';
import type {
  Campaign,
  CampaignStatus,
  CampaignType,
  Client,
  Objective,
  Platform,
  Stage,
} from '@/lib/types';

const TYPES: CampaignType[] = ['META_LEADGEN', 'GADS_SEARCH_LEADGEN'];
const OBJECTIVES: Objective[] = ['lead_gen', 'ecommerce', 'awareness'];
const STATUSES: CampaignStatus[] = ['active', 'paused', 'closed'];

const EMPTY_FILTERS = { stage: '', status: '', platform: '' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<{
    stage: string;
    status: string;
    platform: string;
  }>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    workspace_id: number | '';
    name: string;
    platform: Platform;
    campaign_type: CampaignType;
    objective: Objective;
    budget_total: string;
  }>({
    workspace_id: '',
    name: '',
    platform: 'meta',
    campaign_type: 'META_LEADGEN',
    objective: 'lead_gen',
    budget_total: '',
  });

  const hasActiveFilters = Boolean(
    filters.stage || filters.status || filters.platform
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.stage) params.stage = filters.stage;
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      setCampaigns(await listCampaigns(params));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listClients().then(setClients).catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stage, filters.status, filters.platform]);

  // For the MVP we let the user pick a client; we send workspace_id derived from
  // the client's first workspace via the seeded data layout (workspace_id === client_id index).
  // To stay accurate we fetch the workspace via the client's campaigns endpoint isn't enough,
  // so we expose a simple workspace_id input prefilled from client selection.
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.workspace_id) {
      setError('Selecciona un workspace_id válido');
      return;
    }
    try {
      await createCampaign({
        workspace_id: Number(form.workspace_id),
        name: form.name,
        platform: form.platform,
        campaign_type: form.campaign_type,
        objective: form.objective,
        budget_total: form.budget_total ? Number(form.budget_total) : null,
      });
      setShowForm(false);
      setForm({ ...form, name: '', budget_total: '' });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <>
      <Header
        title="Campañas"
        subtitle="Todas las campañas activas del área"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancelar' : 'Nueva campaña'}
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Filter
            label="Etapa"
            value={filters.stage}
            options={[
              { value: '', label: 'Todas' },
              ...STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] })),
            ]}
            onChange={(v) => setFilters({ ...filters, stage: v })}
          />
          <Filter
            label="Estado"
            value={filters.status}
            options={[
              { value: '', label: 'Todos' },
              ...STATUSES.map((s) => ({
                value: s,
                label: CAMPAIGN_STATUS_LABEL[s] ?? s,
              })),
            ]}
            onChange={(v) => setFilters({ ...filters, status: v })}
          />
          <Filter
            label="Plataforma"
            value={filters.platform}
            options={[
              { value: '', label: 'Todas' },
              ...PLATFORMS.map((p) => ({
                value: p,
                label: PLATFORM_LABEL[p] ?? p,
              })),
            ]}
            onChange={(v) => setFilters({ ...filters, platform: v })}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3"
          >
            <Field label="workspace_id">
              <input
                type="number"
                value={form.workspace_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workspace_id: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="input"
                required
                placeholder="ej. 1"
              />
              <small className="text-[11px] text-slate-500">
                Sugerencia: para los clientes seed, los workspaces son 1 y 2.
                Clientes disponibles: {clients.map((c) => `${c.name} (#${c.id})`).join(', ')}.
              </small>
            </Field>
            <Field label="Nombre *">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input"
              />
            </Field>
            <Field label="Plataforma">
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })}
                className="input"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABEL[p] ?? p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de campaña">
              <select
                value={form.campaign_type}
                onChange={(e) =>
                  setForm({ ...form, campaign_type: e.target.value as CampaignType })
                }
                className="input"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Objetivo">
              <select
                value={form.objective}
                onChange={(e) =>
                  setForm({ ...form, objective: e.target.value as Objective })
                }
                className="input"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Budget total">
              <input
                type="number"
                step="0.01"
                value={form.budget_total}
                onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
                className="input"
              />
            </Field>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Crear campaña
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            No se pudieron cargar las campañas: {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Cargando campañas…
          </div>
        ) : (
          <DataTable
            rows={campaigns}
            emptyMessage={
              hasActiveFilters
                ? 'No hay campañas con esos filtros'
                : 'No hay campañas creadas'
            }
            columns={[
              {
                header: 'Nombre',
                accessor: (c) => (
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                ),
              },
              {
                header: 'Plataforma',
                accessor: (c) => PLATFORM_LABEL[c.platform] ?? c.platform,
              },
              { header: 'Tipo', accessor: (c) => c.campaign_type },
              {
                header: 'Etapa',
                accessor: (c) => STAGE_LABEL[c.stage as Stage] ?? c.stage,
              },
              {
                header: 'Estado',
                accessor: (c) => CAMPAIGN_STATUS_LABEL[c.status] ?? c.status,
              },
              { header: 'Health', accessor: (c) => <HealthBadge score={c.health_score} /> },
            ]}
          />
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mr-2 text-slate-500">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
