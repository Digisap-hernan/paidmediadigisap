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
import type {
  CriticalTask,
  DashboardKPI,
  RiskyCampaign,
  Stage,
} from '@/lib/types';
import { STAGES, STAGE_LABEL, SEVERITY_LABEL } from '@/constants/stages';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

const SEVERITY_TONE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function DashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [risky, setRisky] = useState<RiskyCampaign[]>([]);
  const [critical, setCritical] = useState<CriticalTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([getDashboardKPI(), getRiskyCampaigns(), getCriticalTasks()])
      .then(([k, r, c]) => {
        setKpi(k);
        setRisky(r);
        setCritical(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const qaValue =
    kpi?.qa_completed_pct ?? kpi?.qa_completion_pct ?? 0;

  const byStage = kpi?.by_stage ?? {};
  const stageMax = Math.max(1, ...Object.values(byStage));

  const bySeverity = kpi?.by_severity ?? {};

  return (
    <>
      <Header
        title="Dashboard operativo"
        subtitle="Visión general del estado del área de paid media"
      />
      <div className="p-8 space-y-6">
        {loading && !error && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Cargando dashboard…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            No se pudo cargar el dashboard: {error}. Verifica que el backend
            esté disponible en <code>http://localhost:8000</code>.
          </div>
        )}

        {kpi && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {typeof kpi.total_campaigns === 'number' && (
              <KpiCard
                label="Campañas totales"
                value={kpi.total_campaigns}
              />
            )}
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
              value={`${qaValue}%`}
              tone={qaValue < 70 ? 'warning' : 'success'}
            />
          </div>
        )}

        {kpi && kpi.by_stage && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Distribución por etapa
            </h2>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <ul className="space-y-3">
                {STAGES.map((stage: Stage) => {
                  const count = byStage[stage] ?? 0;
                  const widthPct = Math.round((count / stageMax) * 100);
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-sm text-slate-700">
                        {STAGE_LABEL[stage]}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {kpi && kpi.by_severity && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Incidentes por severidad
            </h2>
            <div className="flex flex-wrap gap-3">
              {SEVERITY_ORDER.map((sev) => {
                const count = bySeverity[sev] ?? 0;
                return (
                  <div
                    key={sev}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${SEVERITY_TONE[sev]}`}
                  >
                    <span className="font-medium">{SEVERITY_LABEL[sev]}</span>
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-white/70 px-1.5 text-xs font-semibold">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
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
