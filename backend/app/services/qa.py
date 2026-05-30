from __future__ import annotations
"""QA helpers: completion %, status calculation and template instantiation."""
from sqlalchemy.orm import Session

from app.models.checklist import Checklist, ChecklistItem
from app.services.checklist_templates import get_template


def recompute_checklist_status(checklist: Checklist) -> None:
    """Update completion_pct and status on the checklist from its items."""
    items = checklist.items
    if not items:
        checklist.completion_pct = 0
        checklist.status = "incomplete"
        return
    done_items = sum(1 for it in items if it.status == "done")
    checklist.completion_pct = int(round(100 * done_items / len(items)))
    checklist.status = "complete" if done_items == len(items) else "incomplete"


def create_checklist_from_template(
    db: Session, campaign_id: int, campaign_type: str, checklist_type: str
) -> Checklist | None:
    """Create a checklist (and its items) from a template. Returns None if no template."""
    template = get_template(campaign_type, checklist_type)
    if not template:
        return None
    checklist = Checklist(
        campaign_id=campaign_id,
        type=checklist_type,
        status="incomplete",
        completion_pct=0,
    )
    db.add(checklist)
    db.flush()
    for item in template:
        db.add(
            ChecklistItem(
                checklist_id=checklist.id,
                label=item["label"],
                is_blocking=item["is_blocking"],
                status="pending",
            )
        )
    db.flush()
    return checklist


def qa_blocking_items_done(db: Session, campaign_id: int) -> bool:
    """All blocking items of the QA checklist for campaign must be done."""
    qa = (
        db.query(Checklist)
        .filter(Checklist.campaign_id == campaign_id, Checklist.type == "qa")
        .first()
    )
    if not qa:
        return False
    blocking_pending = [
        it for it in qa.items if it.is_blocking and it.status != "done"
    ]
    return len(blocking_pending) == 0
