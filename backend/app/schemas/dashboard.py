from __future__ import annotations
from pydantic import BaseModel


class DashboardKPI(BaseModel):
    active_campaigns: int
    risky_campaigns: int
    overdue_tasks: int
    open_incidents: int
    qa_completion_pct: float
    total_campaigns: int
    qa_completed_pct: float
    by_stage: dict[str, int]
    by_severity: dict[str, int]


class RiskyCampaign(BaseModel):
    id: int
    name: str
    client_name: str
    stage: str
    health_score: int
    open_incidents: int


class CriticalTask(BaseModel):
    id: int
    title: str
    priority: str
    status: str
    due_date: str | None
    client_name: str | None
    campaign_name: str | None
