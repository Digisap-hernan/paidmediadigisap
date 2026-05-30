from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ChangelogEntryBase(BaseModel):
    change_type: str
    description: str
    hypothesis: str | None = None
    expected_impact: str | None = None
    created_by: int | None = None


class ChangelogEntryCreate(ChangelogEntryBase):
    pass


class ChangelogEntryRead(ChangelogEntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    campaign_id: int
    created_at: datetime
