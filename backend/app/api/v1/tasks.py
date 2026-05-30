from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.health_score import refresh_campaign_health

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskRead])
def list_tasks(
    db: Session = Depends(get_db),
    client_id: int | None = Query(default=None),
    campaign_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[Task]:
    q = db.query(Task)
    if client_id is not None:
        q = q.filter(Task.client_id == client_id)
    if campaign_id is not None:
        q = q.filter(Task.campaign_id == campaign_id)
    if status_filter:
        q = q.filter(Task.status == status_filter)
    return q.order_by(Task.created_at.desc()).all()


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> Task:
    task = Task(**payload.model_dump())
    db.add(task)
    db.flush()
    if task.campaign_id:
        campaign = db.get(Campaign, task.campaign_id)
        if campaign:
            refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    if task.campaign_id:
        campaign = db.get(Campaign, task.campaign_id)
        if campaign:
            refresh_campaign_health(campaign, db)
    db.commit()
    db.refresh(task)
    return task
