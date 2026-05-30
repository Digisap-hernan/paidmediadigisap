'use client';

import { useMemo, useState } from 'react';

const SOURCES = ['meta', 'google', 'linkedin', 'tiktok'];
const MEDIUMS = ['paid_social', 'paid_search', 'display', 'cpc'];

function normalizeCampaign(value: string) {
  return value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export default function UTMBuilder({ defaultCampaign }: { defaultCampaign?: string }) {
  const [baseUrl, setBaseUrl] = useState('https://cliente.com/landing');
  const [source, setSource] = useState('meta');
  const [medium, setMedium] = useState('paid_social');
  const [campaign, setCampaign] = useState(
    normalizeCampaign(defaultCampaign ?? 'cliente_objetivo_pais_fecha'),
  );
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const finalUrl = useMemo(() => {
    if (!baseUrl) return '';
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      return 'URL inválida';
    }
    if (source) url.searchParams.set('utm_source', source);
    if (medium) url.searchParams.set('utm_medium', medium);
    if (campaign) url.searchParams.set('utm_campaign', campaign);
    if (content) url.searchParams.set('utm_content', content);
    if (term) url.searchParams.set('utm_term', term);
    return url.toString();
  }, [baseUrl, source, medium, campaign, content, term]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">UTM Builder</h3>
      <p className="mt-1 text-xs text-slate-500">
        Genera URLs con UTMs siguiendo el estándar Digisap. utm_campaign en minúsculas, formato{' '}
        <code>cliente_objetivo_pais_fecha</code>.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Base URL">
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input"
            placeholder="https://cliente.com/landing"
          />
        </Field>
        <Field label="utm_source">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="input">
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="utm_medium">
          <select value={medium} onChange={(e) => setMedium(e.target.value)} className="input">
            {MEDIUMS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="utm_campaign (cliente_objetivo_pais_fecha)">
          <input
            value={campaign}
            onChange={(e) => setCampaign(normalizeCampaign(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="utm_content (opcional)">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input"
            placeholder="anuncio_v1"
          />
        </Field>
        <Field label="utm_term (opcional)">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="input"
            placeholder="keyword o audiencia"
          />
        </Field>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <code className="break-all text-xs text-slate-800">{finalUrl}</code>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
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
        :global(.input:focus) {
          outline: none;
          border-color: #3b6bff;
          box-shadow: 0 0 0 2px rgba(59, 107, 255, 0.15);
        }
      `}</style>
    </div>
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
