from __future__ import annotations
from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, ConfigDict


TaskStatus = Literal["todo", "in_progress", "done", "blocked"]
TaskPriority = Literal["low", "medium", "high", "critical"]


class TaskBase(BaseModel):
    client_id: int | None = None
    campaign_id: int | None = None
    title: str
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    due_date: date | None = None
    assignee_id: int | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    assignee_id: int | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
