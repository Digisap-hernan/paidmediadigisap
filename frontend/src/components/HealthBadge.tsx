export default function HealthBadge({ score }: { score: number }) {
  let tone = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (score < 60) tone = 'bg-red-50 text-red-700 ring-red-200';
  else if (score < 80) tone = 'bg-amber-50 text-amber-700 ring-amber-200';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Health {score}
    </span>
  );
}
