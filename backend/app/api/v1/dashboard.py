from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.checklist import Checklist
from app.models.client import Client
from app.models.incident import Incident
from app.models.task import Task
from app.models.workspace import Workspace
from app.schemas.dashboard import CriticalTask, DashboardKPI, RiskyCampaign
from app.services.health_score import refresh_campaign_health

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

OPEN_INCIDENT_STATUSES = ["new", "investigating", "mitigated"]
RISKY_HEALTH_THRESHOLD = 60


@router.get("/kpi", response_model=DashboardKPI)
def get_kpi(db: Session = Depends(get_db)) -> DashboardKPI:
    campaigns = db.query(Campaign).all()
    for c in campaigns:
        refresh_campaign_health(c, db)
    db.commit()

    active_campaigns = sum(1 for c in campaigns if c.status == "active")
    risky_campaigns = sum(
        1 for c in campaigns if c.health_score < RISKY_HEALTH_THRESHOLD and c.status == "active"
    )
    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.due_date.isnot(None),
            Task.due_date < date.today(),
            Task.status != "done",
        )
        .count()
    )
    open_incidents = (
        db.query(Incident).filter(Incident.status.in_(OPEN_INCIDENT_STATUSES)).count()
    )

    qa_pct_row = db.query(func.avg(Checklist.completion_pct)).filter(Checklist.type == "qa").scalar()
    qa_completion_pct = float(qa_pct_row) if qa_pct_row is not None else 0.0

    return DashboardKPI(
        active_campaigns=active_campaigns,
        risky_campaigns=risky_campaigns,
        overdue_tasks=overdue_tasks,
        open_incidents=open_incidents,
        qa_completion_pct=round(qa_completion_pct, 1),
    )


@router.get("/risky-campaigns", response_model=list[RiskyCampaign])
def get_risky_campaigns(db: Session = Depends(get_db)) -> list[RiskyCampaign]:
    campaigns = db.query(Campaign).all()
    for c in campaigns:
        refresh_campaign_health(c, db)
    db.commit()

    risky = [c for c in campaigns if c.health_score < RISKY_HEALTH_THRESHOLD]
    risky.sort(key=lambda c: c.health_score)

    out: list[RiskyCampaign] = []
    for c in risky:
        ws = db.get(Workspace, c.workspace_id)
        client = db.get(Client, ws.client_id) if ws else None
        open_inc = (
            db.query(Incident)
            .filter(
                Incident.campaign_id == c.id,
                Incident.status.in_(OPEN_INCIDENT_STATUSES),
            )
            .count()
        )
        out.append(
            RiskyCampaign(
                id=c.id,
                name=c.name,
                client_name=client.name if client else "—",
                stage=c.stage,
                health_score=c.health_score,
                open_incidents=open_inc,
            )
        )
    return out


@router.get("/critical-tasks", response_model=list[CriticalTask])
def get_critical_tasks(db: Session = Depends(get_db)) -> list[CriticalTask]:
    today = date.today()
    tasks = (
        db.query(Task)
        .filter(
            Task.status != "done",
            (
                (Task.priority.in_(["high", "critical"]))
                | ((Task.due_date.isnot(None)) & (Task.due_date < today))
            ),
        )
        .order_by(Task.due_date.asc().nulls_last())
        .limit(50)
        .all()
    )
    out: list[CriticalTask] = []
    for t in tasks:
        client = db.get(Client, t.client_id) if t.client_id else None
        campaign = db.get(Campaign, t.campaign_id) if t.campaign_id else None
        out.append(
            CriticalTask(
                id=t.id,
                title=t.title,
                priority=t.priority,
                status=t.status,
                due_date=t.due_date.isoformat() if t.due_date else None,
                client_name=client.name if client else None,
                campaign_name=campaign.name if campaign else None,
            )
        )
    return out
