import type { Stage } from '@/lib/types';

export const STAGES: Stage[] = [
  'intake',
  'audit',
  'strategy',
  'build',
  'qa',
  'launch',
  'operate',
];

export const STAGE_LABEL: Record<Stage, string> = {
  intake: 'Intake',
  audit: 'Auditoría',
  strategy: 'Estrategia',
  build: 'Implementación',
  qa: 'QA',
  launch: 'Lanzamiento',
  operate: 'Operación',
};

export const PLATFORMS = ['meta', 'google_ads', 'linkedin', 'tiktok', 'mixed'] as const;

export const PLATFORM_LABEL: Record<string, string> = {
  meta: 'Meta',
  google_ads: 'Google Ads',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  mixed: 'Mixto',
};

export const INCIDENT_STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  investigating: 'En investigación',
  mitigated: 'Mitigado',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export const SEVERITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'Pendiente',
  in_progress: 'En progreso',
  done: 'Listo',
  blocked: 'Bloqueado',
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  paused: 'Pausada',
  closed: 'Cerrada',
};

export const OBJECTIVE_LABEL: Record<string, string> = {
  lead_gen: 'Lead Gen',
  ecommerce: 'E-commerce',
  awareness: 'Awareness',
  conversions: 'Conversiones',
};

export const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
  META_LEADGEN: 'Meta Lead Gen',
  GADS_SEARCH_LEADGEN: 'Google Search Lead Gen',
  GADS_PMAX: 'Google Performance Max',
  LINKEDIN_LEADGEN: 'LinkedIn Lead Gen',
  TIKTOK_AWARENESS: 'TikTok Awareness',
  MIXED_FULLFUNNEL: 'Mixto - Full Funnel',
};
