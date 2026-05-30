from __future__ import annotations
"""Campaign stage workflow and gating logic."""
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.checklist import Checklist
from app.models.incident import Incident
from app.services.qa import qa_blocking_items_done

CAMPAIGN_STAGES = ["intake", "audit", "strategy", "build", "qa", "launch", "operate"]

OPEN_INCIDENT_STATUSES = {"new", "investigating", "mitigated"}


def get_next_stage(current_stage: str) -> str | None:
    try:
        idx = CAMPAIGN_STAGES.index(current_stage)
    except ValueError:
        return None
    if idx + 1 >= len(CAMPAIGN_STAGES):
        return None
    return CAMPAIGN_STAGES[idx + 1]


def can_advance_stage(campaign: Campaign, db: Session) -> tuple[bool, str | None]:
    """Returns (ok, reason). reason is None if ok=True."""
    if campaign.stage == "operate":
        return False, "La campaña ya está en operate; no hay etapa siguiente."

    next_stage = get_next_stage(campaign.stage)
    if next_stage is None:
        return False, "No hay etapa siguiente disponible."

    current_checklist = (
        db.query(Checklist)
        .filter(Checklist.campaign_id == campaign.id, Checklist.type == campaign.stage)
        .first()
    )
    if current_checklist and current_checklist.status != "complete":
        return (
            False,
            f"El checklist de la etapa '{campaign.stage}' debe estar completo antes de avanzar.",
        )

    if campaign.stage == "qa" and next_stage == "launch":
        if not qa_blocking_items_done(db, campaign.id):
            return (
                False,
                "Todos los ítems bloqueantes del checklist QA deben estar 'done' para avanzar a launch.",
            )

    if next_stage == "launch":
        critical_or_high = (
            db.query(Incident)
            .filter(
                Incident.campaign_id == campaign.id,
                Incident.severity.in_(["critical", "high"]),
                Incident.status.in_(list(OPEN_INCIDENT_STATUSES)),
            )
            .count()
        )
        if critical_or_high > 0:
            return (
                False,
                "Existen incidentes critical/high abiertos asociados a la campaña; resuélvelos antes de lanzar.",
            )

    return True, None
