import type { IncidentStatus, Severity } from '@/lib/types';

const SEVERITY_TONE: Record<Severity, string> = {
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  high: 'bg-orange-100 text-orange-800 ring-orange-200',
  critical: 'bg-red-100 text-red-700 ring-red-200',
};

const STATUS_TONE: Record<IncidentStatus, string> = {
  new: 'bg-blue-100 text-blue-700 ring-blue-200',
  investigating: 'bg-amber-100 text-amber-800 ring-amber-200',
  mitigated: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  resolved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_TONE[severity]}`}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}
