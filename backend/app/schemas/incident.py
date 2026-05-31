from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


Severity = Literal["low", "medium", "high", "critical"]
IncidentStatus = Literal["new", "investigating", "mitigated", "resolved", "closed"]


class IncidentBase(BaseModel):
    client_id: int
    campaign_id: int | None = None
    title: str
    description: str | None = None
    severity: Severity = "medium"
    status: IncidentStatus = "new"
    owner_id: int | None = None
    target_resolution_at: datetime | None = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: Severity | None = None
    status: IncidentStatus | None = None
    owner_id: int | None = None
    target_resolution_at: datetime | None = None
    closed_at: datetime | None = None


class IncidentRead(IncidentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    opened_at: datetime
    closed_at: datetime | None
    client_name: str | None = None
    campaign_name: str | None = None
