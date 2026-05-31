'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { SeverityBadge, StatusBadge } from '@/components/IncidentBadges';
import {
  createIncident,
  listClients,
  listIncidents,
  updateIncident,
} from '@/lib/api';
import {
  INCIDENT_STATUS_LABEL,
  SEVERITY_LABEL,
} from '@/constants/stages';
import type {
  Client,
  Incident,
  IncidentStatus,
  Severity,
} from '@/lib/types';

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: IncidentStatus[] = [
  'new',
  'investigating',
  'mitigated',
  'resolved',
  'closed',
];

type SeverityFilter = Severity | 'all';
type StatusFilter = IncidentStatus | 'all';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [form, setForm] = useState<{
    client_id: number | '';
    title: string;
    description: string;
    severity: Severity;
  }>({
    client_id: '',
    title: '',
    description: '',
    severity: 'medium',
  });

  async function refresh() {
    try {
      setLoading(true);
      setIncidents(await listIncidents());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listClients().then(setClients).catch(() => undefined);
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.client_id) {
      setError('Selecciona un cliente');
      return;
    }
    try {
      await createIncident({
        client_id: Number(form.client_id),
        title: form.title,
        description: form.description || null,
        severity: form.severity,
        status: 'new',
      });
      setShowForm(false);
      setForm({ ...form, title: '', description: '' });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function changeStatus(id: number, status: IncidentStatus) {
    await updateIncident(id, { status });
    refresh();
  }

  function clearFilters() {
    setSeverityFilter('all');
    setStatusFilter('all');
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      return true;
    });
  }, [incidents, severityFilter, statusFilter]);

  const filtersActive = severityFilter !== 'all' || statusFilter !== 'all';

  return (
    <>
      <Header
        title="Incidentes"
        subtitle="Gestión de incidentes y seguimiento"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancelar' : 'Nuevo incidente'}
          </button>
        }
      />
      <div className="p-8 space-y-4">
        {showForm && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Cliente *
              </span>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    client_id: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">— Selecciona —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Severidad</span>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Título *</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Descripción</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Crear incidente
              </button>
            </div>
          </form>
        )}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Severidad</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">Todas</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Estado</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {INCIDENT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersActive}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Cargando incidentes…
          </div>
        ) : (
          <DataTable
            rows={filteredIncidents}
            emptyMessage={
              filtersActive
                ? 'No hay incidentes que coincidan con los filtros'
                : 'No hay incidentes registrados'
            }
            columns={[
              { header: 'Título', accessor: (i) => i.title },
              {
                header: 'Severidad',
                accessor: (i) => <SeverityBadge severity={i.severity} />,
              },
              {
                header: 'Estado',
                accessor: (i) => (
                  <select
                    value={i.status}
                    onChange={(e) => changeStatus(i.id, e.target.value as IncidentStatus)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {INCIDENT_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                header: 'Cliente',
                accessor: (i) => i.client_name ?? '—',
              },
              {
                header: 'Campaña',
                accessor: (i) => i.campaign_name ?? '—',
              },
              {
                header: 'Abierto',
                accessor: (i) => new Date(i.opened_at).toLocaleString(),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
