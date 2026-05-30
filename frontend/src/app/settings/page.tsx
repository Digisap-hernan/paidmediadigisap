import Header from '@/components/Header';
import UTMBuilder from '@/components/UTMBuilder';

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        subtitle="Herramientas y configuración del workspace"
      />
      <div className="p-8 space-y-6 max-w-4xl">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            UTM Builder
          </h2>
          <UTMBuilder />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Sobre el MVP</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Sin autenticación todavía. Próxima versión: SSO + RBAC granular.</li>
            <li>
              Integraciones reales con Meta y Google Ads están fuera del scope; el MVP
              centraliza el flujo operativo.
            </li>
            <li>
              Las plantillas de checklist viven en{' '}
              <code>backend/app/services/checklist_templates.py</code>.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
