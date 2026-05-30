"""Health score computation for campaigns."""
from datetime import date
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.checklist import Checklist
from app.models.incident import Incident
from app.models.task import Task

OPEN_INCIDENT_STATUSES = {"new", "investigating", "mitigated"}


def compute_campaign_health_score(campaign: Campaign, db: Session) -> int:
    score = 100

    incidents = (
        db.query(Incident)
        .filter(
            Incident.campaign_id == campaign.id,
            Incident.status.in_(list(OPEN_INCIDENT_STATUSES)),
        )
        .all()
    )
    for inc in incidents:
        if inc.severity == "critical":
            score -= 40
        elif inc.severity == "high":
            score -= 25
        elif inc.severity == "medium":
            score -= 10

    today = date.today()
    overdue = (
        db.query(Task)
        .filter(
            Task.campaign_id == campaign.id,
            Task.due_date.isnot(None),
            Task.due_date < today,
            Task.status != "done",
        )
        .count()
    )
    score -= 5 * overdue

    if campaign.stage in ("launch", "operate"):
        qa = (
            db.query(Checklist)
            .filter(Checklist.campaign_id == campaign.id, Checklist.type == "qa")
            .first()
        )
        if not qa or qa.status != "complete":
            score -= 15

    return max(0, min(100, score))


def refresh_campaign_health(campaign: Campaign, db: Session) -> int:
    campaign.health_score = compute_campaign_health_score(campaign, db)
    return campaign.health_score
