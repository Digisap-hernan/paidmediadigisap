from __future__ import annotations
from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, ConfigDict


Platform = Literal["meta", "google_ads", "linkedin", "mixed"]
CampaignType = Literal["META_LEADGEN", "GADS_SEARCH_LEADGEN"]
Objective = Literal["lead_gen", "ecommerce", "awareness"]
Stage = Literal["intake", "audit", "strategy", "build", "qa", "launch", "operate"]
CampaignStatus = Literal["active", "paused", "closed"]


class CampaignBase(BaseModel):
    workspace_id: int
    name: str
    platform: Platform
    campaign_type: CampaignType
    objective: Objective = "lead_gen"
    budget_total: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner_id: int | None = None
    status: CampaignStatus = "active"


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: str | None = None
    platform: Platform | None = None
    campaign_type: CampaignType | None = None
    objective: Objective | None = None
    budget_total: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    stage: Stage | None = None
    owner_id: int | None = None
    status: CampaignStatus | None = None


class CampaignRead(CampaignBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stage: Stage
    health_score: int
    created_at: datetime
    updated_at: datetime


class StageAdvanceResponse(BaseModel):
    id: int
    stage: Stage
    previous_stage: Stage
