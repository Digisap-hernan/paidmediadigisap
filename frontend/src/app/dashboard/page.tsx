'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import KpiCard from '@/components/KpiCard';
import DataTable from '@/components/DataTable';
import HealthBadge from '@/components/HealthBadge';
import {
  getCriticalTasks,
  getDashboardKPI,
  getRiskyCampaigns,
} from '@/lib/api';
import type { CriticalTask, DashboardKPI, RiskyCampaign } from '@/lib/types';

export default function DashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [risky, setRisky] = useState<RiskyCampaign[]>([]);
  const [critical, setCritical] = useState<CriticalTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboardKPI(), getRiskyCampaigns(), getCriticalTasks()])
      .then(([k, r, c]) => {
        setKpi(k);
        setRisky(r);
        setCritical(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <>
      <Header
        title="Dashboard operativo"
        subtitle="Visión general del estado del área de paid media"
      />
      <div className="p-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudo cargar el dashboard: {error}. ¿El backend está en{' '}
            <code>http://localhost:8000</code>?
          </div>
        )}
        {kpi && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <KpiCard label="Campañas activas" value={kpi.active_campaigns} />
            <KpiCard
              label="En riesgo"
              value={kpi.risky_campaigns}
              tone={kpi.risky_campaigns > 0 ? 'danger' : 'success'}
            />
            <KpiCard
              label="Tareas vencidas"
              value={kpi.overdue_tasks}
              tone={kpi.overdue_tasks > 0 ? 'warning' : 'default'}
            />
            <KpiCard
              label="Incidentes abiertos"
              value={kpi.open_incidents}
              tone={kpi.open_incidents > 0 ? 'warning' : 'success'}
            />
            <KpiCard
              label="QA promedio"
              value={`${kpi.qa_completion_pct}%`}
              tone={kpi.qa_completion_pct < 70 ? 'warning' : 'success'}
            />
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campañas en riesgo
          </h2>
          <DataTable
            rows={risky}
            emptyMessage="Sin campañas en riesgo"
            columns={[
              {
                header: 'Campaña',
                accessor: (r) => (
                  <Link
                    href={`/campaigns/${r.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {r.name}
                  </Link>
                ),
              },
              { header: 'Cliente', accessor: (r) => r.client_name },
              { header: 'Etapa', accessor: (r) => r.stage },
              {
                header: 'Health',
                accessor: (r) => <HealthBadge score={r.health_score} />,
              },
              {
                header: 'Incidentes abiertos',
                accessor: (r) => r.open_incidents,
              },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tareas críticas
          </h2>
          <DataTable
            rows={critical}
            emptyMessage="Sin tareas críticas"
            columns={[
              { header: 'Tarea', accessor: (t) => t.title },
              { header: 'Cliente', accessor: (t) => t.client_name ?? '—' },
              { header: 'Campaña', accessor: (t) => t.campaign_name ?? '—' },
              { header: 'Prioridad', accessor: (t) => t.priority },
              { header: 'Estado', accessor: (t) => t.status },
              { header: 'Vence', accessor: (t) => t.due_date ?? '—' },
            ]}
          />
        </section>
      </div>
    </>
  );
}
