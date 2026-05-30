from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.services.health_score import refresh_campaign_health

router = APIRouter(prefix="/incidents", tags=["incidents"])

CLOSED_STATUSES = {"resolved", "closed"}


@router.get("", response_model=list[IncidentRead])
def list_incidents(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    severity: str | None = Query(default=None),
    client_id: int | None = Query(default=None),
    campaign_id: int | None = Query(default=None),
) -> list[Incident]:
    q = db.query(Incident)
    if status_filter:
        q = q.filter(Incident.status == status_filter)
    if severity:
        q = q.filter(Incident.severity == severity)
    if client_id is not None:
        q = q.filter(Incident.client_id == client_id)
    if campaign_id is not None:
        q = q.filter(Incident.campaign_id == campaign_id)
    return q.order_by(Incident.opened_at.desc()).all()


@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> Incident:
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.flush()
    if incident.campaign_id:
        campaign = db.get(Campaign, incident.campaign_id)
        if campaign:
            refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: int, db: Session = Depends(get_db)) -> Incident:
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentRead)
def update_incident(
    incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)
) -> Incident:
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(incident, k, v)
    if (
        "status" in data
        and data["status"] in CLOSED_STATUSES
        and incident.closed_at is None
    ):
        incident.closed_at = datetime.utcnow()
    if incident.campaign_id:
        campaign = db.get(Campaign, incident.campaign_id)
        if campaign:
            refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(incident)
    return incident
