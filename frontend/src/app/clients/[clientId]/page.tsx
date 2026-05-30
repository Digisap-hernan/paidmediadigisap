'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import HealthBadge from '@/components/HealthBadge';
import DataTable from '@/components/DataTable';
import { getClient, listClientCampaigns } from '@/lib/api';
import type { Campaign, Client } from '@/lib/types';

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const id = Number(params.clientId);
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('ID inválido');
      return;
    }
    Promise.all([getClient(id), listClientCampaigns(id)])
      .then(([c, cs]) => {
        setClient(c);
        setCampaigns(cs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [id]);

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }
  if (!client) return <div className="p-8 text-sm text-slate-500">Cargando…</div>;

  return (
    <>
      <Header
        title={client.name}
        subtitle={`${client.industry ?? '—'} · ${client.service_type ?? '—'} · status ${client.status}`}
        actions={
          <Link
            href="/clients"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            ← Volver
          </Link>
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card label="Industria" value={client.industry ?? '—'} />
          <Card label="Tipo de servicio" value={client.service_type ?? '—'} />
          <Card label="Reporting" value={client.reporting_frequency ?? '—'} />
        </div>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campañas asociadas
          </h2>
          <DataTable
            rows={campaigns}
            emptyMessage="Este cliente aún no tiene campañas"
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
              { header: 'Plataforma', accessor: (c) => c.platform },
              { header: 'Tipo', accessor: (c) => c.campaign_type },
              { header: 'Etapa', accessor: (c) => c.stage },
              { header: 'Estado', accessor: (c) => c.status },
              {
                header: 'Health',
                accessor: (c) => <HealthBadge score={c.health_score} />,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
