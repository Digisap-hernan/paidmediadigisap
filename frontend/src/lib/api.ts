import type {
  Campaign,
  ChangelogEntry,
  Checklist,
  ChecklistItem,
  Client,
  CriticalTask,
  DashboardKPI,
  Incident,
  ItemStatus,
  RiskyCampaign,
  Task,
} from './types';

const BASE = '/api/v1';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const raw = await res.text();
    let detail = raw;
    try {
      const body = JSON.parse(raw);
      detail = body.detail ?? raw;
    } catch {
      // raw is not JSON; keep as-is
    }
    throw new ApiError(res.status, detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Clients
export const listClients = () => http<Client[]>('/clients');
export const getClient = (id: number) => http<Client>(`/clients/${id}`);
export const createClient = (data: Partial<Client>) =>
  http<Client>('/clients', { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (id: number, data: Partial<Client>) =>
  http<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const listClientCampaigns = (id: number) =>
  http<Campaign[]>(`/clients/${id}/campaigns`);

// Campaigns
export const listCampaigns = (params?: {
  stage?: string;
  status?: string;
  platform?: string;
  client_id?: number;
}) => {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  return http<Campaign[]>(`/campaigns${q ? `?${q}` : ''}`);
};
export const getCampaign = (id: number) => http<Campaign>(`/campaigns/${id}`);
export const createCampaign = (data: Partial<Campaign>) =>
  http<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) });
export const updateCampaign = (id: number, data: Partial<Campaign>) =>
  http<Campaign>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const advanceCampaignStage = (id: number) =>
  http<{ id: number; stage: string; previous_stage: string }>(
    `/campaigns/${id}/advance-stage`,
    { method: 'POST' },
  );

// Checklists
export const listCampaignChecklists = (id: number) =>
  http<Checklist[]>(`/campaigns/${id}/checklists`);
export const updateChecklistItem = (
  itemId: number,
  data: { status?: ItemStatus; evidence_text?: string | null; evidence_url?: string | null },
) =>
  http<ChecklistItem>(`/checklist-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
export const completeQa = (campaignId: number) =>
  http<{ id: number; status: string; completion_pct: number }>(
    `/campaigns/${campaignId}/qa/complete`,
    { method: 'POST' },
  );

// Incidents
export const listIncidents = (params?: {
  status?: string;
  severity?: string;
  client_id?: number;
  campaign_id?: number;
}) => {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  return http<Incident[]>(`/incidents${q ? `?${q}` : ''}`);
};
export const createIncident = (data: Partial<Incident>) =>
  http<Incident>('/incidents', { method: 'POST', body: JSON.stringify(data) });
export const updateIncident = (id: number, data: Partial<Incident>) =>
  http<Incident>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Tasks
export const listTasks = (params?: {
  status?: string;
  client_id?: number;
  campaign_id?: number;
}) => {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  return http<Task[]>(`/tasks${q ? `?${q}` : ''}`);
};
export const createTask = (data: Partial<Task>) =>
  http<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id: number, data: Partial<Task>) =>
  http<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Changelog
export const listChangelog = (campaignId: number) =>
  http<ChangelogEntry[]>(`/campaigns/${campaignId}/changelog`);
export const createChangelogEntry = (campaignId: number, data: Partial<ChangelogEntry>) =>
  http<ChangelogEntry>(`/campaigns/${campaignId}/changelog`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Dashboard
export const getDashboardKPI = () => http<DashboardKPI>('/dashboard/kpi');
export const getRiskyCampaigns = () => http<RiskyCampaign[]>('/dashboard/risky-campaigns');
export const getCriticalTasks = () => http<CriticalTask[]>('/dashboard/critical-tasks');
