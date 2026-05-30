from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


ClientStatus = Literal["active", "paused", "archived"]


class ClientBase(BaseModel):
    name: str
    industry: str | None = None
    status: ClientStatus = "active"
    service_type: str | None = None
    reporting_frequency: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    status: ClientStatus | None = None
    service_type: str | None = None
    reporting_frequency: str | None = None


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
