from typing import Optional
from datetime import datetime, date
from sqlalchemy import ForeignKey, String, DateTime, Date, Numeric, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(40), nullable=False)
    campaign_type: Mapped[str] = mapped_column(String(60), nullable=False)
    objective: Mapped[str] = mapped_column(String(40), nullable=False)
    budget_total: Mapped[Optional[float ]] = mapped_column(Numeric(12, 2), nullable=True)
    start_date: Mapped[Optional[date ]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date ]] = mapped_column(Date, nullable=True)
    stage: Mapped[str] = mapped_column(String(20), default="intake", nullable=False)
    health_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    owner_id: Mapped[Optional[int ]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    workspace = relationship("Workspace", back_populates="campaigns")
    checklists = relationship(
        "Checklist", back_populates="campaign", cascade="all, delete-orphan"
    )
    incidents = relationship("Incident", back_populates="campaign")
    tasks = relationship("Task", back_populates="campaign")
    changelog_entries = relationship(
        "ChangelogEntry", back_populates="campaign", cascade="all, delete-orphan"
    )
