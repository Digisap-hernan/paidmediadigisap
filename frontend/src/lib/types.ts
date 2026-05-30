export type Stage =
  | 'intake'
  | 'audit'
  | 'strategy'
  | 'build'
  | 'qa'
  | 'launch'
  | 'operate';

export type Platform = 'meta' | 'google_ads' | 'linkedin' | 'mixed';
export type CampaignType = 'META_LEADGEN' | 'GADS_SEARCH_LEADGEN';
export type Objective = 'lead_gen' | 'ecommerce' | 'awareness';
export type CampaignStatus = 'active' | 'paused' | 'closed';

export type ClientStatus = 'active' | 'paused' | 'archived';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus =
  | 'new'
  | 'investigating'
  | 'mitigated'
  | 'resolved'
  | 'closed';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type ChecklistType =
  | 'intake'
  | 'audit'
  | 'strategy'
  | 'build'
  | 'qa'
  | 'launch';
export type ItemStatus = 'pending' | 'in_progress' | 'done';

export interface Client {
  id: number;
  name: string;
  industry: string | null;
  status: ClientStatus;
  service_type: string | null;
  reporting_frequency: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  workspace_id: number;
  name: string;
  platform: Platform;
  campaign_type: CampaignType;
  objective: Objective;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  stage: Stage;
  health_score: number;
  owner_id: number | null;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  label: string;
  is_blocking: boolean;
  status: ItemStatus;
  evidence_text: string | null;
  evidence_url: string | null;
  updated_at: string;
}

export interface Checklist {
  id: number;
  campaign_id: number;
  type: ChecklistType;
  status: 'incomplete' | 'complete';
  completion_pct: number;
  created_at: string;
  items: ChecklistItem[];
}

export interface Incident {
  id: number;
  client_id: number;
  campaign_id: number | null;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  owner_id: number | null;
  opened_at: string;
  target_resolution_at: string | null;
  closed_at: string | null;
}

export interface Task {
  id: number;
  client_id: number | null;
  campaign_id: number | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChangelogEntry {
  id: number;
  campaign_id: number;
  change_type: string;
  description: string;
  hypothesis: string | null;
  expected_impact: string | null;
  created_by: number | null;
  created_at: string;
}

export interface DashboardKPI {
  active_campaigns: number;
  risky_campaigns: number;
  overdue_tasks: number;
  open_incidents: number;
  qa_completion_pct: number;
}

export interface RiskyCampaign {
  id: number;
  name: string;
  client_name: string;
  stage: string;
  health_score: number;
  open_incidents: number;
}

export interface CriticalTask {
  id: number;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  client_name: string | null;
  campaign_name: string | null;
}
