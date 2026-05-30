from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


ChecklistType = Literal["intake", "audit", "strategy", "build", "qa", "launch"]
ItemStatus = Literal["pending", "in_progress", "done"]
ChecklistStatus = Literal["incomplete", "complete"]


class ChecklistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    checklist_id: int
    label: str
    is_blocking: bool
    status: ItemStatus
    evidence_text: str | None
    evidence_url: str | None
    updated_at: datetime


class ChecklistItemUpdate(BaseModel):
    status: ItemStatus | None = None
    evidence_text: str | None = None
    evidence_url: str | None = None


class ChecklistRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    campaign_id: int
    type: ChecklistType
    status: ChecklistStatus
    completion_pct: int
    created_at: datetime
    items: list[ChecklistItemRead] = []


class ChecklistCreate(BaseModel):
    type: ChecklistType
