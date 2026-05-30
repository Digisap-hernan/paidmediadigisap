from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.workspace import Workspace
from app.schemas.campaign import (
    CampaignCreate,
    CampaignRead,
    CampaignUpdate,
    StageAdvanceResponse,
)
from app.services.qa import create_checklist_from_template
from app.services.workflow import can_advance_stage, get_next_stage
from app.services.health_score import refresh_campaign_health

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignRead])
def list_campaigns(
    db: Session = Depends(get_db),
    stage: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    platform: str | None = Query(default=None),
    client_id: int | None = Query(default=None),
) -> list[Campaign]:
    q = db.query(Campaign)
    if client_id is not None:
        q = q.join(Workspace, Workspace.id == Campaign.workspace_id).filter(
            Workspace.client_id == client_id
        )
    if stage:
        q = q.filter(Campaign.stage == stage)
    if status_filter:
        q = q.filter(Campaign.status == status_filter)
    if platform:
        q = q.filter(Campaign.platform == platform)
    campaigns = q.order_by(Campaign.created_at.desc()).all()
    for c in campaigns:
        refresh_campaign_health(c, db)
    db.commit()
    return campaigns


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)) -> Campaign:
    ws = db.get(Workspace, payload.workspace_id)
    if not ws:
        raise HTTPException(status_code=400, detail="workspace_id does not exist")
    campaign = Campaign(**payload.model_dump(), stage="intake", health_score=100)
    db.add(campaign)
    db.flush()
    # Auto-create checklists for build and qa based on campaign_type
    create_checklist_from_template(db, campaign.id, campaign.campaign_type, "build")
    create_checklist_from_template(db, campaign.id, campaign.campaign_type, "qa")
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_campaign(
    campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db)
) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(campaign, k, v)
    refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/advance-stage", response_model=StageAdvanceResponse)
def advance_stage(campaign_id: int, db: Session = Depends(get_db)) -> StageAdvanceResponse:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    ok, reason = can_advance_stage(campaign, db)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)
    next_stage = get_next_stage(campaign.stage)
    previous_stage = campaign.stage
    campaign.stage = next_stage  # type: ignore[assignment]
    refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(campaign)
    return StageAdvanceResponse(
        id=campaign.id, stage=campaign.stage, previous_stage=previous_stage  # type: ignore[arg-type]
    )
