from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.checklist import Checklist, ChecklistItem
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistItemRead,
    ChecklistItemUpdate,
    ChecklistRead,
)
from app.services.qa import (
    create_checklist_from_template,
    qa_blocking_items_done,
    recompute_checklist_status,
)
from app.services.health_score import refresh_campaign_health

router = APIRouter(tags=["checklists"])


@router.get("/campaigns/{campaign_id}/checklists", response_model=list[ChecklistRead])
def list_checklists(campaign_id: int, db: Session = Depends(get_db)) -> list[Checklist]:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return (
        db.query(Checklist)
        .filter(Checklist.campaign_id == campaign_id)
        .order_by(Checklist.created_at.asc())
        .all()
    )


@router.post("/campaigns/{campaign_id}/checklists", response_model=ChecklistRead, status_code=201)
def create_checklist(
    campaign_id: int, payload: ChecklistCreate, db: Session = Depends(get_db)
) -> Checklist:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    existing = (
        db.query(Checklist)
        .filter(Checklist.campaign_id == campaign_id, Checklist.type == payload.type)
        .first()
    )
    if existing:
        return existing
    checklist = create_checklist_from_template(
        db, campaign.id, campaign.campaign_type, payload.type
    )
    if not checklist:
        checklist = Checklist(
            campaign_id=campaign.id, type=payload.type, status="incomplete", completion_pct=0
        )
        db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.patch("/checklist-items/{item_id}", response_model=ChecklistItemRead)
def update_checklist_item(
    item_id: int, payload: ChecklistItemUpdate, db: Session = Depends(get_db)
) -> ChecklistItem:
    item = db.get(ChecklistItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    checklist = db.get(Checklist, item.checklist_id)
    if checklist is not None:
        db.flush()
        recompute_checklist_status(checklist)
        campaign = db.get(Campaign, checklist.campaign_id)
        if campaign:
            refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(item)
    return item


@router.post("/campaigns/{campaign_id}/qa/complete")
def complete_qa(campaign_id: int, db: Session = Depends(get_db)) -> dict:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    qa = (
        db.query(Checklist)
        .filter(Checklist.campaign_id == campaign_id, Checklist.type == "qa")
        .first()
    )
    if not qa:
        raise HTTPException(status_code=404, detail="QA checklist not found")
    if not qa_blocking_items_done(db, campaign_id):
        raise HTTPException(
            status_code=422,
            detail="Existen ítems bloqueantes pendientes en QA; complétalos antes.",
        )
    recompute_checklist_status(qa)
    qa.status = "complete"
    qa.completion_pct = 100
    refresh_campaign_health(campaign, db)
    db.commit()
    return {"id": qa.id, "status": qa.status, "completion_pct": qa.completion_pct}
