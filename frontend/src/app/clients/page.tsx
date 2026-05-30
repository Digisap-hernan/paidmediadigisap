'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { createClient, listClients } from '@/lib/api';
import type { Client, ClientStatus } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    industry: string;
    service_type: string;
    reporting_frequency: string;
    status: ClientStatus;
  }>({
    name: '',
    industry: '',
    service_type: '',
    reporting_frequency: 'weekly',
    status: 'active',
  });
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setClients(await listClients());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createClient({
        name: form.name,
        industry: form.industry || null,
        service_type: form.service_type || null,
        reporting_frequency: form.reporting_frequency || null,
        status: form.status,
      });
      setShowForm(false);
      setForm({ ...form, name: '', industry: '', service_type: '' });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <>
      <Header
        title="Clientes"
        subtitle="Gestiona los clientes de paid media"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancelar' : 'Nuevo cliente'}
          </button>
        }
      />
      <div className="p-8 space-y-4">
        {showForm && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
          >
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Input
              label="Industria"
              value={form.industry}
              onChange={(v) => setForm({ ...form, industry: v })}
            />
            <Input
              label="Tipo de servicio"
              value={form.service_type}
              onChange={(v) => setForm({ ...form, service_type: v })}
            />
            <Input
              label="Frecuencia de reporting"
              value={form.reporting_frequency}
              onChange={(v) => setForm({ ...form, reporting_frequency: v })}
            />
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Crear cliente
              </button>
            </div>
          </form>
        )}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <DataTable
          rows={clients}
          emptyMessage="No hay clientes aún"
          columns={[
            {
              header: 'Cliente',
              accessor: (c) => (
                <Link
                  href={`/clients/${c.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {c.name}
                </Link>
              ),
            },
            { header: 'Industria', accessor: (c) => c.industry ?? '—' },
            { header: 'Servicio', accessor: (c) => c.service_type ?? '—' },
            { header: 'Reporting', accessor: (c) => c.reporting_frequency ?? '—' },
            { header: 'Estado', accessor: (c) => c.status },
          ]}
        />
      </div>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
