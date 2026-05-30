from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.changelog import ChangelogEntry
from app.schemas.changelog import ChangelogEntryCreate, ChangelogEntryRead

router = APIRouter(tags=["changelog"])


@router.get("/campaigns/{campaign_id}/changelog", response_model=list[ChangelogEntryRead])
def list_changelog(campaign_id: int, db: Session = Depends(get_db)) -> list[ChangelogEntry]:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return (
        db.query(ChangelogEntry)
        .filter(ChangelogEntry.campaign_id == campaign_id)
        .order_by(ChangelogEntry.created_at.desc())
        .all()
    )


@router.post(
    "/campaigns/{campaign_id}/changelog",
    response_model=ChangelogEntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_changelog_entry(
    campaign_id: int,
    payload: ChangelogEntryCreate,
    db: Session = Depends(get_db),
) -> ChangelogEntry:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    entry = ChangelogEntry(campaign_id=campaign_id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
